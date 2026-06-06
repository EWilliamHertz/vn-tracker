import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { BookOpen } from 'lucide-react';

export default async function MangaListingPage() {
  const supabase = await createClient();
  
  const { data: manga, error } = await supabase
    .from('manga_series')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6]">
            Ouryie
          </Link>
          <Link href="/browse" className="text-gray-400 hover:text-white transition-all">
            Browse
          </Link>
        </div>
      </nav>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-[#8b5cf6]/20 to-[#6d28d9]/20 border-b border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">All Manga</h1>
          <p className="text-gray-400">Browse all {manga?.length || 0} titles</p>
        </div>
      </section>

      {/* Manga Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {manga && manga.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {manga.map((title) => (
              <Link 
                key={title.id}
                href={`/manga/${title.id}`}
                className="group"
              >
                <div className="bg-[#23232f] border border-gray-800 rounded-lg overflow-hidden hover:border-[#8b5cf6] transition-all h-full flex flex-col">
                  <div className="relative overflow-hidden bg-gray-900 h-64">
                    {title.cover_image_url ? (
                      <img 
                        src={title.cover_image_url} 
                        alt={title.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    {title.rating && (
                      <div className="absolute top-2 right-2 bg-[#8b5cf6] px-2 py-1 rounded-full text-xs font-semibold">
                        ★ {title.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white group-hover:text-[#8b5cf6] transition-colors line-clamp-2">
                      {title.title}
                    </h3>
                    {title.author && (
                      <p className="text-sm text-gray-400 mt-1 truncate">{title.author}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No manga available yet.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#23232f] py-8 px-6 text-center text-gray-400">
        <p>&copy; 2024 Ouryie. A space for manga & visual novel lovers.</p>
      </footer>
    </div>
  );
}
