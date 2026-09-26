import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const { push } = useToast();
  const [kpis, setKpis] = useState(null);
  const [recentMoves, setRecentMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [kpiData, moveData] = await Promise.all([
        api.get("/dashboard/kpis"),
        api.get("/dashboard/move-history", { limit: 8 }),
      ]);
      setKpis(kpiData);
      setRecentMoves(moveData.entries);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-slate-500">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">Snapshot of current inventory operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Products in Stock" value={kpis.totalProductsInStock} />
        <KpiCard label="Low Stock" value={kpis.lowStockCount} tone="warn" />
        <KpiCard label="Out of Stock" value={kpis.outOfStockCount} tone="danger" />
        <KpiCard label="Pending Receipts" value={kpis.pendingReceipts} />
        <KpiCard label="Pending Deliveries" value={kpis.pendingDeliveries} />
        <KpiCard label="Transfers Scheduled" value={kpis.transfersScheduled} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Recent Stock Movements</h2>
          <a href="/move-history" className="text-sm text-brand-600 hover:underline">
            View all →
          </a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 font-medium">Location</th>
              <th className="py-2 font-medium">Change</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {recentMoves.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No stock movements yet.
                </td>
              </tr>
            )}
            {recentMoves.map((m) => (
              <tr key={m._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2">{m.product?.name}</td>
                <td className="py-2">{m.location?.name}</td>
                <td className={`py-2 font-medium ${m.changeQty >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {m.changeQty >= 0 ? `+${m.changeQty}` : m.changeQty}
                </td>
                <td className="py-2">
                  <StatusBadge status={m.movementType === "adjustment" ? "waiting" : "done"} />
                  <span className="ml-1 text-xs text-slate-400">{m.movementType}</span>
                </td>
                <td className="py-2 text-slate-500">{m.sourceDocReference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
