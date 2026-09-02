import { cx } from '../ui/Primitives.jsx'

/**
 * Costwise mark: an open "C" arc with three ascending bars inside it.
 * The tallest bar breaks through the arc's opening — cost measured, then capped.
 *
 * Two elements only, so it still reads at 16px in a browser tab.
 */
export function LogoMark({ size = 28, tone = 'light', className }) {
  const arc = tone === 'dark' ? '#43bd8b' : '#1fa270'
  const bars = tone === 'dark' ? '#f6f7f9' : '#1b212a'

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cx('shrink-0', className)}
      role="img"
      aria-label="Costwise"
    >
      <path
        d="M16.59 5.45A8 8 0 1 0 16.59 18.55"
        fill="none"
        stroke={arc}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g fill={bars}>
        <rect x="7.4" y="12.5" width="2.2" height="3.2" rx="1.1" />
        <rect x="10.9" y="10.4" width="2.2" height="5.3" rx="1.1" />
        <rect x="14.4" y="7.9" width="2.2" height="7.8" rx="1.1" />
      </g>
    </svg>
  )
}

/** Mark plus wordmark. `subtitle` is optional and only used in the sidebar. */
export function Logo({ size = 28, tone = 'light', subtitle, className }) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <LogoMark size={size} tone={tone} />
      <span className="leading-tight">
        <span
          className={cx(
            'block font-semibold tracking-tight',
            tone === 'dark' ? 'text-white' : 'text-ink-900',
          )}
          style={{ fontSize: Math.round(size * 0.58) }}
        >
          Costwise
        </span>
        {subtitle && (
          <span className={cx('block text-[11px]', tone === 'dark' ? 'text-ink-400' : 'text-ink-500')}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  )
}
