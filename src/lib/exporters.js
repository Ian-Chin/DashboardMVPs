// CSV + PDF export. PDF uses the browser print pipeline (print stylesheet in
// index.css hides chrome), which keeps the MVP dependency-free.

function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * @param {Array<{key:string,label:string,map?:Function}>} columns
 * @param {Array<object>} rows
 */
export function toCsv(columns, rows, meta = []) {
  const lines = []
  for (const [k, v] of meta) lines.push(`${escapeCell(k)},${escapeCell(v)}`)
  if (meta.length) lines.push('')
  lines.push(columns.map((c) => escapeCell(c.label)).join(','))
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(c.map ? c.map(row) : row[c.key])).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv(filename, columns, rows, meta) {
  const csv = toCsv(columns, rows, meta)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportPdf() {
  window.print()
}

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
