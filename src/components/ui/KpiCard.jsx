import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Sparkline } from '../charts/Charts.jsx'
import { COLORS } from '../../lib/palette.js'
import { Badge, cx, Delta } from './Primitives.jsx'

/**
 * The expanded view of a tile: this period's days as bars, with the comparison
 * period's daily average drawn across them. Enough to answer "is this a trend
 * or one bad Tuesday" without leaving the tile.
 */
function CompareBars({ values, prior, color, formatValue, label }) {
  const max = Math.max(...values.map(Math.abs), Math.abs(prior || 0), 1)
  const priorH = (Math.abs(prior || 0) / max) * 100

  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
      <div className="relative flex h-[68px] items-end gap-px" role="img" aria-label={label}>
        {prior ? (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-300"
            style={{ bottom: `${priorH}%` }}
          />
        ) : null}
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{ height: `${Math.max((Math.abs(v) / max) * 100, 2)}%`, background: color, opacity: 0.85 }}
            title={formatValue ? formatValue(v) : v}
          />
        ))}
      </div>
      {prior ? (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-500">
          <span className="inline-block w-4 border-t border-dashed border-ink-300" />
          {formatValue ? formatValue(prior) : prior} a day in the comparison period
        </p>
      ) : null}
    </div>
  )
}

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
  expandable = false,
  priorDaily = null,
  formatValue,
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  // Opt-in, so the tiles that have no daily series behind them stay inert.
  const canExpand = expandable && spark && spark.length > 1

  return (
    <div className={cx('card card-pad flex flex-col justify-between', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-500">{label}</p>
        {status ? (
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        ) : canExpand ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="-m-1 rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/15"
          >
            <ChevronDown size={15} className={cx('transition-transform', open && 'rotate-180')} />
            <span className="sr-only">{open ? 'Hide' : 'Show'} daily detail for {label}</span>
          </button>
        ) : null}
      </div>

      <div className="mt-2">
        <p className={cx('tabular font-semibold tracking-tight text-ink-900', compact ? 'text-xl' : 'text-2xl')}>
          {value}
        </p>
        {/* A tile with no comparison to make omits the row rather than
            printing "no prior data" four times across a section. */}
        {delta !== undefined && (
          <div className="mt-1 flex items-center gap-2">
            <Delta value={delta} goodWhenUp={goodWhenUp} />
            {comparisonLabel && <span className="truncate text-[12px] text-ink-400">{comparisonLabel}</span>}
          </div>
        )}
      </div>

      {spark && spark.length > 1 && !open && (
        <Sparkline values={spark} color={sparkColor || (goodWhenUp ? COLORS.profit : COLORS.cost)} className="mt-3" />
      )}

      {canExpand && open && (
        <div id={panelId}>
          <CompareBars
            values={spark}
            prior={priorDaily && priorDaily.length ? priorDaily.reduce((s, v) => s + v, 0) / priorDaily.length : null}
            color={sparkColor || (goodWhenUp ? COLORS.profit : COLORS.cost)}
            formatValue={formatValue}
            label={`${label}, day by day`}
          />
        </div>
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
              {item.delta !== undefined && (
                <Delta value={item.delta} goodWhenUp={item.goodWhenUp ?? true} showIcon={false} />
              )}
              {item.note && <span className="truncate text-[11px] text-ink-400">{item.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
