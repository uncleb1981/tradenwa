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
  const [listingOwnerId, setListingOwnerId] = useState(null);
  const [removed, setRemoved] = useState(false);
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
      setRemoved(convRow.listings?.status === 'traded');

      const isUser1 = convRow.user_1_id === authUser.id;
      setOtherUser(isUser1 ? convRow.user2 : convRow.user1);
      const adapted = convRow.listings ? adaptListing(convRow.listings) : null;
      setListing(adapted);
      setListingOwnerId(convRow.listings?.user_id || null);

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

  async function handleRemoveListing() {
    if (!listing?.id) return;
    try {
      const supabase = getSupabase();

      // Get all conversations for this listing
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id);

      const convIds = (convs || []).map((c) => c.id);

      // Delete all messages in those conversations
      if (convIds.length > 0) {
        await supabase
          .from('messages')
          .delete()
          .in('conversation_id', convIds);

        // Delete all conversations
        await supabase
          .from('conversations')
          .delete()
          .in('id', convIds);
      }

      // Delete the listing itself
      await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      setRemoved(true);
      setTimeout(() => router.push('/'), 1500);
    } catch {
      // ignore
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D4B8E', borderTopColor: 'transparent' }} />
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
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3 transition-colors" style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' }}>
            {listing.photo && (
              <img
                src={listing.photo}
                alt={listing.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#2D4B8E' }}>Trading for</div>
              <div className="text-sm font-bold text-gray-900 truncate">{listing.title}</div>
              <div className="text-xs text-gray-500 truncate">
                <span style={{ color: '#2D4B8E' }}>Have:</span> {listing.iHave} ·{' '}
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
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  isMe
                    ? 'text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                }`}
                style={isMe ? { backgroundColor: '#2D4B8E' } : {}}
              >
                {msg.text}
                <div className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {timeAgo(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Remove listing — only visible to the listing owner */}
      {listing && user && listingOwnerId === user.id && (
        removed ? (
          <div className="mb-3 w-full border py-2 rounded-xl text-sm font-semibold text-center" style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', color: '#2D4B8E' }}>
            Item removed from listings
          </div>
        ) : (
          <button
            onClick={handleRemoveListing}
            className="mb-3 w-full border border-gray-200 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Remove item if traded
          </button>
        )
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: '#2D4B8E' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
