import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-light active:scale-[0.98]',
  secondary: 'bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-200/50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-50',
  danger: 'bg-danger text-white hover:opacity-90',
  brand_outline: 'bg-white text-brand border border-brand-border hover:bg-brand-soft',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-12 px-5 text-lg gap-2',
  xl: 'h-14 px-6 text-xl gap-2.5',
};

export default function Button({
  variant = 'primary', size = 'md', icon: Icon, loading = false,
  disabled, children, className = '', ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-btn font-semibold
        transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
