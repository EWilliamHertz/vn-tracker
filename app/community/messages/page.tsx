'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/community/Navbar';
import { MessageCircle, Send, Search, Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  conversation_id?: string;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string;
  other_user?: any;
  unread?: number;
}

function MessagesPageContent() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);
      await loadConversations(user.id);
      setLoading(false);

      // Subscribe to new messages
      const channel = supabase
        .channel('messages-page')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new as Message;
          setActiveConvo(current => {
            if (current?.id === msg.conversation_id) {
              setMessages(prev => [...prev, msg]);
            }
            return current;
          });
          // Refresh conversations to show new last message
          loadConversations(user.id);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async (userId: string) => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (!data) return;

    const enriched = await Promise.all(data.map(async (c: Conversation) => {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', otherId)
        .single();
      return { ...c, other_user: prof };
    }));

    setConversations(enriched);
  };

  const openConversation = async (convo: Conversation) => {
    setActiveConvo(convo);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConvo.id, sender_id: user.id, content })
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
      await supabase
        .from('conversations')
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq('id', activeConvo.id);
    }
    setSending(false);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(c =>
    !searchTerm ||
    c.other_user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.other_user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1a1a24] text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto h-[calc(100vh-60px)] flex">

        {/* Conversations List */}
        <div className={`w-80 flex-shrink-0 border-r border-gray-800 flex flex-col ${activeConvo ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-bold mb-3">Messages</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#23232f] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[#8b5cf6]" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle size={36} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-500 text-xs mt-1">Find people on the community page or in groups</p>
                <Link href="/community" className="inline-block mt-3 text-xs text-[#8b5cf6] hover:text-[#7c3aed]">Browse Community →</Link>
              </div>
            ) : (
              filteredConversations.map(convo => (
                <button
                  key={convo.id}
                  onClick={() => openConversation(convo)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#23232f] transition-colors border-b border-gray-800 text-left ${activeConvo?.id === convo.id ? 'bg-[#23232f] border-l-2 border-l-[#8b5cf6]' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#8b5cf6] flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                    {convo.other_user?.avatar_url ? (
                      <img src={convo.other_user.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (convo.other_user?.display_name || convo.other_user?.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-semibold truncate">
                        {convo.other_user?.display_name || convo.other_user?.username || 'User'}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(convo.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{convo.last_message || 'No messages yet'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
          {activeConvo ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#23232f]">
                <button onClick={() => setActiveConvo(null)} className="md:hidden text-gray-400 hover:text-white">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-[#8b5cf6] flex items-center justify-center text-sm font-bold overflow-hidden">
                  {activeConvo.other_user?.avatar_url ? (
                    <img src={activeConvo.other_user.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    (activeConvo.other_user?.display_name || '?')[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{activeConvo.other_user?.display_name || activeConvo.other_user?.username}</p>
                  <p className="text-xs text-green-400">● Online</p>
                </div>
                <Link href={`/profile/${activeConvo.other_user?.username}`} className="ml-auto text-xs text-[#8b5cf6] hover:text-[#7c3aed]">
                  View Profile
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle size={48} className="text-gray-700 mb-3" />
                    <p className="text-gray-400">Say hello! 👋</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === user?.id;
                  const showTime = i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-[#8b5cf6] text-white rounded-br-sm'
                            : 'bg-[#23232f] text-gray-200 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        {showTime && (
                          <span className="text-xs text-gray-600 mt-1 px-1">{formatTime(msg.created_at)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#23232f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-xl transition-colors"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle size={64} className="text-gray-700 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your messages</h3>
              <p className="text-gray-400 text-sm max-w-xs">Select a conversation from the list, or find people in the community to message.</p>
              <Link href="/community" className="mt-6 px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg text-sm font-medium transition-all">
                Browse Community
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a24] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-[#8b5cf6]" /></div>}>
      <MessagesPageContent />
    </Suspense>
  );
}
