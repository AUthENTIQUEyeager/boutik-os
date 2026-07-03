import React from 'react';

export default function Input({ label, icon: Icon, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />}
        <input
          className={`
            w-full h-10 rounded-input border text-base bg-white
            ${Icon ? 'pl-9 pr-3' : 'px-3'}
            ${error ? 'border-danger focus:ring-danger/20' : 'border-slate-200 focus:border-brand focus:ring-brand/15'}
            focus:outline-none focus:ring-4 transition-all placeholder:text-slate-500/70
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
