import { cx } from './Primitives.jsx'

/**
 * A contribution-margin P&L, rendered as a statement.
 *
 * The waterfall next to it answers "where did it go" at a glance. This answers
 * "by how much, against what, and versus when" and is the artefact an operator
 * actually reads down. Every line carries its share of net revenue, because a
 * cost is only legible as a percentage of the revenue it is eating.
 */
export function ProfitAndLoss({ blocks, base, formatValue, formatPct, compareLabel }) {
  const share = (v) => (base ? (Math.abs(v) / base) * 100 : 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px]">
        <thead>
          <tr className="border-b border-ink-200">
            <th className="th w-full">Line</th>
            <th className="th text-right">Amount</th>
            <th className="th text-right">% of net</th>
            {compareLabel && <th className="th whitespace-nowrap text-right">vs {compareLabel}</th>}
          </tr>
        </thead>

        {blocks.map((block) => (
          <tbody key={block.block}>
            {block.lines.map((l) => {
              const subtotal = l.kind === 'subtotal' || l.kind === 'total'
              const cost = l.kind === 'cost'
              const change = l.prior === null || l.prior === 0 ? null : ((l.value - l.prior) / Math.abs(l.prior)) * 100
              // On a cost line a rise is bad, so the arrow has to flip.
              const good = change === null ? null : cost ? change < 0 : change > 0

              return (
                <tr
                  key={l.label}
                  className={cx(
                    subtotal ? 'border-t border-ink-200' : 'border-t border-ink-100',
                    l.kind === 'total' && 'bg-ink-50',
                  )}
                >
                  <td className={cx('px-4 py-2.5', l.indent && 'pl-9')}>
                    <span
                      className={cx(
                        'text-[13px]',
                        subtotal ? 'font-semibold text-ink-900' : l.indent ? 'text-ink-500' : 'text-ink-700',
                      )}
                    >
                      {cost && !l.indent && <span className="mr-1 text-ink-400">less</span>}
                      {l.label}
                    </span>
                    {l.note && <span className="mt-0.5 block text-[12px] text-ink-400">{l.note}</span>}
                  </td>

                  <td
                    className={cx(
                      'tabular whitespace-nowrap px-4 py-2.5 text-right text-[13px]',
                      subtotal ? 'font-semibold text-ink-900' : 'text-ink-800',
                      cost && 'text-ink-600',
                    )}
                  >
                    {cost ? `(${formatValue(Math.abs(l.value))})` : formatValue(l.value)}
                  </td>

                  <td className="tabular whitespace-nowrap px-4 py-2.5 text-right text-[13px] text-ink-500">
                    {formatPct(share(l.value))}
                  </td>

                  {compareLabel && (
                    <td className="tabular whitespace-nowrap px-4 py-2.5 text-right text-[13px]">
                      {change === null ? (
                        // A sub-line under a total that already carries the
                        // comparison says nothing by repeating "no prior data".
                        l.indent ? null : <span className="text-ink-300">No prior data</span>
                      ) : (
                        <span className={good ? 'text-brand-600' : 'font-medium text-red-600'}>
                          {change > 0 ? '+' : ''}
                          {change.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        ))}
      </table>
    </div>
  )
}
