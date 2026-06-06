'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { titleToSlug } from '@/utils/slug';
import { BookOpen, Search, Filter, X } from 'lucide-react';

interface Manga {
  id: string;
  title: string;
  author: string;
  description?: string;
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

  const supabase = createClient();

  useEffect(() => {
    const fetchManga = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('manga_series')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching manga:', error);
      } else {
        setManga(data || []);
      }
      setLoading(false);
    };

    fetchManga();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...manga];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Sorting
    if (sortBy === 'latest') {
      result.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredManga(result);
  }, [manga, searchTerm, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6]">
            Ouryie
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-gray-400 hover:text-white transition-all">
              Home
            </Link>
            {/* User menu would go here */}
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-[#8b5cf6]/20 to-[#6d28d9]/20 border-b border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Browse All Titles</h1>
          <p className="text-gray-400">Discover {manga.length} manga & visual novels</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-[#23232f] border border-gray-800 rounded-lg p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="text-lg font-bold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Title or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#1a1a24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a24] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#8b5cf6] transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">On Hiatus</option>
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a24] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#8b5cf6] transition-all"
                >
                  <option value="latest">Latest Added</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(searchTerm || statusFilter !== 'all' || sortBy !== 'latest') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('latest');
                  }}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content - Manga Grid */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-6 flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* Results Info */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-400">
                {loading ? 'Loading...' : `${filteredManga.length} title${filteredManga.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#23232f] rounded-lg overflow-hidden animate-pulse">
                    <div className="h-64 bg-gray-700"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Manga Grid */}
            {!loading && filteredManga.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {filteredManga.map((title) => (
                  <Link 
                    key={title.id}
                    href={`/manga/${titleToSlug(title.title)}`}
                    className="group"
                  >
                    <div className="bg-[#23232f] border border-gray-800 rounded-lg overflow-hidden hover:border-[#8b5cf6] transition-all h-full flex flex-col">
                      {/* Cover Image */}
                      <div className="relative overflow-hidden bg-gray-900 h-64">
                        {title.cover_image_url ? (
                          <img 
                            src={title.cover_image_url} 
                            alt={title.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23444" width="300" height="400"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="14"%3ENo Cover%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          {title.chapter_count && (
                            <div className="text-sm text-gray-100 mb-2">
                              {title.chapter_count} chapters
                            </div>
                          )}
                        </div>

                        {/* Rating Badge */}
                        {title.rating && (
                          <div className="absolute top-2 right-2 bg-[#8b5cf6] px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            ★ {title.rating.toFixed(1)}
                          </div>
                        )}

                        {/* Status Badge */}
                        {title.status && (
                          <div className="absolute bottom-2 left-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              title.status === 'ongoing' 
                                ? 'bg-green-900/80 text-green-300' 
                                : title.status === 'completed'
                                ? 'bg-blue-900/80 text-blue-300'
                                : 'bg-yellow-900/80 text-yellow-300'
                            }`}>
                              {title.status.charAt(0).toUpperCase() + title.status.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-grow flex flex-col">
                        <h3 className="font-semibold text-white group-hover:text-[#8b5cf6] transition-colors line-clamp-2">
                          {title.title}
                        </h3>
                        {title.author && (
                          <p className="text-sm text-gray-400 mt-1 truncate">{title.author}</p>
                        )}
                        {title.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{title.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : !loading ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No titles match your filters</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('latest');
                  }}
                  className="mt-4 px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#23232f] py-8 px-6 text-center text-gray-400 mt-12">
        <p>&copy; 2024 Ouryie. A space for manga & visual novel lovers.</p>
      </footer>
    </div>
  );
}
