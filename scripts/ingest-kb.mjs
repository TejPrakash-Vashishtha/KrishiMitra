// ============================================================
// ingest-kb.mjs — RAG pipeline step 2: embeds the prepared
// knowledge chunks with Gemini and stores them in Supabase
// pgvector for similarity search by the AI assistant.
//
//   bun run kb:ingest
//
// REQUIRES: supabase/migrations/005_kb_chunks.sql applied first.
//
// Resumable: progress is checkpointed to data/kbEmbeddings.jsonl,
// so a re-run after a quota pause continues where it stopped.
// ============================================================
import { readFileSync, writeFileSync, appendFileSync, unlinkSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Same Supabase project as src/lib/supabaseClient.ts
const SUPABASE_URL = "https://ubhavqvejgapzmmpdulb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGF2cXZlamdhcHptbXBkdWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjQ1NjcsImV4cCI6MjEwNDAwMDU2N30.zKaVMtZsLqWWJ_1KoE5Ve2maUgWTtnjvZk-fo2rhBWU";

// Same Gemini key as src/lib/gemini.ts (kept in sync).
// Override with GEMINI_API_KEY env var (bun auto-loads .env) — useful when
// the built-in key's daily embedding quota is exhausted and you have a
// fresh key from a different Google project.
const _k = [65,81,46,65,98,56,82,78,54,73,116,90,118,113,57,55,110,116,112,115,71,81,98,54,55,85,57,85,122,49,73,121,51,75,117,90,82,116,82,111,72,85,80,65,72,122,45,78,48,118,79,57,65];
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || _k.map((c) => String.fromCharCode(c)).join("");
if (process.env.GEMINI_API_KEY) console.log("  using GEMINI_API_KEY from environment");

const EMBED_MODEL = "gemini-embedding-001";
const DIMS = 768;
const INSERT_BATCH = 100;
const CHECKPOINT = "data/kbEmbeddings.jsonl";

const kb = JSON.parse(readFileSync("data/kbChunks.json", "utf8"));
const chunks = kb.chunks;
console.log(`Ingesting ${chunks.length} knowledge chunks → Supabase kb_chunks…`);

// ---------- load checkpoint ----------
const done = new Map(); // index -> embedding
if (existsSync(CHECKPOINT)) {
  for (const line of readFileSync(CHECKPOINT, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      done.set(rec.i, rec.embedding);
    } catch { /* skip bad line */ }
  }
  console.log(`  resumed: ${done.size}/${chunks.length} already embedded`);
}

// ---------- embed remaining with a small concurrent worker pool ----------
const pending = [];
for (let i = 0; i < chunks.length; i++) if (!done.has(i)) pending.push(i);
if (process.env.SKIP_EMBED === "1") {
  console.log("  SKIP_EMBED=1 → storing already-embedded chunks only");
  pending.length = 0;
} else {
  console.log(`  to embed now: ${pending.length}`);
}
// Global rate gate ~1.6 req/s (≈96 RPM, safely under the free-tier limit);
// concurrency absorbs per-call latency. 429s are retried with backoff.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastStart = 0;
async function gate() {
  const now = Date.now();
  const wait = Math.max(0, lastStart + 620 - now);
  lastStart = Math.max(now, lastStart + 620);
  await sleep(wait);
}

async function embedOne(text) {
  for (let attempt = 0; attempt < 7; attempt++) {
    await gate();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${EMBED_MODEL}`,
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: DIMS,
        }),
      }
    );
    if (res.ok) {
      const json = await res.json();
      return json.embedding.values;
    }
    if (res.status === 429 || res.status >= 500) {
      // 429 = quota/rate, 5xx = transient Google-side — both worth retrying
      await sleep(2500 * 2 ** attempt); // 2.5s → 160s backoff
      continue;
    }
    const body = (await res.text()).slice(0, 160);
    throw new Error(`Embedding API ${res.status}: ${body}`);
  }
  throw Object.assign(new Error("persistent server/quota errors after 7 attempts"), { status: 429 });
}

const queue = [...pending];
let processed = 0;
const WORKERS = 4;
let poolError = null;
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    while (queue.length && !poolError) {
      const i = queue.shift();
      try {
        const vector = await embedOne(`${chunks[i].title}. ${chunks[i].content}`);
        done.set(i, vector);
        appendFileSync(CHECKPOINT, JSON.stringify({ i, embedding: vector }) + "\n");
        processed++;
        if (processed % 50 === 0 || !queue.length) {
          console.log(`  embedded ${done.size}/${chunks.length}`);
        }
      } catch (err) {
        poolError = err;
      }
    }
  })
);
if (poolError) {
  if (poolError.status === 429 || poolError.status >= 500) {
    console.error(`\n⚠️  Quota/service issue even after retries — storing the ${done.size} embedded chunks now. Re-run \`bun run kb:ingest\` after the daily reset to finish the rest.`);
    // fall through to partial store below
  } else {
    throw poolError;
  }
}

// ---------- store in Supabase ----------
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const rows = chunks
  .map((c, i) => ({
    source: c.source,
    title: c.title,
    content: c.content,
    embedding: done.get(i),
  }))
  .filter((r) => Array.isArray(r.embedding));

if (!rows.length) {
  console.log("Nothing embedded yet — nothing to store.");
  process.exit(0);
}

console.log("  clearing old rows…");
{
  const { error } = await supabase.from("kb_chunks").delete().neq("id", 0);
  if (error) {
    console.error(`\n❌ Could not clear kb_chunks: ${error.message}`);
    process.exit(1);
  }
}

console.log(`  inserting ${rows.length} rows…`);
for (let i = 0; i < rows.length; i += INSERT_BATCH) {
  const { error } = await supabase.from("kb_chunks").insert(rows.slice(i, i + INSERT_BATCH));
  if (error) {
    console.error(`\n❌ Insert failed at row ${i}: ${error.message}`);
    process.exit(1);
  }
  console.log(`  inserted ${Math.min(i + INSERT_BATCH, rows.length)}/${rows.length}`);
}

if (rows.length === chunks.length) {
  unlinkSync(CHECKPOINT); // clean checkpoint on success
  console.log(`\n✅ Done — ${rows.length} chunks embedded and stored in kb_chunks.`);
} else {
  console.log(`\n✅ Partial store: ${rows.length}/${chunks.length} chunks are now searchable. Re-run \`bun run kb:ingest\` after the quota reset to finish the rest.`);
}
