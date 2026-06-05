# VN-Tracker Database Schema

## Tables Overview

### `manga_series`
Core table for all manga/visual novel titles.

```sql
CREATE TABLE manga_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  genre TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'ongoing', -- 'ongoing', 'completed', 'hiatus'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `chapters`
Individual chapters/episodes per series.

```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pages TEXT[] NOT NULL, -- Array of image URLs
  is_premium BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(series_id, chapter_number)
);
```

### `auth.users` (Supabase Built-in)
Supabase automatically manages user authentication.

### `user_subscriptions`
Tracks which users have active subscriptions.

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'cancelled'
  stripe_subscription_id TEXT,
  polar_subscription_id TEXT,
  tier TEXT DEFAULT 'supporter', -- 'supporter', 'premium', 'creator'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Planned Tables (Phase 2+)

### `chapter_ratings`
Five-star ratings per chapter.

```sql
CREATE TABLE chapter_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter_id, user_id)
);
```

### `chapter_comments`
Comments/reviews on chapters.

```sql
CREATE TABLE chapter_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES chapter_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  contains_spoiler BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `reading_lists`
User-created lists (Reading Now, Completed, etc.).

```sql
CREATE TABLE reading_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'reading', -- 'reading', 'completed', 'on_hold', 'dropped'
  progress_chapter INTEGER DEFAULT 1,
  last_read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, series_id)
);
```

---

## Setup Checklist

- [ ] Create all tables in Supabase console
- [ ] Enable RLS (Row-Level Security) on user-specific tables
- [ ] Add indices on frequently-queried columns:
  - `chapters(series_id)`
  - `user_subscriptions(user_id)`
  - `chapter_ratings(chapter_id)`
  - `reading_lists(user_id)`
- [ ] Test foreign key relationships

