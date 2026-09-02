import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, RankedBars } from '../../components/charts/Charts.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, ProgressBar, StatRow } from '../../components/ui/Primitives.jsx'
import { fmtDate } from '../../lib/date.js'
import { money, num, pct } from '../../lib/format.js'
import { COLORS } from '../../lib/palette.js'
import { FULFILMENT } from '../../data/ecomCatalog.js'
import { ECOM_TARGETS, returnsAnalysis } from '../../lib/ecomMetrics.js'
import { useEcom } from '../../state/EcomContext.jsx'

export default function EcomReturns() {
  const { channelId, channelLabel, currency, range, current, delta } = useEcom()

  const r = useMemo(() => returnsAnalysis(channelId, range.from, range.to), [channelId, range.from, range.to])

  const topReason = r.reasons[0]
  const unsellable = r.reasons.filter((x) => x.recoverable < 0.3)
  const unsellableShare = unsellable.reduce((s, x) => s + x.sharePct, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description={`${channelLabel} · the rate, the reasons, and the margin they take back`}
        actions={
          <Link to="/ecommerce/overview" className="btn-ghost btn-sm">
            Overview
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Return rate"
          value={pct(current.returnRatePct)}
          delta={delta.returnRatePct}
          goodWhenUp={false}
          comparisonLabel="pts"
          spark={r.daily.map((d) => d.returnRatePct)}
          sparkColor={COLORS.waste}
          status={
            current.returnRatePct > ECOM_TARGETS.returnRatePct
              ? { tone: 'danger', label: 'Over target' }
              : { tone: 'success', label: 'On target' }
          }
          targetLabel="Target"
          target={pct(ECOM_TARGETS.returnRatePct, 0)}
        />
        <KpiCard
          label="Refunded value"
          value={money(r.cost.refunded, { currency })}
          goodWhenUp={false}
          spark={r.daily.map((d) => d.returnValue)}
          sparkColor={COLORS.waste}
          footnote="Units returned"
          target={num(current.returnUnits)}
        />
        <KpiCard
          label="Total cost of returns"
          value={money(r.cost.total, { currency })}
          goodWhenUp={false}
          footnote="Per order shipped"
          target={money(r.cost.perOrder, { currency, decimals: 2 })}
        />
        <KpiCard
          label="Comes back sellable"
          value={pct(r.cost.restockablePct, 0)}
          footnote="Written off"
          target={money(r.cost.writeOff, { currency })}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Return rate by day"
            subtitle="Booked against the day the order was placed, not the day the parcel came back"
          />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <LineChart
              data={r.daily}
              series={[{ key: 'returnRatePct', label: 'Return rate', color: COLORS.waste }]}
              height={260}
              formatY={(v) => `${v.toFixed(0)}%`}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => pct(v)}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="What returns cost" subtitle="Three separate holes, not one" />
          <div className="px-5 py-1">
            <StatRow label="Refunded to customers" value={money(r.cost.refunded, { currency })} />
            <StatRow
              label={`Handling (${money(FULFILMENT.returnHandling, { currency, decimals: 2 })}/parcel)`}
              value={money(r.cost.handling, { currency })}
            />
            <StatRow label="Stock written off" value={money(r.cost.writeOff, { currency })} tone="danger" />
            <StatRow label="Total" value={money(r.cost.total, { currency })} strong border />
          </div>
          <div className="border-t border-ink-100 px-5 py-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] text-ink-600">Restocked and sold again</span>
              <span className="tabular text-[12px] font-medium text-ink-800">{pct(r.cost.restockablePct, 0)}</span>
            </div>
            <ProgressBar
              className="mt-1.5"
              value={r.cost.restockablePct}
              tone={r.cost.restockablePct >= 70 ? 'success' : r.cost.restockablePct >= 50 ? 'warning' : 'danger'}
            />
            <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
              {pct(unsellableShare, 0)} of returns arrive damaged or faulty — that stock never sells again, so it is a
              write-off rather than a restock.
            </p>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Reasons"
            subtitle={topReason ? `${topReason.label} is ${pct(topReason.sharePct, 0)} of everything sent back` : ''}
          />
          <div className="card-pad">
            <RankedBars
              items={r.reasons.map((x) => ({
                label: x.label,
                value: x.units,
                color: x.recoverable < 0.3 ? COLORS.waste : COLORS.neutral,
                meta: `${pct(x.sharePct, 0)} of returns · ${money(x.value, { currency })} refunded · ${money(x.writeOff, { currency })} written off`,
              }))}
              formatValue={(v) => num(v)}
            />
          </div>
          <p className="px-5 pb-4 text-[12px] leading-relaxed text-ink-500">
            Red bars are reasons the stock does not come back sellable. Those are the ones worth fixing upstream — in
            packaging and in the listing, not in the returns desk.
          </p>
        </Card>

        <Card>
          <CardHeader title="By channel" subtitle="Marketplace buyers send back more, and later" />
          <DataTable
            dense
            rows={r.byChannel}
            initialSort={{ key: 'returnRatePct', dir: 'desc' }}
            columns={[
              { key: 'name', label: 'Channel', render: (x) => <span className="font-medium text-ink-900">{x.name}</span> },
              { key: 'returnUnits', label: 'Units back', align: 'right', render: (x) => num(x.returnUnits) },
              {
                key: 'returnRatePct',
                label: 'Rate',
                align: 'right',
                render: (x) => (
                  <Badge tone={x.returnRatePct > ECOM_TARGETS.returnRatePct ? 'danger' : 'success'}>
                    {pct(x.returnRatePct)}
                  </Badge>
                ),
              },
              { key: 'returnValue', label: 'Refunded', align: 'right', render: (x) => money(x.returnValue, { currency }) },
              { key: 'writeOff', label: 'Written off', align: 'right', render: (x) => money(x.writeOff, { currency }) },
              {
                key: 'costPerOrder',
                label: 'Cost per order',
                align: 'right',
                render: (x) => money(x.costPerOrder, { currency, decimals: 2 }),
              },
            ]}
          />
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Products"
          subtitle="Ranked by refunded value — a high rate on a cheap SKU costs less than a low rate on an expensive one"
        />
        <DataTable
          searchable
          searchKeys={['name', 'sku', 'category']}
          searchPlaceholder="Search SKU or name…"
          rows={r.products}
          initialSort={{ key: 'returnValue', dir: 'desc' }}
          columns={[
            {
              key: 'name',
              label: 'Product',
              render: (x) => (
                <div>
                  <p className="font-medium text-ink-900">{x.name}</p>
                  <p className="text-[12px] text-ink-500">
                    {x.sku} · {x.category}
                  </p>
                </div>
              ),
            },
            { key: 'units', label: 'Units sold', align: 'right', render: (x) => num(x.units) },
            { key: 'returnUnits', label: 'Returned', align: 'right', render: (x) => num(x.returnUnits) },
            {
              key: 'returnRatePct',
              label: 'Rate',
              align: 'right',
              render: (x) => (
                <span className={x.returnRatePct > ECOM_TARGETS.returnRatePct ? 'text-red-600' : 'text-ink-800'}>
                  {pct(x.returnRatePct)}
                </span>
              ),
            },
            { key: 'returnValue', label: 'Refunded', align: 'right', render: (x) => money(x.returnValue, { currency }) },
            {
              key: 'returnValueShare',
              label: 'Share of refunds',
              align: 'right',
              render: (x) => pct(x.returnValueShare, 0),
            },
            {
              key: 'contribution',
              label: 'Contribution',
              align: 'right',
              render: (x) => (
                <span className={x.contribution < 0 ? 'text-red-600' : 'text-ink-800'}>
                  {money(x.contribution, { currency })}
                </span>
              ),
            },
          ]}
        />
      </Card>

      <p className="text-[12px] leading-relaxed text-ink-400">
        A return costs three times: the refund, {money(FULFILMENT.returnHandling, { currency, decimals: 2 })} to handle
        the parcel, and the stock itself when it comes back unsellable. Reason mix is stable per channel — damage
        skews to the marketplaces, changed-mind to TikTok Shop.
      </p>
    </div>
  )
}
