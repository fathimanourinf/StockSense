import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Signup() {
  const { signup } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "warehouse_staff" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-bold text-brand-700 mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Join your team's inventory workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="warehouse_staff">Warehouse Staff</option>
              <option value="inventory_manager">Inventory Manager</option>
            </select>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
