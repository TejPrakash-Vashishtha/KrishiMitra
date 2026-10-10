import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Camera, Activity, Sparkles, Menu, X, ChevronRight,
  User, LogOut, Settings as SettingsIcon, Bell, Store, IndianRupee,
  Tractor, BrainCircuit, FlaskConical, Satellite, Map as MapIcon,
  SlidersHorizontal, ShoppingCart, GraduationCap, MessageCircle, Boxes,
  Package, Handshake, Crown, Landmark, Download, Loader2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelector from "../common/LanguageSelector";
import NotificationBell from "../common/NotificationBell";

/**
 * Mobile navigation — mirrors the desktop Navbar exactly.
 * Bottom bar = 4 most-used tabs + "More", which opens a full-screen sheet
 * containing EVERY destination the desktop nav offers, grouped the same way
 * (Market, AI Seva, Settings) with the same items, labels and icons.
 */

interface MenuItem {
  to: string;
  label: string;
  desc?: string;
  icon: React.ReactNode;
  hoverBg: string;
}

export default function MobileNav() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false); // "More" sheet
  const [marketOpen, setMarketOpen] = useState(false); // "Market" sheet

  // Close sheets on navigation
  useEffect(() => { setOpen(false); setMarketOpen(false); }, [pathname]);

  // Android app download — same GitHub-release-first logic as the desktop pill
  const [apkBusy, setApkBusy] = useState(false);
  const handleApkDownload = async () => {
    if (apkBusy) return;
    setApkBusy(true);
    let url = "/downloads/KrishiMitra.apk";
    try {
      const res = await fetch(
        "https://api.github.com/repos/Amanyadavv007/KrishiMitra/releases/latest",
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (res.ok) {
        const rel = await res.json();
        const asset = (rel.assets || []).find((a: { name: string }) => /\.apk$/i.test(a.name));
        if (asset?.browser_download_url) url = asset.browser_download_url;
      }
    } catch { /* offline or rate-limited -> bundled fallback */ }
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = url;
    document.body.appendChild(frame);
    setTimeout(() => frame.remove(), 60_000);
    setApkBusy(false);
  };

  // Lock body scroll while a sheet is open
  useEffect(() => {
    document.body.style.overflow = open || marketOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, marketOpen]);

  // Bottom bar: Dashboard · Doctor · Market (sheet) · Twin · More
  const topTabs: { to?: string; market?: boolean; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/analyze", icon: Camera, label: t("cropCheckup") },
    { market: true, icon: Store, label: t("marketMenu") },
    { to: "/digital-twin", icon: Sparkles, label: t("khetKaNaksha") },
  ];

  const marketItems: MenuItem[] = [
    { to: "/mandi-prices", label: t("mandiBhaav"), icon: <IndianRupee className="w-[18px] h-[18px] text-blue-600" />, hoverBg: "hover:bg-blue-50" },
    { to: "/marketplace", label: t("kisaanBazaar"), icon: <Store className="w-[18px] h-[18px] text-emerald-600" />, hoverBg: "hover:bg-emerald-50" },
    { to: "/supply-chain", label: t("maalKhed"), icon: <Boxes className="w-[18px] h-[18px] text-violet-600" />, hoverBg: "hover:bg-violet-50" },
    { to: "/customer", label: t("customerBazaar"), icon: <Handshake className="w-[18px] h-[18px] text-fuchsia-600" />, hoverBg: "hover:bg-fuchsia-50" },
    { to: "/products", label: t("store"), icon: <Package className="w-[18px] h-[18px] text-amber-600" />, hoverBg: "hover:bg-amber-50" },
    { to: "/dealers", label: t("dealers"), icon: <Tractor className="w-[18px] h-[18px] text-teal-600" />, hoverBg: "hover:bg-teal-50" },
  ];

  const aiItems: MenuItem[] = [
    { to: "/digital-twin", label: t("khetKaNaksha"), desc: t("khetKaNakshaDesc"), icon: <Activity className="w-[18px] h-[18px] text-emerald-600" />, hoverBg: "hover:bg-emerald-50" },
    { to: "/consensus-engine", label: t("aiSalahkar"), desc: t("aiSalahkarDesc"), icon: <BrainCircuit className="w-[18px] h-[18px] text-violet-600" />, hoverBg: "hover:bg-violet-50" },
    { to: "/what-if-simulation", label: t("kyaHogaAgar"), desc: t("kyaHogaAgarDesc"), icon: <SlidersHorizontal className="w-[18px] h-[18px] text-amber-600" />, hoverBg: "hover:bg-amber-50" },
    { to: "/agronomy-rag", label: t("fasalSalah"), desc: t("fasalSalahDesc"), icon: <FlaskConical className="w-[18px] h-[18px] text-teal-600" />, hoverBg: "hover:bg-teal-50" },
    { to: "/field-mapping", label: t("khetKiNaksha"), desc: t("khetKiNakshaDesc"), icon: <MapIcon className="w-[18px] h-[18px] text-blue-600" />, hoverBg: "hover:bg-blue-50" },
  ];

  const quickLinks: MenuItem[] = [
    { to: "/schemes", label: t("sarkariYojana"), icon: <Landmark className="w-[18px] h-[18px] text-indigo-600" />, hoverBg: "hover:bg-indigo-50" },
    { to: "/weather", label: t("weather"), icon: <Activity className="w-[18px] h-[18px] text-sky-600" />, hoverBg: "hover:bg-sky-50" },
    { to: "/inventory", label: t("fasalStock"), icon: <Boxes className="w-[18px] h-[18px] text-emerald-600" />, hoverBg: "hover:bg-emerald-50" },
    { to: "/assistant", label: t("aiAssistant"), icon: <MessageCircle className="w-[18px] h-[18px] text-sky-600" />, hoverBg: "hover:bg-sky-50" },
    { to: "/learn", label: t("fasalSalah"), icon: <GraduationCap className="w-[18px] h-[18px] text-violet-600" />, hoverBg: "hover:bg-violet-50" },
    { to: "/history", label: t("myCropHistory"), icon: <Camera className="w-[18px] h-[18px] text-slate-600" />, hoverBg: "hover:bg-slate-100" },
    { to: "/chat", label: t("chatBtn"), icon: <MessageCircle className="w-[18px] h-[18px] text-emerald-600" />, hoverBg: "hover:bg-emerald-50" },
  ];

  return (
    <>
      {/* ---------- Bottom tab bar ---------- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-white/60 px-1 py-1.5 safe-bottom flex items-center justify-around shadow-lg supports-[backdrop-filter]:bg-white/80">
        {topTabs.map((tab) => {
          if (tab.market) {
            const isActive = marketItems.some((i) => i.to === pathname);
            return (
              <button
                key="market"
                onClick={() => setMarketOpen(true)}
                className={`flex flex-col items-center py-1 px-2 rounded-xl active:scale-90 transition-all duration-150 cursor-pointer ${
                  isActive || marketOpen ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-700"
                }`}
                aria-label={tab.label}
              >
                <tab.icon className={`w-5 h-5 transition-transform ${isActive || marketOpen ? "text-emerald-600 scale-110" : "text-slate-400"}`} />
                <span className="text-[9px] mt-0.5 max-w-[64px] truncate">{tab.label}</span>
              </button>
            );
          }
          const isActive = pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to!}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`flex flex-col items-center py-1 px-2 rounded-xl active:scale-90 transition-all duration-150 ${
                isActive ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-transform ${isActive ? "text-emerald-600 scale-110" : "text-slate-400"}`} />
              <span className="text-[9px] mt-0.5 max-w-[64px] truncate">{tab.label}</span>
            </Link>
          );
        })}
        {/* More button — opens the full menu sheet */}
        <button
          onClick={() => setOpen(true)}
          className={`flex flex-col items-center py-1 px-2 rounded-xl active:scale-90 transition-all duration-150 cursor-pointer ${
            open ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-700"
          }`}
          aria-label="More menu"
        >
          <Menu className={`w-5 h-5 transition-transform ${open ? "text-emerald-600 scale-110" : "text-slate-400"}`} />
          <span className="text-[9px] mt-0.5">More</span>
        </button>
      </div>

      {/* ---------- Market sheet (from the bottom-bar Market tab) ---------- */}
      {marketOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMarketOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-extrabold text-slate-900">{t("marketMenu")}</span>
              </div>
              <button
                onClick={() => setMarketOpen(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
                aria-label="Close market menu"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="px-3 py-3 pb-8 space-y-1">
              {marketItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold text-slate-800 transition-colors ${item.hoverBg}`}
                >
                  <span className="flex items-center gap-3">{item.icon}{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Full-screen menu sheet (mirrors desktop navbar) ---------- */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] bg-white rounded-t-3xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-extrabold text-slate-900">All Features</span>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Scrollable groups — same order/groups as the desktop navbar */}
            <div className="overflow-y-auto px-4 py-3 space-y-4 pb-8">
              {/* KrishiMitra Pro — subscription CTA (desktop navbar shows it next to Settings) */}
              <Link
                to="/subscription"
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-500/25"
              >
                <span className="flex items-center gap-2.5">
                  <Crown className="w-[18px] h-[18px] text-amber-300" />
                  <span>
                    <span className="block text-sm font-extrabold">{t("subscribePro")}</span>
                    <span className="block text-[10px] text-emerald-100">{t("subscribeDesc")}</span>
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-emerald-100" />
              </Link>

              {/* Android app download — mirrors the desktop navbar Download App pill */}
              <button
                onClick={handleApkDownload}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800"
              >
                <span className="flex items-center gap-2.5">
                  <Download className="w-[18px] h-[18px] text-emerald-600" />
                  <span className="text-sm font-bold">Download Android App</span>
                </span>
                {apkBusy ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-emerald-500" />}
              </button>

              {/* Direct links (desktop top-level) */}
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 text-xs font-semibold text-slate-800 transition-colors ${item.hoverBg}`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Market group */}
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                  <ShoppingCart className="w-3 h-3" /> {t("marketMenu")}
                </p>
                <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
                  {marketItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-800 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${item.hoverBg}`}
                    >
                      <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* AI Seva group */}
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                  <Sparkles className="w-3 h-3" /> {t("aiSeva")}
                </p>
                <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
                  {aiItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center justify-between px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${item.hoverBg}`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        {item.icon}
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-slate-900 truncate">{item.label}</span>
                          {item.desc && <span className="block text-[10px] text-slate-500 truncate">{item.desc}</span>}
                        </span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Settings group — same contents as the desktop settings dropdown */}
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                  <SettingsIcon className="w-3 h-3" /> {t("settings")}
                </p>
                <div className="rounded-2xl border border-slate-100 px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("language")}</span>
                    <LanguageSelector />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Bell className="w-3 h-3" /> {t("alerts")}
                    </span>
                    <NotificationBell />
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-1">
                    {user ? (
                      <>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-1 py-2 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{user.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                        </Link>
                        <button
                          onClick={() => { logout(); setOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-1 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:text-red-600 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t("logout")}
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        <User className="w-4 h-4" />
                        {t("login")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
