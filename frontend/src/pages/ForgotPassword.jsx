import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

// 3-step flow: request OTP -> verify OTP -> set new password.
export default function ForgotPassword() {
  const { push } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestOtp(ev) {
    ev.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return push("Enter a valid email address.", "error");
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      push("If that email exists, an OTP has been sent.", "success");
      setStep(2);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(ev) {
    ev.preventDefault();
    if (!code || code.length !== 6) return push("Enter the 6-digit code.", "error");
    setSubmitting(true);
    try {
      await api.post("/auth/verify-otp", { email, code });
      setStep(3);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(ev) {
    ev.preventDefault();
    if (newPassword.length < 6) return push("Password must be at least 6 characters.", "error");
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
      push("Password reset. Please log in.", "success");
      navigate("/login");
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-bold text-brand-700 mb-1">Reset your password</h1>
        <p className="text-sm text-slate-500 mb-6">Step {step} of 3</p>

        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button disabled={submitting} className="btn-primary w-full">
              {submitting ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="label">6-digit code</label>
              <input
                className="input tracking-widest text-center"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <button disabled={submitting} className="btn-primary w-full">
              {submitting ? "Verifying..." : "Verify code"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button disabled={submitting} className="btn-primary w-full">
              {submitting ? "Saving..." : "Set new password"}
            </button>
          </form>
        )}

        <p className="text-sm text-center mt-4">
          <Link to="/login" className="text-brand-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
