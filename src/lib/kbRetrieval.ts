// =====================================================
// KB Retrieval — RAG grounding for the AI assistant.
// Embeds the farmer's question with Gemini, then finds the
// most similar dataset-derived knowledge chunks in Supabase
// (pgvector cosine search). Best-effort: any failure returns
// no context so the assistant still works.
// =====================================================
import { supabase } from "./supabaseClient";
import { GEMINI_API_KEY } from "./geminiKey";

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
  const response = await fetch(EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBED_DIMS,
    }),
  });
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
  try {
    const queryEmbedding = await embedQuery(query);
    if (!queryEmbedding.length) return [];

    const { data, error } = await supabase.rpc("match_kb_chunks", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      min_similarity: 0.32,
    });
    if (error) {
      console.warn("[AgriNexus KB] match_kb_chunks failed:", error.message);
      return [];
    }
    return (data || []) as KbMatch[];
  } catch (err) {
    console.warn("[AgriNexus KB] retrieval failed:", err);
    return [];
  }
}

/** Format matches into a compact grounding block for the prompt */
export function formatKbContext(matches: KbMatch[]): string {
  if (!matches.length) return "";
  return matches.map((m) => `• [${m.title}] ${m.content}`).join("\n");
}
