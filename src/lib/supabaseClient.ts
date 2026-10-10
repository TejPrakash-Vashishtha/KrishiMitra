import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase config — env vars tried first, then hardcoded fallback
// The anon key is safe for public frontend use (RLS protects writes)
// envMeta guards non-Vite runtimes (node/test) where import.meta.env is undefined
const envMeta: Record<string, string | undefined> =
  (import.meta as any).env ?? {};
const SUPABASE_URL = envMeta.VITE_SUPABASE_URL || "https://ubhavqvejgapzmmpdulb.supabase.co";
const SUPABASE_ANON_KEY = envMeta.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGF2cXZlamdhcHptbXBkdWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjQ1NjcsImV4cCI6MjEwNDAwMDU2N30.zKaVMtZsLqWWJ_1KoE5Ve2maUgWTtnjvZk-fo2rhBWU";

let supabase: SupabaseClient | null = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  console.log("[AgriNexus] Supabase connected successfully.");
} catch (err) {
  console.error("[AgriNexus] Failed to initialize Supabase, using localStorage fallback:", err);
  supabase = null;
}

export { supabase };

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
