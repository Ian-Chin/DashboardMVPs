// One palette for the whole product so a colour always means the same thing.

export const COLORS = {
  revenue: '#1b212a',
  profit: '#12825b',
  cost: '#f97316',
  labor: '#2563eb',
  waste: '#dc2626',
  variance: '#b45309',
  opex: '#7c3aed',
  neutral: '#94a3b8',
  grid: '#eceef2',
  axis: '#8492a8',
}

export const CATEGORY_COLORS = {
  Food: '#12825b',
  Drinks: '#2563eb',
  Desserts: '#a855f7',
  Other: '#94a3b8',
}

export const SERIES_COLORS = ['#12825b', '#2563eb', '#f97316', '#a855f7', '#dc2626', '#0891b2', '#ca8a04']

export const TONES = {
  success: { text: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200', dot: 'bg-brand-500' },
  brand: { text: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200', dot: 'bg-brand-500' },
  warning: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  danger: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  info: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  neutral: { text: 'text-ink-600', bg: 'bg-ink-100', border: 'border-ink-200', dot: 'bg-ink-400' },
}

export const SEVERITY_TONE = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
  positive: 'success',
}
