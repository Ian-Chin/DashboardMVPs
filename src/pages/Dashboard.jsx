import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react'
import { AlertList } from '../components/alerts/AlertList.jsx'
import { BarChart, Legend, RankedBars } from '../components/charts/Charts.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, cx, Delta, ProgressBar, SectionTitle } from '../components/ui/Primitives.jsx'
import { useMenu, useOutlets, usePeriod } from '../hooks/useMetrics.js'
import { fmtDate } from '../lib/date.js'
import { money, moneyShort, num, pct } from '../lib/format.js'
import { bucketDaily } from '../lib/metrics.js'
import { COLORS } from '../lib/palette.js'
import { useApp } from '../state/AppContext.jsx'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function HealthCard() {
  const { health, issues, impact, currency } = useApp()
  const toneRing = {
    success: 'text-brand-500',
    brand: 'text-brand-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  }[health.tone]

  const r = 34
  const circumference = 2 * Math.PI * r
  const dash = (health.score / 100) * circumference

  return (
    <Card className="card-pad">
      <div className="flex items-start gap-5">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
            <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" className="text-ink-100" strokeWidth="9" />
            <circle
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke="currentColor"
              className={toneRing}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-xl font-semibold text-ink-900">{health.score}</span>
            <span className="text-[10px] text-ink-400">/ 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink-900">Business health: {health.label}</h2>
            <Badge tone={health.tone} dot>
              {issues.length} open issue{issues.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <p className="mt-1 text-[13px] text-ink-600">
            {issues.length
              ? `Fixing everything on the list is worth about ${money(impact, { currency })} a month.`
              : 'Every tracked metric is inside its threshold for this period.'}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">
            {health.pillars.map((p) => (
              <div key={p.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] text-ink-600">{p.label}</span>
                  <span className="tabular text-[12px] font-medium text-ink-800">{p.score}</span>
                </div>
                <ProgressBar
                  className="mt-1"
                  value={p.score}
                  tone={p.score >= 75 ? 'success' : p.score >= 55 ? 'warning' : 'danger'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { currency, users, issues, impact, dismissAlert, alerts } = useApp()
  const { current, previous, targets, delta } = usePeriod()
  const menu = useMenu()
  const outletCmp = useOutlets()

  const series = bucketDaily(current.daily, 24)
  const spark = (key) => current.daily.map((d) => d[key])

  const foodStatus =
    current.foodCostPct > targets.foodCostPct + 1
      ? { tone: 'danger', label: 'Over target' }
      : current.foodCostPct > targets.foodCostPct
        ? { tone: 'warning', label: 'At limit' }
        : { tone: 'success', label: 'On target' }

  const laborStatus =
    current.laborCostPct > targets.laborCostPct + 1
      ? { tone: 'danger', label: 'Over target' }
      : current.laborCostPct > targets.laborCostPct
        ? { tone: 'warning', label: 'At limit' }
        : { tone: 'success', label: 'On target' }

  const topItems = [...menu.rows].sort((a, b) => b.profit - a.profit).slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${users[0].name.split(' ')[0]}`}
        description="Command centre"
        showPrint={false}
        actions={
          <Link to="/reports" className="btn-ghost btn-sm">
            Reports
            <ArrowRight size={14} />
          </Link>
        }
      />

      <HealthCard />

      <section>
        <SectionTitle right={<span className="text-[12px] text-ink-400">Compared with the previous {current.days} days</span>}>
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
            label="Gross profit"
            value={money(current.grossProfit, { currency })}
            delta={delta.grossProfit}
            spark={spark('grossProfit')}
            footnote="Previous period"
            target={money(previous.grossProfit, { currency })}
          />
          <KpiCard
            label="Gross margin"
            value={pct(current.grossMarginPct)}
            delta={delta.grossMarginPct}
            comparisonLabel="pts vs previous period"
            target={pct(targets.grossMarginPct, 0)}
            targetLabel="Target margin"
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
            comparisonLabel="pts vs previous period"
            status={foodStatus}
            target={pct(targets.foodCostPct, 0)}
            targetLabel="Target"
          />
          <KpiCard
            label="Labour cost"
            value={pct(current.laborCostPct)}
            delta={delta.laborCostPct}
            goodWhenUp={false}
            comparisonLabel="pts vs previous period"
            status={laborStatus}
            target={pct(targets.laborCostPct, 0)}
            targetLabel="Target"
          />
          <KpiCard
            label="Waste + stock variance"
            value={money(current.cogs.waste + current.cogs.variance, { currency })}
            delta={delta.wasteCost}
            goodWhenUp={false}
            footnote="Share of net sales"
            target={pct(current.wastePct + current.variancePct, 2)}
          />
          <KpiCard
            label="Orders"
            value={num(current.orders)}
            delta={delta.orders}
            footnote="Average order value"
            target={money(current.aov, { currency, decimals: 2 })}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Needs attention"
            subtitle={
              issues.length
                ? `${issues.length} operational issue${issues.length === 1 ? '' : 's'} detected · ${money(impact, { currency })} monthly impact`
                : 'Nothing is outside its threshold right now'
            }
            right={
              issues.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-[12px] font-medium text-red-700">
                  <AlertTriangle size={13} />
                  {money(impact, { currency })}/mo
                </span>
              )
            }
          />
          <AlertList alerts={issues.slice(0, 5)} onDismiss={dismissAlert} currency={currency} />
          {issues.length > 5 && (
            <div className="border-t border-ink-100 px-5 py-2.5 text-[13px] text-ink-500">
              +{issues.length - 5} more in the notification centre
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Working well" subtitle="Rules that came back positive" />
          <AlertList
            alerts={alerts.filter((a) => a.severity === 'positive')}
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
          <CardHeader title="Top menu items by profit" subtitle={`${current.days} days`} right={<Link to="/menu" className="text-[12px] font-medium text-brand-700">Menu</Link>} />
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
        <SectionTitle right={<Link to="/reports" className="text-[12px] font-medium text-brand-700">Full comparison</Link>}>
          Outlet performance
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {outletCmp.rows.map((o) => {
            const best = outletCmp.best?.id === o.id
            const worst = outletCmp.worst?.id === o.id
            return (
              <Card key={o.id} className={cx('card-pad', best && 'ring-1 ring-brand-200', worst && 'ring-1 ring-red-200')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-ink-900">{o.name}</p>
                    <p className="text-[12px] text-ink-500">{o.city}</p>
                  </div>
                  {best && <Badge tone="success">Best margin</Badge>}
                  {worst && !best && <Badge tone="danger">Lowest margin</Badge>}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-ink-500">Revenue</span>
                    <span className="tabular text-[13px] font-medium text-ink-900">
                      {money(o.revenue, { currency })}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-ink-500">Operating profit</span>
                    <span className="tabular text-[13px] font-medium text-ink-900">
                      {money(o.operatingProfit, { currency })}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-ink-500">Operating margin</span>
                    <span className="tabular text-[13px] font-semibold text-ink-900">{pct(o.operatingMarginPct)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2">
                  <Delta value={o.revenueChangePct} suffix="revenue" />
                  <span className="text-[11px] text-ink-400">
                    Food {pct(o.foodCostPct, 0)} · Labour {pct(o.laborCostPct, 0)}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      <Card className="card-pad flex flex-wrap items-center gap-3 bg-ink-950 text-ink-200">
        <Sparkles size={16} className="text-brand-400" />
        <p className="flex-1 text-[13px]">
          Every number here is calculated from your POS transactions, recipes, rosters and purchase orders — no
          estimates, no AI. Change a threshold in Settings and the rules re-run instantly.
        </p>
        <Link to="/settings" className="btn btn-sm border-ink-800 bg-ink-900 text-white hover:bg-ink-800">
          Adjust thresholds
        </Link>
      </Card>
    </div>
  )
}
