-- =====================================================
-- AgriNexus: Assistant Conversations Table
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id BIGSERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fetching farmer's chat history
CREATE INDEX IF NOT EXISTS idx_assistant_farmer ON assistant_conversations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_assistant_created ON assistant_conversations(created_at);

-- Allow all operations via anon key
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_assistant" ON assistant_conversations FOR ALL USING (true) WITH CHECK (true);
