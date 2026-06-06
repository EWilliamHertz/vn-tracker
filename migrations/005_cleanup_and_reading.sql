-- ============================================================
-- 005: Cleanup old manga + reading progress + creator apps
-- Run AFTER 003_community_schema.sql
-- ============================================================

-- 1. REMOVE OLD MANGA with non-MangaDex UUIDs
-- (Keep only manga whose IDs are valid MangaDex UUIDs — the new import)
-- Old manga IDs won't resolve on MangaDex API, so they're dead data.
-- We delete any manga_series row whose ID doesn't appear on MangaDex.
-- Since we can't query MangaDex from SQL, we delete by checking
-- which rows were created before the new import (they have auto-generated UUIDs).
-- 
-- SAFE APPROACH: Just delete duplicates by title — keep the one with a cover image.
-- Actually simplest: delete manga that have no image_url or have non-English titles.
-- 
-- MANUAL: If you want a clean slate, uncomment:
-- TRUNCATE manga_series CASCADE;
-- Then re-run the import from Tasklet.

-- 2. Create reading_progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reading' CHECK (status IN ('reading', 'completed', 'plan_to_read', 'dropped', 'on_hold')),
  current_chapter INT DEFAULT 0,
  current_page INT DEFAULT 0,
  total_chapters INT DEFAULT 0,
  rating FLOAT,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, manga_id)
);

-- 3. Create creator_applications table
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  portfolio_url TEXT,
  content_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS for reading_progress
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rp_select" ON reading_progress;
DROP POLICY IF EXISTS "rp_insert" ON reading_progress;
DROP POLICY IF EXISTS "rp_update" ON reading_progress;
DROP POLICY IF EXISTS "rp_delete" ON reading_progress;

CREATE POLICY "rp_select" ON reading_progress FOR SELECT USING (true);
CREATE POLICY "rp_insert" ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rp_update" ON reading_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rp_delete" ON reading_progress FOR DELETE USING (auth.uid() = user_id);

-- 5. RLS for creator_applications
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ca_insert" ON creator_applications;
DROP POLICY IF EXISTS "ca_select" ON creator_applications;

CREATE POLICY "ca_insert" ON creator_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "ca_select" ON creator_applications FOR SELECT USING (true);

-- 6. Enable realtime for reading progress
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE reading_progress;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
