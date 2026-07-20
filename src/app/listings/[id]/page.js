'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import ListingCard from '@/components/ListingCard';
import { daysRemaining } from '@/lib/store';
import { TRADE_TEMPLATES, SERVICE_CATEGORIES } from '@/lib/mockData';
import { getSupabase, adaptListing } from '@/lib/supabase';

const CONDITION_COLORS = {
  New: 'bg-emerald-100 text-emerald-800',
  'Like New': 'bg-blue-100 text-blue-800',
  Good: 'bg-amber-100 text-amber-800',
  Fair: 'bg-gray-100 text-gray-700',
};

function isVerifiedNWA(zip) {
  return zip && zip.startsWith('727');
}

function ProposeModal({ listing, user, onClose }) {
  const router = useRouter();
  const template = TRADE_TEMPLATES[listing.category] || TRADE_TEMPLATES.Other;
  const [offering, setOffering] = useState('');
  const [message, setMessage] = useState(template);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }

    try {
      const supabase = getSupabase();

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .single();

      let convId;
      if (existing) {
        convId = existing.id;
      } else {
        // Create conversation
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            user_1_id: user.id,
            user_2_id: listing.poster.id,
            status: 'active',
          })
          .select('id')
          .single();

        if (convErr) throw convErr;
        convId = conv.id;
      }

      // Insert first message
      const { error: msgErr } = await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        message: `Offering: ${offering}\n\n${message}`,
      });

      if (msgErr) throw msgErr;

      setSent(true);
      setTimeout(() => {
        onClose();
        router.push(`/inbox/${convId}`);
      }, 1500);
    } catch (err) {
      setError('Failed to send proposal. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center py-6">
            <div className="mb-3 flex justify-center">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-900">Proposal sent!</h3>
            <p className="text-sm text-gray-500 mt-1">Heading to your conversation...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Propose a Trade</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rounded-xl p-3 mb-4 text-sm" style={{ backgroundColor: '#EEF2FF' }}>
              <div className="font-semibold mb-0.5" style={{ color: '#2D4B8E' }}>Trading for:</div>
              <div style={{ color: '#2D4B8E' }}>{listing.title}</div>
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  What I'm offering <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  placeholder="Describe what you're trading..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message to seller</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full text-white py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: '#2D4B8E' }}
              >
                Send Proposal
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [user, setUser] = useState(null);
  const [showPropose, setShowPropose] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      setLoading(true);
      try {
        const supabase = getSupabase();

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        // Fetch listing from DB
        const { data, error } = await supabase
          .from('listings')
          .select('*, profiles(name, city, zip, completed_trades)')
          .eq('id', id)
          .single();

        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const adapted = adaptListing(data);
        setListing(adapted);

        // Increment view count
        await supabase
          .from('listings')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);

        // Fetch similar listings
        const { data: similarData } = await supabase
          .from('listings')
          .select('*, profiles(name, city, zip, completed_trades)')
          .eq('status', 'active')
          .eq('category', data.category)
          .neq('id', id)
          .limit(3);

        setSimilar((similarData || []).map(adaptListing));
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  async function handleMarkTraded() {
    if (!window.confirm('Mark this listing as traded? It will be removed from the feed.')) return;
    const supabase = getSupabase();
    await supabase.from('listings').update({ status: 'traded' }).eq('id', id);
    router.push('/profile');
  }

  async function handleDelete() {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    const supabase = getSupabase();

    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', id);

    const convIds = (convs || []).map((c) => c.id);

    if (convIds.length > 0) {
      await supabase.from('messages').delete().in('conversation_id', convIds);
      await supabase.from('conversations').delete().in('id', convIds);
    }

    await supabase.from('listings').delete().eq('id', id);
    router.push('/profile');
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePropose() {
    if (!user) { router.push('/login'); return; }
    setShowPropose(true);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 animate-pulse">
        <div className="bg-gray-200 rounded-2xl aspect-[4/3]" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="mb-3 flex justify-center">
        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">Listing not found</h2>
      <p className="text-sm text-gray-500 mb-6">This listing may have expired or been removed.</p>
      <Link href="/" className="inline-block text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors" style={{ backgroundColor: '#2D4B8E' }}>
        Browse listings
      </Link>
    </div>
  );

  if (!listing) return null;

  const days = daysRemaining(listing.expiresAt);
  const verified = isVerifiedNWA(listing.poster?.zip);
  const isService = SERVICE_CATEGORIES.includes(listing.category);

  return (
    <>
      {showPropose && (
        <ProposeModal listing={listing} user={user} onClose={() => setShowPropose(false)} />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#2D4B8E'} onMouseLeave={e => e.currentTarget.style.color=''}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Photo */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
              <img
                src={listing.photo || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80`}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80'; }}
              />
            </div>

            {/* Safety tip */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Trade Safety Tip
              </div>
              <div className="text-amber-800">
                Meet in a public place. <strong>Bentonville Square</strong>, <strong>Pinnacle Hills Promenade</strong>, and <strong>Rogers police station lobby</strong> are popular NWA spots.
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {listing.isDemo && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-bold">Demo</span>
              )}
              <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">{listing.category}</span>
              {listing.condition && (
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${CONDITION_COLORS[listing.condition] || 'bg-gray-100 text-gray-700'}`}>
                  {listing.condition}
                </span>
              )}
              {listing.openToOffers && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">Open to offers</span>
              )}
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-1">{listing.title}</h1>

            {user?.id === listing.poster?.id && (
              <div className="flex gap-2 flex-wrap mb-4">
                <Link
                  href={`/listings/${id}/edit`}
                  className="text-xs px-3 py-1.5 rounded-full border-2 font-semibold transition-colors" style={{ borderColor: '#2D4B8E', color: '#2D4B8E' }}
                >
                  Edit Listing
                </Link>
                <button
                  onClick={handleMarkTraded}
                  className="text-xs px-3 py-1.5 rounded-full border-2 border-amber-500 text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                >
                  Mark as Traded
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs px-3 py-1.5 rounded-full border-2 border-red-400 text-red-600 font-semibold hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.city}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {listing.views} views
              </span>
              <span className={days <= 5 ? 'text-red-500 font-semibold' : ''}>
                {days} days left
              </span>
            </div>

            {/* I Have / I Want */}
            <div className="rounded-xl p-4 mb-4 space-y-2" style={{ backgroundColor: '#EEF2FF' }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#2D4B8E' }}>I have</div>
                <div className="font-semibold" style={{ color: '#1E3464' }}>{listing.iHave}</div>
              </div>
              <div className="border-t pt-2" style={{ borderColor: '#C7D2FE' }}>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">I want</div>
                <div className="text-gray-800 font-semibold">{listing.iWantText}</div>
                {listing.iWant && listing.iWant.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {listing.iWant.map((cat) => (
                      <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{cat}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 mb-2">About this listing</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
            </div>

            {/* Poster */}
            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl mb-4">
              <Avatar name={listing.poster?.name || '?'} size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{listing.poster?.name}</span>
                  {verified && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ backgroundColor: '#EEF2FF', color: '#2D4B8E' }}>
                      <svg className="w-3 h-3 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Verified NWA
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>{listing.poster?.city}</span>
                  {listing.poster?.completedTrades > 0 && (
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {listing.poster.completedTrades} completed trades
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {listing.poster?.id !== user?.id ? (
                <button
                  onClick={handlePropose}
                  className="w-full text-white py-3 rounded-xl font-bold text-base transition-colors" style={{ backgroundColor: '#2D4B8E' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#243D75'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#2D4B8E'}
                >
                  Propose a Trade
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-medium text-base text-center">
                  This is your listing
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {copied ? 'Copied!' : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Share
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setReportSent(true); setTimeout(() => setReportSent(false), 3000); }}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-400 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  {reportSent ? 'Reported' : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Listings */}
        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-black text-gray-900 mb-4">Similar listings in {listing.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similar.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
