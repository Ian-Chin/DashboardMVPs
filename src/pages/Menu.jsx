import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, cx, Segmented, StatRow } from '../components/ui/Primitives.jsx'
import { useMeasure } from '../hooks/useMeasure.js'
import { useMenu, usePeriod } from '../hooks/useMetrics.js'
import { recipeBreakdown } from '../data/demoData.js'
import { fmtRange } from '../lib/date.js'
import { downloadCsv } from '../lib/exporters.js'
import { money, num, pct } from '../lib/format.js'
import { CATEGORY_COLORS } from '../lib/palette.js'
import { useApp } from '../state/AppContext.jsx'

const CLASS_TONE = { star: 'success', plowhorse: 'warning', puzzle: 'info', dog: 'danger' }

const CLASS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'star', label: 'Stars' },
  { value: 'plowhorse', label: 'Plowhorses' },
  { value: 'puzzle', label: 'Puzzles' },
  { value: 'dog', label: 'Dogs' },
]

/** Popularity × margin quadrant — the menu-engineering matrix. */
function MenuMatrix({ rows, avgMarginPct, popularityThreshold, selectedId, onSelect }) {
  const [ref, width] = useMeasure()
  const height = 300
  const pad = { l: 44, r: 16, t: 14, b: 30 }
  const maxPop = Math.max(...rows.map((r) => r.popularityPct), popularityThreshold * 2) * 1.05
  const minMargin = Math.min(...rows.map((r) => r.marginPct), avgMarginPct) - 4
  const maxMargin = Math.max(...rows.map((r) => r.marginPct), avgMarginPct) + 4
  const innerW = Math.max(10, width - pad.l - pad.r)
  const innerH = height - pad.t - pad.b
  const x = (v) => pad.l + (v / maxPop) * innerW
  const y = (v) => pad.t + innerH - ((v - minMargin) / (maxMargin - minMargin || 1)) * innerH
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1)

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block">
          <rect x={pad.l} y={pad.t} width={innerW} height={y(avgMarginPct) - pad.t} fill="#12825b" opacity={0.03} />
          <rect
            x={x(popularityThreshold)}
            y={pad.t}
            width={Math.max(0, pad.l + innerW - x(popularityThreshold))}
            height={innerH}
            fill="#12825b"
            opacity={0.03}
          />
          <line x1={pad.l} x2={width - pad.r} y1={y(avgMarginPct)} y2={y(avgMarginPct)} stroke="#b0b9c8" strokeDasharray="4 3" />
          <line
            x1={x(popularityThreshold)}
            x2={x(popularityThreshold)}
            y1={pad.t}
            y2={height - pad.b}
            stroke="#b0b9c8"
            strokeDasharray="4 3"
          />
          <text x={pad.l + 4} y={pad.t + 12} className="fill-ink-400 text-[10px]">
            Puzzles · high margin, low volume
          </text>
          <text x={width - pad.r - 4} y={pad.t + 12} textAnchor="end" className="fill-brand-600 text-[10px] font-medium">
            Stars · high margin, high volume
          </text>
          <text x={pad.l + 4} y={height - pad.b - 6} className="fill-ink-400 text-[10px]">
            Dogs
          </text>
          <text x={width - pad.r - 4} y={height - pad.b - 6} textAnchor="end" className="fill-amber-600 text-[10px]">
            Plowhorses · high volume, low margin
          </text>
          <text x={pad.l - 8} y={pad.t + 6} textAnchor="end" className="fill-ink-400 text-[10px]">
            {maxMargin.toFixed(0)}%
          </text>
          <text x={pad.l - 8} y={height - pad.b} textAnchor="end" className="fill-ink-400 text-[10px]">
            {minMargin.toFixed(0)}%
          </text>
          <text x={width / 2} y={height - 6} textAnchor="middle" className="fill-ink-400 text-[10px]">
            Share of units sold →
          </text>

          {rows.map((r) => {
            const radius = 4 + (r.revenue / maxRevenue) * 12
            const active = selectedId === r.id
            return (
              <g key={r.id} onClick={() => onSelect(r.id)} className="cursor-pointer">
                <circle
                  cx={x(r.popularityPct)}
                  cy={y(r.marginPct)}
                  r={radius}
                  fill={CATEGORY_COLORS[r.category]}
                  opacity={active ? 0.95 : 0.45}
                  stroke={active ? '#0f1319' : 'white'}
                  strokeWidth={active ? 2 : 1}
                />
                {(radius > 11 || active) && (
                  <text
                    x={x(r.popularityPct)}
                    y={y(r.marginPct) - radius - 4}
                    textAnchor="middle"
                    className="fill-ink-700 text-[10px] font-medium"
                  >
                    {r.name.length > 18 ? `${r.name.slice(0, 17)}…` : r.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

function ItemDetail({ row, onClose }) {
  const { currency, range } = useApp()
  const lines = useMemo(() => recipeBreakdown(row.id, range.to), [row.id, range.to])
  const plateCost = lines.reduce((s, l) => s + l.cost, 0)

  return (
    <Card className="sticky top-20">
      <CardHeader
        title={row.name}
        subtitle={`${row.category} · ${row.station}`}
        right={
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
            <X size={15} />
          </button>
        }
      />
      <div className="card-pad">
        <div className="mb-3 flex items-center gap-2">
          <Badge tone={CLASS_TONE[row.classification.key]} dot>
            {row.classification.label}
          </Badge>
          <span className="text-[12px] text-ink-500">{row.classification.blurb}</span>
        </div>

        <StatRow label="Menu price" value={money(row.price, { currency, decimals: 2 })} />
        <StatRow label="Plate cost (today)" value={money(plateCost, { currency, decimals: 2 })} />
        <StatRow label="Gross profit per unit" value={money(row.price - plateCost, { currency, decimals: 2 })} strong />
        <StatRow label="Margin" value={pct(row.marginPct)} border />
        <StatRow label="Units sold" value={num(row.units)} />
        <StatRow label="Revenue" value={money(row.revenue, { currency })} />
        <StatRow label="Period gross profit" value={money(row.profit, { currency })} strong />
        <StatRow
          label="Plate cost drift"
          value={`${row.plateCostDriftPct >= 0 ? '+' : ''}${row.plateCostDriftPct.toFixed(1)}%`}
          tone={row.plateCostDriftPct > 3 ? 'danger' : undefined}
          border
        />
        <StatRow label="Last price change" value={row.priceChangedAt} />

        <p className="mt-4 mb-2 section-title">Recipe cost</p>
        <div className="rounded-lg border border-ink-200/70">
          {lines.map((l) => (
            <div key={l.ingredientId} className="flex items-center justify-between border-b border-ink-100 px-3 py-1.5 last:border-0">
              <span className="text-[12px] text-ink-700">
                {l.name}
                <span className="ml-1.5 text-ink-400">
                  {l.qty < 1 ? l.qty.toFixed(3) : l.qty.toFixed(2)} {l.unit}
                </span>
              </span>
              <span className="tabular text-[12px] font-medium text-ink-900">
                {money(l.cost, { currency, decimals: 2 })}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50 p-3">
          <p className="text-[13px] font-semibold text-ink-900">{row.action.label}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{row.action.detail}</p>
        </div>
      </div>
    </Card>
  )
}

export default function Menu() {
  const { currency, range, scopeLabel } = useApp()
  const menu = useMenu()
  const { current } = usePeriod()
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const rows = filter === 'all' ? menu.rows : menu.rows.filter((r) => r.classification.key === filter)
  const selected = menu.rows.find((r) => r.id === selectedId)

  const counts = useMemo(
    () =>
      menu.rows.reduce((acc, r) => {
        acc[r.classification.key] = (acc[r.classification.key] || 0) + 1
        return acc
      }, {}),
    [menu.rows],
  )

  const belowAverage = menu.rows.filter((r) => r.marginPct < menu.avgMarginPct)

  const exportCsv = () =>
    downloadCsv(
      `costwise-menu-performance-${range.from}-to-${range.to}`,
      [
        { key: 'name', label: 'Item' },
        { key: 'category', label: 'Category' },
        { key: 'units', label: 'Units sold' },
        { key: 'revenue', label: `Revenue (${currency})`, map: (r) => r.revenue.toFixed(2) },
        { key: 'cost', label: `Ingredient cost (${currency})`, map: (r) => r.cost.toFixed(2) },
        { key: 'profit', label: `Gross profit (${currency})`, map: (r) => r.profit.toFixed(2) },
        { key: 'marginPct', label: 'Margin %', map: (r) => r.marginPct.toFixed(1) },
        { key: 'popularityPct', label: 'Share of units %', map: (r) => r.popularityPct.toFixed(2) },
        { key: 'classification', label: 'Classification', map: (r) => r.classification.label },
        { key: 'action', label: 'Recommended action', map: (r) => r.action.label },
      ],
      menu.rows,
      [
        ['Report', 'Menu performance'],
        ['Scope', scopeLabel],
        ['Period', fmtRange(range.from, range.to)],
        ['Menu average margin %', menu.avgMarginPct.toFixed(1)],
      ],
    )

  return (
    <div className="space-y-6">
      <PageHeader title="Menu profitability" description="Menu engineering" onExportCsv={exportCsv} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Menu gross profit"
          value={money(menu.totalProfit, { currency })}
          delta={null}
          footnote="Average margin"
          target={pct(menu.avgMarginPct)}
        />
        <KpiCard
          label="Stars"
          value={`${counts.star || 0} items`}
          delta={null}
          footnote="Share of gross profit"
          target={pct(
            (menu.rows.filter((r) => r.classification.key === 'star').reduce((s, r) => s + r.profit, 0) /
              (menu.totalProfit || 1)) *
              100,
            0,
          )}
        />
        <KpiCard
          label="Below average margin"
          value={`${belowAverage.length} items`}
          delta={null}
          footnote="Revenue at stake"
          target={money(belowAverage.reduce((s, r) => s + r.revenue, 0), { currency })}
        />
        <KpiCard
          label="Items sold"
          value={num(current.units)}
          delta={null}
          footnote="Across"
          target={`${menu.rows.length} menu items`}
        />
      </div>

      <Card>
        <CardHeader
          title="Menu engineering matrix"
          subtitle={`Split at the ${pct(menu.avgMarginPct, 0)} menu average margin and a ${menu.popularityThreshold.toFixed(1)}% unit-share line. Bubble size is revenue.`}
        />
        <div className="card-pad">
          <MenuMatrix
            rows={menu.rows}
            avgMarginPct={menu.avgMarginPct}
            popularityThreshold={menu.popularityThreshold}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(CATEGORY_COLORS).map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className={cx('grid grid-cols-1 gap-4', selected && 'xl:grid-cols-3')}>
        <Card className={selected ? 'xl:col-span-2' : ''}>
          <CardHeader
            title="Every menu item"
            subtitle="Click a row for the recipe breakdown"
            right={<Segmented size="sm" options={CLASS_FILTERS} value={filter} onChange={setFilter} />}
          />
          <DataTable
            rows={rows}
            searchable
            searchKeys={['name', 'category']}
            searchPlaceholder="Search menu items…"
            initialSort={{ key: 'profit', dir: 'desc' }}
            onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
            activeRowKey={selectedId}
            columns={[
              {
                key: 'name',
                label: 'Item',
                render: (r) => (
                  <div>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">{r.category}</p>
                  </div>
                ),
              },
              { key: 'units', label: 'Units', align: 'right', render: (r) => num(r.units) },
              { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => money(r.revenue, { currency }) },
              { key: 'cost', label: 'Ingredient cost', align: 'right', render: (r) => money(r.cost, { currency }) },
              { key: 'profit', label: 'Gross profit', align: 'right', render: (r) => money(r.profit, { currency }) },
              {
                key: 'marginPct',
                label: 'Margin',
                align: 'right',
                render: (r) => (
                  <span className={r.marginPct < menu.avgMarginPct ? 'font-medium text-amber-700' : 'font-medium text-ink-900'}>
                    {pct(r.marginPct, 0)}
                  </span>
                ),
              },
              {
                key: 'popularityPct',
                label: 'Popularity',
                align: 'right',
                render: (r) => pct(r.popularityPct, 1),
              },
              {
                key: 'classification',
                label: 'Class',
                value: (r) => r.classification.label,
                render: (r) => (
                  <Badge tone={CLASS_TONE[r.classification.key]} dot>
                    {r.classification.label}
                  </Badge>
                ),
              },
              {
                key: 'action',
                label: 'Recommended action',
                sortable: false,
                render: (r) => <span className="text-[13px] text-ink-600">{r.action.label}</span>,
              },
            ]}
          />
        </Card>

        {selected && <ItemDetail row={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  )
}
