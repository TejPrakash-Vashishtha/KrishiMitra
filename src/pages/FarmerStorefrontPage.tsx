import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, MapPin, MessageCircle, Phone, ArrowLeft, Package, TrendingUp } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { fetchMarketplace, RETAIL_PACKS, type MarketProduct } from "../lib/customerData";
import { fetchFarmerPastSales, type PastSale } from "../lib/merchantData";

/**
 * Farmer Storefront (/shop/farmers/:id) — Phase 3.
 * A single farmer's complete shop: every product with Add to Cart,
 * a past-sales preview (trust), and a real "Contact Farmer" chat link.
 */
export default function FarmerStorefrontPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [pastSales, setPastSales] = useState<PastSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMarketplace("")
      .then((p) => alive && setProducts(p))
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const listing = products.find((p) => p.listing.id === id)?.listing;
  const mine = useMemo(() => products.filter((p) => p.listing.id === id), [products, id]);

  // Past sales preview — fetch once the listing is known
  useEffect(() => {
    if (!listing) return;
    let alive = true;
    fetchFarmerPastSales(listing)
      .then((s) => alive && setPastSales(s))
      .catch(() => alive && setPastSales([]));
    return () => {
      alive = false;
    };
  }, [listing]);

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

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center">
        <Package className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-sm">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Farmer not found</p>
          <p className="text-xs text-slate-500 mt-1">This storefront may have been removed.</p>
          <Link
            to="/shop/farmers"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Farmer Connect
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Back link */}
        <Link to="/shop/farmers" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600">
          <ArrowLeft className="w-3.5 h-3.5" /> All farmers
        </Link>

        {/* Farmer header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-2xl font-bold flex items-center justify-center">
                  {listing.name.charAt(0)}
                </span>
                <div>
                  <h1 className="text-xl font-extrabold">👨‍🌾 {listing.name}</h1>
                  <p className="text-xs text-emerald-50/90 mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3.5 h-3.5" /> {listing.village}, {listing.city}
                    </span>
                    <span>· Member since {listing.memberSince.slice(0, 4)}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-sm font-bold">
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  {listing.rating}
                  <span className="text-[10px] font-semibold text-emerald-100">({listing.dealsCount} deals)</span>
                </span>
                {listing.phone && (
                  <a
                    href={`tel:${listing.phone}`}
                    className="p-2.5 rounded-xl bg-white/15 backdrop-blur border border-white/20 hover:bg-white/25 transition-colors"
                    title="Call farmer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Farmer — real chat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Have a question about the produce?</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chat directly with {listing.name.split(" ")[0]} — ask about quality, price, pickup or bulk deals.
            </p>
          </div>
          <Link
            to={`/chat?with=${encodeURIComponent(listing.id)}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200 cursor-pointer transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Farmer
          </Link>
        </div>

        {/* Products */}
        <div>
          <h2 className="text-base font-extrabold text-slate-900 mb-3">Products ({mine.length})</h2>
          {mine.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center text-sm text-slate-500">
              This farmer has no products listed right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mine.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center text-3xl shrink-0">
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {p.productName}
                        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.type === "fresh" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                          {p.type === "fresh" ? "FRESH" : "PROCESSED"}
                        </span>
                      </p>
                      <span className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{p.pricePerKg}
                        <span className="text-[10px] font-semibold text-slate-400">/{p.unitLabel === "kg" ? "kg" : "pack"}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.availableKg} {p.unitLabel === "kg" ? "kg" : "packs"} available · Grade {p.row.grade} · Harvested {p.row.harvestDate}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {RETAIL_PACKS.map((k) => (
                        <button
                          key={k}
                          onClick={() => handleAdd(p, k)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                            addedId === p.id
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white"
                          }`}
                        >
                          {addedId === p.id ? "✓ Added" : `+${k}${p.unitLabel === "kg" ? "kg" : ""}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past sales preview */}
        {pastSales.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Recent sales history
            </h2>
            <div className="space-y-2">
              {pastSales.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">
                      {s.crop} · {s.quantity} {s.unit}
                    </p>
                    <p className="text-[11px] text-slate-500">Sold to {s.buyer}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-emerald-700">₹{s.amount.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400">{s.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
