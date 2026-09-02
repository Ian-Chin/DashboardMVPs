import { Link, NavLink } from 'react-router-dom'
import {
  Boxes,
  ChefHat,
  FileBarChart2,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { Logo } from '../brand/Logo.jsx'
import { cx } from '../ui/Primitives.jsx'

/**
 * Grouped so the eye lands on a section of four or fewer, not a flat list of
 * eight. Order follows the questions an operator asks, in order.
 */
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/profitability', label: 'Profitability', icon: TrendingUp },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/menu', label: 'Menu', icon: ChefHat },
      { to: '/inventory', label: 'Inventory', icon: Boxes },
      { to: '/labor', label: 'Labour', icon: Users },
      { to: '/purchasing', label: 'Purchasing', icon: ShoppingCart },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/reports', label: 'Reports', icon: FileBarChart2 },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

export function Sidebar({ open, onClose }) {
  const { company, issues } = useApp()

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cx(
          'no-print fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-ink-950 text-ink-200 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-5">
          <Link to="/" onClick={onClose} title="All businesses" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50">
            <Logo size={28} tone="dark" subtitle="Profitability layer" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-400 transition hover:bg-ink-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50',
                        isActive
                          ? 'bg-ink-900 text-white'
                          : 'text-ink-300 hover:bg-ink-900/60 hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={17}
                          strokeWidth={1.9}
                          className={isActive ? 'text-brand-400' : 'text-ink-400'}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.label === 'Dashboard' && issues.length > 0 && (
                          <span
                            className="tabular rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                            title={`${issues.length} open issue${issues.length === 1 ? '' : 's'}`}
                          >
                            {issues.length}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-ink-900 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Connected POS</p>
          <p className="mt-1.5 text-[13px] font-medium text-ink-100">{company.posProvider}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Synced {company.posLastSync}
          </p>
        </div>
      </aside>
    </>
  )
}
