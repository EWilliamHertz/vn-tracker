'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/community/Navbar';
import Link from 'next/link';
import { UserPlus, UserMinus, MessageCircle, BookOpen, Users, Hash, MapPin, Globe, Loader2, Edit2, X, Check, Star, Clock, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  reading: { label: 'Reading', color: 'text-green-400' },
  completed: { label: 'Completed', color: 'text-blue-400' },
  plan_to_read: { label: 'Plan to Read', color: 'text-yellow-400' },
  on_hold: { label: 'On Hold', color: 'text-orange-400' },
  dropped: { label: 'Dropped', color: 'text-red-400' },
};

export default function ProfilePage() {
  const routeParams = useParams();
  const username = routeParams.username as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [readingList, setReadingList] = useState<any[]>([]);
  const [readingStats, setReadingStats] = useState({ total: 0, reading: 0, completed: 0, chapters: 0 });
  const [groups, setGroups] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'sent'>('none');
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'groups' | 'friends'>('library');
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);
      setProfileUserId(prof.id);
      setEditData({ display_name: prof.display_name || '', bio: prof.bio || '', pronouns: prof.pronouns || '', website: prof.website || '', location: prof.location || '' });

      const isOwnProfile = user?.id === prof.id;
      setIsOwn(isOwnProfile);

      // Fetch reading progress with manga info
      const { data: rl } = await supabase
        .from('reading_progress')
        .select('*, manga_series(id, title, image_url)')
        .eq('user_id', prof.id)
        .order('updated_at', { ascending: false })
        .limit(12);
      setReadingList(rl || []);

      // Calculate stats
      if (rl && rl.length > 0) {
        setReadingStats({
          total: rl.length,
          reading: rl.filter((r: any) => r.status === 'reading').length,
          completed: rl.filter((r: any) => r.status === 'completed').length,
          chapters: rl.reduce((sum: number, r: any) => sum + (r.current_chapter || 0), 0),
        });
      }

      // Fetch groups
      const { data: gm } = await supabase
        .from('group_members')
        .select('groups(id, name, member_count)')
        .eq('user_id', prof.id)
        .limit(8);
      setGroups(gm?.map((g: any) => g.groups).filter(Boolean) || []);

      // Fetch friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${prof.id},addressee_id.eq.${prof.id}`)
        .limit(12);
      
      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f: any) => 
          f.requester_id === prof.id ? f.addressee_id : f.requester_id
        );
        const { data: friendProfiles } = await supabase
          .from('user_profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', friendIds);
        setFriends(friendProfiles || []);
      }

      // Friendship status with current user
      if (user && !isOwnProfile) {
        const { data: fs } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${prof.id}),and(requester_id.eq.${prof.id},addressee_id.eq.${user.id})`)
          .single();
        if (fs) {
          if (fs.status === 'accepted') setFriendStatus('accepted');
          else if (fs.requester_id === user.id) setFriendStatus('sent');
          else setFriendStatus('pending');
        }
      }

      setLoading(false);
    };
    init();
  }, [username]);

  const sendFriendRequest = async () => {
    if (!currentUser || !profileUserId) return;
    const { error } = await supabase.from('friendships').insert({ requester_id: currentUser.id, addressee_id: profileUserId, status: 'pending' });
    if (!error) { setFriendStatus('sent'); toast.success('Friend request sent!'); }
    else toast.error('Could not send request');
  };

  const acceptFriendRequest = async () => {
    if (!currentUser || !profileUserId) return;
    await supabase.from('friendships').update({ status: 'accepted' }).eq('requester_id', profileUserId).eq('addressee_id', currentUser.id);
    setFriendStatus('accepted');
    toast.success('Friend request accepted!');
  };

  const removeFriend = async () => {
    if (!currentUser || !profileUserId) return;
    await supabase.from('friendships').delete().or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},addressee_id.eq.${currentUser.id})`);
    setFriendStatus('none');
    toast.success('Removed from friends');
  };

  const startConversation = async () => {
    if (!currentUser || !profileUserId) { window.location.href = '/login'; return; }
    setStartingChat(true);
    const { data: existing } = await supabase.from('conversations').select('id')
      .or(`and(participant_1.eq.${currentUser.id},participant_2.eq.${profileUserId}),and(participant_1.eq.${profileUserId},participant_2.eq.${currentUser.id})`)
      .single();
    if (existing) { window.location.href = '/community/messages'; }
    else {
      const { error } = await supabase.from('conversations').insert({ participant_1: currentUser.id, participant_2: profileUserId });
      if (!error) window.location.href = '/community/messages';
      else toast.error('Could not start conversation');
    }
    setStartingChat(false);
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    const { error } = await supabase.from('user_profiles').update({ ...editData, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
    if (!error) { setProfile((p: any) => ({ ...p, ...editData })); setEditMode(false); toast.success('Profile updated!'); }
    else toast.error('Failed to save');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] text-white">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 size={36} className="animate-spin text-violet-500" /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] text-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-gray-400 mb-6">@{username} doesn&apos;t exist</p>
          <Link href="/community" className="text-violet-400 hover:underline">← Browse Community</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <Navbar />

      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-600">
        {profile.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover" alt="" />}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-14 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 border-4 border-[#0d0d1a] flex items-center justify-center text-4xl font-bold overflow-hidden flex-shrink-0 shadow-xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  (profile.display_name || profile.username || 'U')[0].toUpperCase()
                )}
              </div>
              <div className="mb-2">
                <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                <p className="text-gray-400">@{profile.username}</p>
                {profile.pronouns && <p className="text-xs text-gray-500 mt-0.5">{profile.pronouns}</p>}
              </div>
            </div>

            <div className="flex gap-2 mb-2 flex-wrap">
              {isOwn ? (
                <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm transition">
                  <Edit2 size={14} /> Edit Profile
                </button>
              ) : currentUser ? (
                <>
                  <button onClick={startConversation} disabled={startingChat} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm transition">
                    {startingChat ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />} Message
                  </button>
                  {friendStatus === 'none' && (
                    <button onClick={sendFriendRequest} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition">
                      <UserPlus size={14} /> Add Friend
                    </button>
                  )}
                  {friendStatus === 'sent' && (
                    <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm opacity-60 cursor-default">
                      <Clock size={14} /> Request Sent
                    </button>
                  )}
                  {friendStatus === 'pending' && (
                    <button onClick={acceptFriendRequest} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-medium transition">
                      <Check size={14} /> Accept Request
                    </button>
                  )}
                  {friendStatus === 'accepted' && (
                    <button onClick={removeFriend} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-900/30 hover:text-red-400 border border-white/10 rounded-xl text-sm transition">
                      <UserMinus size={14} /> Friends ✓
                    </button>
                  )}
                </>
              ) : (
                <Link href="/login" className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition">
                  <UserPlus size={14} /> Sign in to connect
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bio + Meta */}
        {profile.bio && <p className="text-gray-300 text-sm mb-4 leading-relaxed max-w-xl">{profile.bio}</p>}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-6">
          {profile.location && <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>}
          {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-violet-400 hover:underline"><Globe size={12} /> {profile.website}</a>}
          <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Users size={12} /> {friends.length} friends</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'In Library', value: readingStats.total, color: 'from-violet-500/20 to-purple-500/20' },
            { label: 'Reading', value: readingStats.reading, color: 'from-green-500/20 to-emerald-500/20' },
            { label: 'Completed', value: readingStats.completed, color: 'from-blue-500/20 to-cyan-500/20' },
            { label: 'Chapters Read', value: readingStats.chapters, color: 'from-amber-500/20 to-orange-500/20' },
          ].map(stat => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-xl p-3 text-center`}>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 mb-6">
          {[
            { key: 'library' as const, label: 'Library', icon: BookOpen, count: readingStats.total },
            { key: 'groups' as const, label: 'Groups', icon: Hash, count: groups.length },
            { key: 'friends' as const, label: 'Friends', icon: Users, count: friends.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'library' && (
          <div className="pb-12">
            {readingList.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-xl p-12 text-center">
                <BookOpen size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No titles in library yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {readingList.map((item: any) => {
                  const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: 'text-gray-400' };
                  return (
                    <Link key={item.manga_id} href={`/manga/${item.manga_id}`} className="group">
                      <div className="rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-violet-500/30 transition">
                        <div className="aspect-[2/3] relative overflow-hidden">
                          {item.manga_series?.image_url ? (
                            <img src={item.manga_series.image_url} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt={item.manga_series?.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/30 to-purple-900/30">
                              <BookOpen size={24} className="text-gray-600" />
                            </div>
                          )}
                          {/* Status badge */}
                          <div className="absolute top-2 right-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-black/70 backdrop-blur ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          {/* Progress bar */}
                          {item.current_chapter > 0 && item.total_chapters > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div className="h-full bg-violet-500" style={{ width: `${Math.min(100, (item.current_chapter / item.total_chapters) * 100)}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate text-white">{item.manga_series?.title || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">
                            Ch. {item.current_chapter || 0}
                            {item.total_chapters ? ` / ${item.total_chapters}` : ''}
                            {item.rating ? ` · ★${item.rating}` : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="pb-12">
            {groups.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-xl p-12 text-center">
                <Hash size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Not in any groups yet</p>
                <Link href="/community/groups" className="inline-block mt-3 text-violet-400 text-sm hover:underline">Browse groups →</Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {groups.map((g: any) => (
                  <Link key={g.id} href={`/community/groups/${g.id}`} className="flex items-center gap-3 bg-white/5 border border-white/5 hover:border-violet-500/30 rounded-xl p-4 transition">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center text-lg font-bold">#</div>
                    <div>
                      <p className="font-medium text-sm">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.member_count?.toLocaleString() || 0} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="pb-12">
            {friends.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-xl p-12 text-center">
                <Users size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No friends yet</p>
                <Link href="/community" className="inline-block mt-3 text-violet-400 text-sm hover:underline">Browse community →</Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {friends.map((f: any) => (
                  <Link key={f.id} href={`/profile/${f.username}`} className="flex items-center gap-3 bg-white/5 border border-white/5 hover:border-violet-500/30 rounded-xl p-4 transition">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold overflow-hidden">
                      {f.avatar_url ? <img src={f.avatar_url} className="w-full h-full object-cover" alt="" /> : (f.display_name || f.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{f.display_name || f.username}</p>
                      <p className="text-xs text-gray-500">@{f.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setEditMode(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Display Name</label>
                <input type="text" value={editData.display_name} onChange={e => setEditData((p: any) => ({ ...p, display_name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Bio</label>
                <textarea value={editData.bio} onChange={e => setEditData((p: any) => ({ ...p, bio: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Pronouns</label>
                  <input type="text" value={editData.pronouns} placeholder="they/them" onChange={e => setEditData((p: any) => ({ ...p, pronouns: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Location</label>
                  <input type="text" value={editData.location} placeholder="Tokyo, JP" onChange={e => setEditData((p: any) => ({ ...p, location: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Website</label>
                <input type="url" value={editData.website} placeholder="https://yoursite.com" onChange={e => setEditData((p: any) => ({ ...p, website: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm transition">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-medium transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
