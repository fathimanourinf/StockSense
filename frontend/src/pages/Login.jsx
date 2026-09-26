import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e = {};
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(form.email, form.password);
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
        <h1 className="text-xl font-bold text-brand-700 mb-1">StockSense</h1>
        <p className="text-sm text-slate-500 mb-6">Log in to your inventory dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex justify-between mt-4 text-sm">
          <Link to="/forgot-password" className="text-brand-600 hover:underline">
            Forgot password?
          </Link>
          <Link to="/signup" className="text-brand-600 hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
