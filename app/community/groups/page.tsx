'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/community/Navbar';
import Link from 'next/link';
import { Users, Search, Plus, Hash, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  member_count: number;
  post_count: number;
  tags: string[];
  cover_url?: string;
  created_at: string;
}

export default function GroupsPage() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', tags: '' });
  const supabase = createClient();

  const allTags = ['action', 'romance', 'horror', 'fantasy', 'isekai', 'slice-of-life', 'shounen', 'shoujo', 'manhwa', 'visual-novel', 'dark', 'adventure', 'thriller', 'beginner'];

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
        setMyGroupIds(new Set(memberships?.map(m => m.group_id) || []));
      }
      const { data: groupData } = await supabase.from('groups').select('*').eq('is_public', true).order('member_count', { ascending: false });
      setGroups(groupData || []);
      setLoading(false);
    };
    init();
  }, []);

  const joinGroup = async (groupId: string) => {
    if (!user) { window.location.href = '/login'; return; }
    if (myGroupIds.has(groupId)) {
      window.location.href = `/community/groups/${groupId}`;
      return;
    }
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, role: 'member' });
    if (!error) {
      const cnt = groups.find(g => g.id === groupId)?.member_count || 0;
      await supabase.from('groups').update({ member_count: cnt + 1 }).eq('id', groupId);
      setMyGroupIds(prev => new Set([...prev, groupId]));
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g));
      toast.success('Joined group!');
    }
  };

  const createGroup = async () => {
    if (!user || !newGroup.name.trim()) return;
    setCreating(true);
    const slug = newGroup.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const tags = newGroup.tags.split(',').map(t => t.trim()).filter(Boolean);

    const { data, error } = await supabase
      .from('groups')
      .insert({ name: newGroup.name.trim(), slug, description: newGroup.description.trim(), tags, created_by: user.id, member_count: 1, is_public: true })
      .select()
      .single();

    if (!error && data) {
      await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'admin' });
      setGroups(prev => [data, ...prev]);
      setMyGroupIds(prev => new Set([...prev, data.id]));
      setShowCreate(false);
      setNewGroup({ name: '', description: '', tags: '' });
      toast.success(`Group "${data.name}" created!`);
    } else {
      toast.error('Failed to create group. Name may already be taken.');
    }
    setCreating(false);
  };

  const filtered = groups.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || g.tags?.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Community Groups</h1>
            <p className="text-gray-400">Find your people. {groups.length} groups and counting.</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm font-medium transition-all"
            >
              <Plus size={16} /> Create Group
            </button>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#23232f] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedTag('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedTag ? 'bg-[#8b5cf6] text-white' : 'bg-[#23232f] text-gray-400 hover:text-white border border-gray-700'}`}>All</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTag === tag ? 'bg-[#8b5cf6] text-white' : 'bg-[#23232f] text-gray-400 hover:text-white border border-gray-700'}`}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#8b5cf6]" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(group => (
              <div key={group.id} className="bg-[#23232f] border border-gray-800 rounded-xl overflow-hidden hover:border-[#8b5cf6]/50 transition-all group">
                {/* Cover */}
                <div className="h-24 relative bg-gradient-to-br from-[#8b5cf6]/40 to-[#6d28d9]/40">
                  {group.cover_url && <img src={group.cover_url} className="w-full h-full object-cover opacity-60" alt="" />}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/80 flex items-center justify-center">
                      <Hash size={22} className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1.5">
                    <Link href={`/community/groups/${group.id}`} className="font-bold text-base hover:text-[#8b5cf6] transition-colors group-hover:text-[#8b5cf6]">
                      {group.name}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{group.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {group.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-[#1a1a24] text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users size={12} /> {group.member_count.toLocaleString()} members
                    </div>
                    <button
                      onClick={() => joinGroup(group.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        myGroupIds.has(group.id)
                          ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30'
                          : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]'
                      }`}
                    >
                      {myGroupIds.has(group.id) ? 'Open →' : <><Plus size={11} /> Join</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#23232f] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Create a Group</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Group Name *</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Isekai Enthusiasts"
                    className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
                  <textarea
                    value={newGroup.description}
                    onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))}
                    placeholder="What's this group about?"
                    className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newGroup.tags}
                    onChange={e => setNewGroup(p => ({ ...p, tags: e.target.value }))}
                    placeholder="e.g., action, fantasy, adventure"
                    className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-[#1a1a24] hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
                <button
                  onClick={createGroup}
                  disabled={!newGroup.name.trim() || creating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
