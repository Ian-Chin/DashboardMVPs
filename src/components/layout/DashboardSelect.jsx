import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Building2, Check, ChevronDown, LayoutGrid } from 'lucide-react'
import { DASHBOARDS, DASHBOARD_GROUPS } from '../../lib/dashboards.js'
import { cx } from '../ui/Primitives.jsx'

export function DashboardSelect({ className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

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

  const active = DASHBOARDS.find((i) => i.to === pathname) || DASHBOARDS[0]

  return (
    <div className={cx('no-print relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-ghost btn-sm"
      >
        <LayoutGrid size={15} className="text-ink-400" />
        <span className="max-w-[160px] truncate">{active.label}</span>
        <ChevronDown size={14} className="text-ink-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[300px] max-w-[calc(100vw-2rem)] animate-fade-up overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop"
        >
          <div className="border-b border-ink-100 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Choose a dashboard</p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto py-1">
            {DASHBOARD_GROUPS.map((group) => (
              <div key={group.label} className="py-1">
                <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const isActive = item.to === active.to
                  return (
                    <button
                      key={item.to}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false)
                        if (!isActive) navigate(item.to)
                      }}
                      className={cx(
                        'flex w-full items-start gap-2.5 px-4 py-2 text-left transition hover:bg-ink-50',
                        isActive && 'bg-brand-50/60',
                      )}
                    >
                      <item.icon
                        size={16}
                        strokeWidth={1.9}
                        className={cx('mt-0.5 shrink-0', isActive ? 'text-brand-600' : 'text-ink-400')}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-ink-800">{item.label}</span>
                        <span className="block text-[12px] leading-snug text-ink-500">{item.blurb}</span>
                      </span>
                      {isActive && <Check size={14} className="mt-0.5 shrink-0 text-brand-600" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="border-t border-ink-100">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate('/restaurants')
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-ink-700 transition hover:bg-ink-50"
            >
              <LayoutGrid size={15} className="text-ink-400" />
              All dashboards
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate('/')
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-ink-700 transition hover:bg-ink-50"
            >
              <Building2 size={15} className="text-ink-400" />
              Switch business
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
