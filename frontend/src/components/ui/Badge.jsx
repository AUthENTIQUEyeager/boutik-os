import React from 'react';

const VARIANTS = {
  default: 'bg-slate-50 text-slate-700 border-slate-200',
  brand: 'bg-brand-soft text-brand border-brand-border',
  success: 'bg-brand-soft text-brand border-brand-border',
  warning: 'bg-amber-50 text-warning border-amber-200',
  danger: 'bg-red-50 text-danger border-red-200',
  ink: 'bg-slate-900 text-white border-slate-900',
};

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
