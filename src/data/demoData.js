// Generated transactional demo data.
//
// Everything here is deterministic: the same seeds always produce the same
// numbers, so the dashboard reads like a real restaurant that has been running
// for seven months rather than a random number generator.
//
// In production these arrays are what a POS connector would populate.

import { addDays, dayOfWeek, rangeKeys, toKey } from '../lib/date.js'
import { makeRng, seededFloat, seededNoise } from '../lib/rng.js'
import {
  employees,
  ingredients,
  ingredientById,
  menuItemById,
  menuItems,
  outlets,
  suppliers,
  WASTE_REASONS,
} from './catalog.js'

export const HISTORY_DAYS = 210
export const TODAY = toKey(new Date())
export const START = addDays(TODAY, -(HISTORY_DAYS - 1))
export const DATES = rangeKeys(START, TODAY)
const dateIndex = Object.fromEntries(DATES.map((d, i) => [d, i]))

export const SERVICE_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

// ---------------------------------------------------------------------------
// Ingredient prices over time
// ---------------------------------------------------------------------------

/** One-off market events, so Purchasing has real price shocks to surface. */
const PRICE_SHOCKS = [
  { ingredientId: 'ing_chicken_breast', daysAgo: 5, factor: 1.085, reason: 'Poultry supply shortage' },
  { ingredientId: 'ing_coffee', daysAgo: 6, factor: 1.062, reason: 'Green bean futures up' },
  { ingredientId: 'ing_lettuce', daysAgo: 4, factor: 1.093, reason: 'Highland flooding' },
  { ingredientId: 'ing_chocolate', daysAgo: 34, factor: 1.11, reason: 'Cocoa index spike' },
  { ingredientId: 'ing_egg', daysAgo: 47, factor: 1.05, reason: 'Subsidy adjustment' },
  { ingredientId: 'ing_tomato', daysAgo: 21, factor: 1.074, reason: 'Wet season shortage' },
  { ingredientId: 'ing_prawn', daysAgo: 18, factor: 0.955, reason: 'Seasonal catch surplus' },
]
const shockByIngredient = PRICE_SHOCKS.reduce((acc, s) => {
  ;(acc[s.ingredientId] ||= []).push(s)
  return acc
}, {})

const priceCache = new Map()

/** Unit purchase price for an ingredient on a given date. */
export function priceOf(ingredientId, date) {
  const key = `${ingredientId}|${date}`
  const hit = priceCache.get(key)
  if (hit !== undefined) return hit
  const ing = ingredientById[ingredientId]
  if (!ing) return 0
  const i = dateIndex[date] ?? HISTORY_DAYS - 1
  const week = Math.floor(i / 7)
  let p = ing.cost * (1 + (ing.drift * i) / 365) * seededNoise(`price:${ingredientId}:${week}`, 0.022)
  for (const shock of shockByIngredient[ingredientId] || []) {
    if (i >= HISTORY_DAYS - 1 - shock.daysAgo) p *= shock.factor
  }
  p = Math.round(p * 100) / 100
  priceCache.set(key, p)
  return p
}

export function priceShockFor(ingredientId) {
  return (shockByIngredient[ingredientId] || [])[0] || null
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

const DOW_FACTOR = [1.12, 0.86, 0.89, 0.95, 1.03, 1.24, 1.31] // Sun..Sat
const ITEMS_PER_ORDER = 1.5 // scaled per outlet by avgTicketBias

/** Item-level demand tilt: coffee peaks on weekdays, mains peak on weekends. */
function itemDowBias(item, dow) {
  const weekend = dow === 0 || dow === 6
  if (item.category === 'Drinks') return weekend ? 0.92 : 1.06
  if (item.category === 'Desserts') return weekend ? 1.18 : 0.94
  if (item.category === 'Food') return weekend ? 1.06 : 0.98
  return 1
}

/** Outlet menu-mix personality (KLCC skews to coffee, Shah Alam to local food). */
const OUTLET_MIX = {
  out_klcc: { Drinks: 1.22, Food: 0.94, Desserts: 1.1, Other: 1 },
  out_subang: { Drinks: 1.04, Food: 1.02, Desserts: 1.0, Other: 1 },
  out_pj: { Drinks: 0.92, Food: 1.1, Desserts: 0.88, Other: 1 },
  out_shahalam: { Drinks: 0.86, Food: 1.16, Desserts: 0.82, Other: 1 },
}

function paydayFactor(date) {
  const day = Number(date.slice(8, 10))
  if (day >= 25 && day <= 31) return 1.07
  if (day <= 3) return 1.05
  if (day >= 18 && day <= 22) return 0.96
  return 1
}

export const salesItems = [] // { date, outletId, itemId, units, gross }
export const salesDaily = [] // { date, outletId, orders, gross, discount, refund, net, dineIn, delivery }

const menuWeightTotal = menuItems.reduce((s, m) => s + m.popularity, 0)

for (const outlet of outlets) {
  const mix = OUTLET_MIX[outlet.id]
  for (const date of DATES) {
    const i = dateIndex[date]
    const dow = dayOfWeek(date)
    const trend = 1 + 0.11 * (i / HISTORY_DAYS)
    const noise = seededNoise(`orders:${outlet.id}:${date}`, 0.075)
    const orders = Math.max(
      20,
      Math.round(outlet.ordersBaseline * DOW_FACTOR[dow] * trend * noise * paydayFactor(date)),
    )
    const totalItems = orders * ITEMS_PER_ORDER * outlet.avgTicketBias

    let gross = 0
    const dayRows = []
    for (const item of menuItems) {
      const weight =
        (item.popularity / menuWeightTotal) *
        itemDowBias(item, dow) *
        (mix[item.category] ?? 1) *
        seededNoise(`mix:${outlet.id}:${item.id}:${Math.floor(i / 7)}`, 0.14)
      const units = Math.round(totalItems * weight * seededNoise(`u:${outlet.id}:${item.id}:${date}`, 0.22))
      if (units <= 0) continue
      const rowGross = units * item.price
      gross += rowGross
      dayRows.push({ date, outletId: outlet.id, itemId: item.id, units, gross: rowGross })
    }
    salesItems.push(...dayRows)

    // Promotions run harder on slow days, which is itself a margin story.
    const slow = DOW_FACTOR[dow] < 1
    const discountRate = seededFloat(`disc:${outlet.id}:${date}`, slow ? 0.028 : 0.012, slow ? 0.055 : 0.03)
    const refundRate = seededFloat(`ref:${outlet.id}:${date}`, 0.001, 0.008)
    const discount = gross * discountRate
    const refund = gross * refundRate
    const delivery = gross * outlet.deliveryShare * seededNoise(`del:${outlet.id}:${date}`, 0.12)

    salesDaily.push({
      date,
      outletId: outlet.id,
      orders,
      gross,
      discount,
      refund,
      net: gross - discount - refund,
      delivery,
      dineIn: gross - delivery,
    })
  }
}

const salesItemsByOutletDate = new Map()
for (const row of salesItems) {
  const key = `${row.outletId}|${row.date}`
  const arr = salesItemsByOutletDate.get(key)
  if (arr) arr.push(row)
  else salesItemsByOutletDate.set(key, [row])
}

export const salesDailyByOutletDate = new Map(salesDaily.map((r) => [`${r.outletId}|${r.date}`, r]))

// ---------------------------------------------------------------------------
// Ingredient usage: theoretical (recipe) vs actual (recipe + waste + variance)
// ---------------------------------------------------------------------------

const OUTLET_WASTE_BIAS = { out_klcc: 1.0, out_subang: 0.86, out_pj: 1.24, out_shahalam: 1.12 }
const OUTLET_VARIANCE_BIAS = { out_klcc: 1.35, out_subang: 0.72, out_pj: 1.15, out_shahalam: 0.95 }

/** Structural loss rates for an outlet/ingredient pair. Stable across the period. */
export function lossRates(outletId, ingredientId) {
  const ing = ingredientById[ingredientId]
  const base = ing.shelfLifeDays <= 5 ? 0.06 : ing.shelfLifeDays <= 14 ? 0.035 : 0.012
  const wasteRate = base * (OUTLET_WASTE_BIAS[outletId] ?? 1) * seededNoise(`w:${outletId}:${ingredientId}`, 0.25)
  const varianceRate =
    ing.varianceBias * (OUTLET_VARIANCE_BIAS[outletId] ?? 1) * seededNoise(`v:${outletId}:${ingredientId}`, 0.3)
  return { wasteRate: Math.max(0, wasteRate), varianceRate: Math.max(0, varianceRate) }
}

/**
 * usageIndex: `${outletId}|${date}` -> { expected, waste, variance } maps of
 * ingredientId -> quantity. Built once so every page reads the same numbers.
 */
export const usageIndex = new Map()

for (const outlet of outlets) {
  for (const date of DATES) {
    const key = `${outlet.id}|${date}`
    const rows = salesItemsByOutletDate.get(key) || []
    const expected = {}
    for (const row of rows) {
      const item = menuItemById[row.itemId]
      for (const line of item.recipe) {
        expected[line.ingredientId] = (expected[line.ingredientId] || 0) + line.qty * row.units
      }
    }
    const waste = {}
    const variance = {}
    for (const ingId of Object.keys(expected)) {
      const { wasteRate, varianceRate } = lossRates(outlet.id, ingId)
      // Daily jitter keeps single days lumpy while the period average holds.
      waste[ingId] = expected[ingId] * wasteRate * seededNoise(`wd:${outlet.id}:${ingId}:${date}`, 0.55)
      variance[ingId] = expected[ingId] * varianceRate * seededNoise(`vd:${outlet.id}:${ingId}:${date}`, 0.4)
    }
    usageIndex.set(key, { expected, waste, variance })
  }
}

export function usageFor(outletId, date) {
  return usageIndex.get(`${outletId}|${date}`) || { expected: {}, waste: {}, variance: {} }
}

// ---------------------------------------------------------------------------
// Waste records (the human-recorded subset of the waste quantity above)
// ---------------------------------------------------------------------------

export const wasteRecords = []
{
  const perishables = ingredients.filter((i) => i.shelfLifeDays <= 30)
  for (const outlet of outlets) {
    for (const date of DATES) {
      const { waste } = usageFor(outlet.id, date)
      const rng = makeRng(`waste:${outlet.id}:${date}`)
      const count = 2 + Math.floor(rng() * 4)
      const candidates = perishables.filter((i) => (waste[i.id] || 0) > 0)
      for (let k = 0; k < count && candidates.length; k++) {
        const ing = candidates[Math.floor(rng() * candidates.length)]
        const qty = (waste[ing.id] || 0) * (0.45 + rng() * 0.5)
        if (qty <= 0.0005) continue
        wasteRecords.push({
          id: `wst_${outlet.code}_${date}_${k}`,
          date,
          outletId: outlet.id,
          ingredientId: ing.id,
          qty,
          cost: qty * priceOf(ing.id, date),
          reason: WASTE_REASONS[Math.floor(rng() * WASTE_REASONS.length)],
          recordedBy: employees.filter((e) => e.outletId === outlet.id)[Math.floor(rng() * 3)]?.name ?? 'Staff',
        })
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Purchasing + stock balances
// ---------------------------------------------------------------------------

const suppliersByIngredient = ingredients.reduce((acc, ing) => {
  ;(acc[ing.supplierId] ||= []).push(ing)
  return acc
}, {})

/** Each supplier delivers to each outlet on fixed weekdays. */
function deliversOn(supplierId, outletId, date) {
  const dow = dayOfWeek(date)
  const slot = Math.abs(
    (supplierId.length * 7 + outletId.length * 3 + supplierId.charCodeAt(4) + outletId.charCodeAt(4)) % 7,
  )
  const cadence = supplierId === 'sup_segar' || supplierId === 'sup_dairy' || supplierId === 'sup_bakeri' ? 2 : 1
  if (cadence === 2) return dow === slot % 7 || dow === (slot + 3) % 7
  return dow === slot % 7
}

/** Some ingredients are systematically over- or under-ordered. */
function orderBias(outletId, ingredientId) {
  return seededFloat(`ob:${outletId}:${ingredientId}`, 0.92, 1.22)
}

/** How many days of cover an outlet keeps, by shelf life. */
function coverDaysFor(ing) {
  return ing.shelfLifeDays <= 5 ? 3 : ing.shelfLifeDays <= 14 ? 5 : 9
}

function roundPack(qty, unit) {
  if (unit === 'pc' || unit === 'set') return Math.ceil(qty / 10) * 10
  if (unit === 'tray' || unit === 'tin' || unit === 'loaf' || unit === 'bundle') return Math.ceil(qty)
  return Math.round(qty * 2) / 2
}

export const purchaseOrders = []
export const stockLevels = [] // { outletId, ingredientId, onHand, opening, lastDelivery, lastUnitPrice }

{
  // Running stock simulation across the whole history.
  const stock = {}
  const lastDelivery = {}
  const lastPrice = {}
  const opening = {}
  for (const outlet of outlets) {
    for (const ing of ingredients) {
      const k = `${outlet.id}|${ing.id}`
      opening[k] = Math.round(ing.minStock * seededFloat(`open:${k}`, 1.3, 2.1) * 10) / 10
      stock[k] = opening[k]
    }
  }

  const trailingUsage = (outletId, date, ingId) => {
    let total = 0
    for (let d = 0; d < 7; d++) {
      const u = usageFor(outletId, addDays(date, -d))
      total += (u.expected[ingId] || 0) + (u.waste[ingId] || 0) + (u.variance[ingId] || 0)
    }
    return total
  }

  let poSeq = 1000
  for (const date of DATES) {
    for (const outlet of outlets) {
      for (const supplier of suppliers) {
        if (!deliversOn(supplier.id, outlet.id, date)) continue
        const lines = []
        for (const ing of suppliersByIngredient[supplier.id] || []) {
          // Order up to a par level rather than blindly replacing usage, which is
          // what a real ordering sheet does — and it keeps stock realistic.
          const dailyUse = trailingUsage(outlet.id, date, ing.id) / 7
          if (dailyUse <= 0.0005) continue
          const bias = orderBias(outlet.id, ing.id)
          const par = Math.max(ing.minStock * 1.35, dailyUse * coverDaysFor(ing)) * bias
          const need = par - (stock[`${outlet.id}|${ing.id}`] || 0)
          if (need <= dailyUse * 0.5) continue
          const qty = roundPack(need, ing.unit)
          if (qty <= 0) continue
          const unitPrice = priceOf(ing.id, date)
          lines.push({ ingredientId: ing.id, qty, unitPrice, total: qty * unitPrice })
          const k = `${outlet.id}|${ing.id}`
          stock[k] += qty
          lastDelivery[k] = date
          lastPrice[k] = unitPrice
        }
        if (!lines.length) continue
        poSeq += 1
        purchaseOrders.push({
          id: `PO-${poSeq}`,
          date,
          outletId: outlet.id,
          supplierId: supplier.id,
          items: lines,
          total: lines.reduce((s, l) => s + l.total, 0),
          status: date === TODAY ? 'Pending' : 'Received',
        })
      }
      // Consume the day's actual usage.
      const u = usageFor(outlet.id, date)
      for (const ingId of Object.keys(u.expected)) {
        const k = `${outlet.id}|${ingId}`
        stock[k] = (stock[k] || 0) - ((u.expected[ingId] || 0) + (u.waste[ingId] || 0) + (u.variance[ingId] || 0))
        if (stock[k] < 0) stock[k] = 0 // an emergency top-up would have happened
      }
    }
  }

  for (const outlet of outlets) {
    for (const ing of ingredients) {
      const k = `${outlet.id}|${ing.id}`
      stockLevels.push({
        outletId: outlet.id,
        ingredientId: ing.id,
        onHand: Math.round((stock[k] || 0) * 100) / 100,
        opening: opening[k],
        lastDelivery: lastDelivery[k] || null,
        lastUnitPrice: lastPrice[k] ?? ing.cost,
      })
    }
  }
}

export const stockByKey = new Map(stockLevels.map((s) => [`${s.outletId}|${s.ingredientId}`, s]))

// ---------------------------------------------------------------------------
// Labor
// ---------------------------------------------------------------------------

const STAFFING_BIAS = { out_klcc: 0.97, out_subang: 0.92, out_pj: 1.16, out_shahalam: 1.07 }

const outletAvgRate = Object.fromEntries(
  outlets.map((o) => {
    const staff = employees.filter((e) => e.outletId === o.id)
    const hours = staff.reduce((s, e) => s + e.contractHours, 0)
    const cost = staff.reduce((s, e) => s + e.contractHours * e.hourlyRate, 0)
    return [o.id, cost / hours]
  }),
)

/** Average net revenue per outlet per weekday — the basis for the schedule. */
const dowRevenueMean = {}
{
  const acc = {}
  for (const row of salesDaily) {
    const key = `${row.outletId}|${dayOfWeek(row.date)}`
    ;(acc[key] ||= []).push(row.net)
  }
  for (const [key, list] of Object.entries(acc)) {
    dowRevenueMean[key] = list.reduce((s, v) => s + v, 0) / list.length
  }
}

export const laborRecords = [] // { date, outletId, employeeId, hours, otHours, cost }

for (const outlet of outlets) {
  const staff = employees.filter((e) => e.outletId === outlet.id)
  const contractTotal = staff.reduce((s, e) => s + e.contractHours, 0)
  // Sales-per-labour-hour target that lands the outlet near its labour goal.
  const splhTarget = (outletAvgRate[outlet.id] / (outlet.targetLaborCostPct / 100)) / STAFFING_BIAS[outlet.id]

  for (const date of DATES) {
    const dow = dayOfWeek(date)
    const planned = dowRevenueMean[`${outlet.id}|${dow}`] ?? 0
    const scheduled =
      Math.round((planned / splhTarget) * seededNoise(`sched:${outlet.id}:${date}`, 0.05) * 2) / 2

    for (const emp of staff) {
      // Everyone gets one rota day off, staggered across the team.
      const restDay = (emp.id.charCodeAt(4) + emp.id.charCodeAt(6)) % 7
      if (dow === restDay) continue
      const share = emp.contractHours / contractTotal
      let hours = scheduled * share * (7 / 6) * seededNoise(`h:${emp.id}:${date}`, 0.08)
      hours = Math.min(11, Math.max(0, Math.round(hours * 2) / 2))
      if (hours < 3) continue
      const otHours = Math.max(0, hours - 9)
      const cost = (hours - otHours) * emp.hourlyRate + otHours * emp.hourlyRate * 1.5
      laborRecords.push({ date, outletId: outlet.id, employeeId: emp.id, hours, otHours, cost })
    }
  }
}

// ---------------------------------------------------------------------------
// Intraday demand vs staffing profiles (used by the Labor page heat analysis)
// ---------------------------------------------------------------------------

const SALES_PROFILE_WEEKDAY = [0.03, 0.05, 0.06, 0.07, 0.12, 0.13, 0.07, 0.05, 0.05, 0.07, 0.11, 0.09, 0.06, 0.04]
const SALES_PROFILE_WEEKEND = [0.02, 0.04, 0.07, 0.09, 0.11, 0.11, 0.08, 0.07, 0.07, 0.08, 0.1, 0.09, 0.05, 0.02]
// Rosters are much flatter than demand — that gap is what the rules detect.
const LABOR_PROFILE = [0.06, 0.07, 0.07, 0.075, 0.08, 0.08, 0.075, 0.075, 0.07, 0.07, 0.075, 0.075, 0.07, 0.055]

export function salesHourShare(date, hourIdx) {
  const weekend = [0, 6].includes(dayOfWeek(date))
  const profile = weekend ? SALES_PROFILE_WEEKEND : SALES_PROFILE_WEEKDAY
  return profile[hourIdx] ?? 0
}

export function laborHourShare(hourIdx) {
  return LABOR_PROFILE[hourIdx] ?? 0
}

// ---------------------------------------------------------------------------
// Operating expenses
// ---------------------------------------------------------------------------

export const DELIVERY_COMMISSION = 0.16 // typical MY aggregator take rate

export const expenseRecords = [] // { date, outletId, category, amount }

for (const outlet of outlets) {
  const daily = {
    Rent: outlet.rentMonthly / 30.44,
    Utilities: outlet.utilitiesMonthly / 30.44,
    Marketing: outlet.marketingMonthly / 30.44,
    'Other operating': outlet.otherOpexMonthly / 30.44,
  }
  for (const date of DATES) {
    for (const [category, amount] of Object.entries(daily)) {
      const jitter = category === 'Utilities' ? seededNoise(`ut:${outlet.id}:${date}`, 0.14) : 1
      expenseRecords.push({ date, outletId: outlet.id, category, amount: amount * jitter })
    }
    const sale = salesDailyByOutletDate.get(`${outlet.id}|${date}`)
    if (sale) {
      expenseRecords.push({
        date,
        outletId: outlet.id,
        category: 'Delivery platform fees',
        amount: sale.delivery * DELIVERY_COMMISSION,
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Recipe cost helpers
// ---------------------------------------------------------------------------

/** Plate cost of one menu item at a given date's ingredient prices. */
export function recipeCost(itemId, date = TODAY) {
  const item = menuItemById[itemId]
  if (!item) return 0
  return item.recipe.reduce((sum, line) => sum + line.qty * priceOf(line.ingredientId, date), 0)
}

export function recipeBreakdown(itemId, date = TODAY) {
  const item = menuItemById[itemId]
  if (!item) return []
  return item.recipe
    .map((line) => {
      const ing = ingredientById[line.ingredientId]
      const unitPrice = priceOf(line.ingredientId, date)
      return { ...line, name: ing.name, unit: ing.unit, unitPrice, cost: line.qty * unitPrice }
    })
    .sort((a, b) => b.cost - a.cost)
}
