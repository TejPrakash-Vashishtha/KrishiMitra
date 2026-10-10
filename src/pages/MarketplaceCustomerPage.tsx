import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Star, MapPin, Plus, ShoppingCart, Filter, Package } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useLocation } from "../contexts/LocationContext";
import {
  fetchMarketplace,
  searchMarketplace,
  RETAIL_PACKS,
  type MarketProduct,
  type ProductType,
} from "../lib/customerData";

/**
 * Customer Marketplace (/shop/marketplace) — Phase 2.
 * Product cards with image/emoji, farmer name, rating, price/kg,
 * available quantity, location and Add to Cart. One shared search
 * architecture (Phase 4) powers the results below.
 */
export default function MarketplacePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const loc = useLocation();

  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.get("q") || "");
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all");
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);
  const [maxPrice, setMaxPrice] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  const loadMarket = () => {
    fetchMarketplace(loc.city || "")
      .then((p) => setProducts(p))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadMarket, [loc.city]);

  // Live updates: refresh when a farmer lists a new product (Phase 7)
  useEffect(() => {
    const onFocus = () => loadMarket();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loc.city]);

  const results = useMemo(
    () =>
      searchMarketplace(products, {
        query,
        maxDistanceKm: maxDistance,
        maxPrice: maxPrice > 0 ? maxPrice : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        productType: typeFilter,
        inStockOnly: true,
      }),
    [products, query, maxDistance, minRating, maxPrice, typeFilter]
  );

  const handleAdd = (p: MarketProduct, packKg: number) => {
    addItem({
      productId: p.id,
      productName: p.productName,
      farmerId: p.listing.id,
      farmerName: p.listing.name,
      pricePerKg: p.pricePerKg,
      unit: p.unitLabel,
      quantity: packKg,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search + filters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tomato, mango, pickle, honey..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-bold text-slate-500">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            {(["all", "fresh", "processed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                  typeFilter === t
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                {t === "all" ? "All" : t === "fresh" ? "🥗 Fresh" : "🍯 Processed"}
              </button>
            ))}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white font-semibold cursor-pointer"
            >
              <option value={0}>Any rating</option>
              <option value={4}>⭐ 4.0+</option>
              <option value={4.5}>⭐ 4.5+</option>
            </select>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white font-semibold cursor-pointer"
            >
              <option value={0}>Any price</option>
              <option value={20}>Under ₹20</option>
              <option value={50}>Under ₹50</option>
              <option value={100}>Under ₹100</option>
              <option value={250}>Under ₹250</option>
            </select>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white font-semibold cursor-pointer"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={50}>Any distance</option>
            </select>
          </div>
        </div>

        {/* Results grouped by farmer */}
        <p className="mt-4 mb-3 text-xs font-semibold text-slate-500">
          {loading ? "Loading marketplace..." : `${results.length} farmer${results.length === 1 ? "" : "s"} matching your search`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200/80 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-500 mt-1">Try a different search or widen your filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((r) => (
              <div key={r.listing.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Farmer header */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {r.listing.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">👨‍🌾 {r.listing.name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="flex items-center gap-0.5 font-bold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {r.listing.rating}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {r.distanceKm} km away · {r.listing.village}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/shop/farmers/${encodeURIComponent(r.listing.id)}`)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer whitespace-nowrap"
                  >
                    View Storefront →
                  </button>
                </div>

                {/* Product rows */}
                <div className="divide-y divide-slate-100">
                  {r.products.map((p) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center text-2xl shrink-0">
                        {p.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {p.productName}
                          <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.type === "fresh" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                            {p.type === "fresh" ? "FRESH" : "PROCESSED"}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {p.availableKg} {p.unitLabel === "kg" ? "kg" : "packs"} available · ₹{p.pricePerKg}/{p.unitLabel === "kg" ? "kg" : "pack"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {RETAIL_PACKS.map((k) => (
                          <button
                            key={k}
                            onClick={() => handleAdd(p, k)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                              addedId === p.id
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white"
                            }`}
                            title={`Add ${k} ${p.unitLabel === "kg" ? "kg" : "pack"} to cart`}
                          >
                            {addedId === p.id ? "✓" : `+${k}${p.unitLabel === "kg" ? "kg" : ""}`}
                          </button>
                        ))}
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[11px] font-semibold">
                          <ShoppingCart className="w-3 h-3" /> Add
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
