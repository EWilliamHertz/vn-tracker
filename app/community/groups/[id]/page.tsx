'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/community/Navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users, Hash, Send, Heart, MessageCircle, Loader2, UserPlus, UserMinus, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  user_id: string;
  author?: { username: string; display_name: string; avatar_url: string };
  liked?: boolean;
  comments?: Comment[];
  showComments?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: { username: string; display_name: string; avatar_url: string };
}

export default function GroupPage() {
  const routeParams = useParams();
  const groupId = routeParams.id as string;
  const [user, setUser] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single();
      setGroup(groupData);

      const { data: memberData } = await supabase
        .from('group_members')
        .select('user_id, role, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })
        .limit(20);

      if (memberData) {
        const enriched = await Promise.all(memberData.map(async (m: any) => {
          const { data: prof } = await supabase.from('user_profiles').select('username, display_name, avatar_url').eq('id', m.user_id).single();
          return { ...m, profile: prof };
        }));
        setMembers(enriched);

        if (user) {
          const myMembership = memberData.find(m => m.user_id === user.id);
          setIsMember(!!myMembership);
          setMemberRole(myMembership?.role || null);
        }
      }

      const { data: postData } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (postData) {
        const enriched = await Promise.all(postData.map(async (post: any) => {
          const { data: author } = await supabase.from('user_profiles').select('username, display_name, avatar_url').eq('id', post.user_id).single();
          let liked = false;
          if (user) {
            const { data: like } = await supabase.from('post_likes').select('*').eq('post_id', post.id).eq('user_id', user.id).single();
            liked = !!like;
          }
          return { ...post, author, liked };
        }));
        setPosts(enriched);
      }

      setLoading(false);
    };
    init();
  }, [groupId]);

  const joinGroup = async () => {
    if (!user) { window.location.href = '/login'; return; }
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, role: 'member' });
    if (!error) {
      await supabase.from('groups').update({ member_count: (group?.member_count || 0) + 1 }).eq('id', groupId);
      setGroup((g: any) => g ? { ...g, member_count: g.member_count + 1 } : g);
      setIsMember(true);
      setMemberRole('member');
      toast.success(`Joined ${group?.name}!`);
    }
  };

  const leaveGroup = async () => {
    if (!user) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    if (!error) {
      await supabase.from('groups').update({ member_count: Math.max(0, (group?.member_count || 1) - 1) }).eq('id', groupId);
      setGroup((g: any) => g ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g);
      setIsMember(false);
      setMemberRole(null);
      toast.success('Left group');
    }
  };

  const createPost = async () => {
    if (!postContent.trim() || !user || posting) return;
    setPosting(true);
    const { data, error } = await supabase.from('group_posts').insert({ group_id: groupId, user_id: user.id, content: postContent.trim() }).select().single();
    if (!error && data) {
      const { data: profile } = await supabase.from('user_profiles').select('username, display_name, avatar_url').eq('id', user.id).single();
      setPosts(prev => [{ ...data, author: profile, liked: false }, ...prev]);
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

  const loadComments = async (postId: string) => {
    const { data } = await supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (data) {
      const enriched = await Promise.all(data.map(async (c: any) => {
        const { data: author } = await supabase.from('user_profiles').select('username, display_name, avatar_url').eq('id', c.user_id).single();
        return { ...c, author };
      }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: enriched, showComments: true } : p));
    }
  };

  const toggleComments = async (post: Post) => {
    if (post.showComments) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, showComments: false } : p));
    } else {
      await loadComments(post.id);
    }
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !user) return;
    const { data, error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, content: text }).select().single();
    if (!error && data) {
      const { data: author } = await supabase.from('user_profiles').select('username, display_name, avatar_url').eq('id', user.id).single();
      await supabase.from('group_posts').update({ comment_count: (posts.find(p => p.id === postId)?.comment_count || 0) + 1 }).eq('id', postId);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comment_count: p.comment_count + 1,
        comments: [...(p.comments || []), { ...data, author }]
      } : p));
      setCommentText(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 size={36} className="animate-spin text-[#8b5cf6]" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#1a1a24] text-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-3">Group Not Found</h1>
          <Link href="/community/groups" className="text-[#8b5cf6] hover:underline">← Back to Groups</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      <Navbar />

      {/* Group Banner */}
      <div className="relative h-40 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]">
        {group.cover_url && <img src={group.cover_url} className="w-full h-full object-cover opacity-40" alt="" />}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 max-w-6xl mx-auto px-4 flex items-end pb-4">
          <div className="flex items-end gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#8b5cf6] border-4 border-[#1a1a24] flex items-center justify-center">
              <Hash size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow">{group.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-200">
                <span className="flex items-center gap-1"><Users size={13} /> {group.member_count?.toLocaleString()} members</span>
                {group.tags?.slice(0, 3).map((t: string) => (
                  <span key={t} className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Group Actions */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/community/groups" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} /> All Groups
            </Link>
            {user && (
              isMember ? (
                <button onClick={leaveGroup} className="flex items-center gap-2 px-4 py-2 bg-[#23232f] hover:bg-red-900/30 hover:text-red-400 border border-gray-700 rounded-lg text-sm transition-all">
                  <UserMinus size={15} /> Leave Group
                </button>
              ) : (
                <button onClick={joinGroup} className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm font-medium transition-all">
                  <UserPlus size={15} /> Join Group
                </button>
              )
            )}
          </div>

          {/* Create Post */}
          {isMember && (
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4 mb-4">
              <textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder={`Share something with ${group.name}...`}
                className="w-full bg-[#1a1a24] border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] resize-none"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={createPost}
                  disabled={!postContent.trim() || posting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
                >
                  {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Post
                </button>
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-12 text-center">
              <MessageCircle size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No posts yet. Be the first to share!</p>
              {!isMember && !user && (
                <Link href="/login" className="inline-block mt-4 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm">Sign in to post</Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#8b5cf6] flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
                      {post.author?.avatar_url ? (
                        <img src={post.author.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        (post.author?.display_name || post.author?.username || '?')[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Link href={`/profile/${post.author?.username}`} className="font-semibold text-sm hover:text-[#8b5cf6] transition-colors">
                          {post.author?.display_name || post.author?.username || 'Anonymous'}
                        </Link>
                        <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-gray-200 text-sm mt-1.5 leading-relaxed">{post.content}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-800">
                    <button onClick={() => handleLike(post)} className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? 'text-[#8b5cf6]' : 'text-gray-500 hover:text-[#8b5cf6]'}`}>
                      <Heart size={15} fill={post.liked ? 'currentColor' : 'none'} /> {post.like_count}
                    </button>
                    <button onClick={() => toggleComments(post)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
                      <MessageCircle size={15} /> {post.comment_count} Comments
                    </button>
                  </div>

                  {/* Comments */}
                  {post.showComments && (
                    <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                      {(post.comments || []).map((comment: Comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#8b5cf6]/60 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                            {comment.author?.avatar_url ? <img src={comment.author.avatar_url} className="w-full h-full object-cover" alt="" /> : (comment.author?.display_name || '?')[0]?.toUpperCase()}
                          </div>
                          <div className="bg-[#1a1a24] rounded-xl px-3 py-1.5 flex-1">
                            <span className="text-xs font-semibold text-[#8b5cf6]">{comment.author?.display_name || comment.author?.username} </span>
                            <span className="text-xs text-gray-300">{comment.content}</span>
                          </div>
                        </div>
                      ))}
                      {user && isMember && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={commentText[post.id] || ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addComment(post.id)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
                          />
                          <button onClick={() => addComment(post.id)} className="px-3 py-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl transition-colors">
                            <Send size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-2">About</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{group.description}</p>
              {group.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {group.tags.map((t: string) => <span key={t} className="text-xs bg-[#1a1a24] text-gray-400 px-2 py-0.5 rounded-full">{t}</span>)}
                </div>
              )}
            </div>
            <div className="bg-[#23232f] border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users size={14} className="text-[#8b5cf6]" /> Members ({group.member_count?.toLocaleString()})</h3>
              <div className="space-y-2">
                {members.slice(0, 8).map((m: any) => (
                  <Link key={m.user_id} href={`/profile/${m.profile?.username || '#'}`} className="flex items-center gap-2 hover:bg-[#2d2d3d] rounded-lg p-1 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#8b5cf6] flex items-center justify-center text-xs font-bold overflow-hidden">
                      {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : (m.profile?.display_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{m.profile?.display_name || m.profile?.username || 'User'}</p>
                      {m.role !== 'member' && <p className="text-xs text-[#8b5cf6]">{m.role}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
