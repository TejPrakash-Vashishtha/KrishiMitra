// ============================================================
// Merchant market data layer — Phase 2B
//
// Joins the farmer directory (farmers table, role = FARMER) with
// live Crop Stock (farmer_inventory, status != sold) so merchants
// can search a crop and see nearby farmers with real stock, grades,
// prices and ratings.
//
// Every function tries Supabase first and falls back to a rich,
// deterministic demo dataset (seeded by the merchant's city) so the
// feature is always demoable even before real farmers register.
// ============================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { createOrder, fetchOrders } from "./supabaseData";

// ---- Types ------------------------------------------------

export interface CropStockRow {
  id: string;
  cropName: string;
  quantity: number;
  unit: "kg" | "quintal";
  grade: "A" | "B" | "C";
  harvestDate: string;
  pricePerKg: number;
  storageLocation: string;
  status: string;
}

export interface PastSale {
  crop: string;
  quantity: number;
  unit: string;
  buyer: string;
  amount: number;
  date: string;
}

export interface FarmerListing {
  id: string;
  name: string;
  village: string;
  city: string;
  district: string;
  state: string;
  phone: string;
  rating: number; // 3.6 – 5.0
  dealsCount: number;
  memberSince: string;
  stock: CropStockRow[]; // all available crops
}

// ---- Deterministic helpers (stable ratings per farmer) ----

export function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function kg(row: { quantity: number; unit: string }): number {
  return row.unit === "quintal" ? row.quantity * 100 : row.quantity;
}

export function totalStockKg(stock: CropStockRow[]): number {
  return stock.reduce((s, r) => s + kg(r), 0);
}

export function bestGrade(stock: CropStockRow[]): "A" | "B" | "C" {
  return stock.some((r) => r.grade === "A") ? "A" : stock.some((r) => r.grade === "B") ? "B" : "C";
}

// ---- Demo dataset (deterministic, seeded by city) ---------

const DEMO_NAMES = [
  "Ramesh Patel", "Suresh Kumar", "Lakshmi Devi", "Vijay Singh", "Anita Sharma",
  "Mohan Rao", "Kavita Bai", "Dinesh Yadav", "Sunita Kumari", "Rajesh Verma",
];

const DEMO_VILLAGES = [
  "Rampur", "Kishanganj", "Bhagwanpur", "Salempur", "Chandpur",
  "Haripur", "Madhopur", "Sherpur", "Govindpur", "Fatehpur",
];

const DEMO_CROPS = [
  "Tomato", "Potato", "Onion", "Wheat", "Paddy", "Maize",
  "Mustard", "Chilli", "Brinjal", "Banana", "Cauliflower", "Guava",
];

const BASE_PRICES: Record<string, number> = {
  Tomato: 20, Potato: 15, Onion: 18, Wheat: 24, Paddy: 22, Maize: 17,
  Mustard: 55, Chilli: 80, Brinjal: 25, Banana: 30, Cauliflower: 22, Guava: 35,
};

function buildDemoListings(city: string, state: string): FarmerListing[] {
  const c = city || "Delhi";
  const st = state || "Delhi";
  const seed = hashSeed(c);
  const names = DEMO_NAMES.slice(0, 8);

  return names.map((name, i) => {
    const fSeed = hashSeed(`${name}-${c}`);
    const rating = Math.round((3.6 + (fSeed % 15) / 10) * 10) / 10;
    const deals = 6 + (fSeed % 115);
    const cropCount = 2 + (fSeed % 3); // 2–4 crops per farmer
    const stock: CropStockRow[] = [];
    for (let j = 0; j < cropCount; j++) {
      const crop = DEMO_CROPS[(seed + i * 3 + j * 5) % DEMO_CROPS.length];
      const isQuintal = (fSeed + j) % 3 === 0;
      const quantity = isQuintal ? 2 + ((fSeed + j * 7) % 12) : 60 + ((fSeed + j * 13) % 340);
      const grade = ((fSeed + j) % 10 < 4 ? "A" : (fSeed + j) % 10 < 8 ? "B" : "C") as "A" | "B" | "C";
      const gradeMul = grade === "A" ? 1.15 : grade === "B" ? 1 : 0.85;
      const base = BASE_PRICES[crop] || 20;
      stock.push({
        id: `demo-${i}-${j}`,
        cropName: crop,
        quantity,
        unit: isQuintal ? "quintal" : "kg",
        grade,
        harvestDate: `2026-0${1 + ((fSeed + j) % 8)}-1${(fSeed + j) % 9}`,
        pricePerKg: Math.round(base * gradeMul * ((fSeed + j) % 15 === 0 ? 1.1 : 1) * 100) / 100,
        storageLocation: (fSeed + j) % 3 === 0 ? "warehouse" : (fSeed + j) % 3 === 1 ? "home" : "cold-storage",
        status: "available",
      });
    }
    return {
      id: `demo-farmer-${i}-${seed % 997}`,
      name,
      village: DEMO_VILLAGES[i % DEMO_VILLAGES.length],
      city: c,
      district: c,
      state: st,
      phone: `+9198${String(10000000 + (fSeed % 89999999)).slice(0, 8)}`,
      rating,
      dealsCount: deals,
      memberSince: `202${3 + (fSeed % 3)}-0${1 + (fSeed % 8)}-1${fSeed % 9}`,
      stock,
    };
  });
}

// ---- Fetch: farmers + their live crop stock ---------------

export async function fetchMarketListings(city: string, state: string): Promise<FarmerListing[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const [farmersRes, invRes] = await Promise.all([
        supabase.from("farmers").select("*").eq("role", "FARMER").limit(200),
        supabase.from("farmer_inventory").select("*").neq("status", "sold").limit(1000),
      ]);
      const farmers = (farmersRes.data as any[]) || [];
      const invRows = (invRes.data as any[]) || [];

      const byFarmer = new Map<string, CropStockRow[]>();
      for (const r of invRows) {
        const list = byFarmer.get(r.farmer_id) || [];
        list.push({
          id: r.id,
          cropName: r.crop_name,
          quantity: Number(r.quantity) || 0,
          unit: (r.unit === "quintal" ? "quintal" : "kg") as "kg" | "quintal",
          grade: (["A", "B", "C"].includes(r.grade) ? r.grade : "B") as "A" | "B" | "C",
          harvestDate: r.harvest_date || "",
          pricePerKg: Number(r.price_per_unit) || 0,
          storageLocation: r.storage_location || "home",
          status: r.status || "available",
        });
        byFarmer.set(r.farmer_id, list);
      }

      const listings: FarmerListing[] = farmers.map((f) => {
        const r = farmerRating(f.id || f.phone);
        return {
          id: f.id,
          name: f.name || "Farmer",
          village: f.village || "",
          city: f.city || "",
          district: f.district || "",
          state: f.state || "",
          phone: f.phone || "",
          rating: r.rating,
          dealsCount: r.deals,
          memberSince: f.created_at || "",
          stock: byFarmer.get(f.id) || [],
        };
      });

      // Real data wins as soon as at least one farmer has live stock;
      // otherwise fall back to the demo market so search always works.
      if (listings.some((l) => l.stock.length > 0)) {
        return listings.filter((l) => l.stock.length > 0);
      }
    } catch {
      // fall through to demo
    }
  }
  return buildDemoListings(city, state);
}

// ---- Ratings (deterministic until real reviews exist) -----

export function farmerRating(id: string): { rating: number; deals: number } {
  const seed = hashSeed(String(id));
  const rating = Math.round((3.6 + (seed % 15) / 10) * 10) / 10;
  const deals = 6 + (seed % 115);
  return { rating, deals };
}

// ---- Matched result shape used by the search page ---------

export interface MatchedResult {
  listing: FarmerListing;
  rows: CropStockRow[]; // only the stock lots matching the search + filters
  available: number; // total kg available across matched lots
  cheapest: number; // lowest price/kg among matched lots
}

// ---- Past sales / experience preview -----------------------

export async function fetchFarmerPastSales(listing: FarmerListing): Promise<PastSale[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("farmer_id", listing.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data && data.length > 0) {
        return (data as any[]).map((o) => ({
          crop: o.crop,
          quantity: Number(o.quantity) || 0,
          unit: o.unit || "kg",
          buyer: o.buyer_name || "Merchant",
          amount: Number(o.amount) || 0,
          date: o.created_at || "",
        }));
      }
    } catch {
      // fall through to demo
    }
  }
  // Deterministic demo sales history
  const seed = hashSeed(listing.id);
  const buyers = ["Sharma Traders", "Gupta Enterprises", "FreshMart Retail", "City Agro Exports"];
  return Array.from({ length: 3 }, (_, i) => {
    const row = listing.stock[(seed + i * 2) % listing.stock.length];
    return {
      crop: row?.cropName || "Mixed produce",
      quantity: row ? kg(row) : 100,
      unit: "kg",
      buyer: buyers[(seed + i) % buyers.length],
      amount: row ? Math.round(kg(row) * row.pricePerKg) : 2200,
      date: `2026-0${1 + ((seed + i) % 8)}-1${(seed + i) % 9}`,
    };
  });
}

// ---- Merchant Deals (purchase history for the dashboard) --

export type DealStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface MerchantDeal {
  id: string;
  merchantId: string;
  farmerId: string;
  crop: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  amount: number;
  status: DealStatus;
  farmerName: string;
  farmerPhone: string;
  createdAt: string;
}

const LS_DEALS_KEY = "agn_merchant_deals";

function parseDealNotes(notes: unknown): { farmerName: string; farmerPhone: string } {
  try {
    const obj = typeof notes === "string" ? JSON.parse(notes) : (notes as any);
    return { farmerName: obj?.farmerName || "Farmer", farmerPhone: obj?.farmerPhone || "" };
  } catch {
    return { farmerName: "Farmer", farmerPhone: "" };
  }
}

export async function createMerchantDeal(
  merchantId: string,
  listing: FarmerListing,
  crop: string,
  quantity: number,
  unit: "kg" | "quintal",
  pricePerKg: number
): Promise<MerchantDeal | null> {
  const amount = Math.round(kg({ quantity, unit }) * pricePerKg);
  const notes = JSON.stringify({ farmerName: listing.name, farmerPhone: listing.phone });

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("merchant_deals")
        .insert({
          merchant_id: merchantId || null,
          farmer_id: listing.id,
          crop,
          quantity,
          unit,
          price_per_unit: pricePerKg,
          amount,
          status: "requested",
          notes,
        })
        .select()
        .single();
      if (!error && data) {
        const snap = parseDealNotes(data.notes);
        return {
          id: String(data.id),
          merchantId: String(data.merchant_id || merchantId || ""),
          farmerId: String(data.farmer_id || listing.id),
          crop: data.crop,
          quantity: Number(data.quantity) || 0,
          unit: data.unit || unit,
          pricePerUnit: Number(data.price_per_unit) || pricePerKg,
          amount: Number(data.amount) || amount,
          status: (data.status || "requested") as DealStatus,
          farmerName: snap.farmerName,
          farmerPhone: snap.farmerPhone,
          createdAt: data.created_at || new Date().toISOString(),
        };
      }
    } catch {
      // migration 006 not run yet — fall through to localStorage
    }
  }

  // localStorage fallback
  const row: MerchantDeal = {
    id: `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    merchantId,
    farmerId: listing.id,
    crop,
    quantity,
    unit,
    pricePerUnit: pricePerKg,
    amount,
    status: "requested",
    farmerName: listing.name,
    farmerPhone: listing.phone,
    createdAt: new Date().toISOString(),
  };
  const all = readDealsLS();
  writeLS(LS_DEALS_KEY, [row, ...all]);
  return row;
}

function readDealsLS(): MerchantDeal[] {
  try {
    const raw = localStorage.getItem(LS_DEALS_KEY);
    return raw ? (JSON.parse(raw) as MerchantDeal[]) : [];
  } catch {
    return [];
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export async function fetchMerchantDeals(merchantId: string): Promise<MerchantDeal[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("merchant_deals")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        return (data as any[]).map((d) => {
          const snap = parseDealNotes(d.notes);
          return {
            id: String(d.id),
            merchantId: String(d.merchant_id || ""),
            farmerId: String(d.farmer_id || ""),
            crop: d.crop,
            quantity: Number(d.quantity) || 0,
            unit: d.unit || "kg",
            pricePerUnit: Number(d.price_per_unit) || 0,
            amount: Number(d.amount) || 0,
            status: (d.status || "requested") as DealStatus,
            farmerName: snap.farmerName,
            farmerPhone: snap.farmerPhone,
            createdAt: d.created_at || "",
          };
        });
      }
      if (!error && data && data.length === 0) {
        // Table exists but no deals in Supabase — also merge local demo deals
        return readDealsLS().filter((d) => d.merchantId === merchantId);
      }
    } catch {
      // fall through to localStorage
    }
  }
  return readDealsLS().filter((d) => d.merchantId === merchantId);
}

export async function cancelMerchantDeal(dealId: string, merchantId: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from("merchant_deals")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", dealId);
      if (!error) return true;
    } catch {
      // fall through
    }
  }
  const all = readDealsLS();
  const idx = all.findIndex((d) => d.id === dealId && d.merchantId === merchantId);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], status: "cancelled" };
  writeLS(LS_DEALS_KEY, all);
  return true;
}

// ---- Request to Buy (creates a PENDING order + a deal record) --

export async function requestToBuy(
  merchant: { id: string; name: string },
  listing: FarmerListing,
  crop: string,
  quantity: number,
  unit: "kg" | "quintal",
  pricePerKg: number
): Promise<boolean> {
  const amount = Math.round(kg({ quantity, unit }) * pricePerKg);
  const created = await createOrder({
    farmer_id: listing.id,
    buyer_name: merchant.name || "Merchant",
    crop,
    quantity,
    unit,
    amount,
    status: "PENDING",
    items: { pricePerKg, merchant: merchant.name, merchantId: merchant.id, type: "merchant_request" },
  });
  // Deal record powers the merchant's purchase dashboard (best-effort)
  await createMerchantDeal(merchant.id, listing, crop, quantity, unit, pricePerKg);
  return !!created;
}

// Re-export for the search page's history logging
export { fetchOrders };
