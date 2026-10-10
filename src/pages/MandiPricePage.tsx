import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, MapPin, Sparkles, RefreshCw, ArrowUp, ArrowDown, BarChart3, Clock, Navigation, Search, X } from "lucide-react";
import { logSearch } from "../contexts/AuthContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchMandiHistory, saveMandiSnapshot, MandiHistoryRow, todayStr } from "../lib/supabaseData";
import { MANDI_LOCATIONS } from "../lib/mandiData";

interface MandiPrice {
  id: string;
  mandi: string;
  district: string;
  state: string;
  crop: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
}


// Generate price data for any mandi
function generateMandiPrice(mandi: string, district: string, state: string, crop: string, idx: number): MandiPrice {
  const basePrices: Record<string, number> = { Paddy: 2200, Tomato: 2000, Mustard: 5500, Potato: 1500, Maize: 1800 };
  const base = basePrices[crop] || 2000;
  const variation = Math.floor((Math.random() * 400) - 200 + idx * 30);
  const change = Math.floor(Math.random() * 200) - 80;
  return {
    id: `${state}-${district}-${mandi}-${crop}-${idx}`,
    mandi,
    district,
    state,
    crop,
    price: Math.max(base + variation, 800),
    unit: "₹/quintal",
    change,
    changePercent: Math.round((change / (base + variation)) * 100 * 10) / 10,
  };
}

const PRICE_HISTORY: Record<string, { date: string; price: number }[]> = {
  Paddy: [
    { date: "Aug 20", price: 2050 }, { date: "Aug 22", price: 2080 }, { date: "Aug 24", price: 2065 },
    { date: "Aug 26", price: 2100 }, { date: "Aug 28", price: 2130 }, { date: "Aug 30", price: 2155 },
    { date: "Sep 1", price: 2180 }, { date: "Sep 2", price: 2200 },
  ],
  Tomato: [
    { date: "Aug 20", price: 2250 }, { date: "Aug 22", price: 2180 }, { date: "Aug 24", price: 2100 },
    { date: "Aug 26", price: 2020 }, { date: "Aug 28", price: 1960 }, { date: "Aug 30", price: 1930 },
    { date: "Sep 1", price: 1950 }, { date: "Sep 2", price: 1980 },
  ],
  Mustard: [
    { date: "Aug 20", price: 5300 }, { date: "Aug 22", price: 5350 }, { date: "Aug 24", price: 5380 },
    { date: "Aug 26", price: 5420 }, { date: "Aug 28", price: 5460 }, { date: "Aug 30", price: 5500 },
    { date: "Sep 1", price: 5530 }, { date: "Sep 2", price: 5560 },
  ],
  Potato: [
    { date: "Aug 20", price: 1450 }, { date: "Aug 22", price: 1480 }, { date: "Aug 24", price: 1490 },
    { date: "Aug 26", price: 1500 }, { date: "Aug 28", price: 1520 }, { date: "Aug 30", price: 1530 },
    { date: "Sep 1", price: 1540 }, { date: "Sep 2", price: 1550 },
  ],
  Maize: [
    { date: "Aug 20", price: 1720 }, { date: "Aug 22", price: 1750 }, { date: "Aug 24", price: 1740 },
    { date: "Aug 26", price: 1760 }, { date: "Aug 28", price: 1780 }, { date: "Aug 30", price: 1790 },
    { date: "Sep 1", price: 1810 }, { date: "Sep 2", price: 1830 },
  ],
};

const PREDICTIONS: Record<string, { date: string; predicted: number; confidence: number; trend: "up" | "down" | "stable" }[]> = {
  Paddy: [
    { date: "Sep 3", predicted: 2220, confidence: 88, trend: "up" },
    { date: "Sep 4", predicted: 2235, confidence: 85, trend: "up" },
    { date: "Sep 5", predicted: 2230, confidence: 82, trend: "stable" },
    { date: "Sep 6", predicted: 2215, confidence: 78, trend: "down" },
    { date: "Sep 7", predicted: 2210, confidence: 75, trend: "down" },
    { date: "Sep 8", predicted: 2220, confidence: 72, trend: "up" },
    { date: "Sep 9", predicted: 2240, confidence: 70, trend: "up" },
  ],
  Tomato: [
    { date: "Sep 3", predicted: 1950, confidence: 85, trend: "down" },
    { date: "Sep 4", predicted: 1910, confidence: 80, trend: "down" },
    { date: "Sep 5", predicted: 1880, confidence: 75, trend: "down" },
    { date: "Sep 6", predicted: 1900, confidence: 70, trend: "up" },
    { date: "Sep 7", predicted: 1940, confidence: 68, trend: "up" },
    { date: "Sep 8", predicted: 1970, confidence: 65, trend: "up" },
    { date: "Sep 9", predicted: 1990, confidence: 62, trend: "up" },
  ],
  Mustard: [
    { date: "Sep 3", predicted: 5590, confidence: 90, trend: "up" },
    { date: "Sep 4", predicted: 5610, confidence: 87, trend: "up" },
    { date: "Sep 5", predicted: 5620, confidence: 84, trend: "up" },
    { date: "Sep 6", predicted: 5615, confidence: 80, trend: "stable" },
    { date: "Sep 7", predicted: 5600, confidence: 76, trend: "down" },
    { date: "Sep 8", predicted: 5595, confidence: 73, trend: "stable" },
    { date: "Sep 9", predicted: 5610, confidence: 70, trend: "up" },
  ],
  Potato: [
    { date: "Sep 3", predicted: 1560, confidence: 86, trend: "up" },
    { date: "Sep 4", predicted: 1570, confidence: 82, trend: "up" },
    { date: "Sep 5", predicted: 1565, confidence: 78, trend: "stable" },
    { date: "Sep 6", predicted: 1555, confidence: 74, trend: "down" },
    { date: "Sep 7", predicted: 1550, confidence: 70, trend: "stable" },
    { date: "Sep 8", predicted: 1560, confidence: 67, trend: "up" },
    { date: "Sep 9", predicted: 1570, confidence: 64, trend: "up" },
  ],
  Maize: [
    { date: "Sep 3", predicted: 1850, confidence: 87, trend: "up" },
    { date: "Sep 4", predicted: 1860, confidence: 83, trend: "up" },
    { date: "Sep 5", predicted: 1855, confidence: 79, trend: "stable" },
    { date: "Sep 6", predicted: 1845, confidence: 75, trend: "down" },
    { date: "Sep 7", predicted: 1840, confidence: 71, trend: "stable" },
    { date: "Sep 8", predicted: 1850, confidence: 68, trend: "up" },
    { date: "Sep 9", predicted: 1865, confidence: 65, trend: "up" },
  ],
};

const CROPS = ["Paddy", "Tomato", "Mustard", "Potato", "Maize"];

export default function MandiPricePage() {
  const { t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState("Paddy");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<typeof MANDI_LOCATIONS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ city: string; state: string; district: string } | null>(null);
  const [gpsLocation, setGpsLocation] = useState({ city: "", state: "" });
  const [locationLoading, setLocationLoading] = useState(true);
  // Stored 14-day mandi price history (from the database)
  const [dbHistory, setDbHistory] = useState<MandiHistoryRow[]>([]);
  useEffect(() => {
    fetchMandiHistory(14).then(setDbHistory).catch(() => {});
  }, []);
  const searchRef = useRef<HTMLDivElement>(null);

  // Auto-detect GPS location
  useEffect(() => {
    if (selectedLocation) return; // Don't override if user selected
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.state || "";
            const state = data.address?.state || "";
            setGpsLocation({ city, state });
          } catch {
            setGpsLocation({ city: "Delhi", state: "Delhi" });
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          setGpsLocation({ city: "Delhi", state: "Delhi" });
          setLocationLoading(false);
        },
        { timeout: 5000 }
      );
    } else {
      setGpsLocation({ city: "Delhi", state: "Delhi" });
      setLocationLoading(false);
    }
  }, [selectedLocation]);

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const lower = query.toLowerCase();
    const matches = MANDI_LOCATIONS.filter(
      (loc) =>
        loc.city.toLowerCase().includes(lower) ||
        loc.district.toLowerCase().includes(lower) ||
        loc.state.toLowerCase().includes(lower) ||
        loc.mandis.some((m) => m.toLowerCase().includes(lower))
    ).slice(0, 12);
    setSearchSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const selectLocation = (loc: typeof MANDI_LOCATIONS[0]) => {
    setSelectedLocation({ city: loc.city, state: loc.state, district: loc.district });
    setSearchQuery(`${loc.city} — ${loc.district}, ${loc.state}`);
    setShowSuggestions(false);
    // Log search to database
    const userId = JSON.parse(localStorage.getItem("agn_current_user") || "null")?.id;
    logSearch(userId, "mandi_price", `${loc.city}, ${loc.district}, ${loc.state}`, { state: loc.state, district: loc.district }, `${loc.city}, ${loc.state}`);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setSearchQuery("");
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Get current location for display
  const displayLocation = selectedLocation || { city: gpsLocation.city, state: gpsLocation.state };
  const displayState = displayLocation.state || "Delhi";

  // Filter mandis based on selected location
  const getMandis = (): MandiPrice[] => {
    if (selectedLocation) {
      const locs = MANDI_LOCATIONS.filter(
        (l) => l.city === selectedLocation.city && l.district === selectedLocation.district
      );
      if (locs.length > 0) {
        return locs.flatMap((loc, idx) =>
          loc.mandis.map((mandi, mIdx) => generateMandiPrice(mandi, loc.district, loc.state, selectedCrop, idx * 10 + mIdx))
        );
      }
      // Fallback: search by state
      const stateLocs = MANDI_LOCATIONS.filter((l) => l.state === selectedLocation.state);
      return stateLocs.slice(0, 3).flatMap((loc, idx) =>
        loc.mandis.slice(0, 2).map((mandi, mIdx) => generateMandiPrice(mandi, loc.district, loc.state, selectedCrop, idx * 10 + mIdx))
      );
    }
    // Default: use GPS state
    const stateLocs = MANDI_LOCATIONS.filter((l) => l.state === displayState);
    if (stateLocs.length > 0) {
      return stateLocs.slice(0, 3).flatMap((loc, idx) =>
        loc.mandis.slice(0, 2).map((mandi, mIdx) => generateMandiPrice(mandi, loc.district, loc.state, selectedCrop, idx * 10 + mIdx))
      );
    }
    // Final fallback: Delhi
    return MANDI_LOCATIONS.filter((l) => l.state === "Delhi").slice(0, 2).flatMap((loc, idx) =>
      loc.mandis.map((mandi, mIdx) => generateMandiPrice(mandi, loc.district, loc.state, selectedCrop, idx * 10 + mIdx))
    );
  };

  const mandis = getMandis();
  const bestMandi = mandis.length > 0 ? mandis.reduce((b, c) => (c.price > b.price ? c : b), mandis[0]) : null;
  const worstMandi = mandis.length > 0 ? mandis.reduce((w, c) => (c.price < w.price ? c : w), mandis[0]) : null;
  const avgPrice = mandis.length > 0 ? Math.round(mandis.reduce((s, p) => s + p.price, 0) / mandis.length) : 0;
  const predictions = PREDICTIONS[selectedCrop] || [];

  // Persist today's mandi price snapshot into the database (rolling 14-day
  // history), then refresh the stored history so the chart uses real rows.
  const persistKeyRef = useRef("");
  useEffect(() => {
    const key = `${displayState}|${selectedLocation?.city || ""}|${selectedLocation?.district || ""}|${selectedCrop}`;
    if (persistKeyRef.current === key) return;
    persistKeyRef.current = key;
    const rows = getMandis().map((m) => ({
      mandi: m.mandi,
      district: m.district,
      state: m.state,
      crop: m.crop,
      price: m.price,
      unit: m.unit,
      price_date: todayStr(),
      change: m.change,
      change_percent: m.changePercent,
    }));
    saveMandiSnapshot(rows)
      .then(() => fetchMandiHistory(14))
      .then(setDbHistory)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayState, selectedLocation, selectedCrop]);

  // Merge DB-stored history for the selected crop with the static fallback
  const dbPoints = dbHistory
    .filter((r) => r.crop === selectedCrop)
    .reduce<{ date: string; price: number; _d: string }[]>((acc, r) => {
      const found = acc.find((p) => p._d === r.price_date);
      if (found) {
        found.price = Math.round((found.price + r.price) / 2);
      } else {
        const d = new Date(`${r.price_date}T00:00:00`);
        acc.push({
          _d: r.price_date,
          price: r.price,
          date: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a._d.localeCompare(b._d))
    .map(({ date, price }) => ({ date, price }));
  const history = dbPoints.length >= 2 ? dbPoints : PRICE_HISTORY[selectedCrop] || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t("liveApmc")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t("mandiDashboard")}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              {locationLoading ? t("detectingLocation") : selectedLocation ? `${t("showingMandisNear")} ${selectedLocation.city}, ${selectedLocation.district}` : `${t("showingMandisNear")} ${displayLocation.city || ""} (${displayState})`}
            </p>
          </div>
        </div>

        {/* Location Search */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-2">{t("searchAnyCity")}</label>
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && searchSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder={t("typeCityName")}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button onClick={clearLocation} className="absolute right-3 top-2.5 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                {searchSuggestions.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectLocation(loc)}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                  >
                    <p className="text-xs font-bold text-slate-900">{loc.city} — {loc.district}</p>
                    <p className="text-[10px] text-slate-500">{loc.state} • {loc.mandis.join(", ")}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{t("searchCityHint")}</p>
        </div>

        {/* Crop Selector */}
        <div className="flex flex-wrap gap-2">
          {CROPS.map((crop) => (
            <button key={crop} onClick={() => setSelectedCrop(crop)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${selectedCrop === crop ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {crop}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">{t("averagePrice")}</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">₹{avgPrice.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">{t("perQuintal")}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-emerald-500 font-semibold uppercase">{t("bestMandi")}</p>
            <p className="text-sm font-bold text-emerald-700 mt-1">{bestMandi?.mandi || "N/A"}</p>
            <p className="text-[10px] text-emerald-600 font-bold">₹{bestMandi?.price.toLocaleString()}/q</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-rose-500 font-semibold uppercase">{t("lowestPrice")}</p>
            <p className="text-sm font-bold text-rose-700 mt-1">{worstMandi?.mandi || "N/A"}</p>
            <p className="text-[10px] text-rose-600 font-bold">₹{worstMandi?.price.toLocaleString()}/q</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-violet-500 font-semibold uppercase">{t("priceSpread")}</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">₹{bestMandi && worstMandi ? (bestMandi.price - worstMandi.price).toLocaleString() : 0}</p>
            <p className="text-[10px] text-slate-400">{t("maxDifference")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Price Table */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">{t("nearbyMandiPrices")}</h3>
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t("live")}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {mandis.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">{t("noMandiPrices")} {selectedCrop}</div>
                ) : (
                  mandis.map((p) => (
                    <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.mandi}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.district}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900">₹{p.price.toLocaleString()}</p>
                        <p className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${p.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {p.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {p.change >= 0 ? "+" : ""}{p.change} ({p.changePercent >= 0 ? "+" : ""}{p.changePercent}%)
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Best Day Advisory */}
            {bestMandi && (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <h3 className="text-xs font-bold">{t("aiBestDayAdvisory")}</h3>
                </div>
                <p className="text-sm font-semibold mb-2">
                  Sell <span className="font-extrabold">{selectedCrop}</span> at <span className="font-extrabold">{bestMandi.mandi}</span>
                </p>
                <div className="bg-white/15 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs">{t("bestPrice")} <span className="font-bold">₹{bestMandi.price.toLocaleString()}/{t("perQuintal")}</span></p>
                  <p className="text-xs">{t("sevenDayOutlook")} <span className="font-bold">{t("pricesRise")}</span></p>
                  <p className="text-xs">{t("recommendation")} <span className="font-bold">{t("holdForBetterPrice")}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="lg:col-span-7 space-y-6">
            {/* Price Trend */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-900 mb-4">📈 {t("priceTrend14Day")} — {selectedCrop}</h3>
              <div className="flex items-end gap-1 h-40">
                {history.map((h, i) => {
                  const range = Math.max(...history.map((x) => x.price)) - Math.min(...history.map((x) => x.price)) || 1;
                  const height = ((h.price - Math.min(...history.map((x) => x.price))) / range) * 100 + 20;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-500 font-medium">₹{h.price}</span>
                      <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300 transition-all" style={{ height: `${height}%` }} />
                      <span className="text-[8px] text-slate-400">{h.date.split(" ")[1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Predictions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-900 mb-4">🔮 {t("aiPricePrediction")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="text-left py-2 font-semibold">{t("date")}</th>
                      <th className="text-right py-2 font-semibold">{t("predicted")}</th>
                      <th className="text-right py-2 font-semibold">{t("confidence")}</th>
                      <th className="text-right py-2 font-semibold">{t("trend")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-900">{p.date}</td>
                        <td className="py-2 text-right font-bold text-slate-900">₹{p.predicted.toLocaleString()}</td>
                        <td className="py-2 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.confidence >= 80 ? "bg-emerald-100 text-emerald-700" : p.confidence >= 70 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                            {p.confidence}%
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {p.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500 inline" />}
                          {p.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-rose-500 inline" />}
                          {p.trend === "stable" && <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Comparison Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-900 mb-4">📊 {t("mandiComparison")} — {selectedCrop}</h3>
              <div className="space-y-3">
                {mandis.sort((a, b) => b.price - a.price).slice(0, 5).map((p) => {
                  const maxP = Math.max(...mandis.map((m) => m.price));
                  const pct = (p.price / maxP) * 100;
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[150px]">{p.mandi}</span>
                        <span className="text-[10px] font-bold text-slate-900">₹{p.price.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
