import { useMemo, useState } from 'react'
import { useMeasure } from '../../hooks/useMeasure.js'
import { COLORS } from '../../lib/palette.js'
import { cx } from '../ui/Primitives.jsx'

const PAD = { top: 10, right: 14, bottom: 22, left: 52 }

function niceTicks(min, max, count = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    const base = Number.isFinite(max) && max !== 0 ? max : 1
    return [0, base / 2, base]
  }
  const span = max - min
  const rawStep = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep) || 1)))
  const norm = rawStep / mag
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const out = []
  for (let v = start; v <= end + step / 2; v += step) out.push(Number(v.toFixed(6)))
  return out
}

function useScales({ width, height, data, valueKeys, includeZero = true, padTop = 1.08 }) {
  return useMemo(() => {
    const innerW = Math.max(10, width - PAD.left - PAD.right)
    const innerH = Math.max(10, height - PAD.top - PAD.bottom)
    let min = Infinity
    let max = -Infinity
    for (const d of data) {
      for (const k of valueKeys) {
        const v = typeof k === 'function' ? k(d) : d[k]
        if (!Number.isFinite(v)) continue
        min = Math.min(min, v)
        max = Math.max(max, v)
      }
    }
    if (!Number.isFinite(min)) {
      min = 0
      max = 1
    }
    if (includeZero) min = Math.min(0, min)
    max = max * (max > 0 ? padTop : 1)
    const ticks = niceTicks(min, max)
    const lo = Math.min(min, ticks[0])
    const hi = Math.max(max, ticks[ticks.length - 1])
    const y = (v) => PAD.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH
    const x = (i, n = data.length) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
    const bandX = (i, n = data.length) => PAD.left + (i + 0.5) * (innerW / n)
    const band = innerW / Math.max(1, data.length)
    return { innerW, innerH, lo, hi, ticks, y, x, bandX, band }
  }, [width, height, data, valueKeys, includeZero, padTop])
}

function Grid({ scales, width, formatY }) {
  return (
    <g>
      {scales.ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={scales.y(t)}
            y2={scales.y(t)}
            stroke={COLORS.grid}
            strokeWidth={1}
          />
          <text
            x={PAD.left - 8}
            y={scales.y(t)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-ink-400 text-[10px]"
          >
            {formatY(t)}
          </text>
        </g>
      ))}
    </g>
  )
}

function XLabels({ data, scales, height, formatX, band = false, maxLabels = 7 }) {
  const step = Math.max(1, Math.ceil(data.length / maxLabels))
  return (
    <g>
      {data.map((d, i) =>
        i % step === 0 || i === data.length - 1 ? (
          <text
            key={i}
            x={band ? scales.bandX(i) : scales.x(i)}
            y={height - 6}
            textAnchor="middle"
            className="fill-ink-400 text-[10px]"
          >
            {formatX(d, i)}
          </text>
        ) : null,
      )}
    </g>
  )
}

function Tooltip({ x, width, children }) {
  const flip = x > width * 0.62
  return (
    <div
      className="pointer-events-none absolute top-2 z-20 min-w-[150px] rounded-lg border border-ink-200 bg-white/95 px-3 py-2 shadow-pop backdrop-blur"
      style={flip ? { right: Math.max(8, width - x + 10) } : { left: Math.min(width - 170, x + 10) }}
    >
      {children}
    </div>
  )
}

function TooltipRows({ title, rows }) {
  return (
    <>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-[12px] text-ink-600">
            {r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="tabular text-[12px] font-semibold text-ink-900">{r.value}</span>
        </div>
      ))}
    </>
  )
}

/**
 * Line / area chart with optional multiple series and a hover crosshair.
 * series: [{ key, label, color, area?, dashed?, axis?: 'left' }]
 */
export function LineChart({
  data,
  series,
  height = 220,
  formatY = (v) => v,
  formatX = (d) => d.label ?? d.date,
  formatValue = (v) => v,
  includeZero = true,
  className,
}) {
  const [ref, width] = useMeasure()
  const [hover, setHover] = useState(null)
  const scales = useScales({ width, height, data, valueKeys: series.map((s) => s.key), includeZero })

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const ratio = (px - PAD.left) / (scales.innerW || 1)
    const i = Math.round(ratio * (data.length - 1))
    if (i >= 0 && i < data.length) setHover(i)
  }

  return (
    <div ref={ref} className={cx('relative w-full', className)} style={{ height }}>
      {width > 0 && data.length > 0 && (
        <>
          <svg
            width={width}
            height={height}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            className="block touch-none"
          >
            <Grid scales={scales} width={width} formatY={formatY} />
            <XLabels data={data} scales={scales} height={height} formatX={formatX} />
            {series.map((s) => {
              const pts = data.map((d, i) => [scales.x(i), scales.y(Number(d[s.key]) || 0)])
              const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
              const areaPath = `${line} L${pts[pts.length - 1][0].toFixed(1)},${scales.y(scales.lo)} L${pts[0][0].toFixed(1)},${scales.y(scales.lo)} Z`
              return (
                <g key={s.key}>
                  {s.area && <path d={areaPath} fill={s.color} opacity={0.09} />}
                  <path
                    d={line}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.dashed ? '4 3' : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )
            })}
            {hover !== null && (
              <g>
                <line
                  x1={scales.x(hover)}
                  x2={scales.x(hover)}
                  y1={PAD.top}
                  y2={height - PAD.bottom}
                  stroke={COLORS.axis}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                {series.map((s) => (
                  <circle
                    key={s.key}
                    cx={scales.x(hover)}
                    cy={scales.y(Number(data[hover][s.key]) || 0)}
                    r={3.5}
                    fill="#fff"
                    stroke={s.color}
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}
          </svg>
          {hover !== null && (
            <Tooltip x={scales.x(hover)} width={width}>
              <TooltipRows
                title={formatX(data[hover], hover)}
                rows={series.map((s) => ({
                  label: s.label,
                  color: s.color,
                  value: formatValue(Number(data[hover][s.key]) || 0, s),
                }))}
              />
            </Tooltip>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Vertical bars, grouped or stacked, with an optional overlaid line series.
 * bars: [{ key, label, color }]  lines: [{ key, label, color }]
 */
export function BarChart({
  data,
  bars,
  lines = [],
  stacked = false,
  height = 220,
  formatY = (v) => v,
  formatX = (d) => d.label ?? d.date,
  formatValue = (v) => v,
  formatLineValue,
  className,
  highlightKey,
}) {
  const [ref, width] = useMeasure()
  const [hover, setHover] = useState(null)

  const valueKeys = stacked
    ? [(d) => bars.reduce((s, b) => s + (Number(d[b.key]) || 0), 0), ...bars.map((b) => b.key)]
    : bars.map((b) => b.key)
  const scales = useScales({ width, height, data, valueKeys })
  const lineScales = useScales({
    width,
    height,
    data,
    valueKeys: lines.map((l) => l.key),
    includeZero: false,
    padTop: 1.15,
  })

  const groupW = scales.band * 0.62
  const barW = stacked ? groupW : groupW / Math.max(1, bars.length)

  return (
    <div ref={ref} className={cx('relative w-full', className)} style={{ height }}>
      {width > 0 && data.length > 0 && (
        <>
          <svg width={width} height={height} onMouseLeave={() => setHover(null)} className="block">
            <Grid scales={scales} width={width} formatY={formatY} />
            <XLabels data={data} scales={scales} height={height} formatX={formatX} band />
            {data.map((d, i) => {
              const cx0 = scales.bandX(i)
              let acc = 0
              return (
                <g key={i} onMouseEnter={() => setHover(i)}>
                  <rect
                    x={cx0 - scales.band / 2}
                    y={PAD.top}
                    width={scales.band}
                    height={scales.innerH}
                    fill={hover === i ? COLORS.grid : 'transparent'}
                    opacity={0.6}
                  />
                  {bars.map((b, bi) => {
                    const v = Number(d[b.key]) || 0
                    if (stacked) {
                      const y0 = scales.y(acc)
                      const y1 = scales.y(acc + v)
                      acc += v
                      return (
                        <rect
                          key={b.key}
                          x={cx0 - groupW / 2}
                          y={Math.min(y0, y1)}
                          width={groupW}
                          height={Math.max(0, Math.abs(y0 - y1))}
                          fill={b.color}
                          opacity={highlightKey && highlightKey !== b.key ? 0.35 : 1}
                          rx={1.5}
                        />
                      )
                    }
                    const y0 = scales.y(0)
                    const y1 = scales.y(v)
                    return (
                      <rect
                        key={b.key}
                        x={cx0 - groupW / 2 + bi * barW}
                        y={Math.min(y0, y1)}
                        width={Math.max(1, barW - 1.5)}
                        height={Math.max(0, Math.abs(y0 - y1))}
                        fill={b.color}
                        opacity={highlightKey && highlightKey !== b.key ? 0.35 : 1}
                        rx={1.5}
                      />
                    )
                  })}
                </g>
              )
            })}
            {lines.map((l) => {
              const path = data
                .map((d, i) => `${i ? 'L' : 'M'}${scales.bandX(i).toFixed(1)},${lineScales.y(Number(d[l.key]) || 0).toFixed(1)}`)
                .join(' ')
              return <path key={l.key} d={path} fill="none" stroke={l.color} strokeWidth={2} strokeLinecap="round" />
            })}
            {lines.length > 0 &&
              data.map((d, i) =>
                lines.map((l) => (
                  <circle
                    key={`${l.key}-${i}`}
                    cx={scales.bandX(i)}
                    cy={lineScales.y(Number(d[l.key]) || 0)}
                    r={2.5}
                    fill="#fff"
                    stroke={l.color}
                    strokeWidth={1.6}
                  />
                )),
              )}
          </svg>
          {hover !== null && (
            <Tooltip x={scales.bandX(hover)} width={width}>
              <TooltipRows
                title={formatX(data[hover], hover)}
                rows={[
                  ...bars.map((b) => ({
                    label: b.label,
                    color: b.color,
                    value: formatValue(Number(data[hover][b.key]) || 0, b),
                  })),
                  ...lines.map((l) => ({
                    label: l.label,
                    color: l.color,
                    value: (formatLineValue || formatValue)(Number(data[hover][l.key]) || 0, l),
                  })),
                ]}
              />
            </Tooltip>
          )}
        </>
      )}
    </div>
  )
}

/** Horizontal ranked bars — better than a pie for "top N by value". */
export function RankedBars({ items, formatValue = (v) => v, height = 'auto', barColor, className, max }) {
  const top = max ? Math.max(...items.map((i) => i.value), max) : Math.max(...items.map((i) => i.value), 0)
  return (
    <div className={cx('space-y-2.5', className)} style={height !== 'auto' ? { height, overflowY: 'auto' } : undefined}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] text-ink-700">{item.label}</span>
            <span className="tabular shrink-0 text-[13px] font-semibold text-ink-900">{formatValue(item.value)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${top ? (item.value / top) * 100 : 0}%`, background: item.color || barColor || COLORS.profit }}
            />
          </div>
          {item.meta && <p className="mt-1 text-[11px] text-ink-500">{item.meta}</p>}
        </div>
      ))}
    </div>
  )
}

export function Sparkline({ values, color = COLORS.profit, height = 32, className, fill = true }) {
  const [ref, width] = useMeasure()
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * width,
    height - 2 - ((v - min) / span) * (height - 4),
  ])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <div ref={ref} className={cx('w-full', className)} style={{ height }}>
      {width > 0 && values.length > 1 && (
        <svg width={width} height={height} className="block">
          {fill && <path d={`${line} L${width},${height} L0,${height} Z`} fill={color} opacity={0.1} />}
          <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

/** Donut for revenue/cost composition. segments: [{label, value, color}] */
export function Donut({ segments, size = 168, thickness = 22, centerLabel, centerValue, className }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0
  return (
    <div className={cx('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke={COLORS.grid} strokeWidth={thickness} />
        {segments.map((s) => {
          const len = (s.value / total) * circumference
          const el = (
            <circle
              key={s.label}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - 1.5)} ${circumference}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-lg font-semibold text-ink-900">{centerValue}</span>
          <span className="text-[11px] uppercase tracking-wide text-ink-500">{centerLabel}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Profit waterfall: revenue down to operating profit.
 * steps: [{label, value, type: 'start'|'cost'|'total'}]
 */
export function Waterfall({ steps, height = 260, formatValue = (v) => v, className }) {
  const [ref, width] = useMeasure()
  const [hover, setHover] = useState(null)

  const computed = useMemo(() => {
    let running = 0
    return steps.map((s) => {
      if (s.type === 'start') {
        running = s.value
        return { ...s, from: 0, to: s.value, display: s.value }
      }
      if (s.type === 'total') return { ...s, from: 0, to: running, display: running }
      const from = running
      running -= Math.abs(s.value)
      return { ...s, from, to: running, display: -Math.abs(s.value) }
    })
  }, [steps])

  const maxVal = Math.max(...computed.map((c) => Math.max(c.from, c.to)), 0)
  const innerW = Math.max(10, width - PAD.left - PAD.right)
  const innerH = height - PAD.top - 42
  const band = innerW / Math.max(1, computed.length)
  const barW = Math.min(56, band * 0.56)
  const y = (v) => PAD.top + innerH - (v / (maxVal || 1)) * innerH

  const colorFor = (s) =>
    s.type === 'start' ? COLORS.revenue : s.type === 'total' ? COLORS.profit : s.color || COLORS.cost

  return (
    <div ref={ref} className={cx('relative w-full', className)} style={{ height }}>
      {width > 0 && (
        <>
          <svg width={width} height={height} onMouseLeave={() => setHover(null)} className="block">
            {niceTicks(0, maxVal).map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={COLORS.grid} />
                <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-ink-400 text-[10px]">
                  {formatValue(t, true)}
                </text>
              </g>
            ))}
            {computed.map((s, i) => {
              const cx0 = PAD.left + (i + 0.5) * band
              const top = Math.min(y(s.from), y(s.to))
              const h = Math.max(2, Math.abs(y(s.from) - y(s.to)))
              return (
                <g key={s.label} onMouseEnter={() => setHover(i)}>
                  <rect x={cx0 - band / 2} y={PAD.top} width={band} height={innerH} fill={hover === i ? COLORS.grid : 'transparent'} opacity={0.6} />
                  <rect x={cx0 - barW / 2} y={top} width={barW} height={h} rx={2} fill={colorFor(s)} />
                  {i < computed.length - 1 && s.type !== 'total' && (
                    <line
                      x1={cx0 + barW / 2}
                      x2={cx0 + band - barW / 2}
                      y1={y(s.to)}
                      y2={y(s.to)}
                      stroke={COLORS.axis}
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                  )}
                  <text x={cx0} y={height - 24} textAnchor="middle" className="fill-ink-500 text-[10px]">
                    {s.short || s.label}
                  </text>
                  <text x={cx0} y={height - 10} textAnchor="middle" className="fill-ink-800 text-[10px] font-semibold">
                    {formatValue(s.display, true)}
                  </text>
                </g>
              )
            })}
          </svg>
          {hover !== null && (
            <Tooltip x={PAD.left + (hover + 0.5) * band} width={width}>
              <TooltipRows
                title={computed[hover].label}
                rows={[
                  { label: computed[hover].type === 'cost' ? 'Deduction' : 'Amount', value: formatValue(computed[hover].display) },
                  { label: 'Running total', value: formatValue(computed[hover].to) },
                ]}
              />
            </Tooltip>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Day × hour intensity grid. cells: [{ row, col, value, meta }]
 */
export function HeatGrid({ rows, cols, cells, formatValue = (v) => v, lowIsBad = true, className, colLabel }) {
  const values = cells.map((c) => c.value).filter((v) => Number.isFinite(v))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const map = new Map(cells.map((c) => [`${c.row}|${c.col}`, c]))
  const [hover, setHover] = useState(null)

  const shade = (v) => {
    const t = (v - min) / (max - min || 1)
    const score = lowIsBad ? t : 1 - t
    if (score < 0.2) return 'bg-red-500/85 text-white'
    if (score < 0.4) return 'bg-amber-400/80 text-ink-900'
    if (score < 0.6) return 'bg-amber-200/70 text-ink-800'
    if (score < 0.8) return 'bg-brand-200/70 text-ink-800'
    return 'bg-brand-500/85 text-white'
  }

  return (
    <div className={cx('relative overflow-x-auto', className)}>
      <table className="w-full border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="w-10 text-left text-[10px] font-medium uppercase tracking-wide text-ink-400">{colLabel}</th>
            {cols.map((c) => (
              <th key={c.key} className="text-center text-[10px] font-medium text-ink-400">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="pr-1 text-[11px] font-medium text-ink-600">{r.label}</td>
              {cols.map((c) => {
                const cell = map.get(`${r.key}|${c.key}`)
                return (
                  <td key={c.key}>
                    <div
                      onMouseEnter={() => setHover(cell)}
                      onMouseLeave={() => setHover(null)}
                      className={cx(
                        'flex h-7 items-center justify-center rounded text-[10px] font-medium transition',
                        cell ? shade(cell.value) : 'bg-ink-100 text-ink-300',
                      )}
                    >
                      {cell ? formatValue(cell.value) : '—'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {hover && (
        <div className="mt-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-[12px] text-ink-700">
          {hover.meta}
        </div>
      )}
    </div>
  )
}

export function Legend({ items, className }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
          <span className="h-2 w-2 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
