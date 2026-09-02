import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { AlertList } from '../components/alerts/AlertList.jsx'
import { BarChart, Legend, RankedBars } from '../components/charts/Charts.jsx'
import { DashboardSelect } from '../components/layout/DashboardSelect.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { KpiCard, KpiStrip } from '../components/ui/KpiCard.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { Badge, Card, CardHeader, Delta, ProgressBar, SectionTitle } from '../components/ui/Primitives.jsx'
import { useMenu, useOutlets, usePeriod } from '../hooks/useMetrics.js'
import { fmtDate } from '../lib/date.js'
import { money, moneyShort, num, pct } from '../lib/format.js'
import { bucketDaily } from '../lib/metrics.js'
import { COLORS } from '../lib/palette.js'
import { useApp } from '../state/AppContext.jsx'

/**
 * The one thing the page has to say, said first: is anything bleeding money,
 * how much, and where to go next. Everything below this is a drill-down.
 */
function Verdict() {
  const { health, issues, impact, currency } = useApp()

  const biggest = issues.reduce((best, a) => ((a.impact || 0) > (best?.impact || 0) ? a : best), null)

  const r = 34
  const circumference = 2 * Math.PI * r
  const dash = (health.score / 100) * circumference
  const ringTone = {
    success: 'text-brand-500',
    brand: 'text-brand-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  }[health.tone]

  return (
    <section className="card">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="relative h-[92px] w-[92px] shrink-0">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
            <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" className="text-ink-100" strokeWidth="9" />
            <circle
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke="currentColor"
              className={ringTone}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-[26px] font-semibold leading-none tracking-tight text-ink-900">
              {health.score}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">{health.label}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {issues.length ? (
            <>
              <h2 className="text-[22px] font-semibold tracking-tight text-ink-900">
                {money(impact, { currency })} a month is recoverable
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
                {issues.length} open issue{issues.length === 1 ? '' : 's'} across{' '}
                {[...new Set(issues.map((a) => a.category))].slice(0, 3).join(', ').toLowerCase()}.
                {biggest && (
                  <>
                    {' '}Biggest single leak:{' '}
                    <span className="font-medium text-ink-900">{biggest.title}</span>
                    {biggest.impact > 0 && ` at ${money(biggest.impact, { currency })} a month.`}
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-semibold tracking-tight text-ink-900">Nothing is off target</h2>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Check size={12} />
                </span>
                Every tracked metric sits inside its threshold for this period.
              </p>
            </>
          )}
        </div>

        {biggest?.link && (
          <Link to={biggest.link.to} className="btn-primary shrink-0 self-start sm:self-center">
            {biggest.link.label}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-ink-100 px-5 py-4 sm:grid-cols-3 sm:px-6">
        {health.pillars.map((p) => (
          <div key={p.key}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] text-ink-600">{p.label}</span>
              <span className="tabular text-[12px] font-medium text-ink-800">{p.score}</span>
            </div>
            <ProgressBar
              className="mt-1.5"
              value={p.score}
              tone={p.score >= 75 ? 'success' : p.score >= 55 ? 'warning' : 'danger'}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Dashboard() {
  const { currency, issues, dismissAlert, alerts } = useApp()
  const { current, previous, targets, delta } = usePeriod()
  const menu = useMenu()
  const outletCmp = useOutlets()

  const series = bucketDaily(current.daily, 24)
  const spark = (key) => current.daily.map((d) => d[key])

  const statusFor = (value, target) =>
    value > target + 1
      ? { tone: 'danger', label: 'Over target' }
      : value > target
        ? { tone: 'warning', label: 'At limit' }
        : { tone: 'success', label: 'On target' }

  const topItems = [...menu.rows].sort((a, b) => b.profit - a.profit).slice(0, 5)
  const positives = alerts.filter((a) => a.severity === 'positive')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Where the money is going this period. Switch views from the picker on the right."
        showPrint={false}
        actions={
          <>
            <DashboardSelect />
            <Link to="/reports" className="btn-ghost btn-sm">
              Reports
              <ArrowRight size={14} />
            </Link>
          </>
        }
      />

      <Verdict />

      <section>
        <SectionTitle
          right={<span className="text-[12px] text-ink-400">Change is against the previous {current.days} days</span>}
        >
          Money
        </SectionTitle>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Net revenue"
            value={money(current.revenue.net, { currency })}
            delta={delta.revenue}
            spark={spark('net')}
            sparkColor={COLORS.revenue}
            footnote="Previous period"
            target={money(previous.revenue.net, { currency })}
          />
          <KpiCard
            label="Operating profit"
            value={money(current.operatingProfit, { currency })}
            delta={delta.operatingProfit}
            spark={spark('operatingProfit')}
            footnote="Operating margin"
            target={pct(current.operatingMarginPct)}
          />
          <KpiCard
            label="Food cost"
            value={pct(current.foodCostPct)}
            delta={delta.foodCostPct}
            goodWhenUp={false}
            comparisonLabel="pts"
            status={statusFor(current.foodCostPct, targets.foodCostPct)}
            targetLabel="Target"
            target={pct(targets.foodCostPct, 0)}
          />
          <KpiCard
            label="Labour cost"
            value={pct(current.laborCostPct)}
            delta={delta.laborCostPct}
            goodWhenUp={false}
            comparisonLabel="pts"
            status={statusFor(current.laborCostPct, targets.laborCostPct)}
            targetLabel="Target"
            target={pct(targets.laborCostPct, 0)}
          />
        </div>

        <KpiStrip
          className="mt-3"
          items={[
            {
              label: 'Gross profit',
              value: money(current.grossProfit, { currency }),
              delta: delta.grossProfit,
            },
            {
              label: 'Gross margin',
              value: pct(current.grossMarginPct),
              delta: delta.grossMarginPct,
              note: `target ${pct(targets.grossMarginPct, 0)}`,
            },
            {
              label: 'Waste + variance',
              value: money(current.cogs.waste + current.cogs.variance, { currency }),
              delta: delta.wasteCost,
              goodWhenUp: false,
              note: `${pct(current.wastePct + current.variancePct, 2)} of sales`,
            },
            {
              label: 'Orders',
              value: num(current.orders),
              delta: delta.orders,
              note: `${money(current.aov, { currency, decimals: 2 })} average`,
            },
          ]}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Needs attention"
            subtitle={
              issues.length
                ? `${issues.length} issue${issues.length === 1 ? '' : 's'}, ranked by severity then money at stake`
                : 'Nothing is outside its threshold right now'
            }
          />
          <AlertList alerts={issues.slice(0, 5)} onDismiss={dismissAlert} currency={currency} />
          {issues.length > 5 && (
            <div className="border-t border-ink-100 px-5 py-2.5 text-[13px] text-ink-500">
              {issues.length - 5} more in the notification centre
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Working well"
            subtitle={positives.length ? `${positives.length} rule${positives.length === 1 ? '' : 's'} came back positive` : 'Rules that came back positive'}
          />
          <AlertList
            alerts={positives}
            currency={currency}
            compact
            emptyText="No positive signals in this period."
          />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue vs profit"
            subtitle="Net sales, gross profit and operating profit by day"
            right={
              <Legend
                items={[
                  { label: 'Net sales', color: COLORS.revenue },
                  { label: 'Gross profit', color: COLORS.profit },
                  { label: 'Operating profit', color: COLORS.labor },
                ]}
              />
            }
          />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <BarChart
              data={series}
              bars={[
                { key: 'net', label: 'Net sales', color: COLORS.revenue },
                { key: 'grossProfit', label: 'Gross profit', color: COLORS.profit },
              ]}
              lines={[{ key: 'operatingProfit', label: 'Operating profit', color: COLORS.labor }]}
              height={260}
              formatY={(v) => moneyShort(v, currency)}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Top menu items by profit"
            subtitle={`${current.days} days`}
            right={
              <Link to="/menu" className="text-[12px] font-medium text-brand-700 hover:text-brand-800">
                Menu
              </Link>
            }
          />
          <div className="card-pad">
            <RankedBars
              items={topItems.map((r) => ({
                label: r.name,
                value: r.profit,
                color: r.classification.key === 'star' ? COLORS.profit : COLORS.neutral,
                meta: `${money(r.revenue, { currency })} revenue · ${pct(r.marginPct, 0)} margin · ${num(r.units)} sold`,
              }))}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle
          right={
            <Link to="/profitability" className="text-[12px] font-medium text-brand-700 hover:text-brand-800">
              Full comparison
            </Link>
          }
        >
          Outlet performance
        </SectionTitle>
        <Card>
          <DataTable
            dense
            initialSort={{ key: 'operatingMarginPct', dir: 'desc' }}
            rows={outletCmp.rows}
            columns={[
              {
                key: 'name',
                label: 'Outlet',
                render: (r) => (
                  <div>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">{r.city}</p>
                  </div>
                ),
              },
              { key: 'revenue', label: 'Net sales', align: 'right', render: (r) => money(r.revenue, { currency }) },
              {
                key: 'operatingProfit',
                label: 'Operating profit',
                align: 'right',
                render: (r) => money(r.operatingProfit, { currency }),
              },
              {
                key: 'operatingMarginPct',
                label: 'Operating margin',
                align: 'right',
                render: (r) => (
                  <Badge tone={r.operatingMarginPct >= 12 ? 'success' : r.operatingMarginPct >= 6 ? 'warning' : 'danger'}>
                    {pct(r.operatingMarginPct)}
                  </Badge>
                ),
              },
              {
                key: 'foodCostPct',
                label: 'Food cost',
                align: 'right',
                render: (r) => (
                  <span className={r.foodCostPct > r.targetFoodCostPct ? 'text-red-600' : 'text-ink-800'}>
                    {pct(r.foodCostPct)}
                  </span>
                ),
              },
              {
                key: 'laborCostPct',
                label: 'Labour',
                align: 'right',
                render: (r) => (
                  <span className={r.laborCostPct > r.targetLaborCostPct ? 'text-red-600' : 'text-ink-800'}>
                    {pct(r.laborCostPct)}
                  </span>
                ),
              },
              {
                key: 'revenueChangePct',
                label: 'Revenue change',
                align: 'right',
                render: (r) => <Delta value={r.revenueChangePct} className="justify-end" />,
              },
            ]}
          />
        </Card>
      </section>

      <p className="text-[12px] leading-relaxed text-ink-400">
        Every figure above is calculated from POS transactions, recipes, rosters and purchase orders. No estimates.{' '}
        <Link to="/settings" className="font-medium text-brand-700 hover:text-brand-800">
          See the rule book
        </Link>
      </p>
    </div>
  )
}
