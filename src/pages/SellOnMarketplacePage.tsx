import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Send, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { uploadMarketplaceProduct, productMeta, type ProductType } from "../lib/customerData";

const COMMON_PRODUCTS = [
  "Tomato", "Mango", "Potato", "Onion", "Wheat", "Paddy", "Maize",
  "Banana", "Guava", "Brinjal", "Chilli", "Pickle", "Honey", "Flour", "Ghee", "Jaggery",
];

/**
 * Sell on Marketplace (/sell) — Phase 7.
 * Farmers list fresh or processed products here; every upload goes to
 * farmer_inventory (product_type + image_emoji) and instantly appears
 * in the customer marketplace via the shared data layer.
 */
export default function SellOnMarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState<ProductType>("fresh");
  const [emoji, setEmoji] = useState("🍅");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"kg" | "quintal">("kg");
  const [grade, setGrade] = useState<"A" | "B" | "C">("A");
  const [price, setPrice] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [storage, setStorage] = useState("home");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const pickProduct = (name: string) => {
    setProductName(name);
    const meta = productMeta(name);
    setProductType(meta.type);
    setEmoji(meta.emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!productName.trim() || !quantity || !price) {
      setError("Please fill product name, quantity and price.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await uploadMarketplaceProduct({
      farmerId: user.id,
      productName: productName.trim(),
      productType,
      emoji,
      quantity: Number(quantity),
      unit,
      grade,
      pricePerKg: Number(price),
      harvestDate,
      storageLocation: storage,
    });
    setSaving(false);
    if (result.ok) {
      setDone(true);
      setTimeout(() => navigate("/marketplace"), 1400);
    } else {
      setError(result.error || "Could not list the product. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sell on the Marketplace</h1>
          <p className="text-xs text-slate-500 mt-1">
            List your produce — customers and merchants will see it instantly with your rating and location.
          </p>
        </div>

        {done && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Product listed! Opening the marketplace...
          </div>
        )}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          {/* Product picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">What are you selling? *</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRODUCTS.map((p) => {
                const meta = productMeta(p);
                const active = productName === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => pickProduct(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      active ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50"
                    }`}
                  >
                    {meta.emoji} {p}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Or type another product..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-lg bg-white cursor-pointer"
                title="Product icon"
              >
                {["🍅", "🥭", "🥔", "🧅", "🌾", "🌽", "🍌", "🍐", "🍆", "🌶️", "🥒", "🍯", "🧈", "🟤", "🥗"].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-3">
            {(["fresh", "processed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setProductType(t)}
                className={`py-2.5 rounded-xl text-xs font-bold border-2 cursor-pointer transition-all ${
                  productType === t
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500 hover:border-emerald-200"
                }`}
              >
                {t === "fresh" ? "🥗 Fresh Produce" : "🍯 Processed (pickle, honey...)"}
              </button>
            ))}
          </div>

          {/* Quantity + price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select value={unit} onChange={(e) => setUnit(e.target.value as "kg" | "quintal")} className="px-2 rounded-xl border border-slate-300 text-sm bg-white cursor-pointer">
                  <option value="kg">kg</option>
                  <option value="quintal">quintal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price per kg (₹) *</label>
              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 40"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Grade + storage + harvest */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value as "A" | "B" | "C")} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white cursor-pointer">
                <option value="A">A (best)</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stored in</label>
              <select value={storage} onChange={(e) => setStorage(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white cursor-pointer">
                <option value="home">Home</option>
                <option value="warehouse">Warehouse</option>
                <option value="cold-storage">Cold storage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Harvest date</label>
              <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
            <ShoppingBag className="w-4 h-4 shrink-0 mt-0.5" />
            After listing, customers searching "{productName || "your crop"}" will see your stock, rating and location — and can order or chat with you directly.
          </div>

          <button
            type="submit"
            disabled={saving || done}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {saving ? "Listing..." : done ? "Listed!" : "List on Marketplace"}
          </button>
        </form>
      </div>
    </div>
  );
}
