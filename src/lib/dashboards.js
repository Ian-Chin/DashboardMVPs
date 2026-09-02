import { NAV_GROUPS } from '../components/layout/Sidebar.jsx'

/**
 * One line per view, answering "which dashboard do I want?" rather than only
 * "what is it called?". A route without a blurb is not a dashboard (Settings),
 * so it stays out of the launcher and the switcher.
 */
export const BLURBS = {
  '/dashboard': 'Health score, open issues and the headline numbers',
  '/profitability': 'Margin by outlet, day part and category',
  '/menu': 'Item-level margin, stars and dogs',
  '/inventory': 'Stock on hand, waste and count variance',
  '/labor': 'Hours, cost percentage and productivity',
  '/purchasing': 'Supplier spend and price movement',
  '/reports': 'Exportable period packs',
}

export const DASHBOARD_GROUPS = NAV_GROUPS.map((g) => ({
  ...g,
  items: g.items.filter((i) => BLURBS[i.to]).map((i) => ({ ...i, blurb: BLURBS[i.to] })),
})).filter((g) => g.items.length)

export const DASHBOARDS = DASHBOARD_GROUPS.flatMap((g) => g.items)
