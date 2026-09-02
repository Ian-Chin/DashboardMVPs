import { Link } from 'react-router-dom'
import { ArrowRight, Check, X } from 'lucide-react'
import { money } from '../../lib/format.js'
import { SEVERITY_TONE, TONES } from '../../lib/palette.js'
import { Badge, cx } from '../ui/Primitives.jsx'

const DOT = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-yellow-400',
  positive: 'bg-brand-500',
}

const SEVERITY_LABEL = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Watch',
  positive: 'Good',
}

export function AlertRow({ alert, onDismiss, currency = 'RM', compact = false }) {
  const tone = SEVERITY_TONE[alert.severity] || 'neutral'
  return (
    <div className={cx('group flex gap-3 px-4 py-3 transition-colors hover:bg-ink-50/70 sm:px-5', compact && 'py-2.5')}>
      <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', DOT[alert.severity])} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[14px] font-medium text-ink-900">{alert.title}</p>
          <Badge tone={tone}>{alert.category}</Badge>
        </div>
        {!compact && <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{alert.detail}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          {alert.metric && (
            <span className="text-ink-500">
              Now <span className="tabular font-medium text-ink-800">{alert.metric}</span>
              {alert.target && alert.target !== '—' && (
                <>
                  {' · '}Target <span className="tabular font-medium text-ink-800">{alert.target}</span>
                </>
              )}
            </span>
          )}
          {alert.impact > 0 && (
            <span className={cx('font-medium', TONES[tone].text)}>
              {money(alert.impact, { currency })}/month at stake
            </span>
          )}
        </div>

        {!compact && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-ink-700">
              <span className="font-medium text-ink-900">Do this:</span> {alert.action}
            </p>
            {alert.link && (
              <Link
                to={alert.link.to}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:text-brand-800"
              >
                {alert.link.label}
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          title="Dismiss"
          className="h-6 w-6 shrink-0 rounded-md text-ink-300 opacity-0 transition hover:bg-ink-100 hover:text-ink-600 group-hover:opacity-100"
        >
          <X size={14} className="mx-auto" />
        </button>
      )}
    </div>
  )
}

export function AlertList({ alerts, onDismiss, currency, compact, emptyText = 'No issues detected in this period.' }) {
  if (!alerts.length) {
    return (
      <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-ink-500">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Check size={13} />
        </span>
        {emptyText}
      </div>
    )
  }
  return (
    <div className="divide-y divide-ink-100">
      {alerts.map((a) => (
        <AlertRow key={a.id} alert={a} onDismiss={onDismiss} currency={currency} compact={compact} />
      ))}
    </div>
  )
}

export function severityLabel(key) {
  return SEVERITY_LABEL[key] || key
}
