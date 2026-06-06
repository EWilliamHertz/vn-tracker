'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import OuryieLogo from '@/components/OuryieLogo';
import { BookOpen, ArrowLeft, Star, Users, Calendar, Book, Plus, Check, ChevronDown, Minus, Heart, Share2, ExternalLink, Bookmark, X } from 'lucide-react';

interface Manga {
  id: string;
  title: string;
  author: string;
  description?: string;
  image_url?: string;
  cover_image_url?: string;
  rating?: number;
  status?: string;
  chapter_count?: number;
  source?: string;
  source_url?: string;
  created_at?: string;
}

interface ReadingProgress {
  id: string;
  user_id: string;
  manga_id: string;
  status: string;
  current_chapter: number;
  current_page: number;
  total_chapters: number;
  rating: number | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: 'reading', label: 'Reading', emoji: '📖', color: 'bg-green-500', bg: 'bg-green-900/30 text-green-300 border-green-700' },
  { value: 'completed', label: 'Completed', emoji: '✅', color: 'bg-blue-500', bg: 'bg-blue-900/30 text-blue-300 border-blue-700' },
  { value: 'plan_to_read', label: 'Plan to Read', emoji: '📋', color: 'bg-yellow-500', bg: 'bg-yellow-900/30 text-yellow-300 border-yellow-700' },
  { value: 'on_hold', label: 'On Hold', emoji: '⏸️', color: 'bg-orange-500', bg: 'bg-orange-900/30 text-orange-300 border-orange-700' },
  { value: 'dropped', label: 'Dropped', emoji: '❌', color: 'bg-red-500', bg: 'bg-red-900/30 text-red-300 border-red-700' },
];

export default function MangaDetailPage() {
  const params = useParams();
  const mangaId = params.id as string;

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [chapterInput, setChapterInput] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [imgError, setImgError] = useState(false);

  const supabase = createClient();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Set dynamic tab title
  useEffect(() => {
    if (manga?.title) {
      document.title = `Ouryie — ${manga.title}`;
    }
    return () => { document.title = 'Ouryie — Manga & Visual Novel Community'; };
  }, [manga?.title]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: mangaData, error: fetchError } = await supabase
          .from('manga_series')
          .select('*')
          .eq('id', mangaId)
          .single();

        if (fetchError || !mangaData) {
          setError('Manga not found');
          setLoading(false);
          return;
        }

        setManga(mangaData);

        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          const { data: progressData } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('manga_id', mangaId)
            .maybeSingle();

          if (progressData) {
            setProgress(progressData);
            setChapterInput(String(progressData.current_chapter || 0));
            setUserRating(progressData.rating || 0);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load manga');
      } finally {
        setLoading(false);
      }
    };

    if (mangaId) fetchData();
  }, [mangaId]);

  const addToLibrary = async (status: string) => {
    if (!user || !manga) return;
    setSaving(true);
    setShowStatusMenu(false);

    try {
      if (progress) {
        const { data, error } = await supabase
          .from('reading_progress')
          .update({
            status,
            updated_at: new Date().toISOString(),
            ...(status === 'reading' && !progress.started_at ? { started_at: new Date().toISOString() } : {}),
            ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
          })
          .eq('id', progress.id)
          .select()
          .single();

        if (error) throw error;
        setProgress(data);
        showToast(`Status updated to "${STATUS_OPTIONS.find(s => s.value === status)?.label}"`);
      } else {
        const { data, error } = await supabase
          .from('reading_progress')
          .insert({
            user_id: user.id,
            manga_id: manga.id,
            status,
            current_chapter: 0,
            current_page: 0,
            total_chapters: manga.chapter_count || 0,
            started_at: status === 'reading' ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;
        setProgress(data);
        setChapterInput('0');
        showToast('Added to your library! 📚');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update. Try again.');
    }
    setSaving(false);
  };

  const removeFromLibrary = async () => {
    if (!progress) return;
    setSaving(true);
    try {
      await supabase.from('reading_progress').delete().eq('id', progress.id);
      setProgress(null);
      setChapterInput('');
      setUserRating(0);
      showToast('Removed from library');
    } catch (err) {
      showToast('Failed to remove');
    }
    setSaving(false);
    setShowStatusMenu(false);
  };

  const updateChapter = async (newChapter: number) => {
    if (!progress || !manga) return;
    const ch = Math.max(0, Math.min(newChapter, manga.chapter_count || 9999));
    setChapterInput(String(ch));

    const updates: any = {
      current_chapter: ch,
      updated_at: new Date().toISOString(),
    };

    if (manga.chapter_count && ch >= manga.chapter_count) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('reading_progress')
      .update(updates)
      .eq('id', progress.id)
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
      if (updates.status === 'completed') showToast('🎉 Marked as completed!');
    }
  };

  const updateRating = async (rating: number) => {
    if (!progress) return;
    setUserRating(rating);

    const { data, error } = await supabase
      .from('reading_progress')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('id', progress.id)
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
      showToast(`Rated ${rating}/10 ⭐`);
    }
  };

  const shareTitle = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: manga?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    }
  };

  const coverUrl = manga?.image_url || manga?.cover_image_url;
  const progressPercent = progress && manga?.chapter_count
    ? Math.round((progress.current_chapter / manga.chapter_count) * 100)
    : 0;
  const currentStatus = STATUS_OPTIONS.find(s => s.value === progress?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] text-white">
        <nav className="border-b border-gray-800 bg-[#12121c]/95 sticky top-0 z-50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Link href="/"><OuryieLogo size={28} /></Link>
            <div className="w-16" />
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="h-[450px] bg-gray-800/50 rounded-2xl animate-pulse" />
            <div className="md:col-span-2 space-y-4">
              <div className="h-10 bg-gray-800/50 rounded-xl w-3/4 animate-pulse" />
              <div className="h-5 bg-gray-800/50 rounded w-1/3 animate-pulse" />
              <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] text-white">
        <nav className="border-b border-gray-800 bg-[#12121c]/95 sticky top-0 z-50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Link href="/"><OuryieLogo size={28} /></Link>
            <div className="w-16" />
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <BookOpen className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-3">Manga Not Found</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">{error || 'This title doesn\'t exist or may have been removed.'}</p>
          <Link href="/browse" className="inline-block px-8 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl transition-all font-semibold">
            Browse All Titles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#8b5cf6] text-white px-6 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-3">
          {toast}
          <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#12121c]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" /> Browse
          </Link>
          <Link href="/"><OuryieLogo size={28} /></Link>
          <div className="flex items-center gap-3">
            <button onClick={shareTitle} className="text-gray-400 hover:text-white transition-all" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            {user && (
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-all text-sm">
                Library
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Banner — blurred cover bg */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6]/20 to-[#6d28d9]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a2e]" />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cover */}
          <div className="md:col-span-1">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800 bg-gray-900 sticky top-24">
              {coverUrl && !imgError ? (
                <img
                  src={coverUrl}
                  alt={manga.title}
                  className="w-full h-auto object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-[#8b5cf6]/30 to-[#6d28d9]/30 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-[#8b5cf6] mx-auto mb-3" />
                    <p className="text-gray-300 text-sm font-medium px-4">{manga.title}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-6 pb-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{manga.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {manga.author && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{manga.author}</span>
                  </div>
                )}
                {manga.status && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    manga.status === 'ongoing'
                      ? 'bg-green-900/30 text-green-300 border-green-800'
                      : manga.status === 'completed'
                      ? 'bg-blue-900/30 text-blue-300 border-blue-800'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                    {manga.status.charAt(0).toUpperCase() + manga.status.slice(1)}
                  </span>
                )}
                {manga.chapter_count ? (
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Book className="w-3.5 h-3.5" />
                    {manga.chapter_count} chapters
                  </span>
                ) : null}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => progress ? setShowStatusMenu(!showStatusMenu) : addToLibrary('reading')}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                      progress
                        ? `${currentStatus?.bg || 'bg-gray-800'} border hover:brightness-110`
                        : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white'
                    } ${saving ? 'opacity-50' : ''}`}
                  >
                    {progress ? (
                      <>
                        <Bookmark className="w-4 h-4" />
                        {currentStatus?.emoji} {currentStatus?.label}
                        <ChevronDown className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add to Library
                      </>
                    )}
                  </button>

                  {showStatusMenu && (
                    <div className="absolute top-14 left-0 bg-[#23232f] border border-gray-700 rounded-xl shadow-2xl py-2 w-56 z-50">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => addToLibrary(opt.value)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-gray-800 transition-all flex items-center gap-3 text-sm ${
                            progress?.status === opt.value ? 'text-[#8b5cf6]' : 'text-gray-300'
                          }`}
                        >
                          <span>{opt.emoji}</span>
                          <div className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                          {opt.label}
                          {progress?.status === opt.value && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      ))}
                      <div className="border-t border-gray-700 mt-1 pt-1">
                        <button
                          onClick={removeFromLibrary}
                          className="w-full text-left px-4 py-2.5 hover:bg-red-900/20 text-red-400 text-sm transition-all"
                        >
                          Remove from Library
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" /> Sign in to Track
                </Link>
              )}

              {manga.source_url && (
                <a
                  href={manga.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all border border-gray-700"
                >
                  <ExternalLink className="w-4 h-4" /> Read on MangaDex
                </a>
              )}
            </div>

            {/* Reading Progress Tracker */}
            {progress && (
              <div className="bg-[#12121c] border border-gray-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Book className="w-5 h-5 text-[#8b5cf6]" />
                    Your Progress
                  </h3>
                  {manga.chapter_count ? (
                    <span className="text-sm text-gray-400">{progressPercent}% complete</span>
                  ) : null}
                </div>

                {manga.chapter_count ? (
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                ) : null}

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 whitespace-nowrap">Chapter:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateChapter((progress.current_chapter || 0) - 1)}
                      className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all border border-gray-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={chapterInput}
                      onChange={(e) => setChapterInput(e.target.value)}
                      onBlur={(e) => updateChapter(Number(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && updateChapter(Number(chapterInput))}
                      className="w-20 text-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#8b5cf6] transition-all"
                    />
                    <button
                      onClick={() => updateChapter((progress.current_chapter || 0) + 1)}
                      className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all border border-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {manga.chapter_count ? (
                    <span className="text-sm text-gray-500">/ {manga.chapter_count}</span>
                  ) : null}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Your Rating:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => updateRating(n)}
                        className="transition-all hover:scale-125 p-0.5"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            n <= (hoverRating || userRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {userRating > 0 && <span className="text-sm text-yellow-400 font-semibold">{userRating}/10</span>}
                </div>

                {progress.updated_at && (
                  <p className="text-xs text-gray-600">
                    Updated {new Date(progress.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            {manga.description && (
              <div className="bg-[#12121c] border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{manga.description}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {manga.chapter_count ? (
                <div className="bg-[#12121c] border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Chapters</p>
                  <p className="text-xl font-bold">{manga.chapter_count}</p>
                </div>
              ) : null}
              {manga.source && (
                <div className="bg-[#12121c] border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Source</p>
                  <p className="text-sm font-semibold capitalize">{manga.source}</p>
                </div>
              )}
              {manga.created_at && (
                <div className="bg-[#12121c] border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Added</p>
                  <p className="text-sm font-semibold">
                    {new Date(manga.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 bg-[#12121c] py-8 px-6 text-center text-gray-500 mt-16">
        <p>&copy; 2025 Ouryie. A space for manga & visual novel lovers.</p>
      </footer>
    </div>
  );
}
