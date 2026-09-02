import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { company as baseCompany, outlets as catalogOutlets, users as baseUsers } from '../data/catalog.js'
import { DATES, TODAY } from '../data/demoData.js'
import { addDays, endOfMonth, startOfMonth, startOfWeek } from '../lib/date.js'
import { evaluateRules, DEFAULT_THRESHOLDS } from '../lib/rules.js'
import { ALL_OUTLETS } from '../lib/metrics.js'

const STORAGE_KEY = 'costwise.settings.v1'

export const DATE_PRESETS = [
  { key: 'today', label: 'Today', range: () => ({ from: TODAY, to: TODAY }) },
  { key: 'yesterday', label: 'Yesterday', range: () => ({ from: addDays(TODAY, -1), to: addDays(TODAY, -1) }) },
  { key: 'wtd', label: 'Week to date', range: () => ({ from: startOfWeek(TODAY), to: TODAY }) },
  { key: '7d', label: 'Last 7 days', range: () => ({ from: addDays(TODAY, -6), to: TODAY }) },
  { key: '30d', label: 'Last 30 days', range: () => ({ from: addDays(TODAY, -29), to: TODAY }) },
  { key: 'mtd', label: 'Month to date', range: () => ({ from: startOfMonth(TODAY), to: TODAY }) },
  {
    key: 'lastMonth',
    label: 'Last month',
    range: () => {
      const end = addDays(startOfMonth(TODAY), -1)
      return { from: startOfMonth(end), to: endOfMonth(end) }
    },
  },
  { key: '90d', label: 'Last 90 days', range: () => ({ from: addDays(TODAY, -89), to: TODAY }) },
]

const AppContext = createContext(null)

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const stored = loadStored()

  const [outletId, setOutletId] = useState(ALL_OUTLETS)
  const [presetKey, setPresetKey] = useState('7d')
  const [range, setRange] = useState(() => DATE_PRESETS.find((p) => p.key === '7d').range())
  const [thresholds, setThresholds] = useState({ ...DEFAULT_THRESHOLDS, ...(stored?.thresholds || {}) })
  const [company, setCompany] = useState({ ...baseCompany, ...(stored?.company || {}) })
  const [users, setUsers] = useState(baseUsers)
  const [outletVersion, setOutletVersion] = useState(0)
  const [dismissed, setDismissed] = useState(() => new Set(stored?.dismissed || []))
  const [readAlerts, setReadAlerts] = useState(() => new Set(stored?.readAlerts || []))

  // Outlet target overrides were saved to storage; replay them onto the catalog.
  useEffect(() => {
    const overrides = stored?.outletOverrides
    if (!overrides) return
    for (const [id, patch] of Object.entries(overrides)) {
      const target = catalogOutlets.find((o) => o.id === id)
      if (target) Object.assign(target, patch)
    }
    setOutletVersion((v) => v + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = useCallback((patch) => {
    const existing = loadStored() || {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...patch }))
  }, [])

  const applyPreset = useCallback((key) => {
    const preset = DATE_PRESETS.find((p) => p.key === key)
    if (!preset) return
    setPresetKey(key)
    setRange(preset.range())
  }, [])

  const setCustomRange = useCallback((from, to) => {
    const lo = from < DATES[0] ? DATES[0] : from
    const hi = to > TODAY ? TODAY : to
    setPresetKey('custom')
    setRange({ from: lo > hi ? hi : lo, to: hi })
  }, [])

  const updateThresholds = useCallback(
    (patch) => {
      setThresholds((prev) => {
        const next = { ...prev, ...patch }
        persist({ thresholds: next })
        return next
      })
    },
    [persist],
  )

  const updateCompany = useCallback(
    (patch) => {
      setCompany((prev) => {
        const next = { ...prev, ...patch }
        persist({ company: next })
        return next
      })
    },
    [persist],
  )

  const updateOutlet = useCallback(
    (id, patch) => {
      const target = catalogOutlets.find((o) => o.id === id)
      if (!target) return
      Object.assign(target, patch)
      const existing = loadStored() || {}
      persist({ outletOverrides: { ...(existing.outletOverrides || {}), [id]: { ...(existing.outletOverrides?.[id] || {}), ...patch } } })
      setOutletVersion((v) => v + 1)
    },
    [persist],
  )

  const updateUser = useCallback((id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const dismissAlert = useCallback(
    (id) => {
      setDismissed((prev) => {
        const next = new Set(prev)
        next.add(id)
        persist({ dismissed: [...next] })
        return next
      })
    },
    [persist],
  )

  const restoreAlerts = useCallback(() => {
    setDismissed(new Set())
    persist({ dismissed: [] })
  }, [persist])

  const markAllRead = useCallback(
    (ids) => {
      setReadAlerts((prev) => {
        const next = new Set([...prev, ...ids])
        persist({ readAlerts: [...next] })
        return next
      })
    },
    [persist],
  )

  const outlets = useMemo(() => catalogOutlets.map((o) => ({ ...o })), [outletVersion])

  const evaluation = useMemo(
    () => evaluateRules(outletId, range.from, range.to, thresholds),
    [outletId, range.from, range.to, thresholds, outletVersion],
  )

  const visibleAlerts = useMemo(
    () => evaluation.alerts.filter((a) => !dismissed.has(a.id)),
    [evaluation, dismissed],
  )

  const visibleIssues = useMemo(() => visibleAlerts.filter((a) => a.severity !== 'positive'), [visibleAlerts])
  const visibleImpact = useMemo(
    () => visibleIssues.reduce((s, a) => s + Math.max(0, a.impact || 0), 0),
    [visibleIssues],
  )

  const unreadCount = useMemo(
    () => visibleAlerts.filter((a) => !readAlerts.has(a.id) && a.severity !== 'positive').length,
    [visibleAlerts, readAlerts],
  )

  const value = {
    company,
    updateCompany,
    users,
    updateUser,
    outlets,
    outletId,
    setOutletId,
    outlet: outletId === ALL_OUTLETS ? null : outlets.find((o) => o.id === outletId),
    scopeLabel: outletId === ALL_OUTLETS ? 'All outlets' : outlets.find((o) => o.id === outletId)?.shortName || '',
    range,
    presetKey,
    applyPreset,
    setCustomRange,
    thresholds,
    updateThresholds,
    evaluation,
    alerts: visibleAlerts,
    issues: visibleIssues,
    impact: visibleImpact,
    health: evaluation.health,
    dismissAlert,
    restoreAlerts,
    dismissedCount: dismissed.size,
    readAlerts,
    markAllRead,
    unreadCount,
    currency: company.currency,
    today: TODAY,
    minDate: DATES[0],
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
