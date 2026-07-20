'use client';

import Link from 'next/link';
import Avatar from './Avatar';
import { daysRemaining } from '@/lib/store';

const CATEGORY_ICONS = {
  Services: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  Tools: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  Electronics: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  Furniture: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'Outdoor/Sports': 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
  Vehicles: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  'Kids/Baby': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  'Home/Garden': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'Farm/Garden': 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  'Tickets/Events': 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  Other: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
};

function PlaceholderImage({ category }) {
  const iconPath = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2f5e 0%, #2D4B8E 100%)' }}>
      <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      <span className="text-white/40 text-xs font-semibold tracking-widest uppercase">{category}</span>
    </div>
  );
}

const CONDITION_COLORS = {
  New: 'bg-emerald-100 text-emerald-800',
  'Like New': 'bg-blue-100 text-blue-800',
  Good: 'bg-amber-100 text-amber-800',
  Fair: 'bg-gray-100 text-gray-700',
};

const CATEGORY_COLORS = {
  Services: 'bg-purple-100 text-purple-800',
  Tools: 'bg-orange-100 text-orange-800',
  Electronics: 'bg-blue-100 text-blue-800',
  Furniture: 'bg-yellow-100 text-yellow-800',
  'Outdoor/Sports': 'bg-green-100 text-green-800',
  Vehicles: 'bg-red-100 text-red-800',
  'Kids/Baby': 'bg-pink-100 text-pink-800',
  'Home/Garden': 'bg-lime-100 text-lime-800',
  'Farm/Garden': 'bg-teal-100 text-teal-800',
  'Tickets/Events': 'bg-indigo-100 text-indigo-800',
  Other: 'bg-gray-100 text-gray-700',
};

function isVerifiedNWA(zip) {
  return zip && zip.startsWith('727');
}

export default function ListingCard({ listing, compact = false }) {
  const days = daysRemaining(listing.expiresAt);
  const photo = listing.photo || null;
  const verified = isVerifiedNWA(listing.poster?.zip);

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Photo */}
        <div className="relative overflow-hidden bg-gray-100 h-56">
          {photo ? (
            <img
              src={photo}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <PlaceholderImage category={listing.category} />
          )}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {listing.category}
            </span>
            {listing.condition && listing.category !== 'Services' && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {listing.condition}
              </span>
            )}
          </div>
          {listing.isDemo && (
            <div className="absolute top-2 right-2">
              <span className="bg-amber-400 text-amber-950 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                Demo
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2 transition-colors" style={{ color: undefined }} onMouseEnter={() => {}} onMouseLeave={() => {}}>
            {listing.title}
          </h3>

          <div className="text-sm text-gray-500 space-y-0.5 mb-2">
            <div className="flex gap-1">
              <span className="text-xs font-semibold" style={{ color: '#2D4B8E' }}>Have:</span>
              <span className="line-clamp-1">{listing.iHave}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-xs font-semibold text-amber-600">Want:</span>
              <span className="line-clamp-1">{listing.iWantText}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {listing.city}
          </div>

          <div className="mt-auto flex items-center justify-between">
            {/* Poster */}
            <div className="flex items-center gap-1.5">
              <Avatar name={listing.poster?.name || '?'} size="xs" />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 font-medium">{listing.poster?.name}</span>
                {verified && (
                  <span className="text-xs font-semibold" style={{ color: '#2D4B8E' }} title="Verified NWA">✓</span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="text-right">
              <div className={`text-xs ${days <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                {days}d left
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
