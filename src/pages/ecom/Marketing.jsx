import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { BarChart, LineChart, RankedBars } from '../../components/charts/Charts.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { Badge, Card, CardHeader, StatRow } from '../../components/ui/Primitives.jsx'
import { fmtDate } from '../../lib/date.js'
import { money, moneyShort, num, pct } from '../../lib/format.js'
import { bucketDaily } from '../../lib/metrics.js'
import { COLORS } from '../../lib/palette.js'
import { ECOM_TARGETS, marketingAnalysis } from '../../lib/ecomMetrics.js'
import { useEcom } from '../../state/EcomContext.jsx'

export default function EcomMarketing() {
  const { channelId, channelLabel, currency, range, current, delta } = useEcom()

  const analysis = useMemo(
    () => marketingAnalysis(channelId, range.from, range.to),
    [channelId, range.from, range.to],
  )

  const series = bucketDaily(analysis.daily, 24)
  const worst = analysis.platforms.reduce((low, p) => (p.roas < (low?.roas ?? Infinity) ? p : low), null)
  const campaignGap = analysis.campaign.avgContributionPct - analysis.campaign.normalContributionPct

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        description={`${channelLabel} · spend against the contribution it has to pay for`}
        actions={
          <Link to="/ecommerce/overview" className="btn-ghost btn-sm">
            Overview
          </Link>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          label="Ad spend"
          value={money(current.adSpend, { currency })}
          delta={delta.adSpend}
          goodWhenUp={false}
          spark={analysis.daily.map((d) => d.adSpend)}
          sparkColor={COLORS.cost}
          footnote="Share of net revenue"
          target={pct(current.adPct)}
        />
        <KpiCard
          label="Blended MER"
          value={`${current.mer.toFixed(2)}×`}
          delta={delta.mer}
          spark={analysis.daily.map((d) => d.mer)}
          footnote="Net revenue per ringgit of spend"
        />
        <KpiCard
          label="Ad cost per order"
          value={money(current.cac, { currency, decimals: 2 })}
          delta={delta.cac}
          goodWhenUp={false}
          spark={analysis.daily.map((d) => d.cac)}
          sparkColor={COLORS.cost}
          footnote="Contribution per order"
          target={money(current.contributionPerOrder, { currency, decimals: 2 })}
        />
        <KpiCard
          label="Contribution after ads"
          value={money(current.contribution, { currency })}
          delta={delta.contribution}
          status={
            current.adPct <= ECOM_TARGETS.adPct
              ? { tone: 'success', label: 'Ad load on target' }
              : { tone: 'warning', label: 'Ad load over target' }
          }
          targetLabel="Ad load target"
          target={pct(ECOM_TARGETS.adPct, 0)}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Spend against contribution"
            subtitle="Both in ringgit, on one scale. The day ad spend clears the green bar is a day that lost money"
          />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <BarChart
              data={series}
              bars={[
                { key: 'contribution', label: 'Contribution', color: COLORS.profit },
                { key: 'adSpend', label: 'Ad spend', color: COLORS.cost },
              ]}
              height={260}
              formatY={(v) => moneyShort(v, currency)}
              formatX={(d) => fmtDate(d.date)}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Ad cost per order" subtitle="What it costs to buy one order, day by day" />
          <div className="px-2 pb-3 pt-4 sm:px-3">
            <LineChart
              data={analysis.daily}
              series={[{ key: 'cac', label: 'Ad cost per order', color: COLORS.cost }]}
              height={260}
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
            title="Platforms"
            subtitle="Attributed revenue is blended: each platform gets its share of the revenue of the channels it feeds"
          />
          <DataTable
            rows={analysis.platforms}
            initialSort={{ key: 'spend', dir: 'desc' }}
            columns={[
              {
                key: 'name',
                label: 'Platform',
                render: (r) => (
                  <div>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">Feeds {r.feeds || '—'}</p>
                  </div>
                ),
              },
              { key: 'spend', label: 'Spend', align: 'right', render: (r) => money(r.spend, { currency }) },
              { key: 'sharePct', label: 'Share', align: 'right', render: (r) => pct(r.sharePct, 0) },
              {
                key: 'attributed',
                label: 'Attributed revenue',
                align: 'right',
                render: (r) => money(r.attributed, { currency }),
              },
              {
                key: 'roas',
                label: 'Blended ROAS',
                align: 'right',
                render: (r) => (
                  <Badge tone={r.roas >= 6 ? 'success' : r.roas >= 4 ? 'warning' : 'danger'}>{r.roas.toFixed(2)}×</Badge>
                ),
              },
            ]}
          />
          <p className="flex items-start gap-1.5 border-t border-ink-100 px-5 py-3 text-[12px] leading-relaxed text-ink-500">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>
              {worst && (
                <>
                  <span className="font-medium text-ink-800">{worst.name}</span> returns {worst.roas.toFixed(2)}× on{' '}
                  {money(worst.spend, { currency })} of spend, the first place to cut if ad load has to come down.
                </>
              )}
            </span>
          </p>
        </Card>

        <Card>
          <CardHeader title="Spend by platform" subtitle="Share of this period" />
          <div className="card-pad">
            <RankedBars
              items={analysis.platforms.map((p) => ({
                label: p.name,
                value: p.spend,
                color: COLORS.cost,
                meta: `${pct(p.sharePct, 0)} of spend · ${p.roas.toFixed(2)}× blended`,
              }))}
              formatValue={(v) => money(v, { currency })}
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Campaign days"
            subtitle={`${analysis.campaign.days} double-digit and payday dates in this period`}
          />
          <div className="px-5 py-1">
            <StatRow label="Average spend, campaign day" value={money(analysis.campaign.avgSpend, { currency })} />
            <StatRow label="Average spend, ordinary day" value={money(analysis.campaign.normalSpend, { currency })} />
            <StatRow
              label="Contribution margin, campaign day"
              value={pct(analysis.campaign.avgContributionPct)}
              tone={campaignGap < 0 ? 'danger' : 'success'}
            />
            <StatRow
              label="Contribution margin, ordinary day"
              value={pct(analysis.campaign.normalContributionPct)}
              border
            />
            <StatRow
              label="Margin given away on campaign days"
              value={`${campaignGap >= 0 ? '+' : ''}${campaignGap.toFixed(1)} pts`}
              tone={campaignGap < 0 ? 'danger' : 'success'}
              strong
            />
          </div>
          <p className="px-5 pb-4 text-[12px] leading-relaxed text-ink-500">
            Campaign traffic converts worse than it looks: more browsing, deeper discounts, and the ad auction is more
            expensive on the same days.
          </p>
        </Card>

        <Card>
          <CardHeader title="What the spend has to clear" subtitle="Per order, this period" />
          <div className="px-5 py-1">
            <StatRow label="Average order value" value={money(current.aov, { currency, decimals: 2 })} />
            <StatRow label="Gross margin per order" value={money((current.grossProfit / (current.orders || 1)), { currency, decimals: 2 })} />
            <StatRow label="Channel fees per order" value={`− ${money(current.channelFees / (current.orders || 1), { currency, decimals: 2 })}`} />
            <StatRow label="Delivery per order" value={`− ${money((current.shipping + current.returnCost) / (current.orders || 1), { currency, decimals: 2 })}`} />
            <StatRow label="Ad cost per order" value={`− ${money(current.cac, { currency, decimals: 2 })}`} border />
            <StatRow
              label="Contribution per order"
              value={money(current.contributionPerOrder, { currency, decimals: 2 })}
              tone={current.contributionPerOrder < 0 ? 'danger' : 'success'}
              strong
            />
          </div>
          <p className="px-5 pb-4 text-[12px] leading-relaxed text-ink-500">
            {num(current.orders)} orders from {num(current.sessions)} sessions at {pct(current.convRate, 2)} conversion.
          </p>
        </Card>
      </section>
    </div>
  )
}
