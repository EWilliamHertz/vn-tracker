# Phase 2: Community Core Implementation Guide

## Overview
Phase 2 transforms VN-Tracker from a reader into a **community hub**. Users will feel invested because they can share opinions, discover what others are reading, and build reputation.

---

## 1. Comments System (Estimated: 3-4 days)

### Database Schema
Already in `DATABASE_SCHEMA.md` as `chapter_comments` table.

### Frontend Components

#### `components/chapter-comments.tsx`
```tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { MessageCircle, Flag, Loader2 } from 'lucide-react'

export function ChapterComments({ chapterId }: { chapterId: string }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replying, setReplying] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [chapterId])

  const fetchComments = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('chapter_comments')
      .select(`
        *,
        user:auth.users(email)
      `)
      .eq('chapter_id', chapterId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })

    if (!error) setComments(data || [])
    setLoading(false)
  }

  const submitComment = async () => {
    if (!newComment.trim()) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Please log in to comment')
      return
    }

    const { error } = await supabase
      .from('chapter_comments')
      .insert({
        chapter_id: chapterId,
        user_id: user.id,
        parent_comment_id: replying,
        content: newComment,
        contains_spoiler: newComment.toLowerCase().includes('[spoiler]')
      })

    if (!error) {
      setNewComment('')
      setReplying(null)
      fetchComments()
    }
  }

  if (loading) return <Loader2 className="animate-spin" />

  return (
    <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold">Discussion ({comments.length})</h3>
      </div>

      {/* Comment Input */}
      <div className="mb-6 pb-6 border-b border-neutral-800">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts... (type [spoiler] for spoiler text)"
          className="w-full bg-neutral-800 text-white p-4 rounded-lg border border-neutral-700 placeholder-neutral-500"
          rows={3}
        />
        <div className="flex justify-end gap-3 mt-3">
          {replying && (
            <button
              onClick={() => setReplying(null)}
              className="text-sm text-neutral-400 hover:text-white"
            >
              Cancel Reply
            </button>
          )}
          <button
            onClick={submitComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold disabled:opacity-50"
          >
            Post Comment
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-200">
                  {comment.user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-neutral-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              {comment.contains_spoiler && (
                <span className="text-xs bg-amber-900 text-amber-200 px-2 py-1 rounded">
                  SPOILER
                </span>
              )}
            </div>
            <p className="text-neutral-300 mb-3">{comment.content}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setReplying(comment.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Reply
              </button>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase
                    .from('chapter_comments')
                    .update({ flagged: true })
                    .eq('id', comment.id)
                  fetchComments()
                }}
                className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1"
              >
                <Flag className="w-3 h-3" /> Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Integration
Add to `app/reader/[chapterId]/page.tsx` before the closing div:
```tsx
import { ChapterComments } from '@/components/chapter-comments'

// Inside the reader page JSX:
<div className="mt-8">
  <ChapterComments chapterId={params.chapterId} />
</div>
```

---

## 2. Rating System (Estimated: 2 days)

### Database Schema
Already in `DATABASE_SCHEMA.md` as `chapter_ratings` table.

### Component: `components/chapter-rating.tsx`
```tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Star } from 'lucide-react'

export function ChapterRating({ chapterId }: { chapterId: string }) {
  const [userRating, setUserRating] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)

  useEffect(() => {
    fetchRating()
  }, [chapterId])

  const fetchRating = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get user's rating
    if (user) {
      const { data } = await supabase
        .from('chapter_ratings')
        .select('rating')
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)
        .single()

      if (data) setUserRating(data.rating)
    }

    // Get average rating
    const { data } = await supabase
      .from('chapter_ratings')
      .select('rating')
      .eq('chapter_id', chapterId)

    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
      setAverageRating(Math.round(avg * 10) / 10)
      setTotalRatings(data.length)
    }
  }

  const handleRate = async (rating: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Please log in to rate')
      return
    }

    // Upsert: update if exists, insert if doesn't
    const { error } = await supabase
      .from('chapter_ratings')
      .upsert(
        { chapter_id: chapterId, user_id: user.id, rating },
        { onConflict: 'chapter_id,user_id' }
      )

    if (!error) {
      setUserRating(rating)
      fetchRating()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="text-sm text-neutral-400 mb-2">Rate this chapter</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= userRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-neutral-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">{averageRating}</div>
        <div className="text-xs text-neutral-400">{totalRatings} ratings</div>
      </div>
    </div>
  )
}
```

---

## 3. Reading Lists (Estimated: 3 days)

### Database Schema
Already in `DATABASE_SCHEMA.md` as `reading_lists` table.

### Component: `components/reading-status.tsx`
```tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BookmarkPlus, Check, Pause, Trash2 } from 'lucide-react'

export function ReadingStatus({ seriesId }: { seriesId: string }) {
  const [status, setStatus] = useState<'reading' | 'completed' | 'on_hold' | 'dropped' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [seriesId])

  const fetchStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('reading_lists')
      .select('status')
      .eq('series_id', seriesId)
      .eq('user_id', user.id)
      .single()

    if (data) setStatus(data.status)
    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Please log in')
      return
    }

    if (newStatus === status) {
      // Remove from list
      await supabase
        .from('reading_lists')
        .delete()
        .eq('series_id', seriesId)
        .eq('user_id', user.id)
      setStatus(null)
    } else {
      // Add/update
      await supabase
        .from('reading_lists')
        .upsert(
          { series_id: seriesId, user_id: user.id, status: newStatus as any },
          { onConflict: 'series_id,user_id' }
        )
      setStatus(newStatus as any)
    }
  }

  if (loading) return null

  return (
    <div className="flex flex-wrap gap-2">
      {[
        { key: 'reading', label: 'Reading Now', icon: BookmarkPlus },
        { key: 'completed', label: 'Completed', icon: Check },
        { key: 'on_hold', label: 'On Hold', icon: Pause },
        { key: 'dropped', label: 'Dropped', icon: Trash2 }
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => updateStatus(key)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
            status === key
              ? 'bg-indigo-600 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
```

---

## Implementation Checklist

- [ ] Create `chapter_ratings` table in Supabase
- [ ] Create `chapter_comments` table in Supabase
- [ ] Create `reading_lists` table in Supabase
- [ ] Build `ChapterComments` component
- [ ] Build `ChapterRating` component
- [ ] Build `ReadingStatus` component
- [ ] Integrate all three into reader page
- [ ] Test commenting, rating, and list updates
- [ ] Add spoiler tag styling
- [ ] Add comment moderation admin view (optional but recommended)

---

## Next: Phase 3 Preview

Once community features are solid, Phase 3 adds:
- Creator dashboard (analytics, earnings)
- Direct tipping
- Creator profiles
- Subscriber-exclusive content tiers

That's when you become a platform creators want to use! 🚀
