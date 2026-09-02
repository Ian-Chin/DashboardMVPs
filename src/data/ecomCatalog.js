// The e-commerce side of the business: one storefront plus three marketplaces.
//
// Fees, shipping rates and return behaviour differ per channel — which is the
// whole reason the workspace exists. A marketplace order at the same price is
// worth materially less than a storefront order once its fees land.

export const store = {
  name: 'Kirana Goods',
  currency: 'RM',
  platform: 'Shopify + marketplaces',
  lastSync: '12 minutes ago',
  fulfilmentCentre: 'Shah Alam DC',
}

/**
 * `feePct` is the channel's commission on gross merchandise value.
 * `paymentPct` is the gateway cut, charged even on the own store.
 * `shipSubsidy` is what the channel contributes to delivery per order.
 */
export const channels = [
  {
    id: 'ch_store',
    name: 'Own store',
    short: 'Store',
    feePct: 0,
    paymentPct: 2.4,
    shipSubsidy: 0,
    baseSessions: 3400,
    convRate: 2.35,
    aovIndex: 1.18,
    returnRate: 3.4,
    unitsPerOrder: 1.62,
  },
  {
    id: 'ch_shopee',
    name: 'Shopee',
    short: 'Shopee',
    feePct: 6.5,
    paymentPct: 2.1,
    shipSubsidy: 4.5,
    baseSessions: 5200,
    convRate: 2.9,
    aovIndex: 0.84,
    returnRate: 6.8,
    unitsPerOrder: 1.34,
  },
  {
    id: 'ch_lazada',
    name: 'Lazada',
    short: 'Lazada',
    feePct: 7.2,
    paymentPct: 2.0,
    shipSubsidy: 3.8,
    baseSessions: 2600,
    convRate: 2.55,
    aovIndex: 0.91,
    returnRate: 7.6,
    unitsPerOrder: 1.28,
  },
  {
    id: 'ch_tiktok',
    name: 'TikTok Shop',
    short: 'TikTok',
    feePct: 5.4,
    paymentPct: 2.2,
    shipSubsidy: 5.0,
    baseSessions: 4100,
    convRate: 3.4,
    aovIndex: 0.66,
    returnRate: 9.9,
    unitsPerOrder: 1.21,
  },
]

export const channelById = Object.fromEntries(channels.map((c) => [c.id, c]))

/**
 * `share` is the SKU's slice of unit demand before channel skew is applied;
 * `channelSkew` then bends it — bulky home goods barely move on TikTok, and
 * discovery-led accessories barely move on the own store.
 */
export const products = [
  { id: 'sku_serum', name: 'Barrier Repair Serum 30ml', sku: 'KG-SRM-30', category: 'Skincare', price: 129, cost: 41.5, share: 0.13, weightKg: 0.14, returnIndex: 0.7, ats: 1840, channelSkew: { ch_store: 1.35, ch_tiktok: 1.15 } },
  { id: 'sku_cleanser', name: 'Gentle Gel Cleanser 150ml', sku: 'KG-CLN-150', category: 'Skincare', price: 68, cost: 22.4, share: 0.11, weightKg: 0.22, returnIndex: 0.6, ats: 2260, channelSkew: { ch_shopee: 1.2 } },
  { id: 'sku_spf', name: 'Daily Mineral SPF50 50ml', sku: 'KG-SPF-50', category: 'Skincare', price: 89, cost: 31.2, share: 0.1, weightKg: 0.16, returnIndex: 0.8, ats: 980 },
  { id: 'sku_mask', name: 'Overnight Recovery Mask', sku: 'KG-MSK-60', category: 'Skincare', price: 112, cost: 46.8, share: 0.06, weightKg: 0.2, returnIndex: 1.0, ats: 410 },
  { id: 'sku_collagen', name: 'Marine Collagen Sachets 30s', sku: 'KG-COL-30', category: 'Supplements', price: 168, cost: 62.0, share: 0.09, weightKg: 0.34, returnIndex: 0.9, ats: 1220, channelSkew: { ch_store: 1.25 } },
  { id: 'sku_probiotic', name: 'Daily Probiotic 60s', sku: 'KG-PRB-60', category: 'Supplements', price: 145, cost: 58.5, share: 0.07, weightKg: 0.28, returnIndex: 0.8, ats: 760 },
  { id: 'sku_greens', name: 'Greens Powder 300g', sku: 'KG-GRN-300', category: 'Supplements', price: 189, cost: 84.0, share: 0.05, weightKg: 0.42, returnIndex: 1.1, ats: 340 },
  { id: 'sku_diffuser', name: 'Ceramic Diffuser', sku: 'KG-DIF-01', category: 'Home', price: 219, cost: 98.5, share: 0.05, weightKg: 1.35, returnIndex: 1.6, ats: 280, channelSkew: { ch_tiktok: 0.45, ch_store: 1.2 } },
  { id: 'sku_candle', name: 'Soy Candle Trio', sku: 'KG-CND-03', category: 'Home', price: 138, cost: 52.0, share: 0.06, weightKg: 0.95, returnIndex: 1.3, ats: 620, channelSkew: { ch_tiktok: 0.6 } },
  { id: 'sku_linen', name: 'Linen Spray 200ml', sku: 'KG-LNS-200', category: 'Home', price: 58, cost: 21.5, share: 0.05, weightKg: 0.3, returnIndex: 0.9, ats: 1480 },
  { id: 'sku_tote', name: 'Canvas Everyday Tote', sku: 'KG-TOT-01', category: 'Accessories', price: 79, cost: 38.0, share: 0.08, weightKg: 0.48, returnIndex: 1.8, ats: 940, channelSkew: { ch_tiktok: 1.6, ch_shopee: 1.25, ch_store: 0.7 } },
  { id: 'sku_pouch', name: 'Travel Pouch Set', sku: 'KG-PCH-02', category: 'Accessories', price: 49, cost: 24.5, share: 0.07, weightKg: 0.26, returnIndex: 1.5, ats: 1560, channelSkew: { ch_tiktok: 1.5 } },
  { id: 'sku_bottle', name: 'Insulated Bottle 600ml', sku: 'KG-BTL-600', category: 'Accessories', price: 95, cost: 46.0, share: 0.05, weightKg: 0.62, returnIndex: 1.4, ats: 205, channelSkew: { ch_tiktok: 1.3 } },
  { id: 'sku_bundle', name: 'Starter Ritual Bundle', sku: 'KG-BND-01', category: 'Bundles', price: 249, cost: 96.5, share: 0.03, weightKg: 0.7, returnIndex: 0.7, ats: 520, channelSkew: { ch_store: 1.9, ch_tiktok: 0.5 } },
]

export const productById = Object.fromEntries(products.map((p) => [p.id, p]))

export const CATEGORIES = [...new Set(products.map((p) => p.category))]

/** Ad platforms, and how their spend maps onto the selling channels. */
export const adPlatforms = [
  { id: 'ad_meta', name: 'Meta', baseDaily: 2900, attribution: { ch_store: 0.62, ch_shopee: 0.2, ch_lazada: 0.1, ch_tiktok: 0.08 } },
  { id: 'ad_google', name: 'Google', baseDaily: 1850, attribution: { ch_store: 0.68, ch_shopee: 0.16, ch_lazada: 0.14, ch_tiktok: 0.02 } },
  { id: 'ad_tiktok', name: 'TikTok Ads', baseDaily: 1600, attribution: { ch_tiktok: 0.74, ch_store: 0.14, ch_shopee: 0.09, ch_lazada: 0.03 } },
  { id: 'ad_marketplace', name: 'Marketplace ads', baseDaily: 1150, attribution: { ch_shopee: 0.52, ch_lazada: 0.33, ch_tiktok: 0.15 } },
]

/**
 * Return reasons carry a `recoverable` flag: stock that comes back sellable is
 * a margin dent, stock that does not is a write-off.
 */
export const RETURN_REASONS = [
  { key: 'changed_mind', label: 'Changed mind', weight: 0.3, recoverable: 0.9 },
  { key: 'wrong_variant', label: 'Wrong variant sent', weight: 0.16, recoverable: 0.95 },
  { key: 'damaged', label: 'Damaged in transit', weight: 0.19, recoverable: 0.1 },
  { key: 'not_described', label: 'Not as described', weight: 0.15, recoverable: 0.75 },
  { key: 'late', label: 'Arrived too late', weight: 0.12, recoverable: 0.85 },
  { key: 'faulty', label: 'Faulty on arrival', weight: 0.08, recoverable: 0.05 },
]

/** Cost of getting one parcel to a customer, before any channel subsidy. */
export const FULFILMENT = {
  pickPack: 2.8,
  baseFreight: 6.2,
  perKg: 3.4,
  returnHandling: 9.5,
}
