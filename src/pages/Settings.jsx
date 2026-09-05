import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { Badge, Card, CardHeader, cx, Segmented } from '../components/ui/Primitives.jsx'
import { ingredients, ROLE_PERMISSIONS } from '../data/catalog.js'
import { money, pct } from '../lib/format.js'
import { DEFAULT_THRESHOLDS, RULE_BOOK } from '../lib/rules.js'
import { useApp } from '../state/AppContext.jsx'

const TABS = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'thresholds', label: 'Alert rules' },
  { value: 'outlets', label: 'Outlets' },
  { value: 'stock', label: 'Stock levels' },
  { value: 'users', label: 'Users' },
]

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-500">{hint}</span>}
    </label>
  )
}

function NumberField({ label, hint, value, onChange, suffix, step = 0.5, min = 0 }) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input pr-12"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-400">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  )
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
      <div>
        <p className="text-[13px] font-medium text-ink-800">{label}</p>
        {hint && <p className="text-[12px] text-ink-500">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-5 w-9 shrink-0 rounded-full transition',
          checked ? 'bg-brand-500' : 'bg-ink-200',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

function RestaurantTab() {
  const { company, updateCompany } = useApp()
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Company" subtitle="Shown on every report and export" />
        <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company name">
            <input className="input" value={company.name} onChange={(e) => updateCompany({ name: e.target.value })} />
          </Field>
          <Field label="Legal entity">
            <input className="input" value={company.legalName} onChange={(e) => updateCompany({ legalName: e.target.value })} />
          </Field>
          <Field label="Registration no.">
            <input className="input" value={company.registrationNo} readOnly />
          </Field>
          <Field label="Currency">
            <select className="input" value={company.currency} onChange={(e) => updateCompany({ currency: e.target.value })}>
              {['RM', 'S$', '$', '฿', 'Rp'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Timezone">
            <input className="input" value={company.timezone} readOnly />
          </Field>
          <Field label="Locale">
            <input className="input" value={company.locale} readOnly />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Tax & trading hours" />
        <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tax label">
            <input className="input" value={company.taxLabel} onChange={(e) => updateCompany({ taxLabel: e.target.value })} />
          </Field>
          <Field label="Tax rate" hint="Applied to taxable sales in exports.">
            <input
              type="number"
              step="0.5"
              className="input"
              value={company.taxRate}
              onChange={(e) => updateCompany({ taxRate: Number(e.target.value) })}
            />
          </Field>
          <Field label="Opening time">
            <input
              type="time"
              className="input"
              value={company.businessHours.open}
              onChange={(e) => updateCompany({ businessHours: { ...company.businessHours, open: e.target.value } })}
            />
          </Field>
          <Field label="Closing time">
            <input
              type="time"
              className="input"
              value={company.businessHours.close}
              onChange={(e) => updateCompany({ businessHours: { ...company.businessHours, close: e.target.value } })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Toggle
              label="Menu prices include tax"
              hint="Turn off if your POS adds tax at the till."
              checked={company.taxInclusivePricing}
              onChange={(v) => updateCompany({ taxInclusivePricing: v })}
            />
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="POS connection" subtitle="Costwise reads from your POS. It never replaces it" />
        <div className="card-pad flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[12px] uppercase tracking-wide text-ink-500">Provider</p>
            <p className="text-[14px] font-medium text-ink-900">{company.posProvider}</p>
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wide text-ink-500">Last sync</p>
            <p className="text-[14px] font-medium text-ink-900">{company.posLastSync}</p>
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wide text-ink-500">Syncing</p>
            <p className="text-[14px] font-medium text-ink-900">Sales, items, discounts, refunds, rosters</p>
          </div>
          <Badge tone="success" dot className="ml-auto">
            Connected
          </Badge>
        </div>
      </Card>
    </div>
  )
}

function ThresholdsTab() {
  const { thresholds, updateThresholds, dismissedCount, restoreAlerts, currency } = useApp()
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Alert thresholds"
          subtitle="Every alert on the dashboard is one of these comparisons. Changing a number re-runs the rules immediately."
          right={
            <button
              type="button"
              onClick={() => updateThresholds(DEFAULT_THRESHOLDS)}
              className="btn-ghost btn-sm"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          }
        />
        <div className="card-pad grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <NumberField
            label="Target food cost"
            suffix="%"
            value={thresholds.foodCostPct}
            onChange={(v) => updateThresholds({ foodCostPct: v })}
          />
          <NumberField
            label="Target labour cost"
            suffix="%"
            value={thresholds.laborCostPct}
            onChange={(v) => updateThresholds({ laborCostPct: v })}
          />
          <NumberField
            label="Target gross margin"
            suffix="%"
            value={thresholds.grossMarginPct}
            onChange={(v) => updateThresholds({ grossMarginPct: v })}
          />
          <NumberField
            label="Waste ceiling"
            suffix="% of sales"
            step={0.1}
            value={thresholds.wastePctOfRevenue}
            onChange={(v) => updateThresholds({ wastePctOfRevenue: v })}
          />
          <NumberField
            label="Variance alert (value)"
            suffix={currency}
            step={25}
            value={thresholds.varianceCostAlert}
            onChange={(v) => updateThresholds({ varianceCostAlert: v })}
          />
          <NumberField
            label="Variance alert (per item)"
            suffix="%"
            step={0.5}
            value={thresholds.variancePctAlert}
            onChange={(v) => updateThresholds({ variancePctAlert: v })}
          />
          <NumberField
            label="Supplier price increase"
            suffix="%"
            step={0.5}
            value={thresholds.priceIncreasePct}
            onChange={(v) => updateThresholds({ priceIncreasePct: v })}
          />
          <NumberField
            label="Savings alert"
            suffix={currency}
            step={25}
            value={thresholds.savingsAlert}
            onChange={(v) => updateThresholds({ savingsAlert: v })}
          />
          <NumberField
            label="Discount guideline"
            suffix="% of gross"
            step={0.5}
            value={thresholds.discountPctOfRevenue}
            onChange={(v) => updateThresholds({ discountPctOfRevenue: v })}
          />
          <NumberField
            label="Overtime share"
            suffix="% of labour"
            step={0.5}
            value={thresholds.overtimeSharePct}
            onChange={(v) => updateThresholds({ overtimeSharePct: v })}
          />
          <NumberField
            label="Monthly profit target"
            suffix={currency}
            step={1000}
            value={thresholds.monthlyProfitTarget}
            onChange={(v) => updateThresholds({ monthlyProfitTarget: v })}
          />
        </div>

        <div className="border-t border-ink-200/70 px-4 pb-4 sm:px-5">
          <p className="mb-1 mt-3 section-title">Inventory alert types</p>
          <Toggle
            label="Low stock"
            hint="Fires when on-hand quantity drops below the minimum level."
            checked={thresholds.lowStockEnabled}
            onChange={(v) => updateThresholds({ lowStockEnabled: v })}
          />
          <Toggle
            label="Near expiry"
            hint="Short shelf-life stock approaching its use-by window."
            checked={thresholds.expiryEnabled}
            onChange={(v) => updateThresholds({ expiryEnabled: v })}
          />
          <Toggle
            label="Excess inventory"
            hint="More than 21 days of cover and over twice the minimum level."
            checked={thresholds.excessStockEnabled}
            onChange={(v) => updateThresholds({ excessStockEnabled: v })}
          />
        </div>

        {dismissedCount > 0 && (
          <div className="flex items-center justify-between border-t border-ink-200/70 px-4 py-3 sm:px-5">
            <p className="text-[13px] text-ink-600">{dismissedCount} alert(s) dismissed in this browser.</p>
            <button type="button" onClick={restoreAlerts} className="btn-ghost btn-sm">
              Restore all
            </button>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Rule book" subtitle="What triggers each alert" />
        <div className="max-h-[620px] overflow-y-auto divide-y divide-ink-100">
          {RULE_BOOK.map((r) => (
            <div key={r.id} className="px-4 py-2.5 sm:px-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-ink-900">{r.category}</p>
                <Badge tone="neutral">{r.severity}</Badge>
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-600">{r.rule}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function OutletsTab() {
  const { outlets, updateOutlet, currency } = useApp()
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {outlets.map((o) => (
        <Card key={o.id}>
          <CardHeader
            title={o.name}
            subtitle={`${o.address} · opened ${o.openedAt}`}
            right={<Badge tone="neutral">{o.code}</Badge>}
          />
          <div className="card-pad grid grid-cols-2 gap-4">
            <Field label="Outlet name">
              <input className="input" value={o.name} onChange={(e) => updateOutlet(o.id, { name: e.target.value })} />
            </Field>
            <Field label="City">
              <input className="input" value={o.city} onChange={(e) => updateOutlet(o.id, { city: e.target.value })} />
            </Field>
            <NumberField
              label="Target food cost"
              suffix="%"
              value={o.targetFoodCostPct}
              onChange={(v) => updateOutlet(o.id, { targetFoodCostPct: v })}
            />
            <NumberField
              label="Target labour cost"
              suffix="%"
              value={o.targetLaborCostPct}
              onChange={(v) => updateOutlet(o.id, { targetLaborCostPct: v })}
            />
            <NumberField
              label="Target gross margin"
              suffix="%"
              value={o.targetGrossMarginPct}
              onChange={(v) => updateOutlet(o.id, { targetGrossMarginPct: v })}
            />
            <NumberField
              label="Monthly rent"
              suffix={currency}
              step={100}
              value={o.rentMonthly}
              onChange={(v) => updateOutlet(o.id, { rentMonthly: v })}
            />
            <Field label="Opening time">
              <input
                type="time"
                className="input"
                value={o.hours.open}
                onChange={(e) => updateOutlet(o.id, { hours: { ...o.hours, open: e.target.value } })}
              />
            </Field>
            <Field label="Closing time">
              <input
                type="time"
                className="input"
                value={o.hours.close}
                onChange={(e) => updateOutlet(o.id, { hours: { ...o.hours, close: e.target.value } })}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2.5 text-[12px] text-ink-500 sm:px-5">
            <span>Manager: {o.manager}</span>
            <span>
              {o.seats} seats · rent {money(o.rentMonthly, { currency })}/mo
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function StockTab() {
  const { currency } = useApp()
  const [query, setQuery] = useState('')
  const rows = ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <Card>
      <CardHeader
        title="Minimum stock levels"
        subtitle="Per outlet. Low-stock alerts compare on-hand quantity against these numbers."
      />
      <div className="border-b border-ink-200/70 px-4 py-2.5 sm:px-5">
        <input
          className="input max-w-xs"
          placeholder="Search ingredients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <DataTable
        rows={rows}
        dense
        initialSort={{ key: 'name', dir: 'asc' }}
        columns={[
          { key: 'name', label: 'Ingredient' },
          { key: 'category', label: 'Category' },
          { key: 'unit', label: 'Unit' },
          { key: 'minStock', label: 'Minimum level', align: 'right', render: (r) => `${r.minStock} ${r.unit}` },
          { key: 'shelfLifeDays', label: 'Shelf life', align: 'right', render: (r) => `${r.shelfLifeDays} d` },
          { key: 'cost', label: 'Baseline cost', align: 'right', render: (r) => money(r.cost, { currency, decimals: 2 }) },
        ]}
      />
    </Card>
  )
}

function UsersTab() {
  const { users, updateUser } = useApp()
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="User management" subtitle="Roles decide what each person can see and change" />
        <DataTable
          rows={users}
          columns={[
            {
              key: 'name',
              label: 'User',
              render: (r) => (
                <div>
                  <p className="font-medium text-ink-900">{r.name}</p>
                  <p className="text-[12px] text-ink-500">{r.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              label: 'Role',
              render: (r) => (
                <select
                  value={r.role}
                  onChange={(e) => updateUser(r.id, { role: e.target.value })}
                  className="input py-1.5 text-[13px]"
                >
                  {ROLE_PERMISSIONS.map((p) => (
                    <option key={p.role} value={p.role}>
                      {p.role}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              key: 'outletIds',
              label: 'Scope',
              sortable: false,
              render: (r) => (r.outletIds === 'all' ? 'All outlets' : `${r.outletIds.length} outlet`),
            },
            { key: 'lastActive', label: 'Last active' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Badge tone={r.status === 'active' ? 'success' : 'warning'} dot>
                  {r.status}
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Role permissions" />
        <div className="divide-y divide-ink-100">
          {ROLE_PERMISSIONS.map((p) => (
            <div key={p.role} className="px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink-900">{p.role}</p>
                <span className="text-[12px] text-ink-500">{p.scope}</span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {p.abilities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-[12px] text-ink-600">
                    <span className="h-1 w-1 rounded-full bg-ink-300" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('restaurant')
  const { thresholds } = useApp()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Company, thresholds, outlets and users"
        showPrint={false}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[12px] font-medium text-brand-700">
            <Save size={13} />
            Saved automatically
          </span>
        }
      />

      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === 'restaurant' && <RestaurantTab />}
      {tab === 'thresholds' && <ThresholdsTab />}
      {tab === 'outlets' && <OutletsTab />}
      {tab === 'stock' && <StockTab />}
      {tab === 'users' && <UsersTab />}

      {tab === 'thresholds' && (
        <Card className="card-pad text-[12px] text-ink-500">
          Current targets: food cost {pct(thresholds.foodCostPct, 0)} · labour {pct(thresholds.laborCostPct, 0)} ·
          gross margin {pct(thresholds.grossMarginPct, 0)}. Outlet-level targets on the Outlets tab are used when a
          single outlet is selected in the top bar.
        </Card>
      )}
    </div>
  )
}
