const VARIANT_ICON_BG = {
  default: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-soft text-brand',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
};

export default function StatCard({ icon: Icon, label, value, sub, variant = 'default' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-card shadow-soft p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${VARIANT_ICON_BG[variant]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-950">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
