import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, TrendingDown, BarChart3, ArrowRight } from "lucide-react";
import { useLocation } from "../../contexts/LocationContext";
import { fetchMandiHistory } from "../../lib/supabaseData";
import { getNearbyMandis, type MandiPriceData } from "../MandiPricesBar";

// --- Mini sparkline (same style as farmer mandi bar) ---
function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 56;
  const height = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#6ee7b7" : "#fda4af"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Glass mandi widget for the merchant landing page — same mandi data
 * source as the farmer landing page (getNearbyMandis + mandi_price_history),
 * resolved to the merchant's current GPS location.
 */
export default function NearestMandiWidget() {
  const { state, city } = useLocation();
  const [mandiData, setMandiData] = useState<MandiPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const resolvedState = state || "Delhi";
    const resolvedCity = city || "Delhi";
    const data = getNearbyMandis(resolvedState, resolvedCity).slice(0, 4);
    setMandiData(data);
    setLoading(false);

    // Upgrade sparklines with real stored history from mandi_price_history
    (async () => {
      try {
        const hist = await fetchMandiHistory(14);
        setMandiData((prev) =>
          prev.map((m) => {
            const rows = hist
              .filter((r) => r.mandi === m.mandi && r.crop === m.crop)
              .sort((a, b) => a.price_date.localeCompare(b.price_date));
            return rows.length >= 2 ? { ...m, history: rows.map((r) => r.price) } : m;
          })
        );
      } catch {
        // DB not migrated yet — synthetic sparkline history still shown
      }
    })();
  }, [state, city]);

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 text-emerald-200 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight">Mandi Prices Near You</h3>
            <p className="text-[11px] text-emerald-200/80 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />
              {loading ? "Detecting location..." : `${city}${state ? `, ${state}` : ""}`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="py-6 text-center text-xs text-emerald-100/60">Loading nearby mandi prices...</div>
        ) : (
          mandiData.map((m, i) => (
            <div
              key={i}
              className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{m.mandi}</p>
                <p className="text-[11px] text-emerald-200">
                  {m.crop} · ₹{m.price.toLocaleString()}/q
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <MiniSparkline data={m.history} positive={m.change >= 0} />
                <p
                  className={`text-[11px] font-bold flex items-center gap-0.5 ${
                    m.change >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {m.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.change >= 0 ? "+" : ""}
                  {m.changePercent}%
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <Link
        to="/mandi-prices"
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-bold transition-colors"
      >
        View All Mandi Prices
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
