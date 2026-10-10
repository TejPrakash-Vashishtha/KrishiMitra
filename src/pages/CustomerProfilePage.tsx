import React, { useState } from "react";
import { User, MapPin, Save, CheckCircle2, Phone } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Customer Profile (/shop/profile) — Phase 6.
 * Editable name/phone/address saved to the farmers table via
 * AuthContext.updateProfile (already persists to Supabase).
 */
export default function CustomerProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [village, setVillage] = useState(user?.village || "");
  const [city, setCity] = useState(user?.city || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await updateProfile({ name: name.trim(), phone: phone.trim(), address: address.trim(), village: village.trim(), city: city.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2 mb-5">
          <User className="w-6 h-6 text-amber-600" /> My Profile
        </h1>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          {/* Avatar header */}
          <div className="flex items-center gap-4 pb-5 mb-5 border-b border-slate-100">
            <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white text-2xl font-bold flex items-center justify-center shadow-md shadow-amber-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </span>
            <div>
              <p className="text-lg font-extrabold text-slate-900">{user?.name || "Customer"}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {user?.phone || "—"}
              </p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                CUSTOMER ACCOUNT
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" /> Delivery Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, street, landmark, pincode"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Village</label>
                <input value={village} onChange={(e) => setVillage(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
