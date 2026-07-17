'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import { getSupabase } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('name, city')
          .eq('id', user.id)
          .single();
        setProfile(prof);

        // Unread conversations count
        const { count } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
          .eq('status', 'active');
        setUnreadCount(count || 0);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setUnreadCount(0);
      } else {
        loadUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?q=${encodeURIComponent(search.trim())}`);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mr-1">
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight" style={{ color: '#2D4B8E' }}>TradeNWA</span>
              <span className="text-xs text-amber-500 font-medium hidden sm:block">Swap Happens</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': '#2D4B8E' }}
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Post */}
            <Link
              href={user ? '/listings/create' : '/login'}
              className="hidden sm:flex items-center gap-1.5 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors" style={{ backgroundColor: '#2D4B8E' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#243D75'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#2D4B8E'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post a Trade
            </Link>

            {/* Inbox */}
            {user && (
              <Link href="/inbox" className="relative p-2 text-gray-500 transition-colors" style={{}} onMouseEnter={e => e.currentTarget.style.color='#2D4B8E'} onMouseLeave={e => e.currentTarget.style.color=''}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Avatar / login */}
            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
                  <Avatar name={displayName} size="sm" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100 truncate">{displayName}</div>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Profile
                    </Link>
                    <Link href="/inbox" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Inbox
                    </Link>
                    <Link href="/listings/create" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Post a Trade
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: '#2D4B8E' }}>
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
