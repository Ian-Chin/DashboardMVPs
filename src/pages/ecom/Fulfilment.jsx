import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, RankedBars, Waterfall } from '../../components/charts/Charts.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, StatRow } from '../../components/ui/Primitives.jsx'
import { fmtDate } from '../../lib/date.js'
import { money, num, pct, qty } from '../../lib/format.js'
import { COLORS } from '../../lib/palette.js'
import { FULFILMENT } from '../../data/ecomCatalog.js'
import { fulfilmentAnalysis } from '../../lib/ecomMetrics.js'
import { useEcom } from '../../state/EcomContext.jsx'

export default function EcomFulfilment() {
  const { channelId, channelLabel, currency, range, current } = useEcom()

  const f = useMemo(
    () => fulfilmentAnalysis(channelId, range.from, range.to),
    [channelId, range.from, range.to],
  )

  // Gross cost first, then what the channels credit back. The close is what
  // actually leaves the account.
  const costWaterfall = [
    { label: 'Gross delivery', value: f.totals.pickPack + f.totals.freight, type: 'start' },
    { label: 'Channel subsidy', value: f.totals.subsidy, color: COLORS.profit },
    { label: 'Paid to carriers', type: 'total' },
  ]

  const dearest = f.rows.reduce((worst, r) => (r.perOrder > (worst?.perOrder ?? -Infinity) ? r : worst), null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fulfilment"
        description={`${channelLabel} · pick, pack, freight and what comes back through the door`}
        actions={
          <Link to="/ecommerce/overview" className="btn-ghost btn-sm">
            Overview
          </Link>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          label="Delivery cost"
          value={money(f.totals.net, { currency })}
          goodWhenUp={false}
          spark={f.daily.map((d) => d.shipping)}
          sparkColor={COLORS.cost}
          footnote="Share of net revenue"
          target={pct((f.totals.net / (current.netAfterReturns || 1)) * 100)}
        />
        <KpiCard
          label="Cost per order"
          value={money(f.totals.perOrder, { currency, decimals: 2 })}
          goodWhenUp={false}
          spark={f.daily.map((d) => d.perOrder)}
          sparkColor={COLORS.cost}
          footnote="Orders shipped"
          target={num(current.orders)}
        />
        <KpiCard
          label="Average parcel"
          value={qty(f.totals.weight / (current.orders || 1), 'kg')}
          footnote="Freight rate"
          target={`${money(FULFILMENT.perKg, { currency, decimals: 2 })}/kg`}
        />
        <KpiCard
          label="Return handling"
          value={money(f.totals.returnCost, { currency })}
          goodWhenUp={false}
          status={{ tone: 'warning', label: `${money(FULFILMENT.returnHandling, { currency, decimals: 2 })}/parcel` }}
          targetLabel="Parcels back"
          target={num(current.returnUnits)}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="What delivery costs" subtitle="Gross cost, less what the channels subsidise" />
          <div className="px-2 pb-2 pt-4 sm:px-3">
            <Waterfall steps={costWaterfall} height={240} formatValue={(v) => money(v, { currency })} />
          </div>
          <div className="border-t border-ink-100 px-5 py-1">
            <StatRow label="Pick & pack" value={money(f.totals.pickPack, { currency })} />
            <StatRow label="Freight" value={money(f.totals.freight, { currency })} />
            <StatRow label="Channel subsidy" value={`− ${money(f.totals.subsidy, { currency })}`} tone="success" />
            <StatRow label="Net delivery" value={money(f.totals.net, { currency })} strong border />
            <StatRow label="Cost per kilo shipped" value={money(f.totals.perKg, { currency, decimals: 2 })} />
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Cost per order, day by day"
            subtitle="Campaign days ship lighter baskets, so the per-order cost climbs"
          />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <LineChart
              data={f.daily}
              series={[{ key: 'perOrder', label: 'Cost per order', color: COLORS.cost }]}
              height={280}
              // Movement here is a few cents on a seven-ringgit parcel; a
              // zero-based axis would flatten the only thing worth seeing.
              includeZero={false}
              formatY={(v) => money(v, { currency, decimals: 2 })}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => money(v, { currency, decimals: 2 })}
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="By channel"
            subtitle="The own store pays its own delivery; the marketplaces subsidise part of theirs"
          />
          <DataTable
            dense
            rows={f.rows}
            initialSort={{ key: 'net', dir: 'desc' }}
            columns={[
              {
                key: 'name',
                label: 'Channel',
                render: (r) => (
                  <div>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">{num(r.orders)} parcels</p>
                  </div>
                ),
              },
              { key: 'avgWeight', label: 'Avg parcel', align: 'right', render: (r) => qty(r.avgWeight, 'kg') },
              { key: 'pickPack', label: 'Pick & pack', align: 'right', render: (r) => money(r.pickPack, { currency }) },
              { key: 'freight', label: 'Freight', align: 'right', render: (r) => money(r.freight, { currency }) },
              {
                key: 'subsidy',
                label: 'Subsidy',
                align: 'right',
                render: (r) => (
                  <span className={r.subsidy > 0 ? 'text-brand-700' : 'text-ink-400'}>
                    {r.subsidy > 0 ? `− ${money(r.subsidy, { currency })}` : '—'}
                  </span>
                ),
              },
              { key: 'net', label: 'Net cost', align: 'right', render: (r) => money(r.net, { currency }) },
              {
                key: 'perOrder',
                label: 'Per order',
                align: 'right',
                render: (r) => (
                  <Badge tone={r.perOrder > 9 ? 'danger' : r.perOrder > 6.5 ? 'warning' : 'success'}>
                    {money(r.perOrder, { currency, decimals: 2 })}
                  </Badge>
                ),
              },
              {
                key: 'costPctOfRevenue',
                label: 'Of revenue',
                align: 'right',
                render: (r) => pct(r.costPctOfRevenue),
              },
            ]}
          />
          {dearest && (
            <p className="border-t border-ink-100 px-5 py-3 text-[12px] leading-relaxed text-ink-500">
              <span className="font-medium text-ink-800">{dearest.name}</span> is the dearest to ship at{' '}
              {money(dearest.perOrder, { currency, decimals: 2 })} a parcel, with no channel subsidy, and the heaviest
              average basket at {qty(dearest.avgWeight, 'kg')}.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Freight by SKU" subtitle="Weight is what freight actually charges for" />
          <div className="card-pad">
            <RankedBars
              items={f.heaviest.map((h) => ({
                label: h.name,
                value: h.freight,
                color: COLORS.cost,
                meta: `${num(h.units)} units · ${qty(h.kgPerUnit, 'kg')} each · ${qty(h.weight, 'kg')} shipped`,
              }))}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
          <p className="px-5 pb-4 text-[12px] leading-relaxed text-ink-500">
            Freight here is the weight-based part only ({money(FULFILMENT.perKg, { currency, decimals: 2 })} a kilo).
            The flat {money(FULFILMENT.baseFreight, { currency, decimals: 2 })} a parcel is charged per order, not per
            SKU, so it sits in the channel table instead.
          </p>
        </Card>
      </section>

      <p className="text-[12px] leading-relaxed text-ink-400">
        Cost model: {money(FULFILMENT.pickPack, { currency, decimals: 2 })} pick and pack plus{' '}
        {money(FULFILMENT.baseFreight, { currency, decimals: 2 })} base freight per parcel,{' '}
        {money(FULFILMENT.perKg, { currency, decimals: 2 })} a kilo on top, less each channel's delivery subsidy.
        Returns add {money(FULFILMENT.returnHandling, { currency, decimals: 2 })} of handling per parcel that comes
        back.
      </p>
    </div>
  )
}
