import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sprout, User, LogOut, ChevronDown, Settings, Home, Leaf, CloudSun, BarChart3, Sparkles } from "lucide-react";
import AppDownloadButton from "../common/AppDownloadButton";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelector from "../common/LanguageSelector";
import NotificationBell from "../common/NotificationBell";

const MARKET_PATHS = ["/mandi-prices", "/process", "/marketplace", "/supply-chain", "/customer", "/products", "/dealers"];
const AI_PATHS = ["/digital-twin", "/consensus-engine", "/what-if-simulation", "/agronomy-rag", "/field-mapping"];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNavClick = (targetPath: string, e: React.MouseEvent) => {
    if (pathname === targetPath) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const linkCls = (active: boolean) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
      active
        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
        : "text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-xs supports-[backdrop-filter]:bg-white/75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* LEFT: AgriNexus with Hindi tagline */}
          <Link
            to="/"
            onClick={(e) => handleNavClick("/", e)}
            className="flex items-center gap-2.5 shrink-0 active:scale-95 transition-transform duration-150"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">{t("brandName")}</span>
              <span className="block text-[10px] font-semibold text-emerald-600 mt-0.5 leading-none">समृद्ध खेती, समृद्ध किसान</span>
            </div>
          </Link>

          {/* CENTER: pill nav — Dashboard, Crop Checkup, Weather, Market, AI Services */}
          <nav className="hidden lg:flex items-center gap-1 bg-white rounded-full border border-slate-200/90 shadow-xs px-2 py-1.5">
            <Link
              to="/dashboard"
              onClick={(e) => handleNavClick("/dashboard", e)}
              className={linkCls(pathname === "/dashboard")}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t("dashboard")}</span>
            </Link>
            <Link
              to="/analyze"
              onClick={(e) => handleNavClick("/analyze", e)}
              className={linkCls(pathname === "/analyze" || pathname.startsWith("/history"))}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>{t("cropCheckup")}</span>
            </Link>
            <Link
              to="/weather"
              onClick={(e) => handleNavClick("/weather", e)}
              className={linkCls(pathname === "/weather")}
            >
              <CloudSun className="w-3.5 h-3.5" />
              <span>{t("weather")}</span>
            </Link>

            {/* Market Dropdown — all buying & selling in one place */}
            <div className="relative">
              <button
                onClick={() => { setMarketOpen(!marketOpen); setAiMenuOpen(false); setSettingsOpen(false); }}
                className={linkCls(MARKET_PATHS.some((p) => pathname.startsWith(p)))}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t("marketMenu")}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${marketOpen ? "rotate-180" : ""}`} />
              </button>

              {marketOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMarketOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 z-50 space-y-1">
                    <Link to="/mandi-prices" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-blue-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("mandiBhaav")}
                    </Link>
                    <Link to="/process" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-amber-50 text-xs font-semibold text-slate-800 transition-colors">
                      🏭 {t("farmToProduct")}
                    </Link>
                    <Link to="/marketplace" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("kisaanBazaar")}
                    </Link>
                    <Link to="/supply-chain" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-violet-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("maalKhed")}
                    </Link>
                    <Link to="/customer" onClick={() => setMarketOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-fuchsia-50 text-xs font-semibold text-slate-800 transition-colors">
                      {t("customerBazaar")}
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
                className={linkCls(AI_PATHS.some((p) => pathname.startsWith(p)))}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("aiSeva")}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${aiMenuOpen ? "rotate-180" : ""}`} />
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

          {/* RIGHT: subscription CTA + Notification Bell + Settings dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Notification Bell for instant alert access */}
            <NotificationBell />

            {/* KrishiMitra Pro — subscription CTA next to Settings */}
            <Link
              to="/subscription"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{t("subscribe")}</span>
            </Link>

            {/* Android app download */}
            <AppDownloadButton />

            {/* Settings Dropdown — language, alerts & account in one place */}
            <div className="relative">
              <button
                onClick={() => { setSettingsOpen(!settingsOpen); setAiMenuOpen(false); setMarketOpen(false); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border border-slate-200/90 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t("settings")}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
              </button>

              {settingsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 z-50 space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("language")}</span>
                      <LanguageSelector />
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
