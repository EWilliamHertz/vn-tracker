'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/community/Navbar';
import Link from 'next/link';
import { Users, MessageCircle, Heart, Send, Image, Loader2, UserPlus, Hash, TrendingUp, BookOpen } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  group_id: string;
  user_id: string;
  group?: { name: string; slug: string };
  author?: { username: string; display_name: string; avatar_url: string };
  liked?: boolean;
}

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  member_count: number;
  tags: string[];
  cover_url?: string;
}

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [postContent, setPostContent] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'discover'>('feed');
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: prof } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        // Load user's group memberships
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
        const groupIds = memberships?.map(m => m.group_id) || [];

        if (groupIds.length > 0) {
          const { data: userGroups } = await supabase
            .from('groups')
            .select('*')
            .in('id', groupIds);
          setMyGroups(userGroups || []);

          // Load posts from joined groups
          const { data: feedPosts } = await supabase
            .from('group_posts')
            .select('*, groups(name, slug)')
            .in('group_id', groupIds)
            .order('created_at', { ascending: false })
            .limit(30);

          if (feedPosts) {
            const enriched = await Promise.all(feedPosts.map(async (post: any) => {
              const { data: author } = await supabase
                .from('user_profiles')
                .select('username, display_name, avatar_url')
                .eq('id', post.user_id)
                .single();
              const { data: like } = await supabase
                .from('post_likes')
                .select('*')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();
              return { ...post, group: post.groups, author, liked: !!like };
            }));
            setPosts(enriched);
          }
        }

        // Load friends
        const { data: friendData } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id, status')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted');
        
        if (friendData) {
          const friendIds = friendData.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
          if (friendIds.length > 0) {
            const { data: friendProfs } = await supabase
              .from('user_profiles')
              .select('*')
              .in('id', friendIds);
            setFriends(friendProfs || []);
          }
        }
      }

      // Load all public groups for discover
      const { data: allGroups } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .order('member_count', { ascending: false })
        .limit(12);
      setGroups(allGroups || []);

      setLoading(false);
    };
    init();
  }, []);

  const handlePost = async () => {
    if (!postContent.trim() || !selectedGroup || !user || posting) return;
    setPosting(true);
    
    const { data, error } = await supabase
      .from('group_posts')
      .insert({ group_id: selectedGroup, user_id: user.id, content: postContent.trim() })
      .select('*, groups(name, slug)')
      .single();

    if (!error && data) {
      const author = { username: profile?.username, display_name: profile?.display_name, avatar_url: profile?.avatar_url };
      setPosts(prev => [{ ...data, group: data.groups, author, liked: false }, ...prev]);
      setPostContent('');
    }
    setPosting(false);
  };

  const handleLike = async (post: Post) => {
    if (!user) return;
    if (post.liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      await supabase.from('group_posts').update({ like_count: post.like_count - 1 }).eq('id', post.id);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked: false, like_count: p.like_count - 1 } : p));
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      await supabase.from('group_posts').update({ like_count: post.like_count + 1 }).eq('id', post.id);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked: true, like_count: p.like_count + 1 } : p));
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) { window.location.href = '/login'; return; }
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, role: 'member' });
    if (!error) {
      await supabase.from('groups').update({ member_count: (groups.find(g => g.id === groupId)?.member_count || 0) + 1 }).eq('id', groupId);
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g));
      const group = groups.find(g => g.id === groupId);
      if (group) setMyGroups(prev => [...prev, group]);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Left Sidebar — Friends & Profile */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            {user && profile && (
              <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#8b5cf6] flex items-center justify-center font-bold text-lg">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      (profile.display_name || profile.username || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{profile.display_name || profile.username}</p>
                    <p className="text-xs text-gray-400">@{profile.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#1a1a24] rounded-lg p-2">
                    <p className="text-lg font-bold text-[#8b5cf6]">{friends.length}</p>
                    <p className="text-xs text-gray-400">Friends</p>
                  </div>
                  <div className="bg-[#1a1a24] rounded-lg p-2">
                    <p className="text-lg font-bold text-[#8b5cf6]">{myGroups.length}</p>
                    <p className="text-xs text-gray-400">Groups</p>
                  </div>
                </div>
              </div>
            )}

            {/* Friends list */}
            {friends.length > 0 && (
              <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users size={14} className="text-[#8b5cf6]" /> Friends</h3>
                <div className="space-y-2">
                  {friends.slice(0, 6).map((friend: any) => (
                    <Link key={friend.id} href={`/profile/${friend.username}`} className="flex items-center gap-2 hover:bg-[#2d2d3d] rounded-lg p-1.5 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[#8b5cf6] flex items-center justify-center text-xs font-bold">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                        ) : (
                          (friend.display_name || friend.username || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{friend.display_name || friend.username}</p>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                          <p className="text-xs text-gray-500">Online</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* My Groups */}
            {myGroups.length > 0 && (
              <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Hash size={14} className="text-[#8b5cf6]" /> My Groups</h3>
                <div className="space-y-1">
                  {myGroups.slice(0, 5).map(g => (
                    <Link key={g.id} href={`/community/groups/${g.id}`} className="flex items-center gap-2 hover:bg-[#2d2d3d] rounded-lg p-1.5 transition-colors">
                      <div className="w-6 h-6 rounded bg-[#8b5cf6]/20 flex items-center justify-center text-xs">#</div>
                      <p className="text-xs text-gray-300 truncate">{g.name}</p>
                    </Link>
                  ))}
                  <Link href="/community/groups" className="text-xs text-[#8b5cf6] hover:text-[#7c3aed] pl-2 block mt-1">Browse all groups →</Link>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-[#23232f] p-1 rounded-xl w-fit">
            <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'feed' ? 'bg-[#8b5cf6] text-white' : 'text-gray-400 hover:text-white'}`}>
              My Feed
            </button>
            <button onClick={() => setActiveTab('discover')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'discover' ? 'bg-[#8b5cf6] text-white' : 'text-gray-400 hover:text-white'}`}>
              Discover Groups
            </button>
          </div>

          {activeTab === 'feed' && (
            <>
              {/* Create Post */}
              {user && myGroups.length > 0 && (
                <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4 mb-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#8b5cf6] flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : (profile?.display_name || 'U')[0]?.toUpperCase()}
                    </div>
                    <textarea
                      value={postContent}
                      onChange={e => setPostContent(e.target.value)}
                      placeholder="Share something with your groups..."
                      className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedGroup}
                      onChange={e => setSelectedGroup(e.target.value)}
                      className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#8b5cf6]"
                    >
                      <option value="">Select a group...</option>
                      {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button
                      onClick={handlePost}
                      disabled={!postContent.trim() || !selectedGroup || posting}
                      className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
                    >
                      {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Post
                    </button>
                  </div>
                </div>
              )}

              {/* Feed */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-[#8b5cf6]" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-[#23232f] border border-gray-800 rounded-xl p-12 text-center">
                  <TrendingUp size={48} className="text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your feed is empty</h3>
                  <p className="text-gray-400 text-sm mb-6">Join some groups to start seeing posts from the community</p>
                  <button onClick={() => setActiveTab('discover')} className="px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm font-medium transition-all">
                    Discover Groups
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className="bg-[#23232f] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#8b5cf6] flex items-center justify-center font-bold flex-shrink-0">
                          {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                          ) : (
                            (post.author?.display_name || post.author?.username || '?')[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/profile/${post.author?.username}`} className="font-semibold text-sm hover:text-[#8b5cf6] transition-colors">
                              {post.author?.display_name || post.author?.username || 'Anonymous'}
                            </Link>
                            <span className="text-gray-500 text-xs">in</span>
                            <Link href={`/community/groups/${post.group_id}`} className="text-xs bg-[#8b5cf6]/20 text-[#8b5cf6] px-2 py-0.5 rounded-full hover:bg-[#8b5cf6]/30 transition-colors">
                              #{post.group?.name}
                            </Link>
                            <span className="text-gray-500 text-xs ml-auto">{timeAgo(post.created_at)}</span>
                          </div>
                          <p className="text-gray-200 text-sm mt-1.5 leading-relaxed">{post.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pt-2 border-t border-gray-800">
                        <button onClick={() => handleLike(post)} className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? 'text-[#8b5cf6]' : 'text-gray-500 hover:text-[#8b5cf6]'}`}>
                          <Heart size={15} fill={post.liked ? 'currentColor' : 'none'} /> {post.like_count}
                        </button>
                        <Link href={`/community/groups/${post.group_id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
                          <MessageCircle size={15} /> {post.comment_count} Comments
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'discover' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {groups.map(group => (
                <div key={group.id} className="bg-[#23232f] border border-gray-800 rounded-xl overflow-hidden hover:border-[#8b5cf6] transition-all">
                  <div className="h-16 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] relative">
                    {group.cover_url && <img src={group.cover_url} className="w-full h-full object-cover opacity-50" alt="" />}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Hash size={28} className="text-white/60" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/community/groups/${group.id}`} className="font-semibold hover:text-[#8b5cf6] transition-colors">{group.name}</Link>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} /> {group.member_count.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {group.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-[#1a1a24] text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                      {myGroups.some(g => g.id === group.id) ? (
                        <Link href={`/community/groups/${group.id}`} className="text-xs text-[#8b5cf6] font-medium">View →</Link>
                      ) : (
                        <button onClick={() => joinGroup(group.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-colors font-medium">
                          <UserPlus size={12} /> Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right Sidebar — Trending */}
        <aside className="hidden xl:block w-60 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-[#8b5cf6]" /> Trending Groups</h3>
              <div className="space-y-3">
                {groups.slice(0, 5).map((g, i) => (
                  <Link key={g.id} href={`/community/groups/${g.id}`} className="flex items-center gap-2 hover:bg-[#2d2d3d] rounded-lg p-1.5 transition-colors">
                    <span className="text-xs text-gray-500 w-4">#{i + 1}</span>
                    <div>
                      <p className="text-xs font-medium truncate">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.member_count.toLocaleString()} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BookOpen size={14} className="text-[#8b5cf6]" /> Quick Links</h3>
              <div className="space-y-1">
                <Link href="/browse" className="block text-xs text-gray-400 hover:text-white py-1 px-2 rounded hover:bg-[#2d2d3d] transition-colors">📚 Browse Manga</Link>
                <Link href="/community/messages" className="block text-xs text-gray-400 hover:text-white py-1 px-2 rounded hover:bg-[#2d2d3d] transition-colors">💬 Messages</Link>
                <Link href="/community/groups" className="block text-xs text-gray-400 hover:text-white py-1 px-2 rounded hover:bg-[#2d2d3d] transition-colors">🏘️ All Groups</Link>
                <Link href="/dashboard" className="block text-xs text-gray-400 hover:text-white py-1 px-2 rounded hover:bg-[#2d2d3d] transition-colors">📖 My Library</Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
