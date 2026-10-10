// ============================================================
// Subscription data layer — KrishiMitra Pro (₹999/year)
// Full physical soil & moisture sensor kit installed on-farm,
// ongoing land-data reports, and unlimited AI features.
//
// Tries Supabase first (mirrors supabaseData.ts patterns),
// falls back to localStorage when the migration hasn't run
// or Supabase is unreachable, so the UI always works.
// ============================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const PLAN_PRICE_INR = 999;
export const PLAN_ID = "pro_annual";

export interface SubscriptionRow {
  id: string;
  farmer_id: string;
  plan: string;
  amount_inr: number;
  status: "active" | "pending_payment" | "cancelled" | "expired";
  payment_ref: string;
  sensor_install_status: "scheduled" | "installing" | "installed";
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

const LS_KEY = "agn_subscription";

// ---- localStorage fallback ---------------------------------

function lsGet(farmerId: string): SubscriptionRow | null {
  try {
    const raw = localStorage.getItem(`${LS_KEY}_${farmerId}`);
    return raw ? (JSON.parse(raw) as SubscriptionRow) : null;
  } catch {
    return null;
  }
}

function lsSet(row: SubscriptionRow) {
  try {
    localStorage.setItem(`${LS_KEY}_${row.farmer_id}`, JSON.stringify(row));
  } catch {
    // storage full / private mode — non-fatal
  }
}

function mapSupabaseRow(r: any): SubscriptionRow {
  return {
    id: String(r.id),
    farmer_id: r.farmer_id,
    plan: r.plan ?? "pro_annual",
    amount_inr: Number(r.amount_inr ?? PLAN_PRICE_INR),
    status: r.status ?? "active",
    payment_ref: r.payment_ref ?? "",
    sensor_install_status: r.sensor_install_status ?? "scheduled",
    current_period_start: r.current_period_start ?? null,
    current_period_end: r.current_period_end ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
  };
}

function plusOneYear(from = new Date()): string {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

// ---- Public API --------------------------------------------

/** Returns the farmer's latest subscription, or null. Checks expiry locally. */
export async function fetchSubscription(farmerId: string): Promise<SubscriptionRow | null> {
  if (!farmerId) return null;
  try {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        const row = mapSupabaseRow(data[0]);
        // Mirror status to localStorage so the navbar pill renders instantly
        lsSet(row);
        return row;
      }
      if (!error) return null; // Supabase reachable, genuinely no subscription
    }
  } catch (err) {
    console.warn("[AgriNexus] subscription fetch failed, using local cache:", err);
  }
  return lsGet(farmerId);
}

/** Whether the subscription is active and inside its paid period. */
export function isSubscriptionActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (!sub.current_period_end) return true; // legacy rows: trust status
  return new Date(sub.current_period_end).getTime() > Date.now();
}

/**
 * Marks the plan active after payment. When the user pays via a hosted
 * payment page we can't verify server-side from a static site, so this
 * records the payment reference and activates the current period.
 */
export async function activateSubscription(
  farmerId: string,
  paymentRef = "",
): Promise<SubscriptionRow> {
  const now = new Date();
  const local: SubscriptionRow = {
    id: `local_${now.getTime()}`,
    farmer_id: farmerId,
    plan: PLAN_ID,
    amount_inr: PLAN_PRICE_INR,
    status: "active",
    payment_ref: paymentRef,
    sensor_install_status: "scheduled",
    current_period_start: now.toISOString(),
    current_period_end: plusOneYear(now),
    created_at: now.toISOString(),
  };
  lsSet(local);

  try {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            farmer_id: farmerId,
            plan: PLAN_ID,
            amount_inr: PLAN_PRICE_INR,
            status: "active",
            payment_ref: paymentRef,
            sensor_install_status: "scheduled",
            current_period_start: local.current_period_start,
            current_period_end: local.current_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "farmer_id,plan" },
        )
        .select()
        .single();
      if (!error && data) {
        const row = mapSupabaseRow(data);
        lsSet(row);
        return row;
      }
      if (error) console.warn("[AgriNexus] subscription upsert failed:", error.message);
    }
  } catch (err) {
    console.warn("[AgriNexus] subscription activate fallback:", err);
  }
  return local;
}

export async function cancelSubscription(farmerId: string): Promise<void> {
  const existing = lsGet(farmerId);
  if (existing) {
    lsSet({ ...existing, status: "cancelled" });
  }
  try {
    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("farmer_id", farmerId);
    }
  } catch (err) {
    console.warn("[AgriNexus] subscription cancel fallback:", err);
  }
}
