import Link from 'next/link';
import { createClient } from '../utils/supabase/server';
import { BookOpen, Library, Heart, Users } from 'lucide-react';

export default async function LandingPage() {
  const supabase = await createClient();
  
  // Fetch from our live Supabase Database
  const { data: availableTitles, error } = await supabase
   .from('manga_series')
   .select('*');

  const titles = availableTitles || [];

  // Get current user (to show dashboard link instead of login)
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#23232f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6]">
            Cozy Haven
          </Link>
          <div className="flex gap-4">
            <Link href="/#discover" className="text-gray-400 hover:text-white transition-all">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#23232f] to-[#1a1a24] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your Manga & Visual Novel Home
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Track which mangas you&apos;re currently reading & up to date with, which ones you&apos;re planning to read, and which ones you&apos;re done with 🌸
          </p>
          {!user && (
            <Link 
              href="/login"
              className="inline-block px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
            >
              Start Reading
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-[#1a1a24]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join Cozy Haven?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#23232f] border border-gray-800 rounded-lg p-8 text-center">
              <Library className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Organize Your Reading</h3>
              <p className="text-gray-400">
                Keep track of your reading progress across all your favorite manga and visual novels
              </p>
            </div>
            <div className="bg-[#23232f] border border-gray-800 rounded-lg p-8 text-center">
              <Users className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Connect with Community</h3>
              <p className="text-gray-400">
                Come alongside & join the community together with fellow manga & visual novel lovers!
              </p>
            </div>
            <div className="bg-[#23232f] border border-gray-800 rounded-lg p-8 text-center">
              <Heart className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Support Creators</h3>
              <p className="text-gray-400">
                Are you a mangaka? Reach a broader audience for your series through our platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Section */}
      <section id="discover" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Latest Titles</h2>
          <p className="text-gray-400 mb-8">Automatically updated with new series</p>
          
          {titles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {titles.map((title: any) => (
                <Link 
                  key={title.id}
                  href={`/reader/${title.id}`}
                  className="group"
                >
                  <div className="bg-[#23232f] border border-gray-800 rounded-lg overflow-hidden hover:border-[#8b5cf6] transition-all">
                    {title.cover_image && (
                      <img 
                        src={title.cover_image} 
                        alt={title.title}
                        className="w-full h-64 object-cover group-hover:opacity-80 transition-opacity"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-white truncate group-hover:text-[#8b5cf6] transition-colors">
                        {title.title}
                      </h3>
                      {title.author && (
                        <p className="text-sm text-gray-400 mt-2">{title.author}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No titles available yet. Check back soon!</p>
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
        <p>&copy; 2024 Cozy Haven. A space for manga & visual novel lovers.</p>
      </footer>
    </div>
  );
}
