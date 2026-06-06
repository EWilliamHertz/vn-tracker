'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchChapters, fetchChapterPages, extractMangaDexId } from '@/utils/mangadex';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, Minimize, Settings, BookOpen, Loader2, AlertTriangle } from 'lucide-react';

type ViewMode = 'vertical' | 'single' | 'double';

export default function ReaderPage() {
  const routeParams = useParams();
  const mangaId = routeParams.id as string;
  const chapterId = routeParams.chapterId as string;
  const router = useRouter();

  const [pages, setPages] = useState<string[]>([]);
  const [pagesHD, setPagesHD] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('vertical');
  const [useHD, setUseHD] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentChapterInfo, setCurrentChapterInfo] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [failedPages, setFailedPages] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const supabase = createClient();

  const activePages = useHD ? pagesHD : pages;

  // Load manga info + chapter list
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('manga_series').select('*').eq('id', mangaId).single();
      if (data) {
        setManga(data);
        document.title = `${data.title} — Reading`;
        const mdId = extractMangaDexId(data.image_url || '', mangaId);
        const chData = await fetchChapters(mdId, 0, 500);
        const valid = (chData.data || []).filter((c: any) => c.attributes.pages > 0);
        setChapters(valid);
        const current = valid.find((c: any) => c.id === chapterId);
        setCurrentChapterInfo(current);
      }
    };
    load();
  }, [mangaId, chapterId]);

  // Load chapter pages
  useEffect(() => {
    const loadPages = async () => {
      setLoading(true);
      setError('');
      setLoadedPages(new Set());
      setFailedPages(new Set());
      setCurrentPage(0);
      try {
        const data = await fetchChapterPages(chapterId);
        if (data.pages.length === 0 && data.pagesHD.length === 0) {
          setError('This chapter has no available pages. It may have been removed due to licensing.');
        }
        setPages(data.pages);
        setPagesHD(data.pagesHD);
      } catch (e) {
        setError('Failed to load chapter pages. Please try again.');
        setPages([]);
        setPagesHD([]);
      }
      setLoading(false);
    };
    loadPages();
  }, [chapterId]);

  // Save reading progress
  useEffect(() => {
    if (!manga || !currentChapterInfo) return;
    const saveProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const chNum = Number(currentChapterInfo.attributes?.chapter || 0);
      if (chNum > 0) {
        await supabase.from('reading_progress').upsert({
          user_id: user.id,
          manga_id: mangaId,
          current_chapter: chNum,
          status: 'reading',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,manga_id' });
      }
    };
    saveProgress();
  }, [currentChapterInfo]);

  const nextPage = useCallback(() => {
    const step = viewMode === 'double' ? 2 : 1;
    if (currentPage + step < activePages.length) setCurrentPage(p => p + step);
    else navigateChapter(1);
  }, [currentPage, activePages.length, viewMode]);

  const prevPage = useCallback(() => {
    const step = viewMode === 'double' ? 2 : 1;
    setCurrentPage(p => Math.max(0, p - step));
  }, [viewMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (viewMode !== 'vertical') {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextPage(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
      }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextPage, prevPage, viewMode, isFullscreen]);

  const navigateChapter = (dir: number) => {
    const idx = chapters.findIndex(c => c.id === chapterId);
    const next = chapters[idx + dir];
    if (next) router.push(`/manga/${mangaId}/read/${next.id}`);
    else router.push(`/manga/${mangaId}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const chapterNum = currentChapterInfo?.attributes?.chapter || '?';
  const chapterTitle = currentChapterInfo?.attributes?.title;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-[#8b5cf6] animate-spin mb-4" />
        <p className="text-gray-400">Loading chapter pages...</p>
        <p className="text-gray-600 text-sm mt-2">Fetching from MangaDex servers</p>
      </div>
    );
  }

  if (error || activePages.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Chapter Unavailable</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          {error || 'This chapter has no available pages. It may have been removed due to licensing.'}
        </p>
        <div className="flex gap-4">
          <button onClick={() => router.push(`/manga/${mangaId}`)} 
            className="px-6 py-3 bg-[#1a1a2e] hover:bg-[#252540] rounded-xl text-sm border border-gray-700">
            ← Back to manga
          </button>
          <button onClick={() => navigateChapter(1)} 
            className="px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl text-sm">
            Try next chapter →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white"
      onClick={() => viewMode !== 'vertical' && setShowToolbar(!showToolbar)}>

      {/* Toolbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-b border-gray-800 transition-transform duration-300 ${showToolbar ? 'translate-y-0' : '-translate-y-full'}`}
        onClick={e => e.stopPropagation()}>
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/manga/${mangaId}`)} className="p-2 hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">{manga?.title}</p>
              <p className="text-xs text-gray-400">Ch. {chapterNum}{chapterTitle ? ` — ${chapterTitle}` : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigateChapter(-1)} className="p-2 hover:bg-gray-800 rounded-lg" title="Previous chapter">
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-gray-400 hidden sm:block">
              {viewMode !== 'vertical' ? `${currentPage + 1}/${activePages.length}` : `Ch. ${chapterNum}`}
            </span>
            <button onClick={() => navigateChapter(1)} className="p-2 hover:bg-gray-800 rounded-lg" title="Next chapter">
              <ChevronRight size={18} />
            </button>

            <div className="w-px h-6 bg-gray-700 mx-1" />

            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-800 rounded-lg">
                <Settings size={18} />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-2xl p-3 space-y-3 z-50">
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Reading Mode</p>
                    {(['vertical', 'single', 'double'] as ViewMode[]).map(m => (
                      <button key={m} onClick={() => { setViewMode(m); setCurrentPage(0); setShowSettings(false); }}
                        className={`block w-full text-left px-3 py-1.5 rounded text-sm ${viewMode === m ? 'bg-[#8b5cf6] text-white' : 'text-gray-300 hover:bg-[#252540]'}`}>
                        {m === 'vertical' ? '↕ Vertical Scroll' : m === 'single' ? '📄 Single Page' : '📖 Double Page'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Quality</p>
                    <button onClick={() => { setUseHD(!useHD); setShowSettings(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm ${useHD ? 'bg-[#8b5cf6] text-white' : 'text-gray-300 hover:bg-[#252540]'}`}>
                      {useHD ? '🔷 HD Quality (slower)' : '⚡ Fast Mode (recommended)'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-800 rounded-lg">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Reader content */}
      {viewMode === 'vertical' ? (
        <div className="max-w-4xl mx-auto pt-14 pb-20">
          {activePages.map((url, i) => (
            <div key={i} className="relative">
              {!loadedPages.has(i) && !failedPages.has(i) && (
                <div className="w-full h-[400px] bg-gray-900 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                </div>
              )}
              {failedPages.has(i) && (
                <div className="w-full h-[200px] bg-gray-900 flex flex-col items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mb-2" />
                  <p className="text-gray-500 text-sm">Page {i + 1} failed to load</p>
                  <button onClick={() => { setFailedPages(p => { const n = new Set(p); n.delete(i); return n; }); }}
                    className="text-[#8b5cf6] text-xs mt-1 hover:underline">Retry</button>
                </div>
              )}
              <img
                src={url}
                alt={`Page ${i + 1}`}
                className={`w-full block ${loadedPages.has(i) ? '' : 'hidden'}`}
                loading={i < 3 ? 'eager' : 'lazy'}
                onLoad={() => setLoadedPages(p => new Set([...p, i]))}
                onError={() => setFailedPages(p => new Set([...p, i]))}
              />
            </div>
          ))}
          {/* End of chapter */}
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400 text-lg">End of Chapter {chapterNum}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigateChapter(-1)}
                className="px-6 py-3 bg-[#1a1a2e] hover:bg-[#252540] rounded-xl text-sm border border-gray-700">
                ← Previous Chapter
              </button>
              <button onClick={() => navigateChapter(1)}
                className="px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl text-sm font-medium shadow-lg shadow-[#8b5cf6]/25">
                Next Chapter →
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'single' ? (
        <div className="flex items-center justify-center min-h-screen pt-14 pb-20 px-4"
          onClick={e => { e.stopPropagation(); nextPage(); }}>
          <img src={activePages[currentPage]} alt={`Page ${currentPage + 1}`}
            className="max-h-[90vh] max-w-full object-contain" />
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen pt-14 pb-20 px-4 gap-1"
          onClick={e => { e.stopPropagation(); nextPage(); }}>
          {activePages[currentPage] && (
            <img src={activePages[currentPage]} alt={`Page ${currentPage + 1}`}
              className="max-h-[90vh] max-w-[48%] object-contain" />
          )}
          {activePages[currentPage + 1] && (
            <img src={activePages[currentPage + 1]} alt={`Page ${currentPage + 2}`}
              className="max-h-[90vh] max-w-[48%] object-contain" />
          )}
        </div>
      )}

      {/* Page navigation overlay for single/double mode */}
      {viewMode !== 'vertical' && (
        <>
          <button onClick={e => { e.stopPropagation(); prevPage(); }}
            className="fixed left-0 top-14 bottom-0 w-1/4 z-30 cursor-w-resize" aria-label="Previous page" />
          <button onClick={e => { e.stopPropagation(); nextPage(); }}
            className="fixed right-0 top-14 bottom-0 w-1/4 z-30 cursor-e-resize" aria-label="Next page" />
        </>
      )}

      {/* Progress bar (bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-1 bg-gray-900">
        <div className="h-full bg-[#8b5cf6] transition-all duration-300"
          style={{ width: viewMode === 'vertical' 
            ? `${(loadedPages.size / activePages.length) * 100}%`
            : `${((currentPage + 1) / activePages.length) * 100}%` }} />
      </div>
    </div>
  );
}
