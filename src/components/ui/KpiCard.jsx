import { Sparkline } from '../charts/Charts.jsx'
import { COLORS } from '../../lib/palette.js'
import { Badge, cx, Delta } from './Primitives.jsx'

/**
 * The KPI unit used across the product: value, comparison with the previous
 * period, and — where a target exists — how far off target it is.
 *
 * `comparisonLabel` is opt-in. Repeating "vs previous period" under every tile
 * is noise when the section header already says it once.
 */
export function KpiCard({
  label,
  value,
  delta,
  goodWhenUp = true,
  comparisonLabel,
  target,
  targetLabel,
  status,
  spark,
  sparkColor,
  footnote,
  className,
  compact = false,
}) {
  return (
    <div className={cx('card card-pad flex flex-col justify-between', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-500">{label}</p>
        {status && (
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        )}
      </div>

      <div className="mt-2">
        <p className={cx('tabular font-semibold tracking-tight text-ink-900', compact ? 'text-xl' : 'text-2xl')}>
          {value}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Delta value={delta} goodWhenUp={goodWhenUp} />
          {comparisonLabel && <span className="truncate text-[12px] text-ink-400">{comparisonLabel}</span>}
        </div>
      </div>

      {spark && spark.length > 1 && (
        <Sparkline values={spark} color={sparkColor || (goodWhenUp ? COLORS.profit : COLORS.cost)} className="mt-3" />
      )}

      {(target !== undefined || footnote) && (
        <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2">
          <span className="text-[12px] text-ink-500">{footnote || targetLabel || 'Target'}</span>
          {target !== undefined && <span className="tabular text-[12px] font-medium text-ink-700">{target}</span>}
        </div>
      )}
    </div>
  )
}

/**
 * Secondary metrics: same information, a quarter of the chrome. Use when the
 * numbers are worth showing but not worth a card each.
 *
 * items: [{ label, value, delta, goodWhenUp, note }]
 */
export function KpiStrip({ items, className }) {
  return (
    <div className={cx('card overflow-hidden', className)}>
      <div className="grid grid-cols-2 gap-px bg-ink-100 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-white px-4 py-3">
            <p className="truncate text-[12px] text-ink-500">{item.label}</p>
            <p className="tabular mt-0.5 text-[17px] font-semibold tracking-tight text-ink-900">{item.value}</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <Delta value={item.delta} goodWhenUp={item.goodWhenUp ?? true} showIcon={false} />
              {item.note && <span className="truncate text-[11px] text-ink-400">{item.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
