'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface SeriesDetail {
  id: string;
  slug: string;
  title: string;
  description?: string;
  cover_url?: string;
  author?: string;
  status: string;
  series_type: string;
  genres: string[];
  rating_count: number;
  average_rating: number;
  view_count: number;
  created_at: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title?: string;
  published_at?: string;
}

interface Review {
  id: string;
  rating: number;
  review?: string;
  user_id: string;
  created_at: string;
}

export default function SeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string>('');
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [inLibrary, setInLibrary] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch series
        const { data: seriesData } = await supabase
          .from('manga_series')
          .select('*')
          .eq('slug', slug)
          .single();

        if (seriesData) {
          setSeries(seriesData);

          // Fetch chapters
          const { data: chaptersData } = await supabase
            .from('chapters')
            .select('id, chapter_number, title, published_at')
            .eq('series_id', seriesData.id)
            .order('chapter_number', { ascending: false });

          setChapters(chaptersData || []);

          // Fetch reviews
          const { data: reviewsData } = await supabase
            .from('ratings_reviews')
            .select('*')
            .eq('series_id', seriesData.id)
            .order('created_at', { ascending: false })
            .limit(5);

          setReviews(reviewsData || []);

          // Check if user has rated
          const { data: userAuth } = await supabase.auth.getUser();
          if (userAuth.user) {
            const { data: userReview } = await supabase
              .from('ratings_reviews')
              .select('rating')
              .eq('series_id', seriesData.id)
              .eq('user_id', userAuth.user.id)
              .single();

            if (userReview) {
              setUserRating(userReview.rating);
            }

            // Check library
            const { data: libraryEntry } = await supabase
              .from('user_library')
              .select('id')
              .eq('series_id', seriesData.id)
              .eq('user_id', userAuth.user.id)
              .single();

            if (libraryEntry) {
              setInLibrary(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching series:', error);
        toast.error('Failed to load series');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleAddToLibrary = async () => {
    try {
      const supabase = createClient();
      const { data: userAuth } = await supabase.auth.getUser();

      if (!userAuth.user) {
        toast.error('Please sign in to add to library');
        return;
      }

      if (!series) return;

      const { error } = await supabase.from('user_library').insert({
        user_id: userAuth.user.id,
        series_id: series.id,
        status: 'reading',
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in your library');
        } else {
          throw error;
        }
      } else {
        setInLibrary(true);
        toast.success('Added to library!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add to library');
    }
  };

  const handleRate = async (rating: number) => {
    try {
      const supabase = createClient();
      const { data: userAuth } = await supabase.auth.getUser();

      if (!userAuth.user) {
        toast.error('Please sign in to rate');
        return;
      }

      if (!series) return;

      const { error } = await supabase.from('ratings_reviews').upsert({
        user_id: userAuth.user.id,
        series_id: series.id,
        rating,
      });

      if (error) throw error;

      setUserRating(rating);
      toast.success('Rating saved!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save rating');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-300">Loading series...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Series not found</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Go home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <nav className="bg-slate-800/50 border-b border-slate-700 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar - Cover & Actions */}
          <div className="md:col-span-1">
            {/* Cover */}
            <div className="bg-slate-700 rounded-lg overflow-hidden mb-6">
              {series.cover_url ? (
                <img
                  src={series.cover_url}
                  alt={series.title}
                  className="w-full"
                />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center bg-slate-600 text-slate-400">
                  No cover
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 mb-6">
              {chapters.length > 0 && (
                <Link
                  href={`/reader/${series.slug}/${chapters[0].chapter_number}`}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-semibold transition"
                >
                  Start Reading
                </Link>
              )}
              <button
                onClick={handleAddToLibrary}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  inLibrary
                    ? 'bg-slate-600 text-slate-300 cursor-default'
                    : 'border border-blue-600 text-blue-400 hover:bg-blue-600/10'
                }`}
              >
                {inLibrary ? '✓ In Library' : 'Add to Library'}
              </button>
            </div>

            {/* Rating */}
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
              <p className="text-slate-300 text-sm mb-3">Your Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className={`text-2xl transition ${
                      star <= userRating ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Average Rating</span>
                <span className="text-white font-semibold">
                  {series.average_rating.toFixed(1)}/5 ({series.rating_count})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Views</span>
                <span className="text-white font-semibold">
                  {series.view_count.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className="text-white font-semibold capitalize">{series.status}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Title & Meta */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{series.title}</h1>
              {series.author && (
                <p className="text-slate-400 mb-4">by {series.author}</p>
              )}
              {series.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {series.genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {series.description && (
                <p className="text-slate-300 leading-relaxed">{series.description}</p>
              )}
            </div>

            {/* Chapters */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Chapters ({chapters.length})
              </h2>
              {chapters.length === 0 ? (
                <p className="text-slate-400">No chapters yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {chapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/reader/${series.slug}/${chapter.chapter_number}`}
                      className="block bg-slate-700/50 hover:bg-slate-700 p-3 rounded-lg transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">
                          Chapter {chapter.chapter_number}
                          {chapter.title && `: ${chapter.title}`}
                        </span>
                        {chapter.published_at && (
                          <span className="text-sm text-slate-400">
                            {new Date(chapter.published_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-slate-400">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < review.rating
                                  ? 'text-yellow-400'
                                  : 'text-slate-500'
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-slate-300">{review.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
