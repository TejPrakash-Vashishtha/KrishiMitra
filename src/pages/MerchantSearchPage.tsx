import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, SlidersHorizontal, X, MapPin, Star, Sprout, Phone, MessageCircle,
  Package, Scale, Award, CalendarDays, History, ShoppingCart, CheckCircle,
  Loader2, Store, ChevronDown, IndianRupee, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { logSearch } from "../contexts/AuthContext";
import {
  fetchMarketListings, fetchFarmerPastSales, requestToBuy,
  type FarmerListing, type CropStockRow, type PastSale, type MatchedResult,
} from "../lib/merchantData";

// ---- UI helpers -------------------------------------------

function kg(row: { quantity: number; unit: string }) {
  return row.unit === "quintal" ? row.quantity * 100 : row.quantity;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
      <span className="text-xs font-bold text-slate-800">{rating.toFixed(1)}</span>
    </span>
  );
}

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-amber-100 text-amber-800",
  C: "bg-rose-100 text-rose-800",
};

const GRADE_HINT: Record<string, string> = {
  A: "Premium quality — best for retail & export",
  B: "Standard quality — good for wholesale",
  C: "Economy quality — best for processing",
};

// ---- Filter state -----------------------------------------

interface Filters {
  quantity: string;
  unit: "kg" | "quintal";
  grade: "A" | "B" | "C" | "ANY";
  priceMin: string;
  priceMax: string;
}

const DEFAULT_FILTERS: Filters = { quantity: "", unit: "kg", grade: "ANY", priceMin: "", priceMax: "" };

// ============================================================

export default function MerchantSearchPage() {
  const { user } = useAuth();
  const { city, state } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<FarmerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(!!initialQuery);
  const [selected, setSelected] = useState<MatchedResult | null>(null);
  const [pastSales, setPastSales] = useState<PastSale[]>([]);
  const [orderState, setOrderState] = useState<"idle" | "sending" | "done">("idle");
  const [orderQty, setOrderQty] = useState("");

  // ---- Load market listings -------------------------------
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMarketListings(city || "Delhi", state || "Delhi").then((rows) => {
      if (!alive) return;
      setListings(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [city, state]);

  // ---- Matching logic -------------------------------------
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const needKg = parseFloat(filters.quantity) || 0;
    const needKgInUnit = filters.unit === "quintal" ? needKg * 100 : needKg;
    const pMin = parseFloat(filters.priceMin) || 0;
    const pMax = parseFloat(filters.priceMax) || Infinity;

    return listings
      .map((l) => {
        const rows = l.stock.filter((s) => {
          if (!s.cropName.toLowerCase().includes(q)) return false;
          if (kg(s) <= 0) return false;
          if (filters.grade !== "ANY" && s.grade !== filters.grade) return false;
          if (s.pricePerKg < pMin || s.pricePerKg > pMax) return false;
          return true;
        });
        if (rows.length === 0) return null;
        const available = rows.reduce((s, r) => s + kg(r), 0);
        if (needKgInUnit > 0 && available < needKgInUnit) return null;
        const cheapest = Math.min(...rows.map((r) => r.pricePerKg));
        return { listing: l, rows, available, cheapest };
      })
      .filter(Boolean) as MatchedResult[];
  }, [listings, query, filters]);

  const runSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
    logSearch(user?.id || null, "merchant_crop", query.trim(), undefined, `${city}, ${state}`);
  };

  // ---- Farmer detail modal --------------------------------
  const openFarmer = useCallback(async (m: MatchedResult) => {
    setSelected(m);
    setPastSales([]);
    setOrderState("idle");
    setOrderQty("");
    const sales = await fetchFarmerPastSales(m.listing);
    setPastSales(sales);
  }, []);

  const sendRequest = async () => {
    if (!selected || !user) return;
    const row = selected.rows.find((r) => r.cropName.toLowerCase() === query.trim().toLowerCase()) || selected.rows[0];
    const qty = parseFloat(orderQty) || kg(row);
    setOrderState("sending");
    const ok = await requestToBuy(
      { id: user.id, name: user.name },
      selected.listing,
      row.cropName,
      qty,
      "kg",
      row.pricePerKg
    );
    setOrderState(ok ? "done" : "idle");
  };

  const totalResults = matched.length;
  const totalAvailable = matched.reduce((s, m) => s + m.available, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 lg:pb-0">
      {/* Search hero */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white px-4 pt-8 pb-10">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-emerald-300">
            <Search className="w-3.5 h-3.5" />
            Crop Search
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Search your desired crop that you want to buy
          </h1>
          <form onSubmit={runSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try tomato, potato, wheat, onion..."
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white text-slate-900 text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Search
              </button>
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {["Tomato", "Potato", "Onion", "Wheat", "Paddy", "Maize"].map((c) => (
              <button
                key={c}
                onClick={() => { setQuery(c); setSearched(true); }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                  query.toLowerCase() === c.toLowerCase()
                    ? "bg-emerald-400 text-emerald-950 border-emerald-400"
                    : "bg-white/10 text-emerald-100 border-white/20 hover:bg-white/20"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="text-xs text-emerald-200/80 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Showing farmers near <span className="font-bold text-white">{city || "Delhi"}</span>, {state || "Delhi"}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!searched ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">What are you buying today?</h2>
            <p className="text-sm text-slate-500 mt-2">
              Search any crop, vegetable or fruit. Set your quantity, grade and price range — and see
              nearby farmers with live stock and ratings instantly.
            </p>
          </div>
        ) : (
          <>
            {/* Result summary + filter toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {loading ? "Finding farmers..." : `${totalResults} farmer${totalResults === 1 ? "" : "s"} with "${query}"`}
                </p>
                {!loading && totalResults > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {totalAvailable.toLocaleString()} kg available combined · cheapest from ₹{Math.min(...matched.map((m) => m.cheapest)).toFixed(0)}/kg
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  showFilters || filters !== DEFAULT_FILTERS
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {(filters.grade !== "ANY" || filters.quantity || filters.priceMin || filters.priceMax) && (
                  <span className="w-4 h-4 rounded-full bg-white text-emerald-700 text-[9px] flex items-center justify-center font-black">
                    {(filters.grade !== "ANY" ? 1 : 0) + (filters.quantity ? 1 : 0) + (filters.priceMin || filters.priceMax ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Filter box */}
            {showFilters && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    Filter your requirement
                  </h3>
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Quantity needed</label>
                    <input
                      type="number"
                      value={filters.quantity}
                      onChange={(e) => setFilters({ ...filters, quantity: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Unit</label>
                    <div className="flex gap-2">
                      {(["kg", "quintal"] as const).map((u) => (
                        <button
                          key={u}
                          onClick={() => setFilters({ ...filters, unit: u })}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filters.unit === u ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {u === "quintal" ? "Quintal (100 kg)" : "Kg"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Grade quality</label>
                    <div className="flex gap-2">
                      {(["ANY", "A", "B", "C"] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setFilters({ ...filters, grade: g })}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filters.grade === g ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {g === "ANY" ? "Any" : g}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">{GRADE_HINT[filters.grade] || "Any grade accepted"}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
                      Price range (₹ per kg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={filters.priceMin}
                        onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                        placeholder="Min"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-slate-400 text-xs">—</span>
                      <input
                        type="number"
                        value={filters.priceMax}
                        onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                        placeholder="Max"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Farmer result cards */}
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Scanning crop stock of nearby farmers...</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No farmer has "{query}" in stock right now</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try a nearby crop name, relax your filters, or check back after the next harvest window.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {matched.map((m) => {
                  const { listing, rows, available, cheapest } = m;
                  return (
                  <div
                    key={listing.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-5 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-black">
                          {listing.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{listing.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" />
                            {listing.village ? `${listing.village}, ` : ""}{listing.city}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Stars rating={listing.rating} />
                        <p className="text-[10px] text-slate-400 mt-0.5">{listing.dealsCount} deals</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {rows.slice(0, 3).map((r) => (
                        <div key={r.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${GRADE_COLORS[r.grade]}`}>
                              {r.grade}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {r.quantity} {r.unit}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 shrink-0">₹{r.pricePerKg}/kg</span>
                        </div>
                      ))}
                      {rows.length > 3 && (
                        <p className="text-[10px] text-slate-400 pl-1">+{rows.length - 3} more stock lots</p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-bold text-slate-800">{available.toLocaleString()} kg</span> available
                      </div>
                      <div className="text-[11px] text-slate-500">
                        from <span className="font-bold text-emerald-700">₹{cheapest.toFixed(0)}/kg</span>
                      </div>
                    </div>

                    <button
                      onClick={() => openFarmer(m)}
                      className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Store className="w-4 h-4" />
                      View Farmer & Stock
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Farmer detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white p-6">
              <button
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-xl font-black text-emerald-200">
                  {selected.listing.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold">{selected.listing.name}</h3>
                  <p className="text-xs text-emerald-200/90 flex items-center gap-1.5 flex-wrap">
                    <MapPin className="w-3 h-3" />
                    {selected.listing.village ? `${selected.listing.village}, ` : ""}{selected.listing.city}, {selected.listing.state}
                    <span className="inline-flex items-center gap-1 ml-1">
                      <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                      {selected.listing.rating.toFixed(1)} · {selected.listing.dealsCount} deals
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* Request to buy */}
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    Request to Buy — {query || selected.rows[0]?.cropName}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Rate locked at listing
                  </span>
                </div>
                {orderState === "done" ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    Request sent! The farmer has been notified — they will confirm price & pickup shortly.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Quantity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={orderQty}
                          onChange={(e) => setOrderQty(e.target.value)}
                          placeholder={`e.g. ${Math.min(50, Math.max(1, Math.round(selected.rows[0] ? kg(selected.rows[0]) / 2 : 50)))}`}
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">kg</span>
                      </div>
                    </div>
                    <button
                      onClick={sendRequest}
                      disabled={orderState === "sending"}
                      className="self-stretch sm:self-end px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {orderState === "sending" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                      Send Request
                    </button>
                  </div>
                )}
              </div>

              {/* Crop stock — only the searched crop */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Crop Stock — "{query || "all matching"}" only
                </h4>
                <div className="space-y-2.5">
                  {selected.rows.map((r) => (
                    <div key={r.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Stock</p>
                          <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-slate-400" />
                            {r.quantity} {r.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Grade</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[r.grade]}`}>
                            Grade {r.grade}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Price</p>
                          <p className="text-sm font-extrabold text-emerald-700 flex items-center gap-0.5">
                            <IndianRupee className="w-3 h-3" />{r.pricePerKg}/kg
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Harvested</p>
                          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            {r.harvestDate || "—"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setOrderQty(String(Math.min(50, Math.max(1, Math.round(kg(r) / 2)))))}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer shrink-0"
                      >
                        Use this lot →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past experience preview */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-violet-600" />
                  Past Experience & Sales
                </h4>
                {pastSales.length === 0 ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-5 h-5 text-slate-300 animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pastSales.map((s, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {s.crop} · {s.quantity.toLocaleString()} {s.unit}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">Sold to {s.buyer}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-emerald-700">₹{s.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{s.date}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Member since {selected.listing.memberSince ? selected.listing.memberSince.slice(0, 4) : "—"} ·
                      Rated {selected.listing.rating.toFixed(1)} across {selected.listing.dealsCount} completed deals
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <a
                  href={`tel:${selected.listing.phone}`}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Farmer
                </a>
                <a
                  href={`https://wa.me/${selected.listing.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
