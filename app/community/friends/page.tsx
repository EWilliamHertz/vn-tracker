'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/community/Navbar';
import Link from 'next/link';
import { Users, UserPlus, UserMinus, MessageCircle, Search, Loader2, Check, X, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  profile?: Friend;
}

export default function FriendsPage() {
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);
      await loadFriends(user.id);
      await loadRequests(user.id);
      setLoading(false);
    };
    init();
  }, []);

  const loadFriends = async (userId: string) => {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url, bio')
        .in('id', friendIds);
      setFriends(profiles || []);
    }
  };

  const loadRequests = async (userId: string) => {
    // Incoming
    const { data: inc } = await supabase
      .from('friendships')
      .select('*')
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    if (inc) {
      const enriched = await Promise.all(inc.map(async (r) => {
        const { data: prof } = await supabase.from('user_profiles').select('id, username, display_name, avatar_url, bio').eq('id', r.requester_id).single();
        return { ...r, profile: prof };
      }));
      setIncoming(enriched);
    }

    // Outgoing
    const { data: out } = await supabase
      .from('friendships')
      .select('*')
      .eq('requester_id', userId)
      .eq('status', 'pending');
    if (out) {
      const enriched = await Promise.all(out.map(async (r) => {
        const { data: prof } = await supabase.from('user_profiles').select('id, username, display_name, avatar_url, bio').eq('id', r.addressee_id).single();
        return { ...r, profile: prof };
      }));
      setOutgoing(enriched);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, avatar_url, bio')
      .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .neq('id', user.id)
      .limit(20);
    setSearchResults(data || []);
    setSearching(false);
  };

  const acceptRequest = async (requestId: string, requesterId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('requester_id', requesterId).eq('addressee_id', user.id);
    setIncoming(prev => prev.filter(r => r.requester_id !== requesterId));
    const req = incoming.find(r => r.requester_id === requesterId);
    if (req?.profile) setFriends(prev => [...prev, req.profile!]);
    toast.success('Friend request accepted!');
  };

  const declineRequest = async (requesterId: string) => {
    await supabase.from('friendships').delete().eq('requester_id', requesterId).eq('addressee_id', user.id);
    setIncoming(prev => prev.filter(r => r.requester_id !== requesterId));
    toast.success('Request declined');
  };

  const cancelRequest = async (addresseeId: string) => {
    await supabase.from('friendships').delete().eq('requester_id', user.id).eq('addressee_id', addresseeId);
    setOutgoing(prev => prev.filter(r => r.addressee_id !== addresseeId));
    toast.success('Request cancelled');
  };

  const removeFriend = async (friendId: string) => {
    await supabase.from('friendships').delete()
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`);
    setFriends(prev => prev.filter(f => f.id !== friendId));
    toast.success('Friend removed');
  };

  const sendRequest = async (targetId: string) => {
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: targetId, status: 'pending' });
    if (!error) {
      toast.success('Friend request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== targetId));
    } else {
      toast.error('Could not send request');
    }
  };

  const startChat = async (friendId: string) => {
    const { data: existing } = await supabase.from('conversations').select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${friendId}),and(participant_1.eq.${friendId},participant_2.eq.${user.id})`)
      .single();
    if (existing) { window.location.href = '/community/messages'; }
    else {
      await supabase.from('conversations').insert({ participant_1: user.id, participant_2: friendId });
      window.location.href = '/community/messages';
    }
  };

  const Avatar = ({ user: u, size = 'md' }: { user: Friend; size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-xl' };
    return (
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0`}>
        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : (u.display_name || u.username || '?')[0].toUpperCase()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] text-white">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 size={36} className="animate-spin text-violet-500" /></div>
      </div>
    );
  }

  const totalRequests = incoming.length + outgoing.length;

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Users className="text-violet-400" /> Friends
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 mb-6">
          {[
            { key: 'friends' as const, label: 'My Friends', count: friends.length },
            { key: 'requests' as const, label: 'Requests', count: totalRequests },
            { key: 'find' as const, label: 'Find People', count: null },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key ? 'border-violet-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  tab.key === 'requests' && incoming.length > 0 ? 'bg-violet-600' : 'bg-white/10'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Friends List */}
        {activeTab === 'friends' && (
          friends.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-12 text-center">
              <Users size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No friends yet</p>
              <button onClick={() => setActiveTab('find')} className="text-violet-400 text-sm hover:underline">Find people to connect with →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4 hover:border-violet-500/20 transition">
                  <Link href={`/profile/${f.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar user={f} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{f.display_name || f.username}</p>
                      <p className="text-xs text-gray-500">@{f.username}</p>
                      {f.bio && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{f.bio}</p>}
                    </div>
                  </Link>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startChat(f.id)} className="p-2.5 bg-white/10 hover:bg-white/15 rounded-lg transition" title="Message">
                      <MessageCircle size={16} />
                    </button>
                    <button onClick={() => removeFriend(f.id)} className="p-2.5 bg-white/10 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition" title="Remove friend">
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Friend Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {incoming.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Incoming Requests ({incoming.length})</h3>
                <div className="space-y-3">
                  {incoming.map(r => r.profile && (
                    <div key={r.requester_id} className="flex items-center justify-between bg-white/5 border border-violet-500/20 rounded-xl p-4">
                      <Link href={`/profile/${r.profile.username}`} className="flex items-center gap-3 min-w-0">
                        <Avatar user={r.profile} />
                        <div>
                          <p className="font-medium text-sm">{r.profile.display_name || r.profile.username}</p>
                          <p className="text-xs text-gray-500">@{r.profile.username}</p>
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <button onClick={() => acceptRequest(r.id, r.requester_id)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition">
                          <Check size={14} /> Accept
                        </button>
                        <button onClick={() => declineRequest(r.requester_id)} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-red-900/30 hover:text-red-400 rounded-lg text-sm transition">
                          <X size={14} /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outgoing.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sent Requests ({outgoing.length})</h3>
                <div className="space-y-3">
                  {outgoing.map(r => r.profile && (
                    <div key={r.addressee_id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4">
                      <Link href={`/profile/${r.profile.username}`} className="flex items-center gap-3 min-w-0">
                        <Avatar user={r.profile} />
                        <div>
                          <p className="font-medium text-sm">{r.profile.display_name || r.profile.username}</p>
                          <p className="text-xs text-gray-500">@{r.profile.username}</p>
                        </div>
                      </Link>
                      <button onClick={() => cancelRequest(r.addressee_id)} className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition">Cancel</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="bg-white/5 border border-white/5 rounded-xl p-12 text-center">
                <UserCheck size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No pending requests</p>
              </div>
            )}
          </div>
        )}

        {/* Find People */}
        {activeTab === 'find' && (
          <div>
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchUsers()}
                  placeholder="Search by username or display name..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <button
                onClick={searchUsers}
                disabled={searching || !searchTerm.trim()}
                className="px-5 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-medium transition"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map(u => {
                  const isFriend = friends.some(f => f.id === u.id);
                  const isPending = outgoing.some(r => r.addressee_id === u.id);
                  return (
                    <div key={u.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4">
                      <Link href={`/profile/${u.username}`} className="flex items-center gap-3 min-w-0">
                        <Avatar user={u} />
                        <div>
                          <p className="font-medium text-sm">{u.display_name || u.username}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                          {u.bio && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{u.bio}</p>}
                        </div>
                      </Link>
                      {isFriend ? (
                        <span className="text-xs text-green-400 flex items-center gap-1"><UserCheck size={14} /> Friends</span>
                      ) : isPending ? (
                        <span className="text-xs text-gray-400">Request sent</span>
                      ) : (
                        <button onClick={() => sendRequest(u.id)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition">
                          <UserPlus size={14} /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !searching && (
              <div className="bg-white/5 border border-white/5 rounded-xl p-12 text-center">
                <Search size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No users found for &ldquo;{searchTerm}&rdquo;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
