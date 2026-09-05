import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  ChevronDown,
  GitCompareArrows,
  LayoutDashboard,
  Megaphone,
  Menu as MenuIcon,
  Package,
  RotateCcw,
  Store as StoreIcon,
  Truck,
  X,
} from 'lucide-react'
import { DATE_PRESETS, useApp } from '../../state/AppContext.jsx'
import { ALL_CHANNELS, COMPARE_MODES, EcomProvider, useEcom } from '../../state/EcomContext.jsx'
import { fmtRange } from '../../lib/date.js'
import { compareRangeFor } from '../../lib/ecomMetrics.js'
import { Logo, LogoMark } from '../brand/Logo.jsx'
import { cx } from '../ui/Primitives.jsx'

const ECOM_NAV = [
  { to: '/ecommerce/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/ecommerce/products', label: 'Products', icon: Package },
  { to: '/ecommerce/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/ecommerce/fulfilment', label: 'Fulfilment', icon: Truck },
  { to: '/ecommerce/returns', label: 'Returns', icon: RotateCcw },
]

function Sidebar({ open, onClose }) {
  const { store, verdict } = useEcom()

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink-900/20 lg:hidden" onClick={onClose} />}
      <aside
        className={cx(
          'no-print fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-ink-200 bg-white text-ink-600 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-5">
          <Link to="/" onClick={onClose} title="All businesses" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/15">
            <Logo size={28} subtitle="E-commerce" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-900 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-1.5 text-[12px] font-medium text-ink-400">Workspace</p>
          <div className="space-y-0.5">
            {ECOM_NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition',
                    isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={17} strokeWidth={1.9} className={isActive ? 'text-brand-600' : 'text-ink-400'} />
                    <span className="flex-1">{item.label}</span>
                    {item.to === '/ecommerce/overview' && verdict.issues.length > 0 && (
                      <span className="tabular rounded-full bg-red-500/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {verdict.issues.length}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <p className="mt-6 px-3 pb-1.5 text-[12px] font-medium text-ink-400">Elsewhere</p>
          <Link
            to="/restaurants"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
          >
            <StoreIcon size={17} strokeWidth={1.9} className="text-ink-400" />
            Restaurants
          </Link>
        </nav>

        <div className="border-t border-ink-200 px-5 py-4">
          <p className="text-[12px] font-semibold text-ink-500">Connected</p>
          <p className="mt-1.5 text-[13px] font-medium text-ink-900">{store.platform}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Synced {store.lastSync}
          </p>
        </div>
      </aside>
    </>
  )
}

/** Five scopes, always visible — a dropdown would hide the comparison the page
 *  is about. Collapses to a scrollable row on small screens. */
function ChannelTabs() {
  const { channels, channelId, setChannelId } = useEcom()
  const options = [{ id: ALL_CHANNELS, short: 'All channels' }, ...channels]

  return (
    <div className="no-print -mx-1 flex items-center gap-1 overflow-x-auto px-1">
      {options.map((o) => {
        const active = o.id === channelId
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setChannelId(o.id)}
            aria-pressed={active}
            className={cx(
              'whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition',
              active
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
            )}
          >
            {o.short}
          </button>
        )
      })}
    </div>
  )
}

function PeriodMenu() {
  const { range, presetKey, applyPreset, setCustomRange, minDate, today } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const label = DATE_PRESETS.find((p) => p.key === presetKey)?.label || 'Custom range'

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost btn-sm">
        <CalendarDays size={15} className="text-ink-400" />
        <span className="hidden sm:inline">{label}</span>
        <span className="hidden text-ink-400 md:inline">· {fmtRange(range.from, range.to)}</span>
        <ChevronDown size={14} className="text-ink-400" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 animate-fade-up rounded-xl border border-ink-200 bg-white shadow-pop">
          <div className="grid grid-cols-2 gap-1 p-2">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  applyPreset(p.key)
                  setOpen(false)
                }}
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
            <p className="mb-2 text-[12px] font-semibold text-ink-500">Custom</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={range.from}
                min={minDate}
                max={range.to}
                onChange={(e) => setCustomRange(e.target.value, range.to)}
                className="input px-2 py-1.5 text-[12px]"
              />
              <span className="text-[13px] text-ink-500">to</span>
              <input
                type="date"
                value={range.to}
                min={range.from}
                max={today}
                onChange={(e) => setCustomRange(range.from, e.target.value)}
                className="input px-2 py-1.5 text-[12px]"
              />
            </div>
            <p className="mt-2 text-[12px] text-ink-500">
              What this period is measured against is set separately, in the compare control.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/** "Last 7 days" and "against what" are two separate questions, so they get two
 *  separate controls. Hard-coding the comparison is the thing that makes a
 *  dashboard unable to answer whether a dip is a trend or a calendar artefact. */
function CompareMenu() {
  const { range } = useApp()
  const { compareMode, setCompareMode } = useEcom()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const active = COMPARE_MODES.find((c) => c.key === compareMode) || COMPARE_MODES[0]

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-ghost btn-sm"
      >
        <GitCompareArrows size={15} className="text-ink-400" />
        <span className="hidden text-ink-500 sm:inline">vs</span>
        <span className="whitespace-nowrap">{active.label}</span>
        <ChevronDown size={14} className="text-ink-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[264px] animate-fade-up overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop"
        >
          <p className="border-b border-ink-100 px-4 py-2.5 text-[12px] font-semibold text-ink-500">Compare against</p>
          {COMPARE_MODES.map((m) => {
            const r = compareRangeFor(m.key, range.from, range.to)
            const isActive = m.key === compareMode
            return (
              <button
                key={m.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setCompareMode(m.key)
                  setOpen(false)
                }}
                className={cx(
                  'flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition hover:bg-ink-50',
                  isActive && 'bg-brand-50/60',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink-800">{m.label}</span>
                  <span className="block text-[12px] text-ink-500">{fmtRange(r.from, r.to)}</span>
                </span>
                {isActive && <Check size={14} className="mt-0.5 shrink-0 text-brand-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Topbar({ onMenu }) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-ink-200/70 bg-ink-50/85 backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="rounded-lg border border-ink-200 bg-white p-2 text-ink-600 transition hover:bg-ink-50 lg:hidden"
        >
          <MenuIcon size={16} />
        </button>
        <LogoMark size={24} className="lg:hidden" />
        <div className="min-w-0 flex-1">
          <ChannelTabs />
        </div>
        <CompareMenu />
        <PeriodMenu />
      </div>
    </header>
  )
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    // Everything inside this node resolves the e-commerce token set. See the
    // two :root blocks in src/index.css.
    <div data-theme="ecom" className="min-h-full bg-ink-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[248px]">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main key={pathname} className="animate-fade-up px-4 py-5 sm:px-6 sm:py-6 print-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function EcomLayout() {
  return (
    <EcomProvider>
      <Shell />
    </EcomProvider>
  )
}
