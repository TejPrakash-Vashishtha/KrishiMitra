import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat, ArrowLeft, Youtube, Sparkles, Package, Plus, X,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, IndianRupee, Store,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { fetchInventory } from "../lib/supabaseData";
import { getProductIdeas, youtubeSearchUrl, fallbackPriceRange, type ProductIdea } from "../lib/processingRecipes";
import { suggestProductPrice, type PriceSuggestion } from "../lib/gemini";
import { uploadMarketplaceProduct, productMeta, type ProductType } from "../lib/customerData";

interface InventoryLite {
  id: string;
  crop_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
}

const CROP_EMOJI: Record<string, string> = {
  potato: "🥔", tomato: "🍅", paddy: "🌾", rice: "🍚", wheat: "🌾",
  mango: "🥭", onion: "🧅", maize: "🌽", chilli: "🌶️", groundnut: "🥜",
  sugarcane: "🎋", brinjal: "🍆", banana: "🍌", cauliflower: "🥦",
};

/**
 * Process Produce (/process) — Feature A.
 * 3-step flow: pick a crop from YOUR inventory → see product ideas with
 * YouTube how-to links → list the finished product on the marketplace.
 * Also includes a free-form "Add New Product" for anything the farmer
 * makes (pickle, honey, papad...) with an AI-suggested price.
 */
export default function ProcessProducePage() {
  const { user } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<InventoryLite[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<InventoryLite | null>(null);

  // Add-product modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [presetProduct, setPresetProduct] = useState<string>("");

  useEffect(() => {
    let alive = true;
    if (!user) {
      setLoadingInv(false);
      return;
    }
    fetchInventory(user.id)
      .then((rows) => {
        if (!alive) return;
        setInventory(
          (rows as InventoryLite[]).filter((r) => (r.quantity || 0) > 0)
        );
      })
      .catch(() => alive && setInventory([]))
      .finally(() => alive && setLoadingInv(false));
    return () => {
      alive = false;
    };
  }, [user]);

  const openAddProduct = (productName: string) => {
    setPresetProduct(productName);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
            <ChefHat className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Farm to Product</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Turn your raw harvest into value-added products — chips, pickles, flour and more — and sell them directly at a much higher price.
          </p>
        </div>

        {/* Step 1 — Pick a crop from inventory */}
        <StepBadge n={1} label={selectedCrop ? "Your crop" : "Pick a crop from your stock"} />

        {loadingInv ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading your crop stock...
          </div>
        ) : inventory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No crops in your stock yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add crops in Crop Stock first — then come back to process them.
            </p>
            <button
              onClick={() => navigate("/inventory")}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              Go to Crop Stock →
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {inventory.map((item) => {
                const emoji = CROP_EMOJI[item.crop_name.toLowerCase()] || "🌱";
                const active = selectedCrop?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCrop(item)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      active
                        ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-100"
                        : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40"
                    }`}
                  >
                    <div className="text-3xl mb-2">{emoji}</div>
                    <div className="text-sm font-bold text-slate-900 leading-tight">{item.crop_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.quantity} {item.unit} · ₹{item.price_per_unit}/kg
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add new product — always available */}
            <button
              onClick={() => openAddProduct("")}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-sm font-bold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add a New Product (anything you made — pickle, honey, papad...)
            </button>
          </>
        )}

        {/* Step 2 — Product ideas */}
        {selectedCrop && (
          <>
            <div className="mt-8">
              <StepBadge n={2} label={`What can you make from ${selectedCrop.crop_name}?`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {getProductIdeas(selectedCrop.crop_name).map((idea) => (
                <ProductIdeaCard
                  key={idea.name}
                  idea={idea}
                  rawPrice={selectedCrop.price_per_unit}
                  onSell={() => openAddProduct(idea.name)}
                />
              ))}
            </div>
          </>
        )}

        {/* Back to crop selection */}
        {selectedCrop && (
          <button
            onClick={() => setSelectedCrop(null)}
            className="mt-6 mx-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Choose a different crop
          </button>
        )}
      </div>

      {/* Step 3 modal — Add product with AI price suggestion */}
      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cropName={selectedCrop?.crop_name || ""}
        rawPricePerKg={selectedCrop?.price_per_unit || 0}
        presetProductName={presetProduct}
        defaultLocation={loc?.city || ""}
      />
    </div>
  );
}

// ---- helpers -----------------------------------------------

function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
        {n}
      </span>
      <h2 className="text-sm font-bold text-slate-800">{label}</h2>
    </div>
  );
}

function ProductIdeaCard({
  idea,
  rawPrice,
  onSell,
}: {
  idea: ProductIdea;
  rawPrice: number;
  onSell: () => void;
}) {
  const range = fallbackPriceRange(rawPrice, idea.priceMultiplier);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{idea.emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{idea.name}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{idea.description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 w-fit">
        <IndianRupee className="w-3 h-3" />
        Raw ₹{rawPrice}/kg → sells ~₹{range.min}–{range.max}
      </div>

      <div className="mt-4 flex items-center gap-2 mt-auto pt-1">
        <a
          href={youtubeSearchUrl(idea.youtubeQuery)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-bold cursor-pointer transition-colors"
        >
          <Youtube className="w-4 h-4" /> Watch How-to
        </a>
        <button
          onClick={onSell}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
        >
          <Store className="w-3.5 h-3.5" /> List This Product
        </button>
      </div>
    </div>
  );
}

// ---- Add product modal --------------------------------------

function AddProductModal({
  open,
  onClose,
  cropName,
  rawPricePerKg,
  presetProductName,
  defaultLocation,
}: {
  open: boolean;
  onClose: () => void;
  cropName: string;
  rawPricePerKg: number;
  presetProductName: string;
  defaultLocation: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [productName, setProductName] = useState(presetProductName);
  const [productType, setProductType] = useState<ProductType>("processed");
  const [emoji, setEmoji] = useState("🍯");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"kg" | "quintal">("kg");
  const [grade, setGrade] = useState<"A" | "B" | "C">("A");
  const [price, setPrice] = useState("");
  const [storage, setStorage] = useState("home");

  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Re-seed the form each time the modal opens (with prefill if from a recipe card)
  useEffect(() => {
    if (!open) return;
    setProductName(presetProductName);
    setQuantity("");
    setPrice("");
    setGrade("A");
    setUnit("kg");
    setStorage("home");
    setDone(false);
    setError("");
    setSuggestion(null);
    if (presetProductName) {
      const meta = productMeta(presetProductName);
      setEmoji(meta.emoji === "🥗" ? "🍯" : meta.emoji);
      setProductType("processed");
    }
  }, [open, presetProductName]);

  const askAi = async () => {
    if (!productName.trim()) {
      setError("Type the product name first, then ask the AI.");
      return;
    }
    setSuggesting(true);
    setError("");
    const ai = await suggestProductPrice(productName.trim(), cropName || productName.trim(), rawPricePerKg || 20);
    if (ai) {
      setSuggestion(ai);
    } else {
      // Offline fallback: multiplier table guess
      const range = fallbackPriceRange(rawPricePerKg || 20, 4);
      setSuggestion({
        minPrice: range.min,
        maxPrice: range.max,
        reasoning: `Based on typical retail rates — raw ${cropName || "crop"} sells at ₹${rawPricePerKg || 20}/kg.`,
        source: "fallback",
      });
    }
    setSuggesting(false);
  };

  const handleSave = async () => {
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
      harvestDate: "",
      storageLocation: storage,
    });
    setSaving(false);
    if (result.ok) {
      setDone(true);
      setTimeout(() => {
        onClose();
        navigate("/marketplace");
      }, 1500);
    } else {
      setError(result.error || "Could not list the product. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Add Your New Product</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {done && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Product is live in the marketplace! Opening it...
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Product name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product name *</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Homemade Potato Chips"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Quantity + unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity *</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit</label>
              <div className="flex gap-1.5">
                {(["kg", "quintal"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      unit === u ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {u === "kg" ? "Kg" : "Quintal"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quality grade */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quality grade</label>
            <div className="flex gap-1.5">
              {(["A", "B", "C"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    grade === g ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          </div>

          {/* Price + AI suggestion */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Price (₹ per {unit}) *</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 130"
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={askAi}
                disabled={suggesting}
                className="flex items-center gap-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
              >
                {suggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {suggesting ? "Asking AI..." : "AI Suggest"}
              </button>
            </div>

            {suggestion && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-amber-900">
                    AI suggests ₹{suggestion.minPrice}–{suggestion.maxPrice} per {unit}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrice(String(Math.round((suggestion.minPrice + suggestion.maxPrice) / 2)))}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold cursor-pointer"
                  >
                    Use this
                  </button>
                </div>
                <p className="text-[10px] text-amber-800/80 mt-1 leading-snug">{suggestion.reasoning}</p>
                {suggestion.source === "fallback" && (
                  <p className="text-[9px] text-amber-700/60 mt-0.5">(offline estimate — AI unavailable right now)</p>
                )}
              </div>
            )}
          </div>

          {/* Storage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Storage place</label>
            <input
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              placeholder="e.g. home, godown, cold storage"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Goes live instantly for customers & merchants — visible on your storefront too.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Listing product..." : "List Product on Marketplace"}
          </button>
        </div>
      </div>
    </div>
  );
}
