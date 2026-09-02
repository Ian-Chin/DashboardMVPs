import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react'
import { LineChart, RankedBars } from '../components/charts/Charts.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, cx, Segmented, StatRow } from '../components/ui/Primitives.jsx'
import { usePurchasing } from '../hooks/useMetrics.js'
import { outletById } from '../data/catalog.js'
import { priceShockFor } from '../data/demoData.js'
import { fmtDate, fmtRange } from '../lib/date.js'
import { downloadCsv } from '../lib/exporters.js'
import { money, num, pct, pctDelta } from '../lib/format.js'
import { priceHistory } from '../lib/metrics.js'
import { COLORS } from '../lib/palette.js'
import { useApp } from '../state/AppContext.jsx'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'up', label: 'Price up' },
  { value: 'savings', label: 'Cheaper quote' },
]

function PriceChange({ value, threshold }) {
  const up = value > 0
  const big = Math.abs(value) >= threshold
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 font-medium',
        Math.abs(value) < 0.1 ? 'text-ink-400' : up ? (big ? 'text-red-600' : 'text-amber-600') : 'text-brand-600',
      )}
    >
      <Icon size={13} />
      {pctDelta(value)}
    </span>
  )
}

function IngredientPanel({ row, onClose }) {
  const { currency, range, thresholds } = useApp()
  const history = useMemo(() => priceHistory(row.id, range.from, range.to), [row.id, range.from, range.to])
  const shock = priceShockFor(row.id)

  return (
    <Card className="sticky top-20">
      <CardHeader
        title={row.name}
        subtitle={`${row.supplier} · ${row.category}`}
        right={
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
            <X size={15} />
          </button>
        }
      />
      <div className="card-pad">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-ink-200/70 bg-ink-50/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-ink-500">Previous</p>
            <p className="tabular mt-0.5 text-[15px] font-semibold text-ink-900">
              {money(row.previousPrice, { currency, decimals: 2 })}
            </p>
            <p className="text-[11px] text-ink-500">per {row.unit}</p>
          </div>
          <div className="rounded-lg border border-ink-200/70 bg-ink-50/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-ink-500">Current</p>
            <p className="tabular mt-0.5 text-[15px] font-semibold text-ink-900">
              {money(row.currentPrice, { currency, decimals: 2 })}
            </p>
            <p className="text-[11px] text-ink-500">per {row.unit}</p>
          </div>
          <div
            className={cx(
              'rounded-lg border px-3 py-2',
              row.changePct >= thresholds.priceIncreasePct ? 'border-red-200 bg-red-50' : 'border-ink-200/70 bg-ink-50/60',
            )}
          >
            <p className="text-[11px] uppercase tracking-wide text-ink-500">Change</p>
            <p className="tabular mt-0.5 text-[15px] font-semibold text-ink-900">{pctDelta(row.changePct)}</p>
            <p className="text-[11px] text-ink-500">
              {money(row.currentPrice - row.previousPrice, { currency, decimals: 2 })}/{row.unit}
            </p>
          </div>
        </div>

        {shock && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Market note on file: {shock.reason}.
          </p>
        )}

        <div className="mt-3">
          <StatRow label="Quantity purchased" value={`${num(row.qty, 1)} ${row.unit}`} />
          <StatRow label="Spend this period" value={money(row.spend, { currency })} strong />
          <StatRow
            label="Annualised impact of the change"
            value={money(row.annualisedImpact, { currency })}
            tone={row.annualisedImpact > 0 ? 'danger' : 'success'}
            border
          />
        </div>

        {row.alternative && row.alternative.saving > 0 && (
          <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
            <p className="text-[13px] font-semibold text-brand-900">Cheaper quote on file</p>
            <div className="mt-2 space-y-1 text-[13px] text-ink-700">
              <div className="flex justify-between">
                <span>{row.supplier} (current)</span>
                <span className="tabular font-medium">
                  {money(row.currentPrice, { currency, decimals: 2 })}/{row.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{row.alternative.supplier}</span>
                <span className="tabular font-medium">
                  {money(row.alternative.price, { currency, decimals: 2 })}/{row.unit}
                </span>
              </div>
              <div className="flex justify-between border-t border-brand-200 pt-1 font-semibold text-brand-800">
                <span>Potential saving</span>
                <span className="tabular">
                  {money(row.alternative.saving, { currency, decimals: 2 })}/{row.unit} ·{' '}
                  {money(row.alternative.periodSaving, { currency })} this period
                </span>
              </div>
            </div>
            <p className="mt-2 text-[12px] text-ink-600">
              {row.alternative.note} · minimum order {row.alternative.minOrder}
            </p>
          </div>
        )}

        <p className="mb-1 mt-4 section-title">Price history</p>
        <LineChart
          data={history.map((h) => ({ ...h, label: h.date }))}
          series={[{ key: 'value', label: `${currency}/${row.unit}`, color: COLORS.cost, area: true }]}
          height={150}
          includeZero={false}
          formatY={(v) => v.toFixed(1)}
          formatX={(d) => fmtDate(d.date)}
          formatValue={(v) => money(v, { currency, decimals: 2 })}
        />
      </div>
    </Card>
  )
}

export default function Purchasing() {
  const { currency, range, scopeLabel, thresholds } = useApp()
  const purch = usePurchasing()
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const rows = useMemo(() => {
    if (filter === 'up') return purch.ingredientRows.filter((r) => r.changePct >= thresholds.priceIncreasePct)
    if (filter === 'savings') return purch.savings
    return purch.ingredientRows
  }, [purch, filter, thresholds])

  const selected = purch.ingredientRows.find((r) => r.id === selectedId)
  const weightedPriceChange = purch.totalSpend
    ? purch.ingredientRows.reduce((s, r) => s + r.changePct * r.spend, 0) / purch.totalSpend
    : 0

  const exportCsv = () =>
    downloadCsv(
      `costwise-supplier-spending-${range.from}-to-${range.to}`,
      [
        { key: 'name', label: 'Ingredient' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'qty', label: 'Quantity', map: (r) => r.qty.toFixed(2) },
        { key: 'unit', label: 'Unit' },
        { key: 'previousPrice', label: `Previous price (${currency})`, map: (r) => r.previousPrice.toFixed(2) },
        { key: 'currentPrice', label: `Current price (${currency})`, map: (r) => r.currentPrice.toFixed(2) },
        { key: 'changePct', label: 'Change %', map: (r) => r.changePct.toFixed(1) },
        { key: 'spend', label: `Spend (${currency})`, map: (r) => r.spend.toFixed(2) },
        { key: 'alt', label: 'Alternative supplier', map: (r) => r.alternative?.supplier ?? '' },
        { key: 'altSaving', label: `Potential saving (${currency})`, map: (r) => (r.alternative?.periodSaving ?? 0).toFixed(2) },
      ],
      purch.ingredientRows,
      [
        ['Report', 'Supplier spending'],
        ['Scope', scopeLabel],
        ['Period', fmtRange(range.from, range.to)],
        ['Total spend', purch.totalSpend.toFixed(2)],
      ],
    )

  return (
    <div className="space-y-6">
      <PageHeader title="Purchasing" description="Supplier prices and spend" onExportCsv={exportCsv} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total spend"
          value={money(purch.totalSpend, { currency })}
          delta={null}
          footnote="Purchase orders"
          target={num(purch.orders.length)}
        />
        <KpiCard
          label="Weighted price change"
          value={pctDelta(weightedPriceChange)}
          delta={null}
          goodWhenUp={false}
          footnote="Alert threshold"
          target={`+${thresholds.priceIncreasePct}%`}
          status={
            weightedPriceChange >= thresholds.priceIncreasePct
              ? { tone: 'danger', label: 'Rising' }
              : { tone: 'success', label: 'Stable' }
          }
        />
        <KpiCard
          label="Potential savings"
          value={money(purch.totalPotentialSaving, { currency })}
          delta={null}
          footnote="Ingredients with a cheaper quote"
          target={`${purch.savings.length} items`}
        />
        <KpiCard
          label="Suppliers"
          value={num(purch.supplierRows.length)}
          delta={null}
          footnote="Largest share of spend"
          target={purch.supplierRows[0] ? `${purch.supplierRows[0].name.split(' ')[0]} ${pct(purch.supplierRows[0].share, 0)}` : '—'}
        />
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Supplier spend" subtitle="Share of total purchasing in this period" />
          <DataTable
            rows={purch.supplierRows}
            initialSort={{ key: 'spend', dir: 'desc' }}
            columns={[
              {
                key: 'name',
                label: 'Supplier',
                render: (r) => (
                  <div>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">
                      {r.category} · {r.contact} · {r.terms}
                    </p>
                  </div>
                ),
              },
              { key: 'itemCount', label: 'Items', align: 'right' },
              { key: 'orders', label: 'Orders', align: 'right' },
              { key: 'spend', label: 'Spend', align: 'right', render: (r) => money(r.spend, { currency }) },
              { key: 'share', label: 'Share', align: 'right', render: (r) => pct(r.share) },
              {
                key: 'priceChangePct',
                label: 'Price trend',
                align: 'right',
                render: (r) => <PriceChange value={r.priceChangePct} threshold={thresholds.priceIncreasePct} />,
              },
              {
                key: 'leadTimeDays',
                label: 'Lead time',
                align: 'right',
                render: (r) => `${r.leadTimeDays}d`,
              },
            ]}
          />
        </Card>

        <Card>
          <CardHeader title="Potential savings" subtitle="Same ingredient, cheaper quote on file" />
          <div className="card-pad">
            {purch.savings.length ? (
              <RankedBars
                items={purch.savings.slice(0, 6).map((r) => ({
                  label: r.name,
                  value: r.alternative.periodSaving,
                  color: COLORS.profit,
                  meta: `${money(r.currentPrice, { currency, decimals: 2 })} → ${money(r.alternative.price, { currency, decimals: 2 })}/${r.unit} with ${r.alternative.supplier}`,
                }))}
                formatValue={(v) => money(v, { currency })}
              />
            ) : (
              <p className="py-6 text-center text-[13px] text-ink-500">
                No cheaper quotes on file for this period.
              </p>
            )}
            {purch.savings.length > 0 && (
              <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-[13px] text-brand-900">
                Switching every flagged line saves{' '}
                <span className="font-semibold">{money(purch.totalPotentialSaving, { currency })}</span> at this
                period's volumes.
              </div>
            )}
          </div>
        </Card>
      </section>

      <div className={cx('grid grid-cols-1 gap-4', selected && 'xl:grid-cols-3')}>
        <Card className={selected ? 'xl:col-span-2' : ''}>
          <CardHeader
            title="Ingredient prices"
            subtitle="Current is the average unit price in the second half of the period, compared with the first half"
            right={<Segmented size="sm" options={FILTERS} value={filter} onChange={setFilter} />}
          />
          <DataTable
            rows={rows}
            searchable
            searchKeys={['name', 'supplier', 'category']}
            searchPlaceholder="Search ingredients…"
            initialSort={{ key: 'spend', dir: 'desc' }}
            onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
            activeRowKey={selectedId}
            emptyTitle="Nothing matches this filter"
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
              { key: 'qty', label: 'Quantity', align: 'right', render: (r) => `${num(r.qty, 1)} ${r.unit}` },
              {
                key: 'previousPrice',
                label: 'Previous',
                align: 'right',
                render: (r) => money(r.previousPrice, { currency, decimals: 2 }),
              },
              {
                key: 'currentPrice',
                label: 'Current',
                align: 'right',
                render: (r) => money(r.currentPrice, { currency, decimals: 2 }),
              },
              {
                key: 'changePct',
                label: 'Change',
                align: 'right',
                render: (r) => <PriceChange value={r.changePct} threshold={thresholds.priceIncreasePct} />,
              },
              { key: 'spend', label: 'Spend', align: 'right', render: (r) => money(r.spend, { currency }) },
              {
                key: 'saving',
                label: 'Cheaper option',
                align: 'right',
                value: (r) => r.alternative?.periodSaving ?? 0,
                render: (r) =>
                  r.alternative && r.alternative.saving > 0 ? (
                    <Badge tone="success">save {money(r.alternative.periodSaving, { currency })}</Badge>
                  ) : (
                    <span className="text-ink-400">—</span>
                  ),
              },
            ]}
          />
        </Card>

        {selected && <IngredientPanel row={selected} onClose={() => setSelectedId(null)} />}
      </div>

      <Card>
        <CardHeader title="Purchase orders" subtitle={`${purch.orders.length} orders in this period`} />
        <DataTable
          rows={purch.orders.slice(0, 60)}
          dense
          initialSort={{ key: 'date', dir: 'desc' }}
          columns={[
            { key: 'id', label: 'PO' },
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date, { day: 'numeric', month: 'short', year: '2-digit' }) },
            {
              key: 'supplierId',
              label: 'Supplier',
              render: (r) => purch.supplierRows.find((s) => s.id === r.supplierId)?.name ?? r.supplierId,
            },
            { key: 'outletId', label: 'Outlet', render: (r) => outletById[r.outletId]?.shortName ?? r.outletId },
            { key: 'items', label: 'Lines', align: 'right', value: (r) => r.items.length, render: (r) => r.items.length },
            { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total, { currency, decimals: 2 }) },
            {
              key: 'status',
              label: 'Status',
              render: (r) => <Badge tone={r.status === 'Received' ? 'neutral' : 'info'}>{r.status}</Badge>,
            },
          ]}
        />
      </Card>
    </div>
  )
}
