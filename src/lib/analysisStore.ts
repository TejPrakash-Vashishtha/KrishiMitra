// ============================================================
// Crop Analysis Store — permanent storage of every Crop Checkup
// diagnosis. Saves to Supabase (crop_analyses table) when
// available, falls back to localStorage otherwise.
// ============================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export interface AnalysisRecord {
  id: string;
  farmer_id: string | null;
  crop_name: string;
  disease: string;
  severity: string;
  confidence: number;
  image_url: string;
  symptoms: string[];
  organic_treatments: string[];
  chemical_treatments: string[];
  cause: string;
  irrigation_advice: string[];
  soil_advice: string[];
  recommended_products: string[];
  summary: string;
  created_at: string;
}

const LS_KEY = "agn_crop_analyses";

function readLS(): AnalysisRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLS(rows: AnalysisRecord[]) {
  try {
    // Keep the newest 50 in localStorage (images are large)
    localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(0, 50)));
  } catch {
    // quota exceeded — drop oldest and retry once
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(0, 10)));
    } catch {
      /* give up silently */
    }
  }
}

export async function saveAnalysis(
  rec: Omit<AnalysisRecord, "id" | "created_at">
): Promise<AnalysisRecord> {
  const record: AnalysisRecord = {
    ...rec,
    id: `an-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("crop_analyses")
        .insert({
          farmer_id: rec.farmer_id,
          crop_name: rec.crop_name,
          disease: rec.disease,
          severity: rec.severity,
          confidence: rec.confidence,
          image_url: rec.image_url,
          symptoms: rec.symptoms,
          organic_treatments: rec.organic_treatments,
          chemical_treatments: rec.chemical_treatments,
          cause: rec.cause,
          irrigation_advice: rec.irrigation_advice,
          soil_advice: rec.soil_advice,
          recommended_products: rec.recommended_products,
          summary: rec.summary,
        })
        .select()
        .single();
      if (!error && data) {
        const saved = data as unknown as AnalysisRecord;
        // Also mirror into localStorage for instant history
        const all = readLS();
        all.unshift(saved);
        writeLS(all);
        return saved;
      }
    } catch {
      // fall through to localStorage
    }
  }

  const all = readLS();
  all.unshift(record);
  writeLS(all);
  return record;
}

export async function fetchAnalysis(id: string): Promise<AnalysisRecord | null> {
  // localStorage first (instant, has the full image data URL)
  const local = readLS().find((r) => r.id === id);
  if (local) return local;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("crop_analyses")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) return data as unknown as AnalysisRecord;
    } catch {
      // fall through
    }
  }
  return null;
}

export async function fetchAnalysisHistory(farmerId?: string): Promise<AnalysisRecord[]> {
  // Merge: localStorage always has full images; Supabase has cross-device history
  const local = readLS();
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from("crop_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (farmerId) query = query.eq("farmer_id", farmerId);
      const { data, error } = await query;
      if (!error && data) {
        const remote = data as unknown as AnalysisRecord[];
        const seen = new Set(local.map((r) => r.id));
        return [...local, ...remote.filter((r) => !seen.has(r.id))];
      }
    } catch {
      // fall through
    }
  }
  return local;
}
