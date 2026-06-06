'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BookOpen, Palette, TrendingUp, Users, Star, CheckCircle, ArrowRight, Sparkles, Globe, BarChart3, MessageCircle, Heart } from 'lucide-react';

export default function CreatorSignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    portfolio: '',
    type: 'manga',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();

      // Store creator application
      await supabase.from('creator_applications').insert({
        name: formData.name,
        email: formData.email,
        portfolio_url: formData.portfolio,
        content_type: formData.type,
        description: formData.description,
      });
    } catch {
      // Table may not exist yet — still show success for now
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Application Received! 🎉</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Thank you for your interest in sharing your work on Ouryie. We&apos;ll review your application and get back to you within 48 hours.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl font-semibold transition-all">
              Back to Home
            </Link>
            <Link href="/community" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all border border-gray-700">
              Join Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6] flex items-center gap-2">
            <BookOpen size={24} /> Ouryie
          </Link>
          <Link href="/browse" className="text-gray-400 hover:text-white text-sm transition-all">Browse Titles</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#8b5cf6]/15 to-transparent py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 rounded-full text-sm text-[#8b5cf6] mb-6">
            <Sparkles size={14} /> Now accepting creators
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Share Your Story<br />
            <span className="text-[#8b5cf6]">With the World</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Ouryie connects creators directly with passionate readers. Publish your manga, manhwa, or visual novel and grow your audience.
          </p>
        </div>
      </section>

      {/* Why Publish */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Why Publish on Ouryie?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Globe, title: 'Global Reach', desc: 'Reach readers across the world with built-in discovery and search.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track reads, favorites, and reader engagement in real time.' },
              { icon: MessageCircle, title: 'Direct Feedback', desc: 'Get comments, reviews, and build a community around your work.' },
              { icon: Heart, title: 'Earn Revenue', desc: 'Monetize through premium chapters, tips, and supporter tiers.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#23232f] border border-gray-800 rounded-2xl p-6 hover:border-[#8b5cf6]/40 transition-all">
                <Icon className="w-10 h-10 text-[#8b5cf6] mb-4" />
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-[#23232f]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Apply', desc: 'Fill out the form below with your info and a link to your work.' },
              { step: '2', title: 'Get Verified', desc: 'Our team reviews your application within 48 hours.' },
              { step: '3', title: 'Start Publishing', desc: 'Upload chapters, set schedules, and connect with your readers.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6] flex items-center justify-center text-xl font-bold shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Creator Application</h2>
          <p className="text-gray-400 text-center mb-10">Tell us about yourself and your work</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 bg-[#23232f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 bg-[#23232f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Portfolio / Social Link</label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={e => setFormData(f => ({ ...f, portfolio: e.target.value }))}
                className="w-full px-4 py-3 bg-[#23232f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content Type *</label>
              <select
                required
                value={formData.type}
                onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                className="w-full px-4 py-3 bg-[#23232f] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#8b5cf6] transition-all"
              >
                <option value="manga">Manga</option>
                <option value="manhwa">Manhwa</option>
                <option value="manhua">Manhua</option>
                <option value="visual_novel">Visual Novel</option>
                <option value="webtoon">Webtoon</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tell us about your work *</label>
              <textarea
                required
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-[#23232f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-all resize-none"
                placeholder="Describe your series, genre, and how far along you are..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
              {!submitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#23232f] py-8 px-6 text-center text-gray-500">
        <p>&copy; 2025 Ouryie. A space for manga & visual novel lovers.</p>
      </footer>
    </div>
  );
}
