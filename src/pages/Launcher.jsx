import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { LauncherShell } from '../components/layout/LauncherShell.jsx'
import { Badge, cx } from '../components/ui/Primitives.jsx'
import { fmtRange } from '../lib/date.js'
import { money } from '../lib/format.js'
import { WORKSPACES } from '../lib/workspaces.js'
import { useApp } from '../state/AppContext.jsx'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * The entry point. Nobody gets dropped into a dashboard they did not pick — the
 * site opens on the business you are looking at, then on its dashboards.
 */
export default function Launcher() {
  const { company, users, health, issues, impact, currency, scopeLabel, range } = useApp()
  const me = users[0]

  return (
    <LauncherShell
      title={`${greeting()}, ${me.name.split(' ')[0]}`}
      subtitle="Two businesses sit behind this login. Pick the one you want to look at."
      meta={
        <>
          <span className="flex items-center gap-2">
            <span
              className={cx(
                'tabular flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-[13px] font-semibold text-white',
                health.score >= 75 ? 'bg-brand-600' : health.score >= 55 ? 'bg-amber-500' : 'bg-red-500',
              )}
            >
              {health.score}
            </span>
            {health.label} health · {company.name}
          </span>
          <span>{scopeLabel}</span>
          <span>{fmtRange(range.from, range.to)}</span>
        </>
      }
    >
      <h2 className="section-title">Choose a business</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {WORKSPACES.map((w, i) => {
          const live = w.status === 'live'
          return (
            <Link
              key={w.key}
              to={w.to}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group card animate-fade-up flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cx(
                    'flex h-11 w-11 items-center justify-center rounded-xl transition',
                    live ? 'bg-brand-50 text-brand-600' : 'bg-ink-50 text-ink-400',
                  )}
                >
                  <w.icon size={21} strokeWidth={1.9} />
                </span>
                <Badge tone={live ? 'success' : 'neutral'} dot>
                  {live ? 'Connected' : 'Preview'}
                </Badge>
              </div>

              <h3 className="mt-4 text-[19px] font-semibold tracking-tight text-ink-900">{w.label}</h3>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-500">{w.blurb}</p>

              <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-3.5">
                <span className="text-[12px] text-ink-500">
                  {w.note}
                  {w.key === 'restaurants' && issues.length > 0 && (
                    <>
                      {' · '}
                      <span className="font-medium text-red-600">{issues.length} open issues</span>
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-brand-700">
                  {live ? 'Open' : 'See what it covers'}
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {issues.length > 0 && (
        <p className="mt-6 text-[13px] text-ink-500">
          {money(impact, { currency })} a month is recoverable in the restaurant business right now.
        </p>
      )}

      <p className="mt-8 flex items-center gap-2 text-[12px] text-ink-400">
        <Check size={13} className="text-brand-500" />
        Every figure is calculated from connected source data. No estimates.
      </p>
    </LauncherShell>
  )
}
