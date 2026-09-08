import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Phone, Save, LogOut, Sprout, Edit3 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function FarmerProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [village, setVillage] = useState(user?.village || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [address, setAddress] = useState(user?.address || "");

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Sprout className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Login ki zarurat hai</h2>
          <p className="text-sm text-slate-500">Pehle login karein apna profile dekhne ke liye</p>
          <button onClick={() => navigate("/login")} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer">
            Login Karein
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile({ name, village, city, state, district, pincode, address });
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <User className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-xs text-slate-500 mt-1">Kisan Profile</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.city || "Location set nahi hai"}</span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Profile Details</h2>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${editing ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {editing ? <><Save className="w-3.5 h-3.5" /> Save</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Naam (Name)</label>
              {editing ? (
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              ) : (
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Mobile Number</label>
              <p className="text-sm font-semibold text-slate-900">{user.phone}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Gaon (Village)</label>
                {editing ? (
                  <input value={village} onChange={(e) => setVillage(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                ) : (
                  <p className="text-sm font-semibold text-slate-900">{user.village || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Sheher (City)</label>
                {editing ? (
                  <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                ) : (
                  <p className="text-sm font-semibold text-slate-900">{user.city || "—"}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Rajya (State)</label>
                {editing ? (
                  <input value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                ) : (
                  <p className="text-sm font-semibold text-slate-900">{user.state || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Zila (District)</label>
                {editing ? (
                  <input value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                ) : (
                  <p className="text-sm font-semibold text-slate-900">{user.district || "—"}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Pincode</label>
              {editing ? (
                <input value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              ) : (
                <p className="text-sm font-semibold text-slate-900">{user.pincode || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Pata (Address)</label>
              {editing ? (
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              ) : (
                <p className="text-sm font-semibold text-slate-900">{user.address || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Account Bana</label>
              <p className="text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-semibold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
