'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchChapters, dedupeChapters, type MDChapter } from '@/utils/mangadex';
import {
  ArrowLeft, BookOpen, Star, Plus, Check, Clock, Pause, X,
  ChevronDown, ChevronUp, Loader2, BookmarkPlus, Play, Search,
  ExternalLink, Eye
} from 'lucide-react';
import OuryieLogo from '@/components/OuryieLogo';

interface Manga {
  id: string;
  title: string;
  author: string;
  description: string;
  status: string;
  image_url?: string;
  cover_image_url?: string;
}

interface ReadingProgress {
  status: string;
  current_chapter: number;
  rating: number | null;
  total_chapters: number;
}

const STATUS_OPTIONS = [
  { value: 'reading', label: 'Reading', icon: BookOpen, color: 'text-green-400' },
  { value: 'completed', label: 'Completed', icon: Check, color: 'text-blue-400' },
  { value: 'plan_to_read', label: 'Plan to Read', icon: Clock, color: 'text-yellow-400' },
  { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'text-orange-400' },
  { value: 'dropped', label: 'Dropped', icon: X, color: 'text-red-400' },
];

export default function MangaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mangaId = params.id as string;

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Chapters
  const [chapters, setChapters] = useState<MDChapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersError, setChaptersError] = useState('');
  const [totalChapters, setTotalChapters] = useState(0);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');

  // Reading progress
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Description
  const [expandDesc, setExpandDesc] = useState(false);

  // Fetch manga data from Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('manga_series')
      .select('*')
      .eq('id', mangaId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setManga(data);
          document.title = `${data.title} — Ouryie`;
        }
        setLoading(false);
      });
  }, [mangaId]);

  // Fetch chapters from MangaDex
  useEffect(() => {
    setChaptersLoading(true);
    fetchChapters(mangaId, 0, 500).then(feed => {
      if (!feed) {
        setChaptersError('Could not load chapters from MangaDex. This manga may not be linked.');
        setChaptersLoading(false);
        return;
      }
      const readable = feed.data.filter(c => c.attributes.pages > 0);
      const deduped = dedupeChapters(readable);
      setChapters(deduped);
      setTotalChapters(deduped.length);
      setChaptersLoading(false);
    });
  }, [mangaId]);

  // Fetch user + reading progress
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUser({ id: data.user.id });
      supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('manga_id', mangaId)
        .single()
        .then(({ data: prog }) => {
          if (prog) {
            setProgress(prog);
            setRating(prog.rating || 0);
          }
        });
    });
  }, [mangaId]);

  // Save library status
  const saveStatus = async (status: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      manga_id: mangaId,
      status,
      total_chapters: totalChapters,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,manga_id' });
    setProgress(prev => prev ? { ...prev, status } : { status, current_chapter: 0, rating: null, total_chapters: totalChapters });
    setShowStatusMenu(false);
  };

  // Save rating
  const saveRating = async (r: number) => {
    if (!user) return;
    setRating(r);
    const supabase = createClient();
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      manga_id: mangaId,
      rating: r,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,manga_id' });
    setProgress(prev => prev ? { ...prev, rating: r } : { status: 'reading', current_chapter: 0, rating: r, total_chapters: totalChapters });
  };

  const coverUrl = manga?.image_url || manga?.cover_image_url || '';

  // Filter chapters by search
  const filteredChapters = useMemo(() => {
    if (!chapterSearch) return chapters;
    return chapters.filter(ch =>
      (ch.attributes.chapter || '').includes(chapterSearch) ||
      (ch.attributes.title || '').toLowerCase().includes(chapterSearch.toLowerCase())
    );
  }, [chapters, chapterSearch]);

  const displayChapters = showAllChapters ? filteredChapters : filteredChapters.slice(0, 20);

  // Find "continue reading" chapter
  const continueChapter = useMemo(() => {
    if (!progress || !chapters.length) return chapters[0] || null;
    const chNum = progress.current_chapter || 0;
    // Find the next unread chapter
    const next = chapters.find(ch => parseFloat(ch.attributes.chapter || '0') > chNum);
    return next || chapters[chapters.length - 1];
  }, [progress, chapters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (notFound || !manga) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Manga Not Found</h1>
          <p className="text-gray-400 mb-6">This manga doesn&apos;t exist in our database.</p>
          <Link href="/browse" className="px-6 py-3 bg-violet-600 rounded-lg text-white hover:bg-violet-500 transition">
            Browse Manga
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === progress?.status);

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      {/* NAV */}
      <nav className="border-b border-white/10 bg-[#0d0d1a]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <OuryieLogo size={28} />
              <span className="font-bold text-lg text-white hidden sm:block">Ouryie</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/browse" className="text-sm text-gray-400 hover:text-white transition">Browse</Link>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative">
        {/* Blurred background */}
        {coverUrl && (
          <div className="absolute inset-0 h-80 overflow-hidden">
            <img src={coverUrl} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d1a]/60 to-[#0d0d1a]" />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              <div className="w-48 md:w-56 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 mx-auto md:mx-0">
                {coverUrl ? (
                  <img src={coverUrl} alt={manga.title} className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gradient-to-br from-violet-900/50 to-purple-900/50 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-violet-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{manga.title}</h1>
              <p className="text-gray-400 text-lg mb-1">by {manga.author || 'Unknown'}</p>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  manga.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                  manga.status === 'ongoing' ? 'bg-green-500/20 text-green-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {manga.status}
                </span>
                {totalChapters > 0 && (
                  <span className="text-gray-500 text-sm">{totalChapters} chapters available</span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <button
                    key={i}
                    onClick={() => user ? saveRating(i) : null}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition"
                  >
                    <Star className={`w-5 h-5 ${
                      i <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                    }`} />
                  </button>
                ))}
                {rating > 0 && <span className="text-gray-400 text-sm ml-2">{rating}/10</span>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {/* Continue / Start reading */}
                {chapters.length > 0 && continueChapter && (
                  <Link
                    href={`/manga/${mangaId}/read/${continueChapter.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 transition shadow-lg shadow-violet-600/25"
                  >
                    <Play className="w-5 h-5" />
                    {progress && progress.current_chapter > 0 
                      ? `Continue Ch. ${progress.current_chapter + 1}` 
                      : 'Start Reading'
                    }
                  </Link>
                )}

                {/* Library status */}
                <div className="relative">
                  <button
                    onClick={() => user ? (currentStatus ? setShowStatusMenu(!showStatusMenu) : saveStatus('plan_to_read')) : null}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition ${
                      currentStatus
                        ? 'bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/10'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {currentStatus ? (
                      <>
                        <currentStatus.icon className={`w-4 h-4 ${currentStatus.color}`} />
                        {currentStatus.label}
                        <ChevronDown className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-5 h-5" />
                        Add to Library
                      </>
                    )}
                  </button>

                  {showStatusMenu && (
                    <div className="absolute top-full mt-2 left-0 w-48 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => saveStatus(opt.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition ${
                            progress?.status === opt.value ? 'bg-violet-600/20' : ''
                          }`}
                        >
                          <opt.icon className={`w-4 h-4 ${opt.color}`} />
                          <span className="text-white">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar if tracking */}
              {progress && progress.current_chapter > 0 && totalChapters > 0 && (
                <div className="mb-6 max-w-md">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">Ch. {progress.current_chapter} / {totalChapters}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (progress.current_chapter / totalChapters) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              {manga.description && (
                <div className="max-w-2xl">
                  <p className={`text-gray-300 text-sm leading-relaxed ${expandDesc ? '' : 'line-clamp-4'}`}>
                    {manga.description}
                  </p>
                  {manga.description.length > 300 && (
                    <button
                      onClick={() => setExpandDesc(!expandDesc)}
                      className="text-violet-400 text-sm mt-1 hover:text-violet-300"
                    >
                      {expandDesc ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHAPTER LIST */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#12121c] rounded-2xl border border-white/5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-bold text-white">
                Chapters
                {totalChapters > 0 && <span className="text-gray-500 font-normal ml-2">({totalChapters})</span>}
              </h2>
            </div>

            {chapters.length > 10 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search chapters..."
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 w-48"
                />
              </div>
            )}
          </div>

          {/* Chapter items */}
          {chaptersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400 mr-3" />
              <span className="text-gray-400">Loading chapters from MangaDex...</span>
            </div>
          ) : chaptersError ? (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-2">{chaptersError}</p>
              <a
                href={`https://mangadex.org/title/${mangaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on MangaDex
              </a>
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No readable chapters available</p>
              <p className="text-gray-500 text-sm mb-4">This manga may be licensed or not yet uploaded to MangaDex.</p>
              <a
                href={`https://mangadex.org/title/${mangaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Check MangaDex for updates
              </a>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {displayChapters.map(ch => {
                  const chNum = parseFloat(ch.attributes.chapter || '0');
                  const isRead = progress && progress.current_chapter >= chNum && chNum > 0;

                  return (
                    <Link
                      key={ch.id}
                      href={`/manga/${mangaId}/read/${ch.id}`}
                      className={`flex items-center justify-between px-6 py-3.5 hover:bg-white/5 transition group ${
                        isRead ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {isRead && <Eye className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            Chapter {ch.attributes.chapter || '?'}
                            {ch.attributes.title ? <span className="text-gray-400 font-normal"> — {ch.attributes.title}</span> : ''}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {ch.attributes.pages} pages
                            {' · '}
                            {new Date(ch.attributes.publishAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span className="px-4 py-1.5 bg-violet-600/20 text-violet-300 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                        Read →
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Show more / less */}
              {filteredChapters.length > 20 && (
                <button
                  onClick={() => setShowAllChapters(!showAllChapters)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm text-violet-400 hover:text-violet-300 hover:bg-white/5 transition border-t border-white/5"
                >
                  {showAllChapters ? (
                    <>Show Less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show All {filteredChapters.length} Chapters <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* MangaDex attribution */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">
            Chapter data and pages provided by{' '}
            <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-400">
              MangaDex
            </a>
            {' '}— an open-source manga platform
          </p>
        </div>
      </div>
    </div>
  );
}
