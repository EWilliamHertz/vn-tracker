-- ============================================================
-- Ouryie Community Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Extended user profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  pronouns TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships / follows
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Conversations (DM threads between two users)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INT DEFAULT 1,
  post_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group posts / activity feed
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "profiles_update" ON user_profiles;
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "friendships_select" ON friendships;
DROP POLICY IF EXISTS "friendships_insert" ON friendships;
DROP POLICY IF EXISTS "friendships_update" ON friendships;
DROP POLICY IF EXISTS "friendships_delete" ON friendships;
CREATE POLICY "friendships_select" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_insert" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update" ON friendships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_delete" ON friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "convos_select" ON conversations;
DROP POLICY IF EXISTS "convos_insert" ON conversations;
DROP POLICY IF EXISTS "convos_update" ON conversations;
CREATE POLICY "convos_select" ON conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "convos_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "convos_update" ON conversations FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid()))
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_id AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid()))
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
CREATE POLICY "groups_select" ON groups FOR SELECT USING (is_public = true OR EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()));
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'));

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gm_select" ON group_members;
DROP POLICY IF EXISTS "gm_insert" ON group_members;
DROP POLICY IF EXISTS "gm_delete" ON group_members;
CREATE POLICY "gm_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "gm_insert" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gm_delete" ON group_members FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select" ON group_posts;
DROP POLICY IF EXISTS "posts_insert" ON group_posts;
DROP POLICY IF EXISTS "posts_update" ON group_posts;
DROP POLICY IF EXISTS "posts_delete" ON group_posts;
CREATE POLICY "posts_select" ON group_posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON group_posts FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid()));
CREATE POLICY "posts_update" ON group_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON group_posts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON post_comments;
DROP POLICY IF EXISTS "comments_insert" ON post_comments;
DROP POLICY IF EXISTS "comments_delete" ON post_comments;
CREATE POLICY "comments_select" ON post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON post_comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select" ON post_likes;
DROP POLICY IF EXISTS "likes_insert" ON post_likes;
DROP POLICY IF EXISTS "likes_delete" ON post_likes;
CREATE POLICY "likes_select" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON post_likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifs_select" ON notifications;
DROP POLICY IF EXISTS "notifs_insert" ON notifications;
DROP POLICY IF EXISTS "notifs_update" ON notifications;
CREATE POLICY "notifs_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs_insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifs_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime for live messaging and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE group_posts;

-- ============================================================
-- SEED DEFAULT GROUPS (public starter communities)
-- ============================================================
INSERT INTO groups (name, slug, description, member_count, is_public, tags, created_by)
VALUES
  ('Attack on Titan', 'attack-on-titan', 'Discuss the legendary series by Hajime Isayama. Final season reactions, lore deep dives, and more!', 1240, true, ARRAY['action', 'dark', 'shounen'], NULL),
  ('Slice of Life Fans', 'slice-of-life', 'For those who love wholesome, everyday stories. Share recs, art, and cozy chats.', 870, true, ARRAY['slice-of-life', 'wholesome', 'romance'], NULL),
  ('Isekai World', 'isekai-world', 'Transported to another world? So are we. The ultimate group for isekai manga and light novel fans.', 2100, true, ARRAY['isekai', 'fantasy', 'adventure'], NULL),
  ('Horror & Thriller Manga', 'horror-manga', 'Junji Ito, Berserk, and everything that keeps you up at night. Enter if you dare.', 630, true, ARRAY['horror', 'thriller', 'dark'], NULL),
  ('Romance Readers', 'romance-readers', 'Shoujo, josei, webtoon romance — we want it all. Ship discussions and recommendations welcome!', 1850, true, ARRAY['romance', 'shoujo', 'josei'], NULL),
  ('Visual Novel Club', 'visual-novel-club', 'Clannad, Steins;Gate, Genshin side stories — all VNs are welcome here.', 430, true, ARRAY['visual-novel', 'story', 'gaming'], NULL),
  ('Manhwa & Webtoons', 'manhwa-webtoons', 'Korean manhwa and webtoon content. Tower of God, Solo Leveling, True Beauty and more.', 980, true, ARRAY['manhwa', 'webtoon', 'korean'], NULL),
  ('Beginner Manga Guide', 'beginner-guide', 'New to manga? Start here! Recommendations, reading order guides, and a welcoming community.', 320, true, ARRAY['beginner', 'guide', 'recommendations'], NULL)
ON CONFLICT (slug) DO NOTHING;
