'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { titleToSlug } from '@/utils/slug';
import { BookOpen, ArrowLeft, Star, Users, Calendar, Book } from 'lucide-react';

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
  source_url?: string;
  created_at?: string;
}

interface Chapter {
  id: string;
  manga_id: string;
  chapter_number: number;
  title?: string;
  url?: string;
  created_at?: string;
}

export default function MangaDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        
        // Fetch all manga and find by slug
        const { data: allManga, error: fetchError } = await supabase
          .from('manga_series')
          .select('*');

        if (fetchError) throw fetchError;

        // Find manga by matching slug
        const foundManga = allManga?.find(
          (m: Manga) => titleToSlug(m.title) === slug
        );

        if (!foundManga) {
          setError('Manga not found');
          setLoading(false);
          return;
        }

        setManga(foundManga);

        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('manga_id', foundManga.id)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;
        setChapters(chaptersData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load manga');
        console.error('Error fetching manga:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMangaData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white">
        {/* Navigation */}
        <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
            <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </nav>

        {/* Loading Skeleton */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="h-96 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="md:col-span-3 space-y-4">
              <div className="h-8 bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded-lg w-1/2 animate-pulse"></div>
              <div className="h-24 bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white">
        {/* Navigation */}
        <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
            <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Manga Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The manga you are looking for does not exist.'}</p>
          <Link 
            href="/browse"
            className="inline-block px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all"
          >
            Browse All Titles
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6]">
            Ouryie
          </Link>
          <div className="w-8"></div>
        </div>
      </nav>

      {/* Manga Details */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Cover Image */}
          <div className="md:col-span-1">
            <div className="bg-gray-900 rounded-lg overflow-hidden sticky top-24">
              {manga.cover_image_url ? (
                <img 
                  src={manga.cover_image_url} 
                  alt={manga.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23444" width="300" height="400"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="14"%3ENo Cover%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gray-500" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-3 space-y-6">
            {/* Title & Rating */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{manga.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {manga.author && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{manga.author}</span>
                  </div>
                )}
                {manga.rating && (
                  <div className="flex items-center gap-2 bg-[#8b5cf6]/20 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-[#8b5cf6] text-[#8b5cf6]" />
                    <span className="font-semibold">{manga.rating.toFixed(1)}</span>
                  </div>
                )}
                {manga.status && (
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    manga.status === 'ongoing' 
                      ? 'bg-green-900/50 text-green-300' 
                      : manga.status === 'completed'
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {manga.status.charAt(0).toUpperCase() + manga.status.slice(1)}
                  </div>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4">
              {manga.chapter_count && (
                <div className="bg-[#23232f] border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Book className="w-4 h-4" />
                    <span className="text-sm">Chapters</span>
                  </div>
                  <p className="text-2xl font-bold">{manga.chapter_count}</p>
                </div>
              )}
              {manga.source && (
                <div className="bg-[#23232f] border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <span className="text-sm">Source</span>
                  </div>
                  <p className="text-lg font-semibold truncate">{manga.source}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {manga.description && (
              <div>
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-gray-300 leading-relaxed">{manga.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-800">
              {manga.source_url && (
                <a 
                  href={manga.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Read on Source
                </a>
              )}
              <button className="px-6 py-3 border border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6]/10 rounded-lg font-semibold transition-all">
                + Add to Library
              </button>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        {chapters.length > 0 && (
          <div className="bg-[#23232f] border border-gray-800 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Chapters ({chapters.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chapters.map((chapter) => (
                <a
                  key={chapter.id}
                  href={chapter.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-[#1a1a24] hover:bg-[#2a2a34] border border-gray-800 rounded-lg transition-all group"
                >
                  <div>
                    <p className="font-semibold group-hover:text-[#8b5cf6] transition-colors">
                      Chapter {chapter.chapter_number}
                      {chapter.title && ` - ${chapter.title}`}
                    </p>
                    {chapter.created_at && (
                      <p className="text-sm text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(chapter.created_at)}
                      </p>
                    )}
                  </div>
                  <div className="text-gray-400 group-hover:text-[#8b5cf6] transition-colors">
                    →
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {chapters.length === 0 && (
          <div className="text-center py-12 bg-[#23232f] border border-gray-800 rounded-lg">
            <Book className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No chapters available yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#23232f] py-8 px-6 text-center text-gray-400 mt-12">
        <p>&copy; 2024 Ouryie. A space for manga & visual novel lovers.</p>
      </footer>
    </div>
  );
}
