'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchChapters, getCoverUrl, extractMangaDexId } from '@/utils/mangadex';
import { BookOpen, Star, Clock, User, ArrowLeft, ChevronDown, ChevronUp, Plus, Check, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function MangaDetailPage() {
  const routeParams = useParams();
  const mangaId = routeParams.id as string;

  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hasReadableChapters, setHasReadableChapters] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      
      // Get manga from Supabase
      const { data } = await supabase.from('manga_series').select('*').eq('id', mangaId).single();
      if (data) {
        setManga(data);
        document.title = data.title;
      }
      setLoading(false);

      // Get user
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      // Get reading progress
      if (u && data) {
        const { data: progress } = await supabase.from('reading_progress')
          .select('*').eq('user_id', u.id).eq('manga_id', mangaId).single();
        if (progress) {
          setLibraryStatus(progress.status);
          setCurrentChapter(progress.current_chapter || 0);
          setRating(progress.rating || 0);
        }
      }

      // Fetch chapters from MangaDex
      if (data) {
        setChaptersLoading(true);
        const mdId = extractMangaDexId(data.image_url || '', data.id);
        const chData = await fetchChapters(mdId, 0, 500);
        const allCh = (chData.data || []).filter((c: any) => c.attributes.pages > 0);
        setChapters(allCh);
        setHasReadableChapters(allCh.length > 0);
        setChaptersLoading(false);
      }
    };
    load();
  }, [mangaId]);

  const saveProgress = async (status: string, chapter?: number, newRating?: number) => {
    if (!user) return;
    setSaving(true);
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      manga_id: mangaId,
      status,
      current_chapter: chapter ?? currentChapter,
      rating: newRating ?? rating,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,manga_id' });
    setLibraryStatus(status);
    if (chapter !== undefined) setCurrentChapter(chapter);
    if (newRating !== undefined) setRating(newRating);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-white">
        <BookOpen className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Manga Not Found</h2>
        <Link href="/browse" className="text-[#8b5cf6] hover:underline mt-4">← Browse manga</Link>
      </div>
    );
  }

  const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 20);
  const firstChapter = chapters[0];

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/browse" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6">
            <ArrowLeft size={16} /> Back to browse
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-[200px] h-[300px] rounded-xl overflow-hidden shadow-2xl shadow-[#8b5cf6]/20 mx-auto md:mx-0">
                {manga.image_url ? (
                  <img src={getCoverUrl(manga.image_url)} alt={manga.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{manga.title}</h1>
              
              <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
                {manga.author && (
                  <span className="flex items-center gap-1"><User size={14} /> {manga.author}</span>
                )}
                {manga.status && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    <span className="capitalize">{manga.status}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen size={14} /> {chapters.length} chapters
                </span>
              </div>

              {manga.description && (
                <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-2xl line-clamp-4">
                  {manga.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                {hasReadableChapters && firstChapter ? (
                  <Link href={`/manga/${mangaId}/read/${firstChapter.id}`}
                    className="px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl font-medium shadow-lg shadow-[#8b5cf6]/25 transition flex items-center gap-2">
                    <BookOpen size={18} />
                    {currentChapter > 0 ? `Continue Ch. ${currentChapter}` : 'Start Reading'}
                  </Link>
                ) : chaptersLoading ? (
                  <div className="px-6 py-3 bg-gray-700 rounded-xl flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Loading chapters...
                  </div>
                ) : (
                  <a href={`https://mangadex.org/title/${extractMangaDexId(manga.image_url || '', mangaId)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-medium flex items-center gap-2">
                    <ExternalLink size={18} /> Read on MangaDex
                  </a>
                )}

                {user && (
                  <div className="relative group">
                    <button className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition ${
                      libraryStatus ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-[#1a1a2e] text-gray-300 border border-gray-700 hover:border-[#8b5cf6]'
                    }`}>
                      {libraryStatus ? <Check size={18} /> : <Plus size={18} />}
                      {libraryStatus ? libraryStatus.replace('_', ' ') : 'Add to Library'}
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-2xl p-1 hidden group-hover:block z-20">
                      {['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'].map(s => (
                        <button key={s} onClick={() => saveProgress(s)}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm capitalize ${
                            libraryStatus === s ? 'bg-[#8b5cf6] text-white' : 'text-gray-300 hover:bg-[#252540]'
                          }`}>
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rating */}
              {user && libraryStatus && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-400">Your rating:</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button key={n} onClick={() => saveProgress(libraryStatus, currentChapter, n)}
                        className={`p-0.5 transition ${n <= rating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/50'}`}>
                        <Star size={16} fill={n <= rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && <span className="text-yellow-400 text-sm font-bold">{rating}/10</span>}
                </div>
              )}

              {!hasReadableChapters && !chaptersLoading && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 flex items-start gap-3 max-w-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-400 font-medium text-sm">Licensed Content</p>
                    <p className="text-gray-400 text-xs mt-1">
                      This manga&apos;s chapters have been removed from MangaDex due to licensing. 
                      You can still track your reading progress manually.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen size={20} /> Chapters
          {!chaptersLoading && (
            <span className="text-sm font-normal text-gray-400">({chapters.length} available)</span>
          )}
        </h2>

        {chaptersLoading ? (
          <div className="flex items-center gap-3 text-gray-400 py-8">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading chapters from MangaDex...
          </div>
        ) : chapters.length === 0 ? (
          <div className="bg-[#1a1a2e] rounded-xl p-8 text-center">
            <p className="text-gray-400">No readable chapters available on MangaDex.</p>
            <p className="text-gray-500 text-sm mt-2">This title may be licensed. You can track it manually.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {displayedChapters.map((ch: any) => {
                const num = ch.attributes.chapter || '?';
                const title = ch.attributes.title;
                const pages = ch.attributes.pages;
                const date = ch.attributes.publishAt ? new Date(ch.attributes.publishAt).toLocaleDateString() : '';
                const group = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
                const groupName = group?.attributes?.name || '';

                return (
                  <Link key={ch.id} href={`/manga/${mangaId}/read/${ch.id}`}
                    className="flex items-center justify-between px-4 py-3 bg-[#1a1a2e] hover:bg-[#252540] rounded-lg transition group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[#8b5cf6] font-mono font-bold text-sm w-12">#{num}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 truncate group-hover:text-white">
                          {title || `Chapter ${num}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pages} pages{groupName ? ` · ${groupName}` : ''}{date ? ` · ${date}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-500 group-hover:text-[#8b5cf6] text-sm flex-shrink-0">Read →</span>
                  </Link>
                );
              })}
            </div>

            {chapters.length > 20 && (
              <button onClick={() => setShowAllChapters(!showAllChapters)}
                className="w-full mt-4 py-3 bg-[#1a1a2e] hover:bg-[#252540] rounded-xl text-sm text-gray-400 flex items-center justify-center gap-2 transition">
                {showAllChapters ? <><ChevronUp size={16} /> Show less</> : <><ChevronDown size={16} /> Show all {chapters.length} chapters</>}
              </button>
            )}
          </>
        )}

        {/* Manual progress tracker */}
        {user && (
          <div className="mt-8 bg-[#1a1a2e] rounded-xl p-6 border border-gray-800">
            <h3 className="font-bold mb-4">📊 Your Progress</h3>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400">Current Chapter:</label>
              <div className="flex items-center gap-2">
                <button onClick={() => { const n = Math.max(0, currentChapter - 1); saveProgress(libraryStatus || 'reading', n); }}
                  className="w-8 h-8 rounded-lg bg-[#252540] hover:bg-[#8b5cf6] flex items-center justify-center text-sm">−</button>
                <input type="number" value={currentChapter} min={0}
                  onChange={e => { const n = Number(e.target.value) || 0; setCurrentChapter(n); }}
                  onBlur={() => saveProgress(libraryStatus || 'reading', currentChapter)}
                  className="w-20 bg-[#252540] border border-gray-700 rounded-lg px-3 py-1.5 text-center text-sm" />
                <button onClick={() => { const n = currentChapter + 1; saveProgress(libraryStatus || 'reading', n); }}
                  className="w-8 h-8 rounded-lg bg-[#252540] hover:bg-[#8b5cf6] flex items-center justify-center text-sm">+</button>
              </div>
              {saving && <Loader2 className="w-4 h-4 animate-spin text-[#8b5cf6]" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
