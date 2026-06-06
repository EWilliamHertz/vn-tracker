'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, MessageCircle, Settings, Star, Book, ChevronRight, Plus, Search, LogOut, Shield, TrendingUp, Library, Bookmark } from 'lucide-react';

interface ReadingEntry {
  id: string;
  manga_id: number;
  status: string;
  current_chapter: number;
  total_chapters: number;
  rating: number | null;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  manga_series: {
    id: number;
    title: string;
    author: string;
    image_url: string | null;
    chapter_count: number | null;
    status: string | null;
  };
}

const STATUS_TABS = [
  { value: 'all', label: 'All', icon: Library },
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'completed', label: 'Completed', icon: Star },
  { value: 'plan_to_read', label: 'Plan to Read', icon: Bookmark },
  { value: 'on_hold', label: 'On Hold', icon: Book },
  { value: 'dropped', label: 'Dropped', icon: Book },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Load reading progress with manga details
      const { data } = await supabase
        .from('reading_progress')
        .select('*, manga_series(id, title, author, image_url, chapter_count, status)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setEntries((data as ReadingEntry[]) || []);
      setLoading(false);
    };

    init();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const filteredEntries = entries.filter(e => {
    const matchesTab = activeTab === 'all' || e.status === activeTab;
    const matchesSearch = !searchTerm ||
      e.manga_series?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.manga_series?.author?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: entries.length,
    reading: entries.filter(e => e.status === 'reading').length,
    completed: entries.filter(e => e.status === 'completed').length,
    chaptersRead: entries.reduce((sum, e) => sum + (e.current_chapter || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6] flex items-center gap-2">
            <BookOpen size={22} /> Ouryie
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/browse" className="text-gray-400 hover:text-white text-sm transition-all">Browse</Link>
            <Link href="/community" className="text-gray-400 hover:text-white text-sm transition-all">Community</Link>
            <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-all flex items-center gap-1">
              <Shield size={14} /> Admin
            </Link>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-400 text-sm transition-all flex items-center gap-1">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-gray-400">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#23232f] border border-gray-800 rounded-2xl p-5">
            <Library className="w-8 h-8 text-[#8b5cf6] mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-400">In Library</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-2xl p-5">
            <BookOpen className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl font-bold">{stats.reading}</p>
            <p className="text-xs text-gray-400">Currently Reading</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-2xl p-5">
            <Star className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-2xl p-5">
            <TrendingUp className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold">{stats.chaptersRead}</p>
            <p className="text-xs text-gray-400">Chapters Read</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Link href="/community" className="bg-[#23232f] border border-gray-800 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all flex items-center gap-3">
            <Users className="w-5 h-5 text-[#8b5cf6]" />
            <span className="text-sm font-medium">Community</span>
          </Link>
          <Link href="/community/messages" className="bg-[#23232f] border border-gray-800 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[#8b5cf6]" />
            <span className="text-sm font-medium">Messages</span>
          </Link>
          <Link href="/browse" className="bg-[#23232f] border border-gray-800 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all flex items-center gap-3">
            <Plus className="w-5 h-5 text-[#8b5cf6]" />
            <span className="text-sm font-medium">Add Titles</span>
          </Link>
          <Link href="/community/groups" className="bg-[#23232f] border border-gray-800 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all flex items-center gap-3">
            <Users className="w-5 h-5 text-[#8b5cf6]" />
            <span className="text-sm font-medium">Groups</span>
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STATUS_TABS.map(tab => {
            const count = tab.value === 'all' ? entries.length : entries.filter(e => e.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.value
                    ? 'bg-[#8b5cf6] text-white'
                    : 'bg-[#23232f] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.value ? 'bg-white/20' : 'bg-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#23232f] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all"
          />
        </div>

        {/* Reading List */}
        {filteredEntries.length > 0 ? (
          <div className="space-y-3">
            {filteredEntries.map(entry => {
              const manga = entry.manga_series;
              if (!manga) return null;

              const progressPercent = manga.chapter_count
                ? Math.min(100, Math.round((entry.current_chapter / manga.chapter_count) * 100))
                : 0;

              const statusColor = {
                reading: 'text-green-400',
                completed: 'text-blue-400',
                plan_to_read: 'text-yellow-400',
                on_hold: 'text-orange-400',
                dropped: 'text-red-400',
              }[entry.status] || 'text-gray-400';

              return (
                <Link
                  key={entry.id}
                  href={`/manga/${manga.id}`}
                  className="group block bg-[#23232f] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#8b5cf6]/50 transition-all"
                >
                  <div className="flex gap-4 p-4">
                    {/* Cover */}
                    <div className="w-16 h-22 rounded-xl overflow-hidden bg-gray-900 shrink-0">
                      {manga.image_url ? (
                        <img src={manga.image_url} alt={manga.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white group-hover:text-[#8b5cf6] transition-colors truncate">
                            {manga.title}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">{manga.author}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-medium capitalize ${statusColor}`}>
                            {entry.status.replace('_', ' ')}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#8b5cf6] transition-colors" />
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-grow">
                          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          Ch. {entry.current_chapter}{manga.chapter_count ? ` / ${manga.chapter_count}` : ''}
                        </span>
                        {entry.rating && (
                          <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-400" /> {entry.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#23232f] border border-gray-800 rounded-2xl">
            <Library className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {entries.length === 0 ? 'Your library is empty' : 'No matches'}
            </h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {entries.length === 0
                ? 'Start by browsing titles and adding them to your library.'
                : 'Try adjusting your search or filters.'}
            </p>
            {entries.length === 0 && (
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl font-semibold transition-all"
              >
                <Plus className="w-4 h-4" /> Browse Titles
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
