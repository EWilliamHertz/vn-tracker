import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LogOut, Settings, Shield } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }

  // Fetch user's reading list
  const { data: readingList } = await supabase
    .from('user_reading_list')
    .select('*, manga_series(id, title, cover_image)')
    .eq('user_id', user.id);

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#23232f]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#8b5cf6]">
            Ouryie
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user.email}</span>
            <div className="flex gap-2">
              {user.user_metadata?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className="flex items-center gap-2 px-4 py-2 bg-[#ff6b6b] hover:bg-[#ee5a52] rounded-lg transition-all text-sm"
                >
                  <Shield size={16} /> Admin
                </Link>
              )}
              <form action={handleSignOut}>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-[#15151e] hover:bg-gray-700 rounded-lg transition-all text-sm"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Stats */}
          <div className="bg-[#23232f] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Currently Reading</p>
            <p className="text-3xl font-bold">{readingList?.filter(r => r.status === 'reading').length || 0}</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Planning to Read</p>
            <p className="text-3xl font-bold">{readingList?.filter(r => r.status === 'planning').length || 0}</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Completed</p>
            <p className="text-3xl font-bold">{readingList?.filter(r => r.status === 'completed').length || 0}</p>
          </div>
        </div>

        {/* Reading List Tabs */}
        <div className="bg-[#23232f] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen size={24} /> Your Library
          </h2>
          
          {readingList && readingList.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {readingList.map((item: any) => (
                <Link 
                  key={item.id}
                  href={`/reader/${item.manga_series?.id}`}
                  className="group"
                >
                  <div className="bg-[#15151e] rounded-lg overflow-hidden hover:border-[#8b5cf6] border border-gray-800 transition-all">
                    {item.manga_series?.cover_image && (
                      <img 
                        src={item.manga_series.cover_image} 
                        alt={item.manga_series.title}
                        className="w-full h-48 object-cover group-hover:opacity-80 transition-opacity"
                      />
                    )}
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.manga_series?.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 capitalize">
                        {item.status}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">Your library is empty</p>
              <Link 
                href="/browse"
                className="inline-block px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-all"
              >
                Browse Manga
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
