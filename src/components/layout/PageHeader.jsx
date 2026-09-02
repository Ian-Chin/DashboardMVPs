import { Download, Printer } from 'lucide-react'
import { fmtRange } from '../../lib/date.js'
import { useApp } from '../../state/AppContext.jsx'
import { exportPdf } from '../../lib/exporters.js'
import { cx } from '../ui/Primitives.jsx'

export function PageHeader({ title, description, actions, onExportCsv, showPrint = true, className }) {
  const { range, scopeLabel } = useApp()

  return (
    <div className={cx('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-ink-500">{description}</p>}
        {/* Scope and period are set in the top bar, which print CSS hides —
            restate them here so the exported PDF still carries them. */}
        <p className="mt-1 hidden text-[13px] text-ink-500 print:block">
          {scopeLabel} · {fmtRange(range.from, range.to)}
        </p>
      </div>
      <div className="no-print flex flex-wrap items-center gap-2">
        {actions}
        {onExportCsv && (
          <button type="button" onClick={onExportCsv} className="btn-ghost btn-sm">
            <Download size={14} />
            CSV
          </button>
        )}
        {showPrint && (
          <button type="button" onClick={exportPdf} className="btn-ghost btn-sm">
            <Printer size={14} />
            PDF
          </button>
        )}
      </div>
    </div>
  )
}
