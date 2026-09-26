export default function KpiCard({ label, value, tone = "default" }) {
  const toneClasses = {
    default: "text-slate-900",
    warn: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-semibold mt-1 ${toneClasses[tone]}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}
