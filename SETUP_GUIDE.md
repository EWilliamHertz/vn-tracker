# VN-Tracker Local Development Setup

## Prerequisites
- Node.js 18+ and npm/yarn
- A Supabase account (free tier works)
- Git

## Step 1: Clone & Install

```bash
git clone https://github.com/EWilliamHertz/vn-tracker.git
cd vn-tracker
npm install
```

## Step 2: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings > API** and copy:
   - `Project URL`
   - `Publishable Key` (anon key)

3. Create `.env.local`:
```bash
cp .env.example .env.local
# Edit with your credentials:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Step 3: Create Database Tables

Go to Supabase Dashboard → **SQL Editor** and run the queries from `DATABASE_SCHEMA.md`.

**Quick SQL Cheatsheet:**

```sql
-- Table 1: manga_series
CREATE TABLE manga_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  genre TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'ongoing',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: chapters
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pages TEXT[] NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(series_id, chapter_number)
);

-- Table 3: user_subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'inactive',
  stripe_subscription_id TEXT,
  polar_subscription_id TEXT,
  tier TEXT DEFAULT 'supporter',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Step 4: Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Admin Panel

1. Sign up with email `ewilliamhe@gmail.com` (hardcoded for admin access)
   - In local dev, check your Supabase **Auth > Users** to confirm signup
2. Go to `/admin` 
3. Click "Index and Deploy" on Episode 1
4. Go back to home — you should see **Pepper & Carrot** in the sidebar

## Troubleshooting

**"Connection refused" error**
- Verify your `.env.local` has the correct Supabase URL

**"User not authenticated"**
- Make sure you signed up first at `/auth/sign-up`
- Check Supabase Auth dashboard

**Admin access denied**
- The email must match `ewilliamhe@gmail.com` exactly
- Edit `app/admin/page.tsx` to change the admin email for your testing

---

## Next Steps

1. Test the reader with Episode 1
2. Explore the codebase structure in `/app` and `/components`
3. Read the roadmap in `vn-tracker-assessment.md`
4. Start Phase 2: Community features!

