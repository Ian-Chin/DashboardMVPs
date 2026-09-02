import { Link } from 'react-router-dom'
import { ArrowRight, Settings as SettingsIcon } from 'lucide-react'
import { LauncherShell } from '../components/layout/LauncherShell.jsx'
import { DASHBOARD_GROUPS } from '../lib/dashboards.js'
import { fmtRange } from '../lib/date.js'
import { money } from '../lib/format.js'
import { useApp } from '../state/AppContext.jsx'

/** Second step: which restaurant dashboard. */
export default function RestaurantMenu() {
  const { company, issues, impact, currency, scopeLabel, range } = useApp()
  let index = 0

  const subtitle = issues.length
    ? `${company.name} has ${issues.length} open issue${issues.length === 1 ? '' : 's'} worth ${money(impact, {
        currency,
      })} a month. Pick where you want to start.`
    : `Every tracked metric at ${company.name} sits inside its threshold. Pick where you want to start.`

  return (
    <LauncherShell
      back={{ to: '/', label: 'All businesses' }}
      title="Restaurants"
      subtitle={subtitle}
      meta={
        <>
          <span>{scopeLabel}</span>
          <span>{fmtRange(range.from, range.to)}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            {company.posProvider} synced {company.posLastSync}
          </span>
        </>
      }
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="section-title">Choose a dashboard</h2>
        <Link
          to="/settings"
          className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition hover:text-ink-800"
        >
          <SettingsIcon size={14} />
          Settings
        </Link>
      </div>

      {DASHBOARD_GROUPS.map((group) => (
        <section key={group.label} className="mt-6">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">{group.label}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => {
              const delay = index++ * 45
              const flagged = item.to === '/dashboard' && issues.length > 0
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{ animationDelay: `${delay}ms` }}
                  className="group card animate-fade-up flex items-start gap-3.5 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
                    <item.icon size={19} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-ink-900">{item.label}</span>
                      {flagged && (
                        <span className="tabular rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {issues.length}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-500">{item.blurb}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="mt-0.5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                  />
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </LauncherShell>
  )
}
