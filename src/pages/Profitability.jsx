import { useState } from 'react'
import { BarChart, Donut, LineChart, RankedBars, Waterfall } from '../components/charts/Charts.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, Segmented, StatRow } from '../components/ui/Primitives.jsx'
import { useOutlets, usePeriod } from '../hooks/useMetrics.js'
import { fmtDate, fmtRange } from '../lib/date.js'
import { downloadCsv } from '../lib/exporters.js'
import { money, moneyShort, num, pct } from '../lib/format.js'
import { bucketDaily } from '../lib/metrics.js'
import { CATEGORY_COLORS, COLORS } from '../lib/palette.js'
import { useApp } from '../state/AppContext.jsx'

const TREND_OPTIONS = [
  { value: 'grossMarginPct', label: 'Gross margin' },
  { value: 'foodCostPct', label: 'Food cost' },
  { value: 'laborCostPct', label: 'Labour cost' },
]

export default function Profitability() {
  const { currency, range, scopeLabel } = useApp()
  const { current, previous, targets, delta } = usePeriod()
  const outletCmp = useOutlets()
  const [trend, setTrend] = useState('grossMarginPct')

  const series = bucketDaily(current.daily, 26)

  const revenueRows = [
    { label: 'Food', value: current.revenue.byCategory.Food, color: CATEGORY_COLORS.Food },
    { label: 'Drinks', value: current.revenue.byCategory.Drinks, color: CATEGORY_COLORS.Drinks },
    { label: 'Desserts', value: current.revenue.byCategory.Desserts, color: CATEGORY_COLORS.Desserts },
    { label: 'Other', value: current.revenue.byCategory.Other, color: CATEGORY_COLORS.Other },
  ]

  const costRows = [
    { label: 'Ingredients (recipe cost)', value: current.cogs.theoretical, color: COLORS.cost },
    { label: 'Waste', value: current.cogs.waste, color: COLORS.waste },
    { label: 'Stock variance (unexplained)', value: current.cogs.variance, color: COLORS.variance },
    { label: 'Labour', value: current.labor.cost, color: COLORS.labor },
    ...Object.entries(current.opex.byCategory).map(([label, value]) => ({ label, value, color: COLORS.opex })),
  ].sort((a, b) => b.value - a.value)

  const waterfall = [
    { label: 'Gross sales', short: 'Sales', value: current.revenue.gross, type: 'start' },
    { label: 'Discounts & refunds', short: 'Disc.', value: current.revenue.discount + current.revenue.refund, type: 'cost' },
    { label: 'Ingredient cost', short: 'Food', value: current.cogs.theoretical, type: 'cost' },
    { label: 'Waste & variance', short: 'Waste', value: current.cogs.waste + current.cogs.variance, type: 'cost', color: COLORS.waste },
    { label: 'Labour', short: 'Labour', value: current.labor.cost, type: 'cost', color: COLORS.labor },
    { label: 'Operating costs', short: 'Opex', value: current.opex.total, type: 'cost', color: COLORS.opex },
    { label: 'Operating profit', short: 'Profit', value: 0, type: 'total' },
  ]

  const exportCsv = () => {
    const rows = [
      ['Gross sales', current.revenue.gross],
      ['Discounts', -current.revenue.discount],
      ['Refunds', -current.revenue.refund],
      ['Net sales', current.revenue.net],
      ['Ingredient cost', -current.cogs.theoretical],
      ['Waste', -current.cogs.waste],
      ['Stock variance', -current.cogs.variance],
      ['Gross profit', current.grossProfit],
      ['Labour', -current.labor.cost],
      ...Object.entries(current.opex.byCategory).map(([k, v]) => [k, -v]),
      ['Operating profit', current.operatingProfit],
    ].map(([line, amount]) => ({ line, amount: amount.toFixed(2), pctOfSales: ((amount / current.revenue.net) * 100).toFixed(2) }))

    downloadCsv(
      `costwise-pnl-${range.from}-to-${range.to}`,
      [
        { key: 'line', label: 'Line item' },
        { key: 'amount', label: `Amount (${currency})` },
        { key: 'pctOfSales', label: '% of net sales' },
      ],
      rows,
      [
        ['Report', 'Profit & loss'],
        ['Scope', scopeLabel],
        ['Period', fmtRange(range.from, range.to)],
      ],
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profitability"
        description="Where the money goes"
        onExportCsv={exportCsv}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Net sales"
          value={money(current.revenue.net, { currency })}
          delta={delta.revenue}
          footnote="Gross sales"
          target={money(current.revenue.gross, { currency })}
        />
        <KpiCard
          label="Gross profit"
          value={money(current.grossProfit, { currency })}
          delta={delta.grossProfit}
          footnote="Gross margin"
          target={pct(current.grossMarginPct)}
        />
        <KpiCard
          label="Operating profit"
          value={money(current.operatingProfit, { currency })}
          delta={delta.operatingProfit}
          footnote="Operating margin"
          target={pct(current.operatingMarginPct)}
        />
        <KpiCard
          label="Prime cost"
          value={pct(current.primeCostPct)}
          delta={current.primeCostPct - (previous.primeCostPct || 0)}
          goodWhenUp={false}
          comparisonLabel="pts vs previous period"
          footnote="Food + labour, target ≤ 55%"
          target={pct(targets.foodCostPct + targets.laborCostPct, 0)}
        />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="From sales to operating profit" subtitle="Every deduction, in order" />
          <div className="px-2 pb-2 pt-4 sm:px-4">
            <Waterfall steps={waterfall} height={280} formatValue={(v, short) => (short ? moneyShort(v, currency) : money(v, { currency }))} />
          </div>
        </Card>

        <Card>
          <CardHeader title="P&L statement" subtitle={fmtRange(range.from, range.to)} />
          <div className="card-pad pt-1">
            <StatRow label="Gross sales" value={money(current.revenue.gross, { currency })} />
            <StatRow label="Discounts" value={`−${money(current.revenue.discount, { currency })}`} indent />
            <StatRow label="Refunds" value={`−${money(current.revenue.refund, { currency })}`} indent />
            <StatRow label="Net sales" value={money(current.revenue.net, { currency })} strong border />
            <StatRow label="Ingredient cost" value={`−${money(current.cogs.theoretical, { currency })}`} indent />
            <StatRow label="Waste" value={`−${money(current.cogs.waste, { currency })}`} indent />
            <StatRow label="Stock variance" value={`−${money(current.cogs.variance, { currency })}`} indent tone="danger" />
            <StatRow label="Gross profit" value={money(current.grossProfit, { currency })} strong border />
            <StatRow label="Labour" value={`−${money(current.labor.cost, { currency })}`} indent />
            {Object.entries(current.opex.byCategory).map(([k, v]) => (
              <StatRow key={k} label={k} value={`−${money(v, { currency })}`} indent />
            ))}
            <StatRow
              label="Operating profit"
              value={money(current.operatingProfit, { currency })}
              strong
              border
              tone={current.operatingProfit > 0 ? 'success' : 'danger'}
            />
            <div className="mt-2 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
              <span className="text-[12px] text-ink-600">Operating margin</span>
              <Badge tone={current.operatingMarginPct >= 12 ? 'success' : current.operatingMarginPct >= 6 ? 'warning' : 'danger'}>
                {pct(current.operatingMarginPct)}
              </Badge>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue breakdown" subtitle="Gross sales by menu category" />
          <div className="card-pad flex flex-col items-center gap-6 sm:flex-row">
            <Donut
              segments={revenueRows}
              centerValue={moneyShort(current.revenue.gross, currency)}
              centerLabel="Gross sales"
            />
            <div className="w-full flex-1">
              {revenueRows.map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-ink-100 py-2 last:border-0">
                  <span className="flex items-center gap-2 text-[13px] text-ink-700">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                    {r.label}
                  </span>
                  <span className="tabular text-[13px] font-medium text-ink-900">
                    {money(r.value, { currency })}
                    <span className="ml-2 text-[12px] font-normal text-ink-400">
                      {pct((r.value / (current.revenue.gross || 1)) * 100, 0)}
                    </span>
                  </span>
                </div>
              ))}
              <div className="mt-2 space-y-1 rounded-lg bg-ink-50 px-3 py-2">
                <div className="flex justify-between text-[12px] text-ink-600">
                  <span>Discounts</span>
                  <span className="tabular font-medium text-red-600">−{money(current.revenue.discount, { currency })}</span>
                </div>
                <div className="flex justify-between text-[12px] text-ink-600">
                  <span>Refunds</span>
                  <span className="tabular font-medium text-red-600">−{money(current.revenue.refund, { currency })}</span>
                </div>
                <div className="flex justify-between text-[12px] text-ink-600">
                  <span>Delivery share of sales</span>
                  <span className="tabular font-medium text-ink-800">
                    {pct((current.revenue.delivery / (current.revenue.gross || 1)) * 100, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Cost breakdown" subtitle={`${money(current.cogs.total + current.labor.cost + current.opex.total, { currency })} of total cost`} />
          <div className="card-pad">
            <RankedBars
              items={costRows.map((c) => ({
                ...c,
                meta: `${pct((c.value / (current.revenue.net || 1)) * 100, 1)} of net sales`,
              }))}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Cost and margin trend"
            subtitle="Dashed line is the target"
            right={<Segmented size="sm" options={TREND_OPTIONS} value={trend} onChange={setTrend} />}
          />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <LineChart
              data={series.map((d) => ({
                ...d,
                target:
                  trend === 'grossMarginPct'
                    ? targets.grossMarginPct
                    : trend === 'foodCostPct'
                      ? targets.foodCostPct
                      : targets.laborCostPct,
              }))}
              series={[
                {
                  key: trend,
                  label: TREND_OPTIONS.find((t) => t.value === trend).label,
                  color: trend === 'grossMarginPct' ? COLORS.profit : trend === 'foodCostPct' ? COLORS.cost : COLORS.labor,
                  area: true,
                },
                { key: 'target', label: 'Target', color: COLORS.neutral, dashed: true },
              ]}
              height={250}
              includeZero={false}
              formatY={(v) => `${v.toFixed(0)}%`}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => pct(v)}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Profit by day" subtitle="Operating profit" />
          <div className="px-2 pb-3 pt-4">
            <BarChart
              data={series}
              bars={[{ key: 'operatingProfit', label: 'Operating profit', color: COLORS.profit }]}
              height={250}
              formatY={(v) => moneyShort(v, currency)}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Profit by outlet" subtitle="Same period, every outlet, regardless of the scope selector" />
        <DataTable
          initialSort={{ key: 'operatingProfit', dir: 'desc' }}
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
            { key: 'grossProfit', label: 'Gross profit', align: 'right', render: (r) => money(r.grossProfit, { currency }) },
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
            { key: 'orders', label: 'Orders', align: 'right', render: (r) => num(r.orders) },
            { key: 'aov', label: 'AOV', align: 'right', render: (r) => money(r.aov, { currency, decimals: 2 }) },
          ]}
        />
      </Card>
    </div>
  )
}
