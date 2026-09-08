-- ============================================================
-- 005: Knowledge base for RAG (datasets → embeddings → retrieval)
-- Powers the AI assistant with grounded answers from the CSV
-- datasets in /datasets (crop yields, soil, weather, markets).
--
-- HOW TO APPLY: Supabase Dashboard → SQL Editor → paste & run.
-- ============================================================

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Knowledge chunks table (aggregated dataset facts, embedded)
create table if not exists kb_chunks (
  id bigint generated always as identity primary key,
  source text not null,                -- e.g. 'crop_yield', 'state_soil_data'
  title text not null,                 -- e.g. 'Yield — Rice — Odisha'
  content text not null,               -- the fact text that gets embedded
  embedding vector(768) not null,      -- gemini-embedding-001 @ 768 dims
  created_at timestamptz not null default now()
);

-- Fast cosine-similarity search
create index if not exists kb_chunks_embedding_idx
  on kb_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 3. Similarity search RPC used by the app (cosine distance)
create or replace function match_kb_chunks(
  query_embedding vector(768),
  match_count int default 6,
  min_similarity float default 0.32
)
returns table (
  id bigint,
  source text,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.source,
    c.title,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from kb_chunks c
  where 1 - (c.embedding <=> query_embedding) > min_similarity
  order by c.embedding <=> query_embedding asc
  limit least(match_count, 20);
$$;

-- 4. Row-level security
-- This table only contains public aggregated dataset facts, so anon
-- read AND write (used by the one-time ingest script) are allowed.
-- NOTE for production hardening: drop the insert policy and run the
-- ingest script with the service_role key instead.
alter table kb_chunks enable row level security;

drop policy if exists "public read kb_chunks" on kb_chunks;
create policy "public read kb_chunks"
  on kb_chunks for select to anon, authenticated using (true);

drop policy if exists "public insert kb_chunks" on kb_chunks;
create policy "public insert kb_chunks"
  on kb_chunks for insert to anon, authenticated with check (true);

drop policy if exists "public delete kb_chunks" on kb_chunks;
create policy "public delete kb_chunks"
  on kb_chunks for delete to anon, authenticated using (true);
