// =====================================================
// KB Retrieval — RAG grounding for the AI assistant.
//
// PRIMARY: embed the farmer's question with Gemini, then find the
// most similar dataset-derived knowledge chunks in Supabase
// (pgvector cosine search via match_kb_chunks).
//
// FALLBACK: if the embedding API is out of quota (429), the RPC is
// missing, or no vector match clears the similarity threshold, we
// fall back to a lightweight keyword (term-overlap) search over the
// SAME already-ingested chunks stored in the kb_chunks table. This
// keeps the AI grounded in the source dataset even when the free
// Gemini embedding quota is exhausted.
// =====================================================
import { supabase } from "./supabaseClient";
import { GEMINI_API_KEY } from "./geminiKey";
import { fetchWithTimeout } from "./net";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

export interface KbMatch {
  source: string;
  title: string;
  content: string;
  similarity: number;
}

/** Embed a short query text into a 768-dim vector */
export async function embedQuery(text: string): Promise<number[]> {
  // Bounded: a stalled embedding call must not delay the chat answer.
  const response = await fetchWithTimeout(
    EMBED_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: EMBED_DIMS,
      }),
    },
    10000
  );
  if (!response.ok) throw new Error(`Embedding error: ${response.status}`);
  const data = await response.json();
  return data.embedding?.values || [];
}

/**
 * Fetch the most relevant knowledge chunks for a farmer's question.
 * Returns [] when Supabase is unavailable or nothing matches well.
 */
export async function retrieveKb(query: string, matchCount: number = 6): Promise<KbMatch[]> {
  if (!supabase || !query.trim()) return [];

  // ---- PRIMARY: pgvector cosine search (needs embedding quota) ----
  try {
    const queryEmbedding = await embedQuery(query);
    if (queryEmbedding.length) {
      const { data, error } = await supabase.rpc("match_kb_chunks", {
        query_embedding: queryEmbedding,
        match_count: matchCount,
        min_similarity: 0.32,
      });
      if (!error && data && data.length) {
        return (data as KbMatch[]).sort((a, b) => b.similarity - a.similarity).slice(0, matchCount);
      }
      if (error) {
        console.warn("[AgriNexus KB] match_kb_chunks failed:", error.message);
      }
    }
  } catch (err) {
    // Quota (429), network, or other transient failure — fall through to keyword search.
    console.warn("[AgriNexus KB] embedding search unavailable, using keyword fallback:", err);
  }

  // ---- FALLBACK: keyword/term-overlap search over ingested chunks ----
  return keywordSearch(query, matchCount);
}

/**
 * Local keyword search over the chunks already stored in Supabase.
 * Does not require the embedding API, so it works on the free tier.
 */
async function keywordSearch(query: string, matchCount: number = 6): Promise<KbMatch[]> {
  const rows = await loadKbRows();
  if (!rows.length) return [];

  const terms = tokenize(query);
  if (!terms.length) return [];

  const scored: KbMatch[] = [];
  for (const row of rows) {
    const titleTerms = tokenize(row.title);
    const contentTerms = tokenize(row.content);

    let score = 0;
    for (const term of terms) {
      // Title hits are worth more than body hits.
      const titleHits = titleTerms.filter((t) => t === term).length;
      const contentHits = contentTerms.filter((t) => t === term).length;
      if (titleHits) score += titleHits * 3;
      if (contentHits) score += contentHits;
    }

    // Small bonus if any full phrase (2+ words) appears verbatim.
    const loweredQuery = query.toLowerCase();
    if (loweredQuery.length > 8 && row.content.toLowerCase().includes(loweredQuery)) score += 5;

    // Require a minimum score so a single incidental word match
    // doesn't pull an unrelated chunk into the grounding context.
    if (score >= 2) {
      scored.push({ source: row.source, title: row.title, content: row.content, similarity: score });
    }
  }

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount)
    .map((m) => ({ ...m, similarity: normalizeScore(m.similarity) }));
}

// ---- in-memory cache of the ingested chunks ----
let kbRowCache: Array<{ source: string; title: string; content: string }> | null = null;
let kbRowCacheAt = 0;
const KB_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function loadKbRows(): Promise<Array<{ source: string; title: string; content: string }>> {
  if (kbRowCache && Date.now() - kbRowCacheAt < KB_CACHE_TTL) return kbRowCache;
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("kb_chunks")
      .select("source,title,content")
      .order("id", { ascending: true });
    if (error) {
      console.warn("[AgriNexus KB] loadKbRows failed:", error.message);
      return [];
    }
    kbRowCache = (data || []) as Array<{ source: string; title: string; content: string }>;
    kbRowCacheAt = Date.now();
    return kbRowCache;
  } catch (err) {
    console.warn("[AgriNexus KB] loadKbRows error:", err);
    return [];
  }
}

// ---- helpers ----
function tokenize(text: string): string[] {
  const STOP = new Set([
    "the", "and", "for", "with", "how", "what", "why", "when", "where", "which", "who",
    "that", "this", "is", "are", "a", "an", "to", "of", "in", "on", "do", "does", "can",
    "should", "will", "my", "our", "you", "your", "please", "tell", "me", "about", "it",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\u0980-\u09FF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0B80-\u0BFF]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/** Convert a raw term-count score into a 0..1 pseudo-similarity. */
function normalizeScore(score: number): number {
  if (score <= 0) return 0;
  // Cap at ~40 raw hits → ~1.0 so a highly relevant doc reads as very similar.
  return Math.min(1, score / 40);
}

/** Format matches into a compact grounding block for the prompt */
export function formatKbContext(matches: KbMatch[]): string {
  if (!matches.length) return "";
  return matches.map((m) => `• [${m.title}] ${m.content}`).join("\n");
}
