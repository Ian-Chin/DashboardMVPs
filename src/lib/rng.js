// Deterministic pseudo-random helpers.
// Demo data must be identical on every reload, otherwise every KPI, alert and
// chart would shift between renders and the product would feel fake.

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mulberry32 — small, fast, good enough for demo data. */
export function makeRng(seed) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable float in [min,max) derived from a seed string. */
export function seededFloat(seed, min = 0, max = 1) {
  return min + makeRng(seed)() * (max - min)
}

/** Stable integer in [min,max]. */
export function seededInt(seed, min, max) {
  return Math.floor(seededFloat(seed, min, max + 1))
}

/** Approximate normal noise, mean 1, given spread (e.g. 0.12 = ±12%-ish). */
export function seededNoise(seed, spread = 0.1) {
  const r = makeRng(seed)
  const n = (r() + r() + r() - 1.5) / 1.5 // roughly normal, range ~[-1,1]
  return 1 + n * spread
}

export function pick(seed, arr) {
  return arr[Math.floor(seededFloat(seed, 0, arr.length)) % arr.length]
}
