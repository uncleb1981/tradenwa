'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/store';
import { getSupabase, adaptListing, adaptMessage } from '@/lib/supabase';

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [text, setText] = useState('');
  const [tradeDone, setTradeDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    async function fetchConversation() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      // Fetch conversation + listing + profiles
      const { data: convRow, error } = await supabase
        .from('conversations')
        .select(`
          id, status, user_1_id, user_2_id, listing_id,
          listings(*, profiles(name, city, zip, completed_trades)),
          user1:profiles!conversations_user_1_id_fkey(id, name, city, completed_trades),
          user2:profiles!conversations_user_2_id_fkey(id, name, city, completed_trades)
        `)
        .eq('id', id)
        .single();

      if (error || !convRow) { router.push('/inbox'); return; }

      setConv(convRow);
      setTradeDone(convRow.status === 'completed');

      const isUser1 = convRow.user_1_id === authUser.id;
      setOtherUser(isUser1 ? convRow.user2 : convRow.user1);
      setListing(convRow.listings ? adaptListing(convRow.listings) : null);

      // Fetch messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      setMessages((msgs || []).map(adaptMessage));
      setLoading(false);
    }

    fetchConversation();

    // Subscribe to new messages via Realtime
    const supabase = getSupabase();
    const channel = supabase
      .channel(`conv-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, adaptMessage(payload.new)];
          });
        }
      )
      .subscribe();

    // Polling fallback every 3 seconds in case Realtime is not enabled
    const poll = setInterval(async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      if (msgs) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = msgs.map(adaptMessage).filter((m) => !existingIds.has(m.id));
          return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
        });
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !user || sending) return;
    setSending(true);
    try {
      const supabase = getSupabase();
      await supabase.from('messages').insert({
        conversation_id: id,
        sender_id: user.id,
        message: text.trim(),
      });
      setText('');
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  async function handleMarkComplete() {
    try {
      const supabase = getSupabase();
      await supabase
        .from('conversations')
        .update({ status: 'completed' })
        .eq('id', id);

      // Increment completed_trades for both users
      if (conv) {
        for (const userId of [conv.user_1_id, conv.user_2_id]) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('completed_trades')
            .eq('id', userId)
            .single();
          if (prof) {
            await supabase
              .from('profiles')
              .update({ completed_trades: (prof.completed_trades || 0) + 1 })
              .eq('id', userId);
          }
        }
      }

      setTradeDone(true);
    } catch {
      // ignore
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 border-4 border-green-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!conv || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/inbox" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <Avatar name={otherUser?.name || '?'} size="sm" />
        <div>
          <div className="font-bold text-gray-900">{otherUser?.name || 'Unknown'}</div>
          <div className="text-xs text-gray-400">{otherUser?.city || ''}</div>
        </div>
      </div>

      {/* Listing context card */}
      {listing && (
        <Link href={`/listings/${listing.id}`}>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-center gap-3 hover:bg-green-100 transition-colors">
            {listing.photo && (
              <img
                src={listing.photo}
                alt={listing.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-green-600 font-semibold mb-0.5">Trading for</div>
              <div className="text-sm font-bold text-gray-900 truncate">{listing.title}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="text-green-700">Have:</span> {listing.iHave} ·{' '}
                <span className="text-amber-600">Want:</span> {listing.iWantText}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
              {!isMe && <Avatar name={otherUser?.name || '?'} size="xs" className="mt-auto" />}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                isMe
                  ? 'bg-green-800 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.text}
                <div className={`text-xs mt-1 ${isMe ? 'text-green-300' : 'text-gray-400'}`}>
                  {timeAgo(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Mark complete */}
      {!tradeDone ? (
        <button
          onClick={handleMarkComplete}
          className="mb-3 w-full border-2 border-green-200 text-green-800 py-2 rounded-xl text-sm font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mark Trade Complete
        </button>
      ) : (
        <div className="mb-3 w-full bg-green-50 border border-green-200 text-green-700 py-2 rounded-xl text-sm font-semibold text-center">
          ✅ Trade marked complete!
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-green-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
