'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/store';
import { getSupabase, adaptListing } from '@/lib/supabase';

export default function InboxPage() {
  const router = useRouter();
  const [convs, setConvs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInbox() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      // Fetch conversations + listing + both profiles + last message
      const { data: rows } = await supabase
        .from('conversations')
        .select(`
          id, status, created_at, listing_id,
          listings(*, profiles(name, city, zip, completed_trades)),
          user1:profiles!conversations_user_1_id_fkey(id, name, city, completed_trades),
          user2:profiles!conversations_user_2_id_fkey(id, name, city, completed_trades),
          user_1_id, user_2_id
        `)
        .or(`user_1_id.eq.${authUser.id},user_2_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false });

      if (!rows || rows.length === 0) {
        setLoading(false);
        return;
      }

      // For each conversation, fetch the last message
      const convIds = rows.map((r) => r.id);
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('conversation_id, message, created_at, sender_id')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      // Group last message per conversation
      const lastMsgByConv = {};
      (lastMsgs || []).forEach((m) => {
        if (!lastMsgByConv[m.conversation_id]) {
          lastMsgByConv[m.conversation_id] = m;
        }
      });

      const adapted = rows.map((row) => {
        const isUser1 = row.user_1_id === authUser.id;
        const otherProfile = isUser1 ? row.user2 : row.user1;
        const lastMsg = lastMsgByConv[row.id];
        return {
          id: row.id,
          status: row.status,
          listing: row.listings ? adaptListing(row.listings) : null,
          otherUser: otherProfile,
          lastMessage: lastMsg || null,
          lastMessageAt: lastMsg?.created_at || row.created_at,
        };
      });

      setConvs(adapted);
      setLoading(false);
    }
    fetchInbox();
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D4B8E', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Inbox</h1>
        </div>
      </div>

      {convs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="mb-3 flex justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="font-semibold text-gray-600 mb-1">No conversations yet</div>
          <div className="text-sm text-gray-400 mb-4">Propose a trade on any listing to start a conversation.</div>
          <Link href="/" className="text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors" style={{ backgroundColor: '#2D4B8E' }}>
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((conv) => (
            <Link key={conv.id} href={`/inbox/${conv.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow flex items-start gap-3">
                <Avatar name={conv.otherUser?.name || '?'} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-gray-900 truncate">{conv.otherUser?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{timeAgo(conv.lastMessageAt)}</div>
                  </div>
                  <div className="text-xs font-medium mb-0.5 truncate" style={{ color: '#2D4B8E' }}>{conv.listing?.title}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {conv.lastMessage?.message.replace(/\n/g, ' ') || 'No messages yet'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
