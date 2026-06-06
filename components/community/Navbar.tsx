'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BookOpen, Users, MessageCircle, Bell, ChevronDown, LogOut, Settings, User, Shield } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(prof);

        // Count unread messages
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .is('read_at', null)
          .neq('sender_id', user.id);
        setUnreadCount(msgCount || 0);

        // Count unread notifications
        const { count: nCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        setNotifCount(nCount || 0);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="border-b border-gray-800 bg-[#23232f]/95 sticky top-0 z-50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#8b5cf6] flex items-center gap-2">
          <BookOpen size={24} />
          Ouryie
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/browse" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
            Discover
          </Link>
          <Link href="/community" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1">
            <Users size={15} /> Community
          </Link>
          <Link href="/community/groups" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
            Groups
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Messages */}
              <Link href="/community/messages" className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#8b5cf6] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link href="/community" className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-[#2d2d3d] hover:bg-[#35354a] rounded-lg transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="avatar" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#8b5cf6] flex items-center justify-center text-xs font-bold">
                      {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white hidden sm:block max-w-24 truncate">
                    {profile?.display_name || profile?.username || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#23232f] border border-gray-700 rounded-xl shadow-xl z-50">
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-sm font-semibold text-white truncate">{profile?.display_name || 'Set up profile'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#2d2d3d] rounded-lg transition-colors">
                        <BookOpen size={16} /> My Library
                      </Link>
                      <Link href={profile?.username ? `/profile/${profile.username}` : '/dashboard'} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#2d2d3d] rounded-lg transition-colors">
                        <User size={16} /> My Profile
                      </Link>
                      <Link href="/dashboard?tab=settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#2d2d3d] rounded-lg transition-colors">
                        <Settings size={16} /> Settings
                      </Link>
                      {user.user_metadata?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-[#f87171] hover:bg-[#2d2d3d] rounded-lg transition-colors">
                          <Shield size={16} /> Admin Panel
                        </Link>
                      )}
                      <hr className="my-1 border-gray-700" />
                      <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-[#2d2d3d] rounded-lg transition-colors">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/sign-up" className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm rounded-lg transition-all font-medium">
                Join Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
