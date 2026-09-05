import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../brand/Logo.jsx'

/**
 * The dark hero the three menu pages share. Deliberately not the app layout —
 * no sidebar, because nothing has been chosen yet.
 */
export function LauncherShell({ title, subtitle, meta, back, theme, children }) {
  // The e-commerce menu is the front door of a workspace that runs the light
  // theme, so it gets a light header rather than the restaurant dark hero.
  if (theme === 'ecom') {
    return (
      <div data-theme="ecom" className="min-h-full bg-ink-50">
        <header className="border-b border-ink-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Logo size={30} subtitle="E-commerce" />
              {back && (
                <Link to={back.to} className="btn-ghost btn-sm">
                  <ArrowLeft size={14} />
                  {back.label}
                </Link>
              )}
            </div>

            <h1 className="mt-7 text-[26px] font-semibold tracking-tight text-ink-900 sm:text-[30px]">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-600">{subtitle}</p>}
            {meta && (
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-500">{meta}</div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-ink-50">
      <header className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute -right-24 -top-32 h-[380px] w-[380px] rounded-full bg-brand-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 left-[-10%] h-[320px] w-[320px] rounded-full bg-brand-400/10 blur-[100px]" />

        <div className="relative mx-auto w-full max-w-5xl px-5 py-9 sm:px-8 sm:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Logo size={30} tone="dark" subtitle="Profitability layer" />
            {back && (
              <Link
                to={back.to}
                className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[13px] font-medium text-ink-300 transition hover:border-white/30 hover:text-white"
              >
                <ArrowLeft size={14} />
                {back.label}
              </Link>
            )}
          </div>

          <h1 className="mt-8 text-[28px] font-semibold tracking-tight sm:text-[34px]">{title}</h1>
          {subtitle && <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-300">{subtitle}</p>}
          {meta && <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-ink-400">{meta}</div>}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-9 sm:px-8 sm:py-10">{children}</main>
    </div>
  )
}
