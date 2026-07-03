import React from 'react';

export default function Card({ children, onClick, padding = 'p-4', className = '' }) {
  const isClickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-slate-200 rounded-card shadow-soft
        ${padding} ${isClickable ? 'cursor-pointer hover:border-brand-border transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
