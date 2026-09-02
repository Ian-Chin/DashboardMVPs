import { useMemo } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { changePct } from '../lib/format.js'
import {
  inventoryAnalysis,
  laborAnalysis,
  menuPerformance,
  outletComparison,
  periodWithComparison,
  purchasingAnalysis,
  targetsFor,
} from '../lib/metrics.js'

/** Current period, the comparison window, targets and pre-computed deltas. */
export function usePeriod() {
  const { outletId, range } = useApp()
  return useMemo(() => {
    const { current, previous, previousRange } = periodWithComparison(outletId, range.from, range.to)
    const targets = targetsFor(outletId, range.from, range.to)
    const delta = {
      revenue: changePct(current.revenue.net, previous.revenue.net),
      grossProfit: changePct(current.grossProfit, previous.grossProfit),
      operatingProfit: changePct(current.operatingProfit, previous.operatingProfit),
      grossMarginPct: current.grossMarginPct - previous.grossMarginPct,
      foodCostPct: current.foodCostPct - previous.foodCostPct,
      laborCostPct: current.laborCostPct - previous.laborCostPct,
      wasteCost: changePct(current.cogs.waste, previous.cogs.waste),
      varianceCost: changePct(current.cogs.variance, previous.cogs.variance),
      orders: changePct(current.orders, previous.orders),
      aov: changePct(current.aov, previous.aov),
      salesPerLaborHour: changePct(current.salesPerLaborHour, previous.salesPerLaborHour),
      operatingMarginPct: current.operatingMarginPct - previous.operatingMarginPct,
    }
    return { current, previous, previousRange, targets, delta, range, outletId }
  }, [outletId, range.from, range.to])
}

export function useMenu() {
  const { outletId, range } = useApp()
  return useMemo(() => menuPerformance(outletId, range.from, range.to), [outletId, range.from, range.to])
}

export function useInventory() {
  const { outletId, range } = useApp()
  return useMemo(() => inventoryAnalysis(outletId, range.from, range.to), [outletId, range.from, range.to])
}

export function useLabor() {
  const { outletId, range } = useApp()
  return useMemo(() => laborAnalysis(outletId, range.from, range.to), [outletId, range.from, range.to])
}

export function usePurchasing() {
  const { outletId, range } = useApp()
  return useMemo(() => purchasingAnalysis(outletId, range.from, range.to), [outletId, range.from, range.to])
}

export function useOutlets() {
  const { range } = useApp()
  return useMemo(() => outletComparison(range.from, range.to), [range.from, range.to])
}
