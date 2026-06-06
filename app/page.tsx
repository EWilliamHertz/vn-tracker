import Link from 'next/link';
import { createClient } from '../utils/supabase/server';
import { Library, Heart, Users, Zap, Sparkles, ArrowRight, TrendingUp, Shield, Hash, BookOpen } from 'lucide-react';
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

  const { count: totalTitles } = await supabase
    .from('manga_series')
    .select('*', { count: 'exact', head: true });

  // Try to load real groups from DB (gracefully fallback if table doesn't exist yet)
  let trendingGroups: any[] = [];
  try {
    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name, member_count, slug')
      .eq('is_public', true)
      .order('member_count', { ascending: false })
      .limit(4);
    trendingGroups = groupsData || [];
  } catch {}

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800/50 bg-[#12121c]/95 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" fill="url(#og)"/>
              <path d="M18 16C18 14.9 18.9 14 20 14H30V32H20C18.9 32 18 31.1 18 30V16Z" fill="white" fillOpacity="0.9"/>
              <path d="M46 16C46 14.9 45.1 14 44 14H34V32H44C45.1 32 46 31.1 46 30V16Z" fill="white" fillOpacity="0.7"/>
              <path d="M21 19H27M21 23H26M21 27H25" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M37 19H43M38 23H43M39 27H43" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M32 36L34.5 41L40 42L35.5 46L36.5 52L32 49L27.5 52L28.5 46L24 42L29.5 41L32 36Z" fill="white" fillOpacity="0.95"/>
              <defs><linearGradient id="og" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
            </svg>
            <span className="text-xl font-bold text-[#8b5cf6]">Ouryie</span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/browse" className="text-gray-400 hover:text-white transition-all text-sm">Discover</Link>
            <Link href="/community" className="text-gray-400 hover:text-white transition-all text-sm flex items-center gap-1">
              <Users size={14} /> Community
            </Link>
            <Link href="/creator-signup" className="text-gray-400 hover:text-white transition-all text-sm flex items-center gap-1">
              <Sparkles size={14} /> Creators
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            {user ? (
              <Link href="/dashboard" className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all text-sm font-medium">
                My Library
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-all">Sign In</Link>
                <Link href="/auth/sign-up" className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all text-sm font-medium">
                  Join Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full flex items-center justify-center overflow-hidden" style={{ height: '80vh', maxHeight: '750px' }}>
        <div className="absolute inset-0">
          <img
            src="/landing-hero.png"
            alt="Ouryie Hero"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 30%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#1a1a2e]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 rounded-full text-sm text-[#c4b5fd] mb-6 backdrop-blur-sm">
            <TrendingUp size={14} /> {totalTitles || 100}+ titles &bull; Free to join
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-2xl leading-[1.1]">
            Your Manga &<br />Visual Novel Home
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 drop-shadow max-w-2xl mx-auto leading-relaxed">
            Track your reading progress chapter by chapter, connect with fans, join communities, and discover your next obsession.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl text-lg font-bold transition-all transform hover:scale-105 shadow-xl shadow-[#8b5cf6]/25"
              >
                Start for Free <ArrowRight size={18} />
              </Link>
            )}
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-lg font-semibold transition-all border border-white/20 backdrop-blur-sm"
            >
              Browse Titles
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#12121c] border-y border-gray-800/50 py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#8b5cf6]">{totalTitles || '100'}+</p>
            <p className="text-xs text-gray-500 mt-1">Manga Titles</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#8b5cf6]">Free</p>
            <p className="text-xs text-gray-500 mt-1">To Join</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#8b5cf6]">∞</p>
            <p className="text-xs text-gray-500 mt-1">Reading Lists</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#8b5cf6]">Real-time</p>
            <p className="text-xs text-gray-500 mt-1">Messaging</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Why Ouryie?</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">Everything you need to enjoy manga and visual novels — in one place.</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#12121c] border border-gray-800/50 rounded-2xl p-8 text-center hover:border-[#8b5cf6]/40 transition-all group">
              <Library className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">Track Your Progress</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Auto-track chapters as you read. Set status, rate titles, and pick up exactly where you left off.
              </p>
            </div>
            <div className="bg-[#12121c] border border-gray-800/50 rounded-2xl p-8 text-center hover:border-[#8b5cf6]/40 transition-all group">
              <Users className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">Vibrant Community</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Create or join groups, make friends, share reviews, and discuss your favourite stories with people who get it.
              </p>
            </div>
            <div className="bg-[#12121c] border border-gray-800/50 rounded-2xl p-8 text-center hover:border-[#8b5cf6]/40 transition-all group">
              <Zap className="w-12 h-12 text-[#8b5cf6] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">Stay Updated</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get notified about new chapters and series. Never miss a drop from your watchlist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Groups — dynamic from DB or hidden if none */}
      {trendingGroups.length > 0 && (
        <section className="py-16 px-6 bg-[#12121c]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-1">Community Groups</h2>
                <p className="text-gray-400">Join communities around your favourite series</p>
              </div>
              <Link href="/community/groups" className="text-[#8b5cf6] hover:text-[#7c3aed] text-sm font-semibold">View All →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {trendingGroups.map((g) => (
                <Link key={g.id} href={`/community/groups/${g.id}`} className="bg-[#1a1a2e] border border-gray-800/50 rounded-xl p-5 hover:border-[#8b5cf6]/40 transition-all text-center group">
                  <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#8b5cf6]/30 transition-colors">
                    <Hash size={22} className="text-[#8b5cf6]" />
                  </div>
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{g.member_count} member{g.member_count !== 1 ? 's' : ''}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Titles */}
      <section id="discover" className="py-16 px-6 bg-[#1a1a2e]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Latest Titles</h2>
            <Link href="/browse" className="text-[#8b5cf6] hover:text-[#7c3aed] transition-all text-sm font-semibold">View All →</Link>
          </div>
          <p className="text-gray-400 mb-8">Handpicked series from our catalogue</p>

          {titles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {titles.map((title: any) => (
                <Link key={title.id} href={`/manga/${title.id}`} className="group">
                  <div className="bg-[#12121c] border border-gray-800/50 rounded-xl overflow-hidden hover:border-[#8b5cf6]/60 transition-all h-full flex flex-col">
                    <div className="relative overflow-hidden bg-gray-900 aspect-[3/4]">
                      <MangaCover
                        imageUrl={title.image_url || title.cover_image_url}
                        title={title.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {title.status && (
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          title.status === 'ongoing' ? 'bg-green-500/90 text-white' :
                          title.status === 'completed' ? 'bg-blue-500/90 text-white' :
                          'bg-gray-700/90 text-gray-200'
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
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{title.author}</p>
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
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/creator-signup"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#8b5cf6] font-semibold rounded-xl hover:bg-gray-100 transition-all"
            >
              <Sparkles size={16} /> Apply as Creator
            </Link>
            <Link
              href="/community"
              className="inline-block px-8 py-3 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-[#12121c] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" fill="url(#of)"/>
              <path d="M18 16C18 14.9 18.9 14 20 14H30V32H20C18.9 32 18 31.1 18 30V16Z" fill="white" fillOpacity="0.9"/>
              <path d="M46 16C46 14.9 45.1 14 44 14H34V32H44C45.1 32 46 31.1 46 30V16Z" fill="white" fillOpacity="0.7"/>
              <path d="M32 36L34.5 41L40 42L35.5 46L36.5 52L32 49L27.5 52L28.5 46L24 42L29.5 41L32 36Z" fill="white" fillOpacity="0.95"/>
              <defs><linearGradient id="of" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
            </svg>
            <span className="font-bold text-[#8b5cf6]">Ouryie</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
            <Link href="/community" className="hover:text-white transition-colors">Community</Link>
            <Link href="/creator-signup" className="hover:text-white transition-colors">Creators</Link>
          </div>
          <p className="text-gray-600 text-sm">&copy; 2025 Ouryie</p>
        </div>
      </footer>
    </div>
  );
}
