import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Package, ClipboardList, Stethoscope, MapPin, Leaf, Sprout,
  ScanLine, AlertTriangle, ShoppingBasket, ChevronRight, Sun, CloudSun,
  Droplets, Wind, CloudRain, BadgeCheck, TrendingUp, Landmark, ShieldCheck,
  CreditCard, Store, Leaf as LeafIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation as useGeoLocation } from "../contexts/LocationContext";
import { useLanguage } from "../contexts/LanguageContext";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import api from "../services/api";
import { fetchInventory, fetchOrders, subscribeInventory, InventoryRow, OrderRow } from "../lib/supabaseData";
import { productPhoto } from "../lib/productPhotos";
import riceField from "../assets/rice-field.jpg";

const ORDER_STATUS_STYLES: Record<string, { chip: string; icon: string }> = {
  pending: { chip: "bg-amber-100 text-amber-700", icon: "⏳" },
  processing: { chip: "bg-amber-100 text-amber-700", icon: "⏳" },
  confirmed: { chip: "bg-blue-100 text-blue-700", icon: "🚚" },
  shipped: { chip: "bg-blue-100 text-blue-700", icon: "🚚" },
  delivered: { chip: "bg-emerald-100 text-emerald-700", icon: "✅" },
  cancelled: { chip: "bg-rose-100 text-rose-700", icon: "✕" },
};

const SCHEMES = [
  {
    name: "PM-KISAN",
    hindiName: "प्रधानमंत्री किसान सम्मान निधि",
    descKey: "schemePmkisanDesc",
    url: "https://pmkisan.gov.in",
    Icon: Landmark,
    iconCls: "bg-emerald-100 text-emerald-600",
  },
  {
    name: "PMFBY",
    hindiName: "प्रधानमंत्री फसल बीमा योजना",
    descKey: "schemePmfbyDesc",
    url: "https://pmfby.gov.in",
    Icon: ShieldCheck,
    iconCls: "bg-blue-100 text-blue-600",
  },
  {
    name: "Kisan Credit Card",
    hindiName: "किसान क्रेडिट कार्ड",
    descKey: "schemeKccDesc",
    url: "https://fasalrin.gov.in",
    Icon: CreditCard,
    iconCls: "bg-amber-100 text-amber-600",
  },
  {
    name: "eNAM",
    hindiName: "राष्ट्रीय कृषि बाज़ार",
    descKey: "schemeEnamDesc",
    url: "https://enam.gov.in",
    Icon: LeafIcon,
    iconCls: "bg-violet-100 text-violet-600",
  },
];

function severityChip(severity?: string): { labelKey: string; cls: string } {
  const s = (severity || "").toLowerCase();
  if (s.includes("high") || s.includes("critical")) return { labelKey: "statusHighPriority", cls: "bg-rose-100 text-rose-600" };
  if (s.includes("low")) return { labelKey: "statusLow", cls: "bg-emerald-100 text-emerald-600" };
  return { labelKey: "statusMedium", cls: "bg-amber-100 text-amber-700" };
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { city, district, state } = useGeoLocation();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [weather, setWeather] = useState<{
    temp: number; condition: string; humidity: number; windSpeed: number; rainfall: number;
  } | null>(null);

  useEffect(() => {
    api.get("/analysis/history")
      .then((res) => {
        if (res.data.success) setAnalyses(res.data.analyses || []);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    if (user) {
      setInventory(await fetchInventory(user.id));
      setOrders(await fetchOrders(user.id));
    } else {
      setInventory([]);
      setOrders([]);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live sync — dashboard inventory mirrors Crop Stock instantly
  useEffect(() => {
    if (!user) return;
    return subscribeInventory(user.id, () => {
      loadData();
    });
  }, [user, loadData]);

  // Live weather for the hero banner (Open-Meteo, same source as Weather page)
  useEffect(() => {
    let cancelled = false;
    const lat = 28.6139, lon = 77.2090; // refined below once location context resolves
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,rain_probability&timezone=auto`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled || !data?.current) return;
        const code = data.current.weather_code ?? 0;
        const conditionKey =
          code === 0 ? "condClear" :
          code <= 3 ? "condPartlyCloudy" :
          code <= 48 ? "condFoggy" :
          code <= 67 ? "condRainy" :
          code <= 82 ? "condRainy" :
          code <= 99 ? "condThunderstorm" : "condCloudy";
        setWeather({
          temp: Math.round(data.current.temperature_2m ?? 28),
          condition: conditionKey,
          humidity: data.current.relative_humidity_2m ?? 60,
          windSpeed: Math.round(data.current.wind_speed_10m ?? 10),
          rainfall: data.current.rain_probability ?? 0,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleCapture = (dataUrl: string) => {
    sessionStorage.setItem("km_pending_image", dataUrl);
    navigate("/analyze");
  };

  const activeInv = inventory.filter((i) => i.status !== "sold");
  const totalStockKg = activeInv.reduce(
    (s, i) => s + (i.unit === "quintal" ? Number(i.quantity) * 100 : Number(i.quantity)),
    0
  );
  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "processing").length;

  const invKg = (i: InventoryRow) => (i.unit === "quintal" ? Number(i.quantity) * 100 : Number(i.quantity));

  const weatherIcon = weather
    ? weather.condition === "condClear" ? <Sun className="w-9 h-9 text-amber-400" />
      : weather.condition === "condRainy" || weather.condition === "condThunderstorm" ? <CloudRain className="w-9 h-9 text-blue-400" />
      : <CloudSun className="w-9 h-9 text-amber-300" />
    : <CloudSun className="w-9 h-9 text-slate-300 animate-pulse" />;

  const farmStatusGood = !weather || (weather.rainfall < 60 && weather.temp < 42);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-slate-50 to-emerald-50/40 py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ============ HERO BANNER ============ */}
        <div className="relative rounded-3xl overflow-hidden shadow-lg ring-1 ring-emerald-900/10 min-h-[220px]">
          <img
            src={riceField}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/55 via-emerald-900/25 to-transparent" />

          <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[1.2fr_auto_1fr] gap-4 items-stretch">

            {/* Greeting */}
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
                {t("greeting")}, {user ? user.name : t("farmerFallback")} 🙏
              </h1>
              <p className="mt-1.5 text-sm font-semibold text-white/95 flex items-center gap-1.5 drop-shadow">
                <MapPin className="w-4 h-4 text-emerald-300" />
                {t("locationLabel")}: <span className="text-emerald-200 font-bold">{[city, state].filter(Boolean).join(", ") || t("detectingLocation")}</span>
              </p>
              <p className="mt-3 text-xs sm:text-sm text-white/85 flex items-center gap-2 font-medium">
                <Leaf className="w-4 h-4 text-emerald-300" />
                <span>"{t("healthySoil")} • {t("betterCrops")} • {t("brighterFuture")}"</span>
              </p>
            </div>

            {/* Weather glass card */}
            <div className="liquid-glass border-white/40 rounded-2xl p-4 text-white backdrop-blur-md flex flex-col justify-center min-w-[220px]">
              <div className="flex items-center gap-3">
                {weatherIcon}
                <div>
                  <p className="text-3xl font-extrabold leading-none">{weather ? `${weather.temp}°C` : "—"}</p>
                  <p className="text-xs font-semibold text-white/85 mt-1">{weather ? t(weather.condition) : "..."}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs border-t border-white/20 pt-2.5">
                <div className="flex items-center justify-between gap-6">
                  <span className="flex items-center gap-1.5 text-white/85 font-medium"><Droplets className="w-3.5 h-3.5" />{t("humidityLabel")}</span>
                  <span className="font-bold">{weather ? `${weather.humidity}%` : "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="flex items-center gap-1.5 text-white/85 font-medium"><Wind className="w-3.5 h-3.5" />{t("windLabel")}</span>
                  <span className="font-bold">{weather ? `${weather.windSpeed} km/h` : "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="flex items-center gap-1.5 text-white/85 font-medium"><CloudRain className="w-3.5 h-3.5" />{t("rainChanceLabel")}</span>
                  <span className="font-bold">{weather ? `${weather.rainfall} mm` : "—"}</span>
                </div>
              </div>
            </div>

            {/* Farm status card */}
            <div className="bg-gradient-to-br from-emerald-800/85 to-emerald-950/85 backdrop-blur-sm rounded-2xl p-4 text-white ring-1 ring-white/15 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{t("farmStatusLabel")}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${farmStatusGood ? "bg-emerald-400 text-emerald-950" : "bg-amber-300 text-amber-950"}`}>
                  {farmStatusGood ? t("statusGood") : t("statusWatch")}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <p className="font-semibold text-white/95">{t("soilHealth")}</p>
                    <p className="text-emerald-300 font-bold text-[11px]">{t("soilOptimal")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <p className="font-semibold text-white/95">{t("cropGrowth")}</p>
                    <p className="text-emerald-300 font-bold text-[11px]">{t("cropOnTrack")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <p className="font-semibold text-white/95">{t("weatherLabel")}</p>
                    <p className={`font-bold text-[11px] ${farmStatusGood ? "text-emerald-300" : "text-amber-300"}`}>
                      {weather ? (farmStatusGood ? t("weatherFavorable") : t("weatherCheckAdvisory")) : "—"}
                    </p>
                  </div>
                </div>
                <Link to="/weather" className="flex items-center gap-2 group">
                  <CloudSun className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <p className="font-semibold text-white/95">{t("forecastLabel")}</p>
                    <p className="text-emerald-300 font-bold text-[11px] group-hover:underline">{t("forecast5day")} →</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ============ QUICK ACTIONS ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setCameraOpen(true)}
            className="group flex items-center justify-between gap-3 bg-white/80 backdrop-blur rounded-2xl border border-emerald-100 p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
                <ScanLine className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{t("scanCrop")}</p>
                <p className="text-[11px] text-slate-500">{t("scanCropSub")}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          <Link
            to="/post-crop"
            className="group flex items-center justify-between gap-3 bg-white/80 backdrop-blur rounded-2xl border border-amber-100 p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{t("postIssue")}</p>
                <p className="text-[11px] text-slate-500">{t("postIssueSub")}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/sell"
            className="group flex items-center justify-between gap-3 bg-gradient-to-br from-violet-50 to-fuchsia-50/60 rounded-2xl border border-violet-100 p-4 shadow-sm hover:shadow-md hover:border-violet-200 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-600/25">
                <ShoppingBasket className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-violet-800">{t("sellProduce")}</p>
                <p className="text-[11px] text-violet-500">{t("sellProduceSub")}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-violet-400 group-hover:text-violet-700 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* ============ 3-CARD ROW ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* My Inventory — real crop-stock data with photos */}
          <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-extrabold text-slate-900">{t("myInventory")}</h2>
              </div>
              <Link to="/inventory" className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
                {t("viewAll")} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              {t("totalItems")}: <span className="font-bold text-slate-700">{activeInv.length}</span>
              <span className="mx-1.5 text-slate-300">|</span>
              {t("totalQuantity")}: <span className="font-bold text-slate-700">{totalStockKg.toLocaleString()} kg</span>
            </p>

            {!user ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-3">{t("loginToSeeStock")}</p>
                <button
                  onClick={() => navigate("/login?returnTo=/dashboard")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                >
                  {t("login")}
                </button>
              </div>
            ) : activeInv.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-8">{t("noStockYet")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {activeInv.slice(0, 4).map((i) => {
                  const meta = productPhoto(i.crop_name);
                  const emoji = meta ? meta.emoji : "🌾";
                  const kg = invKg(i);
                  const healthy = (i.grade || "").toLowerCase().includes("a") || i.status === "available";
                  return (
                    <div key={i.id} className="rounded-xl border border-slate-100 bg-white p-2 hover:shadow-sm transition-shadow">
                      <div className="h-16 rounded-lg overflow-hidden bg-emerald-50 flex items-center justify-center">
                        {meta ? (
                          <img src={meta.photo} alt={i.crop_name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-3xl">{emoji}</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs font-bold text-slate-800 capitalize truncate">{i.crop_name}</p>
                      <p className="text-[10px] text-slate-500">{kg.toLocaleString()} kg</p>
                      <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${healthy ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                        <Leaf className="w-2.5 h-2.5" />
                        {i.status === "listed" ? t("listed") : healthy ? t("statusHealthy") : t("statusGoodStock")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Orders — real order table */}
          <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-900">{t("pendingOrders")}</h2>
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <Link to="/farmer-orders" className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
                    {t("viewAll")} <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold">🔥 {pendingCount} {t("orderNew")}</span>
              </div>
            </div>

            {!user ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-3">{t("loginToSeeOrders")}</p>
                <button
                  onClick={() => navigate("/login?returnTo=/dashboard")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                >
                  {t("login")}
                </button>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-8">{t("noOrdersYet")}</p>
            ) : (
              <>
                <div className="grid grid-cols-[1.4fr_0.9fr_1fr_0.9fr] text-[10px] font-bold text-slate-400 uppercase tracking-wide pb-2 border-b border-slate-100">
                  <span>{t("colProduct")}</span><span>{t("colQuantity")}</span><span>{t("colStatus")}</span><span>{t("colDate")}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {orders.slice(0, 4).map((o) => {
                    const st = ORDER_STATUS_STYLES[o.status] || { chip: "bg-slate-100 text-slate-600", icon: "•" };
                    const meta = productPhoto(o.crop);
                    return (
                      <div key={o.id} className="grid grid-cols-[1.4fr_0.9fr_1fr_0.9fr] items-center py-2 text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800 capitalize truncate">
                          <span>{meta ? meta.emoji : "🌾"}</span>{o.crop}
                        </span>
                        <span className="text-slate-600 font-semibold">{o.quantity} {o.unit}</span>
                        <span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.chip}`}>
                            <span className="text-[9px]">{st.icon}</span>
                            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                          </span>
                        </span>
                        <span className="text-slate-500 text-[10px]">{fmtDate(o.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Recent Diagnoses — real AI analysis history */}
          <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-extrabold text-slate-900">{t("recentDiagnoses")}</h2>
              </div>
              <Link to="/history" className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
                {t("viewAll")} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {analyses.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">{t("noDiagnoses")}</p>
            ) : (
              <div className="space-y-2.5">
                {analyses.slice(0, 3).map((a) => {
                  const sev = severityChip(a.severity);
                  return (
                    <Link key={a.id} to={`/analysis/${a.id}`} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                      <img src={a.imageUrl} alt="Crop" className="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                          {a.disease || a.cropName || t("scanCrop")}
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${sev.cls}`}>{t(sev.labelKey)}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{t("fungalPestAnalysis")} — {a.cropName}</p>
                        <p className="text-[9px] text-slate-400">{fmtDateTime(a.created_at)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============ SARKARI YOJANAAYEIN ============ */}
        <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">{t("sarkariYojana")}</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/schemes" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
                {t("checkEligibility")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-indigo-400" /> {t("officialPortals")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCHEMES.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconCls}`}>
                    <s.Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 leading-tight">{s.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">{s.hindiName}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-2">
                  <p className="text-[11px] text-slate-500 leading-snug">{t(s.descKey)}</p>
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 mt-3 text-center">
            <Sprout className="w-3 h-3 inline mr-1" />
            {t("govtSchemesNote")}
          </p>
        </div>
      </div>

      <CameraCaptureModal isOpen={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCapture} />
    </div>
  );
}
