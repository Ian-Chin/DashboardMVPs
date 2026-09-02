// Display formatting. Currency symbol comes from company settings (RM by default).

export function money(value, { currency = 'RM', decimals = 0, sign = false } = {}) {
  const v = Number.isFinite(value) ? value : 0
  const abs = Math.abs(v)
  const body = abs.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const prefix = v < 0 ? '−' : sign ? '+' : ''
  return `${prefix}${currency}${body}`
}

/** Compact money for tight cards: RM82.4K, RM1.2M. */
export function moneyShort(value, currency = 'RM') {
  const v = Number.isFinite(value) ? value : 0
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1000) return `${sign}${currency}${(abs / 1000).toFixed(abs >= 100_000 ? 0 : 1)}K`
  return `${sign}${currency}${abs.toFixed(0)}`
}

export function pct(value, decimals = 1) {
  const v = Number.isFinite(value) ? value : 0
  return `${v.toFixed(decimals)}%`
}

export function pctDelta(value, decimals = 1) {
  const v = Number.isFinite(value) ? value : 0
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(decimals)}%`
}

export function num(value, decimals = 0) {
  const v = Number.isFinite(value) ? value : 0
  return v.toLocaleString('en-MY', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function qty(value, unit) {
  const decimals = Math.abs(value) < 10 ? 1 : 0
  return `${num(value, decimals)}${unit ? ` ${unit}` : ''}`
}

/** Percentage change between two values, null when the base is unusable. */
export function changePct(current, previous) {
  if (!Number.isFinite(previous) || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
