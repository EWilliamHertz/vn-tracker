import Link from 'next/link';
import { createClient } from '../utils/supabase/server';
import { titleToSlug } from '../utils/slug';
import { BookOpen, Library, Heart, Users, Zap, Hash } from 'lucide-react';
import MangaCover from '@/components/MangaCover';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: availableTitles } = await supabase
    .from('manga_series')
    .select('*')
    .limit(8)
    .order('created_at', { ascending: false });

  const titles = availableTitles || [];

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6] flex items-center gap-2">
            <BookOpen size={24} />
            Ouryie
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/browse" className="text-gray-400 hover:text-white transition-all text-sm">
              Discover
            </Link>
            <Link href="/community" className="text-gray-400 hover:text-white transition-all text-sm flex items-center gap-1">
              <Users size={14} /> Community
            </Link>
            <Link href="/community/groups" className="text-gray-400 hover:text-white transition-all text-sm">
              Groups
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all text-sm font-medium"
              >
                My Library
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-all">
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all text-sm font-medium"
                >
                  Join Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ height: 'calc(100vh - 65px)' }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/landing-hero.png"
            alt="Ouryie Hero"
            className="w-full h-full object-cover object-center"
            style={{ display: 'block' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#1a1a24]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 rounded-full text-sm text-[#8b5cf6] mb-6 backdrop-blur">
            <Users size={14} /> Join 50,000+ readers worldwide
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl leading-tight">
            Your Manga &<br />Visual Novel Home
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 drop-shadow max-w-2xl mx-auto leading-relaxed">
            Track your reading, connect with fans, join groups, and discover your next favorite series.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-xl"
              >
                Start for Free
              </Link>
            )}
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-lg font-semibold transition-all border border-white/20 backdrop-blur"
            >
              Browse Titles
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-lg font-semibold transition-all border border-white/20 backdrop-blur"
            >
              <Users size={18} /> Community
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[#1a1a24]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Why Ouryie?</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">Everything you need to enjoy manga and visual novels — in one place.</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#23232f] border border-gray-800 rounded-2xl p-8 text-center hover:border-[#8b5cf6]/50 transition-all">
              <Library className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Organize Your Reading</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Track reading progress, create custom lists, and never lose your place again across thousands of titles.
              </p>
            </div>
            <div className="bg-[#23232f] border border-gray-800 rounded-2xl p-8 text-center hover:border-[#8b5cf6]/50 transition-all">
              <Users className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Vibrant Community</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Join groups, make friends, share reviews, and discuss your favourite stories with people who get it.
              </p>
            </div>
            <div className="bg-[#23232f] border border-gray-800 rounded-2xl p-8 text-center hover:border-[#8b5cf6]/50 transition-all">
              <Zap className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Stay Updated</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get notified about new chapters and series releases. Never miss a drop from your watchlist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Preview */}
      <section className="py-16 px-6 bg-[#23232f]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-1">Trending Groups</h2>
              <p className="text-gray-400">Join communities around your favourite series</p>
            </div>
            <Link href="/community/groups" className="text-[#8b5cf6] hover:text-[#7c3aed] text-sm font-semibold">View All →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Isekai World', 'Romance Readers', 'Attack on Titan', 'Horror Manga'].map((name, i) => (
              <Link key={name} href="/community/groups" className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all text-center group">
                <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#8b5cf6]/30 transition-colors">
                  <Hash size={22} className="text-[#8b5cf6]" />
                </div>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-gray-500 mt-1">{[2100, 1850, 1240, 630][i].toLocaleString()} members</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Titles */}
      <section id="discover" className="py-16 px-6 bg-[#1a1a24]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Latest Titles</h2>
            <Link href="/browse" className="text-[#8b5cf6] hover:text-[#7c3aed] transition-all text-sm font-semibold">View All →</Link>
          </div>
          <p className="text-gray-400 mb-8">Handpicked series from our catalogue</p>

          {titles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {titles.map((title: any) => (
                <Link
                  key={title.id}
                  href={`/manga/${titleToSlug(title.title)}`}
                  className="group"
                >
                  <div className="bg-[#23232f] border border-gray-800 rounded-xl overflow-hidden hover:border-[#8b5cf6]/60 transition-all h-full flex flex-col">
                    <div className="relative overflow-hidden bg-gray-900 aspect-[3/4]">
                      <MangaCover
                        imageUrl={title.cover_image_url}
                        title={title.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {title.status && (
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold ${
                          title.status === 'ongoing'
                            ? 'bg-green-900/80 text-green-300'
                            : title.status === 'completed'
                            ? 'bg-blue-900/80 text-blue-300'
                            : 'bg-gray-700/80 text-gray-300'
                        }`}>
                          {title.status}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-grow flex flex-col">
                      <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#8b5cf6] transition-colors">
                        {title.title}
                      </h3>
                      {title.author && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{title.author}</p>
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

      {/* Creator CTA */}
      <section className="bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Are you a Creator?</h2>
          <p className="text-lg mb-8 text-gray-100 max-w-xl mx-auto">
            Share your manga or visual novel with our growing community. Reach readers who love what you create.
          </p>
          <Link
            href="/community/groups"
            className="inline-block px-8 py-3 bg-white text-[#8b5cf6] font-semibold rounded-xl hover:bg-gray-100 transition-all"
          >
            Join the Community
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#23232f] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[#8b5cf6] font-bold text-lg">
            <BookOpen size={20} /> Ouryie
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
            <Link href="/community" className="hover:text-white transition-colors">Community</Link>
            <Link href="/community/groups" className="hover:text-white transition-colors">Groups</Link>
            <Link href="/community/messages" className="hover:text-white transition-colors">Messages</Link>
          </div>
          <p className="text-gray-500 text-sm">&copy; 2024 Ouryie. A space for manga & visual novel lovers.</p>
        </div>
      </footer>
    </div>
  );
}
