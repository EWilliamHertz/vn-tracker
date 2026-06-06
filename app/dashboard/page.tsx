'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getCoverUrl } from '@/utils/mangadex';
import Link from 'next/link';
import OuryieLogo from '@/components/OuryieLogo';
import { BookOpen, Plus, Star, Search, Filter, LayoutGrid, List, Users, MessageCircle, Settings, LogOut, Book, TrendingUp, ChevronDown, X } from 'lucide-react';

interface ReadingEntry {
  id: string;
  user_id: string;
  manga_id: string;
  status: string;
  current_chapter: number;
  total_chapters: number;
  rating: number | null;
  updated_at: string;
  created_at: string;
  manga?: {
    id: string;
    title: string;
    author: string;
    image_url: string | null;
    cover_image_url: string | null;
    chapter_count: number;
    status: string;
  };
}

const STATUS_TABS = [
  { value: 'all', label: 'All', emoji: '📚' },
  { value: 'reading', label: 'Reading', emoji: '📖' },
  { value: 'completed', label: 'Completed', emoji: '✅' },
  { value: 'plan_to_read', label: 'Plan to Read', emoji: '📋' },
  { value: 'on_hold', label: 'On Hold', emoji: '⏸️' },
  { value: 'dropped', label: 'Dropped', emoji: '❌' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    document.title = 'My Library';
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      // Load reading progress with manga details
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('*, manga:manga_series(id, title, author, image_url, cover_image_url, chapter_count, status)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setEntries(progressData || []);
      setLoading(false);
    };
    init();
  }, []);

  const filtered = entries.filter(e => {
    const matchesTab = activeTab === 'all' || e.status === activeTab;
    const matchesSearch = !searchTerm || e.manga?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: entries.length,
    reading: entries.filter(e => e.status === 'reading').length,
    completed: entries.filter(e => e.status === 'completed').length,
    chaptersRead: entries.reduce((sum, e) => sum + (e.current_chapter || 0), 0),
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800/50 bg-[#12121c]/95 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><OuryieLogo size={28} /></Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/browse" className="text-gray-400 hover:text-white text-sm transition-all">Browse</Link>
            <Link href="/community" className="text-gray-400 hover:text-white text-sm transition-all flex items-center gap-1">
              <Users size={14} /> Community
            </Link>
            <Link href="/community/messages" className="text-gray-400 hover:text-white text-sm transition-all flex items-center gap-1">
              <MessageCircle size={14} /> Messages
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-xs transition-all">
              <Settings size={16} />
            </Link>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-white text-sm transition-all flex items-center gap-1">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-gray-400">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Here&apos;s your reading progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#12121c] border border-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total in Library</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#12121c] border border-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Currently Reading</p>
            <p className="text-2xl font-bold text-green-400">{stats.reading}</p>
          </div>
          <div className="bg-[#12121c] border border-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
          </div>
          <div className="bg-[#12121c] border border-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Chapters Read</p>
            <p className="text-2xl font-bold text-[#8b5cf6]">{stats.chaptersRead}</p>
          </div>
        </div>

        {/* Search + View Toggle */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#12121c] border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
          <div className="flex border border-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 ${viewMode === 'list' ? 'bg-[#8b5cf6] text-white' : 'bg-[#12121c] text-gray-400'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-[#8b5cf6] text-white' : 'bg-[#12121c] text-gray-400'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === 'all' ? entries.length : entries.filter(e => e.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.value
                    ? 'bg-[#8b5cf6] text-white'
                    : 'bg-[#12121c] text-gray-400 border border-gray-800 hover:text-white'
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
                {count > 0 && <span className="text-xs opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {entries.length === 0 ? 'Your library is empty' : 'No titles match'}
            </h3>
            <p className="text-gray-400 mb-6">
              {entries.length === 0 ? 'Start by adding manga to your library!' : 'Try a different search or filter'}
            </p>
            <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl font-semibold transition-all">
              <Plus className="w-4 h-4" /> Browse Manga
            </Link>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filtered.map((entry) => {
              const manga = entry.manga;
              if (!manga) return null;
              const cover = getCoverUrl(manga.image_url || manga.cover_image_url || null);
              const progress = manga.chapter_count ? Math.round((entry.current_chapter / manga.chapter_count) * 100) : 0;
              const statusInfo = STATUS_TABS.find(t => t.value === entry.status);

              return (
                <Link key={entry.id} href={`/manga/${manga.id}`} className="group block">
                  <div className="bg-[#12121c] border border-gray-800/50 rounded-xl p-4 flex gap-4 hover:border-[#8b5cf6]/60 transition-all items-center">
                    <div className="w-14 h-18 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {cover && !imgErrors.has(manga.id) ? (
                        <img src={cover} alt={manga.title} className="w-full h-full object-cover" onError={() => setImgErrors(p => new Set([...p, manga.id]))} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#6d28d9]/20 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[#8b5cf6]/60" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-[#8b5cf6] transition-colors">{manga.title}</h3>
                      <p className="text-xs text-gray-500">{manga.author}</p>
                      {manga.chapter_count ? (
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-[200px]">
                            <div className="h-full bg-[#8b5cf6] rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{entry.current_chapter}/{manga.chapter_count}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Ch. {entry.current_chapter}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {entry.rating && (
                        <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400" /> {entry.rating}
                        </span>
                      )}
                      <span className="text-xs">{statusInfo?.emoji}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((entry) => {
              const manga = entry.manga;
              if (!manga) return null;
              const cover = getCoverUrl(manga.image_url || manga.cover_image_url || null);
              const progress = manga.chapter_count ? Math.round((entry.current_chapter / manga.chapter_count) * 100) : 0;

              return (
                <Link key={entry.id} href={`/manga/${manga.id}`} className="group">
                  <div className="bg-[#12121c] border border-gray-800/50 rounded-xl overflow-hidden hover:border-[#8b5cf6]/60 transition-all">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-800">
                      {cover && !imgErrors.has(manga.id) ? (
                        <img src={cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={() => setImgErrors(p => new Set([...p, manga.id]))} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#6d28d9]/20 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-[#8b5cf6]/60" />
                        </div>
                      )}
                      {/* Progress bar overlay */}
                      {manga.chapter_count ? (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                          <div className="h-full bg-[#8b5cf6]" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate group-hover:text-[#8b5cf6] transition-colors">{manga.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Ch. {entry.current_chapter}{manga.chapter_count ? `/${manga.chapter_count}` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
