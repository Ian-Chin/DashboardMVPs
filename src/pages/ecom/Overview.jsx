import { ArrowRight, Check, Info } from 'lucide-react'
import { AlertList } from '../../components/alerts/AlertList.jsx'
import { BarChart, DivergingBars, Legend, Waterfall } from '../../components/charts/Charts.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { KpiCard, KpiStrip } from '../../components/ui/KpiCard.jsx'
import { ProfitAndLoss } from '../../components/ui/ProfitAndLoss.jsx'
import { Badge, Card, CardHeader, Delta, ProgressBar, SectionTitle, cx } from '../../components/ui/Primitives.jsx'
import { fmtDate, fmtRange } from '../../lib/date.js'
import { money, moneyShort, num, pct } from '../../lib/format.js'
import { bucketDaily } from '../../lib/metrics.js'
import { COLORS, SERIES_COLORS } from '../../lib/palette.js'
import { ECOM_TARGETS, pnlStatement } from '../../lib/ecomMetrics.js'
import { useEcom } from '../../state/EcomContext.jsx'

/** Fixed channel colours, assigned in catalogue order and never recycled, so a
 *  colour means the same channel on every chart on the page. */
const CHANNEL_COLOR = {
  ch_store: SERIES_COLORS[0],
  ch_shopee: SERIES_COLORS[1],
  ch_lazada: SERIES_COLORS[2],
  ch_tiktok: SERIES_COLORS[3],
}

/**
 * The verdict: contribution against target, what is leaking, and the one link
 * worth clicking. Same shape as the restaurant dashboard's opener on purpose.
 */
function Verdict() {
  const { verdict, current, delta, currency, channelLabel } = useEcom()
  const biggest = verdict.issues.reduce((best, a) => ((a.impact || 0) > (best?.impact || 0) ? a : best), null)


  const pillars = [
    { label: 'Contribution margin', value: current.contributionPct, target: ECOM_TARGETS.contributionPct, up: true },
    { label: 'Return rate', value: current.returnRatePct, target: ECOM_TARGETS.returnRatePct, up: false },
    { label: 'Ad spend share', value: current.adPct, target: ECOM_TARGETS.adPct, up: false },
  ]

  return (
    <section className="card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-8 sm:p-6">
        <div className="min-w-0 flex-1">
          {verdict.issues.length ? (
            <>
              <h2 className="tabular text-[24px] font-semibold tracking-tight text-ink-900">
                {money(verdict.impact, { currency })} a month is leaking
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-600">
                {channelLabel} keeps {pct(current.contributionPct)} of net revenue as contribution, which is{' '}
                {money(current.contributionPerOrder, { currency, decimals: 2 })} an order.
                {biggest && (
                  <>
                    {' '}The biggest leak is <span className="font-medium text-ink-900">{biggest.title}</span>.
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[24px] font-semibold tracking-tight text-ink-900">Every channel clears its target</h2>
              <p className="mt-2 flex items-center gap-2 text-[14px] text-ink-600">
                <Check size={15} className="shrink-0 text-brand-600" />
                Contribution, returns and ad load all sit inside their thresholds.
              </p>
            </>
          )}
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[13px] text-ink-500">Contribution this period</p>
          <p className="tabular mt-1 text-[22px] font-semibold tracking-tight text-ink-900">
            {money(current.contribution, { currency })}
          </p>
          <Delta value={delta.contribution} className="sm:justify-end" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-ink-100 px-5 py-4 sm:grid-cols-4 sm:px-6">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] text-ink-600">Overall health</span>
            <span className="tabular text-[13px] font-semibold text-ink-900">{verdict.score}</span>
          </div>
          <ProgressBar
            className="mt-2"
            value={verdict.score}
            tone={verdict.score >= 75 ? 'success' : verdict.score >= 55 ? 'warning' : 'danger'}
          />
        </div>
        {pillars.map((p) => {
          const ok = p.up ? p.value >= p.target : p.value <= p.target
          const ratio = p.up
            ? Math.min(100, (p.value / p.target) * 100)
            : Math.min(100, (p.target / Math.max(p.value, 0.01)) * 100)
          return (
            <div key={p.label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] text-ink-600">{p.label}</span>
                <span className="tabular text-[13px] font-semibold text-ink-900">
                  {pct(p.value)} <span className="font-normal text-ink-400">/ {pct(p.target, 0)}</span>
                </span>
              </div>
              <ProgressBar className="mt-2" value={ratio} tone={ok ? 'success' : ratio > 70 ? 'warning' : 'danger'} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Sessions to orders, with the drop-off between each step named. */
function Funnel({ steps }) {
  const top = steps[0]?.value || 1
  return (
    <div className="card-pad space-y-2.5">
      {steps.map((s, i) => {
        const prev = i === 0 ? null : steps[i - 1].value
        const stepPct = prev ? (s.value / prev) * 100 : 100
        return (
          <div key={s.key}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-ink-700">{s.label}</span>
              <span className="tabular font-medium text-ink-900">{num(s.value)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2.5">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={cx('h-full rounded-full', i === steps.length - 1 ? 'bg-brand-500' : 'bg-ink-800')}
                  style={{ width: `${Math.max(1.5, (s.value / top) * 100)}%` }}
                />
              </div>
              <span className="tabular w-[52px] shrink-0 text-right text-[12px] text-ink-500">
                {prev ? `${stepPct.toFixed(1)}%` : '100%'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** A short, honest note on how a number was built. Cheaper than a tooltip and
 *  it survives print. */
function Method({ children }) {
  return (
    <p className="flex items-start gap-1.5 px-5 pb-4 text-[12px] leading-relaxed text-ink-400">
      <Info size={13} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export default function EcomOverview() {
  const {
    store,
    current,
    previous,
    delta,
    verdict,
    channelRows,
    marketing,
    currency,
    channelLabel,
    channelId,
    compareLabel,
    comparePhrase,
    compareRange,
    range,
  } = useEcom()

  const series = bucketDaily(current.daily, 24)
  const spark = (key) => current.daily.map((d) => d[key])
  const priorSpark = (key) => previous.daily.map((d) => d[key])
  const pnl = pnlStatement(current, previous, marketing.rows)

  const statusFor = (value, target, up = false) =>
    up
      ? value >= target
        ? { tone: 'success', label: 'On target' }
        : { tone: 'danger', label: 'Below target' }
      : value > target * 1.15
        ? { tone: 'danger', label: 'Over target' }
        : value > target
          ? { tone: 'warning', label: 'At limit' }
          : { tone: 'success', label: 'On target' }

  return (
    <div className="space-y-6">
      <PageHeader
        title="E-commerce overview"
        description={`${store.name} · ${channelLabel} · contribution after fees, delivery, returns and ad spend`}
      />

      <Verdict />

      <section>
        <SectionTitle
          right={
            <span className="text-[12px] text-ink-400">
              Change is against {comparePhrase}, {fmtRange(compareRange.from, compareRange.to)}
            </span>
          }
        >
          Money
        </SectionTitle>

        <div className="kpi-grid">
          <KpiCard
            expandable
            label="Net revenue"
            value={money(current.netAfterReturns, { currency })}
            delta={delta.net}
            spark={spark('netAfterReturns')}
            priorDaily={priorSpark('netAfterReturns')}
            formatValue={(v) => money(v, { currency })}
            sparkColor={COLORS.revenue}
            footnote="Comparison period"
            target={money(previous.netAfterReturns, { currency })}
          />
          <KpiCard
            expandable
            label="Contribution"
            value={money(current.contribution, { currency })}
            delta={delta.contribution}
            spark={spark('contribution')}
            priorDaily={priorSpark('contribution')}
            formatValue={(v) => money(v, { currency })}
            footnote="Contribution margin"
            target={pct(current.contributionPct)}
          />
          <KpiCard
            label="Contribution per order"
            value={money(current.contributionPerOrder, { currency, decimals: 2 })}
            delta={delta.contributionPerOrder}
            status={statusFor(current.contributionPct, ECOM_TARGETS.contributionPct, true)}
            targetLabel="Margin target"
            target={pct(ECOM_TARGETS.contributionPct, 0)}
          />
          <KpiCard
            label="Ad spend"
            value={money(current.adSpend, { currency })}
            delta={delta.adSpend}
            goodWhenUp={false}
            status={statusFor(current.adPct, ECOM_TARGETS.adPct)}
            targetLabel="Blended MER"
            target={`${current.mer.toFixed(2)}×`}
          />
        </div>

        <KpiStrip
          className="mt-3"
          items={[
            { label: 'Orders', value: num(current.orders), delta: delta.orders, note: `${current.unitsPerOrder.toFixed(2)} units each` },
            { label: 'Average order value', value: money(current.aov, { currency, decimals: 2 }), delta: delta.aov },
            {
              label: 'Conversion rate',
              value: pct(current.convRate, 2),
              delta: delta.convRate,
              note: `${num(current.sessions)} sessions`,
            },
            {
              label: 'Return rate',
              value: pct(current.returnRatePct),
              delta: delta.returnRatePct,
              goodWhenUp: false,
              note: `${money(current.returnValue, { currency })} refunded`,
            },
          ]}
        />
      </section>

      <section>
        <SectionTitle
          right={<span className="text-[12px] text-ink-400">{channelLabel}, {fmtRange(range.from, range.to)}</span>}
        >
          Profit and loss
        </SectionTitle>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Contribution margin statement"
              subtitle="Read down. Every line carries what it takes out of a ringgit of net revenue"
            />
            <ProfitAndLoss
              blocks={pnl}
              base={current.netAfterReturns}
              compareLabel={compareLabel}
              formatValue={(v) => money(v, { currency })}
              formatPct={(v) => pct(v, 1)}
            />
            <Method>
              Overhead sits below this line and is not in the dataset, so contribution margin is the last honest
              subtotal. It is what an order leaves behind before payroll, software and rent.
            </Method>
          </Card>

          <Card>
            <CardHeader
              title="Where the money goes"
              subtitle={`${channelLabel}, this period`}
              to="/ecommerce/fulfilment"
            />
            <div className="px-2 pb-2 pt-4 sm:px-3">
              <Waterfall steps={current.waterfall} height={280} formatValue={(v) => money(v, { currency })} />
            </div>
            <Method>
              Returns are booked against the order that caused them, not the day the parcel came back, so product
              margin carries its own returns.
            </Method>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue and contribution by day"
            subtitle="Ad spend plotted on the same scale, because it is money out of the same pocket"
            right={
              <Legend
                items={[
                  { label: 'Net revenue', color: COLORS.revenue },
                  { label: 'Contribution', color: COLORS.profit },
                  { label: 'Ad spend', color: COLORS.cost },
                ]}
              />
            }
          />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <BarChart
              data={series}
              bars={[
                { key: 'netAfterReturns', label: 'Net revenue', color: COLORS.revenue },
                { key: 'contribution', label: 'Contribution', color: COLORS.profit },
              ]}
              lines={[{ key: 'adSpend', label: 'Ad spend', color: COLORS.cost }]}
              height={260}
              formatY={(v) => moneyShort(v, currency)}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Sessions to orders" subtitle={`${channelLabel}, ${current.days} days`} />
          <Funnel steps={current.funnel} />
          <Method>
            Sessions and orders are counted; the three steps between them are modelled at fixed rates, so read them as
            shape, not as truth.
          </Method>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader
            title="Needs attention"
            subtitle={
              verdict.issues.length
                ? `${verdict.issues.length} issue${verdict.issues.length === 1 ? '' : 's'}, ranked by severity then money at stake`
                : 'Nothing is outside its threshold right now'
            }
          />
          <AlertList alerts={verdict.issues} currency={currency} />
        </Card>
      </section>

      <section>
        <SectionTitle right={<span className="text-[12px] text-ink-400">Same period, like for like</span>}>
          Channels
        </SectionTitle>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader title="Contribution by channel" subtitle="After fees, delivery, returns and ads" />
            <div className="card-pad">
              <DivergingBars
                items={channelRows
                  .slice()
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((c) => ({
                    label: c.short,
                    value: c.contribution,
                    color: CHANNEL_COLOR[c.id],
                    meta: `${money(c.revenue, { currency })} revenue · ${pct(c.contributionPct)} margin`,
                  }))}
                formatValue={(v) => money(v, { currency })}
              />
            </div>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader
              title="Channel comparison"
              subtitle="A marketplace order is not worth a storefront order. This is by how much"
            />
            <DataTable
              dense
              initialSort={{ key: 'contribution', dir: 'desc' }}
              rows={channelRows}
              onRowClick={undefined}
              columns={[
                {
                  key: 'name',
                  label: 'Channel',
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CHANNEL_COLOR[r.id] }} />
                      <div>
                        <p className="font-medium text-ink-900">{r.name}</p>
                        <p className="text-[12px] text-ink-500">{num(r.orders)} orders</p>
                      </div>
                    </div>
                  ),
                },
                { key: 'revenue', label: 'Net revenue', align: 'right', render: (r) => money(r.revenue, { currency }) },
                { key: 'aov', label: 'AOV', align: 'right', render: (r) => money(r.aov, { currency, decimals: 2 }) },
                { key: 'feePct', label: 'Fees', align: 'right', render: (r) => pct(r.feePct) },
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
                {
                  key: 'contribution',
                  label: 'Contribution',
                  align: 'right',
                  render: (r) => money(r.contribution, { currency }),
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
                  key: 'contributionChangePct',
                  label: 'Change',
                  align: 'right',
                  render: (r) => <Delta value={r.contributionChangePct} className="justify-end" />,
                },
              ]}
            />
          </Card>
        </div>
      </section>

      <p className="flex flex-wrap items-center gap-x-2 text-[12px] leading-relaxed text-ink-400">
        <span>
          Every figure is summed from order, fee, delivery, return and ad-spend rows for {channelLabel.toLowerCase()}.
          Contribution = net revenue − returns − COGS − channel fees − delivery − ad spend.
        </span>
        {channelId !== 'all' && (
          <span className="inline-flex items-center gap-1 font-medium text-brand-700">
            Scoped to {channelLabel} <ArrowRight size={12} />
          </span>
        )}
      </p>
    </div>
  )
}
