import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Plus, Trash2, TrendingUp, Scale, Sparkles, X, LogIn, Store, Users } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  subscribeInventory,
  InventoryRow,
} from "../lib/supabaseData";
import {
  contributeToPool,
  fetchCollectionPoints,
  CollectionPoint,
} from "../lib/collectionData";

interface Item {
  id: string;
  cropName: string;
  quantity: number;
  unit: "kg" | "quintal";
  harvestDate: string;
  grade: "A" | "B" | "C";
  storageLocation: "home" | "warehouse" | "cold-storage";
  pricePerKg: number;
  status: "available" | "listed" | "sold";
  notes: string;
  allocatedMerchantKg?: number; // portion routed to the merchant channel
  allocatedPoolKg?: number; // portion routed to the customer pool (collection point)
}

// ---- mapping between DB rows and the UI ----
function toUI(row: InventoryRow): Item {
  return {
    id: row.id,
    cropName: row.crop_name,
    quantity: Number(row.quantity) || 0,
    unit: (row.unit || "kg") as Item["unit"],
    harvestDate: row.harvest_date || "",
    grade: (row.grade || "B") as Item["grade"],
    storageLocation: (row.storage_location || "home") as Item["storageLocation"],
    pricePerKg: Number(row.price_per_unit) || 0,
    status: (row.status || "available") as Item["status"],
    notes: row.notes || "",
    allocatedMerchantKg: Number(row.allocated_merchant_kg) || 0,
    allocatedPoolKg: Number(row.allocated_pool_kg) || 0,
  };
}

function toDB(item: Omit<Item, "id">) {
  return {
    crop_name: item.cropName,
    quantity: item.quantity,
    unit: item.unit,
    harvest_date: item.harvestDate || null,
    grade: item.grade,
    storage_location: item.storageLocation,
    price_per_unit: item.pricePerKg || 0,
    status: item.status,
    notes: item.notes,
  };
}

const STORAGE_KEYS: Record<string, { labelKey: string; icon: string; color: string }> = {
  home: { labelKey: "homeStorage", icon: "🏠", color: "bg-amber-50 text-amber-800 border-amber-200" },
  warehouse: { labelKey: "coOpWarehouse", icon: "🏭", color: "bg-blue-50 text-blue-800 border-blue-200" },
  "cold-storage": { labelKey: "coldStorage", icon: "❄️", color: "bg-cyan-50 text-cyan-800 border-cyan-200" },
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-amber-100 text-amber-800",
  C: "bg-rose-100 text-rose-800",
};

const PRICE_SUGGESTIONS: Record<string, number> = {
  Paddy: 22, Tomato: 20, Mustard: 55, Brinjal: 25, Maize: 17, Potato: 15, Chilli: 80,
};

function priceSuggestion(cropName: string, grade: string): number {
  const base = PRICE_SUGGESTIONS[cropName.split(" ")[0]] || 20;
  const gradeMultiplier = grade === "A" ? 1.15 : grade === "B" ? 1.0 : 0.85;
  return Math.round(base * gradeMultiplier * 100) / 100;
}

function currentSeason(): string {
  const m = new Date().getMonth();
  return m >= 5 && m <= 9 ? `Kharif ${new Date().getFullYear()}` : `Rabi ${new Date().getFullYear()}`;
}

const DEFAULT_NEW_ITEM = {
  cropName: "Paddy",
  quantity: "",
  unit: "quintal" as "kg" | "quintal",
  harvestDate: new Date().toISOString().split("T")[0],
  grade: "A" as "A" | "B" | "C",
  storageLocation: "home" as "home" | "warehouse" | "cold-storage",
  pricePerKg: "",
  notes: "",
};

export default function InventoryPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "available" | "listed" | "sold">("all");
  const [newItem, setNewItem] = useState(DEFAULT_NEW_ITEM);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  // Harvest allocation split — one harvest record, two channels
  const [splitItem, setSplitItem] = useState<Item | null>(null);
  const [splitMerchant, setSplitMerchant] = useState("");
  const [splitPool, setSplitPool] = useState("");
  const [splitCpId, setSplitCpId] = useState("");
  const [splitPrice, setSplitPrice] = useState("");
  const [splitReady, setSplitReady] = useState("");
  const [splitError, setSplitError] = useState("");
  const [splitting, setSplitting] = useState(false);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setInventory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const rows = await fetchInventory(user.id);
    setInventory(rows.map(toUI));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live sync — any change in Crop Stock instantly reflects here (and vice versa)
  useEffect(() => {
    if (!user) return;
    return subscribeInventory(user.id, () => {
      refresh();
    });
  }, [user, refresh]);

  // Collection points for the customer-pool allocation target
  useEffect(() => {
    fetchCollectionPoints().then((pts) => {
      setCollectionPoints(pts);
      if (pts.length > 0) setSplitCpId((prev) => prev || pts[0].id);
    });
  }, []);

  const addNewItem = async () => {
    if (!user || !newItem.quantity || !newItem.cropName) return;
    await addInventoryItem(user.id, toDB({
      cropName: newItem.cropName,
      quantity: parseFloat(newItem.quantity),
      unit: newItem.unit,
      harvestDate: newItem.harvestDate,
      grade: newItem.grade,
      storageLocation: newItem.storageLocation,
      pricePerKg: parseFloat(newItem.pricePerKg) || 0,
      status: "available",
      notes: newItem.notes,
    }));
    setShowAddForm(false);
    setNewItem(DEFAULT_NEW_ITEM);
    refresh();
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    await deleteInventoryItem(user.id, id);
    refresh();
  };

  // Add (+) or remove (-) a quantity, e.g. +50 kg / -50 kg
  const applyAdjust = async (id: string) => {
    if (!user) return;
    const delta = parseFloat(adjustValue);
    if (isNaN(delta) || delta === 0) {
      setAdjustId(null);
      setAdjustValue("");
      return;
    }
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    await updateInventoryItem(user.id, id, { quantity: newQty });
    setAdjustId(null);
    setAdjustValue("");
    refresh();
  };

  // ---- Harvest allocation split (merchant vs customer pool) ----
  const openSplit = (item: Item) => {
    setSplitItem(item);
    setSplitMerchant("");
    setSplitPool("");
    setSplitPrice(String(item.pricePerKg || 0));
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setSplitReady(d.toISOString().split("T")[0]);
    setSplitError("");
  };

  const applySplit = async () => {
    if (!user || !splitItem) return;
    const unitFactor = splitItem.unit === "quintal" ? 100 : 1;
    const totalKg = splitItem.quantity * unitFactor;
    const merchantKg = (parseFloat(splitMerchant) || 0) * unitFactor;
    const poolKg = (parseFloat(splitPool) || 0) * unitFactor;
    if (merchantKg + poolKg <= 0) {
      setSplitError("Enter at least one allocation.");
      return;
    }
    if (merchantKg + poolKg > totalKg) {
      setSplitError("Allocations cannot exceed the total harvest.");
      return;
    }
    if (poolKg > 0 && !splitCpId) {
      setSplitError("Choose a collection point for the pool portion.");
      return;
    }
    setSplitting(true);
    try {
      if (poolKg > 0) {
        const res = await contributeToPool(
          user.id,
          user.name,
          { id: splitItem.id, cropName: splitItem.cropName, quantityKg: poolKg },
          splitCpId,
          poolKg,
          parseFloat(splitPrice) || splitItem.pricePerKg || 0,
          splitItem.grade,
          currentSeason(),
          splitReady
        );
        if (!res.ok) {
          setSplitError(res.error || "Could not add to the pool. Please try again.");
          return;
        }
      }
      await updateInventoryItem(user.id, splitItem.id, {
        allocated_merchant_kg: (splitItem.allocatedMerchantKg || 0) + merchantKg,
        allocated_pool_kg: (splitItem.allocatedPoolKg || 0) + poolKg,
        allocation_note: "Split between merchant and customer pool channels",
      });
      setSplitItem(null);
      refresh();
    } finally {
      setSplitting(false);
    }
  };

  const filtered = inventory.filter((item) => filter === "all" || item.status === filter);

  const totalStockKg = inventory
    .filter((i) => i.status !== "sold")
    .reduce((sum, i) => sum + (i.unit === "quintal" ? i.quantity * 100 : i.quantity), 0);

  const totalValue = inventory
    .filter((i) => i.status !== "sold")
    .reduce((sum, i) => {
      const kg = i.unit === "quintal" ? i.quantity * 100 : i.quantity;
      return sum + kg * i.pricePerKg;
    }, 0);

  const activeItems = inventory.filter((i) => i.status !== "sold");
  const avgGrade = activeItems.length > 0
    ? activeItems.reduce((s, i) => s + (i.grade === "A" ? 3 : i.grade === "B" ? 2 : 1), 0) / activeItems.length
    : 0;

  // Login required gate
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Please Login to View Your Inventory</h1>
            <p className="text-xs text-slate-500 mt-2">
              Crop Stock is private to your account. Login to see your harvest records,
              total stock, and manage your produce.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/login?returnTo=/inventory")}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Login to Continue
            </button>
            <Link
              to="/register"
              className="w-full py-3 rounded-xl border border-emerald-300 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
            >
              New here? Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>Post-Harvest Produce Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Inventory</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              Track, manage, and price your harvested produce
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Harvest</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Stock</p>
                <p className="text-lg font-extrabold text-slate-900">{totalStockKg.toLocaleString()} kg</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Estimated Value</p>
                <p className="text-lg font-extrabold text-slate-900">₹{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Avg Grade Quality</p>
                <p className="text-lg font-extrabold text-slate-900">
                  {avgGrade >= 2.5 ? "A" : avgGrade >= 1.5 ? "B" : "C"}
                  <span className="text-xs text-slate-400 font-medium ml-1">({inventory.length} items)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "available", "listed", "sold"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                filter === f ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({inventory.filter((i) => i.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-400">Loading your crop stock...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No inventory items found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Harvest" to register your produce</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crop</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harvest Date</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price/kg</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-900">{item.cropName}</p>
                        {item.notes && <p className="text-[10px] text-slate-400 mt-0.5">{item.notes}</p>}
                        {(item.allocatedMerchantKg || 0) + (item.allocatedPoolKg || 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(item.allocatedMerchantKg || 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold">
                                🏪 Merchant: {item.allocatedMerchantKg} kg
                              </span>
                            )}
                            {(item.allocatedPoolKg || 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[9px] font-bold">
                                👥 Pool: {item.allocatedPoolKg} kg
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-800">{item.quantity}</span>
                        <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[item.grade]}`}>Grade {item.grade}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{item.harvestDate}</td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-900">₹{item.pricePerKg}/kg</p>
                        <p className="text-[9px] text-emerald-600">AI: ₹{priceSuggestion(item.cropName, item.grade)}/kg</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "sold" ? "bg-rose-100 text-rose-700" : item.status === "listed" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {adjustId === item.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={adjustValue}
                                onChange={(e) => setAdjustValue(e.target.value)}
                                placeholder="+/-50"
                                className="w-20 px-2 py-1 rounded-lg border border-emerald-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <button onClick={() => applyAdjust(item.id)} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer">OK</button>
                              <button onClick={() => { setAdjustId(null); setAdjustValue(""); }} className="px-2 py-1 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer">X</button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => openSplit(item)}
                                title="Split harvest between merchant & customer pool"
                                className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { setAdjustId(item.id); setAdjustValue(""); }}
                                title="Add / remove stock"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteItem(item.id)}
                            title="Delete item"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Harvest Allocation Split Modal — one harvest, two channels (merchant + customer pool) */}
        {splitItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSplitItem(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-600" />
                    Split Harvest — {splitItem.cropName}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Total {splitItem.quantity} {splitItem.unit} ({splitItem.unit === "quintal" ? splitItem.quantity * 100 : splitItem.quantity} kg) — decide how much goes where
                  </p>
                </div>
                <button onClick={() => setSplitItem(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Merchant channel */}
                  <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/40 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-bold text-slate-900">Merchant Channel</p>
                    </div>
                    <p className="text-[10px] text-slate-500">Sold to dealers/traders via the existing marketplace flow. Unchanged.</p>
                    <input
                      type="number" value={splitMerchant} onChange={(e) => setSplitMerchant(e.target.value)}
                      placeholder={`kg (max ${splitItem.quantity * (splitItem.unit === "quintal" ? 100 : 1)})`}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {/* Customer pool channel */}
                  <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-600" />
                      <p className="text-xs font-bold text-slate-900">Customer Pool (Direct)</p>
                    </div>
                    <p className="text-[10px] text-slate-500">Added to a collection point — customers pre-order, you get paid on delivery.</p>
                    <input
                      type="number" value={splitPool} onChange={(e) => setSplitPool(e.target.value)}
                      placeholder="kg to the pool"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                {splitPool && parseFloat(splitPool) > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Collection Point</label>
                      <select value={splitCpId} onChange={(e) => setSplitCpId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                        {collectionPoints.map((cp) => <option key={cp.id} value={cp.id}>{cp.name} — {cp.region}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pool Price (₹/kg)</label>
                      <input type="number" value={splitPrice} onChange={(e) => setSplitPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ready From</label>
                      <input type="date" value={splitReady} onChange={(e) => setSplitReady(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                  </div>
                )}

                {splitError && <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{splitError}</p>}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400">
                    Allocated so far: 🏪 {(splitItem.allocatedMerchantKg || 0).toLocaleString()} kg · 👥 {(splitItem.allocatedPoolKg || 0).toLocaleString()} kg
                  </p>
                  <button
                    onClick={applySplit} disabled={splitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {splitting ? "Allocating…" : "Allocate to Channels"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Harvest Modal — centered popup so it is always visible on click */}
        {showAddForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setShowAddForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
                <h3 className="text-sm font-bold text-slate-900">Add Harvest to Crop Stock</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Crop Name</label>
                <select
                  value={newItem.cropName}
                  onChange={(e) => setNewItem({ ...newItem, cropName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {["Paddy", "Tomato", "Mustard", "Potato", "Maize", "Brinjal", "Chilli", "Wheat", "Other"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit</label>
                <div className="flex gap-2">
                  {(["kg", "quintal"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setNewItem({ ...newItem, unit: u })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${newItem.unit === u ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Harvest Date</label>
                <input
                  type="date"
                  value={newItem.harvestDate}
                  onChange={(e) => setNewItem({ ...newItem, harvestDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quality Grade</label>
                <div className="flex gap-2">
                  {(["A", "B", "C"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setNewItem({ ...newItem, grade: g })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${newItem.grade === g ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Storage Location</label>
                <div className="flex gap-2">
                  {(Object.keys(STORAGE_KEYS) as Array<keyof typeof STORAGE_KEYS>).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setNewItem({ ...newItem, storageLocation: loc as Item["storageLocation"] })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${newItem.storageLocation === loc ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      title={loc}
                    >
                      {STORAGE_KEYS[loc].icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Price per Kg (₹)</label>
                <input
                  type="number"
                  value={newItem.pricePerKg}
                  onChange={(e) => setNewItem({ ...newItem, pricePerKg: e.target.value })}
                  placeholder={`AI suggests ₹${priceSuggestion(newItem.cropName, newItem.grade)}/kg`}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="e.g. High quality long grain"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <button
              onClick={addNewItem}
              disabled={!newItem.quantity}
              className="w-full mt-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
            >
              Add to Inventory (Permanent)
            </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}