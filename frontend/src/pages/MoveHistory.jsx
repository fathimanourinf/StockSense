import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

const TYPE_OPTIONS = ["", "receipt", "delivery", "transfer_in", "transfer_out", "adjustment"];

export default function MoveHistory() {
  const { push } = useToast();
  const [entries, setEntries] = useState([]);
  const [movementType, setMovementType] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/dashboard/move-history", { movementType, limit: 50 });
      setEntries(data.entries);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [movementType]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Move History</h1>
        <p className="text-slate-500 text-sm">Full audit trail of every stock movement</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t || "all"}
            onClick={() => setMovementType(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              movementType === t ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t ? t.replace("_", " ") : "All types"}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 font-medium">Location</th>
              <th className="py-2 font-medium">Change</th>
              <th className="py-2 font-medium">Resulting Qty</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Reference</th>
              <th className="py-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && entries.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-slate-400">No movements found.</td></tr>
            )}
            {entries.map((e) => (
              <tr key={e._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="py-2">{e.product?.name}</td>
                <td className="py-2">{e.location?.name}</td>
                <td className={`py-2 font-medium ${e.changeQty >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {e.changeQty >= 0 ? `+${e.changeQty}` : e.changeQty}
                </td>
                <td className="py-2">{e.resultingQty}</td>
                <td className="py-2 capitalize">{e.movementType.replace("_", " ")}</td>
                <td className="py-2 text-slate-500">{e.sourceDocReference}</td>
                <td className="py-2 text-slate-500">{e.createdBy?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
