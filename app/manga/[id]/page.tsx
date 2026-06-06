'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { extractMangaDexId, getCoverUrl, fetchChapters } from '@/utils/mangadex';
import { ArrowLeft, BookOpen, Star, Bookmark, ChevronDown, ChevronUp, ExternalLink, Loader2, Play, Clock, User, CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Chapter {
  id: string;
  attributes: {
    chapter: string | null;
    title: string | null;
    pages: number;
    publishAt: string;
    translatedLanguage: string;
  };
  relationships: Array<{ type: string; attributes?: { name?: string } }>;
}

export default function MangaDetail() {
  const routeParams = useParams();
  const id = routeParams.id as string;
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [loadingManga, setLoadingManga] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chapterError, setChapterError] = useState('');
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [libraryStatus, setLibraryStatus] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [savingLibrary, setSavingLibrary] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // Load manga from Supabase
  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      const { data, error } = await supabase
        .from('manga_series')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        setLoadingManga(false);
        return;
      }
      setManga(data);
      document.title = `Ouryie — ${data.title}`;

      // Load reading progress
      if (u) {
        const { data: progress } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', u.id)
          .eq('manga_id', id)
          .single();
        if (progress) {
          setLibraryStatus(progress.status);
          setCurrentChapter(progress.current_chapter || 0);
          setUserRating(progress.rating || 0);
        }
      }
      setLoadingManga(false);
    };
    load();
  }, [id]);

  // Load chapters from MangaDex via proxy
  const loadChapters = useCallback(async () => {
    if (!manga) return;
    setLoadingChapters(true);
    setChapterError('');
    try {
      const mangaDexId = extractMangaDexId(manga.image_url || '', id);
      const data = await fetchChapters(mangaDexId, 0, 500);
      const validChapters = (data.data || []).filter((ch: Chapter) => ch.attributes.pages > 0);
      setChapters(validChapters);
      setTotalChapters(data.total || 0);
      if (validChapters.length === 0 && data.total === 0) {
        setChapterError('No English chapters available on MangaDex for this title.');
      } else if (validChapters.length === 0) {
        setChapterError('Chapters exist but have no pages (may be licensed/removed).');
      }
    } catch {
      setChapterError('Could not load chapters. Please try again later.');
    }
    setLoadingChapters(false);
  }, [manga, id]);

  useEffect(() => { loadChapters(); }, [loadChapters]);

  // Save to library
  const saveToLibrary = async (status: string) => {
    if (!user) { toast.error('Sign in to track your reading!'); return; }
    setSavingLibrary(true);
    const { error } = await supabase.from('reading_progress').upsert({
      user_id: user.id,
      manga_id: id,
      status,
      current_chapter: currentChapter,
      rating: userRating,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,manga_id' });
    if (error) toast.error('Failed to save');
    else { setLibraryStatus(status); toast.success(`Marked as ${status}`); }
    setSavingLibrary(false);
  };

  // Update chapter
  const updateChapter = async (ch: number) => {
    if (!user) return;
    setCurrentChapter(ch);
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      manga_id: id,
      current_chapter: ch,
      status: libraryStatus || 'reading',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,manga_id' });
  };

  // Rate manga
  const rateManga = async (rating: number) => {
    if (!user) { toast.error('Sign in to rate!'); return; }
    setUserRating(rating);
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      manga_id: id,
      rating,
      status: libraryStatus || 'plan_to_read',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,manga_id' });
    toast.success(`Rated ${rating}/10`);
  };

  const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 20);
  const statuses = ['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'];

  if (loadingManga) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white">
        <BookOpen className="w-16 h-16 text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Manga Not Found</h1>
        <p className="text-gray-400 mb-6">This title doesn't exist in our catalogue.</p>
        <Link href="/browse" className="text-[#8b5cf6] hover:underline">← Browse all manga</Link>
      </div>
    );
  }

  const coverSrc = getCoverUrl(manga.image_url);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Toaster position="top-center" theme="dark" />
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} /> Browse
          </Link>
          <Link href="/" className="text-xl font-bold text-[#8b5cf6]">Ouryie</Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Cover */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a2e] shadow-2xl">
              {coverSrc ? (
                <img src={coverSrc} alt={manga.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8b5cf6]/20 to-[#6d28d9]/20">
                  <BookOpen className="w-16 h-16 text-[#8b5cf6]/40" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{manga.title}</h1>
            {manga.author && <p className="text-lg text-gray-400 mb-3">by {manga.author}</p>}

            <div className="flex flex-wrap gap-2 mb-4">
              {manga.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  manga.status === 'ongoing' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  manga.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-gray-700/50 text-gray-300 border border-gray-600'
                }`}>
                  {manga.status.charAt(0).toUpperCase() + manga.status.slice(1)}
                </span>
              )}
              {totalChapters > 0 && (
                <span className="px-3 py-1 rounded-full text-sm bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30">
                  {chapters.length} readable chapters
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[...Array(10)].map((_, i) => (
                <button key={i} onClick={() => rateManga(i + 1)}
                  onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125">
                  <Star size={20} className={`${(hoverRating || userRating) > i ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} transition-colors`} />
                </button>
              ))}
              {userRating > 0 && <span className="ml-2 text-sm text-gray-400">{userRating}/10</span>}
            </div>

            {/* Library actions */}
            <div className="flex flex-wrap gap-2 mb-6">
              {statuses.map(s => (
                <button key={s} onClick={() => saveToLibrary(s)} disabled={savingLibrary}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    libraryStatus === s
                      ? 'bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25'
                      : 'bg-[#1a1a2e] text-gray-300 hover:bg-[#252540] border border-gray-700'
                  }`}>
                  {s === 'reading' && '📖 Reading'}
                  {s === 'completed' && '✅ Completed'}
                  {s === 'plan_to_read' && '📋 Plan to Read'}
                  {s === 'on_hold' && '⏸️ On Hold'}
                  {s === 'dropped' && '🗑️ Dropped'}
                </button>
              ))}
            </div>

            {/* Chapter progress */}
            {libraryStatus && (
              <div className="bg-[#1a1a2e] rounded-xl p-4 mb-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Chapter Progress</span>
                  <span className="text-sm text-[#8b5cf6] font-mono">{currentChapter} / {chapters.length || '?'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateChapter(Math.max(0, currentChapter - 1))}
                    className="w-8 h-8 rounded-lg bg-[#252540] hover:bg-[#353560] text-white flex items-center justify-center">−</button>
                  <div className="flex-1 h-2 bg-[#252540] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] rounded-full transition-all duration-300"
                      style={{ width: chapters.length ? `${(currentChapter / chapters.length) * 100}%` : '0%' }} />
                  </div>
                  <button onClick={() => updateChapter(currentChapter + 1)}
                    className="w-8 h-8 rounded-lg bg-[#252540] hover:bg-[#353560] text-white flex items-center justify-center">+</button>
                </div>
              </div>
            )}

            {manga.description && (
              <p className="text-gray-300 leading-relaxed">{manga.description}</p>
            )}
          </div>
        </div>

        {/* Chapters */}
        <div className="bg-[#12121c] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="text-[#8b5cf6]" size={22} />
              <h2 className="text-xl font-bold">Chapters</h2>
            </div>
            {chapters.length > 0 && (
              <Link href={`/manga/${id}/read/${chapters[0].id}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl font-medium transition-colors shadow-lg shadow-[#8b5cf6]/25">
                <Play size={16} /> Start Reading
              </Link>
            )}
          </div>

          {loadingChapters ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#8b5cf6] animate-spin mr-3" />
              <span className="text-gray-400">Loading chapters from MangaDex...</span>
            </div>
          ) : chapterError ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-3">{chapterError}</p>
              <a href={`https://mangadex.org/title/${extractMangaDexId(manga.image_url || '', id)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#8b5cf6] hover:underline">
                <ExternalLink size={14} /> View on MangaDex
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {displayedChapters.map((ch, idx) => {
                const chNum = ch.attributes.chapter || `${idx + 1}`;
                const group = ch.relationships.find(r => r.type === 'scanlation_group');
                const isRead = currentChapter >= Number(chNum);
                return (
                  <Link key={ch.id} href={`/manga/${id}/read/${ch.id}`}
                    onClick={() => { if (user && Number(chNum) > currentChapter) updateChapter(Number(chNum)); }}
                    className={`flex items-center justify-between px-6 py-3.5 hover:bg-[#1a1a2e] transition-colors group ${isRead ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      {isRead ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <BookOpen size={16} className="text-gray-600 flex-shrink-0" />}
                      <div className="min-w-0">
                        <span className="font-medium text-white group-hover:text-[#8b5cf6] transition-colors">
                          Ch. {chNum}
                        </span>
                        {ch.attributes.title && (
                          <span className="ml-2 text-gray-400 text-sm">— {ch.attributes.title}</span>
                        )}
                        {group?.attributes?.name && (
                          <span className="ml-2 text-xs text-gray-600">[{group.attributes.name}]</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-sm text-gray-500">
                      <span>{ch.attributes.pages}p</span>
                      <span className="hidden sm:block">
                        <Clock size={12} className="inline mr-1" />
                        {new Date(ch.attributes.publishAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {chapters.length > 20 && (
                <button onClick={() => setShowAllChapters(!showAllChapters)}
                  className="w-full px-6 py-4 text-center text-[#8b5cf6] hover:bg-[#1a1a2e] transition-colors flex items-center justify-center gap-2 font-medium">
                  {showAllChapters ? <><ChevronUp size={16} /> Show fewer</> : <><ChevronDown size={16} /> Show all {chapters.length} chapters</>}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer attribution */}
        <p className="text-center text-xs text-gray-600 mt-8">
          Chapter data provided by <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-[#8b5cf6] hover:underline">MangaDex</a> — an open-source manga platform
        </p>
      </div>
    </div>
  );
}
