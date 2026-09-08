import React, { useState, useEffect } from "react";
import { ShoppingBag, Search } from "lucide-react";
import ProductCard from "../components/products/ProductCard";
import api from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

const CATEGORIES_KEYS = ["categoryAll", "categoryFertilizer", "categoryPesticide", "categoryOrganic", "categorySeeds", "categoryTools", "categoryStorage", "categoryPackaging"];
const CATEGORIES_API = ["ALL", "FERTILIZER", "PESTICIDE", "ORGANIC", "SEEDS", "TOOLS", "STORAGE", "PACKAGING"];

const FALLBACK_PRODUCTS = [
  {
    id: "p1",
    name: "Pure Cold Pressed Organic Neem Oil (10,000 PPM) - 1 Litre",
    brand: "Katyayani Organics",
    category: "PESTICIDE",
    description: "Natural organic pest repellent for sucking insects, caterpillars, paddy, cotton, and vegetables.",
    price: 499,
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=organic+neem+oil+pest+control+plants",
    flipkartUrl: "https://www.flipkart.com/search?q=organic+neem+oil+pesticide",
    suitableFor: "Rice Blast, Whitefly, Aphids, Tomato Early Blight",
  },
  {
    id: "p2",
    name: "Trichoderma Viride Bio-Fungicide (1% WP) - 1 Kg",
    brand: "Multiplex Bio-Tech",
    category: "PESTICIDE",
    description: "Beneficial biocontrol fungus that protects root zone from blast and root rot.",
    price: 280,
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=trichoderma+viride+bio+fungicide",
    flipkartUrl: "https://www.flipkart.com/search?q=trichoderma+viride+fungicide",
    suitableFor: "Rice Blast, Root Rot, Damping Off, Fungal Infection",
  },
  {
    id: "p3",
    name: "100% Water Soluble NPK 19-19-19 Balanced Fertilizer - 1 Kg",
    brand: "IFFCO / Utkarsh",
    category: "FERTILIZER",
    description: "Balanced essential macronutrients for rapid vegetative growth and healthy green tillers.",
    price: 240,
    rating: 4.4,
    imageUrl: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=npk+19+19+19+water+soluble+fertilizer",
    flipkartUrl: "https://www.flipkart.com/search?q=npk+19+19+19+fertilizer",
    suitableFor: "Nitrogen Deficiency, Low Potassium, Rice, Tomato",
  },
  {
    id: "p4",
    name: "Double Sided Yellow Sticky Traps for Sucking Pests (Pack of 25)",
    brand: "AgraPlast",
    category: "TOOLS",
    description: "Glue-coated weatherproof yellow sheets that catch whiteflies and thrips.",
    price: 349,
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb22a57?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=yellow+sticky+traps+agriculture",
    flipkartUrl: "https://www.flipkart.com/search?q=yellow+sticky+traps+pest",
    suitableFor: "Whitefly, Cotton Leaf Curl, Thrips, Aphids",
  },
  {
    id: "p5",
    name: "Pure 100% Organic Vermicompost Fertilizer - 5 Kg",
    brand: "TrustBasket Organics",
    category: "ORGANIC",
    description: "Enriched with microorganisms and humic acid to loosen soil and boost fertility.",
    price: 380,
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=vermicompost+fertilizer+organic",
    flipkartUrl: "https://www.flipkart.com/search?q=vermicompost+organic+fertilizer",
    suitableFor: "Soil Deficiency, Soil Condition, Loamy, Red Soil",
  },
  {
    id: "p6",
    name: "Drip Irrigation Kit for Vegetables - Home Garden (20m)",
    brand: "Jain Irrigation",
    category: "TOOLS",
    description: "Complete drip irrigation system with connector, drippers, and pipe for 20m coverage.",
    price: 1299,
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=drip+irrigation+kit+vegetable+garden",
    flipkartUrl: "https://www.flipkart.com/search?q=drip+irrigation+kit+garden",
    suitableFor: "Vegetable Farming, Water Conservation, Drip Irrigation",
  },
  {
    id: "p7",
    name: "Hermetically Sealed Grain Storage Bag (50 Kg)",
    brand: "PICS India",
    category: "STORAGE",
    description: "Triple-layer hermetic bag that protects stored grain from insects and moisture without chemicals.",
    price: 180,
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1586771107445-b3e06e40f91e?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=hermetic+grain+storage+bag",
    flipkartUrl: "https://www.flipkart.com/search?q=grain+storage+bag+pics",
    suitableFor: "Paddy, Wheat, Maize Storage, Post-Harvest Protection",
  },
  {
    id: "p8",
    name: "LDPE Grain Storage Bag - 200 Micron (100 Kg)",
    brand: "UPL Agro",
    category: "STORAGE",
    description: "Heavy-duty UV-stabilized grain storage bag for outdoor and warehouse use.",
    price: 95,
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=LDPE+grain+storage+bag",
    flipkartUrl: "https://www.flipkart.com/search?q=LDPE+grain+bag",
    suitableFor: "Bulk Grain Storage, Warehouse Use",
  },
  {
    id: "p9",
    name: "Corrugated Packaging Boxes for Produce (50 Pack)",
    brand: "PackWell India",
    category: "PACKAGING",
    description: "Sturdy corrugated boxes ideal for transporting vegetables, fruits, and processed produce.",
    price: 1200,
    rating: 4.4,
    imageUrl: "https://images.unsplash.com/photo-1607162974569-80d6f4a32e22?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=corrugated+boxes+vegetable+packaging",
    flipkartUrl: "https://www.flipkart.com/search?q=corrugated+boxes+packaging",
    suitableFor: "Vegetable Transport, Fruit Packaging, Market Delivery",
  },
  {
    id: "p10",
    name: "Stretch Film Wrap for Pallet Packaging (300m)",
    brand: "ShrinkWrap Pro",
    category: "PACKAGING",
    description: "Transparent stretch wrap for securing and protecting stacked produce pallets during transport.",
    price: 450,
    rating: 4.2,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=stretch+film+wrap+packaging",
    flipkartUrl: "https://www.flipkart.com/search?q=stretch+film+wrap",
    suitableFor: "Pallet Wrapping, Transport Security, Warehouse Stacking",
  },
  {
    id: "p11",
    name: "Portable Cold Room Panel Kit (Walk-in)",
    brand: "Blue Star ColdChain",
    category: "STORAGE",
    description: "Modular insulated panel kit for setting up small-scale cold storage at farm level.",
    price: 85000,
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=cold+room+panel+portable",
    flipkartUrl: "https://www.flipkart.com/search?q=cold+storage+panel",
    suitableFor: "Cold Storage Setup, Perishable Produce, Farm-Level Cooling",
  },
  {
    id: "p12",
    name: "Vacuum Sealer Machine for Food Preservation",
    brand: "SealFresh India",
    category: "STORAGE",
    description: "Desktop vacuum packing machine to extend shelf life of dried fruits, spices, and processed food.",
    price: 3200,
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80",
    amazonUrl: "https://www.amazon.in/s?k=vacuum+sealer+food+preservation",
    flipkartUrl: "https://www.flipkart.com/search?q=vacuum+sealer+machine",
    suitableFor: "Spice Packaging, Dried Fruit Storage, Processed Food",
  },
];

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = category !== "ALL" ? `?category=${category}` : "";
    api.get(`/products${params}`)
      .then((res) => {
        if (res.data.success && res.data.products && res.data.products.length > 0) {
          setProducts(res.data.products);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      })
      .catch(() => setProducts(FALLBACK_PRODUCTS))
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    (p.suitableFor && p.suitableFor.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t("marketplaceDirectLinks")}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">
            {t("agriInventoryFertilizers")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2">
            {t("buyAmazonFlipkart")}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-8 shadow-sm space-y-4">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-3 left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchProducts")}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {CATEGORIES_KEYS.map((catKey, idx) => (
              <button
                key={catKey}
                onClick={() => setCategory(CATEGORIES_API[idx])}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  category === CATEGORIES_API[idx]
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t(catKey)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">{t("loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-8">
            No products found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
