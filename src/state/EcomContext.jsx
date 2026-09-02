import { createContext, useContext, useMemo, useState } from 'react'
import { channels, store } from '../data/ecomCatalog.js'
import {
  ALL_CHANNELS,
  channelBreakdown,
  ecomIssues,
  ecomPeriodWithComparison,
  marketingBreakdown,
  productPerformance,
  returnsBreakdown,
} from '../lib/ecomMetrics.js'
import { useApp } from './AppContext.jsx'

const EcomContext = createContext(null)

/**
 * Channel scope for the e-commerce workspace. The date range is deliberately
 * shared with the rest of the product — one period control, one meaning —
 * while the scope control changes because outlets are not channels.
 */
export function EcomProvider({ children }) {
  const { range, currency } = useApp()
  const [channelId, setChannelId] = useState(ALL_CHANNELS)

  const value = useMemo(() => {
    const { from, to } = range
    const period = ecomPeriodWithComparison(channelId, from, to)
    return {
      store,
      channels,
      channelId,
      setChannelId,
      channelLabel: channelId === ALL_CHANNELS ? 'All channels' : channels.find((c) => c.id === channelId)?.name || '',
      currency,
      range,
      ...period,
      verdict: ecomIssues(channelId, from, to),
      channelRows: channelBreakdown(from, to),
      products: productPerformance(channelId, from, to),
      returns: returnsBreakdown(channelId, from, to),
      marketing: marketingBreakdown(channelId, from, to),
    }
  }, [channelId, range, currency])

  return <EcomContext.Provider value={value}>{children}</EcomContext.Provider>
}

export function useEcom() {
  const ctx = useContext(EcomContext)
  if (!ctx) throw new Error('useEcom must be used inside <EcomProvider>')
  return ctx
}

export { ALL_CHANNELS }
