const STATUS_OPTIONS = ["", "draft", "waiting", "ready", "done", "cancelled"];

export default function FilterBar({ status, onStatusChange, extra }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {STATUS_OPTIONS.map((s) => (
        <button
          key={s || "all"}
          onClick={() => onStatusChange(s)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
            status === s
              ? "bg-brand-600 border-brand-600 text-white"
              : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All statuses"}
        </button>
      ))}
      {extra}
    </div>
  );
}
