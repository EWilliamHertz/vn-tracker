'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Chapter {
  id: string;
  series_id: string;
  chapter_number: number;
  title?: string;
}

interface ChapterPage {
  id: string;
  page_number: number;
  image_url: string;
}

interface Series {
  title: string;
  slug: string;
}

export default function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const [slug, setSlug] = useState<string>('');
  const [chapterNumber, setChapterNumber] = useState<number>(0);
  const [series, setSeries] = useState<Series | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setChapterNumber(parseFloat(p.chapter));
    });
  }, [params]);

  useEffect(() => {
    if (!slug || chapterNumber === 0) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch series by slug
        const { data: seriesData } = await supabase
          .from('manga_series')
          .select('id, title, slug')
          .eq('slug', slug)
          .single();

        if (!seriesData) {
          toast.error('Series not found');
          return;
        }

        setSeries(seriesData);

        // Fetch all chapters for this series
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('id, series_id, chapter_number, title')
          .eq('series_id', seriesData.id)
          .order('chapter_number', { ascending: true });

        setAllChapters(chaptersData || []);

        // Fetch current chapter
        const { data: chapterData } = await supabase
          .from('chapters')
          .select('*')
          .eq('series_id', seriesData.id)
          .eq('chapter_number', chapterNumber)
          .single();

        if (!chapterData) {
          toast.error('Chapter not found');
          return;
        }

        setChapter(chapterData);

        // Fetch pages
        const { data: pagesData } = await supabase
          .from('chapter_pages')
          .select('*')
          .eq('chapter_id', chapterData.id)
          .order('page_number', { ascending: true });

        setPages(pagesData || []);

        // Track reading progress
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth.user) {
          await supabase.from('user_library').upsert({
            user_id: userAuth.user.id,
            series_id: seriesData.id,
            last_chapter_read: chapterNumber,
            status: 'reading',
          });
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, chapterNumber]);

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    } else if (series) {
      // Go to next chapter
      const nextChapter = allChapters.find((c) => c.chapter_number > chapterNumber);
      if (nextChapter) {
        setChapterNumber(nextChapter.chapter_number);
        setCurrentPage(1);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (series) {
      // Go to previous chapter
      const prevChapter = [...allChapters]
        .reverse()
        .find((c) => c.chapter_number < chapterNumber);
      if (prevChapter) {
        setChapterNumber(prevChapter.chapter_number);
        setCurrentPage(999); // Will be capped to actual page count
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading chapter...</p>
      </div>
    );
  }

  if (!series || !chapter || pages.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Chapter not found</h1>
          <Link href={`/series/${slug}`} className="text-blue-400 hover:text-blue-300">
            Back to series →
          </Link>
        </div>
      </div>
    );
  }

  const currentPageData = pages[currentPage - 1];
  const prevChapter = [...allChapters]
    .reverse()
    .find((c) => c.chapter_number < chapterNumber);
  const nextChapter = allChapters.find((c) => c.chapter_number > chapterNumber);

  return (
    <div className={`min-h-screen bg-black flex flex-col ${fullscreen ? '' : ''}`}>
      {/* Header */}
      {!fullscreen && (
        <nav className="bg-slate-900 border-b border-slate-700 py-3 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <Link href={`/series/${slug}`} className="text-blue-400 hover:text-blue-300">
              ← {series.title}
            </Link>
            <p className="text-white font-semibold">
              Chapter {chapter.chapter_number}
              {chapter.title && `: ${chapter.title}`}
            </p>
            <button
              onClick={() => setFullscreen(true)}
              className="text-slate-300 hover:text-white"
            >
              ⛶
            </button>
          </div>
        </nav>
      )}

      {/* Reader */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {currentPageData ? (
          <img
            src={currentPageData.image_url}
            alt={`Page ${currentPage}`}
            className="max-w-full max-h-[90vh] object-contain"
          />
        ) : (
          <p className="text-white">Page not found</p>
        )}

        {/* Navigation Buttons */}
        <button
          onClick={handlePrevPage}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-lg transition"
          aria-label="Previous page"
        >
          ←
        </button>
        <button
          onClick={handleNextPage}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-lg transition"
          aria-label="Next page"
        >
          →
        </button>
      </div>

      {/* Footer */}
      {!fullscreen && (
        <div className="bg-slate-900 border-t border-slate-700 py-4">
          <div className="max-w-7xl mx-auto px-4">
            {/* Page Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Page {currentPage}</span>
                <span>{pages.length} pages</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(currentPage / pages.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Chapter Navigation */}
            <div className="flex gap-4 justify-center">
              {prevChapter ? (
                <Link
                  href={`/reader/${slug}/${prevChapter.chapter_number}`}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  ← Ch {prevChapter.chapter_number}
                </Link>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
                >
                  First Chapter
                </button>
              )}

              <select
                value={chapterNumber}
                onChange={(e) => {
                  setChapterNumber(parseFloat(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
              >
                {allChapters.map((ch) => (
                  <option key={ch.id} value={ch.chapter_number}>
                    Ch {ch.chapter_number}
                    {ch.title && ` - ${ch.title}`}
                  </option>
                ))}
              </select>

              {nextChapter ? (
                <Link
                  href={`/reader/${slug}/${nextChapter.chapter_number}`}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Ch {nextChapter.chapter_number} →
                </Link>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
                >
                  Last Chapter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen mode close button */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-3 rounded-lg transition"
          aria-label="Exit fullscreen"
        >
          ✕
        </button>
      )}
    </div>
  );
}
