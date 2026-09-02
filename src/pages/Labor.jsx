import { useMemo, useState } from 'react'
import { AlertList } from '../components/alerts/AlertList.jsx'
import { BarChart, HeatGrid, LineChart, RankedBars } from '../components/charts/Charts.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, Segmented } from '../components/ui/Primitives.jsx'
import { useLabor, useOutlets, usePeriod } from '../hooks/useMetrics.js'
import { outletById } from '../data/catalog.js'
import { SERVICE_HOURS } from '../data/demoData.js'
import { fmtDate, fmtRange } from '../lib/date.js'
import { downloadCsv } from '../lib/exporters.js'
import { money, moneyShort, num, pct } from '../lib/format.js'
import { bucketDaily } from '../lib/metrics.js'
import { fmtHour } from '../lib/rules.js'
import { COLORS } from '../lib/palette.js'
import { useApp } from '../state/AppContext.jsx'

const TREND_OPTIONS = [
  { value: 'laborCostPct', label: 'Labour cost %' },
  { value: 'salesPerLaborHour', label: 'Sales per hour' },
  { value: 'laborCost', label: 'Labour cost' },
]

export default function Labor() {
  const { currency, range, scopeLabel, alerts, dismissAlert, thresholds } = useApp()
  const labor = useLabor()
  const outletCmp = useOutlets()
  const { current, targets, delta } = usePeriod()
  const [trend, setTrend] = useState('laborCostPct')

  const series = bucketDaily(current.daily, 26)
  const laborAlerts = alerts.filter((a) => a.category === 'Labor')

  const heatCells = useMemo(
    () =>
      labor.blocks.map((b) => ({
        row: b.dow,
        col: b.hour,
        value: b.splh,
        meta: `${b.dowLabel} ${fmtHour(b.hour)} · ${money(b.sales, { currency })} sales on ${b.hours.toFixed(1)} labour hours · ${money(b.splh, { currency })} per hour`,
      })),
    [labor.blocks, currency],
  )

  const exportCsv = () =>
    downloadCsv(
      `costwise-labor-${range.from}-to-${range.to}`,
      [
        { key: 'name', label: 'Employee' },
        { key: 'role', label: 'Role' },
        { key: 'type', label: 'Contract' },
        { key: 'outlet', label: 'Outlet', map: (r) => outletById[r.outletId]?.shortName ?? '' },
        { key: 'days', label: 'Shifts' },
        { key: 'hours', label: 'Hours', map: (r) => r.hours.toFixed(1) },
        { key: 'otHours', label: 'Overtime hours', map: (r) => r.otHours.toFixed(1) },
        { key: 'hourlyRate', label: `Rate (${currency}/h)`, map: (r) => r.hourlyRate.toFixed(2) },
        { key: 'cost', label: `Cost (${currency})`, map: (r) => r.cost.toFixed(2) },
        { key: 'costShare', label: '% of labour cost', map: (r) => r.costShare.toFixed(1) },
      ],
      labor.employees,
      [
        ['Report', 'Labor'],
        ['Scope', scopeLabel],
        ['Period', fmtRange(range.from, range.to)],
        ['Labour cost %', current.laborCostPct.toFixed(1)],
      ],
    )

  return (
    <div className="space-y-6">
      <PageHeader title="Labor" description="Roster efficiency" onExportCsv={exportCsv} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Labour cost"
          value={money(current.labor.cost, { currency })}
          delta={delta.laborCostPct}
          goodWhenUp={false}
          comparisonLabel="pts of sales vs previous"
          footnote="Labour cost %"
          target={pct(current.laborCostPct)}
          status={
            current.laborCostPct > targets.laborCostPct
              ? { tone: 'danger', label: 'Over target' }
              : { tone: 'success', label: 'On target' }
          }
        />
        <KpiCard
          label="Sales per labour hour"
          value={money(current.salesPerLaborHour, { currency, decimals: 2 })}
          delta={delta.salesPerLaborHour}
          footnote="Break-even for target"
          target={money(
            current.labor.hours ? (current.labor.cost / current.labor.hours) / (targets.laborCostPct / 100) : 0,
            { currency, decimals: 2 },
          )}
        />
        <KpiCard
          label="Hours worked"
          value={num(current.labor.hours, 0)}
          delta={null}
          footnote="Average hourly cost"
          target={money(current.labor.hours ? current.labor.cost / current.labor.hours : 0, { currency, decimals: 2 })}
        />
        <KpiCard
          label="Overtime"
          value={`${num(current.labor.otHours, 0)} h`}
          delta={null}
          goodWhenUp={false}
          footnote="Overtime cost"
          target={money(current.labor.otCost, { currency })}
          status={
            current.labor.cost && (current.labor.otCost / current.labor.cost) * 100 > thresholds.overtimeSharePct
              ? { tone: 'warning', label: 'High' }
              : undefined
          }
        />
      </div>

      {laborAlerts.length > 0 && (
        <Card>
          <CardHeader title="Labour recommendations" subtitle="Threshold and comparison rules — no forecasting model" />
          <AlertList alerts={laborAlerts} onDismiss={dismissAlert} currency={currency} />
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sales vs labour hours" subtitle="Bars are net sales, the line is scheduled hours" />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <BarChart
              data={series}
              bars={[{ key: 'net', label: 'Net sales', color: COLORS.revenue }]}
              lines={[{ key: 'laborHours', label: 'Labour hours', color: COLORS.labor }]}
              height={250}
              formatY={(v) => moneyShort(v, currency)}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => money(v, { currency })}
              formatLineValue={(v) => `${v.toFixed(0)} h`}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Trend"
            right={<Segmented size="sm" options={TREND_OPTIONS} value={trend} onChange={setTrend} />}
          />
          <div className="px-2 pb-3 pt-4">
            <LineChart
              data={series.map((d) => ({ ...d, target: targets.laborCostPct }))}
              series={[
                {
                  key: trend,
                  label: TREND_OPTIONS.find((t) => t.value === trend).label,
                  color: COLORS.labor,
                  area: true,
                },
                ...(trend === 'laborCostPct' ? [{ key: 'target', label: 'Target', color: COLORS.neutral, dashed: true }] : []),
              ]}
              height={250}
              includeZero={trend !== 'salesPerLaborHour'}
              formatY={(v) => (trend === 'laborCostPct' ? `${v.toFixed(0)}%` : moneyShort(v, currency))}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => (trend === 'laborCostPct' ? pct(v) : money(v, { currency }))}
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Sales per labour hour by day-part"
            subtitle={`Red blocks earn less than ${money(labor.avgSplh * 0.6, { currency })} per labour hour against a ${money(labor.avgSplh, { currency })} period average`}
          />
          <div className="card-pad">
            <HeatGrid
              rows={labor.dow.map((d, i) => ({ key: i, label: d.label }))}
              cols={SERVICE_HOURS.map((h) => ({ key: h, label: fmtHour(h).replace(':00', '') }))}
              cells={heatCells}
              colLabel="Day"
              formatValue={(v) => (v >= 100 ? Math.round(v) : v.toFixed(0))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Labour cost by outlet" subtitle="Share of that outlet's net sales" />
          <div className="card-pad">
            <RankedBars
              items={outletCmp.rows.map((o) => ({
                label: o.name,
                value: o.laborCostPct,
                color: o.laborCostPct > o.targetLaborCostPct ? COLORS.waste : COLORS.profit,
                meta: `Target ${pct(o.targetLaborCostPct, 0)} · ${money(o.salesPerLaborHour, { currency })} per labour hour`,
              }))}
              formatValue={(v) => pct(v)}
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Day of week" subtitle="Average sales, hours and labour share" />
          <DataTable
            rows={labor.dow.map((d, i) => ({ ...d, id: i }))}
            dense
            columns={[
              { key: 'label', label: 'Day', sortable: false },
              { key: 'avgNet', label: 'Avg sales', align: 'right', render: (r) => money(r.avgNet, { currency }) },
              { key: 'avgHours', label: 'Avg hours', align: 'right', render: (r) => r.avgHours.toFixed(1) },
              { key: 'splh', label: 'Sales / hour', align: 'right', render: (r) => money(r.splh, { currency, decimals: 2 }) },
              {
                key: 'laborPct',
                label: 'Labour %',
                align: 'right',
                render: (r) => (
                  <Badge tone={r.laborPct > targets.laborCostPct ? 'danger' : 'success'}>{pct(r.laborPct)}</Badge>
                ),
              },
            ]}
          />
        </Card>

        <Card>
          <CardHeader title="Employees" subtitle={`${labor.employees.length} people scheduled in this period`} />
          <DataTable
            rows={labor.employees}
            dense
            searchable
            searchKeys={['name', 'role']}
            searchPlaceholder="Search employees…"
            initialSort={{ key: 'cost', dir: 'desc' }}
            columns={[
              {
                key: 'name',
                label: 'Employee',
                render: (r) => (
                  <div>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">
                      {r.role} · {outletById[r.outletId]?.shortName}
                    </p>
                  </div>
                ),
              },
              { key: 'hours', label: 'Hours', align: 'right', render: (r) => r.hours.toFixed(1) },
              {
                key: 'otHours',
                label: 'OT',
                align: 'right',
                render: (r) => (
                  <span className={r.otHours > 0 ? 'font-medium text-amber-700' : 'text-ink-400'}>
                    {r.otHours.toFixed(1)}
                  </span>
                ),
              },
              { key: 'cost', label: 'Cost', align: 'right', render: (r) => money(r.cost, { currency }) },
              { key: 'costShare', label: 'Share', align: 'right', render: (r) => pct(r.costShare) },
            ]}
          />
        </Card>
      </section>
    </div>
  )
}
