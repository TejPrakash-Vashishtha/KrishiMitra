import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, MapPin, ArrowRight, HeartHandshake, Search, Package } from "lucide-react";
import { useLocation } from "../contexts/LocationContext";
import { fetchMarketplace, searchMarketplace, type MarketProduct } from "../lib/customerData";

/**
 * Farmer Connect (/shop/farmers) — Phase 3.
 * The bridge between farmers and consumers: browse farmer cards
 * (name, rating, distance, what they sell) and open a full storefront.
 */
export default function FarmerConnectPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetchMarketplace(loc.city || "")
      .then((p) => alive && setProducts(p))
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [loc.city]);

  // Group products by farmer
  const farmers = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        village: string;
        city: string;
        rating: number;
        distanceKm: number;
        products: MarketProduct[];
      }
    >();
    for (const p of products) {
      if (query && !p.listing.name.toLowerCase().includes(query.toLowerCase())) continue;
      const existing = map.get(p.listing.id);
      if (existing) {
        existing.products.push(p);
      } else {
        const seed = p.id.length; // stable pseudo-distance via searchMarketplace below
        void seed;
        map.set(p.listing.id, {
          id: p.listing.id,
          name: p.listing.name,
          village: p.listing.village,
          city: p.listing.city,
          rating: p.listing.rating,
          distanceKm: 0, // filled below
          products: [p],
        });
      }
    }
    // Use the shared search engine for consistent distances
    const results = searchMarketplace(products, { query: "" });
    const distById = new Map(results.map((r) => [r.listing.id, r.distanceKm]));
    for (const f of map.values()) f.distanceKm = distById.get(f.id) ?? 0;
    return [...map.values()].sort((a, b) => b.rating - a.rating);
  }, [products, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-emerald-600" />
              Farmer Connect
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Buy straight from the people who grow your food — every farmer verified, every deal direct.
            </p>
          </div>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search farmer by name..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Farmer cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
            ))}
          </div>
        ) : farmers.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200/80 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No farmers found</p>
            <p className="text-xs text-slate-500 mt-1">Try a different name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmers.map((f) => {
              // Distinct crop chips (max 4 shown)
              const crops = [...new Set(f.products.map((p) => p.productName))].slice(0, 4);
              return (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-lg font-bold flex items-center justify-center shadow-md shadow-emerald-200">
                        {f.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-base font-bold text-slate-900">👨‍🌾 {f.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-3 h-3" /> {f.distanceKm} km away · {f.village}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {f.rating}
                    </span>
                  </div>

                  {/* What they sell */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {crops.map((c) => {
                      const p = f.products.find((x) => x.productName === c);
                      return (
                        <span
                          key={c}
                          className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-700"
                        >
                          {p?.emoji} {c}
                        </span>
                      );
                    })}
                    {f.products.length > crops.length && (
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        +{f.products.length - crops.length} more
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {f.products.length} product{f.products.length === 1 ? "" : "s"} listed
                    </span>
                    <Link
                      to={`/shop/farmers/${encodeURIComponent(f.id)}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      View Products <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
