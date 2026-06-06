'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import OuryieLogo from '@/components/OuryieLogo';
import { BookOpen, Search, Filter, X, Star, LayoutGrid, List, ArrowLeft } from 'lucide-react';

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
  created_at?: string;
}

export default function BrowsePage() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [filteredManga, setFilteredManga] = useState<Manga[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    document.title = 'Ouryie — Browse Manga';
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

  useEffect(() => {
    let result = [...manga];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.author?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'chapters') {
      result.sort((a, b) => (b.chapter_count || 0) - (a.chapter_count || 0));
    }

    setFilteredManga(result);
  }, [manga, searchTerm, statusFilter, sortBy]);

  const getCover = (m: Manga) => m.image_url || m.cover_image_url;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#12121c]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/"><OuryieLogo size={28} /></Link>
          <div className="flex gap-3 items-center">
            <Link href="/community" className="text-gray-400 hover:text-white text-sm transition-all">Community</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-all">Library</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Manga</h1>
          <p className="text-gray-400">Discover from {manga.length} titles in our catalogue</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title, author, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#12121c] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-500 hover:text-white" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-all ${
              showFilters ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#8b5cf6]' : 'bg-[#12121c] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="flex border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-all ${viewMode === 'grid' ? 'bg-[#8b5cf6] text-white' : 'bg-[#12121c] text-gray-400'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition-all ${viewMode === 'list' ? 'bg-[#8b5cf6] text-white' : 'bg-[#12121c] text-gray-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#12121c] border border-gray-800 rounded-xl p-4 mb-6 flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="all">All</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="latest">Latest Added</option>
                <option value="title">Title A-Z</option>
                <option value="rating">Highest Rated</option>
                <option value="chapters">Most Chapters</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-4">
          {filteredManga.length} title{filteredManga.length !== 1 ? 's' : ''} found
          {searchTerm && ` for "${searchTerm}"`}
        </p>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-[#12121c] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-800" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredManga.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No titles found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="text-[#8b5cf6] hover:underline">
              Clear all filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredManga.map((m) => {
              const cover = getCover(m);
              return (
                <Link key={m.id} href={`/manga/${m.id}`} className="group">
                  <div className="bg-[#12121c] border border-gray-800/50 rounded-xl overflow-hidden hover:border-[#8b5cf6]/60 transition-all h-full flex flex-col">
                    <div className="relative overflow-hidden bg-gray-900 aspect-[3/4]">
                      {cover && !imgErrors.has(m.id) ? (
                        <img
                          src={cover}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={() => setImgErrors(prev => new Set([...prev, m.id]))}
                        />
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
                    <div className="p-3 flex-grow">
                      <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#8b5cf6] transition-colors">
                        {m.title}
                      </h3>
                      {m.author && <p className="text-xs text-gray-500 mt-0.5 truncate">{m.author}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredManga.map((m) => {
              const cover = getCover(m);
              return (
                <Link key={m.id} href={`/manga/${m.id}`} className="group">
                  <div className="bg-[#12121c] border border-gray-800/50 rounded-xl p-4 flex gap-4 hover:border-[#8b5cf6]/60 transition-all items-center">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {cover && !imgErrors.has(m.id) ? (
                        <img
                          src={cover}
                          alt={m.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => setImgErrors(prev => new Set([...prev, m.id]))}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#6d28d9]/20 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-[#8b5cf6]/60" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-[#8b5cf6] transition-colors">{m.title}</h3>
                      <p className="text-sm text-gray-400 truncate">{m.author || 'Unknown author'}</p>
                      {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-sm text-gray-500">
                      {m.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          m.status === 'ongoing' ? 'bg-green-900/30 text-green-400' :
                          m.status === 'completed' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {m.status}
                        </span>
                      )}
                      {m.chapter_count ? (
                        <span className="whitespace-nowrap">{m.chapter_count} ch</span>
                      ) : null}
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
