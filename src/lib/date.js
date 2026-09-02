// All dates in the app are plain 'YYYY-MM-DD' strings in local time.
// Keeps comparisons, grouping and Map keys trivial and timezone-proof.

export const DAY_MS = 86400000

export function toKey(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const m = `${dt.getMonth() + 1}`.padStart(2, '0')
  const day = `${dt.getDate()}`.padStart(2, '0')
  return `${dt.getFullYear()}-${m}-${day}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function diffDays(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / DAY_MS)
}

/** Inclusive list of date keys. */
export function rangeKeys(from, to) {
  const out = []
  let cur = from
  let guard = 0
  while (cur <= to && guard++ < 2000) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

/** Same-length window immediately before [from,to]. Used for every comparison. */
export function previousRange(from, to) {
  const len = diffDays(from, to) + 1
  return { from: addDays(from, -len), to: addDays(from, -1) }
}

export function dayOfWeek(key) {
  return fromKey(key).getDay() // 0 = Sunday
}

export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function monthKey(key) {
  return key.slice(0, 7)
}

export function isWeekend(key) {
  const d = dayOfWeek(key)
  return d === 0 || d === 6
}

export function fmtDate(key, opts = { day: 'numeric', month: 'short' }) {
  return fromKey(key).toLocaleDateString('en-MY', opts)
}

export function fmtDateLong(key) {
  return fromKey(key).toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtRange(from, to) {
  if (from === to) return fmtDateLong(from)
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  const left = fmtDate(from, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
  const right = fmtDate(to, { day: 'numeric', month: 'short', year: 'numeric' })
  return `${left} – ${right}`
}

export function startOfMonth(key) {
  return `${key.slice(0, 7)}-01`
}

export function endOfMonth(key) {
  const d = fromKey(key)
  return toKey(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

/** Monday-based week start. */
export function startOfWeek(key) {
  const d = dayOfWeek(key)
  return addDays(key, d === 0 ? -6 : 1 - d)
}
