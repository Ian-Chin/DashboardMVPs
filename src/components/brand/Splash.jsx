import { useEffect, useState } from 'react'
import { cx } from '../ui/Primitives.jsx'

const SEEN_KEY = 'costwise.splash.v1'

/** Long enough to read the wordmark, short enough not to be in the way. */
const HOLD_MS = 1900
const FADE_MS = 520
const REDUCED_HOLD_MS = 500

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Shown once per browser session, on the very first paint, then it gets out of
 * the way and hands the visitor to the dashboard launcher underneath.
 */
export function Splash() {
  const reduced = prefersReducedMotion()
  const [phase, setPhase] = useState(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return 'done'
    } catch {
      /* private mode: just show it */
    }
    return 'in'
  })

  useEffect(() => {
    if (phase === 'done') return undefined
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    const hold = setTimeout(() => setPhase('out'), reduced ? REDUCED_HOLD_MS : HOLD_MS)
    return () => clearTimeout(hold)
    // Runs once: the first render decides whether the splash plays at all.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'out') return undefined
    const t = setTimeout(() => setPhase('done'), FADE_MS)
    return () => clearTimeout(t)
  }, [phase])

  // The page behind must not scroll under the overlay.
  useEffect(() => {
    if (phase === 'done') return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [phase])

  // Any click or key skips the rest of it.
  useEffect(() => {
    if (phase !== 'in') return undefined
    const skip = () => setPhase('out')
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    return () => {
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [phase])

  if (phase === 'done') return null

  const anim = (name, delay) =>
    reduced ? undefined : { animation: `${name} both`, animationDelay: `${delay}ms` }

  return (
    <div
      aria-hidden="true"
      className={cx(
        'no-print fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-ink-950',
        'transition-opacity duration-500 ease-out',
        phase === 'out' && 'pointer-events-none opacity-0',
      )}
    >
      {/* Two soft brand washes drifting behind the mark. */}
      <div
        className="pointer-events-none absolute -left-32 top-[-18%] h-[520px] w-[520px] rounded-full bg-brand-500/20 blur-[110px]"
        style={anim('splash-drift 5s ease-in-out infinite', 0)}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-[-22%] h-[460px] w-[460px] rounded-full bg-brand-400/12 blur-[110px]"
        style={anim('splash-drift 6s ease-in-out infinite reverse', 300)}
      />

      <div
        className="relative flex flex-col items-center px-6 text-center"
        style={phase === 'out' && !reduced ? { animation: 'splash-lift 520ms cubic-bezier(.4,0,.2,1) both' } : undefined}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[76px] w-[76px]"
          style={anim('splash-mark 700ms cubic-bezier(.16,1,.3,1)', 0)}
        >
          <path
            d="M16.59 5.45A8 8 0 1 0 16.59 18.55"
            pathLength="1"
            fill="none"
            stroke="#43bd8b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1"
            style={{ strokeDashoffset: reduced ? 0 : 1, ...anim('splash-draw 900ms cubic-bezier(.5,0,.2,1)', 120) }}
          />
          <g fill="#f6f7f9">
            {[
              { x: 7.4, y: 12.5, h: 3.2, d: 620 },
              { x: 10.9, y: 10.4, h: 5.3, d: 760 },
              { x: 14.4, y: 7.9, h: 7.8, d: 900 },
            ].map((b) => (
              <rect
                key={b.x}
                x={b.x}
                y={b.y}
                width="2.2"
                height={b.h}
                rx="1.1"
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'bottom',
                  opacity: reduced ? 1 : 0,
                  ...anim('splash-bar 460ms cubic-bezier(.16,1,.3,1)', b.d),
                }}
              />
            ))}
          </g>
        </svg>

        <p
          className="mt-5 text-[30px] font-semibold tracking-tight text-white"
          style={{ opacity: reduced ? 1 : 0, ...anim('splash-word 600ms cubic-bezier(.16,1,.3,1)', 820) }}
        >
          Costwise
        </p>
        <p
          className="mt-2 text-[13px] text-ink-400"
          style={{ opacity: reduced ? 1 : 0, ...anim('splash-word 600ms cubic-bezier(.16,1,.3,1)', 960) }}
        >
          The profitability layer on top of your POS
        </p>

        <div className="mt-7 h-px w-[180px] overflow-hidden bg-white/10">
          <div
            className="h-full w-full origin-left bg-brand-400"
            style={{
              transform: reduced ? 'none' : 'scaleX(0)',
              ...anim(`splash-sweep ${HOLD_MS - 900}ms cubic-bezier(.3,0,.2,1)`, 900),
            }}
          />
        </div>
      </div>
    </div>
  )
}
