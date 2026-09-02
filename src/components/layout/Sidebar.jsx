import { NavLink } from 'react-router-dom'
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
import { cx } from '../ui/Primitives.jsx'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/profitability', label: 'Profitability', icon: TrendingUp },
  { to: '/menu', label: 'Menu', icon: ChefHat },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/labor', label: 'Labor', icon: Users },
  { to: '/purchasing', label: 'Purchasing', icon: ShoppingCart },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

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
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-[13px] font-bold text-white">
              C
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold text-white">Costwise</p>
              <p className="text-[11px] text-ink-400">Profitability layer</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-900 lg:hidden">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition',
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-300 hover:bg-ink-900/60 hover:text-white',
                )
              }
            >
              <item.icon size={17} strokeWidth={1.9} />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Dashboard' && issues.length > 0 && (
                <span className="rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {issues.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-900 px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-500">Connected POS</p>
          <p className="mt-1 text-[13px] font-medium text-ink-100">{company.posProvider}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Synced {company.posLastSync}
          </p>
        </div>
      </aside>
    </>
  )
}
