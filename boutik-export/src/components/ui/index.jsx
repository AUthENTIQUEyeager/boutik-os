/**
 * BoutiK — Design System v2
 * Inspiré Linear / Stripe / Notion
 */
import { Loader2 } from 'lucide-react'

// ─── BUTTON ──────────────────────────────────────────────────────────────────

export function Button({ children, variant = 'primary', size = 'md', className = '', loading = false, icon: Icon, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]'

  const variants = {
    primary:   'bg-brand text-white hover:bg-brand-light focus:ring-brand shadow-brand/30 shadow-sm',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300 border border-slate-200',
    ghost:     'text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
    danger:    'bg-danger text-white hover:bg-red-600 focus:ring-danger',
    outline:   'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-200',
    brand_outline: 'border border-brand text-brand hover:bg-brand-soft focus:ring-brand',
  }

  const sizes = {
    xs: 'h-7 px-2.5 text-xs gap-1',
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2',
    xl: 'h-12 px-6 text-base gap-2',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────────

export function Card({ children, className = '', onClick, padding = true, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-[14px] shadow-card ${padding ? 'p-4' : ''} ${onClick || hover ? 'cursor-pointer hover:shadow-card-hover hover:border-slate-300 transition-all duration-150 active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────

export function StatCard({ label, value, sub, icon: Icon, trend, variant = 'default' }) {
  const variants = {
    default: 'border-slate-200',
    brand:   'border-brand-border bg-brand-soft',
    warning: 'border-amber-200 bg-amber-50',
    danger:  'border-red-200 bg-red-50',
  }

  const iconColors = {
    default: 'text-slate-400 bg-slate-100',
    brand:   'text-brand bg-brand-soft border border-brand-border',
    warning: 'text-amber-600 bg-amber-50',
    danger:  'text-red-500 bg-red-50',
  }

  return (
    <div className={`bg-white border rounded-[14px] p-4 shadow-card ${variants[variant]}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColors[variant]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-slate-950 leading-none mb-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── INPUT ────────────────────────────────────────────────────────────────────

export function Input({ label, error, hint, className = '', icon: Icon, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} pr-3 rounded-[10px] border text-sm bg-white text-slate-950 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${error ? 'border-danger' : 'border-slate-200 hover:border-slate-300'}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    brand:   'bg-brand-soft text-brand border border-brand-border',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger:  'bg-red-50 text-red-600 border border-red-200',
    ink:     'bg-slate-900 text-white',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────

export function Divider({ className = '' }) {
  return <hr className={`border-slate-200 ${className}`} />
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }
  return <Loader2 className={`${sizes[size]} animate-spin text-brand ${className}`} />
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

export function EmptyState({ title, description, action, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      {Icon && (
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 mb-4 max-w-[220px] leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
      {action}
    </div>
  )
}

// ─── ALERT ───────────────────────────────────────────────────────────────────

export function Alert({ children, variant = 'info', icon: Icon }) {
  const variants = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger:  'bg-red-50 border-red-200 text-red-700',
    success: 'bg-brand-soft border-brand-border text-brand',
  }
  return (
    <div className={`flex items-start gap-3 border rounded-[10px] px-4 py-3 text-sm ${variants[variant]}`}>
      {Icon && <Icon className="w-4 h-4 mt-0.5 shrink-0" />}
      <div>{children}</div>
    </div>
  )
}
