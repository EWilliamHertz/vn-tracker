-- Community Reader Schema for Cozy Haven
-- Run this in your Supabase SQL Editor

-- Extended user profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  pronouns TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Manga/VN Series metadata
CREATE TABLE IF NOT EXISTS manga_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  author TEXT,
  status TEXT CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  series_type TEXT CHECK (series_type IN ('manga', 'manhwa', 'manhua', 'light_novel', 'visual_novel')),
  genres TEXT[] DEFAULT '{}',
  rating_count INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  view_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chapters organization
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  chapter_number DECIMAL(6,2) NOT NULL,
  title TEXT,
  description TEXT,
  is_paywalled BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(series_id, chapter_number)
);

-- Chapter pages
CREATE TABLE IF NOT EXISTS chapter_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT, -- Path in Supabase Storage
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter_id, page_number)
);

-- User library (tracking what they're reading)
CREATE TABLE IF NOT EXISTS user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('reading', 'completed', 'planning', 'dropped')) DEFAULT 'reading',
  last_chapter_read DECIMAL(6,2),
  notes TEXT,
  bookmarked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, series_id)
);

-- Ratings and reviews
CREATE TABLE IF NOT EXISTS ratings_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, series_id)
);

-- Community discussions (threads)
CREATE TABLE IF NOT EXISTS discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES manga_series(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  comment_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Discussion comments
CREATE TABLE IF NOT EXISTS discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User follows (creators/series)
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_series_id UUID REFERENCES manga_series(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (following_user_id IS NOT NULL OR following_series_id IS NOT NULL)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_chapter', 'new_review', 'discussion_comment', etc.
  content TEXT NOT NULL,
  related_series_id UUID REFERENCES manga_series(id),
  related_user_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_manga_series_slug ON manga_series(slug);
CREATE INDEX idx_chapters_series_id ON chapters(series_id);
CREATE INDEX idx_user_library_user_id ON user_library(user_id);
CREATE INDEX idx_user_library_series_id ON user_library(series_id);
CREATE INDEX idx_ratings_series_id ON ratings_reviews(series_id);
CREATE INDEX idx_discussion_threads_series_id ON discussion_threads(series_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Row Level Security (RLS) Policies

-- Allow users to read user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read any profile" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow public read of manga_series
ALTER TABLE manga_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read public series" ON manga_series FOR SELECT USING (true);
CREATE POLICY "Admins can manage series" ON manga_series FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- Allow public read of chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Admins can manage chapters" ON chapters FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- User library - users can only see their own
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own library" ON user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own library" ON user_library FOR ALL USING (auth.uid() = user_id);

-- Ratings - public read, users can only modify their own
ALTER TABLE ratings_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON ratings_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reviews" ON ratings_reviews FOR ALL USING (auth.uid() = user_id);

-- Discussions - public read, authenticated users can comment
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read discussions" ON discussion_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON discussion_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can edit their own threads" ON discussion_threads FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE discussion_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON discussion_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON discussion_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can edit their own comments" ON discussion_comments FOR UPDATE USING (auth.uid() = user_id);

-- Notifications - users can only read their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create admin_users table if it doesn't exist (you can manage this in Supabase)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- To make yourself an admin, run:
-- INSERT INTO admin_users (user_id) VALUES ('your-user-id-here');
