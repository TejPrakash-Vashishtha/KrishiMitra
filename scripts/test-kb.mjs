// ============================================================
// test-kb.mjs — one-off sanity check for the KB retrieval layer.
//   bun scripts/test-kb.mjs "how to control paddy blast"
//
// Checks, in order:
//   1. kb_chunks table is readable with the anon key (row count)
//   2. match_kb_chunks RPC exists (zero-vector probe → empty but no error)
//   3. keyword fallback scoring returns sensible matches
// ============================================================
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ubhavqvejgapzmmpdulb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGF2cXZlamdhcHptbXBkdWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjQ1NjcsImV4cCI6MjEwNDAwMDU2N30.zKaVMtZsLqWWJ_1KoE5Ve2maUgWTtnjvZk-fo2rhBWU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const q = process.argv[2] || "how to control paddy blast disease";

// ---- 1. rows readable? ----
const { data: rows, error: rowsErr } = await supabase
  .from("kb_chunks")
  .select("source,title,content")
  .order("id", { ascending: true });
if (rowsErr) {
  console.error("❌ kb_chunks not readable with anon key:", rowsErr.message);
  process.exit(1);
}
console.log(`✅ kb_chunks readable — ${rows.length} rows ingested`);

// ---- 2. RPC exists? (zero vector → no matches expected, but no error) ----
const zeroVec = new Array(768).fill(0);
const { data: rpcData, error: rpcErr } = await supabase.rpc("match_kb_chunks", {
  query_embedding: zeroVec,
  match_count: 3,
  min_similarity: 0.32,
});
if (rpcErr) {
  console.warn("⚠️  match_kb_chunks RPC problem:", rpcErr.message);
} else {
  console.log(`✅ match_kb_chunks RPC OK (zero-vector probe returned ${rpcData.length} matches, expected 0)`);
}

// ---- 3. keyword fallback scoring (mirrors src/lib/kbRetrieval.ts) ----
const STOP = new Set([
  "the", "and", "for", "with", "how", "what", "why", "when", "where", "which", "who",
  "that", "this", "is", "are", "a", "an", "to", "of", "in", "on", "do", "does", "can",
  "should", "will", "my", "our", "you", "your", "please", "tell", "me", "about", "it",
]);
const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\u0980-\u09FF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));

const terms = tokenize(q);
console.log(`\nquery terms: [${terms.join(", ")}]`);

const scored = [];
for (const row of rows) {
  const titleTerms = tokenize(row.title);
  const contentTerms = tokenize(row.content);
  let score = 0;
  for (const term of terms) {
    const titleHits = titleTerms.filter((t) => t === term).length;
    const contentHits = contentTerms.filter((t) => t === term).length;
    if (titleHits) score += titleHits * 3;
    if (contentHits) score += contentHits;
  }
  const lowered = q.toLowerCase();
  if (lowered.length > 8 && row.content.toLowerCase().includes(lowered)) score += 5;
  if (score > 0) scored.push({ row, score });
}
scored.sort((a, b) => b.score - a.score);

console.log(`\ntop keyword matches for "${q}":`);
for (const { row, score } of scored.slice(0, 6)) {
  console.log(`  ${score.toFixed(1)}  [${row.title}]  ${row.content.slice(0, 90)}...`);
}
if (!scored.length) console.log("  (no matches — check dataset coverage)");
