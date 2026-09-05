// Rule engine.
//
// No AI, no black box: every alert below is a threshold comparison over the
// metrics layer, and every alert carries the money it is worth so the owner can
// rank the work. Thresholds come from Settings.

import { outlets } from '../data/catalog.js'
import {
  inventoryAnalysis,
  laborAnalysis,
  menuPerformance,
  outletComparison,
  periodWithComparison,
  purchasingAnalysis,
  targetsFor,
} from './metrics.js'

export const DEFAULT_THRESHOLDS = {
  foodCostPct: 32,
  laborCostPct: 20,
  grossMarginPct: 66,
  primeCostPct: 55,
  wastePctOfRevenue: 1.5,
  varianceCostAlert: 250, // RM of unexplained usage in the period
  variancePctAlert: 6, // per-ingredient
  priceIncreasePct: 5,
  savingsAlert: 150,
  discountPctOfRevenue: 4,
  overtimeSharePct: 6,
  monthlyProfitTarget: 58000,
  lowStockEnabled: true,
  expiryEnabled: true,
  excessStockEnabled: true,
}

export const SEVERITY = {
  critical: { key: 'critical', label: 'Critical', dot: '🔴', rank: 0 },
  warning: { key: 'warning', label: 'Warning', dot: '🟠', rank: 1 },
  info: { key: 'info', label: 'Watch', dot: '🟡', rank: 2 },
  positive: { key: 'positive', label: 'Good', dot: '🟢', rank: 3 },
}

const monthly = (periodValue, days) => (days ? (periodValue / days) * 30.44 : 0)

/**
 * Build the full alert list for a scope.
 * @returns {{alerts: Array, impact: number, health: object}}
 */
export function evaluateRules(outletId, from, to, thresholds = DEFAULT_THRESHOLDS) {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds }
  const { current, previous } = periodWithComparison(outletId, from, to)
  const targets = targetsFor(outletId, from, to)
  const inv = inventoryAnalysis(outletId, from, to)
  const menu = menuPerformance(outletId, from, to)
  const labor = laborAnalysis(outletId, from, to)
  const purch = purchasingAnalysis(outletId, from, to)
  const comparison = outletComparison(from, to)
  const days = current.days || 1
  const alerts = []

  const push = (a) => alerts.push({ impact: 0, ...a, id: a.id })

  // --- Food cost -----------------------------------------------------------
  const foodTarget = t.foodCostPct ?? targets.foodCostPct
  const foodGap = current.foodCostPct - foodTarget
  if (foodGap > 0.5) {
    const impact = monthly((foodGap / 100) * current.revenue.net, days)
    push({
      id: 'food-cost',
      severity: foodGap > 2.5 ? 'critical' : 'warning',
      category: 'Food cost',
      title: `Food cost ${foodGap.toFixed(1)} pts above target`,
      detail: `Food cost ran at ${current.foodCostPct.toFixed(1)}% of net sales against a ${foodTarget.toFixed(0)}% target. Recipe cost, waste and unexplained variance are all inside this number.`,
      metric: `${current.foodCostPct.toFixed(1)}%`,
      target: `${foodTarget.toFixed(0)}%`,
      impact,
      action: 'Check the top variance ingredients and recent supplier price moves.',
      link: { to: '/inventory', label: 'Open inventory variance' },
    })
  } else if (foodGap < -1) {
    push({
      id: 'food-cost-good',
      severity: 'positive',
      category: 'Food cost',
      title: `Food cost ${Math.abs(foodGap).toFixed(1)} pts under target`,
      detail: `Running at ${current.foodCostPct.toFixed(1)}% against a ${foodTarget.toFixed(0)}% target.`,
      metric: `${current.foodCostPct.toFixed(1)}%`,
      target: `${foodTarget.toFixed(0)}%`,
      impact: 0,
      action: 'Hold current portioning and purchasing discipline.',
      link: { to: '/profitability', label: 'View cost breakdown' },
    })
  }

  // --- Gross margin --------------------------------------------------------
  const marginGap = targets.grossMarginPct - current.grossMarginPct
  if (marginGap > 1) {
    push({
      id: 'gross-margin',
      primary: false,
      severity: marginGap > 3 ? 'critical' : 'warning',
      category: 'Margin',
      title: `Gross margin ${marginGap.toFixed(1)} pts below target`,
      detail: `Gross margin is ${current.grossMarginPct.toFixed(1)}% versus a ${targets.grossMarginPct.toFixed(0)}% target. Previous period was ${previous.grossMarginPct.toFixed(1)}%.`,
      metric: `${current.grossMarginPct.toFixed(1)}%`,
      target: `${targets.grossMarginPct.toFixed(0)}%`,
      impact: monthly((marginGap / 100) * current.revenue.net, days),
      action: 'Review low-margin high-volume items on the menu page.',
      link: { to: '/menu', label: 'Open menu engineering' },
    })
  }

  // --- Inventory variance --------------------------------------------------
  const topVariance = inv.rows.filter((r) => r.variancePct >= t.variancePctAlert && r.varianceCost >= 40).slice(0, 4)
  if (inv.totals.varianceCost >= t.varianceCostAlert) {
    push({
      id: 'variance-total',
      severity: inv.totals.varianceCost >= t.varianceCostAlert * 2 ? 'critical' : 'warning',
      category: 'Inventory',
      title: `Unexplained stock usage of ${fmtRM(inv.totals.varianceCost)}`,
      detail: `Actual usage exceeded what recipes and recorded waste can explain. Largest gaps: ${topVariance
        .map((r) => r.name)
        .slice(0, 3)
        .join(', ') || 'across several items'}.`,
      metric: fmtRM(inv.totals.varianceCost),
      target: `< ${fmtRM(t.varianceCostAlert)}`,
      impact: monthly(inv.totals.varianceCost, days),
      action: 'Run a stock count on the flagged items and re-check portioning.',
      link: { to: '/inventory', label: 'Review variance' },
    })
  }
  for (const row of topVariance) {
    push({
      id: `variance-${row.id}`,
      primary: false,
      severity: row.variancePct >= t.variancePctAlert * 1.8 ? 'critical' : 'warning',
      category: 'Inventory',
      title: `${row.name} usage ${row.variancePct.toFixed(1)}% above recipe`,
      detail: `Expected ${row.expected.toFixed(1)}${row.unit}, actual ${row.actual.toFixed(1)}${row.unit}. Gap of ${row.variance.toFixed(1)}${row.unit} at ${fmtRM(row.price)}/${row.unit}.`,
      metric: `+${row.variance.toFixed(1)} ${row.unit}`,
      target: `< ${t.variancePctAlert}%`,
      impact: monthly(row.varianceCost, days),
      action: 'Weigh portions for two services and confirm the delivery quantities received.',
      link: { to: '/inventory', label: 'Open item' },
    })
  }

  // --- Waste ---------------------------------------------------------------
  if (current.wastePct > t.wastePctOfRevenue) {
    const worst = [...inv.rows].sort((a, b) => b.wasteCost - a.wasteCost)[0]
    push({
      id: 'waste',
      severity: current.wastePct > t.wastePctOfRevenue * 1.8 ? 'critical' : 'warning',
      category: 'Waste',
      title: `Waste at ${current.wastePct.toFixed(2)}% of sales`,
      detail: `${fmtRM(current.cogs.waste)} written off this period against a ${t.wastePctOfRevenue}% ceiling.${worst ? ` Worst item: ${worst.name} (${fmtRM(worst.wasteCost)}).` : ''}`,
      metric: `${current.wastePct.toFixed(2)}%`,
      target: `< ${t.wastePctOfRevenue}%`,
      impact: monthly(current.cogs.waste - (t.wastePctOfRevenue / 100) * current.revenue.net, days),
      action: 'Cut prep par levels on short shelf-life items and review end-of-day markdowns.',
      link: { to: '/inventory', label: 'Open waste log' },
    })
  }

  // --- Labor ---------------------------------------------------------------
  const laborTarget = t.laborCostPct ?? targets.laborCostPct
  const laborGap = current.laborCostPct - laborTarget
  if (laborGap > 0.5) {
    push({
      id: 'labor-cost',
      severity: laborGap > 3 ? 'critical' : 'warning',
      category: 'Labor',
      title: `Labor cost ${laborGap.toFixed(1)} pts above target`,
      detail: `Labor ran at ${current.laborCostPct.toFixed(1)}% of net sales against ${laborTarget.toFixed(0)}%. Sales per labour hour is ${fmtRM(current.salesPerLaborHour)}.`,
      metric: `${current.laborCostPct.toFixed(1)}%`,
      target: `${laborTarget.toFixed(0)}%`,
      impact: monthly((laborGap / 100) * current.revenue.net, days),
      action: 'Trim the lowest sales-per-hour blocks from next week’s roster.',
      link: { to: '/labor', label: 'Open roster analysis' },
    })
  } else if (laborGap < -1.5) {
    push({
      id: 'labor-good',
      severity: 'positive',
      category: 'Labor',
      title: `Labor cost ${Math.abs(laborGap).toFixed(1)} pts under target`,
      detail: `Labor at ${current.laborCostPct.toFixed(1)}% with ${fmtRM(current.salesPerLaborHour)} sales per labour hour.`,
      metric: `${current.laborCostPct.toFixed(1)}%`,
      target: `${laborTarget.toFixed(0)}%`,
      impact: 0,
      action: 'Keep the current schedule shape.',
      link: { to: '/labor', label: 'Open labor' },
    })
  }

  const otShare = current.labor.cost ? (current.labor.otCost / current.labor.cost) * 100 : 0
  if (otShare > t.overtimeSharePct) {
    push({
      id: 'overtime',
      primary: false,
      severity: 'info',
      category: 'Labor',
      title: `Overtime is ${otShare.toFixed(1)}% of labour spend`,
      detail: `${current.labor.otHours.toFixed(0)} overtime hours costing ${fmtRM(current.labor.otCost)} at 1.5×.`,
      metric: `${otShare.toFixed(1)}%`,
      target: `< ${t.overtimeSharePct}%`,
      impact: monthly(current.labor.otCost / 3, days),
      action: 'Rebalance shifts before hours cross the overtime line.',
      link: { to: '/labor', label: 'Open labor' },
    })
  }

  const worstBlock = labor.overstaffedBlocks[0]
  if (worstBlock) {
    push({
      id: 'labor-block',
      primary: false,
      severity: 'info',
      category: 'Labor',
      title: `${worstBlock.dowLabel} ${fmtHour(worstBlock.hour)} is consistently overstaffed`,
      detail: `That block averages ${fmtRM(worstBlock.splh)} of sales per labour hour against a ${fmtRM(labor.avgSplh)} period average.`,
      metric: fmtRM(worstBlock.splh),
      target: fmtRM(labor.avgSplh),
      impact: monthly(worstBlock.hours * 12 * 4, days) / 4,
      action: `Cut one position from ${worstBlock.dowLabel} ${fmtHour(worstBlock.hour)} to ${fmtHour(worstBlock.hour + 3)}.`,
      link: { to: '/labor', label: 'View intraday' },
    })
  }

  // --- Purchasing ----------------------------------------------------------
  const priceJumps = purch.ingredientRows
    .filter((r) => r.changePct >= t.priceIncreasePct && r.spend > 100)
    .sort((a, b) => b.annualisedImpact - a.annualisedImpact)
    .slice(0, 3)
  for (const row of priceJumps) {
    push({
      id: `price-${row.id}`,
      severity: row.changePct >= t.priceIncreasePct * 1.6 ? 'warning' : 'info',
      category: 'Purchasing',
      title: `${row.name} price up ${row.changePct.toFixed(1)}%`,
      detail: `${row.supplier} moved from ${fmtRM(row.previousPrice, 2)}/${row.unit} to ${fmtRM(row.currentPrice, 2)}/${row.unit}. You bought ${row.qty.toFixed(0)} ${row.unit} this period.`,
      metric: `${fmtRM(row.currentPrice, 2)}/${row.unit}`,
      target: `${fmtRM(row.previousPrice, 2)}/${row.unit}`,
      impact: monthly((row.currentPrice - row.previousPrice) * row.qty, days),
      action: 'Request a contract price or switch to the cheaper quote.',
      link: { to: '/purchasing', label: 'Open supplier' },
    })
  }

  if (purch.totalPotentialSaving >= t.savingsAlert) {
    const top = purch.savings[0]
    push({
      id: 'savings',
      severity: 'info',
      category: 'Purchasing',
      title: `${fmtRM(purch.totalPotentialSaving)} of cheaper quotes available`,
      detail: `${purch.savings.length} ingredients have a cheaper quote from another supplier on file.${top ? ` Biggest: ${top.name} at ${fmtRM(top.alternative.saving, 2)}/${top.unit} less from ${top.alternative.supplier}.` : ''}`,
      metric: fmtRM(purch.totalPotentialSaving),
      target: '—',
      impact: monthly(purch.totalPotentialSaving, days),
      action: 'Trial the alternative supplier on one delivery cycle.',
      link: { to: '/purchasing', label: 'Compare suppliers' },
    })
  }

  // --- Stock health --------------------------------------------------------
  if (t.lowStockEnabled) {
    const low = inv.rows.filter((r) => r.belowMin).sort((a, b) => a.daysOfStock - b.daysOfStock)
    if (low.length) {
      push({
        id: 'low-stock',
        primary: false,
        severity: low.some((r) => r.daysOfStock < 1) ? 'critical' : 'warning',
        category: 'Inventory',
        title: `${low.length} item${low.length > 1 ? 's' : ''} below minimum stock`,
        detail: `${low
          .slice(0, 3)
          .map((r) => `${r.name} (${r.daysOfStock === Infinity ? '—' : r.daysOfStock.toFixed(1)} days left)`)
          .join(', ')}.`,
        metric: `${low.length} items`,
        target: '0 items',
        impact: 0,
        action: 'Raise a purchase order before the next service.',
        link: { to: '/inventory', label: 'Open stock levels' },
      })
    }
  }

  if (t.expiryEnabled) {
    const expiring = inv.rows.filter((r) => r.nearExpiry && r.stockValue > 30)
    if (expiring.length) {
      push({
        id: 'expiry',
        severity: 'warning',
        category: 'Inventory',
        title: `${expiring.length} item${expiring.length > 1 ? 's' : ''} near end of shelf life`,
        detail: `${expiring
          .slice(0, 3)
          .map((r) => `${r.name} (${fmtRM(r.stockValue)} on hand)`)
          .join(', ')}. Delivered ${expiring[0].daysSinceDelivery} days ago.`,
        metric: fmtRM(expiring.reduce((s, r) => s + r.stockValue, 0)),
        target: 'RM0',
        impact: expiring.reduce((s, r) => s + r.stockValue, 0) * 0.4,
        action: 'Push these into today’s specials before they are written off.',
        link: { to: '/inventory', label: 'Open stock levels' },
      })
    }
  }

  if (t.excessStockEnabled) {
    const excess = inv.rows.filter((r) => r.excess && r.stockValue > 150)
    if (excess.length) {
      push({
        id: 'excess-stock',
        primary: false,
        severity: 'info',
        category: 'Inventory',
        title: `${fmtRM(excess.reduce((s, r) => s + r.stockValue, 0))} tied up in excess stock`,
        detail: `${excess
          .slice(0, 3)
          .map((r) => `${r.name} (${r.daysOfStock.toFixed(0)} days of cover)`)
          .join(', ')} exceed 21 days of cover.`,
        metric: `${excess.length} items`,
        target: '< 21 days cover',
        impact: 0,
        action: 'Pause reordering until cover normalises.',
        link: { to: '/inventory', label: 'Open stock levels' },
      })
    }
  }

  // --- Menu ----------------------------------------------------------------
  const plowhorses = menu.rows
    .filter((r) => r.classification.key === 'plowhorse')
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 2)
  for (const row of plowhorses) {
    const gapPts = menu.avgMarginPct - row.marginPct
    push({
      id: `menu-${row.id}`,
      primary: false,
      severity: 'info',
      category: 'Menu',
      title: `${row.name} sells well at ${row.marginPct.toFixed(0)}% margin`,
      detail: `${row.units.toLocaleString()} units and ${fmtRM(row.revenue)} of sales, but margin is ${gapPts.toFixed(1)} pts under the ${menu.avgMarginPct.toFixed(0)}% menu average. Plate cost has moved ${row.plateCostDriftPct >= 0 ? '+' : ''}${row.plateCostDriftPct.toFixed(1)}% this period.`,
      metric: `${row.marginPct.toFixed(0)}%`,
      target: `${menu.avgMarginPct.toFixed(0)}%`,
      impact: monthly((gapPts / 100) * row.revenue, days),
      action: 'Re-spec the plate or move the price up one step.',
      link: { to: '/menu', label: 'Open item' },
    })
  }

  const dogs = menu.rows.filter((r) => r.classification.key === 'dog')
  if (dogs.length >= 3) {
    push({
      id: 'menu-dogs',
      primary: false,
      severity: 'info',
      category: 'Menu',
      title: `${dogs.length} menu items are low volume and low margin`,
      detail: `${dogs
        .slice(0, 3)
        .map((r) => r.name)
        .join(', ')} together generate ${fmtRM(dogs.reduce((s, r) => s + r.profit, 0))} of gross profit.`,
      metric: `${dogs.length} items`,
      target: '—',
      impact: 0,
      action: 'Trim the menu and free the prep, stock and screen space.',
      link: { to: '/menu', label: 'Review menu' },
    })
  }

  // --- Discounts -----------------------------------------------------------
  const discountPct = current.revenue.gross ? (current.revenue.discount / current.revenue.gross) * 100 : 0
  if (discountPct > t.discountPctOfRevenue) {
    push({
      id: 'discounts',
      severity: 'info',
      category: 'Revenue',
      title: `Discounts at ${discountPct.toFixed(1)}% of gross sales`,
      detail: `${fmtRM(current.revenue.discount)} given away this period, above the ${t.discountPctOfRevenue}% guideline.`,
      metric: `${discountPct.toFixed(1)}%`,
      target: `< ${t.discountPctOfRevenue}%`,
      impact: monthly(current.revenue.discount - (t.discountPctOfRevenue / 100) * current.revenue.gross, days),
      action: 'Cap promo codes on the slowest weekdays and measure lift before renewing.',
      link: { to: '/profitability', label: 'Open revenue breakdown' },
    })
  }

  // --- Outlet performance --------------------------------------------------
  if (outletId === 'all' && comparison.best && comparison.worst && comparison.best.id !== comparison.worst.id) {
    const spread = comparison.best.operatingMarginPct - comparison.worst.operatingMarginPct
    push({
      id: 'outlet-best',
      severity: 'positive',
      category: 'Outlets',
      title: `${comparison.best.name} leads on margin at ${comparison.best.operatingMarginPct.toFixed(1)}%`,
      detail: `${fmtRM(comparison.best.operatingProfit)} operating profit on ${fmtRM(comparison.best.revenue)} of sales.`,
      metric: `${comparison.best.operatingMarginPct.toFixed(1)}%`,
      target: '—',
      impact: 0,
      action: `Copy its roster shape and prep discipline to ${comparison.worst.name}.`,
      link: { to: '/reports', label: 'Compare outlets' },
    })
    if (spread > 4) {
      push({
        id: 'outlet-worst',
        primary: false,
        severity: spread > 8 ? 'warning' : 'info',
        category: 'Outlets',
        title: `${comparison.worst.name} is ${spread.toFixed(1)} pts behind on margin`,
        detail: `Food cost ${comparison.worst.foodCostPct.toFixed(1)}% and labour ${comparison.worst.laborCostPct.toFixed(1)}% versus ${comparison.best.foodCostPct.toFixed(1)}% / ${comparison.best.laborCostPct.toFixed(1)}% at ${comparison.best.name}.`,
        metric: `${comparison.worst.operatingMarginPct.toFixed(1)}%`,
        target: `${comparison.best.operatingMarginPct.toFixed(1)}%`,
        impact: monthly((spread / 100) * comparison.worst.revenue, days),
        action: 'Book a store visit and audit portioning and roster at that outlet.',
        link: { to: '/reports', label: 'Compare outlets' },
      })
    }
  }

  // --- Profit target -------------------------------------------------------
  const monthlyProfit = monthly(current.operatingProfit, days)
  const profitTarget = outletId === 'all' ? t.monthlyProfitTarget : t.monthlyProfitTarget / outlets.length
  if (monthlyProfit >= profitTarget) {
    push({
      id: 'profit-target',
      severity: 'positive',
      category: 'Profit',
      title: 'Monthly profit run-rate above target',
      detail: `Current run-rate is ${fmtRM(monthlyProfit)} per month against a ${fmtRM(profitTarget)} target.`,
      metric: fmtRM(monthlyProfit),
      target: fmtRM(profitTarget),
      impact: 0,
      action: 'Lock in the wins: keep the same purchasing and roster settings.',
      link: { to: '/profitability', label: 'Open P&L' },
    })
  } else if (monthlyProfit < profitTarget * 0.85) {
    push({
      id: 'profit-behind',
      primary: false,
      severity: 'warning',
      category: 'Profit',
      title: `Profit run-rate ${fmtRM(profitTarget - monthlyProfit)} short of target`,
      detail: `Run-rate is ${fmtRM(monthlyProfit)} per month against a ${fmtRM(profitTarget)} target.`,
      metric: fmtRM(monthlyProfit),
      target: fmtRM(profitTarget),
      impact: profitTarget - monthlyProfit,
      action: 'Work the top three issues on this list. They carry most of the gap.',
      link: { to: '/profitability', label: 'Open P&L' },
    })
  }

  alerts.sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank || b.impact - a.impact)

  const issues = alerts.filter((a) => a.severity !== 'positive')
  // Only primary rules count toward the headline number: the others measure the
  // same ringgit from a different angle and would double-count it.
  const impact = issues.filter((a) => a.primary !== false).reduce((s, a) => s + Math.max(0, a.impact), 0)

  return { alerts, issues, impact, health: healthScore(current, targets, t, issues) }
}

/**
 * Business health, 0–100. Deliberately simple and explainable: each pillar is a
 * distance-to-target score, weighted by how much it moves profit.
 */
export function healthScore(period, targets, t, issues = []) {
  const pillars = [
    {
      key: 'foodCost',
      label: 'Food cost',
      weight: 0.28,
      value: period.foodCostPct,
      target: t.foodCostPct ?? targets.foodCostPct,
      lowerIsBetter: true,
      tolerance: 6,
    },
    {
      key: 'labor',
      label: 'Labour',
      weight: 0.24,
      value: period.laborCostPct,
      target: t.laborCostPct ?? targets.laborCostPct,
      lowerIsBetter: true,
      tolerance: 6,
    },
    {
      key: 'margin',
      label: 'Gross margin',
      weight: 0.24,
      value: period.grossMarginPct,
      target: targets.grossMarginPct,
      lowerIsBetter: false,
      tolerance: 8,
    },
    {
      key: 'waste',
      label: 'Waste',
      weight: 0.12,
      value: period.wastePct,
      target: t.wastePctOfRevenue,
      lowerIsBetter: true,
      tolerance: 2,
    },
    {
      key: 'variance',
      label: 'Stock variance',
      weight: 0.12,
      value: period.variancePct,
      target: 1.5,
      lowerIsBetter: true,
      tolerance: 3,
    },
  ].map((p) => {
    const delta = p.lowerIsBetter ? p.target - p.value : p.value - p.target
    const score = clamp(Math.round(80 + (delta / p.tolerance) * 40), 0, 100)
    return { ...p, score, delta }
  })

  const raw = pillars.reduce((s, p) => s + p.score * p.weight, 0)
  const criticalPenalty = issues.filter((a) => a.severity === 'critical').length * 4
  const score = clamp(Math.round(raw - criticalPenalty), 0, 100)
  return {
    score,
    pillars,
    label: score >= 85 ? 'Strong' : score >= 70 ? 'Healthy' : score >= 55 ? 'Needs attention' : 'At risk',
    tone: score >= 85 ? 'success' : score >= 70 ? 'brand' : score >= 55 ? 'warning' : 'danger',
  }
}

/** Stock-level alerts scoped to one ingredient row (used inline in tables). */
export function inventoryFlags(row, t = DEFAULT_THRESHOLDS) {
  const flags = []
  if (row.belowMin) flags.push({ key: 'low', label: 'Below minimum', tone: 'danger' })
  if (row.nearExpiry) flags.push({ key: 'expiry', label: 'Near expiry', tone: 'warning' })
  if (row.variancePct >= t.variancePctAlert) flags.push({ key: 'variance', label: 'High variance', tone: 'warning' })
  if (row.excess) flags.push({ key: 'excess', label: 'Excess cover', tone: 'info' })
  return flags
}

/** Human-readable "why did this fire" text, shown in Settings. */
export const RULE_BOOK = [
  { id: 'food-cost', category: 'Food cost', rule: 'Food cost % of net sales > target food cost %', severity: 'Critical above +2.5 pts' },
  { id: 'gross-margin', category: 'Margin', rule: 'Gross margin % < target gross margin %', severity: 'Critical below −3 pts' },
  { id: 'variance-total', category: 'Inventory', rule: 'Period unexplained usage value > variance alert threshold', severity: 'Critical at 2× threshold' },
  { id: 'variance-item', category: 'Inventory', rule: 'Ingredient actual usage > recipe usage by > variance % threshold', severity: 'Critical at 1.8× threshold' },
  { id: 'waste', category: 'Waste', rule: 'Waste value > waste % of revenue ceiling', severity: 'Critical at 1.8× ceiling' },
  { id: 'labor-cost', category: 'Labor', rule: 'Labour cost % of net sales > target labour %', severity: 'Critical above +3 pts' },
  { id: 'overtime', category: 'Labor', rule: 'Overtime pay > overtime share of labour spend', severity: 'Watch' },
  { id: 'labor-block', category: 'Labor', rule: 'Day-part sales per labour hour < 60% of period average', severity: 'Watch' },
  { id: 'price', category: 'Purchasing', rule: 'Ingredient average price up > price increase threshold vs first half of period', severity: 'Warning at 1.6× threshold' },
  { id: 'savings', category: 'Purchasing', rule: 'Cheaper supplier quotes on file worth > savings threshold', severity: 'Watch' },
  { id: 'low-stock', category: 'Inventory', rule: 'On hand < minimum stock level', severity: 'Critical below 1 day cover' },
  { id: 'expiry', category: 'Inventory', rule: 'Days since delivery ≥ shelf life − 2 on short-life items', severity: 'Warning' },
  { id: 'excess-stock', category: 'Inventory', rule: 'Days of cover > 21 and on hand > 2× minimum', severity: 'Watch' },
  { id: 'menu', category: 'Menu', rule: 'High popularity item with margin below menu average (Plowhorse)', severity: 'Watch' },
  { id: 'discounts', category: 'Revenue', rule: 'Discounts > discount % of gross sales guideline', severity: 'Watch' },
  { id: 'outlet', category: 'Outlets', rule: 'Operating margin spread between best and worst outlet > 4 pts', severity: 'Warning above 8 pts' },
  { id: 'profit-target', category: 'Profit', rule: 'Monthly operating profit run-rate vs profit target', severity: 'Good / Warning' },
]

// --- tiny local formatters (rules text is plain strings, not JSX) ----------
function fmtRM(v, decimals = 0) {
  const n = Number.isFinite(v) ? v : 0
  return `RM${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function fmtHour(h) {
  const hour = ((h + 11) % 12) + 1
  return `${hour}${h >= 12 ? 'PM' : 'AM'}`
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

export { fmtHour }
