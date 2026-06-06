'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageCircle, X, Send, ChevronLeft, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string;
  other_user?: any;
}

export default function MessageWidget() {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      await loadConversations(user.id);

      // Subscribe to new messages
      const channel = supabase
        .channel('widget-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== user.id) {
            setUnread(prev => prev + 1);
            // If chat is open for this conversation, add message
            setActiveConvo(prev => {
              if (prev?.id === msg.conversation_id) {
                setMessages(m => [...m, msg]);
              }
              return prev;
            });
          }
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
      .order('last_message_at', { ascending: false })
      .limit(20);

    if (!data) return;

    // Enrich with other user's profile
    const enriched = await Promise.all(data.map(async (c: Conversation) => {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('username, display_name, avatar_url')
        .eq('id', otherId)
        .single();
      return { ...c, other_user: prof };
    }));

    setConversations(enriched);
  };

  const openConversation = async (convo: Conversation) => {
    setActiveConvo(convo);
    setView('chat');

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true })
      .limit(50);

    setMessages(data || []);
    setUnread(0);
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
      // Update conversation last message
      await supabase
        .from('conversations')
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq('id', activeConvo.id);
    }

    setSending(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        >
          <MessageCircle size={24} className="text-white" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat Widget */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-[480px] bg-[#1a1a24] border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#23232f] border-b border-gray-700">
            <div className="flex items-center gap-2">
              {view === 'chat' && (
                <button onClick={() => { setView('list'); setActiveConvo(null); }} className="text-gray-400 hover:text-white mr-1">
                  <ChevronLeft size={18} />
                </button>
              )}
              <MessageCircle size={18} className="text-[#8b5cf6]" />
              <span className="font-semibold text-white text-sm">
                {view === 'chat' && activeConvo
                  ? activeConvo.other_user?.display_name || activeConvo.other_user?.username || 'Chat'
                  : 'Messages'}
              </span>
            </div>
            <div className="flex gap-2">
              <a href="/community/messages" className="text-xs text-[#8b5cf6] hover:text-[#7c3aed]">Open full</a>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Conversations List */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <MessageCircle size={40} className="text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No messages yet</p>
                  <p className="text-gray-500 text-xs mt-1">Visit someone's profile to start a conversation</p>
                </div>
              ) : (
                conversations.map(convo => (
                  <button
                    key={convo.id}
                    onClick={() => openConversation(convo)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#23232f] transition-colors border-b border-gray-800 text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#8b5cf6] flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {convo.other_user?.avatar_url ? (
                        <img src={convo.other_user.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                      ) : (
                        (convo.other_user?.display_name || convo.other_user?.username || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {convo.other_user?.display_name || convo.other_user?.username || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{convo.last_message || 'Start chatting!'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Chat View */}
          {view === 'chat' && activeConvo && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      msg.sender_id === user.id
                        ? 'bg-[#8b5cf6] text-white rounded-br-sm'
                        : 'bg-[#23232f] text-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 p-3 border-t border-gray-700">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#23232f] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-xl transition-colors"
                >
                  {sending ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
