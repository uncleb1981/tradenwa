'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import ListingCard from '@/components/ListingCard';
import { CITIES } from '@/lib/mockData';
import { getSupabase, adaptListing } from '@/lib/supabase';

function isVerifiedNWA(zip) {
  return zip && zip.startsWith('727');
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', zip: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (prof) {
        setProfile(prof);
        setForm({ name: prof.name || '', city: prof.city || '', zip: prof.zip || '' });
      }

      const { data: listings } = await supabase
        .from('listings')
        .select('*, profiles(name, city, zip, completed_trades)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      setMyListings((listings || []).map(adaptListing));
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: form.name,
          city: form.city,
          zip: form.zip,
          completed_trades: profile?.completed_trades || 0,
        })
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D4B8E', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!user || !profile) return null;

  const verified = isVerifiedNWA(profile.zip);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <div className="flex justify-center mb-3">
              <Avatar name={profile.name} size="xl" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1">{profile.name}</h2>
            {verified && (
              <div className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold mb-2" style={{ backgroundColor: '#EEF2FF', color: '#2D4B8E' }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Verified NWA
              </div>
            )}
            <div className="text-sm text-gray-500 mb-1">{profile.city}</div>
            <div className="text-sm text-gray-400 mb-4 truncate">{user.email}</div>

            <div className="bg-amber-50 rounded-xl p-3 mb-4">
              <div className="text-2xl font-black text-amber-600">{profile.completed_trades || 0}</div>
              <div className="text-xs text-amber-700 font-medium">Completed Trades</div>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <form onSubmit={handleSave} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                  >
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Zip Code
                    <span className="ml-1 font-normal" style={{ color: '#2D4B8E' }}>(starts with 727 = Verified NWA)</span>
                  </label>
                  <input
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    maxLength={5}
                    placeholder="72712"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50" style={{ backgroundColor: '#2D4B8E' }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {saved && (
              <div className="mt-2 text-xs font-semibold text-center" style={{ color: '#2D4B8E' }}>Profile saved!</div>
            )}

            {!verified && (
              <div className="mt-4 bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                <div className="font-semibold mb-0.5">Get Verified NWA</div>
                Update your zip code to one starting with 727 to show the Verified NWA badge.
              </div>
            )}
          </div>
        </div>

        {/* Right: Listings */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">My Listings</h2>
            <Link
              href="/listings/create"
              className="text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors" style={{ backgroundColor: '#2D4B8E' }}
            >
              + New
            </Link>
          </div>

          {myListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="mb-3 flex justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <div className="font-semibold text-gray-600 mb-1">No listings yet</div>
              <div className="text-sm text-gray-400 mb-4">Post your first trade to get started!</div>
              <Link href="/listings/create" className="text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors" style={{ backgroundColor: '#2D4B8E' }}>
                Post a Trade
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {myListings.map((l) => (
                <div key={l.id}>
                  <ListingCard listing={l} />
                  <div className="flex items-center gap-3 mt-1 px-1 text-xs font-medium">
                    <Link href={`/listings/${l.id}/edit`} className="hover:underline" style={{ color: '#2D4B8E' }}>Edit</Link>
                    <span className="text-gray-300">|</span>
                    <button
                      className="text-amber-600 hover:underline"
                      onClick={async () => {
                        if (!window.confirm('Mark this listing as traded? It will be removed from the feed.')) return;
                        const supabase = getSupabase();
                        await supabase.from('listings').update({ status: 'traded' }).eq('id', l.id);
                        setMyListings((prev) => prev.filter((x) => x.id !== l.id));
                      }}
                    >
                      Mark Traded
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={async () => {
                        if (!window.confirm('Delete this listing? This cannot be undone.')) return;
                        const supabase = getSupabase();
                        const { data: convs } = await supabase
                          .from('conversations')
                          .select('id')
                          .eq('listing_id', l.id);
                        const convIds = (convs || []).map((c) => c.id);
                        if (convIds.length > 0) {
                          await supabase.from('messages').delete().in('conversation_id', convIds);
                          await supabase.from('conversations').delete().in('id', convIds);
                        }
                        await supabase.from('listings').delete().eq('id', l.id);
                        setMyListings((prev) => prev.filter((x) => x.id !== l.id));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
