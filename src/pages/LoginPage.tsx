import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, AlertCircle, Phone, KeyRound, ArrowLeft, CheckCircle, Store, ShoppingBag } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "/dashboard";
  const asParam = params.get("as");
  const asMerchant = asParam === "merchant";
  const asCustomer = asParam === "customer";

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
        const role = result.user?.role;
        const isDealer = role === "DEALER";
        const isCustomer = role === "CUSTOMER";
        const fallback = isDealer ? "/merchant" : isCustomer ? "/shop" : "/dashboard";
        navigate(returnTo === "/dashboard" ? fallback : returnTo);
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh-fill w-full bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient light blooms behind the glass card */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-green-400/15 blur-3xl" />

      <div className="liquid-glass max-w-md w-full rounded-3xl p-8 space-y-6 relative z-10">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/40">
            <Sprout className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white drop-shadow">{t("brandName")}</h1>
          <p className="text-xs text-emerald-100/80 mt-1">Smart Kheti Sahayak</p>
          <span
            className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
              asCustomer
                ? "bg-fuchsia-50/90 text-fuchsia-700 border border-fuchsia-200"
                : asMerchant
                ? "bg-violet-50/90 text-violet-700 border border-violet-200"
                : "bg-emerald-50/90 text-emerald-700 border border-emerald-200"
            }`}
          >
            {asMerchant ? <Store className="w-3 h-3" /> : asCustomer ? <ShoppingBag className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
            {asMerchant ? "MERCHANT PORTAL" : asCustomer ? "CUSTOMER PORTAL" : "FARMER PORTAL"}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-300/30 text-rose-100 text-xs backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-50/90 mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-emerald-200/70" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-50/90 mb-1.5">
              PIN <span className="text-emerald-100/60 font-normal">(4-6 digits)</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-emerald-200/70" />
              <input
                type="password"
                required
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter your PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-900/40 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" /> Logging in...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-white/15">
          <p className="text-xs text-emerald-100/80">
            {asMerchant ? "Naya merchant hai?" : asCustomer ? "Naya customer hai?" : "Naya kisan hai?"}{" "}
            <Link
              to={asMerchant ? "/register?as=merchant" : asCustomer ? "/register?as=customer" : "/register"}
              className="text-emerald-300 font-semibold hover:text-emerald-200 hover:underline"
            >
              Register as new user
            </Link>
          </p>
          <Link to="/" className="inline-flex items-center gap-1 text-[11px] text-emerald-100/60 hover:text-emerald-200 mt-2">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
