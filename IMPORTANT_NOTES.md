# Important Notes & Gotchas

## Critical Things to Know

### 1. Admin Email is Hardcoded
**Location**: `app/admin/page.tsx` line ~16

```typescript
const isAdmin = user?.email === 'ewilliamhe@gmail.com';
```

**Problem**: Only you can access the admin panel with this exact email.

**Solutions**:
- For local testing: Keep as is (you're the only dev)
- For staging: Create a table `admin_users` with user IDs instead
- For production: Use environment variable

**TODO Before Launch**: Implement proper admin management system.

---

### 2. Pages Array in Admin Deploy
**FIXED** ✅ 

The admin form was missing image URLs. I've added:
- Episode 1: 9 pages from Pepper & Carrot
- Episode 3: 7 pages from Pepper & Carrot

These pull from peppercarrot.com CDN (public, licensed CC-BY).

---

### 3. Supabase Setup is Manual
**Problem**: No automated migrations in the repo.

**What You Need to Do**:
1. Create Supabase project
2. Manually run SQL from `DATABASE_SCHEMA.md`
3. No version control for schema changes

**TODO for Phase 3**: 
- Add Supabase migrations folder
- Document schema changes as you go
- Use `supabase migration new` command

---

### 4. Image CDN Strategy Matters
**Current**: Direct image URLs from peppercarrot.com

**Issues**:
- External dependency (site could go down)
- Slow for non-optimized images
- No offline reading capability

**Phase 4 Plan**:
- Store pages in Supabase Storage
- Use Vercel Image Optimization
- Enable offline reading via service workers

**For MVP**: Current approach is fine (fast to test).

---

### 5. Search Route Exists But Isn't Implemented
**Location**: `app/search/page.tsx`

The file exists but has no functionality. You'll need to:
1. Create search UI
2. Implement full-text search on Supabase
3. Add filters (genre, author, status)

**Phase 4 task**, not Phase 1.

---

### 6. Reader Paywall Logic Works But Isn't Tested
**Location**: `app/reader/[chapterId]/page.tsx`

The code checks:
```typescript
let hasAccess = !chapter.is_premium;
if (chapter.is_premium && user) {
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single();
  if (sub?.status === 'active') hasAccess = true;
}
```

**Problem**: Polar.sh webhook isn't connected to update `user_subscriptions.status`.

**TODO**: When Phase 3 launches, wire up the webhook:
1. Polar.sh sends webhook on subscription payment
2. API route updates `user_subscriptions` table
3. Reader re-checks status

This is already partially done in `app/api/webhook/polar/route.ts` but needs completion.

---

### 7. No Error Boundaries
**Problem**: If a page crashes, user sees white screen.

**Quick Fix**: Add error boundary wrapper
```typescript
// app/error.tsx
'use client'
export default function Error({ error, reset }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Oops!</h1>
        <p className="text-neutral-400 mb-6">{error?.message || 'Something went wrong'}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
```

**Phase 1 task**: Add this before testing.

---

### 8. Mobile Reader Issues Likely
**Problem**: CSS scroll snapping might not work perfectly on mobile.

**Testing Checklist**:
- [ ] iPhone: Test Safari + Chrome
- [ ] Android: Test Chrome
- [ ] Check image scaling (should fit screen)
- [ ] Check navigation (top bar visibility)
- [ ] Test on slow 3G (image loading)

**Common Fixes**:
```css
/* If images are too large: */
img { max-width: 100vw; height: auto; }

/* If scrolling is janky: */
.reader { scroll-behavior: smooth; }
```

---

### 9. Database Indices Missing
**Performance Problem**: Your queries will slow down as data grows.

**Example** (Episode 1 will load all chapters):
```typescript
const { data: chapter } = await supabase
  .from('chapters')
  .select('*')
  .eq('series_id', params.seriesId)  // ← No index on this!
  .single();
```

**Phase 3 Fix**: Add indices via Supabase SQL:
```sql
CREATE INDEX idx_chapters_series_id ON chapters(series_id);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_reading_lists_user_id ON reading_lists(user_id);
```

---

### 10. Polar.sh Integration Incomplete
**Current**: SDK installed, webhook route created, but not wired up.

**Missing Pieces**:
1. Customer portal link (let users manage subscriptions)
2. Webhook signature verification
3. Product/price setup in Polar.sh
4. Testing webhook locally (use ngrok or Polar sandbox)

**Phase 3 task**, but start planning now:
- Set up Polar.sh products (Free, Supporter, Premium tiers)
- Test webhook on staging
- Document payment flow for creators

---

### 11. Comments Moderation Is Undefined
**Problem**: Once you add comments, you need moderation.

**Plan Ahead**:
- Spam filter (flag system exists in schema)
- Admin dashboard to review flagged comments
- Automated rules (block certain words, etc.)
- Creator ability to delete their own comments

**Phase 2 addition**: After basic comments work, add moderation.

---

### 12. Email Notifications Not Set Up
**Missing**: When users get responses to comments, they should get emails.

**Setup Needed** (Phase 2):
1. Add SendGrid or Resend account
2. Create email templates
3. Trigger emails on:
   - New comment reply
   - New reviews on followed series
   - New chapter in reading list

---

### 13. SEO Will Need Work
**Current**: Basic Next.js defaults, no dynamic meta tags.

**Phase 5 tasks**:
- Add `next-seo` for dynamic title/description per manga
- Generate sitemap for all manga
- OpenGraph images per title
- Schema markup (JSON-LD) for manga

**For MVP**: Not critical, but plan ahead.

---

### 14. No User Profile Pages
**Exists**: Auth system and user management in Supabase

**Missing**:
- `/user/[userId]` profile page
- Show reading history, reviews, lists
- Bio, avatar, socials
- Follow system (if you want social features)

**Phase 4 consideration**: Drives community engagement.

---

### 15. Cost Considerations

| Service | Free Tier | When You'll Hit Limits |
|---------|-----------|---|
| **Supabase** | 500MB DB, 50k MAU | ~5000 users |
| **Vercel** | Fast enough | ~10k concurrent |
| **Polar.sh** | Free plan available | After revenue |
| **SendGrid** | 100 emails/day free | When notifications launch |

**Recommendation**: Use free tiers for Phase 1-2. Upgrade strategically in Phase 4-5.

---

## Checklist Before You Ship (Phase 1)

- [ ] Database tables created in Supabase
- [ ] Admin panel tested locally
- [ ] Reader tested on desktop + mobile
- [ ] No console errors
- [ ] Login/signup flow works
- [ ] Images load properly
- [ ] Error page added (error.tsx)
- [ ] Environment variables documented
- [ ] Admin email changed for your testing (or left as is)

---

## Next Phase Gotchas

### Phase 2 Gotchas
- Comments need moderation (anti-spam)
- Rating algorithm (handle 1 vs 1000 ratings)
- Reading list privacy (public/private options)

### Phase 3 Gotchas
- Creator onboarding is complex (tax info, etc.)
- Polar.sh has subtle webhook timing issues
- Analytics calculation needs careful SQL

### Phase 4 Gotchas
- Recommendation algorithms are hard to get right
- Email deliverability needs proper setup
- Search indexing needs tuning

---

## Quick Debugging Tips

### "Can't connect to Supabase"
```bash
# Check your .env.local
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# If empty, you forgot to source:
source .env.local
```

### "User not authenticated"
- Check Supabase Auth dashboard (Auth → Users)
- Verify email confirmation (if needed)
- Clear browser cookies and try again

### "Chapter shows 'not found'"
- Check Supabase Data Editor (Database → chapters)
- Verify chapter_id matches URL param
- Check that series_id foreign key is correct

### "Admin access denied"
- Verify email exactly matches `ewilliamhe@gmail.com`
- Check console for user object
- Try incognito/private mode

---

## Bonus Tips

1. **Test Locally First**: Always test features locally before pushing
2. **Keep SQL Migrations**: Save a migration folder even if manual for now
3. **Version Your API**: If you add API routes, version them (/api/v1/)
4. **Document Changes**: Add to CHANGELOG.md as you go
5. **Ask for User Feedback**: Beta test with 5-10 real creators early

---

**Questions?** The files in `/tasklet/agent/home/` have much more detail. Start with `VN_TRACKER_SUMMARY.md` for the big picture.

Good luck! 🚀
