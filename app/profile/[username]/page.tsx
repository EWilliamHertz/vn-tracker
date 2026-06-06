'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/community/Navbar';
import Link from 'next/link';
import { UserPlus, UserMinus, MessageCircle, BookOpen, Users, Hash, MapPin, Globe, Loader2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [readingList, setReadingList] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'sent'>('none');
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Find profile by username
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', params.username)
        .single();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);
      setProfileUserId(prof.id);
      setEditData({ display_name: prof.display_name || '', bio: prof.bio || '', pronouns: prof.pronouns || '', website: prof.website || '', location: prof.location || '' });

      const isOwnProfile = user?.id === prof.id;
      setIsOwn(isOwnProfile);

      // Fetch reading list
      const { data: rl } = await supabase
        .from('user_library')
        .select('*, manga_series(title, cover_image_url)')
        .eq('user_id', prof.id)
        .limit(6);
      setReadingList(rl || []);

      // Fetch groups
      const { data: gm } = await supabase
        .from('group_members')
        .select('groups(id, name, slug, member_count)')
        .eq('user_id', prof.id)
        .limit(6);
      setGroups(gm?.map((g: any) => g.groups).filter(Boolean) || []);

      // Friendship status
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
  }, [params.username]);

  const sendFriendRequest = async () => {
    if (!currentUser || !profileUserId) return;
    const { error } = await supabase.from('friendships').insert({ requester_id: currentUser.id, addressee_id: profileUserId, status: 'pending' });
    if (!error) {
      setFriendStatus('sent');
      toast.success('Friend request sent!');
    }
  };

  const acceptFriendRequest = async () => {
    if (!currentUser || !profileUserId) return;
    await supabase.from('friendships')
      .update({ status: 'accepted' })
      .eq('requester_id', profileUserId)
      .eq('addressee_id', currentUser.id);
    setFriendStatus('accepted');
    toast.success('Friend request accepted!');
  };

  const removeFriend = async () => {
    if (!currentUser || !profileUserId) return;
    await supabase.from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},addressee_id.eq.${currentUser.id})`);
    setFriendStatus('none');
    toast.success('Removed from friends');
  };

  const startConversation = async () => {
    if (!currentUser || !profileUserId) { window.location.href = '/login'; return; }
    setStartingChat(true);

    // Check for existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${currentUser.id},participant_2.eq.${profileUserId}),and(participant_1.eq.${profileUserId},participant_2.eq.${currentUser.id})`)
      .single();

    if (existing) {
      window.location.href = `/community/messages`;
    } else {
      const { error } = await supabase.from('conversations').insert({
        participant_1: currentUser.id,
        participant_2: profileUserId,
      });
      if (!error) window.location.href = `/community/messages`;
      else toast.error('Could not start conversation');
    }
    setStartingChat(false);
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    const { error } = await supabase.from('user_profiles')
      .update({ ...editData, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);
    if (!error) {
      setProfile((p: any) => ({ ...p, ...editData }));
      setEditMode(false);
      toast.success('Profile updated!');
    } else {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 size={36} className="animate-spin text-[#8b5cf6]" /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-gray-400 mb-6">@{params.username} doesn't exist</p>
          <Link href="/community" className="text-[#8b5cf6] hover:underline">← Browse Community</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      <Navbar />

      {/* Banner */}
      <div className="relative h-36 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9]">
        {profile.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover" alt="" />}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-12 mb-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-[#8b5cf6] border-4 border-[#1a1a24] flex items-center justify-center text-3xl font-bold overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                (profile.display_name || profile.username || 'U')[0].toUpperCase()
              )}
            </div>
            <div className="mb-1">
              <h1 className="text-xl font-bold">{profile.display_name || profile.username}</h1>
              <p className="text-gray-400 text-sm">@{profile.username}</p>
              {profile.pronouns && <p className="text-xs text-gray-500 mt-0.5">{profile.pronouns}</p>}
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            {isOwn ? (
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2 bg-[#23232f] hover:bg-[#2d2d3d] border border-gray-700 rounded-lg text-sm transition-all">
                <Edit2 size={14} /> Edit Profile
              </button>
            ) : currentUser ? (
              <>
                <button
                  onClick={startConversation}
                  disabled={startingChat}
                  className="flex items-center gap-2 px-4 py-2 bg-[#23232f] hover:bg-[#2d2d3d] border border-gray-700 rounded-lg text-sm transition-all"
                >
                  {startingChat ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />} Message
                </button>
                {friendStatus === 'none' && (
                  <button onClick={sendFriendRequest} className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm transition-all">
                    <UserPlus size={14} /> Add Friend
                  </button>
                )}
                {friendStatus === 'sent' && (
                  <button disabled className="flex items-center gap-2 px-4 py-2 bg-[#23232f] border border-gray-700 rounded-lg text-sm opacity-60 cursor-default">
                    Request Sent
                  </button>
                )}
                {friendStatus === 'pending' && (
                  <button onClick={acceptFriendRequest} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-all">
                    <Check size={14} /> Accept
                  </button>
                )}
                {friendStatus === 'accepted' && (
                  <button onClick={removeFriend} className="flex items-center gap-2 px-4 py-2 bg-[#23232f] hover:bg-red-900/30 hover:text-red-400 border border-gray-700 rounded-lg text-sm transition-all">
                    <UserMinus size={14} /> Friends
                  </button>
                )}
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm transition-all">
                <UserPlus size={14} /> Follow
              </Link>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-300 text-sm mb-4 leading-relaxed max-w-xl">{profile.bio}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-6">
          {profile.location && <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>}
          {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#8b5cf6] hover:underline"><Globe size={12} /> {profile.website}</a>}
          <span className="flex items-center gap-1">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Reading List */}
          <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm"><BookOpen size={14} className="text-[#8b5cf6]" /> Reading List</h2>
            {readingList.length === 0 ? (
              <p className="text-xs text-gray-500">No titles in library yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {readingList.map((item: any) => (
                  <div key={item.id} className="rounded-lg overflow-hidden bg-[#1a1a24] border border-gray-800">
                    {item.manga_series?.cover_image_url ? (
                      <img src={item.manga_series.cover_image_url} className="w-full h-20 object-cover" alt={item.manga_series?.title} />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center bg-[#2d2d3d]"><BookOpen size={20} className="text-gray-600" /></div>
                    )}
                    <p className="text-xs p-1 truncate text-gray-400">{item.manga_series?.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm"><Hash size={14} className="text-[#8b5cf6]" /> Groups</h2>
            {groups.length === 0 ? (
              <p className="text-xs text-gray-500">Not in any groups yet</p>
            ) : (
              <div className="space-y-2">
                {groups.map((g: any) => (
                  <Link key={g.id} href={`/community/groups/${g.id}`} className="flex items-center gap-2 hover:bg-[#2d2d3d] rounded-lg p-2 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center text-xs">#</div>
                    <div>
                      <p className="text-xs font-medium">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.member_count?.toLocaleString()} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#23232f] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setEditMode(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Display Name</label>
                <input type="text" value={editData.display_name} onChange={e => setEditData((p: any) => ({ ...p, display_name: e.target.value }))} className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Bio</label>
                <textarea value={editData.bio} onChange={e => setEditData((p: any) => ({ ...p, bio: e.target.value }))} className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6] resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Pronouns</label>
                  <input type="text" value={editData.pronouns} placeholder="they/them" onChange={e => setEditData((p: any) => ({ ...p, pronouns: e.target.value }))} className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Location</label>
                  <input type="text" value={editData.location} placeholder="Tokyo, JP" onChange={e => setEditData((p: any) => ({ ...p, location: e.target.value }))} className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Website</label>
                <input type="url" value={editData.website} placeholder="https://yoursite.com" onChange={e => setEditData((p: any) => ({ ...p, website: e.target.value }))} className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 bg-[#1a1a24] hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
