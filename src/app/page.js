'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import CategoryPills from '@/components/CategoryPills';
import { isJustAdded } from '@/lib/store';
import { CITIES } from '@/lib/mockData';
import { getSupabase, adaptListing } from '@/lib/supabase';

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="bg-gray-200 h-40 w-full" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [city, setCity] = useState('');
  const [search, setSearch] = useState(q);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('listings')
          .select('*, profiles(name, city, zip, completed_trades)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setListings([]);
        } else {
          setListings(data.map(adaptListing));
        }
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const justAdded = listings.filter((l) => isJustAdded(l.createdAt));

  const trending = [...listings]
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const filtered = listings.filter((l) => {
    if (category && l.category !== category) return false;
    if (city && l.city !== city) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.title.toLowerCase().includes(s) ||
        l.description.toLowerCase().includes(s) ||
        (l.iHave || '').toLowerCase().includes(s) ||
        (l.iWantText || '').toLowerCase().includes(s) ||
        l.category.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const trendingCity = city || 'NWA';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

      {/* Just Added */}
      {!loading && justAdded.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-900">Just Added 🌱</h2>
            <span className="text-xs text-gray-400">Last 48 hours</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {justAdded.map((l) => (
              <div key={l.id} className="flex-shrink-0 w-64">
                <ListingCard listing={l} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-gray-900">🔥 Trending in {trendingCity}</h2>
        </div>
        {loading ? (
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-64">
                <Skeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {trending.map((l) => (
              <div key={l.id} className="flex-shrink-0 w-64">
                <ListingCard listing={l} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Filters */}
      <section>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <CategoryPills selected={category} onChange={setCategory} />
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-1.5 rounded-full border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-600"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {search && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500">Results for &ldquo;<strong>{search}</strong>&rdquo;</span>
            <button
              onClick={() => { setSearch(''); window.history.replaceState(null, '', '/'); }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🌾</div>
            <div className="font-semibold text-gray-600 mb-1">
              {listings.length === 0 ? 'No listings yet — be the first to post a trade!' : 'No listings found'}
            </div>
            {listings.length > 0 && (
              <div className="text-sm">Try a different filter or be the first to post!</div>
            )}
            <Link href="/listings/create" className="mt-4 inline-block bg-green-800 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-green-700 transition-colors">
              Post a Trade
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-gray-900">Browse All</h2>
              <span className="text-sm text-gray-400">{filtered.length} listings</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
        <div className="text-2xl mb-2">🤝</div>
        <h3 className="font-black text-gray-900 text-lg mb-1">Have something to offer?</h3>
        <p className="text-sm text-gray-500 mb-4">List a service, good, or skill — find someone in NWA who has what you need.</p>
        <Link href="/listings/create" className="inline-block bg-green-800 text-white px-8 py-2.5 rounded-full font-semibold hover:bg-green-700 transition-colors">
          Post a Trade
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-6 text-gray-400">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
