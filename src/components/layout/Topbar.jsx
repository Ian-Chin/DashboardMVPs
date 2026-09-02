import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Building2, CalendarDays, Check, ChevronDown, Menu, Store } from 'lucide-react'
import { useApp, DATE_PRESETS } from '../../state/AppContext.jsx'
import { fmtRange } from '../../lib/date.js'
import { initials, money } from '../../lib/format.js'
import { ALL_OUTLETS } from '../../lib/metrics.js'
import { AlertList } from '../alerts/AlertList.jsx'
import { Badge, cx } from '../ui/Primitives.jsx'
import { NAV_ITEMS } from './Sidebar.jsx'

function useOutsideClose(onClose) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return ref
}

function Dropdown({ button, children, align = 'right', width = 'w-72' }) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(() => setOpen(false))
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost btn-sm">
        {button}
      </button>
      {open && (
        <div
          className={cx(
            'absolute z-40 mt-2 animate-fade-up rounded-xl border border-ink-200 bg-white shadow-pop',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={(e) => {
            if (e.target.closest('[data-close]')) setOpen(false)
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function OutletSelector() {
  const { outlets, outletId, setOutletId, scopeLabel } = useApp()
  return (
    <Dropdown
      width="w-64"
      align="left"
      button={
        <>
          <Store size={15} className="text-ink-400" />
          <span className="max-w-[140px] truncate">{scopeLabel}</span>
          <ChevronDown size={14} className="text-ink-400" />
        </>
      }
    >
      <div className="px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Scope</p>
      </div>
      <button
        type="button"
        data-close
        onClick={() => setOutletId(ALL_OUTLETS)}
        className={cx(
          'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-ink-50',
          outletId === ALL_OUTLETS && 'bg-brand-50/60',
        )}
      >
        <Building2 size={15} className="text-ink-400" />
        <span className="flex-1 font-medium text-ink-800">All outlets</span>
        {outletId === ALL_OUTLETS && <Check size={14} className="text-brand-600" />}
      </button>
      <div className="my-1 border-t border-ink-100" />
      {outlets.map((o) => (
        <button
          key={o.id}
          type="button"
          data-close
          onClick={() => setOutletId(o.id)}
          className={cx(
            'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-ink-50',
            outletId === o.id && 'bg-brand-50/60',
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-100 text-[10px] font-semibold text-ink-600">
            {o.code}
          </span>
          <span className="flex-1">
            <span className="block font-medium text-ink-800">{o.shortName}</span>
            <span className="block text-[11px] text-ink-500">{o.city}</span>
          </span>
          {outletId === o.id && <Check size={14} className="text-brand-600" />}
        </button>
      ))}
    </Dropdown>
  )
}

function DateSelector() {
  const { range, presetKey, applyPreset, setCustomRange, minDate, today } = useApp()
  const label = DATE_PRESETS.find((p) => p.key === presetKey)?.label || 'Custom range'

  return (
    <Dropdown
      width="w-72"
      button={
        <>
          <CalendarDays size={15} className="text-ink-400" />
          <span className="hidden sm:inline">{label}</span>
          <span className="hidden text-ink-400 md:inline">· {fmtRange(range.from, range.to)}</span>
          <ChevronDown size={14} className="text-ink-400" />
        </>
      }
    >
      <div className="px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Period</p>
      </div>
      <div className="grid grid-cols-2 gap-1 px-2 pb-2">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            data-close
            onClick={() => applyPreset(p.key)}
            className={cx(
              'rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-ink-50',
              presetKey === p.key ? 'bg-brand-50 font-medium text-brand-800' : 'text-ink-700',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="border-t border-ink-100 px-3 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Custom</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={range.from}
            min={minDate}
            max={range.to}
            onChange={(e) => setCustomRange(e.target.value, range.to)}
            className="input px-2 py-1.5 text-[12px]"
          />
          <span className="text-ink-400">–</span>
          <input
            type="date"
            value={range.to}
            min={range.from}
            max={today}
            onChange={(e) => setCustomRange(range.from, e.target.value)}
            className="input px-2 py-1.5 text-[12px]"
          />
        </div>
        <p className="mt-2 text-[11px] text-ink-500">
          Comparisons always use the equivalent window immediately before this one.
        </p>
      </div>
    </Dropdown>
  )
}

function Notifications() {
  const { alerts, issues, unreadCount, markAllRead, dismissAlert, impact, currency } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(() => setOpen(false))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) markAllRead(alerts.map((a) => a.id))
        }}
        className="relative rounded-lg border border-ink-200 bg-white p-2 text-ink-600 transition hover:bg-ink-50"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[380px] max-w-[calc(100vw-2rem)] animate-fade-up overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-ink-200/70 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-ink-900">Notifications</p>
              <p className="text-[12px] text-ink-500">
                {issues.length} open · {money(impact, { currency })}/month at stake
              </p>
            </div>
            <Link to="/settings" onClick={() => setOpen(false)} className="text-[12px] font-medium text-brand-700">
              Thresholds
            </Link>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <AlertList alerts={alerts} onDismiss={dismissAlert} currency={currency} compact />
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileMenu() {
  const { users } = useApp()
  const me = users[0]
  return (
    <Dropdown
      width="w-60"
      button={
        <>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
            {initials(me.name)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[13px] font-medium leading-tight text-ink-800">{me.name}</span>
          </span>
          <ChevronDown size={14} className="text-ink-400" />
        </>
      }
    >
      <div className="border-b border-ink-100 px-4 py-3">
        <p className="text-[13px] font-semibold text-ink-900">{me.name}</p>
        <p className="text-[12px] text-ink-500">{me.email}</p>
        <Badge tone="brand" className="mt-2">
          {me.role}
        </Badge>
      </div>
      <div className="py-1">
        <Link data-close to="/settings" className="block px-4 py-2 text-[13px] text-ink-700 hover:bg-ink-50">
          Restaurant settings
        </Link>
        <Link data-close to="/settings#users" className="block px-4 py-2 text-[13px] text-ink-700 hover:bg-ink-50">
          User management
        </Link>
        <button type="button" data-close className="block w-full px-4 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
          Sign out
        </button>
      </div>
    </Dropdown>
  )
}

export function Topbar({ onMenu }) {
  const { pathname } = useLocation()
  const active = NAV_ITEMS.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))

  return (
    <header className="no-print sticky top-0 z-30 border-b border-ink-200/70 bg-ink-50/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button type="button" onClick={onMenu} className="rounded-lg border border-ink-200 bg-white p-2 text-ink-600 lg:hidden">
          <Menu size={16} />
        </button>

        <h1 className="hidden text-[15px] font-semibold text-ink-900 sm:block">{active?.label ?? 'Dashboard'}</h1>

        <div className="ml-auto flex items-center gap-2">
          <OutletSelector />
          <DateSelector />
          <Notifications />
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
