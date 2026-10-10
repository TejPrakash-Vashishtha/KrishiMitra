import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, HeartHandshake, Package, Star, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { fetchMarketplace, type MarketProduct } from "../lib/customerData";
import { useLocation } from "../contexts/LocationContext";
import riceFieldBg from "../assets/rice-field.jpg"; // same live wallpaper as farmer/merchant landing
import { productPhoto } from "../lib/productPhotos";

/**
 * Customer landing page (/shop) — the customer's home inside the app.
 * Same warm agricultural theme as the farmer/merchant worlds, but the
 * content is all about buying fresh produce directly from farmers.
 */
export default function CustomerLandingPage() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const loc = useLocation();
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);

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

  const featured = products.slice(0, 8);
  const farmers = new Map<string, { name: string; rating: number; city: string; products: number }>();
  products.forEach((p) => {
    if (!farmers.has(p.listing.id)) {
      farmers.set(p.listing.id, {
        name: p.listing.name,
        rating: p.listing.rating,
        city: p.listing.city || p.listing.village,
        products: 1,
      });
    } else {
      farmers.get(p.listing.id)!.products += 1;
    }
  });
  const topFarmers = [...farmers.values()].sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero — identical live rice-field background as the farmer/merchant landing pages */}
      <section className="relative overflow-hidden text-white pt-0 pb-16 px-4">
        {/* SVG filter that makes the photo's crops sway (unique id per page) */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id="customerCropWave" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.012"
              numOctaves={2}
              seed={7}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="14s"
                values="0.006 0.012;0.009 0.016;0.006 0.012"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={18} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* Live background photo (Ken-Burns zoom + wavy filter) — same as farmer/merchant */}
        <div
          className="absolute inset-0 motion-safe:animate-[breathe_22s_ease-in-out_infinite_alternate]"
          style={{
            backgroundImage: `url(${riceFieldBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center 55%",
            filter: "url(#customerCropWave) saturate(1.28) brightness(1.12) hue-rotate(12deg)",
            willChange: "transform",
          }}
        />

        {/* Same scrim as farmer/merchant hero */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,46,33,0.68) 0%, rgba(6,78,59,0.52) 45%, rgba(5,46,22,0.70) 100%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto pt-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-300/30 text-amber-100 text-[11px] font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Farm-to-Home Marketplace
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Namaste{user?.name ? `, ${user.name}` : ""}! 👋
            </h1>
            <p className="mt-2 text-sm sm:text-base text-emerald-100 leading-relaxed">
              Buy fresh vegetables, fruits, honey, pickles and more — directly from
              farmers near you. No middlemen, fair prices, farm-fresh quality.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/shop/marketplace")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 cursor-pointer transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse Marketplace
              </button>
              <button
                onClick={() => navigate("/shop/farmers")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm font-bold cursor-pointer transition-colors backdrop-blur-sm"
              >
                <HeartHandshake className="w-4 h-4" />
                Meet Your Farmers
              </button>
            </div>
            {totalItems > 0 && (
              <p className="mt-3 text-xs text-amber-200 font-semibold">
                🛒 {totalItems} item{totalItems > 1 ? "s" : ""} waiting in your cart —{" "}
                <button onClick={() => navigate("/shop/orders")} className="underline cursor-pointer">
                  go to cart
                </button>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">Fresh Near You</h2>
          <Link to="/shop/marketplace" className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center text-sm text-slate-500">
            No products listed near you yet — check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {featured.map((p) => {
              const img = productPhoto(p.productName);
              return (
                <Link
                  key={p.id}
                  to="/shop/marketplace"
                  className="group bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all"
                >
                  {img ? (
                    <img
                      src={img.photo}
                      alt={p.productName}
                      loading="lazy"
                      className="w-full aspect-square rounded-xl object-cover mb-2"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center text-3xl mb-2">
                      {p.emoji}
                    </div>
                  )}
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                    {p.productName}
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate">👨‍🌾 {p.listing.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-extrabold text-slate-900">₹{p.pricePerKg}/{p.unitLabel === "kg" ? "kg" : "pack"}</span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {p.listing.rating}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Meet your farmers */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">Meet Your Farmers</h2>
          <Link to="/shop/farmers" className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1">
            Farmer Connect <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topFarmers.map((f, i) => (
            <Link
              key={i}
              to="/shop/farmers"
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                  {f.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{f.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {f.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-[11px]">
                <span className="flex items-center gap-0.5 font-bold text-amber-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {f.rating}
                </span>
                <span className="text-slate-400">{f.products} products</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
