export default function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      {action}
    </div>
  );
}
