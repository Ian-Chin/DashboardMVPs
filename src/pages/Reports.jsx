import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { Badge, Card, CardHeader, cx } from '../components/ui/Primitives.jsx'
import { useInventory, useLabor, useMenu, useOutlets, usePeriod, usePurchasing } from '../hooks/useMetrics.js'
import { ingredients, MENU_CATEGORIES, outletById, suppliers } from '../data/catalog.js'
import { fmtDateLong, fmtRange, monthKey, startOfWeek } from '../lib/date.js'
import { downloadCsv, exportPdf } from '../lib/exporters.js'
import { money, num, pct } from '../lib/format.js'
import { useApp } from '../state/AppContext.jsx'

const INGREDIENT_CATEGORIES = [...new Set(ingredients.map((i) => i.category))]

function groupDaily(daily, keyFn, labelFn) {
  const map = new Map()
  for (const d of daily) {
    const key = keyFn(d.date)
    let g = map.get(key)
    if (!g) map.set(key, (g = { id: key, label: labelFn(key), net: 0, gross: 0, discount: 0, refund: 0, orders: 0, foodCost: 0, laborCost: 0, opex: 0, days: 0 }))
    g.net += d.net
    g.gross += d.gross
    g.discount += d.discount
    g.refund += d.refund
    g.orders += d.orders
    g.foodCost += d.foodCost
    g.laborCost += d.laborCost
    g.opex += d.opex
    g.days += 1
  }
  return [...map.values()].map((g) => ({
    ...g,
    grossProfit: g.net - g.foodCost,
    operatingProfit: g.net - g.foodCost - g.laborCost - g.opex,
    foodCostPct: g.net ? (g.foodCost / g.net) * 100 : 0,
    laborCostPct: g.net ? (g.laborCost / g.net) * 100 : 0,
    grossMarginPct: g.net ? ((g.net - g.foodCost) / g.net) * 100 : 0,
    operatingMarginPct: g.net ? ((g.net - g.foodCost - g.laborCost - g.opex) / g.net) * 100 : 0,
    aov: g.orders ? g.net / g.orders : 0,
  }))
}

export default function Reports() {
  const { currency, range, scopeLabel } = useApp()
  const { current } = usePeriod()
  const menu = useMenu()
  const inv = useInventory()
  const labor = useLabor()
  const purch = usePurchasing()
  const outletCmp = useOutlets()

  const [reportKey, setReportKey] = useState('daily-sales')
  const [menuCategory, setMenuCategory] = useState('all')
  const [ingredientCategory, setIngredientCategory] = useState('all')
  const [supplierId, setSupplierId] = useState('all')

  const m = (v, d = 0) => money(v, { currency, decimals: d })

  const reports = useMemo(() => {
    const daily = current.daily

    return {
      'daily-sales': {
        label: 'Daily sales report',
        description: 'Sales, orders and cost ratios for every trading day.',
        filters: [],
        columns: [
          { key: 'date', label: 'Date', render: (r) => fmtDateLong(r.date), csv: (r) => r.date },
          { key: 'orders', label: 'Orders', align: 'right', render: (r) => num(r.orders) },
          { key: 'gross', label: 'Gross sales', align: 'right', render: (r) => m(r.gross) },
          { key: 'discount', label: 'Discounts', align: 'right', render: (r) => `−${m(r.discount)}` },
          { key: 'refund', label: 'Refunds', align: 'right', render: (r) => `−${m(r.refund)}` },
          { key: 'net', label: 'Net sales', align: 'right', render: (r) => m(r.net) },
          { key: 'aov', label: 'AOV', align: 'right', value: (r) => (r.orders ? r.net / r.orders : 0), render: (r) => m(r.orders ? r.net / r.orders : 0, 2) },
          { key: 'foodCostPct', label: 'Food %', align: 'right', render: (r) => pct(r.foodCostPct) },
          { key: 'laborCostPct', label: 'Labour %', align: 'right', render: (r) => pct(r.laborCostPct) },
          { key: 'grossProfit', label: 'Gross profit', align: 'right', render: (r) => m(r.grossProfit) },
          { key: 'operatingProfit', label: 'Operating profit', align: 'right', render: (r) => m(r.operatingProfit) },
        ],
        rows: daily.map((d) => ({ ...d, id: d.date })),
      },

      'weekly-profitability': {
        label: 'Weekly profitability report',
        description: 'Week-by-week margin, cost ratios and operating profit.',
        filters: [],
        columns: [
          { key: 'label', label: 'Week beginning' },
          { key: 'days', label: 'Days', align: 'right' },
          { key: 'net', label: 'Net sales', align: 'right', render: (r) => m(r.net) },
          { key: 'foodCostPct', label: 'Food %', align: 'right', render: (r) => pct(r.foodCostPct) },
          { key: 'laborCostPct', label: 'Labour %', align: 'right', render: (r) => pct(r.laborCostPct) },
          { key: 'grossProfit', label: 'Gross profit', align: 'right', render: (r) => m(r.grossProfit) },
          { key: 'grossMarginPct', label: 'Gross margin', align: 'right', render: (r) => pct(r.grossMarginPct) },
          { key: 'operatingProfit', label: 'Operating profit', align: 'right', render: (r) => m(r.operatingProfit) },
          { key: 'operatingMarginPct', label: 'Operating margin', align: 'right', render: (r) => pct(r.operatingMarginPct) },
        ],
        rows: groupDaily(daily, startOfWeek, (k) => fmtDateLong(k)),
      },

      'monthly-profitability': {
        label: 'Monthly profitability report',
        description: 'Monthly P&L summary for the selected scope.',
        filters: [],
        columns: [
          { key: 'label', label: 'Month' },
          { key: 'days', label: 'Days', align: 'right' },
          { key: 'net', label: 'Net sales', align: 'right', render: (r) => m(r.net) },
          { key: 'foodCost', label: 'Food cost', align: 'right', render: (r) => m(r.foodCost) },
          { key: 'laborCost', label: 'Labour', align: 'right', render: (r) => m(r.laborCost) },
          { key: 'opex', label: 'Operating costs', align: 'right', render: (r) => m(r.opex) },
          { key: 'operatingProfit', label: 'Operating profit', align: 'right', render: (r) => m(r.operatingProfit) },
          { key: 'operatingMarginPct', label: 'Margin', align: 'right', render: (r) => pct(r.operatingMarginPct) },
        ],
        rows: groupDaily(daily, monthKey, (k) =>
          new Date(`${k}-01T00:00:00`).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' }),
        ),
      },

      'inventory-variance': {
        label: 'Inventory variance report',
        description: 'Expected versus actual usage, with the cost of the gap.',
        filters: ['ingredientCategory', 'supplier'],
        columns: [
          { key: 'name', label: 'Ingredient' },
          { key: 'category', label: 'Category' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'expected', label: 'Expected', align: 'right', render: (r) => `${num(r.expected, 1)} ${r.unit}` },
          { key: 'actual', label: 'Actual', align: 'right', render: (r) => `${num(r.actual, 1)} ${r.unit}` },
          { key: 'variance', label: 'Variance', align: 'right', render: (r) => `+${num(r.variance, 1)} ${r.unit}` },
          { key: 'variancePct', label: 'Variance %', align: 'right', render: (r) => pct(r.variancePct) },
          { key: 'varianceCost', label: 'Estimated loss', align: 'right', render: (r) => m(r.varianceCost, 2) },
          { key: 'wasteCost', label: 'Waste cost', align: 'right', render: (r) => m(r.wasteCost, 2) },
        ],
        rows: inv.rows.filter(
          (r) =>
            (ingredientCategory === 'all' || r.category === ingredientCategory) &&
            (supplierId === 'all' || r.supplierId === supplierId),
        ),
      },

      'food-cost': {
        label: 'Food cost report',
        description: 'Ingredient spend by category against net sales.',
        filters: ['ingredientCategory'],
        columns: [
          { key: 'category', label: 'Ingredient category' },
          { key: 'items', label: 'Items', align: 'right' },
          { key: 'usageCost', label: 'Usage cost', align: 'right', render: (r) => m(r.usageCost) },
          { key: 'wasteCost', label: 'Waste', align: 'right', render: (r) => m(r.wasteCost) },
          { key: 'varianceCost', label: 'Variance', align: 'right', render: (r) => m(r.varianceCost) },
          { key: 'purchaseValue', label: 'Purchased', align: 'right', render: (r) => m(r.purchaseValue) },
          { key: 'stockValue', label: 'Stock on hand', align: 'right', render: (r) => m(r.stockValue) },
          { key: 'pctOfSales', label: '% of net sales', align: 'right', render: (r) => pct(r.pctOfSales) },
        ],
        rows: Object.values(
          inv.rows
            .filter((r) => ingredientCategory === 'all' || r.category === ingredientCategory)
            .reduce((acc, r) => {
              const g = (acc[r.category] ||= {
                id: r.category,
                category: r.category,
                items: 0,
                usageCost: 0,
                wasteCost: 0,
                varianceCost: 0,
                purchaseValue: 0,
                stockValue: 0,
              })
              g.items += 1
              g.usageCost += r.usageCost
              g.wasteCost += r.wasteCost
              g.varianceCost += r.varianceCost
              g.purchaseValue += r.purchaseValue
              g.stockValue += r.stockValue
              return acc
            }, {}),
        ).map((g) => ({ ...g, pctOfSales: current.revenue.net ? (g.usageCost / current.revenue.net) * 100 : 0 })),
      },

      labor: {
        label: 'Labor report',
        description: 'Hours, overtime and cost by employee.',
        filters: [],
        columns: [
          { key: 'name', label: 'Employee' },
          { key: 'role', label: 'Role' },
          { key: 'outlet', label: 'Outlet', value: (r) => outletById[r.outletId]?.shortName, render: (r) => outletById[r.outletId]?.shortName },
          { key: 'days', label: 'Shifts', align: 'right' },
          { key: 'hours', label: 'Hours', align: 'right', render: (r) => num(r.hours, 1) },
          { key: 'otHours', label: 'Overtime', align: 'right', render: (r) => num(r.otHours, 1) },
          { key: 'hourlyRate', label: 'Rate', align: 'right', render: (r) => m(r.hourlyRate, 2) },
          { key: 'cost', label: 'Cost', align: 'right', render: (r) => m(r.cost) },
          { key: 'costShare', label: 'Share', align: 'right', render: (r) => pct(r.costShare) },
        ],
        rows: labor.employees,
      },

      'menu-performance': {
        label: 'Menu performance report',
        description: 'Units, revenue, margin and classification per item.',
        filters: ['menuCategory'],
        columns: [
          { key: 'name', label: 'Item' },
          { key: 'category', label: 'Category' },
          { key: 'units', label: 'Units', align: 'right', render: (r) => num(r.units) },
          { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => m(r.revenue) },
          { key: 'cost', label: 'Ingredient cost', align: 'right', render: (r) => m(r.cost) },
          { key: 'profit', label: 'Gross profit', align: 'right', render: (r) => m(r.profit) },
          { key: 'marginPct', label: 'Margin', align: 'right', render: (r) => pct(r.marginPct) },
          {
            key: 'classification',
            label: 'Class',
            value: (r) => r.classification.label,
            render: (r) => <Badge tone={{ star: 'success', plowhorse: 'warning', puzzle: 'info', dog: 'danger' }[r.classification.key]}>{r.classification.label}</Badge>,
            csv: (r) => r.classification.label,
          },
          { key: 'action', label: 'Action', sortable: false, render: (r) => r.action.label, csv: (r) => r.action.label },
        ],
        rows: menu.rows.filter((r) => menuCategory === 'all' || r.category === menuCategory),
      },

      'supplier-spending': {
        label: 'Supplier spending report',
        description: 'Spend, price movement and cheaper alternatives.',
        filters: ['supplier'],
        columns: [
          { key: 'name', label: 'Ingredient' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'qty', label: 'Quantity', align: 'right', render: (r) => `${num(r.qty, 1)} ${r.unit}` },
          { key: 'previousPrice', label: 'Previous', align: 'right', render: (r) => m(r.previousPrice, 2) },
          { key: 'currentPrice', label: 'Current', align: 'right', render: (r) => m(r.currentPrice, 2) },
          { key: 'changePct', label: 'Change', align: 'right', render: (r) => pct(r.changePct) },
          { key: 'spend', label: 'Spend', align: 'right', render: (r) => m(r.spend) },
          {
            key: 'saving',
            label: 'Potential saving',
            align: 'right',
            value: (r) => r.alternative?.periodSaving ?? 0,
            render: (r) => (r.alternative?.saving > 0 ? m(r.alternative.periodSaving) : '—'),
            csv: (r) => (r.alternative?.periodSaving ?? 0).toFixed(2),
          },
        ],
        rows: purch.ingredientRows.filter((r) => supplierId === 'all' || r.supplierId === supplierId),
      },

      'outlet-comparison': {
        label: 'Outlet comparison report',
        description: 'Every outlet side by side for the same period.',
        filters: [],
        columns: [
          { key: 'name', label: 'Outlet' },
          { key: 'revenue', label: 'Net sales', align: 'right', render: (r) => m(r.revenue) },
          { key: 'grossProfit', label: 'Gross profit', align: 'right', render: (r) => m(r.grossProfit) },
          { key: 'operatingProfit', label: 'Operating profit', align: 'right', render: (r) => m(r.operatingProfit) },
          { key: 'operatingMarginPct', label: 'Margin', align: 'right', render: (r) => pct(r.operatingMarginPct) },
          { key: 'foodCostPct', label: 'Food %', align: 'right', render: (r) => pct(r.foodCostPct) },
          { key: 'laborCostPct', label: 'Labour %', align: 'right', render: (r) => pct(r.laborCostPct) },
          { key: 'orders', label: 'Orders', align: 'right', render: (r) => num(r.orders) },
          { key: 'aov', label: 'AOV', align: 'right', render: (r) => m(r.aov, 2) },
        ],
        rows: outletCmp.rows,
      },
    }
  }, [current, inv, labor, menu, purch, outletCmp, ingredientCategory, menuCategory, supplierId, currency])

  const report = reports[reportKey]

  const exportCsv = () =>
    downloadCsv(
      `costwise-${reportKey}-${range.from}-to-${range.to}`,
      report.columns.map((c) => ({
        key: c.key,
        label: c.label,
        map: c.csv || (c.value ? (r) => c.value(r) : (r) => r[c.key]),
      })),
      report.rows,
      [
        ['Report', report.label],
        ['Scope', scopeLabel],
        ['Period', fmtRange(range.from, range.to)],
        ['Generated', new Date().toLocaleString('en-MY')],
      ],
    )

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Export-ready views" onExportCsv={exportCsv} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="no-print space-y-1.5 xl:col-span-1">
          {Object.entries(reports).map(([key, r]) => (
            <button
              key={key}
              type="button"
              onClick={() => setReportKey(key)}
              className={cx(
                'flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition',
                key === reportKey
                  ? 'border-ink-900 bg-ink-950 text-white'
                  : 'border-ink-200 bg-white text-ink-800 hover:border-ink-300',
              )}
            >
              <FileText size={15} className={cx('mt-0.5 shrink-0', key === reportKey ? 'text-brand-400' : 'text-ink-400')} />
              <span>
                <span className="block text-[13px] font-medium">{r.label}</span>
                <span className={cx('mt-0.5 block text-[12px]', key === reportKey ? 'text-ink-300' : 'text-ink-500')}>
                  {r.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        <Card className="xl:col-span-3">
          <CardHeader
            title={report.label}
            subtitle={`${scopeLabel} · ${fmtRange(range.from, range.to)} · ${report.rows.length} rows`}
            right={
              <div className="no-print flex flex-wrap items-center gap-2">
                {report.filters.includes('menuCategory') && (
                  <select value={menuCategory} onChange={(e) => setMenuCategory(e.target.value)} className="input py-1.5 text-[13px]">
                    <option value="all">All categories</option>
                    {MENU_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                {report.filters.includes('ingredientCategory') && (
                  <select
                    value={ingredientCategory}
                    onChange={(e) => setIngredientCategory(e.target.value)}
                    className="input py-1.5 text-[13px]"
                  >
                    <option value="all">All categories</option>
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                {report.filters.includes('supplier') && (
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input py-1.5 text-[13px]">
                    <option value="all">All suppliers</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <button type="button" onClick={exportCsv} className="btn-ghost btn-sm">
                  CSV
                </button>
                <button type="button" onClick={exportPdf} className="btn-ghost btn-sm">
                  PDF
                </button>
              </div>
            }
          />
          <DataTable
            rows={report.rows}
            columns={report.columns}
            rowKey={(r) => r.id ?? r.name ?? r.date ?? r.label}
            dense
            maxHeight="65vh"
            emptyTitle="No rows for these filters"
          />
        </Card>
      </div>

      <Card className="card-pad text-[12px] text-ink-500">
        Reports respect the outlet and date range in the top bar. CSV opens in Excel or Google Sheets; PDF uses your
        browser's print dialog — choose “Save as PDF”.
      </Card>
    </div>
  )
}
