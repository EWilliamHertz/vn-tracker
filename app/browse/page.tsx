'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getCoverUrl } from '@/utils/mangadex';
import { Search, Filter, BookOpen, X, Grid, List, SlidersHorizontal, ArrowLeft } from 'lucide-react';

interface Manga {
  id: string;
  title: string;
  author?: string;
  description?: string;
  status?: string;
  image_url?: string;
  cover_image_url?: string;
  genres?: string[];
}

export default function BrowsePage() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    document.title = 'Browse Manga';
    const fetchManga = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('manga_series')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setManga(data);
      }
      setLoading(false);
    };
    fetchManga();
  }, []);

  const filtered = manga
    .filter(m => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        m.title.toLowerCase().includes(term) ||
        (m.author || '').toLowerCase().includes(term) ||
        (m.description || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return (a.author || '').localeCompare(b.author || '');
      return 0;
    });

  const getCover = (m: Manga) => getCoverUrl(m.image_url || m.cover_image_url || null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <Link href="/" className="text-xl font-bold text-[#8b5cf6] flex items-center gap-2">
            <BookOpen size={20} /> Ouryie
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/community" className="text-sm text-gray-400 hover:text-white">Community</Link>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Library</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search by title, author, or description..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#12121c] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-500 hover:text-white" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-all ${
              showFilters ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#8b5cf6]' : 'bg-[#12121c] border-gray-800 text-gray-400 hover:text-white'
            }`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <div className="flex border border-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-[#8b5cf6] text-white' : 'bg-[#12121c] text-gray-400'}`}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-[#8b5cf6] text-white' : 'bg-[#12121c] text-gray-400'}`}>
              <List size={18} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-[#12121c] border border-gray-800 rounded-xl p-4 mb-6 flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-[#1a1a2e] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                <option value="all">All</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sort by</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-[#1a1a2e] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                <option value="title">Title A→Z</option>
                <option value="author">Author A→Z</option>
              </select>
            </div>
          </div>
        )}

        <p className="text-gray-400 mb-4 text-sm">{filtered.length} titles found</p>

        {/* Grid view */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(m => {
              const cover = getCover(m);
              return (
                <Link key={m.id} href={`/manga/${m.id}`}
                  className="group bg-[#12121c] rounded-xl overflow-hidden border border-gray-800/50 hover:border-[#8b5cf6]/50 transition-all hover:shadow-xl hover:shadow-[#8b5cf6]/5">
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#1a1a2e]">
                    {cover ? (
                      <img src={cover} alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#6d28d9]/20 flex items-center justify-center">
                        <div className="text-center px-2">
                          <BookOpen className="w-10 h-10 text-[#8b5cf6]/60 mx-auto mb-2" />
                          <p className="text-xs text-gray-400 line-clamp-2">{m.title}</p>
                        </div>
                      </div>
                    )}
                    {m.status && (
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        m.status === 'ongoing' ? 'bg-green-500/90 text-white' :
                        m.status === 'completed' ? 'bg-blue-500/90 text-white' :
                        'bg-gray-700/90 text-gray-200'
                      }`}>
                        {m.status}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-white truncate group-hover:text-[#8b5cf6] transition-colors">{m.title}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{m.author || 'Unknown'}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {filtered.map(m => {
              const cover = getCover(m);
              return (
                <Link key={m.id} href={`/manga/${m.id}`}
                  className="flex items-center gap-4 bg-[#12121c] rounded-xl p-3 border border-gray-800/50 hover:border-[#8b5cf6]/50 transition-all group">
                  <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[#1a1a2e]">
                    {cover ? (
                      <img src={cover} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#8b5cf6]/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate group-hover:text-[#8b5cf6] transition-colors">{m.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{m.author || 'Unknown'}</p>
                    {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{m.description}</p>}
                  </div>
                  {m.status && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                      m.status === 'ongoing' ? 'bg-green-900/30 text-green-400' :
                      m.status === 'completed' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {m.status}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
