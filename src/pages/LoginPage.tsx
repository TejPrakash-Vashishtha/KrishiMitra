import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, AlertCircle, Phone, KeyRound, ArrowLeft, CheckCircle, Store } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "/dashboard";
  const asMerchant = params.get("as") === "merchant";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (pin.length < 4) {
      setError("Please enter your 4-6 digit PIN");
      return;
    }
    setLoading(true);
    try {
      const fullPhone = clean.length === 10 ? `+91${clean}` : phone;
      const result = await login(fullPhone, pin);
      if (result.success) {
        // Account role decides the destination (source of truth is the DB)
        const isDealer = result.user?.role === "DEALER";
        navigate(isDealer && returnTo === "/dashboard" ? "/merchant" : returnTo);
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <Sprout className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">AgriNexus</h1>
          <p className="text-xs text-slate-500 mt-1">Smart Kheti Sahayak</p>
          <span
            className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
              asMerchant
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {asMerchant ? <Store className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
            {asMerchant ? "MERCHANT PORTAL" : "FARMER PORTAL"}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              PIN <span className="text-slate-400 font-normal">(4-6 digits)</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter your PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging in...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {asMerchant ? "Naya merchant hai?" : "Naya kisan hai?"}{" "}
            <Link
              to={asMerchant ? "/register?as=merchant" : "/register"}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Register as new user
            </Link>
          </p>
          <Link to="/" className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-600 mt-2">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}