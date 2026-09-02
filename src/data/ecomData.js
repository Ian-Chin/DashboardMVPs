// Generated e-commerce transactions, built the same way as the restaurant demo
// data: deterministic seeds, so the numbers hold still between reloads and every
// figure on screen can be traced back to a row here.
//
// The generator works at order level per channel per day, then splits units
// across SKUs, so the channel table and the product table reconcile to the same
// revenue rather than being two independent piles of numbers.

import { DATES, HISTORY_DAYS } from './demoData.js'
import { adPlatforms, channels, FULFILMENT, products, RETURN_REASONS } from './ecomCatalog.js'
import { dayOfWeek } from '../lib/date.js'
import { seededFloat, seededNoise } from '../lib/rng.js'

const dateIndex = Object.fromEntries(DATES.map((d, i) => [d, i]))

/** Marketplace campaign days: double-digit dates plus payday. Traffic spikes,
 *  discounting deepens, and margin quietly gets worse. */
function campaignFactor(date) {
  const day = Number(date.slice(8, 10))
  const month = Number(date.slice(5, 7))
  if (day === month) return 2.15 // 11.11, 12.12 and friends
  if (day === 15 || day === 25) return 1.28 // payday
  if (day === 1) return 1.16
  return 1
}

/** Weekends convert better on marketplaces, worse on the own store. */
function weekdayFactor(date, channelId) {
  const dow = dayOfWeek(date)
  const weekend = dow === 0 || dow === 6
  if (channelId === 'ch_store') return weekend ? 0.94 : 1.03
  return weekend ? 1.11 : 0.97
}

/** Slow compounding growth, so period-on-period comparisons mean something. */
function trendFactor(i) {
  return 0.82 + (i / HISTORY_DAYS) * 0.36
}

const productShareTotal = products.reduce((s, p) => s + p.share, 0)

/** Unit demand weights for one channel, normalised to 1. */
const shareByChannel = Object.fromEntries(
  channels.map((c) => {
    const raw = products.map((p) => (p.share / productShareTotal) * (p.channelSkew?.[c.id] ?? 1))
    const total = raw.reduce((s, v) => s + v, 0)
    return [c.id, Object.fromEntries(products.map((p, i) => [p.id, raw[i] / total]))]
  }),
)

/**
 * Ad spend for one channel on one day, per platform. Exported because the
 * marketing dashboard reports real per-platform spend rather than splitting a
 * channel total after the fact.
 */
export function platformSpend(date, channelId) {
  const i = dateIndex[date] ?? 0
  const out = {}
  for (const plat of adPlatforms) {
    const weight = plat.attribution[channelId]
    if (!weight) continue
    const daily =
      plat.baseDaily *
      trendFactor(i) *
      campaignFactor(date) ** 0.7 *
      seededNoise(`ad:${plat.id}:${date}`, 0.14)
    out[plat.id] = daily * weight
  }
  return out
}

/** Ad spend per channel per day, summed from the platforms that feed it. */
function adSpendFor(date, i, channelId) {
  return Object.values(platformSpend(date, channelId)).reduce((s, v) => s + v, 0)
}

/**
 * One row per channel per day. Everything downstream reads these; nothing
 * recomputes revenue from a different formula.
 */
function buildDaily() {
  const rows = []
  const productRows = []

  for (const date of DATES) {
    const i = dateIndex[date]
    const camp = campaignFactor(date)

    for (const c of channels) {
      const sessions = Math.round(
        c.baseSessions * trendFactor(i) * weekdayFactor(date, c.id) * camp * seededNoise(`sess:${c.id}:${date}`, 0.16),
      )
      // Campaign traffic converts worse than it looks — more browsing, more carts abandoned.
      const convRate = c.convRate * seededNoise(`cvr:${c.id}:${date}`, 0.11) * (camp > 1.5 ? 0.88 : 1)
      const orders = Math.max(1, Math.round((sessions * convRate) / 100))
      const unitsTarget = orders * c.unitsPerOrder * seededNoise(`upo:${c.id}:${date}`, 0.06)

      // Split units across SKUs, keeping the total honest.
      const shares = shareByChannel[c.id]
      const units = {}
      let allocated = 0
      for (const p of products) {
        const want = unitsTarget * shares[p.id] * seededNoise(`mix:${c.id}:${p.id}:${date}`, 0.22)
        const u = Math.round(want)
        if (u > 0) {
          units[p.id] = u
          allocated += u
        }
      }
      if (allocated === 0) {
        units[products[0].id] = 1
        allocated = 1
      }

      // Discounting deepens on campaign days and on marketplaces generally.
      const baseDiscount = c.id === 'ch_store' ? 6.5 : 12.5
      const discountPct = baseDiscount * (camp > 1.5 ? 1.55 : 1) * seededNoise(`disc:${c.id}:${date}`, 0.12)

      let gross = 0
      let cogs = 0
      let weight = 0
      let returnUnits = 0
      let returnValue = 0
      let returnCogsLost = 0

      for (const p of products) {
        const u = units[p.id]
        if (!u) continue
        const lineGross = u * p.price * c.aovIndex
        gross += lineGross
        cogs += u * p.cost
        weight += u * p.weightKg

        // Returns are booked against the order that caused them, not the day
        // the parcel comes back — otherwise product margin never sees them.
        const rate = (c.returnRate * p.returnIndex * seededNoise(`ret:${c.id}:${p.id}:${date}`, 0.25)) / 100
        const ru = u * rate
        returnUnits += ru
        returnValue += ru * p.price * c.aovIndex * (1 - discountPct / 100)
        // Whatever comes back unsellable is cost that never converts to revenue.
        const recoverable = RETURN_REASONS.reduce((s, r) => s + r.weight * r.recoverable, 0)
        returnCogsLost += ru * p.cost * (1 - recoverable)

        productRows.push({
          date,
          channelId: c.id,
          productId: p.id,
          units: u,
          revenue: lineGross * (1 - discountPct / 100),
          cogs: u * p.cost,
          returnUnits: ru,
          returnValue: ru * p.price * c.aovIndex * (1 - discountPct / 100),
        })
      }

      const discount = gross * (discountPct / 100)
      const net = gross - discount
      const channelFees = net * ((c.feePct + c.paymentPct) / 100)
      const shipping = Math.max(
        0,
        orders * (FULFILMENT.pickPack + FULFILMENT.baseFreight - c.shipSubsidy) + weight * FULFILMENT.perKg,
      )
      const returnCost = returnUnits * FULFILMENT.returnHandling
      const adSpend = adSpendFor(date, i, c.id)

      rows.push({
        date,
        channelId: c.id,
        sessions,
        orders,
        units: allocated,
        gross,
        discount,
        net,
        cogs,
        channelFees,
        shipping,
        adSpend,
        returnUnits,
        returnValue,
        returnCost,
        returnCogsLost,
      })
    }
  }

  return { rows, productRows }
}

const built = buildDaily()

export const ecomDaily = built.rows
export const ecomProductDaily = built.productRows

/** Indexed for fast period slicing — the tables filter by date constantly. */
export const ecomDailyByDate = ecomDaily.reduce((acc, r) => {
  ;(acc[r.date] ||= []).push(r)
  return acc
}, {})

export const ecomProductByDate = ecomProductDaily.reduce((acc, r) => {
  ;(acc[r.date] ||= []).push(r)
  return acc
}, {})

/**
 * Returns by reason for a period. Reason weights are stable per channel, with a
 * deterministic wobble, so "damaged in transit" stays a marketplace problem.
 */
export function returnReasonSplit(date, channelId, totalUnits) {
  return RETURN_REASONS.map((r) => {
    const skew =
      r.key === 'damaged' && channelId !== 'ch_store'
        ? 1.35
        : r.key === 'changed_mind' && channelId === 'ch_tiktok'
          ? 1.3
          : 1
    return {
      ...r,
      units: totalUnits * r.weight * skew * seededNoise(`reason:${r.key}:${channelId}:${date}`, 0.18),
    }
  })
}

/** Stock still committed to open orders, so available-to-sell is not just on-hand. */
export const committedUnits = Object.fromEntries(
  products.map((p) => [p.id, Math.round(seededFloat(`committed:${p.id}`, 0.02, 0.12) * p.ats)]),
)
