import Link from 'next/link';
import { createClient } from '../utils/supabase/server';
import { titleToSlug } from '../utils/slug';
import { BookOpen, Library, Heart, Users, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const supabase = await createClient();
  
  // Fetch from our live Supabase Database
  const { data: availableTitles, error } = await supabase
   .from('manga_series')
   .select('*')
   .limit(8)
   .order('created_at', { ascending: false });

  const titles = availableTitles || [];

  // Get current user (to show dashboard link instead of login)
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6]">
            Ouryie
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/browse" className="text-gray-400 hover:text-white transition-all">
              Discover
            </Link>
            {user ? (
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all"
              >
                My Library
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen, Exact Fit */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="/landing-hero.png" 
            alt="Ouryie - Your Manga & Visual Novel Home"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-[#1a1a24]"></div>
        </div>
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="max-w-4xl mx-auto text-center px-6 z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
              Welcome to Ouryie
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-8 drop-shadow-lg max-w-2xl mx-auto">
              Track, discover, and connect with the manga & visual novel community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Link 
                  href="/login"
                  className="inline-block px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Reading
                </Link>
              )}
              <Link 
                href="/browse"
                className="inline-block px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg text-lg font-semibold transition-all border border-white/30 backdrop-blur"
              >
                Browse Titles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-[#1a1a24]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Ouryie?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#23232f] border border-gray-800 rounded-lg p-8 text-center hover:border-[#8b5cf6] transition-all">
              <Library className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Organize Your Reading</h3>
              <p className="text-gray-400">
                Keep track of your reading progress across all your favorite manga and visual novels
              </p>
            </div>
            <div className="bg-[#23232f] border border-gray-800 rounded-lg p-8 text-center hover:border-[#8b5cf6] transition-all">
              <Users className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Connect with Community</h3>
              <p className="text-gray-400">
                Join fellow manga & visual novel lovers in discussions and shared reading experiences
              </p>
            </div>
            <div className="bg-[#23232f] border border-gray-800 rounded-lg p-8 text-center hover:border-[#8b5cf6] transition-all">
              <Zap className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Stay Updated</h3>
              <p className="text-gray-400">
                Get notified about new chapters and series releases instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Titles Section */}
      <section id="discover" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Latest Titles</h2>
            <Link 
              href="/browse"
              className="text-[#8b5cf6] hover:text-[#7c3aed] transition-all text-sm font-semibold"
            >
              View All →
            </Link>
          </div>
          <p className="text-gray-400 mb-8">Handpicked series updated daily</p>
          
          {titles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {titles.map((title: any) => (
                <Link 
                  key={title.id}
                  href={`/manga/${titleToSlug(title.title)}`}
                  className="group"
                >
                  <div className="bg-[#23232f] border border-gray-800 rounded-lg overflow-hidden hover:border-[#8b5cf6] transition-all h-full flex flex-col">
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
                      {/* Rating Badge */}
                      {title.rating && (
                        <div className="absolute top-2 right-2 bg-[#8b5cf6] px-3 py-1 rounded-full text-sm font-semibold">
                          ★ {title.rating}
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <h3 className="font-semibold text-white truncate group-hover:text-[#8b5cf6] transition-colors">
                        {title.title}
                      </h3>
                      {title.author && (
                        <p className="text-sm text-gray-400 mt-1 truncate">{title.author}</p>
                      )}
                      {title.status && (
                        <div className="mt-auto pt-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            title.status === 'ongoing' 
                              ? 'bg-green-900/50 text-green-300' 
                              : title.status === 'completed'
                              ? 'bg-blue-900/50 text-blue-300'
                              : 'bg-gray-700/50 text-gray-300'
                          }`}>
                            {title.status.charAt(0).toUpperCase() + title.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No titles available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Creator Section */}
      <section className="bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Are you a Creator?</h2>
          <p className="text-lg mb-8 text-gray-100">
            Share your manga or visual novel with our growing community. Reach readers who love what you create.
          </p>
          <Link 
            href="/creator-signup"
            className="inline-block px-8 py-3 bg-white text-[#8b5cf6] font-semibold rounded-lg hover:bg-gray-100 transition-all"
          >
            Submit Your Work
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#23232f] py-8 px-6 text-center text-gray-400">
        <p>&copy; 2024 Ouryie. A space for manga & visual novel lovers.</p>
      </footer>
    </div>
  );
}
