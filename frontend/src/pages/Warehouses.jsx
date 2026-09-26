import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

export default function Warehouses() {
  const { push } = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whModalOpen, setWhModalOpen] = useState(false);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", code: "", address: "" });
  const [locForm, setLocForm] = useState({ warehouse: "", name: "", code: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [wh, loc] = await Promise.all([
        api.get("/warehouses"),
        api.get("/warehouses/locations/all"),
      ]);
      setWarehouses(wh);
      setLocations(loc);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreateWarehouse(ev) {
    ev.preventDefault();
    if (!whForm.name.trim() || !whForm.code.trim()) return setError("Name and code are required.");
    setError("");
    setSaving(true);
    try {
      await api.post("/warehouses", whForm);
      push("Warehouse created.", "success");
      setWhModalOpen(false);
      setWhForm({ name: "", code: "", address: "" });
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateLocation(ev) {
    ev.preventDefault();
    if (!locForm.warehouse || !locForm.name.trim() || !locForm.code.trim()) {
      return setError("Warehouse, name and code are required.");
    }
    setError("");
    setSaving(true);
    try {
      await api.post("/warehouses/locations", locForm);
      push("Location created.", "success");
      setLocModalOpen(false);
      setLocForm({ warehouse: "", name: "", code: "" });
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Warehouses</h1>
        <p className="text-slate-500 text-sm">Manage warehouses and their internal locations</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Warehouses</h2>
          <button className="btn-secondary text-sm" onClick={() => setWhModalOpen(true)}>+ Add Warehouse</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Code</th>
              <th className="py-2 font-medium">Address</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && warehouses.length === 0 && (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">No warehouses yet.</td></tr>
            )}
            {warehouses.map((w) => (
              <tr key={w._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 font-medium">{w.name}</td>
                <td className="py-2">{w.code}</td>
                <td className="py-2 text-slate-500">{w.address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Locations</h2>
          <button className="btn-secondary text-sm" onClick={() => setLocModalOpen(true)}>+ Add Location</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium">Warehouse</th>
              <th className="py-2 font-medium">Location Name</th>
              <th className="py-2 font-medium">Code</th>
            </tr>
          </thead>
          <tbody>
            {!loading && locations.length === 0 && (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">No locations yet.</td></tr>
            )}
            {locations.map((l) => (
              <tr key={l._id} className="border-b border-slate-50 last:border-0">
                <td className="py-2">{l.warehouse?.name}</td>
                <td className="py-2 font-medium">{l.name}</td>
                <td className="py-2 text-slate-500">{l.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={whModalOpen} title="New Warehouse" onClose={() => setWhModalOpen(false)}>
        <form onSubmit={handleCreateWarehouse} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="label">Name</label>
            <input className="input" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Code</label>
            <input className="input" value={whForm.code} onChange={(e) => setWhForm({ ...whForm, code: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} />
          </div>
          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Create Warehouse"}</button>
        </form>
      </Modal>

      <Modal open={locModalOpen} title="New Location" onClose={() => setLocModalOpen(false)}>
        <form onSubmit={handleCreateLocation} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="label">Warehouse</label>
            <select className="input" value={locForm.warehouse} onChange={(e) => setLocForm({ ...locForm, warehouse: e.target.value })}>
              <option value="">Select warehouse…</option>
              {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location name</label>
            <input className="input" placeholder="e.g. Rack A" value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Code</label>
            <input className="input" value={locForm.code} onChange={(e) => setLocForm({ ...locForm, code: e.target.value })} />
          </div>
          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Create Location"}</button>
        </form>
      </Modal>
    </div>
  );
}
