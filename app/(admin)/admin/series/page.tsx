'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface Series {
  id: string;
  slug: string;
  title: string;
  author?: string;
  status: string;
  series_type: string;
  average_rating: number;
  rating_count: number;
  created_at: string;
}

export default function SeriesManagementPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    author: '',
    cover_url: '',
    status: 'ongoing',
    series_type: 'manga',
    genres: '',
  });

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('manga_series')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSeries(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'slug') {
      // Auto-format slug
      const formatted = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug || !formData.series_type) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          genres: formData.genres.split(',').filter((g) => g.trim()),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create series');
      }

      toast.success('Series created!');
      setFormData({
        title: '',
        slug: '',
        description: '',
        author: '',
        cover_url: '',
        status: 'ongoing',
        series_type: 'manga',
        genres: '',
      });
      setShowForm(false);
      fetchSeries();
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create series'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('manga_series')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Series deleted');
      fetchSeries();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete series');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <nav className="bg-slate-800 border-b border-slate-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Series Management</h1>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-slate-300 hover:text-white">
              Dashboard
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                showForm
                  ? 'bg-slate-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showForm ? 'Cancel' : '+ New Series'}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {showForm && (
          <div className="bg-slate-800 rounded-lg p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Series</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Attack on Titan"
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="attack-on-titan"
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Auto-formatted from title if blank
                  </p>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="e.g., Hajime Isayama"
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* Series Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type *
                  </label>
                  <select
                    name="series_type"
                    value={formData.series_type}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
                  >
                    <option value="manga">Manga</option>
                    <option value="manhwa">Manhwa</option>
                    <option value="manhua">Manhua</option>
                    <option value="light_novel">Light Novel</option>
                    <option value="visual_novel">Visual Novel</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="hiatus">Hiatus</option>
                  </select>
                </div>

                {/* Cover URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    name="cover_url"
                    value={formData.cover_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Series description..."
                  rows={4}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition resize-none"
                />
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Genres (comma-separated)
                </label>
                <input
                  type="text"
                  name="genres"
                  value={formData.genres}
                  onChange={handleInputChange}
                  placeholder="Action, Fantasy, Supernatural"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Create Series
              </button>
            </form>
          </div>
        )}

        {/* Series List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            All Series ({series.length})
          </h2>

          {loading ? (
            <p className="text-slate-300">Loading...</p>
          ) : series.length === 0 ? (
            <div className="bg-slate-700/50 rounded-lg p-8 text-center border border-slate-600">
              <p className="text-slate-300 mb-4">No series yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Create the first one →
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {series.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 hover:border-blue-500 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        href={`/series/${s.slug}`}
                        className="text-xl font-bold text-blue-400 hover:text-blue-300 transition"
                      >
                        {s.title}
                      </Link>
                      <p className="text-slate-400 text-sm mt-1">
                        by {s.author || 'Unknown'} • {s.series_type}
                      </p>
                      <div className="flex gap-4 mt-3 text-sm text-slate-400">
                        <span>Status: {s.status}</span>
                        <span>Rating: {s.average_rating.toFixed(1)}/5</span>
                        <span>{s.rating_count} ratings</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/chapters?series=${s.id}`}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition"
                      >
                        Chapters
                      </Link>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
