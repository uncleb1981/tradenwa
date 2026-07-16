import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Singleton for client-side use
let client;
export function getSupabase() {
  if (!client) {
    client = createClient();
  }
  return client;
}

// Adapt a DB listing row to the shape the UI expects
export function adaptListing(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    condition: row.condition,
    iHave: row.offering || '',
    iWant: [],
    iWantText: row.seeking || '',
    city: row.city,
    zip: row.profiles?.zip || '',
    openToOffers: row.open_to_offers,
    views: row.view_count || 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    photo: row.photo_url,
    status: row.status,
    poster: row.profiles
      ? {
          id: row.user_id,
          name: row.profiles.name,
          city: row.profiles.city,
          zip: row.profiles.zip,
          completedTrades: row.profiles.completed_trades || 0,
        }
      : null,
  };
}

// Adapt a DB message row to the shape the UI expects
export function adaptMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.message,
    timestamp: row.created_at,
  };
}
