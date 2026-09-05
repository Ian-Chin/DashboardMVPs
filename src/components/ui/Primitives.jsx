import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TONES } from '../../lib/palette.js'

export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('card', className)} {...rest}>
      {children}
    </div>
  )
}

/**
 * `to` turns the title itself into the drill-down link, which is the convention
 * every analytics admin has settled on: the panel heading is the way into the
 * full report, so the panel does not need a second small "Detail" link fighting
 * the heading for the same job.
 */
export function CardHeader({ title, subtitle, right, to, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-ink-200/70 px-4 py-3 sm:px-5', className)}>
      <div className="min-w-0">
        {to ? (
          <Link
            to={to}
            className="group inline-flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/15"
          >
            <h3 className="truncate text-[15px] font-semibold text-ink-900 group-hover:text-brand-700">{title}</h3>
            <ChevronRight
              size={15}
              className="shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700"
            />
          </Link>
        ) : (
          <h3 className="truncate text-[15px] font-semibold text-ink-900">{title}</h3>
        )}
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export function Badge({ tone = 'neutral', children, className, dot = false }) {
  const t = TONES[tone] || TONES.neutral
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        t.bg,
        t.text,
        t.border,
        className,
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', t.dot)} />}
      {children}
    </span>
  )
}

/** Direction-aware change chip. `goodWhenUp=false` flips the colour logic. */
export function Delta({ value, goodWhenUp = true, suffix = '', className, showIcon = true, unit = '%' }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className={cx('text-[13px] text-ink-400', className)}>No prior data</span>
  }
  const flat = Math.abs(value) < 0.05
  const good = flat ? null : goodWhenUp ? value > 0 : value < 0
  const tone = flat ? 'text-ink-500' : good ? 'text-brand-600' : 'text-red-600'
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cx('inline-flex items-center gap-1 text-[13px] font-medium tabular', tone, className)}>
      {showIcon && <Icon size={14} strokeWidth={2.4} />}
      {`${Math.abs(value).toFixed(1)}${unit}`}
      {suffix && <span className="font-normal text-ink-500">{suffix}</span>}
    </span>
  )
}

export function ProgressBar({ value, max = 100, tone = 'brand', className, markerAt = null }) {
  const t = TONES[tone] || TONES.brand
  const pctVal = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cx('relative h-1.5 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div className={cx('h-full rounded-full transition-all', t.dot)} style={{ width: `${pctVal}%` }} />
      {markerAt !== null && (
        <div
          className="absolute top-0 h-full w-px bg-ink-900/50"
          style={{ left: `${Math.max(0, Math.min(100, (markerAt / max) * 100))}%` }}
        />
      )}
    </div>
  )
}

export function Segmented({ options, value, onChange, size = 'md', className }) {
  return (
    <div className={cx('inline-flex rounded-lg border border-ink-200 bg-ink-100/70 p-0.5', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cx(
            'rounded-md font-medium transition',
            size === 'sm' ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]',
            value === opt.value ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, detail, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {Icon && <Icon size={22} className="text-ink-300" />}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {detail && <p className="max-w-sm text-[13px] text-ink-500">{detail}</p>}
      {action}
    </div>
  )
}

export function StatRow({ label, value, tone, strong = false, indent = false, border = false }) {
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-4 py-2',
        border && 'border-t border-ink-200/70',
        indent && 'pl-4',
      )}
    >
      <span className={cx('text-[13px]', strong ? 'font-semibold text-ink-900' : 'text-ink-600')}>{label}</span>
      <span
        className={cx(
          'tabular text-[13px]',
          strong ? 'font-semibold text-ink-900' : 'font-medium text-ink-800',
          tone === 'danger' && 'text-red-600',
          tone === 'success' && 'text-brand-600',
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="section-title">{children}</h2>
      {right}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-md bg-ink-100', className)} />
}
