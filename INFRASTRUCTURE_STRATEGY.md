# Cozy Haven: Infrastructure & Database Strategy

## Database Architecture

### Current Setup: Supabase (PostgreSQL)
**Why Supabase is actually PERFECT:**
- ✅ Hosted PostgreSQL (robust, proven)
- ✅ Built-in auth system (JWT, OAuth, email)
- ✅ Real-time subscriptions (for live community features)
- ✅ Row-level security (RLS) for privacy
- ✅ Storage bucket integration (images!)
- ✅ Generous free tier: 500MB database + 1GB storage
- ✅ Pay-as-you-grow pricing (not $$ until you scale)

**We do NOT need something "better"** — we need to use Supabase *properly*.

---

## Image Hosting Strategy

### Option 1: Supabase Storage (RECOMMENDED) ⭐
**Best for:** Self-contained solution, simple to manage

```
Setup:
1. Enable Storage in Supabase dashboard
2. Create bucket: `manga-covers` (public)
3. Create bucket: `manga-pages` (public)
4. Set public policy for reading, private upload (via API)
```

**Costs:**
- Free tier: 1GB storage included
- Paid: $5/month per GB after

**Upload Flow:**
```typescript
const { data, error } = await supabase.storage
  .from('manga-pages')
  .upload(`series_${seriesId}/page_${pageNum}.png`, file)

// Later: const url = supabase.storage.from('manga-pages').getPublicUrl(path)
```

---

### Option 2: Cloudinary (Free Tier, Image Optimization)
**Best for:** Image resizing, optimization, CDN caching

```
Setup:
1. Create free Cloudinary account
2. Store upload URL & API key in .env
3. Upload via URL transformation
```

**Costs:**
- Free tier: 25GB/month bandwidth
- Auto-optimization (smaller file sizes = faster loads)

**Example:**
```typescript
// Store URL like: https://res.cloudinary.com/your-account/image/upload/w_400/manga/page_1.jpg
// Automatically resizes to 400px wide
```

---

### Option 3: Bunny CDN (Cheapest paid option)
**Best for:** High-scale deployments

- $0.01/GB storage
- $0.01/GB bandwidth (unbeatable)
- Global CDN

**For now: NOT NEEDED** — start with Supabase Storage

---

## Manga/VN Content Import Strategy

### Legal Sources to Scrape

#### 1. MangaDex API (BEST) ✅
- **Free, legal, actively maintained**
- 350M+ manga chapters available
- Open API: https://api.mangadex.org/
- No authentication required

```typescript
// Example: Get manga by title
const response = await fetch(
  'https://api.mangadex.org/manga?title=Attack%20on%20Titan'
)
const manga = await response.json()

// Download cover, chapters, metadata
```

**Bulk Import Workflow:**
```bash
1. Fetch popular manga list from MangaDex
2. For each manga:
   - Store metadata (title, author, cover)
   - Store chapter URLs
   - Download cover image to Supabase Storage
3. Batch insert into postgres `manga_series` table
```

#### 2. ComicK API (VN/Manga)
- https://api.comick.fun/
- Similar to MangaDex, community-driven

#### 3. Official Publisher APIs
- VIZ Media
- Crunchyroll
- J-Novel Club
- *These require auth tokens but are "official" sources*

#### 4. User Submission
- Allow creators to submit their own works
- Moderation queue before publishing
- **This is your differentiator** vs MangaDex

---

## Database Schema for Content

```sql
-- Manga/VN Series
CREATE TABLE manga_series (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_image TEXT, -- URL to Supabase storage
  source TEXT, -- 'mangadex', 'user_submitted', 'official', etc.
  source_id TEXT, -- external ID (e.g., MangaDex ID)
  status TEXT, -- 'ongoing', 'completed', 'hiatus'
  created_at TIMESTAMP DEFAULT now()
);

-- Chapters/Issues
CREATE TABLE chapters (
  id UUID PRIMARY KEY,
  manga_series_id UUID REFERENCES manga_series(id),
  chapter_number INT,
  title TEXT,
  pages JSONB, -- [{page_num: 1, image_url: '...'}, ...]
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- User Reading List
CREATE TABLE user_reading_list (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  manga_series_id UUID REFERENCES manga_series(id),
  status TEXT, -- 'reading', 'planning', 'completed', 'dropped'
  current_chapter INT,
  last_read_at TIMESTAMP,
  rating INT, -- 1-5 stars
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, manga_series_id)
);

-- Community Comments
CREATE TABLE chapter_comments (
  id UUID PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id),
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Ratings & Reviews
CREATE TABLE series_reviews (
  id UUID PRIMARY KEY,
  manga_series_id UUID REFERENCES manga_series(id),
  user_id UUID REFERENCES auth.users(id),
  rating INT, -- 1-5
  review_text TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## Bulk Import Script (Node.js/Python)

```typescript
// scripts/import-mangadex.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVICE KEY for batch ops
)

async function importMangaDex() {
  try {
    // 1. Fetch popular manga
    const mangaList = await fetch(
      'https://api.mangadex.org/manga?limit=100&order[createdAt]=desc'
    ).then(r => r.json())

    for (const manga of mangaList.data) {
      const { id, attributes } = manga
      
      // 2. Download cover
      let coverUrl = null
      if (attributes.posterImage?.imageUrl) {
        const cover = await fetch(attributes.posterImage.imageUrl).then(r => r.arrayBuffer())
        const { data: stored } = await supabase.storage
          .from('manga-covers')
          .upload(`mangadex/${id}.png`, new Blob([cover]))
        
        coverUrl = supabase.storage.from('manga-covers').getPublicUrl(`mangadex/${id}.png`).data?.publicUrl
      }

      // 3. Insert to DB
      await supabase.from('manga_series').upsert({
        id: id,
        title: attributes.title?.en || attributes.canonicalTitle,
        author: attributes.authors?.[0]?.name,
        description: attributes.synopsis,
        cover_image: coverUrl,
        source: 'mangadex',
        source_id: id,
        status: attributes.status
      }, { onConflict: 'source_id' })
    }

    console.log('✅ Imported successfully')
  } catch (error) {
    console.error('Import failed:', error)
  }
}

importMangaDex()
```

**Run with:**
```bash
npm install @supabase/supabase-js
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-mangadex.ts
```

---

## Hosting & Deployment

### Option 1: Vercel (RECOMMENDED) ⭐
- Free tier covers most use cases
- Automatic deployments from GitHub
- Serverless functions (for import scripts, API routes)

```bash
npm i -g vercel
vercel login
vercel  # Deploy!
```

### Option 2: Self-hosted (Advanced)
- Railway, Render, or your own VPS
- More control but more responsibility

**For now: Use Vercel** — it's free and you deploy with `git push`

---

## Free Tier Economics (Before Revenue)

| Service | Free Tier | Cost @Scale |
|---------|-----------|-------------|
| Supabase | 500MB DB + 1GB storage | $5-15/mo |
| Vercel | 100GB bandwidth | Free (!) |
| Cloudinary | 25GB/month | $10+/mo |
| Domain | .me/.io: $5-10/yr | Same |
| **Total** | **FREE** | **~$30/mo** |

You can run profitably until **100K+ monthly active users** without spending a dime.

---

## Implementation Checklist

- [ ] Set up Supabase Storage buckets
- [ ] Create bulk import script for MangaDex
- [ ] Add manual creator submission form
- [ ] Implement image optimization middleware
- [ ] Set up automatic import cron job (daily/weekly)
- [ ] Add user review/rating system
- [ ] Community chat (Supabase Realtime)
- [ ] Search & filtering
- [ ] Deploy to Vercel
- [ ] Set up domain + SSL

---

## What Makes Cozy Haven Special?

**MangaDex has it all, so how do we compete?**

1. **Curation** — Handpicked series, community recommendations
2. **Creator Support** — Easy self-publishing for artists
3. **Community Features** — Comments, reviews, live discussions
4. **Reading Experience** — Beautiful, fast, distraction-free reader
5. **Personalization** — Recommendations based on reading history
6. **No Ads** (paid tier) — Premium experience

Focus on *experience and community* — not content volume.

---

## Next Steps (Priority Order)

1. ✅ Fix auth bugs (done above)
2. Create dashboard (done above)
3. Set up Supabase Storage
4. Build admin panel for manual uploads
5. Build creator submission form
6. Write MangaDex import script
7. Set up community features (comments, ratings)
8. Launch MVP on Vercel
9. Get first 100 users
10. Iterate based on feedback
