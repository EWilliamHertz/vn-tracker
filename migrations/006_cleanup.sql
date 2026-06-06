-- =====================================================
-- 006: CLEANUP — Remove old data, fix groups
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Delete old manga imports that have non-MangaDex UUIDs as IDs
-- These are the ~100 manga from the first import where ID doesn't match
-- the MangaDex UUID in the cover URL. They can't load chapters.
DELETE FROM manga_series
WHERE image_url IS NOT NULL 
  AND image_url LIKE '%mangadex.org/covers/%'
  AND id::text != split_part(split_part(image_url, 'covers/', 2), '/', 1);

-- 2. Also delete any manga without cover URLs
DELETE FROM manga_series WHERE image_url IS NULL OR image_url = '';

-- 3. Reset ALL group member counts to 0 (remove fake numbers)
UPDATE groups SET member_count = 0;

-- 4. Delete all fake group_members entries (no real users joined yet)
DELETE FROM group_members;

-- 5. Delete seeded group posts (if any)
DELETE FROM group_posts;

-- 6. Verify results
SELECT 'Remaining manga:' as info, count(*) as count FROM manga_series
UNION ALL
SELECT 'Groups (kept):' as info, count(*) as count FROM groups
UNION ALL
SELECT 'Group members (should be 0):' as info, count(*) as count FROM group_members;
