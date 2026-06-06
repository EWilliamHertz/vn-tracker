import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, MessageCircle, Settings, Hash, Shield } from 'lucide-react';
import Navbar from '@/components/community/Navbar';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: readingList } = await supabase
    .from('user_library')
    .select('*, manga_series(id, title, cover_image_url)')
    .eq('user_id', user.id);

  const { data: myGroups } = await supabase
    .from('group_members')
    .select('groups(id, name, slug, member_count)')
    .eq('user_id', user.id)
    .limit(6);

  const groups = myGroups?.map((g: any) => g.groups).filter(Boolean) || [];

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}! 👋
          </h1>
          <p className="text-gray-400 mt-1">Here's what's happening on Ouryie</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#23232f] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs mb-1">Currently Reading</p>
            <p className="text-3xl font-bold text-[#8b5cf6]">{readingList?.filter(r => r.status === 'reading').length || 0}</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-400">{readingList?.filter(r => r.status === 'completed').length || 0}</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs mb-1">Plan to Read</p>
            <p className="text-3xl font-bold text-blue-400">{readingList?.filter(r => r.status === 'planning').length || 0}</p>
          </div>
          <div className="bg-[#23232f] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs mb-1">Groups Joined</p>
            <p className="text-3xl font-bold text-yellow-400">{groups.length}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reading List */}
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen size={20} className="text-[#8b5cf6]" /> My Library
                </h2>
                <Link href="/browse" className="text-sm text-[#8b5cf6] hover:text-[#7c3aed]">Browse More →</Link>
              </div>

              {readingList && readingList.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {readingList.map((item: any) => (
                    <div key={item.id} className="group rounded-xl overflow-hidden bg-[#15151e] border border-gray-800 hover:border-[#8b5cf6]/50 transition-all">
                      <div className="aspect-[3/4] overflow-hidden">
                        {item.manga_series?.cover_image_url ? (
                          <img
                            src={item.manga_series.cover_image_url}
                            alt={item.manga_series?.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#2d2d3d]">
                            <BookOpen size={24} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-white truncate">{item.manga_series?.title || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen size={40} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-4">Your library is empty</p>
                  <Link href="/browse" className="inline-block px-5 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm transition-all">
                    Browse Manga
                  </Link>
                </div>
              )}
            </div>

            {/* My Groups */}
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Hash size={20} className="text-[#8b5cf6]" /> My Groups
                </h2>
                <Link href="/community/groups" className="text-sm text-[#8b5cf6] hover:text-[#7c3aed]">Browse Groups →</Link>
              </div>
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={36} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-4">You haven't joined any groups yet</p>
                  <Link href="/community/groups" className="inline-block px-5 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm transition-all">
                    Discover Groups
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {groups.map((g: any) => (
                    <Link key={g.id} href={`/community/groups/${g.id}`} className="flex items-center gap-2 bg-[#15151e] border border-gray-800 hover:border-[#8b5cf6]/50 rounded-xl p-3 transition-all">
                      <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center flex-shrink-0">
                        <Hash size={16} className="text-[#8b5cf6]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{g.name}</p>
                        <p className="text-xs text-gray-500">{g.member_count} members</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#8b5cf6] flex items-center justify-center font-bold text-lg overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    (profile?.display_name || user.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{profile?.display_name || profile?.username || user.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              {profile?.username && (
                <Link href={`/profile/${profile.username}`} className="block w-full text-center py-2 bg-[#1a1a24] hover:bg-[#2d2d3d] border border-gray-700 rounded-lg text-xs transition-colors mb-2">
                  View My Profile
                </Link>
              )}
              <Link href="/community" className="block w-full text-center py-2 bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 text-[#8b5cf6] rounded-lg text-xs transition-colors">
                Go to Community Feed
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                <Link href="/community/messages" className="flex items-center gap-3 px-3 py-2 hover:bg-[#2d2d3d] rounded-lg transition-colors text-sm text-gray-300">
                  <MessageCircle size={16} className="text-[#8b5cf6]" /> Messages
                </Link>
                <Link href="/browse" className="flex items-center gap-3 px-3 py-2 hover:bg-[#2d2d3d] rounded-lg transition-colors text-sm text-gray-300">
                  <BookOpen size={16} className="text-[#8b5cf6]" /> Browse Manga
                </Link>
                <Link href="/community/groups" className="flex items-center gap-3 px-3 py-2 hover:bg-[#2d2d3d] rounded-lg transition-colors text-sm text-gray-300">
                  <Users size={16} className="text-[#8b5cf6]" /> Discover Groups
                </Link>
                {user.user_metadata?.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-3 px-3 py-2 hover:bg-[#2d2d3d] rounded-lg transition-colors text-sm text-[#f87171]">
                    <Shield size={16} /> Admin Panel
                  </Link>
                )}
              </div>
            </div>

            {/* Sign Out */}
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
              <form action={handleSignOut}>
                <button type="submit" className="w-full py-2 text-xs text-gray-400 hover:text-white hover:bg-[#2d2d3d] rounded-lg transition-colors">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
