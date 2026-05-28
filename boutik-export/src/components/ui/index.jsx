/**
 * BoutiK - Composants UI de base
 */

export function Button({ children, variant = 'primary', size = 'md', className = '', loading = false, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary: 'bg-ink text-white hover:bg-ink-light focus:ring-ink active:scale-[0.98]',
    secondary: 'bg-paper-soft text-ink border border-paper-border hover:bg-paper-border focus:ring-ink',
    ghost: 'text-ink hover:bg-paper-soft focus:ring-ink',
    danger: 'bg-accent-danger text-white hover:bg-red-700 focus:ring-accent-danger',
    success: 'bg-accent-success text-white hover:bg-green-700 focus:ring-accent-success',
    outline: 'border border-ink text-ink hover:bg-ink hover:text-white focus:ring-ink'
  }

  const sizes = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2'
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

export function Card({ children, className = '', onClick, padding = true }) {
  return (
    <div
      className={`bg-white border border-paper-border rounded-xl shadow-card ${padding ? 'p-4' : ''} ${onClick ? 'cursor-pointer hover:border-ink/20 transition-colors active:scale-[0.99]' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <input
        className={`h-11 px-3 rounded-xl border text-sm bg-white text-ink placeholder:text-ink-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent ${error ? 'border-accent-danger' : 'border-paper-border'}`}
        {...props}
      />
      {error && <p className="text-xs text-accent-danger">{error}</p>}
    </div>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-paper-soft text-ink-light',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    ink: 'bg-ink text-white'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function Divider({ className = '' }) {
  return <hr className={`border-paper-border ${className}`} />
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className={`${sizes[size]} border-2 border-paper-border border-t-ink rounded-full animate-spin`} />
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-paper-soft rounded-2xl mb-4" />
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-xs text-ink-muted mb-4 max-w-[200px]">{description}</p>}
      {action}
    </div>
  )
}

export function StatCard({ label, value, sub, variant = 'default' }) {
  const variants = {
    default: 'border-paper-border',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
  }

  return (
    <Card className={`border ${variants[variant]}`}>
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-ink leading-none mb-1">{value}</p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
    </Card>
  )
}
