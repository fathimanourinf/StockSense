import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import FilterBar from "../components/FilterBar";

export default function Transfers() {
  const { push } = useToast();
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ fromLocation: "", toLocation: "", lines: [{ product: "", quantity: 1 }] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/transfers", { status });
      setTransfers(data.transfers);
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
    setForm({ ...form, lines: [...form.lines, { product: "", quantity: 1 }] });
  }

  async function handleCreate(ev) {
    ev.preventDefault();
    if (!form.fromLocation || !form.toLocation) return setError("Both locations are required.");
    if (form.fromLocation === form.toLocation) return setError("From and To locations must be different.");
    if (form.lines.some((l) => !l.product || l.quantity <= 0)) {
      return setError("Every line needs a product and a quantity greater than 0.");
    }
    setError("");
    setSaving(true);
    try {
      await api.post("/transfers", form);
      push("Internal transfer created.", "success");
      setModalOpen(false);
      setForm({ fromLocation: "", toLocation: "", lines: [{ product: "", quantity: 1 }] });
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(id) {
    if (!confirm("Validate this transfer? Stock will move between locations immediately.")) return;
    try {
      await api.post(`/transfers/${id}/validate`);
      push("Transfer validated — stock moved.", "success");
      load();
    } catch (err) {
      push(err.message, "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Internal Transfers</h1>
          <p className="text-slate-500 text-sm">Move stock between warehouses or locations</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ New Transfer</button>
      </div>

      <FilterBar status={status} onStatusChange={setStatus} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium">Reference</th>
              <th className="py-2 font-medium">From</th>
              <th className="py-2 font-medium">To</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && transfers.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-slate-400">No transfers found.</td></tr>
            )}
            {transfers.map((t) => (
              <tr key={t._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 font-medium">{t.reference}</td>
                <td className="py-2">{t.fromLocation?.name}</td>
                <td className="py-2">{t.toLocation?.name}</td>
                <td className="py-2"><StatusBadge status={t.status} /></td>
                <td className="py-2 text-right">
                  {!["done", "cancelled"].includes(t.status) && (
                    <button onClick={() => handleValidate(t._id)} className="text-brand-600 text-sm hover:underline">
                      Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title="New Internal Transfer" onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleCreate} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From location</label>
              <select className="input" value={form.fromLocation} onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}>
                <option value="">Select location…</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.warehouse?.name} — {l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">To location</label>
              <select className="input" value={form.toLocation} onChange={(e) => setForm({ ...form, toLocation: e.target.value })}>
                <option value="">Select location…</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.warehouse?.name} — {l.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Lines</label>
            <div className="space-y-2">
              {form.lines.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <select className="input" value={line.product} onChange={(e) => updateLine(idx, "product", e.target.value)}>
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <input
                    type="number" min="1" className="input w-28"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addLine} className="text-brand-600 text-sm mt-2 hover:underline">
              + Add line
            </button>
          </div>

          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Create Transfer"}</button>
        </form>
      </Modal>
    </div>
  );
}
