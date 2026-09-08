import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, User, LogOut, ChevronDown, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelector from "../common/LanguageSelector";
import NotificationBell from "../common/NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* LEFT: Logo — AgriNexus */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">AgriNexus</span>
              <span className="block text-[9px] font-semibold text-slate-400 tracking-wider uppercase">Smart Agriculture</span>
            </div>
          </Link>

          {/* CENTER: All nav links — proper spacing between each, single line */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/dashboard" className="px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors">
              {t("dashboard")}
            </Link>
            <Link to="/analyze" className="px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors">
              {t("cropCheckup")}
            </Link>
            <Link to="/weather" className="px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors">
              {t("weather")}
            </Link>
            {user && (
              <Link to="/inventory" className="px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors">
                {t("fasalStock")}
              </Link>
            )}
            {/* Market Dropdown — all buying & selling in one place */}
            <div className="relative">
              <button
                onClick={() => { setMarketOpen(!marketOpen); setAiMenuOpen(false); setSettingsOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer"
              >
                <span>{t("marketMenu")}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {marketOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMarketOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 z-50 space-y-1">
                    <Link to="/mandi-prices" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-blue-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("mandiBhaav")}
                    </Link>
                    <Link to="/marketplace" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("kisaanBazaar")}
                    </Link>
                    <Link to="/supply-chain" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-violet-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("maalKhed")}
                    </Link>
                    <Link to="/products" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-amber-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("store")}
                    </Link>
                    <Link to="/dealers" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-teal-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("dealers")}
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* AI Seva Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setAiMenuOpen(!aiMenuOpen); setMarketOpen(false); setSettingsOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer"
              >
                <span>{t("aiSeva")}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {aiMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAiMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 z-50 space-y-1">
                    <Link to="/digital-twin" onClick={() => setAiMenuOpen(false)} className="block p-2.5 rounded-xl hover:bg-emerald-50 text-xs transition-colors"><span className="font-bold text-slate-900 block">{t("khetKaNaksha")}</span><span className="text-[11px] text-slate-500">{t("khetKaNakshaDesc")}</span></Link>
                    <Link to="/consensus-engine" onClick={() => setAiMenuOpen(false)} className="block p-2.5 rounded-xl hover:bg-violet-50 text-xs transition-colors"><span className="font-bold text-slate-900 block">{t("aiSalahkar")}</span><span className="text-[11px] text-slate-500">{t("aiSalahkarDesc")}</span></Link>
                    <Link to="/what-if-simulation" onClick={() => setAiMenuOpen(false)} className="block p-2.5 rounded-xl hover:bg-amber-50 text-xs transition-colors"><span className="font-bold text-slate-900 block">{t("kyaHogaAgar")}</span><span className="text-[11px] text-slate-500">{t("kyaHogaAgarDesc")}</span></Link>
                    <Link to="/agronomy-rag" onClick={() => setAiMenuOpen(false)} className="block p-2.5 rounded-xl hover:bg-teal-50 text-xs transition-colors"><span className="font-bold text-slate-900 block">{t("fasalSalah")}</span><span className="text-[11px] text-slate-500">{t("fasalSalahDesc")}</span></Link>
                    <Link to="/field-mapping" onClick={() => setAiMenuOpen(false)} className="block p-2.5 rounded-xl hover:bg-blue-50 text-xs transition-colors"><span className="font-bold text-slate-900 block">{t("khetKiNaksha")}</span><span className="text-[11px] text-slate-500">{t("khetKiNakshaDesc")}</span></Link>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* RIGHT: Language selector, notifications, login/profile */}
          <div className="flex items-center gap-2.5">
            {/* Settings Dropdown — language, alerts & account in one place */}
            <div className="relative">
              <button
                onClick={() => { setSettingsOpen(!settingsOpen); setAiMenuOpen(false); setMarketOpen(false); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors border border-slate-200 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t("settings")}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {settingsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 z-50 space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("language")}</span>
                      <LanguageSelector />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("alerts")}</span>
                      <NotificationBell />
                    </div>
                    <div className="border-t border-slate-100 my-1" />
                    {user ? (
                      <>
                        <Link to="/profile" onClick={() => setSettingsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-slate-800 transition-colors">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{user.name}</span>
                        </Link>
                        <button
                          onClick={() => { logout(); setSettingsOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-xs font-semibold text-slate-800 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t("logout")}</span>
                        </button>
                      </>
                    ) : (
                      <Link to="/login" onClick={() => setSettingsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-slate-800 transition-colors">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{t("login")}</span>
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
