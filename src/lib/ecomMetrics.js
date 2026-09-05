// E-commerce metrics. One definition of contribution, used everywhere.
//
// Contribution = net revenue − returns − COGS − channel fees − delivery − ad spend.
// Nothing here estimates: every figure sums rows from ecomData.js, and anything
// allocated (fees to a SKU, ad spend to a platform) says so at the call site.

import { adPlatforms, channels, FULFILMENT, productById } from '../data/ecomCatalog.js'
import {
  committedUnits,
  ecomDailyByDate,
  ecomProductByDate,
  platformSpend,
  returnReasonSplit,
} from '../data/ecomData.js'
import { previousRange, rangeKeys, shiftedRange } from './date.js'

export const ALL_CHANNELS = 'all'

/** Steps of the on-site funnel that we do not store per session. Fixed ratios,
 *  applied to real sessions and real orders, so the ends of the funnel are true. */
const FUNNEL = { viewRate: 0.62, cartFromView: 0.23, checkoutFromCart: 0.52 }

const EMPTY = {
  sessions: 0,
  orders: 0,
  units: 0,
  gross: 0,
  discount: 0,
  net: 0,
  cogs: 0,
  channelFees: 0,
  shipping: 0,
  adSpend: 0,
  returnUnits: 0,
  returnValue: 0,
  returnCost: 0,
  returnCogsLost: 0,
}

function accumulate(target, row) {
  for (const key of Object.keys(EMPTY)) target[key] += row[key] || 0
  return target
}

function derive(t) {
  const netAfterReturns = t.net - t.returnValue
  const cogsKept = t.cogs - (t.returnValue > 0 ? t.cogs * (t.returnValue / (t.net || 1)) : 0) + t.returnCogsLost
  const grossProfit = netAfterReturns - cogsKept
  const contribution = grossProfit - t.channelFees - t.shipping - t.returnCost - t.adSpend

  return {
    ...t,
    netAfterReturns,
    cogsKept,
    grossProfit,
    grossMarginPct: netAfterReturns ? (grossProfit / netAfterReturns) * 100 : 0,
    contribution,
    contributionPct: netAfterReturns ? (contribution / netAfterReturns) * 100 : 0,
    contributionPerOrder: t.orders ? contribution / t.orders : 0,
    aov: t.orders ? netAfterReturns / t.orders : 0,
    unitsPerOrder: t.orders ? t.units / t.orders : 0,
    convRate: t.sessions ? (t.orders / t.sessions) * 100 : 0,
    returnRatePct: t.units ? (t.returnUnits / t.units) * 100 : 0,
    feePct: t.net ? (t.channelFees / t.net) * 100 : 0,
    shippingPerOrder: t.orders ? t.shipping / t.orders : 0,
    adPct: t.net ? (t.adSpend / t.net) * 100 : 0,
    mer: t.adSpend ? netAfterReturns / t.adSpend : 0,
    cac: t.orders ? t.adSpend / t.orders : 0,
  }
}

function matches(row, channelId) {
  return channelId === ALL_CHANNELS || row.channelId === channelId
}

/** Period totals plus a per-day series for the charts. */
export function ecomPeriod(channelId, from, to) {
  const dates = rangeKeys(from, to)
  const totals = { ...EMPTY }
  const daily = []

  for (const date of dates) {
    const day = { ...EMPTY, date }
    for (const row of ecomDailyByDate[date] || []) {
      if (!matches(row, channelId)) continue
      accumulate(day, row)
      accumulate(totals, row)
    }
    daily.push(derive(day))
  }

  const out = derive(totals)
  out.days = dates.length
  out.daily = daily
  out.dates = dates

  out.funnel = [
    { key: 'sessions', label: 'Sessions', value: Math.round(out.sessions) },
    { key: 'views', label: 'Product views', value: Math.round(out.sessions * FUNNEL.viewRate) },
    { key: 'cart', label: 'Added to cart', value: Math.round(out.sessions * FUNNEL.viewRate * FUNNEL.cartFromView) },
    {
      key: 'checkout',
      label: 'Reached checkout',
      value: Math.round(out.sessions * FUNNEL.viewRate * FUNNEL.cartFromView * FUNNEL.checkoutFromCart),
    },
    { key: 'orders', label: 'Orders', value: out.orders },
  ]

  // Where a ringgit of net revenue ends up. Reads left to right as a P&L.
  out.waterfall = [
    { label: 'Net revenue', value: out.net, type: 'start' },
    { label: 'Returns', value: out.returnValue },
    { label: 'COGS', value: out.cogsKept },
    { label: 'Channel fees', value: out.channelFees },
    { label: 'Delivery', value: out.shipping + out.returnCost },
    { label: 'Ad spend', value: out.adSpend },
    { label: 'Contribution', type: 'total' },
  ]

  return out
}

/**
 * What the current period is measured against. Every analytics tool worth
 * copying puts this next to the date range rather than hard-coding it.
 *
 * `weeks4` shifts back four whole weeks so each day lands on the same weekday
 * and roughly the same point in the month. In a business whose demand is a
 * weekday shape with campaign spikes on double-digit dates, that is the only
 * honest like-for-like short of a full year, which this dataset does not hold.
 */
export const COMPARE_MODES = [
  // `short` reads after "vs"; `phrase` reads inside a sentence.
  {
    key: 'previous',
    label: 'Previous period',
    short: 'previous period',
    phrase: 'the previous period',
    range: (f, t) => previousRange(f, t),
  },
  {
    key: 'weeks4',
    label: '4 weeks earlier',
    short: '4 weeks earlier',
    phrase: 'the same days four weeks earlier',
    range: (f, t) => shiftedRange(f, t, 4),
  },
]

export function compareRangeFor(mode, from, to) {
  const m = COMPARE_MODES.find((c) => c.key === mode) || COMPARE_MODES[0]
  return m.range(from, to)
}

export function ecomPeriodWithComparison(channelId, from, to, compareMode = 'previous') {
  const prev = compareRangeFor(compareMode, from, to)
  const current = ecomPeriod(channelId, from, to)
  const previous = ecomPeriod(channelId, prev.from, prev.to)

  const change = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : null)
  const points = (a, b) => a - b

  return {
    current,
    previous,
    compareMode,
    compareRange: prev,
    compareLabel: (COMPARE_MODES.find((c) => c.key === compareMode) || COMPARE_MODES[0]).short,
    comparePhrase: (COMPARE_MODES.find((c) => c.key === compareMode) || COMPARE_MODES[0]).phrase,
    delta: {
      net: change(current.netAfterReturns, previous.netAfterReturns),
      contribution: change(current.contribution, previous.contribution),
      contributionPct: points(current.contributionPct, previous.contributionPct),
      contributionPerOrder: change(current.contributionPerOrder, previous.contributionPerOrder),
      orders: change(current.orders, previous.orders),
      aov: change(current.aov, previous.aov),
      sessions: change(current.sessions, previous.sessions),
      convRate: points(current.convRate, previous.convRate),
      adSpend: change(current.adSpend, previous.adSpend),
      mer: change(current.mer, previous.mer),
      returnRatePct: points(current.returnRatePct, previous.returnRatePct),
      cac: change(current.cac, previous.cac),
      grossMarginPct: points(current.grossMarginPct, previous.grossMarginPct),
    },
  }
}

/** One row per channel, normalised so they can be compared like for like. */
export function channelBreakdown(from, to) {
  const prev = previousRange(from, to)
  return channels.map((c) => {
    const cur = ecomPeriod(c.id, from, to)
    const before = ecomPeriod(c.id, prev.from, prev.to)
    return {
      id: c.id,
      name: c.name,
      short: c.short,
      revenue: cur.netAfterReturns,
      orders: cur.orders,
      aov: cur.aov,
      feePct: cur.feePct,
      returnRatePct: cur.returnRatePct,
      adSpend: cur.adSpend,
      contribution: cur.contribution,
      contributionPct: cur.contributionPct,
      contributionPerOrder: cur.contributionPerOrder,
      mer: cur.mer,
      convRate: cur.convRate,
      revenueChangePct: before.netAfterReturns
        ? ((cur.netAfterReturns - before.netAfterReturns) / before.netAfterReturns) * 100
        : null,
      contributionChangePct: before.contribution
        ? ((cur.contribution - before.contribution) / Math.abs(before.contribution)) * 100
        : null,
    }
  })
}

/**
 * Per-SKU contribution. Channel fees and ad spend are allocated by share of
 * revenue, delivery by share of parcel weight — the only defensible split when
 * an order carries several SKUs.
 */
export function productPerformance(channelId, from, to) {
  const dates = rangeKeys(from, to)
  const period = ecomPeriod(channelId, from, to)

  const acc = new Map()
  let weightTotal = 0

  for (const date of dates) {
    for (const row of ecomProductByDate[date] || []) {
      if (!matches(row, channelId)) continue
      const p = productById[row.productId]
      const cur = acc.get(row.productId) || {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        units: 0,
        revenue: 0,
        cogs: 0,
        returnUnits: 0,
        returnValue: 0,
        weight: 0,
      }
      cur.units += row.units
      cur.revenue += row.revenue
      cur.cogs += row.cogs
      cur.returnUnits += row.returnUnits
      cur.returnValue += row.returnValue
      cur.weight += row.units * p.weightKg
      weightTotal += row.units * p.weightKg
      acc.set(row.productId, cur)
    }
  }

  const revenueTotal = [...acc.values()].reduce((s, r) => s + r.revenue, 0) || 1
  const deliveryPool = period.shipping + period.returnCost

  const rows = [...acc.values()].map((r) => {
    const revenueShare = r.revenue / revenueTotal
    const weightShare = weightTotal ? r.weight / weightTotal : revenueShare
    const netRevenue = r.revenue - r.returnValue
    const fees = period.channelFees * revenueShare
    const delivery = deliveryPool * weightShare
    const ads = period.adSpend * revenueShare
    const cogsKept = r.cogs * (1 - r.returnValue / (r.revenue || 1))
    const contribution = netRevenue - cogsKept - fees - delivery - ads
    const p = productById[r.id]

    return {
      ...r,
      netRevenue,
      fees,
      delivery,
      ads,
      contribution,
      contributionPct: netRevenue ? (contribution / netRevenue) * 100 : 0,
      contributionPerUnit: r.units ? contribution / r.units : 0,
      grossMarginPct: netRevenue ? ((netRevenue - cogsKept) / netRevenue) * 100 : 0,
      returnRatePct: r.units ? (r.returnUnits / r.units) * 100 : 0,
      ats: Math.max(0, p.ats - (committedUnits[p.id] || 0)),
      committed: committedUnits[p.id] || 0,
      daysCover: r.units ? Math.max(0, p.ats - (committedUnits[p.id] || 0)) / (r.units / dates.length) : null,
    }
  })

  // Same idea as menu engineering: volume against margin, four quadrants.
  const medianUnits = median(rows.map((r) => r.units))
  const medianMargin = median(rows.map((r) => r.contributionPct))
  for (const r of rows) {
    const high = r.units >= medianUnits
    const rich = r.contributionPct >= medianMargin
    r.classification = high && rich ? CLASSES.winner : high ? CLASSES.volume : rich ? CLASSES.niche : CLASSES.drag
  }

  return { rows, medianUnits, medianMargin }
}

export const CLASSES = {
  winner: { key: 'winner', label: 'Winner', tone: 'success', note: 'High volume, high contribution. Protect stock' },
  volume: { key: 'volume', label: 'Volume', tone: 'warning', note: 'Sells hard, thin margin. Fix cost or price' },
  niche: { key: 'niche', label: 'Niche', tone: 'info', note: 'Rich margin, low volume. Worth promoting' },
  drag: { key: 'drag', label: 'Drag', tone: 'danger', note: 'Low volume and low contribution. Cut or reprice' },
}

function median(values) {
  const arr = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!arr.length) return 0
  const mid = Math.floor(arr.length / 2)
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
}

/** Returns split by reason, and the SKUs driving the rate. */
export function returnsBreakdown(channelId, from, to) {
  const dates = rangeKeys(from, to)
  const byReason = new Map()

  for (const date of dates) {
    for (const row of ecomDailyByDate[date] || []) {
      if (!matches(row, channelId)) continue
      for (const r of returnReasonSplit(date, row.channelId, row.returnUnits)) {
        const cur = byReason.get(r.key) || { key: r.key, label: r.label, units: 0, recoverable: r.recoverable }
        cur.units += r.units
        byReason.set(r.key, cur)
      }
    }
  }

  const period = ecomPeriod(channelId, from, to)
  const unitsTotal = [...byReason.values()].reduce((s, r) => s + r.units, 0) || 1
  const reasons = [...byReason.values()]
    .map((r) => ({
      ...r,
      sharePct: (r.units / unitsTotal) * 100,
      value: period.returnValue * (r.units / unitsTotal),
      writeOff: period.returnValue * (r.units / unitsTotal) * (1 - r.recoverable),
    }))
    .sort((a, b) => b.units - a.units)

  const worst = productPerformance(channelId, from, to)
    .rows.filter((r) => r.units > 10)
    .sort((a, b) => b.returnRatePct - a.returnRatePct)
    .slice(0, 5)

  return { reasons, worst, period }
}

/**
 * Ad platforms. Attributed revenue follows each platform's share of the spend
 * inside a channel — a blended view, not click attribution, and labelled as
 * such wherever it is shown.
 */
export function marketingBreakdown(channelId, from, to) {
  const period = ecomPeriod(channelId, from, to)
  const scope = channelId === ALL_CHANNELS ? channels.map((c) => c.id) : [channelId]
  const perChannel = Object.fromEntries(scope.map((id) => [id, ecomPeriod(id, from, to)]))

  const rows = adPlatforms.map((plat) => {
    let spend = 0
    let attributed = 0
    for (const id of scope) {
      const weight = plat.attribution[id]
      if (!weight) continue
      const totalWeight = adPlatforms.reduce((sum, p) => sum + (p.attribution[id] || 0), 0) || 1
      const share = weight / totalWeight
      spend += perChannel[id].adSpend * share
      attributed += perChannel[id].netAfterReturns * share
    }
    return {
      id: plat.id,
      name: plat.name,
      spend,
      attributed,
      roas: spend ? attributed / spend : 0,
      sharePct: period.adSpend ? (spend / period.adSpend) * 100 : 0,
    }
  })

  return { rows: rows.sort((a, b) => b.spend - a.spend), period }
}

/**
 * The rule book. Same shape as the restaurant alerts so the two workspaces read
 * alike: what is wrong, what it costs a month, and where to go to fix it.
 */
export const ECOM_TARGETS = {
  contributionPct: 18,
  returnRatePct: 6,
  adPct: 14,
  daysCover: 14,
}

export function ecomIssues(channelId, from, to) {
  const { current } = ecomPeriodWithComparison(channelId, from, to)
  const perMonth = (v) => (current.days ? (v / current.days) * 30 : 0)
  const issues = []
  const positives = []

  for (const c of channelBreakdown(from, to)) {
    if (channelId !== ALL_CHANNELS && c.id !== channelId) continue
    if (c.contributionPct < 0) {
      issues.push({
        id: `channel-loss-${c.id}`,
        severity: 'critical',
        category: 'Channel',
        title: `${c.name} sells below cost`,
        detail: `Every order loses ${Math.abs(c.contributionPerOrder).toFixed(2)} after fees, delivery, returns and ads. Fee load is ${c.feePct.toFixed(1)}% and returns run at ${c.returnRatePct.toFixed(1)}%.`,
        action: 'Raise prices on this channel, cut the free-shipping threshold, or stop funding it with ads.',
        metric: `${c.contributionPct.toFixed(1)}%`,
        target: `${ECOM_TARGETS.contributionPct}%`,
        impact: Math.abs(perMonth(c.contribution)),
      })
    } else if (c.contributionPct < ECOM_TARGETS.contributionPct) {
      issues.push({
        id: `channel-thin-${c.id}`,
        severity: 'warning',
        category: 'Channel',
        title: `${c.name} contribution is ${c.contributionPct.toFixed(1)}%`,
        detail: `Target is ${ECOM_TARGETS.contributionPct}%. Closing the gap is worth the difference on ${Math.round(c.orders)} orders.`,
        action: 'Shift the SKU mix towards the winners in the product table, or renegotiate the delivery subsidy.',
        metric: `${c.contributionPct.toFixed(1)}%`,
        target: `${ECOM_TARGETS.contributionPct}%`,
        impact: perMonth((c.revenue * (ECOM_TARGETS.contributionPct - c.contributionPct)) / 100),
      })
    } else {
      positives.push({
        id: `channel-ok-${c.id}`,
        severity: 'positive',
        category: 'Channel',
        title: `${c.name} holds ${c.contributionPct.toFixed(1)}% contribution`,
        detail: `${c.contributionPerOrder.toFixed(2)} per order after everything.`,
        action: 'Nothing to do. Keep the mix as it is.',
      })
    }
  }

  if (current.returnRatePct > ECOM_TARGETS.returnRatePct) {
    const excess = current.returnRatePct - ECOM_TARGETS.returnRatePct
    issues.push({
      id: 'returns-rate',
      severity: current.returnRatePct > ECOM_TARGETS.returnRatePct * 1.5 ? 'critical' : 'warning',
      category: 'Returns',
      title: `Return rate is ${current.returnRatePct.toFixed(1)}%`,
      detail: `Target is ${ECOM_TARGETS.returnRatePct}%. The excess costs refunded margin plus RM9.50 handling on every parcel that comes back.`,
      action: 'Work the top reason in the returns panel: sizing copy, packaging, or the SKUs with the worst rate.',
      metric: `${current.returnRatePct.toFixed(1)}%`,
      target: `${ECOM_TARGETS.returnRatePct}%`,
      impact: perMonth((current.returnValue * excess) / (current.returnRatePct || 1)),
    })
  }

  if (current.adPct > ECOM_TARGETS.adPct) {
    issues.push({
      id: 'ad-load',
      severity: 'warning',
      category: 'Marketing',
      title: `Ad spend is ${current.adPct.toFixed(1)}% of revenue`,
      detail: `Target is ${ECOM_TARGETS.adPct}%. Blended MER is ${current.mer.toFixed(2)}, and ${current.cac.toFixed(2)} of ad cost sits in every order.`,
      action: 'Cut spend on the platform with the lowest blended ROAS before touching price.',
      metric: `${current.adPct.toFixed(1)}%`,
      target: `${ECOM_TARGETS.adPct}%`,
      impact: perMonth((current.net * (current.adPct - ECOM_TARGETS.adPct)) / 100),
    })
  }

  const { rows } = productPerformance(channelId, from, to)
  const bleeding = rows.filter((r) => r.contribution < 0).sort((a, b) => a.contribution - b.contribution)
  for (const r of bleeding.slice(0, 3)) {
    issues.push({
      id: `sku-loss-${r.id}`,
      severity: 'warning',
      category: 'Products',
      title: `${r.name} loses money on every unit`,
      detail: `${Math.abs(r.contributionPerUnit).toFixed(2)} lost per unit across ${Math.round(r.units)} sold, with a ${r.returnRatePct.toFixed(1)}% return rate.`,
      action: 'Reprice it, bundle it with a winner, or delist it from the channels where it loses most.',
      metric: `${r.contributionPct.toFixed(1)}%`,
      target: `${ECOM_TARGETS.contributionPct}%`,
      impact: Math.abs(perMonth(r.contribution)),
    })
  }

  const thin = rows.filter((r) => r.daysCover !== null && r.daysCover < 7 && r.units > 20)
  for (const r of thin.slice(0, 2)) {
    issues.push({
      id: `stock-${r.id}`,
      severity: 'info',
      category: 'Stock',
      title: `${r.name} has ${r.daysCover.toFixed(1)} days of cover`,
      detail: `${Math.round(r.ats)} available to sell across all channels after ${Math.round(r.committed)} committed to open orders.`,
      action: 'Reorder now or pull it from the channel that sells it at the thinnest margin.',
      metric: `${r.daysCover.toFixed(1)} days`,
      target: `${ECOM_TARGETS.daysCover} days`,
      impact: Math.max(0, perMonth(r.contribution) * 0.25),
    })
  }

  issues.sort((a, b) => {
    const rank = { critical: 0, warning: 1, info: 2 }
    return rank[a.severity] - rank[b.severity] || (b.impact || 0) - (a.impact || 0)
  })

  const impact = issues.reduce((s, a) => s + Math.max(0, a.impact || 0), 0)

  // A single number for the top of the page: how much of the target contribution
  // the business holds on to, docked for every rule that is currently breached.
  // A channel selling below cost has to move this number, or it is decoration.
  const base = Math.min(100, (current.contributionPct / ECOM_TARGETS.contributionPct) * 82)
  const penalty = issues.reduce(
    (s, a) => s + (a.severity === 'critical' ? 18 : a.severity === 'warning' ? 7 : 2),
    0,
  )
  const bonus =
    (current.returnRatePct <= ECOM_TARGETS.returnRatePct ? 9 : 0) + (current.adPct <= ECOM_TARGETS.adPct ? 9 : 0)
  const score = Math.max(0, Math.min(100, Math.round(base + bonus - penalty)))

  return {
    issues,
    positives,
    impact,
    score,
    label: score >= 75 ? 'Healthy' : score >= 55 ? 'Watch' : 'At risk',
    tone: score >= 75 ? 'success' : score >= 55 ? 'warning' : 'danger',
  }
}

// ---------------------------------------------------------------------------
// Breakdowns for the dedicated dashboards
// ---------------------------------------------------------------------------

/** Products rolled up by category. Same allocation rules as the SKU table. */
export function categoryBreakdown(channelId, from, to) {
  const { rows } = productPerformance(channelId, from, to)
  const acc = new Map()
  for (const r of rows) {
    const cur = acc.get(r.category) || {
      id: r.category,
      category: r.category,
      units: 0,
      netRevenue: 0,
      contribution: 0,
      returnUnits: 0,
      skus: 0,
    }
    cur.units += r.units
    cur.netRevenue += r.netRevenue
    cur.contribution += r.contribution
    cur.returnUnits += r.returnUnits
    cur.skus += 1
    acc.set(r.category, cur)
  }
  return [...acc.values()]
    .map((c) => ({
      ...c,
      contributionPct: c.netRevenue ? (c.contribution / c.netRevenue) * 100 : 0,
      returnRatePct: c.units ? (c.returnUnits / c.units) * 100 : 0,
    }))
    .sort((a, b) => b.contribution - a.contribution)
}

/** One SKU, opened up: daily movement and how it sells on each channel. */
export function productDetail(productId, channelId, from, to) {
  const dates = rangeKeys(from, to)
  const product = productById[productId]

  const daily = dates.map((date) => {
    let units = 0
    let revenue = 0
    let returnUnits = 0
    for (const row of ecomProductByDate[date] || []) {
      if (row.productId !== productId || !matches(row, channelId)) continue
      units += row.units
      revenue += row.revenue
      returnUnits += row.returnUnits
    }
    return { date, units, revenue, returnUnits }
  })

  const mix = channels.map((c) => {
    let units = 0
    let revenue = 0
    let returnUnits = 0
    for (const date of dates) {
      for (const row of ecomProductByDate[date] || []) {
        if (row.productId !== productId || row.channelId !== c.id) continue
        units += row.units
        revenue += row.revenue
        returnUnits += row.returnUnits
      }
    }
    return {
      id: c.id,
      name: c.name,
      short: c.short,
      units,
      revenue,
      returnRatePct: units ? (returnUnits / units) * 100 : 0,
    }
  })

  const totalUnits = mix.reduce((s, m) => s + m.units, 0) || 1
  return {
    product,
    daily,
    mix: mix.map((m) => ({ ...m, sharePct: (m.units / totalUnits) * 100 })).sort((a, b) => b.units - a.units),
  }
}

/**
 * Marketing: real per-platform spend, the revenue of the channels that spend
 * feeds (blended, never click-attributed), and the daily shape of both.
 */
export function marketingAnalysis(channelId, from, to) {
  const dates = rangeKeys(from, to)
  const scope = channelId === ALL_CHANNELS ? channels.map((c) => c.id) : [channelId]
  const period = ecomPeriod(channelId, from, to)
  const prev = previousRange(from, to)
  const before = ecomPeriod(channelId, prev.from, prev.to)

  const spendByPlatform = new Map()
  const daily = dates.map((date, i) => {
    const day = { date, adSpend: 0, net: 0, contribution: 0, orders: 0 }
    for (const id of scope) {
      for (const [platId, spend] of Object.entries(platformSpend(date, id))) {
        spendByPlatform.set(platId, (spendByPlatform.get(platId) || 0) + spend)
        day.adSpend += spend
      }
    }
    const d = period.daily[i]
    day.net = d.netAfterReturns
    day.contribution = d.contribution
    day.orders = d.orders
    day.mer = day.adSpend ? day.net / day.adSpend : 0
    day.cac = day.orders ? day.adSpend / day.orders : 0
    day.contributionPct = d.contributionPct
    return day
  })

  // Revenue is attributed to a platform by its share of that channel's spend.
  const perChannel = Object.fromEntries(scope.map((id) => [id, ecomPeriod(id, from, to)]))
  const platforms = adPlatforms
    .map((plat) => {
      const spend = spendByPlatform.get(plat.id) || 0
      let attributed = 0
      for (const id of scope) {
        const weight = plat.attribution[id]
        if (!weight) continue
        const totalWeight = adPlatforms.reduce((s, p) => s + (p.attribution[id] || 0), 0) || 1
        attributed += perChannel[id].netAfterReturns * (weight / totalWeight)
      }
      return {
        id: plat.id,
        name: plat.name,
        spend,
        attributed,
        roas: spend ? attributed / spend : 0,
        sharePct: period.adSpend ? (spend / period.adSpend) * 100 : 0,
        feeds: channels
          .filter((c) => scope.includes(c.id) && plat.attribution[c.id])
          .map((c) => c.short)
          .join(', '),
      }
    })
    .sort((a, b) => b.spend - a.spend)

  // Campaign days: heavier traffic, deeper discounts, usually worse margin.
  const isCampaign = (date) => {
    const day = Number(date.slice(8, 10))
    const month = Number(date.slice(5, 7))
    return day === month || day === 15 || day === 25 || day === 1
  }
  const campaignDays = daily.filter((d) => isCampaign(d.date))
  const normalDays = daily.filter((d) => !isCampaign(d.date))
  const avg = (arr, key) => (arr.length ? arr.reduce((s, x) => s + x[key], 0) / arr.length : 0)

  return {
    period,
    previous: before,
    platforms,
    daily,
    campaign: {
      days: campaignDays.length,
      avgSpend: avg(campaignDays, 'adSpend'),
      avgContribution: avg(campaignDays, 'contribution'),
      avgContributionPct: avg(campaignDays, 'contributionPct'),
      normalSpend: avg(normalDays, 'adSpend'),
      normalContribution: avg(normalDays, 'contribution'),
      normalContributionPct: avg(normalDays, 'contributionPct'),
    },
  }
}

/**
 * Fulfilment: what it costs to get a parcel out and, when it comes back, in
 * again. Pick-pack, freight and the channel delivery subsidy, separated.
 */
export function fulfilmentAnalysis(channelId, from, to) {
  const dates = rangeKeys(from, to)
  const scope = channelId === ALL_CHANNELS ? channels : channels.filter((c) => c.id === channelId)

  const weightByChannel = {}
  const weightByProduct = new Map()
  for (const date of dates) {
    for (const row of ecomProductByDate[date] || []) {
      if (!matches(row, channelId)) continue
      const p = productById[row.productId]
      const w = row.units * p.weightKg
      weightByChannel[row.channelId] = (weightByChannel[row.channelId] || 0) + w
      const cur = weightByProduct.get(row.productId) || {
        id: p.id,
        name: p.name,
        sku: p.sku,
        units: 0,
        weight: 0,
      }
      cur.units += row.units
      cur.weight += w
      weightByProduct.set(row.productId, cur)
    }
  }

  const period = ecomPeriod(channelId, from, to)

  const rows = scope.map((c) => {
    const cp = ecomPeriod(c.id, from, to)
    const weight = weightByChannel[c.id] || 0
    return {
      id: c.id,
      name: c.name,
      short: c.short,
      orders: cp.orders,
      units: cp.units,
      weight,
      avgWeight: cp.orders ? weight / cp.orders : 0,
      pickPack: cp.orders * FULFILMENT.pickPack,
      freight: cp.orders * FULFILMENT.baseFreight + weight * FULFILMENT.perKg,
      subsidy: cp.orders * c.shipSubsidy,
      net: cp.shipping,
      perOrder: cp.orders ? cp.shipping / cp.orders : 0,
      returnCost: cp.returnCost,
      returnParcels: cp.returnUnits,
      revenue: cp.netAfterReturns,
      costPctOfRevenue: cp.netAfterReturns ? (cp.shipping / cp.netAfterReturns) * 100 : 0,
      sharePct: period.shipping ? (cp.shipping / period.shipping) * 100 : 0,
    }
  })

  const totalWeight = Object.values(weightByChannel).reduce((s, v) => s + v, 0)

  const daily = period.daily.map((d) => ({
    date: d.date,
    shipping: d.shipping,
    returnCost: d.returnCost,
    perOrder: d.orders ? d.shipping / d.orders : 0,
    orders: d.orders,
  }))

  const heaviest = [...weightByProduct.values()]
    .map((p) => ({
      ...p,
      freight: p.weight * FULFILMENT.perKg,
      kgPerUnit: p.units ? p.weight / p.units : 0,
    }))
    .sort((a, b) => b.freight - a.freight)
    .slice(0, 8)

  return {
    period,
    rows: rows.sort((a, b) => b.net - a.net),
    daily,
    heaviest,
    totals: {
      weight: totalWeight,
      pickPack: rows.reduce((s, r) => s + r.pickPack, 0),
      freight: rows.reduce((s, r) => s + r.freight, 0),
      subsidy: rows.reduce((s, r) => s + r.subsidy, 0),
      net: period.shipping,
      perOrder: period.orders ? period.shipping / period.orders : 0,
      returnCost: period.returnCost,
      perKg: totalWeight ? period.shipping / totalWeight : 0,
    },
  }
}

/** Returns in full: reasons, channels, SKUs, the daily rate, and what it costs. */
export function returnsAnalysis(channelId, from, to) {
  const base = returnsBreakdown(channelId, from, to)
  const period = base.period

  const byChannel = channels
    .filter((c) => channelId === ALL_CHANNELS || c.id === channelId)
    .map((c) => {
      const p = ecomPeriod(c.id, from, to)
      return {
        id: c.id,
        name: c.name,
        short: c.short,
        units: p.units,
        returnUnits: p.returnUnits,
        returnRatePct: p.returnRatePct,
        returnValue: p.returnValue,
        handling: p.returnCost,
        writeOff: p.returnCogsLost,
        costPerOrder: p.orders ? (p.returnValue + p.returnCost + p.returnCogsLost) / p.orders : 0,
      }
    })
    .sort((a, b) => b.returnRatePct - a.returnRatePct)

  const daily = period.daily.map((d) => ({
    date: d.date,
    returnRatePct: d.returnRatePct,
    returnValue: d.returnValue,
    units: d.units,
  }))

  const products = productPerformance(channelId, from, to)
    .rows.map((r) => ({
      ...r,
      returnValueShare: period.returnValue ? (r.returnValue / period.returnValue) * 100 : 0,
    }))
    .sort((a, b) => b.returnValue - a.returnValue)

  const reasonUnits = base.reasons.reduce((s, r) => s + r.units, 0) || 1
  const recoverableUnits = base.reasons.reduce((s, r) => s + r.units * r.recoverable, 0)

  return {
    ...base,
    byChannel,
    daily,
    products,
    cost: {
      refunded: period.returnValue,
      handling: period.returnCost,
      writeOff: period.returnCogsLost,
      total: period.returnValue + period.returnCost + period.returnCogsLost,
      restockablePct: (recoverableUnits / reasonUnits) * 100,
      perOrder: period.orders
        ? (period.returnValue + period.returnCost + period.returnCogsLost) / period.orders
        : 0,
    },
  }
}


/**
 * The contribution-margin P&L, as an ordered statement rather than a chart.
 *
 * This is the shape every profit tool in the category converges on, and the
 * reason is structural: a statement that does not put contribution margin on a
 * single line cannot answer whether an order makes money before overhead.
 * Revenue block, then cost of goods, then the variable costs an extra order
 * actually incurs, and a subtotal after each.
 *
 * `kind` drives the rendering: 'cost' lines are shown as deductions, 'subtotal'
 * lines rule off a block, 'total' is the answer.
 */
export function pnlStatement(current, previous, marketingRows = []) {
  const line = (label, key, kind, note) => ({
    label,
    kind,
    note,
    value: current[key] ?? 0,
    prior: previous ? previous[key] ?? 0 : null,
  })

  const marketing = marketingRows.map((r) => ({
    label: r.name,
    kind: 'cost',
    indent: true,
    value: r.spend,
    prior: null,
  }))

  return [
    { block: 'Revenue', lines: [
      line('Gross sales', 'gross', 'revenue'),
      line('Discounts', 'discount', 'cost'),
      line('Returns and refunds', 'returnValue', 'cost'),
      { label: 'Net revenue', kind: 'subtotal', value: current.netAfterReturns, prior: previous?.netAfterReturns ?? null },
    ] },

    { block: 'Cost of goods', lines: [
      line('Product cost', 'cogsKept', 'cost', 'net of stock that came back sellable'),
      { label: 'Gross profit', kind: 'subtotal', value: current.grossProfit, prior: previous?.grossProfit ?? null },
    ] },

    { block: 'Variable costs', lines: [
      line('Channel fees', 'channelFees', 'cost', 'marketplace commission and payment processing'),
      line('Delivery', 'shipping', 'cost', 'outbound carrier and pick-pack'),
      line('Return handling', 'returnCost', 'cost', 'inbound freight and re-processing'),
      { label: 'Ad spend', kind: 'cost', value: current.adSpend, prior: previous?.adSpend ?? null },
      ...marketing,
      { label: 'Contribution margin', kind: 'total', value: current.contribution, prior: previous?.contribution ?? null,
        note: 'what an order leaves behind before overhead' },
    ] },
  ]
}
