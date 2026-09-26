import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

const emptyForm = { name: "", sku: "", uom: "unit", reorderPoint: 0, reorderQty: 0, description: "" };

export default function Products() {
  const { push } = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/products", { search });
      setProducts(data.products);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce SKU/name search
    return () => clearTimeout(t);
  }, [search]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required.";
    if (!form.sku.trim()) e.sku = "SKU is required.";
    if (form.reorderPoint < 0) e.reorderPoint = "Cannot be negative.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post("/products", form);
      push("Product created.", "success");
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 text-sm">Manage your product catalog and reorder rules</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + New Product
        </button>
      </div>

      <input
        className="input max-w-xs"
        placeholder="Search by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">SKU</th>
              <th className="py-2 font-medium">UoM</th>
              <th className="py-2 font-medium">Reorder Point</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="py-6 text-center text-slate-400">Loading…</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-slate-400">No products yet.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 font-medium text-slate-700">{p.name}</td>
                <td className="py-2 text-slate-500">{p.sku}</td>
                <td className="py-2">{p.uom}</td>
                <td className="py-2">{p.reorderPoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title="New Product" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3" noValidate>
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">SKU / Code</label>
            <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Unit of Measure</label>
              <input className="input" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
            </div>
            <div>
              <label className="label">Reorder Point</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.reorderPoint}
                onChange={(e) => setForm({ ...form, reorderPoint: Number(e.target.value) })}
              />
              {errors.reorderPoint && <p className="text-xs text-red-600 mt-1">{errors.reorderPoint}</p>}
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button disabled={saving} className="btn-primary w-full">
            {saving ? "Saving…" : "Create Product"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
