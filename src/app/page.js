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
          .in('status', ['active'])
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

  const showHero = !loading && listings.length > 0;

  return (
    <div className="space-y-0">

    {/* Hero */}
    {showHero && (
      <div className="relative w-full py-14 px-4 text-white text-center overflow-hidden" style={{ backgroundColor: '#2D4B8E' }}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px'}} />
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">NWA's Everything Marketplace</h1>
          <div className="flex flex-wrap justify-center gap-4 text-lg mb-4 opacity-90">
            <span>· Goods</span>
            <span>· Services</span>
            <span>· Skills</span>
          </div>
          <p className="text-base mb-8 opacity-75">Trade what you have or pay cash — your call.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/listings/create" className="bg-white font-bold px-8 py-3 rounded-full text-base transition-colors hover:bg-gray-100" style={{ color: '#2D4B8E' }}>
              Post a Trade
            </Link>
            <a href="#browse" className="border-2 border-white text-white font-bold px-8 py-3 rounded-full text-base transition-colors hover:bg-white/10">
              Browse
            </a>
          </div>
        </div>
      </div>
    )}

    <div className="max-w-6xl mx-auto px-4 py-6 space-y-12">

      {/* Just Added */}
      {!loading && justAdded.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>Just Added</h2>
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
          <h2 className="text-xl font-black tracking-tight text-gray-900">Trending in {trendingCity}</h2>
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
      <section id="browse">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sticky top-16 z-10 bg-white/95 backdrop-blur-sm shadow-sm py-3 px-2 -mx-2 rounded-xl">
          <div className="flex-1">
            <CategoryPills selected={category} onChange={setCategory} />
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-1.5 rounded-full border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 text-gray-600"
            style={{ '--tw-ring-color': '#2D4B8E' }}
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
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 48 48" stroke="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="3" strokeWidth="2" />
                <rect x="28" y="4" width="16" height="16" rx="3" strokeWidth="2" />
                <rect x="4" y="28" width="16" height="16" rx="3" strokeWidth="2" />
                <rect x="28" y="28" width="16" height="16" rx="3" strokeWidth="2" />
              </svg>
            </div>
            <div className="font-semibold text-gray-600 mb-1">
              {listings.length === 0 ? 'No listings yet — be the first to post a trade!' : 'No listings found'}
            </div>
            {listings.length > 0 && (
              <div className="text-sm">Try a different filter or be the first to post!</div>
            )}
            <Link href="/listings/create" className="mt-4 inline-block text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors" style={{ backgroundColor: '#2D4B8E' }}>
              Post a Trade
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-black tracking-tight text-gray-900">Browse All</h2>
              <span className="text-sm text-gray-400">{filtered.length} listings</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        )}
      </section>

      <div className="border-t border-gray-100 my-2" />

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
        <h3 className="font-black text-gray-900 text-lg mb-1">Have something to offer?</h3>
        <p className="text-sm text-gray-500 mb-4">List a service, good, or skill — find someone in NWA who has what you need.</p>
        <Link href="/listings/create" className="inline-block text-white px-8 py-2.5 rounded-full font-semibold transition-colors" style={{ backgroundColor: '#2D4B8E' }}>
          Post a Trade
        </Link>
      </div>
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
