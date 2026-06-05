'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/server';

interface Series {
  id: string;
  slug: string;
  title: string;
  cover_url?: string;
  average_rating: number;
  rating_count: number;
  view_count: number;
}

export default function HomePage() {
  const [featuredSeries, setFeaturedSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await fetch('/api/series?limit=6');
        const data = await response.json();
        setFeaturedSeries(data.series || []);
      } catch (error) {
        console.error('Failed to fetch series:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🎌</div>
            <span className="text-xl font-bold text-white">Cozy Haven</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/discover" className="text-slate-300 hover:text-white transition">
              Discover
            </Link>
            <Link href="/community" className="text-slate-300 hover:text-white transition">
              Community
            </Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Your Next Favorite Story Awaits
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Track which mangas & visual novels you're reading, share your thoughts with a vibrant community, and discover your next obsession.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/discover" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
              Start Exploring
            </Link>
            <Link href="/community" className="border border-blue-600 text-blue-400 hover:bg-blue-600/10 px-8 py-3 rounded-lg font-semibold transition">
              Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Why Cozy Haven?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-700/50 rounded-xl p-8 border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-white mb-3">Track Your Reading</h3>
              <p className="text-slate-300">
                Keep track of what you're reading, planning to read, and what you've completed. Never lose track of your favorite series.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-700/50 rounded-xl p-8 border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-white mb-3">Join the Community</h3>
              <p className="text-slate-300">
                Share reviews, discuss theories, and connect with fellow manga & VN enthusiasts in our vibrant community forums.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-700/50 rounded-xl p-8 border border-slate-600 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-3">Creator Friendly</h3>
              <p className="text-slate-300">
                Are you a mangaka or author? Grow your audience and earn revenue by sharing your work with our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Series Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold text-white">Featured Series</h2>
          <Link href="/discover" className="text-blue-400 hover:text-blue-300 font-semibold">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-300">Loading series...</p>
          </div>
        ) : featuredSeries.length === 0 ? (
          <div className="text-center py-12 bg-slate-700/30 rounded-xl border border-slate-600">
            <p className="text-slate-300 mb-4">No series yet. Be the first to add one!</p>
            <Link href="/admin/series" className="text-blue-400 hover:text-blue-300">
              Add Series →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSeries.map((series) => (
              <Link key={series.id} href={`/series/${series.slug}`}>
                <div className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600 hover:border-blue-500 transition group cursor-pointer h-full">
                  {/* Cover Image */}
                  <div className="relative w-full h-48 bg-slate-600 overflow-hidden">
                    {series.cover_url ? (
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No cover
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition">
                      {series.title}
                    </h3>
                    
                    {/* Stats */}
                    <div className="flex justify-between text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <span>⭐ {series.average_rating.toFixed(1)}</span>
                        <span className="text-slate-500">({series.rating_count})</span>
                      </div>
                      <div className="text-slate-500">
                        {series.view_count} views
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 my-12 rounded-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Dive In?
          </h2>
          <p className="text-blue-100 mb-8">
            Join thousands of manga and visual novel readers tracking their favorites and connecting with a passionate community.
          </p>
          <Link href="/discover" className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-3 rounded-lg font-bold transition inline-block">
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>© 2024 Cozy Haven. Built with ❤️ for manga and VN enthusiasts.</p>
        </div>
      </footer>
    </div>
  );
}
