'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchPages, fetchChapters, pageUrl, dedupeChapters, type MDChapter, type AtHomeData } from '@/utils/mangadex';
import { createClient } from '@/utils/supabase/client';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Settings, Layers,
  Monitor, Smartphone, ChevronDown, Loader2, AlertCircle,
  BookOpen, Maximize, Minimize
} from 'lucide-react';

type ReadingMode = 'vertical' | 'single' | 'double';
type Quality = 'full' | 'saver';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const mangaId = params.id as string;
  const chapterId = params.chapterId as string;

  // Core state
  const [pageData, setPageData] = useState<AtHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Chapter navigation
  const [chapters, setChapters] = useState<MDChapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<MDChapter | null>(null);
  const [showChapterMenu, setShowChapterMenu] = useState(false);

  // Settings
  const [mode, setMode] = useState<ReadingMode>('vertical');
  const [quality, setQuality] = useState<Quality>('saver');
  const [showToolbar, setShowToolbar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manga info
  const [mangaTitle, setMangaTitle] = useState('');

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const toolbarTimeout = useRef<NodeJS.Timeout>(undefined);
  const lastScrollY = useRef(0);

  // Fetch manga title
  useEffect(() => {
    const supabase = createClient();
    supabase.from('manga_series').select('title').eq('id', mangaId).single()
      .then(({ data }) => {
        if (data) {
          setMangaTitle(data.title);
          document.title = `Reading ${data.title} — Ouryie`;
        }
      });
  }, [mangaId]);

  // Fetch chapter list for navigation
  useEffect(() => {
    fetchChapters(mangaId, 0, 500).then(feed => {
      if (!feed) return;
      const deduped = dedupeChapters(feed.data.filter(c => c.attributes.pages > 0));
      setChapters(deduped);
      const cur = deduped.find(c => c.id === chapterId);
      setCurrentChapter(cur || null);
    });
  }, [mangaId, chapterId]);

  // Fetch pages for current chapter
  useEffect(() => {
    setLoading(true);
    setError('');
    setCurrentPage(0);
    setLoadedImages(new Set());
    fetchPages(chapterId).then(data => {
      if (!data || data.pages.length === 0) {
        setError('No pages available for this chapter.');
      } else {
        setPageData(data);
      }
      setLoading(false);
    });
  }, [chapterId]);

  // Save reading progress
  const saveProgress = useCallback(async (chapterNum: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const chapNum = Math.ceil(parseFloat(chapterNum) || 0);
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      manga_id: mangaId,
      current_chapter: chapNum,
      status: 'reading',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,manga_id' });
  }, [mangaId]);

  // Auto-save progress when chapter loads
  useEffect(() => {
    if (currentChapter) {
      saveProgress(currentChapter.attributes.chapter || '0');
    }
  }, [currentChapter, saveProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (mode === 'single' || mode === 'double') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          goNextPage();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goPrevPage();
        }
      }
      if (e.key === 'Escape') {
        if (isFullscreen) toggleFullscreen();
        else router.push(`/manga/${mangaId}`);
      }
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Auto-hide toolbar on scroll (vertical mode)
  useEffect(() => {
    if (mode !== 'vertical' || !scrollRef.current) return;
    const el = scrollRef.current;
    const onScroll = () => {
      const dy = el.scrollTop - lastScrollY.current;
      if (dy > 50) {
        setShowToolbar(false);
        setShowSettings(false);
        setShowChapterMenu(false);
      }
      if (dy < -30) setShowToolbar(true);
      lastScrollY.current = el.scrollTop;

      // Track current page by scroll position in vertical mode
      const imgs = el.querySelectorAll('[data-page-idx]');
      for (let i = imgs.length - 1; i >= 0; i--) {
        const rect = (imgs[i] as HTMLElement).getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2) {
          setCurrentPage(i);
          break;
        }
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [mode]);

  const totalPages = pageData?.pages.length || 0;

  const goNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
    } else {
      goNextChapter();
    }
  };

  const goPrevPage = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  const goNextChapter = () => {
    const idx = chapters.findIndex(c => c.id === chapterId);
    if (idx >= 0 && idx < chapters.length - 1) {
      router.push(`/manga/${mangaId}/read/${chapters[idx + 1].id}`);
    }
  };

  const goPrevChapter = () => {
    const idx = chapters.findIndex(c => c.id === chapterId);
    if (idx > 0) {
      router.push(`/manga/${mangaId}/read/${chapters[idx - 1].id}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const chapterIdx = chapters.findIndex(c => c.id === chapterId);

  // LOADING STATE
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading chapter...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error || !pageData) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Chapter Unavailable</h2>
          <p className="text-gray-400 mb-6">{error || 'Could not load this chapter.'}</p>
          <button
            onClick={() => router.push(`/manga/${mangaId}`)}
            className="px-6 py-3 bg-violet-600 rounded-lg text-white hover:bg-violet-500 transition"
          >
            Back to Manga
          </button>
        </div>
      </div>
    );
  }

  const getImgUrl = (idx: number) => {
    const files = quality === 'saver' ? pageData.dataSaver : pageData.pages;
    return pageUrl(pageData.baseUrl, pageData.hash, files[idx], quality);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col">
      {/* TOOLBAR */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showToolbar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-black/90 backdrop-blur-sm border-b border-white/10 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push(`/manga/${mangaId}`)}
                className="p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="min-w-0">
                <p className="text-white font-medium truncate text-sm">{mangaTitle}</p>
                <p className="text-gray-400 text-xs">
                  Chapter {currentChapter?.attributes.chapter || '?'}
                  {currentChapter?.attributes.title ? ` — ${currentChapter.attributes.title}` : ''}
                </p>
              </div>
            </div>

            {/* Center: Chapter selector */}
            <div className="relative">
              <button
                onClick={() => setShowChapterMenu(!showChapterMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition"
              >
                <Layers className="w-4 h-4" />
                Ch. {currentChapter?.attributes.chapter || '?'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showChapterMenu && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-h-80 overflow-y-auto bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl">
                  {chapters.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        router.push(`/manga/${mangaId}/read/${ch.id}`);
                        setShowChapterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition ${
                        ch.id === chapterId ? 'bg-violet-600/30 text-violet-300' : 'text-gray-300'
                      }`}
                    >
                      Ch. {ch.attributes.chapter || '?'}
                      {ch.attributes.title ? ` — ${ch.attributes.title}` : ''}
                      <span className="text-gray-500 ml-2">{ch.attributes.pages}p</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Page info + Settings */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm hidden sm:block">
                {currentPage + 1} / {totalPages}
              </span>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <Settings className="w-5 h-5 text-gray-300" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition hidden sm:block"
              >
                {isFullscreen ?
                  <Minimize className="w-5 h-5 text-gray-300" /> :
                  <Maximize className="w-5 h-5 text-gray-300" />
                }
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="max-w-6xl mx-auto mt-2">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300 rounded-full"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-[#1a1a2e] border-b border-white/10 px-4 py-4">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-6">
              {/* Reading mode */}
              <div>
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Mode</p>
                <div className="flex gap-2">
                  {[
                    { val: 'vertical' as ReadingMode, icon: Smartphone, label: 'Scroll' },
                    { val: 'single' as ReadingMode, icon: Monitor, label: 'Single' },
                    { val: 'double' as ReadingMode, icon: BookOpen, label: 'Double' },
                  ].map(({ val, icon: Icon, label }) => (
                    <button
                      key={val}
                      onClick={() => setMode(val)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                        mode === val
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Quality</p>
                <div className="flex gap-2">
                  {[
                    { val: 'saver' as Quality, label: 'Normal' },
                    { val: 'full' as Quality, label: 'HD' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setQuality(val)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        quality === val
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shortcuts */}
              <div>
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Shortcuts</p>
                <div className="flex gap-3 text-gray-500 text-xs">
                  <span>← → Navigate</span>
                  <span>F Fullscreen</span>
                  <span>ESC Exit</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TAP ZONES to show toolbar */}
      {!showToolbar && (
        <div
          className="absolute top-0 left-0 right-0 h-16 z-40 cursor-pointer"
          onClick={() => setShowToolbar(true)}
        />
      )}

      {/* READER AREA */}
      {mode === 'vertical' ? (
        /* VERTICAL SCROLL MODE */
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-20">
          <div className="max-w-4xl mx-auto">
            {Array.from({ length: totalPages }, (_, i) => (
              <div key={i} data-page-idx={i} className="relative">
                {!loadedImages.has(i) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#111] min-h-[400px]">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                )}
                <img
                  src={getImgUrl(i)}
                  alt={`Page ${i + 1}`}
                  className="w-full h-auto"
                  loading={i < 5 ? 'eager' : 'lazy'}
                  onLoad={() => setLoadedImages(s => new Set(s).add(i))}
                  onError={(e) => {
                    // Retry with full quality on error
                    const img = e.target as HTMLImageElement;
                    if (quality === 'saver' && !img.dataset.retried) {
                      img.dataset.retried = 'true';
                      img.src = pageUrl(pageData.baseUrl, pageData.hash, pageData.pages[i], 'full');
                    }
                  }}
                />
              </div>
            ))}

            {/* End of chapter */}
            <div className="py-16 text-center border-t border-white/10 mt-8">
              <p className="text-gray-400 mb-4">End of Chapter {currentChapter?.attributes.chapter || '?'}</p>
              <div className="flex items-center justify-center gap-4">
                {chapterIdx > 0 && (
                  <button onClick={goPrevChapter} className="px-5 py-2.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition">
                    ← Previous
                  </button>
                )}
                {chapterIdx < chapters.length - 1 && (
                  <button onClick={goNextChapter} className="px-5 py-2.5 bg-violet-600 rounded-lg text-white hover:bg-violet-500 transition">
                    Next Chapter →
                  </button>
                )}
                <button onClick={() => router.push(`/manga/${mangaId}`)} className="px-5 py-2.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition">
                  Back to Manga
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-6">Content provided by MangaDex</p>
            </div>
          </div>
        </div>
      ) : mode === 'single' ? (
        /* SINGLE PAGE MODE */
        <div className="flex-1 flex items-center justify-center relative pt-16"
          onClick={(e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) goNextPage();
            else goPrevPage();
          }}
        >
          <div className="relative max-h-[calc(100vh-4rem)] flex items-center justify-center">
            {!loadedImages.has(currentPage) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              </div>
            )}
            <img
              src={getImgUrl(currentPage)}
              alt={`Page ${currentPage + 1}`}
              className="max-h-[calc(100vh-4rem)] max-w-full object-contain"
              onLoad={() => setLoadedImages(s => new Set(s).add(currentPage))}
            />
          </div>

          {/* Side navigation arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrevPage(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/60 rounded-full hover:bg-black/80 transition"
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNextPage(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/60 rounded-full hover:bg-black/80 transition"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      ) : (
        /* DOUBLE PAGE MODE */
        <div className="flex-1 flex items-center justify-center relative pt-16 gap-1"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) { setCurrentPage(p => Math.min(p + 2, totalPages - 1)); }
            else { setCurrentPage(p => Math.max(p - 2, 0)); }
          }}
        >
          {[currentPage, currentPage + 1].map(idx => (
            idx < totalPages ? (
              <img
                key={idx}
                src={getImgUrl(idx)}
                alt={`Page ${idx + 1}`}
                className="max-h-[calc(100vh-4rem)] max-w-[49%] object-contain"
                onLoad={() => setLoadedImages(s => new Set(s).add(idx))}
              />
            ) : null
          ))}

          <button
            onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(p - 2, 0)); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/60 rounded-full hover:bg-black/80 transition"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(p + 2, totalPages - 1)); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/60 rounded-full hover:bg-black/80 transition"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* BOTTOM BAR (single/double mode) */}
      {mode !== 'vertical' && (
        <div className="bg-black/90 border-t border-white/10 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={goPrevChapter}
              disabled={chapterIdx <= 0}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm text-white disabled:opacity-30 hover:bg-white/20 transition"
            >
              ← Prev Chapter
            </button>

            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium">{currentPage + 1} / {totalPages}</span>
              <input
                type="range"
                min={0}
                max={totalPages - 1}
                value={currentPage}
                onChange={e => setCurrentPage(parseInt(e.target.value))}
                className="w-32 sm:w-48 accent-violet-500"
              />
            </div>

            <button
              onClick={goNextChapter}
              disabled={chapterIdx >= chapters.length - 1}
              className="px-4 py-2 bg-violet-600 rounded-lg text-sm text-white disabled:opacity-30 hover:bg-violet-500 transition"
            >
              Next Chapter →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
