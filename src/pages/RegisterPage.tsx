import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, AlertCircle, MapPin, Navigation, Loader2, CheckCircle, Store } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const asMerchant = new URLSearchParams(window.location.search).get("as") === "merchant";
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
        role: asMerchant ? "DEALER" : "FARMER",
        shopName: asMerchant ? shopName.trim() : undefined,
        shopCategory: asMerchant ? shopCategory : undefined,
      });

      if (result.success) {
        navigate(asMerchant ? "/merchant" : "/dashboard");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch {
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <Sprout className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Naya Account Banayein</h1>
          <p className="text-xs text-slate-500 mt-1">AgriNexus par register karein</p>
          <span
            className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
              asMerchant
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {asMerchant ? <Store className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
            {asMerchant ? "REGISTERING AS MERCHANT" : "REGISTERING AS FARMER"}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Aapka Naam (Full Name) *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
            <div className="flex">
              <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-sm text-slate-500">+91</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                maxLength={10}
                className="w-full px-3 py-2.5 rounded-r-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* PIN + Confirm PIN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Create PIN *</label>
              <input
                type="password"
                required
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="4-6 digits"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Ye PIN har login par use hoga</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm PIN *</label>
              <input
                type="password"
                required
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Confirm PIN"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Merchant shop details */}
          {asMerchant && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dukaan Ka Naam (Shop Name)</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sharma Seed & Fertilizer Store"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Category</label>
                <select
                  value={shopCategory}
                  onChange={(e) => setShopCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gaon (Village) *</label>
            <input
              type="text"
              required
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Rampur"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* City + State (auto-detected) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rajya (State)</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Auto-detected"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* District + Pincode (auto-detected) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zila (District)</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Auto-detected"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Auto-detected"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Address (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pata (Address) <span className="text-slate-400 font-normal">(Optional)</span></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address (optional)"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="w-full py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {gpsDone ? "Location Refresh Karein" : "Apni Location Dhundhein (GPS)"}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Register ho raha hai...</span>
            ) : (
              <span>Register Karein</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Pehle se account hai?{" "}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Login karein
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
