import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { DivergingBars, LineChart, RankedBars } from '../../components/charts/Charts.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { KpiStrip } from '../../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, SectionTitle, StatRow, cx } from '../../components/ui/Primitives.jsx'
import { fmtDate } from '../../lib/date.js'
import { money, num, pct } from '../../lib/format.js'
import { COLORS, SERIES_COLORS } from '../../lib/palette.js'
import { CLASSES, ECOM_TARGETS, categoryBreakdown, productDetail } from '../../lib/ecomMetrics.js'
import { useEcom } from '../../state/EcomContext.jsx'

const CHANNEL_COLOR = {
  ch_store: SERIES_COLORS[0],
  ch_shopee: SERIES_COLORS[1],
  ch_lazada: SERIES_COLORS[2],
  ch_tiktok: SERIES_COLORS[3],
}

/** The selected SKU, opened up: where it sells, how it moves, what it holds. */
function SkuDetail({ row, channelId, range, currency, onClose }) {
  const detail = useMemo(
    () => productDetail(row.id, channelId, range.from, range.to),
    [row.id, channelId, range.from, range.to],
  )

  return (
    <Card className="sticky top-20">
      <CardHeader
        title={row.name}
        subtitle={`${row.sku} · ${row.category}`}
        right={
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail"
            className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={15} />
          </button>
        }
      />

      <div className="card-pad">
        <Badge tone={row.classification.tone} dot>
          {row.classification.label}
        </Badge>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-600">{row.classification.note}</p>
      </div>

      <div className="border-t border-ink-100 px-5 py-1">
        <StatRow label="List price" value={money(row.price, { currency, decimals: 2 })} />
        <StatRow label="Units sold" value={num(row.units)} />
        <StatRow label="Net revenue" value={money(row.netRevenue, { currency })} />
        <StatRow label="Fees allocated" value={`− ${money(row.fees, { currency })}`} />
        <StatRow label="Delivery allocated" value={`− ${money(row.delivery, { currency })}`} />
        <StatRow label="Ad spend allocated" value={`− ${money(row.ads, { currency })}`} />
        <StatRow
          label="Contribution"
          value={money(row.contribution, { currency })}
          tone={row.contribution < 0 ? 'danger' : 'success'}
          strong
          border
        />
        <StatRow label="Per unit" value={money(row.contributionPerUnit, { currency, decimals: 2 })} />
        <StatRow
          label="Return rate"
          value={pct(row.returnRatePct)}
          tone={row.returnRatePct > ECOM_TARGETS.returnRatePct ? 'danger' : undefined}
        />
      </div>

      <div className="border-t border-ink-100 px-5 py-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Units per day</p>
        <LineChart
          className="mt-2"
          data={detail.daily}
          series={[{ key: 'units', label: 'Units', color: COLORS.profit }]}
          height={120}
          formatY={(v) => num(v)}
          formatX={(d) => fmtDate(d.date)}
          formatValue={(v) => `${num(v)} units`}
        />
      </div>

      <div className="border-t border-ink-100 px-5 py-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Where it sells</p>
        <RankedBars
          className="mt-2.5"
          items={detail.mix.map((m) => ({
            label: m.short,
            value: m.units,
            color: CHANNEL_COLOR[m.id],
            meta: `${pct(m.sharePct, 0)} of units · ${pct(m.returnRatePct)} returned`,
          }))}
          formatValue={(v) => num(v)}
        />
      </div>

      <div className="border-t border-ink-100 px-5 py-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Stock</p>
        <div className="mt-2">
          <StatRow label="Available to sell" value={num(row.ats)} />
          <StatRow label="Committed to open orders" value={num(row.committed)} />
          <StatRow
            label="Days of cover"
            value={row.daysCover === null ? '—' : row.daysCover.toFixed(1)}
            tone={row.daysCover !== null && row.daysCover < 7 ? 'danger' : undefined}
            strong
          />
        </div>
      </div>
    </Card>
  )
}

export default function EcomProducts() {
  const { products, currency, channelId, channelLabel, range, current } = useEcom()
  const [classFilter, setClassFilter] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const categories = useMemo(
    () => categoryBreakdown(channelId, range.from, range.to),
    [channelId, range.from, range.to],
  )

  const rows = products.rows.filter(
    (r) =>
      (!classFilter || r.classification.key === classFilter) && (!categoryFilter || r.category === categoryFilter),
  )
  const selected = rows.find((r) => r.id === selectedId) || null

  const losing = products.rows.filter((r) => r.contribution < 0)
  const bestSeller = [...products.rows].sort((a, b) => b.units - a.units)[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description={`${channelLabel} · contribution per SKU after fees, delivery and ad spend are allocated`}
        actions={
          <Link to="/ecommerce/overview" className="btn-ghost btn-sm">
            Overview
          </Link>
        }
      />

      <KpiStrip
        items={[
          { label: 'SKUs sold', value: num(products.rows.length), note: `${num(current.units)} units` },
          {
            label: 'Contribution',
            value: money(current.contribution, { currency }),
            note: `${pct(current.contributionPct)} of net revenue`,
          },
          {
            label: 'Losing money',
            value: `${losing.length} SKU${losing.length === 1 ? '' : 's'}`,
            note: losing.length ? money(losing.reduce((s, r) => s + r.contribution, 0), { currency }) : 'None',
          },
          {
            label: 'Best seller',
            value: bestSeller ? `${num(bestSeller.units)} units` : '—',
            note: bestSeller?.name,
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Contribution by category" subtitle="A negative category is subsidised by the rest" />
          <div className="card-pad">
            <DivergingBars
              items={categories.map((c) => ({
                label: c.category,
                value: c.contribution,
                color: COLORS.profit,
                meta: `${num(c.units)} units · ${pct(c.contributionPct)} margin · ${c.skus} SKU${c.skus === 1 ? '' : 's'}`,
              }))}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Categories"
            subtitle="Click a row to filter the SKU table"
            right={
              categoryFilter && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter(null)}
                  className="text-[12px] font-medium text-brand-700"
                >
                  Clear
                </button>
              )
            }
          />
          <DataTable
            dense
            rows={categories}
            initialSort={{ key: 'contribution', dir: 'desc' }}
            onRowClick={(r) => setCategoryFilter(categoryFilter === r.category ? null : r.category)}
            activeRowKey={categoryFilter}
            columns={[
              { key: 'category', label: 'Category', render: (r) => <span className="font-medium text-ink-900">{r.category}</span> },
              { key: 'skus', label: 'SKUs', align: 'right' },
              { key: 'units', label: 'Units', align: 'right', render: (r) => num(r.units) },
              { key: 'netRevenue', label: 'Net revenue', align: 'right', render: (r) => money(r.netRevenue, { currency }) },
              {
                key: 'contribution',
                label: 'Contribution',
                align: 'right',
                render: (r) => (
                  <span className={r.contribution < 0 ? 'text-red-600' : 'text-ink-800'}>
                    {money(r.contribution, { currency })}
                  </span>
                ),
              },
              {
                key: 'contributionPct',
                label: 'Margin',
                align: 'right',
                render: (r) => (
                  <Badge tone={r.contributionPct >= ECOM_TARGETS.contributionPct ? 'success' : r.contributionPct > 0 ? 'warning' : 'danger'}>
                    {pct(r.contributionPct)}
                  </Badge>
                ),
              },
              {
                key: 'returnRatePct',
                label: 'Returns',
                align: 'right',
                render: (r) => (
                  <span className={r.returnRatePct > ECOM_TARGETS.returnRatePct ? 'text-red-600' : 'text-ink-800'}>
                    {pct(r.returnRatePct)}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionTitle
          right={
            (classFilter || categoryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setClassFilter(null)
                  setCategoryFilter(null)
                }}
                className="text-[12px] font-medium text-brand-700"
              >
                Clear filters
              </button>
            )
          }
        >
          {categoryFilter ? `${categoryFilter} SKUs` : 'All SKUs'}
        </SectionTitle>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.values(CLASSES).map((c) => {
            const group = products.rows.filter((r) => r.classification.key === c.key)
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setClassFilter(classFilter === c.key ? null : c.key)}
                aria-pressed={classFilter === c.key}
                className={cx(
                  'card card-pad text-left transition hover:border-ink-300',
                  classFilter === c.key && 'border-ink-900 ring-1 ring-ink-900',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={c.tone} dot>
                    {c.label}
                  </Badge>
                  <span className="tabular text-[13px] font-semibold text-ink-900">{group.length}</span>
                </div>
                <p className="tabular mt-2 text-[15px] font-semibold text-ink-900">
                  {money(group.reduce((s, r) => s + r.contribution, 0), { currency })}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-500">{c.note}</p>
              </button>
            )
          })}
        </div>

        <div className={cx('mt-3 grid grid-cols-1 gap-4', selected && 'xl:grid-cols-3')}>
          <Card className={selected ? 'xl:col-span-2' : ''}>
            <DataTable
              searchable
              searchKeys={['name', 'sku', 'category']}
              searchPlaceholder="Search SKU or name…"
              initialSort={{ key: 'contribution', dir: 'desc' }}
              rows={rows}
              onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
              activeRowKey={selectedId}
              emptyTitle="No SKUs match these filters"
              columns={[
                {
                  key: 'name',
                  label: 'Product',
                  render: (r) => (
                    <div>
                      <p className="font-medium text-ink-900">{r.name}</p>
                      <p className="text-[12px] text-ink-500">
                        {r.sku} · {r.category}
                      </p>
                    </div>
                  ),
                },
                { key: 'units', label: 'Units', align: 'right', render: (r) => num(r.units) },
                { key: 'netRevenue', label: 'Net revenue', align: 'right', render: (r) => money(r.netRevenue, { currency }) },
                {
                  key: 'grossMarginPct',
                  label: 'Gross margin',
                  align: 'right',
                  render: (r) => pct(r.grossMarginPct),
                },
                {
                  key: 'contribution',
                  label: 'Contribution',
                  align: 'right',
                  render: (r) => (
                    <span className={r.contribution < 0 ? 'text-red-600' : 'text-ink-800'}>
                      {money(r.contribution, { currency })}
                    </span>
                  ),
                },
                {
                  key: 'contributionPerUnit',
                  label: 'Per unit',
                  align: 'right',
                  render: (r) => money(r.contributionPerUnit, { currency, decimals: 2 }),
                },
                {
                  key: 'daysCover',
                  label: 'Days cover',
                  align: 'right',
                  render: (r) => (
                    <span className={r.daysCover !== null && r.daysCover < 7 ? 'text-amber-700' : 'text-ink-800'}>
                      {r.daysCover === null ? '—' : r.daysCover.toFixed(1)}
                    </span>
                  ),
                },
                {
                  key: 'classification',
                  label: 'Group',
                  align: 'right',
                  value: (r) => r.classification.label,
                  render: (r) => <Badge tone={r.classification.tone}>{r.classification.label}</Badge>,
                },
              ]}
            />
          </Card>

          {selected && (
            <SkuDetail
              row={selected}
              channelId={channelId}
              range={range}
              currency={currency}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </section>

      <p className="text-[12px] leading-relaxed text-ink-400">
        A SKU is a Winner or a Drag against the median of this list, not a fixed threshold — the split moves with the
        catalogue. Fees and ad spend are allocated by share of revenue, delivery by share of parcel weight.
      </p>
    </div>
  )
}
