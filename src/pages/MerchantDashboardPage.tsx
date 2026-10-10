import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, IndianRupee, Package, TrendingUp, ShoppingCart, X,
  Phone, MessageCircle, Loader2, Search, Clock, CheckCircle2, Ban,
  ChevronDown, Boxes, CalendarDays,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchMerchantDeals, cancelMerchantDeal,
  type MerchantDeal, type DealStatus,
} from "../lib/merchantData";

const STATUS_STYLES: Record<DealStatus, { chip: string; label: string }> = {
  requested: { chip: "bg-amber-100 text-amber-800 border-amber-200", label: "Requested" },
  confirmed: { chip: "bg-sky-100 text-sky-800 border-sky-200", label: "Confirmed" },
  completed: { chip: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Completed" },
  cancelled: { chip: "bg-rose-100 text-rose-700 border-rose-200", label: "Cancelled" },
};

function dealKg(d: MerchantDeal): number {
  return d.unit === "quintal" ? d.quantity * 100 : d.quantity;
}

export default function MerchantDashboardPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<MerchantDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DealStatus | "ALL">("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMerchantDeals(user?.id || "").then((rows) => {
      if (!alive) return;
      setDeals(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    const active = deals.filter((d) => d.status === "requested" || d.status === "confirmed");
    const completed = deals.filter((d) => d.status === "completed");
    const spendActive = active.reduce((s, d) => s + d.amount, 0);
    const spendDone = completed.reduce((s, d) => s + d.amount, 0);
    const kgBought = completed.reduce((s, d) => s + dealKg(d), 0);
    const cropMap = new Map<string, number>();
    for (const d of deals) {
      if (d.status === "cancelled") continue;
      cropMap.set(d.crop, (cropMap.get(d.crop) || 0) + d.amount);
    }
    const topCrops = [...cropMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCropSpend = topCrops[0]?.[1] || 1;
    return { active, completed, spendActive, spendDone, kgBought, topCrops, maxCropSpend };
  }, [deals]);

  const filtered = filter === "ALL" ? deals : deals.filter((d) => d.status === filter);

  const handleCancel = async (deal: MerchantDeal) => {
    if (!user) return;
    setCancellingId(deal.id);
    const ok = await cancelMerchantDeal(deal.id, user.id);
    if (ok) {
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, status: "cancelled" } : d)));
    }
    setCancellingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 lg:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-950 via-emerald-950 to-green-950 text-white px-4 pt-8 pb-10">
        <div className="max-w-7xl mx-auto space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-emerald-300">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Merchant Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Purchase history &amp; spend, all in one place
          </h1>
          <p className="text-xs text-emerald-200/80 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Every "Request to Buy" you send lands here — track status, cancel pending deals, contact farmers.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stats.active.length}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Active requests</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <IndianRupee className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">₹{stats.spendActive.toLocaleString()}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">In-progress value</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">₹{stats.spendDone.toLocaleString()}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Spent on completed deals</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
              <Boxes className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stats.kgBought.toLocaleString()}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Kg purchased (completed)</p>
          </div>
        </div>

        {/* Spend breakdown by crop */}
        {stats.topCrops.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Where your money goes — top crops
            </h2>
            <div className="space-y-3">
              {stats.topCrops.map(([crop, amount]) => (
                <div key={crop}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">{crop}</span>
                    <span className="font-semibold text-slate-500">₹{amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${Math.max(6, Math.round((amount / stats.maxCropSpend) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deal history */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-violet-600" />
              Deal history
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["ALL", "requested", "confirmed", "completed", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                    filter === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s === "ALL" ? "All" : STATUS_STYLES[s].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading your deals...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-16 text-center max-w-md mx-auto">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                {deals.length === 0 ? "No deals yet" : `No ${STATUS_STYLES[filter as DealStatus]?.label || ""} deals`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Search a crop and send your first "Request to Buy" — it will appear here instantly.
              </p>
              <Link
                to="/merchant/search"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" />
                Find Crops
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((d) => {
                const st = STATUS_STYLES[d.status] || STATUS_STYLES.requested;
                return (
                  <div
                    key={d.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-extrabold text-slate-900">{d.crop}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.chip}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        From <span className="font-bold text-slate-700">{d.farmerName}</span> ·{" "}
                        {dealKg(d).toLocaleString()} kg @ ₹{d.pricePerUnit}/kg
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"}
                      </p>
                    </div>

                    <div className="text-left lg:text-right shrink-0">
                      <p className="text-lg font-extrabold text-emerald-700">₹{d.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">total deal value</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {d.farmerPhone && (
                        <>
                          <a
                            href={`tel:${d.farmerPhone}`}
                            title="Call farmer"
                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/${d.farmerPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp farmer"
                            className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      {(d.status === "requested" || d.status === "confirmed") && (
                        <button
                          onClick={() => handleCancel(d)}
                          disabled={cancellingId === d.id}
                          title="Cancel this request"
                          className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-60 cursor-pointer transition-colors"
                        >
                          {cancellingId === d.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {d.status === "cancelled" && <Ban className="w-4 h-4 text-rose-300" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
