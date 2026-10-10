import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, AlertCircle, MapPin, Navigation, Loader2, CheckCircle, Store, ShoppingBag, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function RegisterPage() {
  const asParam = new URLSearchParams(window.location.search).get("as");
  const asMerchant = asParam === "merchant";
  const asCustomer = asParam === "customer";
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsDone, setGpsDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Auto-detect location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`);
            const data = await res.json();
            const addr = data.address || {};
            const detectedCity = addr.city || addr.town || addr.village || addr.county || "";
            const detectedState = addr.state || "";
            const detectedDistrict = addr.district || addr.county || "";
            const detectedPincode = addr.postcode || "";
            setCity(detectedCity);
            setState(detectedState);
            setDistrict(detectedDistrict);
            setPincode(detectedPincode);
            setGpsDone(true);
          } catch {
            console.log("GPS geocoding failed");
          } finally {
            setGpsLoading(false);
          }
        },
        () => setGpsLoading(false),
        { timeout: 8000 }
      );
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your name"); return; }
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) { setError("Please enter a valid 10-digit mobile number"); return; }
    if (!/^\d{4,6}$/.test(pin)) { setError("Please set a 4-6 digit PIN"); return; }
    if (pin !== confirmPin) { setError("PIN and Confirm PIN do not match"); return; }
    if (!village.trim()) { setError("Please enter your village name"); return; }
    if (!city.trim()) { setError("Please enter your city"); return; }

    setLoading(true);
    try {
      const fullPhone = clean.length === 10 ? `+91${clean}` : phone;
      const result = await register({
        name: name.trim(),
        phone: fullPhone,
        pin,
        village: village.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        district: district.trim(),
        pincode: pincode.trim(),
        role: asMerchant ? "DEALER" : asCustomer ? "CUSTOMER" : "FARMER",
        shopName: asMerchant ? shopName.trim() : undefined,
        shopCategory: asMerchant ? shopCategory : undefined,
      });

      if (result.success) {
        navigate(asMerchant ? "/merchant" : asCustomer ? "/shop" : "/dashboard");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch {
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh-fill w-full bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient light blooms behind the glass card */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-green-400/15 blur-3xl" />

      <div className="liquid-glass max-w-md w-full rounded-3xl p-8 space-y-5 relative z-10">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <Sprout className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white drop-shadow">Naya Account Banayein</h1>
          <p className="text-xs text-emerald-100/80 mt-1">{t("brandName")} par register karein</p>
          <span
            className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
              asCustomer
                ? "bg-fuchsia-50/90 text-fuchsia-700 border border-fuchsia-200"
                : asMerchant
                ? "bg-violet-50/90 text-violet-700 border border-violet-200"
                : asCustomer
                  ? "bg-amber-50/90 text-amber-700 border border-amber-200"
                  : "bg-emerald-50/90 text-emerald-700 border border-emerald-200"
            }`}
          >
            {asMerchant ? <Store className="w-3 h-3" /> : asCustomer ? <ShoppingBag className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
            {asMerchant ? "REGISTERING AS MERCHANT" : asCustomer ? "REGISTERING AS CUSTOMER" : "REGISTERING AS FARMER"}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-300/30 text-rose-100 text-xs backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Aapka Naam (Full Name) *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Mobile Number *</label>
            <div className="flex">
              <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-white/30 bg-white/10 text-sm text-emerald-100/80">+91</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                maxLength={10}
                className="w-full px-3 py-2.5 rounded-r-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
              />
            </div>
          </div>

          {/* PIN + Confirm PIN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Create PIN *</label>
              <input
                type="password"
                required
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="4-6 digits"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1">Ye PIN har login par use hoga</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Confirm PIN *</label>
              <input
                type="password"
                required
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Confirm PIN"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
              />
            </div>
          </div>

          {/* Merchant shop details */}
          {asMerchant && (
            <>
              <div>
                <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Dukaan Ka Naam (Shop Name)</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sharma Seed & Fertilizer Store"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Business Category</label>
                <select
                  value={shopCategory}
                  onChange={(e) => setShopCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/70 focus:bg-white/15 transition-colors [&>option]:text-slate-900"
                >
                  <option value="">Select category (optional)</option>
                  <option value="Seeds & Fertilizers">Seeds & Fertilizers</option>
                  <option value="Pesticides & Crop Care">Pesticides & Crop Care</option>
                  <option value="Farm Equipment">Farm Equipment</option>
                  <option value="Grains / Produce Trading">Grains / Produce Trading</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          {/* Village */}
          <div>
            <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Gaon (Village) *</label>
            <input
              type="text"
              required
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Rampur"
              className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
            />
          </div>

          {/* City + State (auto-detected) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-50/90 mb-1">
                Sheher (City) *
                {gpsLoading && <Loader2 className="w-3 h-3 inline ml-1 animate-spin text-emerald-500" />}
                {gpsDone && !gpsLoading && <CheckCircle className="w-3 h-3 inline ml-1 text-emerald-500" />}
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lucknow"
                className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Rajya (State)</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Auto-detected"
                className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors [&>option]:text-slate-900"
              />
            </div>
          </div>

          {/* District + Pincode (auto-detected) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Zila (District)</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Auto-detected"
                className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors [&>option]:text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Auto-detected"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors [&>option]:text-slate-900"
              />
            </div>
          </div>

          {/* Address (optional) */}
          <div>
            <label className="block text-xs font-semibold text-emerald-50/90 mb-1">Pata (Address) <span className="text-emerald-100/60 font-normal">(Optional)</span></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address (optional)"
              className="w-full px-3 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-emerald-100/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:bg-white/15 transition-colors"
            />
          </div>

          {/* GPS Button */}
          <button
            type="button"
            onClick={() => {
              setGpsLoading(true);
              if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`);
                      const data = await res.json();
                      const addr = data.address || {};
                      setCity(addr.city || addr.town || addr.village || "");
                      setState(addr.state || "");
                      setDistrict(addr.district || addr.county || "");
                      setPincode(addr.postcode || "");
                      setGpsDone(true);
                    } catch {} finally {
                      setGpsLoading(false);
                    }
                  },
                  () => setGpsLoading(false),
                  { timeout: 8000 }
                );
              }
            }}
            className="w-full py-2 rounded-xl border border-emerald-300/40 bg-emerald-400/15 text-emerald-100 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400/25 transition-colors cursor-pointer"
          >
            {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {gpsDone ? "Location Refresh Karein" : "Apni Location Dhundhein (GPS)"}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-900/40 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Register ho raha hai...</span>
            ) : (
              <span>Register Karein</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/15">
          <p className="text-xs text-emerald-100/80">
            Pehle se account hai?{" "}
            <Link to="/login" className="text-emerald-300 font-semibold hover:text-emerald-200 hover:underline">
              Login karein
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
