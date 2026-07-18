'use client';

import Link from 'next/link';
import Avatar from './Avatar';
import { daysRemaining } from '@/lib/store';

const PLACEHOLDER_IMAGES = {
  Services: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',
  Tools: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
  Electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80',
  Furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  'Outdoor/Sports': 'https://images.unsplash.com/photo-1526401485004-46910ecc8e2e?w=600&q=80',
  Vehicles: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80',
  'Kids/Baby': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80',
  'Home/Garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
  'Farm/Garden': 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80',
  'Tickets/Events': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  Other: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
};

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
  const photo = listing.photo || PLACEHOLDER_IMAGES[listing.category] || PLACEHOLDER_IMAGES.Other;
  const verified = isVerifiedNWA(listing.poster?.zip);

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Photo */}
        <div className="relative overflow-hidden bg-gray-100 h-56">
          <img
            src={photo}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = PLACEHOLDER_IMAGES[listing.category] || PLACEHOLDER_IMAGES.Other; }}
          />
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
