import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { LauncherShell } from '../components/layout/LauncherShell.jsx'
import { Badge } from '../components/ui/Primitives.jsx'
import { fmtRange } from '../lib/date.js'
import { money, pct } from '../lib/format.js'
import { ALL_CHANNELS, ecomPeriodWithComparison, ecomIssues } from '../lib/ecomMetrics.js'
import { store } from '../data/ecomCatalog.js'
import { ECOM_DASHBOARDS } from '../lib/workspaces.js'
import { useApp } from '../state/AppContext.jsx'

/** Second step for the e-commerce business: which dashboard. */
export default function EcommerceMenu() {
  const { range, currency } = useApp()
  const { current } = ecomPeriodWithComparison(ALL_CHANNELS, range.from, range.to)
  const verdict = ecomIssues(ALL_CHANNELS, range.from, range.to)

  return (
    <LauncherShell
      back={{ to: '/', label: 'All businesses' }}
      title="E-commerce"
      subtitle={
        verdict.issues.length
          ? `${store.name} keeps ${pct(current.contributionPct)} of net revenue as contribution, and ${money(verdict.impact, { currency })} a month is leaking.`
          : `${store.name} clears every contribution, return and ad-load threshold this period.`
      }
      meta={
        <>
          <span>All channels</span>
          <span>{fmtRange(range.from, range.to)}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            {store.platform} synced {store.lastSync}
          </span>
        </>
      }
    >
      <h2 className="section-title">Choose a dashboard</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ECOM_DASHBOARDS.map((item, i) =>
          item.to ? (
            <Link
              key={item.key}
              to={item.to}
              style={{ animationDelay: `${i * 45}ms` }}
              className="group card animate-fade-up flex items-start gap-3.5 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
                <item.icon size={19} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-ink-900">{item.label}</span>
                  {item.key === 'overview' && verdict.issues.length > 0 && (
                    <span className="tabular rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {verdict.issues.length}
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
          ) : (
            <div
              key={item.key}
              style={{ animationDelay: `${i * 45}ms` }}
              className="card animate-fade-up flex items-start gap-3.5 border-dashed bg-white/60 p-4"
              aria-disabled="true"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-300">
                <item.icon size={19} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-ink-500">{item.label}</p>
                  <Badge>Soon</Badge>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-400">{item.blurb}</p>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="card mt-6 grid grid-cols-2 gap-px overflow-hidden bg-ink-100 sm:grid-cols-4">
        {[
          { label: 'Net revenue', value: money(current.netAfterReturns, { currency }) },
          { label: 'Contribution', value: money(current.contribution, { currency }) },
          { label: 'Per order', value: money(current.contributionPerOrder, { currency, decimals: 2 }) },
          { label: 'Return rate', value: pct(current.returnRatePct) },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3">
            <p className="text-[12px] text-ink-500">{s.label}</p>
            <p className="tabular mt-0.5 text-[17px] font-semibold tracking-tight text-ink-900">{s.value}</p>
          </div>
        ))}
      </div>
    </LauncherShell>
  )
}
