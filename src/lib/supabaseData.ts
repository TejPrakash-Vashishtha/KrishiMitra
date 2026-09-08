// ============================================================
// Supabase data helpers — Crop Stock, Weather History,
// Mandi Price History, and Orders.
//
// Every function tries Supabase first (anon key, RLS allow-all)
// and gracefully falls back to localStorage so the app still
// works if you haven't run the migration yet.
// ============================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ---- Types ------------------------------------------------

export interface InventoryRow {
  id: string;
  farmer_id: string;
  crop_name: string;
  quantity: number;
  unit: "kg" | "quintal";
  grade: string;
  storage_location: string;
  harvest_date: string | null;
  price_per_unit: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WeatherHistoryRow {
  id?: string;
  city: string;
  district: string;
  state: string;
  weather_date: string; // YYYY-MM-DD
  temperature: number;
  humidity: number;
  wind_speed: number;
  rainfall_chance: number;
  condition: string;
  forecast_data?: unknown;
}

export interface MandiHistoryRow {
  id?: string;
  mandi: string;
  district: string;
  state: string;
  crop: string;
  price: number;
  unit: string;
  price_date: string; // YYYY-MM-DD
  change: number;
  change_percent: number;
}

export interface OrderRow {
  id?: string;
  order_number: string;
  farmer_id: string | null;
  buyer_name: string;
  crop: string;
  quantity: number;
  unit: string;
  amount: number;
  status: string;
  items: unknown;
  created_at?: string;
  updated_at?: string;
}

// ---- tiny helpers -----------------------------------------

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in demo mode
  }
}

// =============================================================
// CROP STOCK (farmer_inventory)
// ============================================================

export async function fetchInventory(farmerId: string): Promise<InventoryRow[]> {
  if (farmerId && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("farmer_inventory")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });
      if (!error) return (data as unknown as InventoryRow[]) || [];
    } catch {
      // fall through to localStorage fallback
    }
  }
  return readLS<InventoryRow[]>(`agn_inventory_${farmerId}`, []);
}

export async function addInventoryItem(
  farmerId: string,
  item: Omit<InventoryRow, "id" | "farmer_id" | "created_at" | "updated_at">
): Promise<InventoryRow | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("farmer_inventory")
        .insert({ ...item, farmer_id: farmerId })
        .select()
        .single();
      if (!error && data) return data as unknown as InventoryRow;
    } catch {
      // fall through
    }
  }
  const row: InventoryRow = {
    ...item,
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    farmer_id: farmerId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const all = await fetchInventory(farmerId);
  writeLS(`agn_inventory_${farmerId}`, [row, ...all]);
  return row;
}

export async function updateInventoryItem(
  farmerId: string,
  id: string,
  patch: Partial<Omit<InventoryRow, "id" | "farmer_id" | "created_at">>
): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from("farmer_inventory")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) return true;
    } catch {
      // fall through
    }
  }
  const all = await fetchInventory(farmerId);
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], ...patch, updated_at: new Date().toISOString() };
  writeLS(`agn_inventory_${farmerId}`, all);
  return true;
}

export async function deleteInventoryItem(farmerId: string, id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from("farmer_inventory").delete().eq("id", id);
      if (!error) return true;
    } catch {
      // fall through
    }
  }
  const all = await fetchInventory(farmerId);
  const next = all.filter((r) => r.id !== id);
  writeLS(`agn_inventory_${farmerId}`, next);
  return true;
}

// Live sync: Supabase Realtime (postgres_changes) or localStorage
// storage events as a fallback.
export function subscribeInventory(farmerId: string, onChange: () => void): () => void {
  if (farmerId && isSupabaseConfigured() && supabase) {
    const channel = supabase
      .channel(`inventory-realtime-${farmerId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "farmer_inventory", filter: `farmer_id=eq.${farmerId}` },
        () => onChange()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }
  const handler = (e: StorageEvent) => {
    if (e.key && e.key.startsWith("agn_inventory_")) onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
// =============================================================
// WEATHER HISTORY (rolling 10 days)
// ============================================================

export async function saveWeatherSnapshot(snap: Omit<WeatherHistoryRow, "id">): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from("weather_history")
        .upsert([snap], { onConflict: "city,weather_date" });
      // Prune to the last 10 days
      await supabase
        .from("weather_history")
        .delete()
        .lt("weather_date", daysAgoStr(10));
      return;
    } catch {
      // fall through
    }
  }
  const all = await fetchWeatherHistory(30);
  const withoutToday = all.filter(
    (r) => !(r.weather_date === snap.weather_date && r.city === snap.city)
  );
  writeLS("agn_weather_history", [...withoutToday, snap as WeatherHistoryRow].slice(0, 10));
}

export async function fetchWeatherHistory(days = 10): Promise<WeatherHistoryRow[]> {
  const from = daysAgoStr(days);
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("weather_history")
        .select("*")
        .gte("weather_date", from)
        .order("weather_date", { ascending: true });
      if (!error && data) return data as unknown as WeatherHistoryRow[];
    } catch {
      // fall through
    }
  }
  const all = readLS<WeatherHistoryRow[]>("agn_weather_history", []);
  return all.filter((r) => r.weather_date >= from);
}

// =============================================================
// MANDI PRICE HISTORY (rolling 14 days)
// ============================================================

export async function saveMandiSnapshot(
  rows: Array<Omit<MandiHistoryRow, "id">>
): Promise<void> {
  if (!rows || rows.length === 0) return;
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from("mandi_price_history")
        .upsert(rows, { onConflict: "mandi,crop,price_date" });
      await supabase
        .from("mandi_price_history")
        .delete()
        .lt("price_date", daysAgoStr(14));
      return;
    } catch {
      // fall through
    }
  }
  const existing = await fetchMandiHistory(30);
  const today = todayStr();
  const withoutToday = existing.filter(
    (r) => !(r.price_date === today && rows.some((x) => x.mandi === r.mandi && x.crop === r.crop))
  );
  writeLS("agn_mandi_history", [...withoutToday, ...rows].slice(-200));
}

export async function fetchMandiHistory(days = 14): Promise<MandiHistoryRow[]> {
  const from = daysAgoStr(days);
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("mandi_price_history")
        .select("*")
        .gte("price_date", from)
        .order("price_date", { ascending: true });
      if (!error && data) return data as unknown as MandiHistoryRow[];
    } catch {
      // fall through
    }
  }
  const all = readLS<MandiHistoryRow[]>("agn_mandi_history", []);
  return all.filter((r) => r.price_date >= from);
}

// =============================================================
// ORDERS (permanent order history & records)
// ============================================================

export async function createOrder(
  data: Omit<OrderRow, "id" | "order_number" | "created_at" | "updated_at">
): Promise<OrderRow | null> {
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: created, error } = await supabase
        .from("orders")
        .insert({ ...data, order_number: orderNumber })
        .select()
        .single();
      if (!error && created) return created as unknown as OrderRow;
    } catch {
      // fall through
    }
  }
  const row: OrderRow = {
    ...data,
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    order_number: orderNumber,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const all = await fetchOrders(data.farmer_id || undefined);
  writeLS("agn_orders", [row, ...all]);
  return row;
}

export async function fetchOrders(farmerId?: string): Promise<OrderRow[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (farmerId) query = query.eq("farmer_id", farmerId);
      const { data, error } = await query;
      if (!error && data) return data as unknown as OrderRow[];
    } catch {
      // fall through
    }
  }
  const all = readLS<OrderRow[]>("agn_orders", []);
  return farmerId ? all.filter((o) => o.farmer_id === farmerId) : all;
}

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) return true;
    } catch {
      // fall through
    }
  }
  const all = await fetchOrders(undefined);
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], status, updated_at: new Date().toISOString() };
  writeLS("agn_orders", all);
  return true;
}