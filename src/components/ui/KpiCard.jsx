import { Sparkline } from '../charts/Charts.jsx'
import { COLORS } from '../../lib/palette.js'
import { Badge, cx, Delta } from './Primitives.jsx'

/**
 * The KPI unit used across the product: value, comparison with the previous
 * period, and — where a target exists — how far off target it is.
 */
export function KpiCard({
  label,
  value,
  delta,
  goodWhenUp = true,
  comparisonLabel = 'vs previous period',
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
          <span className="truncate text-[12px] text-ink-400">{comparisonLabel}</span>
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
