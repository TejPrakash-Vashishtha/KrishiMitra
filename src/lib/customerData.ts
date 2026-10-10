// ============================================================
// Customer market data layer — Phase 2
//
// Reuses the same Supabase tables the merchant world uses
// (farmers + farmer_inventory), but shapes the data for the
// customer marketplace: retail product cards, farmer storefronts,
// and a shared search engine that both roles will consume.
//
// Supabase first; falls back to a rich deterministic demo dataset
// (same demo farmers as merchantData.ts) so the marketplace is
// always demoable before real farmers list products.
// ============================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { hashSeed, kg, farmerRating, type CropStockRow, type FarmerListing } from "./merchantData";

// ---- Types ------------------------------------------------

export type ProductType = "fresh" | "processed";

export interface MarketProduct {
  id: string;
  listing: FarmerListing; // the farmer selling it
  row: CropStockRow; // the stock lot behind it
  productName: string;
  type: ProductType;
  emoji: string;
  pricePerKg: number;
  availableKg: number;
  unitLabel: string; // "kg" for fresh, "jar"/"pack" for processed
}

export interface SearchResult {
  listing: FarmerListing;
  products: MarketProduct[];
  distanceKm: number;
}

// ---- Product catalog metadata ------------------------------

const PRODUCT_META: Record<string, { emoji: string; type: ProductType }> = {
  Tomato: { emoji: "🍅", type: "fresh" },
  Potato: { emoji: "🥔", type: "fresh" },
  Onion: { emoji: "🧅", type: "fresh" },
  Wheat: { emoji: "🌾", type: "fresh" },
  Paddy: { emoji: "🌾", type: "fresh" },
  Rice: { emoji: "🍚", type: "fresh" },
  Maize: { emoji: "🌽", type: "fresh" },
  Mustard: { emoji: "🌻", type: "fresh" },
  Chilli: { emoji: "🌶️", type: "fresh" },
  Brinjal: { emoji: "🍆", type: "fresh" },
  Banana: { emoji: "🍌", type: "fresh" },
  Cauliflower: { emoji: "🥦", type: "fresh" },
  Guava: { emoji: "🍐", type: "fresh" },
  Mango: { emoji: "🥭", type: "fresh" },
  Pickle: { emoji: "🥒", type: "processed" },
  Honey: { emoji: "🍯", type: "processed" },
  Flour: { emoji: "🌾", type: "processed" },
  Atta: { emoji: "🌾", type: "processed" },
  Ghee: { emoji: "🧈", type: "processed" },
  Jaggery: { emoji: "🟤", type: "processed" },
};

export function productMeta(name: string): { emoji: string; type: ProductType } {
  return PRODUCT_META[name] || { emoji: "🥗", type: "fresh" };
}

// Retail pack sizes offered to customers (merchants buy bulk separately)
export const RETAIL_PACKS = [1, 2, 5];

// ---- Demo catalog (deterministic, seeded by city) ----------

const DEMO_NAMES = [
  "Rajesh Kumar", "Amit Patel", "Suresh Kumar", "Lakshmi Devi", "Vijay Singh",
  "Mohan Rao", "Kavita Bai", "Dinesh Yadav", "Sunita Kumari", "Anita Sharma",
];

const DEMO_VILLAGES = [
  "Rampur", "Kishanganj", "Bhagwanpur", "Salempur", "Chandpur",
  "Haripur", "Madhopur", "Sherpur", "Govindpur", "Fatehpur",
];

const DEMO_PRODUCTS = [
  { name: "Tomato", price: 40 }, { name: "Mango", price: 80 },
  { name: "Potato", price: 25 }, { name: "Onion", price: 30 },
  { name: "Pickle", price: 220 }, { name: "Honey", price: 450 },
  { name: "Flour", price: 45 }, { name: "Wheat", price: 28 },
  { name: "Paddy", price: 24 }, { name: "Maize", price: 22 },
  { name: "Banana", price: 35 }, { name: "Guava", price: 50 },
  { name: "Brinjal", price: 30 }, { name: "Chilli", price: 90 },
  { name: "Ghee", price: 600 }, { name: "Jaggery", price: 60 },
];

const DEMO_FARMER_STOCK: Record<string, string[]> = {
  "Rajesh Kumar": ["Tomato", "Mango", "Pickle"],
  "Amit Patel": ["Tomato", "Potato", "Wheat"],
  "Suresh Kumar": ["Onion", "Tomato", "Brinjal"],
  "Lakshmi Devi": ["Mango", "Guava", "Pickle"],
  "Vijay Singh": ["Wheat", "Flour", "Paddy"],
  "Mohan Rao": ["Banana", "Tomato", "Chilli"],
  "Kavita Bai": ["Honey", "Pickle", "Tomato"],
  "Dinesh Yadav": ["Maize", "Paddy", "Flour"],
  "Sunita Kumari": ["Potato", "Onion", "Cauliflower"],
  "Anita Sharma": ["Ghee", "Jaggery", "Mango"],
};

function buildDemoProducts(city: string): MarketProduct[] {
  const c = city || "Delhi";
  const products: MarketProduct[] = [];

  DEMO_NAMES.forEach((name, i) => {
    const fSeed = hashSeed(`${name}-${c}`);
    const rating = Math.round((3.6 + (fSeed % 15) / 10) * 10) / 10;
    const deals = 6 + (fSeed % 115);
    const listing: FarmerListing = {
      id: `demo-farmer-${i}-${hashSeed(c) % 997}`,
      name,
      village: DEMO_VILLAGES[i % DEMO_VILLAGES.length],
      city: c,
      district: c,
      state: "",
      phone: `+9198${String(10000000 + (fSeed % 89999999)).slice(0, 8)}`,
      rating,
      dealsCount: deals,
      memberSince: `202${3 + (fSeed % 3)}-0${1 + (fSeed % 8)}-1${fSeed % 9}`,
      stock: [],
    };

    const crops = DEMO_FARMER_STOCK[name] || ["Tomato"];
    crops.forEach((cropName, j) => {
      const meta = productMeta(cropName);
      const base = DEMO_PRODUCTS.find((p) => p.name === cropName)?.price || 30;
      const isProcessed = meta.type === "processed";
      const price = isProcessed ? base : Math.round((base * (0.9 + ((fSeed + j) % 5) / 20)) * 100) / 100;
      const row: CropStockRow = {
        id: `demo-${i}-${j}`,
        cropName,
        quantity: isProcessed ? 10 + ((fSeed + j * 3) % 40) : 25 + ((fSeed + j * 7) % 200),
        unit: "kg",
        grade: ((fSeed + j) % 10 < 5 ? "A" : "B") as "A" | "B" | "C",
        harvestDate: `2026-0${1 + ((fSeed + j) % 8)}-1${(fSeed + j) % 9}`,
        pricePerKg: price,
        storageLocation: "home",
        status: "available",
      };
      products.push({
        id: `demo-p-${i}-${j}`,
        listing,
        row,
        productName: cropName,
        type: meta.type,
        emoji: meta.emoji,
        pricePerKg: price,
        availableKg: kg(row),
        unitLabel: isProcessed ? "pack (500g)" : "kg",
      });
    });
  });

  return products;
}

// ---- Fetch: build the full marketplace catalog -------------

export async function fetchMarketplace(city: string): Promise<MarketProduct[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const [farmersRes, invRes] = await Promise.all([
        supabase.from("farmers").select("*").eq("role", "FARMER").limit(200),
        supabase.from("farmer_inventory").select("*").neq("status", "sold").limit(1000),
      ]);
      const farmers = (farmersRes.data as any[]) || [];
      const invRows = (invRes.data as any[]) || [];

      const byFarmer = new Map<string, any[]>();
      for (const r of invRows) {
        const list = byFarmer.get(r.farmer_id) || [];
        list.push(r);
        byFarmer.set(r.farmer_id, list);
      }

      const products: MarketProduct[] = [];
      for (const f of farmers) {
        const rows = byFarmer.get(f.id) || [];
        if (rows.length === 0) continue;
        const r = farmerRating(f.id || f.phone);
        const listing: FarmerListing = {
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
          stock: rows.map((row) => ({
            id: row.id,
            cropName: row.crop_name,
            quantity: Number(row.quantity) || 0,
            unit: (row.unit === "quintal" ? "quintal" : "kg") as "kg" | "quintal",
            grade: (["A", "B", "C"].includes(row.grade) ? row.grade : "B") as "A" | "B" | "C",
            harvestDate: row.harvest_date || "",
            pricePerKg: Number(row.price_per_unit) || 0,
            storageLocation: row.storage_location || "home",
            status: row.status || "available",
          })),
        };
        for (const row of listing.stock) {
          const meta = productMeta(row.cropName);
          const isProcessed = meta.type === "processed";
          products.push({
            id: `${listing.id}-${row.id}`,
            listing,
            row,
            productName: row.cropName,
            type: meta.type,
            emoji: meta.emoji,
            pricePerKg: row.pricePerKg,
            availableKg: kg(row),
            unitLabel: isProcessed ? "pack (500g)" : "kg",
          });
        }
      }

      // Real data wins as soon as one farmer has live stock
      if (products.length > 0) return products;
    } catch {
      // fall through to demo
    }
  }
  return buildDemoProducts(city);
}

// ---- Shared search engine (customer + merchant) ------------

export interface SearchFilters {
  query: string;
  maxDistanceKm?: number;
  maxPrice?: number;
  minRating?: number;
  productType?: ProductType | "all";
  inStockOnly?: boolean;
}

export function searchMarketplace(products: MarketProduct[], filters: SearchFilters): SearchResult[] {
  const q = filters.query.trim().toLowerCase();
  const byFarmer = new Map<string, MarketProduct[]>();

  for (const p of products) {
    if (q && !p.productName.toLowerCase().includes(q)) continue;
    if (filters.maxPrice !== undefined && p.pricePerKg > filters.maxPrice) continue;
    if (filters.productType && filters.productType !== "all" && p.type !== filters.productType) continue;
    if (filters.inStockOnly && p.availableKg <= 0) continue;
    if (filters.minRating !== undefined && p.listing.rating < filters.minRating) continue;

    const list = byFarmer.get(p.listing.id) || [];
    list.push(p);
    byFarmer.set(p.listing.id, list);
  }

  const results: SearchResult[] = [];
  byFarmer.forEach((prods, farmerId) => {
    const first = prods[0];
    // Deterministic pseudo-distance from farmer id (2–25 km) until
    // real geolocation matching exists.
    const seed = hashSeed(farmerId);
    const distanceKm = 2 + (seed % 24);
    if (filters.maxDistanceKm !== undefined && distanceKm > filters.maxDistanceKm) return;
    results.push({ listing: first.listing, products: prods, distanceKm });
  });

  // Sort: rating desc, then price asc
  results.sort((a, b) => b.listing.rating - a.listing.rating || a.products[0].pricePerKg - b.products[0].pricePerKg);
  return results;
}

// ---- Cart-facing helper ------------------------------------

export function productDisplayName(p: MarketProduct): string {
  return `${p.emoji} ${p.productName}`;
}

// ============================================================
// Phase 6 — Customer orders (customer_orders table, migration 008)
// ============================================================

export interface CustomerOrderItem {
  productId: string;
  productName: string;
  emoji: string;
  farmerId: string;
  farmerName: string;
  pricePerKg: number;
  unit: string;
  quantity: number;
}

export type CustomerOrderStatus = "PLACED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: CustomerOrderItem[];
  totalAmount: number;
  status: CustomerOrderStatus;
  createdAt: string;
}

const LS_ORDERS_KEY = "agn_customer_orders";

function readOrdersLS(): CustomerOrder[] {
  try {
    return JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeOrdersLS(all: CustomerOrder[]) {
  try {
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(all.slice(0, 100)));
  } catch {
    // ignore quota errors
  }
}

function mapOrderRow(row: any): CustomerOrder {
  let items: CustomerOrderItem[] = [];
  try {
    const raw = typeof row.items === "string" ? JSON.parse(row.items) : row.items;
    items = Array.isArray(raw) ? raw : [];
  } catch {
    items = [];
  }
  return {
    id: String(row.id),
    orderNumber: row.order_number || "",
    customerId: String(row.customer_id || ""),
    customerName: row.customer_name || "",
    customerPhone: row.customer_phone || "",
    address: row.address || "",
    items,
    totalAmount: Number(row.total_amount) || 0,
    status: (row.status || "PLACED") as CustomerOrderStatus,
    createdAt: row.created_at || "",
  };
}

export async function placeCustomerOrder(order: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: CustomerOrderItem[];
  totalAmount: number;
}): Promise<CustomerOrder | null> {
  const orderNumber = `KO-${Date.now().toString(36).toUpperCase()}`;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("customer_orders")
        .insert({
          order_number: orderNumber,
          customer_id: order.customerId,
          customer_name: order.customerName,
          customer_phone: order.customerPhone,
          address: order.address,
          items: order.items,
          total_amount: order.totalAmount,
          status: "PLACED",
        })
        .select()
        .single();
      if (!error && data) return mapOrderRow(data);
    } catch {
      // migration 008 not run yet — fall through to localStorage
    }
  }

  // localStorage fallback (demo mode)
  const local: CustomerOrder = {
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderNumber,
    ...order,
    status: "PLACED",
    createdAt: new Date().toISOString(),
  };
  const all = readOrdersLS();
  all.unshift(local);
  writeOrdersLS(all);
  return local;
}

export async function fetchCustomerOrders(customerId: string): Promise<CustomerOrder[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("customer_orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data && data.length > 0) {
        return (data as any[]).map(mapOrderRow);
      }
    } catch {
      // fall through
    }
  }
  return readOrdersLS().filter((o) => o.customerId === customerId);
}

export async function cancelCustomerOrder(orderId: string, customerId: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from("customer_orders")
        .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("customer_id", customerId);
      if (!error) return true;
    } catch {
      // fall through
    }
  }
  const all = readOrdersLS();
  const idx = all.findIndex((o) => o.id === orderId && o.customerId === customerId);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], status: "CANCELLED" };
  writeOrdersLS(all);
  return true;
}

// ============================================================
// Phase 7 — farmer uploads a product to the marketplace
// (writes farmer_inventory with product_type + image_emoji)
// ============================================================

export interface UploadProductInput {
  farmerId: string;
  productName: string;
  productType: ProductType;
  emoji: string;
  quantity: number;
  unit: "kg" | "quintal";
  grade: "A" | "B" | "C";
  pricePerKg: number;
  harvestDate: string;
  storageLocation: string;
}

export async function uploadMarketplaceProduct(input: UploadProductInput): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from("farmer_inventory").insert({
        farmer_id: input.farmerId,
        crop_name: input.productName,
        quantity: input.quantity,
        unit: input.unit,
        grade: input.grade,
        harvest_date: input.harvestDate || null,
        price_per_unit: input.pricePerKg,
        storage_location: input.storageLocation || "home",
        status: "available",
        product_type: input.productType,
        image_emoji: input.emoji,
      });
      if (!error) return { ok: true };
      // Older schema without product_type — retry without the new columns
      if (/column.*does not exist|product_type|image_emoji/i.test(error.message || "")) {
        const retry = await supabase.from("farmer_inventory").insert({
          farmer_id: input.farmerId,
          crop_name: input.productName,
          quantity: input.quantity,
          unit: input.unit,
          grade: input.grade,
          harvest_date: input.harvestDate || null,
          price_per_unit: input.pricePerKg,
          storage_location: input.storageLocation || "home",
          status: "available",
        });
        if (!retry.error) return { ok: true };
        return { ok: false, error: retry.error.message };
      }
      return { ok: false, error: error.message };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Upload failed" };
    }
  }
  // Demo mode: keep local listings so the flow is testable offline
  try {
    const raw = localStorage.getItem("agn_local_listings");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(input);
    localStorage.setItem("agn_local_listings", JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }
  return { ok: true };
}
