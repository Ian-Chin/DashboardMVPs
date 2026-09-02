import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cx, EmptyState } from './Primitives.jsx'

/**
 * Sortable, optionally searchable table.
 *
 * columns: [{
 *   key, label, align: 'left'|'right', sortable, width,
 *   value: (row) => sortableValue,     // defaults to row[key]
 *   render: (row) => node,             // defaults to value
 *   className
 * }]
 */
export function DataTable({
  columns,
  rows,
  rowKey = (r) => r.id,
  initialSort,
  searchable = false,
  searchKeys = [],
  searchPlaceholder = 'Search…',
  onRowClick,
  activeRowKey,
  emptyTitle = 'Nothing to show',
  emptyDetail,
  dense = false,
  maxHeight,
  footer,
}) {
  const [sort, setSort] = useState(initialSort || null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    const keys = searchKeys.length ? searchKeys : columns.map((c) => c.key)
    return rows.filter((r) => keys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)))
  }, [rows, query, searchKeys, columns])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return filtered
    const get = col.value || ((r) => r[col.key])
    return [...filtered].sort((a, b) => {
      const av = get(a)
      const bv = get(b)
      if (typeof av === 'string' || typeof bv === 'string') {
        return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      }
      return sort.dir === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0)
    })
  }, [filtered, sort, columns])

  const toggleSort = (col) => {
    if (col.sortable === false) return
    setSort((prev) =>
      prev?.key === col.key ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'desc' },
    )
  }

  return (
    <div>
      {searchable && (
        <div className="border-b border-ink-200/70 px-4 py-2.5 sm:px-5">
          <div className="relative max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="input pl-9"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-ink-50/90 backdrop-blur">
            <tr className="border-b border-ink-200/70">
              {columns.map((col) => {
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cx('th', col.align === 'right' && 'text-right', col.sortable !== false && 'cursor-pointer select-none')}
                    onClick={() => toggleSort(col)}
                  >
                    <span className={cx('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse')}>
                      {col.label}
                      {active &&
                        (sort.dir === 'asc' ? (
                          <ChevronUp size={12} className="text-ink-700" />
                        ) : (
                          <ChevronDown size={12} className="text-ink-700" />
                        ))}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const key = rowKey(row)
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cx(
                    'border-b border-ink-100 last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-ink-50',
                    activeRowKey === key && 'bg-brand-50/60',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cx('td', dense && 'py-2', col.align === 'right' && 'text-right tabular', col.className)}
                    >
                      {col.render ? col.render(row) : (col.value ? col.value(row) : row[col.key])}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
          {footer && <tfoot className="border-t border-ink-200 bg-ink-50/60">{footer}</tfoot>}
        </table>
      </div>

      {!sorted.length && <EmptyState title={emptyTitle} detail={emptyDetail} icon={Search} />}
    </div>
  )
}
