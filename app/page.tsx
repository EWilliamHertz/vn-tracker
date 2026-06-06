import Link from 'next/link';
import { createClient } from '../utils/supabase/server';
import { BookOpen, Users, TrendingUp, Sparkles, Star, ArrowRight, Library, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch latest manga (prefer ones with cover images)
  const { data: latestManga } = await supabase
    .from('manga_series')
    .select('id, title, author, image_url, status')
    .not('image_url', 'is', null)
    .not('image_url', 'eq', '')
    .order('created_at', { ascending: false })
    .limit(12);

  // Fetch popular/trending (different sort)
  const { data: trendingManga } = await supabase
    .from('manga_series')
    .select('id, title, author, image_url, status')
    .not('image_url', 'is', null)
    .not('image_url', 'eq', '')
    .order('title', { ascending: true })
    .limit(8);

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d0d1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              Ouryie
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/browse" className="text-sm text-gray-400 hover:text-white transition hidden sm:block">Browse</Link>
            <Link href="/community" className="text-sm text-gray-400 hover:text-white transition hidden sm:block">Community</Link>
            <Link href="/dashboard" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — fits viewport, no overflow */}
      <section className="relative h-[75vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-[#0d0d1a] to-fuchsia-900/30" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/30 rounded-full text-violet-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            Read manga for free · Track your progress · Join the community
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
              Your Manga
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Journey Starts Here
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Read manga directly in your browser. Track every chapter. Connect with fans.
            All free, all in one place.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/browse"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-semibold text-lg shadow-xl shadow-violet-600/25 hover:shadow-violet-600/40 transition-all hover:scale-105"
            >
              Start Reading
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/10 rounded-xl text-white font-semibold text-lg hover:bg-white/20 transition-all"
            >
              <Users className="w-5 h-5" />
              Join Community
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-gray-400 text-lg">Read, track, and connect — all in one platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Built-in Reader',
                desc: 'Read manga directly in your browser with our beautiful reader. Vertical scroll, single page, or double page modes. No ads, no redirects.',
                gradient: 'from-violet-500 to-blue-500',
              },
              {
                icon: TrendingUp,
                title: 'Progress Tracking',
                desc: 'Every chapter you read is automatically tracked. Pick up right where you left off. Rate and organize your library with custom statuses.',
                gradient: 'from-emerald-500 to-teal-500',
              },
              {
                icon: MessageCircle,
                title: 'Community Hub',
                desc: 'Join groups, discuss your favourites, make friends, and share recommendations. Real-time messaging and activity feeds.',
                gradient: 'from-fuchsia-500 to-rose-500',
              },
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-[#12121c] border border-white/5 hover:border-white/10 transition-all">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST TITLES */}
      {latestManga && latestManga.length > 0 && (
        <section className="py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Latest Titles</h2>
                <p className="text-gray-400">Recently added to our library</p>
              </div>
              <Link
                href="/browse"
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition text-sm font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {latestManga.map(manga => (
                <Link key={manga.id} href={`/manga/${manga.id}`} className="group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 ring-1 ring-white/10 group-hover:ring-violet-500/50 transition-all shadow-lg group-hover:shadow-violet-600/20 group-hover:scale-105 transition-all duration-200">
                    {manga.image_url ? (
                      <img
                        src={manga.image_url}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-purple-900/50 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-violet-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-violet-300 transition">
                    {manga.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">{manga.author}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TRENDING */}
      {trendingManga && trendingManga.length > 0 && (
        <section className="py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Popular Series</h2>
                <p className="text-gray-400">Community favourites</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingManga.map((manga, i) => (
                <Link
                  key={manga.id}
                  href={`/manga/${manga.id}`}
                  className="group flex gap-4 p-4 bg-[#12121c] rounded-xl border border-white/5 hover:border-violet-500/30 transition-all"
                >
                  <div className="relative flex-shrink-0">
                    <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center z-10 shadow-lg">
                      {i + 1}
                    </span>
                    <div className="w-16 h-24 rounded-lg overflow-hidden ring-1 ring-white/10">
                      {manga.image_url ? (
                        <img src={manga.image_url} alt={manga.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-purple-900/50 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-violet-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium line-clamp-2 group-hover:text-violet-300 transition">{manga.title}</h3>
                    <p className="text-gray-500 text-xs mt-1">{manga.author}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs capitalize ${
                      manga.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                      manga.status === 'ongoing' ? 'bg-green-500/20 text-green-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {manga.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-900/30 to-fuchsia-900/20 border border-violet-500/20">
            <Library className="w-12 h-12 text-violet-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start?</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of readers who track their manga, discover new series, and connect with fans.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/browse"
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-semibold text-lg shadow-xl shadow-violet-600/25 hover:scale-105 transition-all"
              >
                Browse Manga
              </Link>
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-white/10 border border-white/10 rounded-xl text-white font-semibold text-lg hover:bg-white/20 transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Ouryie</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/browse" className="hover:text-white transition">Browse</Link>
              <Link href="/community" className="hover:text-white transition">Community</Link>
              <Link href="/creator-signup" className="hover:text-white transition">For Creators</Link>
            </div>
            <p className="text-gray-600 text-sm">
              Manga data via <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-400">MangaDex</a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
