import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import FilterBar from "../components/FilterBar";

export default function Adjustments() {
  const { push } = useToast();
  const [adjustments, setAdjustments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ location: "", reason: "", lines: [{ product: "", countedQty: 0 }] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/adjustments", { status });
      setAdjustments(data.adjustments);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);
  useEffect(() => {
    api.get("/warehouses/locations/all").then((d) => setLocations(d)).catch(() => {});
    api.get("/products", { limit: 100 }).then((d) => setProducts(d.products)).catch(() => {});
  }, []);

  function updateLine(idx, field, value) {
    const lines = [...form.lines];
    lines[idx] = { ...lines[idx], [field]: value };
    setForm({ ...form, lines });
  }
  function addLine() {
    setForm({ ...form, lines: [...form.lines, { product: "", countedQty: 0 }] });
  }

  async function handleCreate(ev) {
    ev.preventDefault();
    if (!form.location) return setError("Location is required.");
    if (form.lines.some((l) => !l.product || l.countedQty < 0)) {
      return setError("Every line needs a product and a counted quantity of 0 or more.");
    }
    setError("");
    setSaving(true);
    try {
      await api.post("/adjustments", form);
      push("Stock adjustment created.", "success");
      setModalOpen(false);
      setForm({ location: "", reason: "", lines: [{ product: "", countedQty: 0 }] });
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(id) {
    if (!confirm("Validate this adjustment? Stock will be corrected to match the physical count.")) return;
    try {
      await api.post(`/adjustments/${id}/validate`);
      push("Adjustment validated — stock corrected.", "success");
      load();
    } catch (err) {
      push(err.message, "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Adjustments</h1>
          <p className="text-slate-500 text-sm">Fix mismatches between recorded and physical stock</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New Adjustment</button>
      </div>

      <FilterBar status={status} onStatusChange={setStatus} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium">Reference</th>
              <th className="py-2 font-medium">Location</th>
              <th className="py-2 font-medium">Reason</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && adjustments.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-slate-400">No adjustments found.</td></tr>
            )}
            {adjustments.map((a) => (
              <tr key={a._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 font-medium">{a.reference}</td>
                <td className="py-2">{a.location?.name}</td>
                <td className="py-2 text-slate-500">{a.reason || "—"}</td>
                <td className="py-2"><StatusBadge status={a.status} /></td>
                <td className="py-2 text-right">
                  {!["done", "cancelled"].includes(a.status) && (
                    <button onClick={() => handleValidate(a._id)} className="text-brand-600 text-sm hover:underline">
                      Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title="New Stock Adjustment" onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleCreate} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="label">Location</label>
            <select className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              <option value="">Select location…</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.warehouse?.name} — {l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <input className="input" placeholder="e.g. Damaged in transit" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>

          <div>
            <label className="label">Counted quantities</label>
            <p className="text-xs text-slate-400 mb-2">The system quantity and difference are calculated automatically on save.</p>
            <div className="space-y-2">
              {form.lines.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <select className="input" value={line.product} onChange={(e) => updateLine(idx, "product", e.target.value)}>
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <input
                    type="number" min="0" className="input w-28"
                    value={line.countedQty}
                    onChange={(e) => updateLine(idx, "countedQty", Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addLine} className="text-brand-600 text-sm mt-2 hover:underline">
              + Add line
            </button>
          </div>

          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Create Adjustment"}</button>
        </form>
      </Modal>
    </div>
  );
}
