import { useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { AlertList } from '../components/alerts/AlertList.jsx'
import { LineChart } from '../components/charts/Charts.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, cx, ProgressBar, Segmented, StatRow } from '../components/ui/Primitives.jsx'
import { useInventory, usePeriod } from '../hooks/useMetrics.js'
import { fmtDate, fmtDateLong, fmtRange } from '../lib/date.js'
import { downloadCsv } from '../lib/exporters.js'
import { money, pct, qty } from '../lib/format.js'
import { priceHistory, wasteLog } from '../lib/metrics.js'
import { inventoryFlags } from '../lib/rules.js'
import { COLORS } from '../lib/palette.js'
import { useApp } from '../state/AppContext.jsx'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'variance', label: 'High variance' },
  { value: 'low', label: 'Below minimum' },
  { value: 'expiry', label: 'Near expiry' },
  { value: 'excess', label: 'Excess' },
]

function FlagBadges({ row, thresholds }) {
  const flags = inventoryFlags(row, thresholds)
  if (!flags.length) return <span className="text-[12px] text-ink-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <Badge key={f.key} tone={f.tone}>
          {f.label}
        </Badge>
      ))}
    </div>
  )
}

function ItemPanel({ row, onClose }) {
  const { currency, range, thresholds } = useApp()
  const history = useMemo(() => priceHistory(row.id, range.from, range.to), [row.id, range.from, range.to])
  const abnormal = row.variancePct >= thresholds.variancePctAlert

  return (
    <Card className="sticky top-20">
      <CardHeader
        title={row.name}
        subtitle={`${row.category} · ${row.supplier}`}
        right={
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
            <X size={15} />
          </button>
        }
      />
      <div className="card-pad">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Opening', value: qty(row.opening, row.unit) },
            { label: 'Purchases', value: qty(row.purchases, row.unit) },
            { label: 'Expected usage', value: qty(row.expected, row.unit) },
            { label: 'Actual usage', value: qty(row.actual, row.unit) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-ink-200/70 bg-ink-50/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-ink-500">{s.label}</p>
              <p className="tabular mt-0.5 text-[15px] font-semibold text-ink-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div
          className={cx(
            'mt-3 rounded-lg border px-3 py-2.5',
            abnormal ? 'border-red-200 bg-red-50' : 'border-ink-200/70 bg-ink-50/60',
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-ink-500">Variance</p>
            {abnormal && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700">
                <AlertTriangle size={12} /> Abnormal
              </span>
            )}
          </div>
          <p className={cx('tabular mt-0.5 text-lg font-semibold', abnormal ? 'text-red-700' : 'text-ink-900')}>
            +{qty(row.variance, row.unit)} <span className="text-[13px] font-medium">({pct(row.variancePct)})</span>
          </p>
          <p className="mt-0.5 text-[13px] text-ink-600">
            Estimated loss <span className="font-semibold text-ink-900">{money(row.varianceCost, { currency })}</span> at{' '}
            {money(row.price, { currency, decimals: 2 })}/{row.unit}
          </p>
        </div>

        <div className="mt-3">
          <StatRow label="Recorded waste" value={`${qty(row.waste, row.unit)} · ${money(row.wasteCost, { currency })}`} />
          <StatRow label="Closing stock" value={qty(row.closing, row.unit)} border />
          <StatRow label="Minimum level" value={qty(row.minStock, row.unit)} />
          <StatRow
            label="Days of cover"
            value={row.daysOfStock === Infinity ? '—' : `${row.daysOfStock.toFixed(1)} days`}
            tone={row.daysOfStock < 2 ? 'danger' : undefined}
          />
          <StatRow label="Shelf life" value={`${row.shelfLifeDays} days`} />
          <StatRow
            label="Last delivery"
            value={row.lastDelivery ? fmtDateLong(row.lastDelivery) : '—'}
            border
          />
        </div>

        <div className="mt-2">
          <ProgressBar
            value={Math.min(row.closing, row.minStock * 3)}
            max={row.minStock * 3 || 1}
            tone={row.belowMin ? 'danger' : 'success'}
            markerAt={row.minStock}
          />
          <p className="mt-1 text-[11px] text-ink-500">Marker shows the minimum stock level.</p>
        </div>

        <p className="mb-1 mt-4 section-title">Unit cost trend</p>
        <LineChart
          data={history.map((h) => ({ ...h, label: h.date }))}
          series={[{ key: 'value', label: `${currency}/${row.unit}`, color: COLORS.cost, area: true }]}
          height={140}
          includeZero={false}
          formatY={(v) => v.toFixed(1)}
          formatX={(d) => fmtDate(d.date)}
          formatValue={(v) => money(v, { currency, decimals: 2 })}
        />
      </div>
    </Card>
  )
}

export default function Inventory() {
  const { currency, range, scopeLabel, outletId, thresholds, alerts, dismissAlert } = useApp()
  const inv = useInventory()
  const { current, delta } = usePeriod()
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const rows = useMemo(() => {
    switch (filter) {
      case 'variance':
        return inv.rows.filter((r) => r.variancePct >= thresholds.variancePctAlert)
      case 'low':
        return inv.rows.filter((r) => r.belowMin)
      case 'expiry':
        return inv.rows.filter((r) => r.nearExpiry)
      case 'excess':
        return inv.rows.filter((r) => r.excess)
      default:
        return inv.rows
    }
  }, [inv.rows, filter, thresholds])

  const selected = inv.rows.find((r) => r.id === selectedId)
  const waste = useMemo(() => wasteLog(outletId, range.from, range.to, 25), [outletId, range.from, range.to])
  const inventoryAlerts = alerts.filter((a) => a.category === 'Inventory' || a.category === 'Waste')
  const flaggedCount = inv.rows.filter((r) => inventoryFlags(r, thresholds).length).length

  const exportCsv = () =>
    downloadCsv(
      `costwise-inventory-variance-${range.from}-to-${range.to}`,
      [
        { key: 'name', label: 'Ingredient' },
        { key: 'unit', label: 'Unit' },
        { key: 'opening', label: 'Opening', map: (r) => r.opening.toFixed(2) },
        { key: 'purchases', label: 'Purchases', map: (r) => r.purchases.toFixed(2) },
        { key: 'expected', label: 'Expected usage', map: (r) => r.expected.toFixed(2) },
        { key: 'actual', label: 'Actual usage', map: (r) => r.actual.toFixed(2) },
        { key: 'variance', label: 'Variance', map: (r) => r.variance.toFixed(2) },
        { key: 'variancePct', label: 'Variance %', map: (r) => r.variancePct.toFixed(1) },
        { key: 'waste', label: 'Waste qty', map: (r) => r.waste.toFixed(2) },
        { key: 'price', label: `Cost per unit (${currency})`, map: (r) => r.price.toFixed(2) },
        { key: 'varianceCost', label: `Estimated loss (${currency})`, map: (r) => r.varianceCost.toFixed(2) },
        { key: 'closing', label: 'Closing stock', map: (r) => r.closing.toFixed(2) },
      ],
      inv.rows,
      [
        ['Report', 'Inventory variance'],
        ['Scope', scopeLabel],
        ['Period', fmtRange(range.from, range.to)],
      ],
    )

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Variance, waste and stock health" onExportCsv={exportCsv} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Stock variance cost"
          value={money(inv.totals.varianceCost, { currency })}
          delta={delta.varianceCost}
          goodWhenUp={false}
          footnote="Share of net sales"
          target={pct(current.variancePct, 2)}
        />
        <KpiCard
          label="Waste cost"
          value={money(inv.totals.wasteCost, { currency })}
          delta={delta.wasteCost}
          goodWhenUp={false}
          footnote="Ceiling"
          target={pct(thresholds.wastePctOfRevenue, 1)}
        />
        <KpiCard
          label="Stock on hand"
          value={money(inv.totals.stockValue, { currency })}
          delta={null}
          footnote="Purchases this period"
          target={money(inv.totals.purchaseValue, { currency })}
        />
        <KpiCard
          label="Items flagged"
          value={`${flaggedCount} of ${inv.rows.length}`}
          delta={null}
          footnote="Below minimum"
          target={`${inv.rows.filter((r) => r.belowMin).length} items`}
        />
      </div>

      {inventoryAlerts.length > 0 && (
        <Card>
          <CardHeader title="Inventory alerts" subtitle="Generated from your thresholds in Settings" />
          <AlertList alerts={inventoryAlerts} onDismiss={dismissAlert} currency={currency} />
        </Card>
      )}

      <div className={cx('grid grid-cols-1 gap-4', selected && 'xl:grid-cols-3')}>
        <Card className={selected ? 'xl:col-span-2' : ''}>
          <CardHeader
            title="Usage and variance by ingredient"
            subtitle="Expected usage comes from recipes × units sold. Anything above that is waste or unexplained loss."
            right={<Segmented size="sm" options={FILTERS} value={filter} onChange={setFilter} />}
          />
          <DataTable
            rows={rows}
            searchable
            searchKeys={['name', 'category', 'supplier']}
            searchPlaceholder="Search ingredients…"
            initialSort={{ key: 'varianceCost', dir: 'desc' }}
            onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
            activeRowKey={selectedId}
            emptyTitle="No ingredients match this filter"
            columns={[
              {
                key: 'name',
                label: 'Ingredient',
                render: (r) => (
                  <div>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">{r.supplier}</p>
                  </div>
                ),
              },
              { key: 'opening', label: 'Opening', align: 'right', render: (r) => qty(r.opening, r.unit) },
              { key: 'purchases', label: 'Purchases', align: 'right', render: (r) => qty(r.purchases, r.unit) },
              { key: 'expected', label: 'Expected', align: 'right', render: (r) => qty(r.expected, r.unit) },
              { key: 'actual', label: 'Actual', align: 'right', render: (r) => qty(r.actual, r.unit) },
              {
                key: 'variance',
                label: 'Variance',
                align: 'right',
                render: (r) => (
                  <span className={r.variancePct >= thresholds.variancePctAlert ? 'font-semibold text-red-600' : 'text-ink-800'}>
                    +{qty(r.variance, r.unit)}
                  </span>
                ),
              },
              {
                key: 'variancePct',
                label: 'Var %',
                align: 'right',
                render: (r) => (
                  <span className={r.variancePct >= thresholds.variancePctAlert ? 'font-semibold text-red-600' : 'text-ink-800'}>
                    {pct(r.variancePct)}
                  </span>
                ),
              },
              { key: 'price', label: 'Unit cost', align: 'right', render: (r) => money(r.price, { currency, decimals: 2 }) },
              {
                key: 'varianceCost',
                label: 'Est. loss',
                align: 'right',
                render: (r) => <span className="font-medium">{money(r.varianceCost, { currency })}</span>,
              },
              {
                key: 'closing',
                label: 'On hand',
                align: 'right',
                render: (r) => (
                  <span className={r.belowMin ? 'font-semibold text-red-600' : 'text-ink-800'}>{qty(r.closing, r.unit)}</span>
                ),
              },
              {
                key: 'flags',
                label: 'Status',
                sortable: false,
                render: (r) => <FlagBadges row={r} thresholds={thresholds} />,
              },
            ]}
          />
        </Card>

        {selected && <ItemPanel row={selected} onClose={() => setSelectedId(null)} />}
      </div>

      <Card>
        <CardHeader
          title="Waste log"
          subtitle={`${money(inv.totals.wasteCost, { currency })} written off this period`}
        />
        <DataTable
          rows={waste}
          dense
          initialSort={{ key: 'cost', dir: 'desc' }}
          rowKey={(r) => r.id}
          emptyTitle="No waste recorded in this period"
          columns={[
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date, { day: 'numeric', month: 'short', year: '2-digit' }) },
            {
              key: 'ingredientId',
              label: 'Ingredient',
              value: (r) => r.ingredientId,
              render: (r) => inv.rows.find((x) => x.id === r.ingredientId)?.name ?? r.ingredientId,
            },
            {
              key: 'qty',
              label: 'Quantity',
              align: 'right',
              render: (r) => qty(r.qty, inv.rows.find((x) => x.id === r.ingredientId)?.unit),
            },
            { key: 'cost', label: 'Cost', align: 'right', render: (r) => money(r.cost, { currency, decimals: 2 }) },
            { key: 'reason', label: 'Reason', render: (r) => <Badge tone="neutral">{r.reason}</Badge> },
            { key: 'recordedBy', label: 'Recorded by' },
          ]}
        />
      </Card>
    </div>
  )
}
