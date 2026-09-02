import { Megaphone, Package, RotateCcw, ShoppingBag, Store, Truck, UtensilsCrossed } from 'lucide-react'

/**
 * Top of the funnel: which business are you looking at? Restaurants is the live
 * product; e-commerce is scaffolded but has no connected store, and says so
 * rather than showing invented numbers.
 */
export const WORKSPACES = [
  {
    key: 'restaurants',
    to: '/restaurants',
    label: 'Restaurants',
    icon: UtensilsCrossed,
    blurb: 'Food and labour cost, menu margin, waste and purchasing across your outlets.',
    note: '7 dashboards',
    status: 'live',
  },
  {
    key: 'ecommerce',
    to: '/ecommerce',
    label: 'E-commerce',
    icon: ShoppingBag,
    blurb: 'Contribution margin per order and per SKU once ad spend, shipping and returns are counted.',
    note: '5 dashboards',
    status: 'live',
  },
]

/** All five are built and read from the same order, fee, delivery, return and
 *  ad-spend rows. */
export const ECOM_DASHBOARDS = [
  {
    key: 'overview',
    label: 'Overview',
    icon: Store,
    blurb: 'Revenue, contribution margin and order economics',
    to: '/ecommerce/overview',
  },
  { to: '/ecommerce/products', key: 'products', label: 'Products', icon: Package, blurb: 'Margin and velocity by SKU and variant' },
  { to: '/ecommerce/marketing', key: 'marketing', label: 'Marketing', icon: Megaphone, blurb: 'Spend, blended ROAS and payback by channel' },
  { to: '/ecommerce/fulfilment', key: 'fulfilment', label: 'Fulfilment', icon: Truck, blurb: 'Pick, pack and shipping cost per order' },
  { to: '/ecommerce/returns', key: 'returns', label: 'Returns', icon: RotateCcw, blurb: 'Return rate, reasons and the margin they take back' },
]
