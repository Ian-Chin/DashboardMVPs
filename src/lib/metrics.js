// Aggregation engine. Every page reads its numbers from here so the dashboard,
// the P&L and the reports can never disagree with each other.

import {
  employeeById,
  ingredientById,
  ingredients,
  menuItemById,
  menuItems,
  outlets,
  supplierById,
  supplierQuotes,
} from '../data/catalog.js'
import {
  DATES,
  DELIVERY_COMMISSION,
  expenseRecords,
  laborRecords,
  laborHourShare,
  priceOf,
  recipeCost,
  salesDailyByOutletDate,
  salesItems,
  SERVICE_HOURS,
  salesHourShare,
  stockByKey,
  purchaseOrders,
  usageFor,
  wasteRecords,
  TODAY,
} from '../data/demoData.js'
import { DOW_LABELS, dayOfWeek, diffDays, previousRange, rangeKeys } from './date.js'

export const ALL_OUTLETS = 'all'

export function resolveOutletIds(outletId) {
  return outletId === ALL_OUTLETS ? outlets.map((o) => o.id) : [outletId]
}

function datesIn(from, to) {
  const lo = from < DATES[0] ? DATES[0] : from
  const hi = to > TODAY ? TODAY : to
  return lo > hi ? [] : rangeKeys(lo, hi)
}

const cache = new Map()
function memo(key, fn) {
  if (cache.has(key)) return cache.get(key)
  const value = fn()
  cache.set(key, value)
  if (cache.size > 240) cache.delete(cache.keys().next().value)
  return value
}

// ---------------------------------------------------------------------------
// Core period aggregate
// ---------------------------------------------------------------------------

const emptyCategoryMap = () => ({ Food: 0, Drinks: 0, Desserts: 0, Other: 0 })

export function periodMetrics(outletId, from, to) {
  return memo(`period|${outletId}|${from}|${to}`, () => {
    const outletIds = resolveOutletIds(outletId)
    const dates = datesIn(from, to)
    const daily = []

    const totals = {
      gross: 0,
      discount: 0,
      refund: 0,
      net: 0,
      delivery: 0,
      dineIn: 0,
      orders: 0,
      units: 0,
      theoreticalCogs: 0,
      wasteCost: 0,
      varianceCost: 0,
      laborCost: 0,
      laborHours: 0,
      otHours: 0,
      otCost: 0,
      byCategory: emptyCategoryMap(),
      opex: {},
    }

    // Revenue by menu category, per day.
    const catByDate = new Map()
    for (const row of salesItems) {
      if (row.date < from || row.date > to) continue
      if (!outletIds.includes(row.outletId)) continue
      const cat = menuItemById[row.itemId].category
      totals.byCategory[cat] += row.gross
      totals.units += row.units
      let m = catByDate.get(row.date)
      if (!m) catByDate.set(row.date, (m = emptyCategoryMap()))
      m[cat] += row.gross
    }

    for (const date of dates) {
      const day = {
        date,
        gross: 0,
        discount: 0,
        refund: 0,
        net: 0,
        delivery: 0,
        orders: 0,
        theoreticalCogs: 0,
        wasteCost: 0,
        varianceCost: 0,
        laborCost: 0,
        laborHours: 0,
        opex: 0,
        byCategory: catByDate.get(date) || emptyCategoryMap(),
      }

      for (const oid of outletIds) {
        const sale = salesDailyByOutletDate.get(`${oid}|${date}`)
        if (sale) {
          day.gross += sale.gross
          day.discount += sale.discount
          day.refund += sale.refund
          day.net += sale.net
          day.delivery += sale.delivery
          day.orders += sale.orders
        }
        const usage = usageFor(oid, date)
        for (const ingId of Object.keys(usage.expected)) {
          const price = priceOf(ingId, date)
          day.theoreticalCogs += usage.expected[ingId] * price
          day.wasteCost += (usage.waste[ingId] || 0) * price
          day.varianceCost += (usage.variance[ingId] || 0) * price
        }
      }

      day.foodCost = day.theoreticalCogs + day.wasteCost + day.varianceCost
      daily.push(day)
    }

    const dayByDate = new Map(daily.map((d) => [d.date, d]))

    for (const rec of laborRecords) {
      if (rec.date < from || rec.date > to) continue
      if (!outletIds.includes(rec.outletId)) continue
      totals.laborCost += rec.cost
      totals.laborHours += rec.hours
      totals.otHours += rec.otHours
      totals.otCost += rec.otHours * employeeById[rec.employeeId].hourlyRate * 1.5
      const d = dayByDate.get(rec.date)
      if (d) {
        d.laborCost += rec.cost
        d.laborHours += rec.hours
      }
    }

    for (const rec of expenseRecords) {
      if (rec.date < from || rec.date > to) continue
      if (!outletIds.includes(rec.outletId)) continue
      totals.opex[rec.category] = (totals.opex[rec.category] || 0) + rec.amount
      const d = dayByDate.get(rec.date)
      if (d) d.opex += rec.amount
    }

    for (const d of daily) {
      totals.gross += d.gross
      totals.discount += d.discount
      totals.refund += d.refund
      totals.net += d.net
      totals.delivery += d.delivery
      totals.orders += d.orders
      totals.theoreticalCogs += d.theoreticalCogs
      totals.wasteCost += d.wasteCost
      totals.varianceCost += d.varianceCost
      d.grossProfit = d.net - d.foodCost
      d.operatingProfit = d.grossProfit - d.laborCost - d.opex
      d.foodCostPct = d.net ? (d.foodCost / d.net) * 100 : 0
      d.laborCostPct = d.net ? (d.laborCost / d.net) * 100 : 0
      d.grossMarginPct = d.net ? (d.grossProfit / d.net) * 100 : 0
      d.operatingMarginPct = d.net ? (d.operatingProfit / d.net) * 100 : 0
      d.salesPerLaborHour = d.laborHours ? d.net / d.laborHours : 0
    }

    totals.dineIn = totals.gross - totals.delivery
    const foodCost = totals.theoreticalCogs + totals.wasteCost + totals.varianceCost
    const opexTotal = Object.values(totals.opex).reduce((s, v) => s + v, 0)
    const grossProfit = totals.net - foodCost
    const operatingProfit = grossProfit - totals.laborCost - opexTotal

    return {
      from,
      to,
      days: dates.length,
      outletIds,
      daily,
      revenue: {
        gross: totals.gross,
        discount: totals.discount,
        refund: totals.refund,
        net: totals.net,
        delivery: totals.delivery,
        dineIn: totals.dineIn,
        byCategory: totals.byCategory,
      },
      orders: totals.orders,
      units: totals.units,
      aov: totals.orders ? totals.net / totals.orders : 0,
      cogs: {
        theoretical: totals.theoreticalCogs,
        waste: totals.wasteCost,
        variance: totals.varianceCost,
        total: foodCost,
      },
      labor: {
        cost: totals.laborCost,
        hours: totals.laborHours,
        otHours: totals.otHours,
        otCost: totals.otCost,
      },
      opex: { byCategory: totals.opex, total: opexTotal },
      grossProfit,
      grossMarginPct: totals.net ? (grossProfit / totals.net) * 100 : 0,
      foodCostPct: totals.net ? (foodCost / totals.net) * 100 : 0,
      laborCostPct: totals.net ? (totals.laborCost / totals.net) * 100 : 0,
      wastePct: totals.net ? (totals.wasteCost / totals.net) * 100 : 0,
      variancePct: totals.net ? (totals.varianceCost / totals.net) * 100 : 0,
      primeCostPct: totals.net ? ((foodCost + totals.laborCost) / totals.net) * 100 : 0,
      operatingProfit,
      operatingMarginPct: totals.net ? (operatingProfit / totals.net) * 100 : 0,
      salesPerLaborHour: totals.laborHours ? totals.net / totals.laborHours : 0,
    }
  })
}

/** Current period plus the same-length window before it. */
export function periodWithComparison(outletId, from, to) {
  const prev = previousRange(from, to)
  return {
    current: periodMetrics(outletId, from, to),
    previous: periodMetrics(outletId, prev.from, prev.to),
    previousRange: prev,
  }
}

/** Blended target across the selected outlets (weighted by revenue). */
export function targetsFor(outletId, from, to) {
  const ids = resolveOutletIds(outletId)
  const list = outlets.filter((o) => ids.includes(o.id))
  const weights = list.map((o) => periodMetrics(o.id, from, to).revenue.net)
  const total = weights.reduce((s, v) => s + v, 0) || 1
  const wavg = (key) => list.reduce((s, o, i) => s + o[key] * (weights[i] / total), 0)
  return {
    foodCostPct: wavg('targetFoodCostPct'),
    laborCostPct: wavg('targetLaborCostPct'),
    grossMarginPct: wavg('targetGrossMarginPct'),
  }
}

// ---------------------------------------------------------------------------
// Menu engineering
// ---------------------------------------------------------------------------

export const MENU_CLASSES = {
  star: { key: 'star', label: 'Star', icon: '★', tone: 'success', blurb: 'Popular and profitable — protect it.' },
  plowhorse: { key: 'plowhorse', label: 'Plowhorse', icon: '◐', tone: 'warning', blurb: 'Sells well, earns little.' },
  puzzle: { key: 'puzzle', label: 'Puzzle', icon: '◆', tone: 'info', blurb: 'High margin, low volume.' },
  dog: { key: 'dog', label: 'Dog', icon: '●', tone: 'danger', blurb: 'Low volume, low margin.' },
}

export function menuPerformance(outletId, from, to) {
  return memo(`menu|${outletId}|${from}|${to}`, () => {
    const outletIds = resolveOutletIds(outletId)
    const agg = new Map()
    for (const row of salesItems) {
      if (row.date < from || row.date > to) continue
      if (!outletIds.includes(row.outletId)) continue
      let e = agg.get(row.itemId)
      if (!e) agg.set(row.itemId, (e = { units: 0, revenue: 0, cost: 0 }))
      e.units += row.units
      e.revenue += row.gross
      e.cost += row.units * recipeCost(row.itemId, row.date)
    }

    const totalUnits = [...agg.values()].reduce((s, v) => s + v.units, 0) || 1
    const totalRevenue = [...agg.values()].reduce((s, v) => s + v.revenue, 0) || 1
    const totalProfit = [...agg.values()].reduce((s, v) => s + (v.revenue - v.cost), 0)
    // Classic menu-engineering thresholds.
    const avgMarginPct = (totalProfit / totalRevenue) * 100
    const popularityThreshold = (1 / agg.size) * 0.7 * 100

    const rows = menuItems
      .filter((m) => agg.has(m.id))
      .map((m) => {
        const e = agg.get(m.id)
        const profit = e.revenue - e.cost
        const marginPct = e.revenue ? (profit / e.revenue) * 100 : 0
        const popularityPct = (e.units / totalUnits) * 100
        const popular = popularityPct >= popularityThreshold
        const profitable = marginPct >= avgMarginPct
        const klass = popular
          ? profitable
            ? MENU_CLASSES.star
            : MENU_CLASSES.plowhorse
          : profitable
            ? MENU_CLASSES.puzzle
            : MENU_CLASSES.dog
        const plateCost = recipeCost(m.id, to)
        const startCost = recipeCost(m.id, from)
        return {
          id: m.id,
          name: m.name,
          category: m.category,
          station: m.station,
          price: m.price,
          priceChangedAt: m.priceChangedAt,
          units: e.units,
          revenue: e.revenue,
          cost: e.cost,
          profit,
          marginPct,
          plateCost,
          plateCostDriftPct: startCost ? ((plateCost - startCost) / startCost) * 100 : 0,
          popularityPct,
          revenueSharePct: (e.revenue / totalRevenue) * 100,
          profitSharePct: totalProfit ? (profit / totalProfit) * 100 : 0,
          classification: klass,
          action: menuAction(klass.key, marginPct, avgMarginPct, m),
        }
      })
      .sort((a, b) => b.profit - a.profit)

    return { rows, avgMarginPct, popularityThreshold, totalRevenue, totalProfit, totalUnits }
  })
}

function menuAction(klass, marginPct, avgMarginPct, item) {
  const gap = avgMarginPct - marginPct
  switch (klass) {
    case 'star':
      return {
        label: 'Protect and feature',
        detail: `Keep availability at 100%. Feature on the counter display and delivery hero slot.`,
      }
    case 'plowhorse': {
      const suggested = Math.ceil(((item.price * (1 + gap / 100)) * 10) / 10) * 0.1 * 10
      return {
        label: 'Reduce ingredient cost or raise price',
        detail: `Margin is ${gap.toFixed(1)} pts below the menu average. Re-spec the plate or move price toward RM${suggested.toFixed(2)}.`,
      }
    }
    case 'puzzle':
      return {
        label: 'Promote this item',
        detail: `Margin is strong but volume is low. Bundle it, upsell it at the counter, or move it up the menu.`,
      }
    default:
      return {
        label: 'Review or remove',
        detail: `Low volume and below-average margin. Consider removing it and freeing the prep and stock it consumes.`,
      }
  }
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export function inventoryAnalysis(outletId, from, to) {
  return memo(`inv|${outletId}|${from}|${to}`, () => {
    const outletIds = resolveOutletIds(outletId)
    const dates = datesIn(from, to)
    const map = new Map()

    for (const ing of ingredients) {
      map.set(ing.id, {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        unit: ing.unit,
        supplier: supplierById[ing.supplierId]?.name ?? '—',
        supplierId: ing.supplierId,
        shelfLifeDays: ing.shelfLifeDays,
        expected: 0,
        waste: 0,
        variance: 0,
        purchases: 0,
        purchaseValue: 0,
        opening: 0,
        onHand: 0,
        minStock: 0,
        lastDelivery: null,
      })
    }

    for (const oid of outletIds) {
      for (const date of dates) {
        const usage = usageFor(oid, date)
        for (const ingId of Object.keys(usage.expected)) {
          const r = map.get(ingId)
          if (!r) continue
          r.expected += usage.expected[ingId]
          r.waste += usage.waste[ingId] || 0
          r.variance += usage.variance[ingId] || 0
        }
      }
      for (const ing of ingredients) {
        const stock = stockByKey.get(`${oid}|${ing.id}`)
        const r = map.get(ing.id)
        if (!stock || !r) continue
        r.onHand += stock.onHand
        r.opening += stock.opening
        r.minStock += ing.minStock
        if (!r.lastDelivery || (stock.lastDelivery && stock.lastDelivery > r.lastDelivery)) {
          r.lastDelivery = stock.lastDelivery
        }
      }
    }

    for (const po of purchaseOrders) {
      if (po.date < from || po.date > to) continue
      if (!outletIds.includes(po.outletId)) continue
      for (const line of po.items) {
        const r = map.get(line.ingredientId)
        if (!r) continue
        r.purchases += line.qty
        r.purchaseValue += line.total
      }
    }

    const rows = [...map.values()]
      .filter((r) => r.expected > 0 || r.purchases > 0)
      .map((r) => {
        const price = priceOf(r.id, to)
        const actual = r.expected + r.waste + r.variance
        // Closing stock is known; back out the opening balance so the row always
        // satisfies opening + purchases − actual usage = closing.
        const opening = Math.max(0, r.onHand + actual - r.purchases)
        const variancePct = r.expected ? (r.variance / r.expected) * 100 : 0
        const dailyUse = dates.length ? actual / dates.length : 0
        const daysOfStock = dailyUse > 0 ? r.onHand / dailyUse : Infinity
        const daysSinceDelivery = r.lastDelivery ? diffDays(r.lastDelivery, to) : null
        return {
          ...r,
          price,
          actual,
          opening,
          closing: r.onHand,
          variancePct,
          varianceCost: r.variance * price,
          wasteCost: r.waste * price,
          usageCost: actual * price,
          stockValue: r.onHand * price,
          dailyUse,
          daysOfStock,
          daysSinceDelivery,
          belowMin: r.onHand < r.minStock,
          nearExpiry:
            r.shelfLifeDays <= 7 && daysSinceDelivery !== null && daysSinceDelivery >= r.shelfLifeDays - 2,
          excess: daysOfStock !== Infinity && daysOfStock > 21 && r.onHand > r.minStock * 1.2,
        }
      })
      .sort((a, b) => b.varianceCost - a.varianceCost)

    const totals = rows.reduce(
      (acc, r) => {
        acc.varianceCost += r.varianceCost
        acc.wasteCost += r.wasteCost
        acc.usageCost += r.usageCost
        acc.stockValue += r.stockValue
        acc.purchaseValue += r.purchaseValue
        return acc
      },
      { varianceCost: 0, wasteCost: 0, usageCost: 0, stockValue: 0, purchaseValue: 0 },
    )

    return { rows, totals }
  })
}

export function wasteLog(outletId, from, to, limit = 40) {
  const outletIds = resolveOutletIds(outletId)
  return wasteRecords
    .filter((w) => w.date >= from && w.date <= to && outletIds.includes(w.outletId))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.cost - a.cost))
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Labor
// ---------------------------------------------------------------------------

export function laborAnalysis(outletId, from, to) {
  return memo(`labor|${outletId}|${from}|${to}`, () => {
    const outletIds = resolveOutletIds(outletId)
    const period = periodMetrics(outletId, from, to)
    const byEmployee = new Map()

    for (const rec of laborRecords) {
      if (rec.date < from || rec.date > to) continue
      if (!outletIds.includes(rec.outletId)) continue
      let e = byEmployee.get(rec.employeeId)
      if (!e) byEmployee.set(rec.employeeId, (e = { hours: 0, otHours: 0, cost: 0, days: 0 }))
      e.hours += rec.hours
      e.otHours += rec.otHours
      e.cost += rec.cost
      e.days += 1
    }

    const employees = [...byEmployee.entries()]
      .map(([id, e]) => {
        const emp = employeeById[id]
        return {
          id,
          name: emp.name,
          role: emp.role,
          type: emp.type,
          outletId: emp.outletId,
          hourlyRate: emp.hourlyRate,
          hours: e.hours,
          otHours: e.otHours,
          cost: e.cost,
          days: e.days,
          avgShift: e.days ? e.hours / e.days : 0,
          costShare: period.labor.cost ? (e.cost / period.labor.cost) * 100 : 0,
        }
      })
      .sort((a, b) => b.cost - a.cost)

    // Day-of-week efficiency.
    const dowAgg = DOW_LABELS.map((label) => ({ label, net: 0, hours: 0, cost: 0, days: 0 }))
    for (const d of period.daily) {
      const idx = dayOfWeek(d.date)
      dowAgg[idx].net += d.net
      dowAgg[idx].hours += d.laborHours
      dowAgg[idx].cost += d.laborCost
      dowAgg[idx].days += 1
    }
    for (const row of dowAgg) {
      row.splh = row.hours ? row.net / row.hours : 0
      row.laborPct = row.net ? (row.cost / row.net) * 100 : 0
      row.avgNet = row.days ? row.net / row.days : 0
      row.avgHours = row.days ? row.hours / row.days : 0
    }

    // Intraday demand vs staffing, averaged over the period.
    const blocks = []
    for (let d = 0; d < 7; d++) {
      const dayRows = period.daily.filter((x) => dayOfWeek(x.date) === d)
      if (!dayRows.length) continue
      for (let h = 0; h < SERVICE_HOURS.length; h++) {
        const sales = dayRows.reduce((s, r) => s + r.net * salesHourShare(r.date, h), 0) / dayRows.length
        const hours = dayRows.reduce((s, r) => s + r.laborHours * laborHourShare(h), 0) / dayRows.length
        blocks.push({
          dow: d,
          dowLabel: DOW_LABELS[d],
          hour: SERVICE_HOURS[h],
          sales,
          hours,
          splh: hours ? sales / hours : 0,
        })
      }
    }
    const avgSplh = period.salesPerLaborHour || 1

    return {
      period,
      employees,
      dow: dowAgg,
      blocks,
      avgSplh,
      overstaffedBlocks: blocks
        .filter((b) => b.splh < avgSplh * 0.6 && b.hours > 0.5)
        .sort((a, b) => a.splh - b.splh)
        .slice(0, 6),
    }
  })
}

// ---------------------------------------------------------------------------
// Purchasing
// ---------------------------------------------------------------------------

export function purchasingAnalysis(outletId, from, to) {
  return memo(`purch|${outletId}|${from}|${to}`, () => {
    const outletIds = resolveOutletIds(outletId)
    const orders = purchaseOrders
      .filter((po) => po.date >= from && po.date <= to && outletIds.includes(po.outletId))
      .sort((a, b) => (a.date < b.date ? 1 : -1))

    const byIngredient = new Map()
    const bySupplier = new Map()

    for (const po of orders) {
      let s = bySupplier.get(po.supplierId)
      if (!s) bySupplier.set(po.supplierId, (s = { spend: 0, orders: 0, items: new Set() }))
      s.spend += po.total
      s.orders += 1
      for (const line of po.items) {
        s.items.add(line.ingredientId)
        let e = byIngredient.get(line.ingredientId)
        if (!e) byIngredient.set(line.ingredientId, (e = { qty: 0, spend: 0, supplierId: po.supplierId, lines: [] }))
        e.qty += line.qty
        e.spend += line.total
        e.lines.push({ date: po.date, unitPrice: line.unitPrice, qty: line.qty })
      }
    }

    // "Previous" is the same-length window immediately before this one, exactly
    // like every other comparison in the product.
    const prev = previousRange(from, to)
    const prevDates = datesIn(prev.from, prev.to)
    const dates = datesIn(from, to)

    const ingredientRows = [...byIngredient.entries()]
      .map(([id, e]) => {
        const ing = ingredientById[id]
        const sorted = [...e.lines].sort((a, b) => (a.date < b.date ? -1 : 1))
        const current = dates.length ? dates.reduce((s, d) => s + priceOf(id, d), 0) / dates.length : 0
        const previous = prevDates.length
          ? prevDates.reduce((s, d) => s + priceOf(id, d), 0) / prevDates.length
          : current
        // What was actually paid, which can differ from the market average when
        // deliveries cluster on one side of a price move.
        const paidPrice = e.qty ? sorted.reduce((s, l) => s + l.unitPrice * l.qty, 0) / e.qty : current
        const changePct = previous ? ((current - previous) / previous) * 100 : 0
        const quote = supplierQuotes.find((q) => q.ingredientId === id)
        const altPrice = quote ? current * quote.priceFactor : null
        return {
          id,
          name: ing.name,
          unit: ing.unit,
          category: ing.category,
          supplierId: e.supplierId,
          supplier: supplierById[e.supplierId]?.name ?? '—',
          qty: e.qty,
          spend: e.spend,
          paidPrice,
          currentPrice: current,
          previousPrice: previous,
          changePct,
          annualisedImpact: changePct ? (current - previous) * e.qty * (365 / Math.max(1, diffDays(from, to) + 1)) : 0,
          alternative: quote
            ? {
                supplier: supplierById[quote.supplierId]?.name ?? '—',
                supplierId: quote.supplierId,
                price: altPrice,
                saving: current - altPrice,
                savingPct: ((current - altPrice) / current) * 100,
                periodSaving: (current - altPrice) * e.qty,
                note: quote.note,
                minOrder: quote.minOrder,
              }
            : null,
          history: sorted,
        }
      })
      .sort((a, b) => b.spend - a.spend)

    const supplierRows = [...bySupplier.entries()]
      .map(([id, s]) => {
        const sup = supplierById[id]
        const ingRows = ingredientRows.filter((r) => r.supplierId === id)
        const weightedChange = ingRows.length
          ? ingRows.reduce((sum, r) => sum + r.changePct * r.spend, 0) / (ingRows.reduce((sum, r) => sum + r.spend, 0) || 1)
          : 0
        return {
          ...sup,
          spend: s.spend,
          orders: s.orders,
          itemCount: s.items.size,
          priceChangePct: weightedChange,
          share: 0,
        }
      })
      .sort((a, b) => b.spend - a.spend)

    const totalSpend = supplierRows.reduce((s, r) => s + r.spend, 0)
    supplierRows.forEach((r) => (r.share = totalSpend ? (r.spend / totalSpend) * 100 : 0))

    const savings = ingredientRows
      .filter((r) => r.alternative && r.alternative.saving > 0)
      .sort((a, b) => b.alternative.periodSaving - a.alternative.periodSaving)

    return {
      orders,
      ingredientRows,
      supplierRows,
      totalSpend,
      savings,
      totalPotentialSaving: savings.reduce((s, r) => s + r.alternative.periodSaving, 0),
    }
  })
}

export function priceHistory(ingredientId, from, to, step = 7) {
  const dates = datesIn(from, to)
  const out = []
  for (let i = 0; i < dates.length; i += step) out.push({ date: dates[i], value: priceOf(ingredientId, dates[i]) })
  const last = dates[dates.length - 1]
  if (last && out[out.length - 1]?.date !== last) out.push({ date: last, value: priceOf(ingredientId, last) })
  return out
}

// ---------------------------------------------------------------------------
// Outlet comparison
// ---------------------------------------------------------------------------

export function outletComparison(from, to) {
  return memo(`outlets|${from}|${to}`, () => {
    const prev = previousRange(from, to)
    const rows = outlets.map((o) => {
      const cur = periodMetrics(o.id, from, to)
      const before = periodMetrics(o.id, prev.from, prev.to)
      return {
        id: o.id,
        name: o.shortName,
        fullName: o.name,
        city: o.city,
        manager: o.manager,
        revenue: cur.revenue.net,
        revenueChangePct: before.revenue.net ? ((cur.revenue.net - before.revenue.net) / before.revenue.net) * 100 : 0,
        grossProfit: cur.grossProfit,
        operatingProfit: cur.operatingProfit,
        profitChangePct: before.operatingProfit
          ? ((cur.operatingProfit - before.operatingProfit) / Math.abs(before.operatingProfit)) * 100
          : 0,
        grossMarginPct: cur.grossMarginPct,
        operatingMarginPct: cur.operatingMarginPct,
        foodCostPct: cur.foodCostPct,
        laborCostPct: cur.laborCostPct,
        primeCostPct: cur.primeCostPct,
        orders: cur.orders,
        aov: cur.aov,
        salesPerLaborHour: cur.salesPerLaborHour,
        targetFoodCostPct: o.targetFoodCostPct,
        targetLaborCostPct: o.targetLaborCostPct,
      }
    })
    const sorted = [...rows].sort((a, b) => b.operatingMarginPct - a.operatingMarginPct)
    return { rows, best: sorted[0], worst: sorted[sorted.length - 1] }
  })
}

// ---------------------------------------------------------------------------
// Small helpers used by charts
// ---------------------------------------------------------------------------

/** Collapse a daily series into ~N points so charts stay readable. */
export function bucketDaily(daily, maxPoints = 30) {
  if (daily.length <= maxPoints) return daily.map((d) => ({ ...d, label: d.date }))
  const size = Math.ceil(daily.length / maxPoints)
  const out = []
  for (let i = 0; i < daily.length; i += size) {
    const slice = daily.slice(i, i + size)
    const sum = (key) => slice.reduce((s, d) => s + (d[key] || 0), 0)
    const net = sum('net')
    const foodCost = sum('foodCost')
    const laborCost = sum('laborCost')
    const grossProfit = net - foodCost
    out.push({
      date: slice[0].date,
      endDate: slice[slice.length - 1].date,
      label: slice[0].date,
      net,
      gross: sum('gross'),
      orders: sum('orders'),
      foodCost,
      laborCost,
      laborHours: sum('laborHours'),
      opex: sum('opex'),
      grossProfit,
      operatingProfit: grossProfit - laborCost - sum('opex'),
      foodCostPct: net ? (foodCost / net) * 100 : 0,
      laborCostPct: net ? (laborCost / net) * 100 : 0,
      grossMarginPct: net ? (grossProfit / net) * 100 : 0,
      salesPerLaborHour: sum('laborHours') ? net / sum('laborHours') : 0,
    })
  }
  return out
}

export { DELIVERY_COMMISSION }
