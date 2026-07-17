'use client';

import { MOCK_USER, MOCK_CONVERSATIONS } from './mockData';

const LISTINGS_KEY = 'tradenwa_listings';
const USER_KEY = 'tradenwa_user';
const CONVERSATIONS_KEY = 'tradenwa_conversations';
const DRAFT_KEY = 'tradenwa_draft';

function isClient() {
  return typeof window !== 'undefined';
}

// ── User ──────────────────────────────────────────────────────────────────────

export function getUser() {
  if (!isClient()) return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) return JSON.parse(stored);
    // seed default logged-in user
    localStorage.setItem(USER_KEY, JSON.stringify(MOCK_USER));
    return MOCK_USER;
  } catch {
    return MOCK_USER;
  }
}

export function setUser(user) {
  if (!isClient()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  if (!isClient()) return;
  localStorage.removeItem(USER_KEY);
}

// ── Listings ──────────────────────────────────────────────────────────────────

export function getListings() {
  if (!isClient()) return [];
  try {
    const stored = localStorage.getItem(LISTINGS_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  } catch {
    return [];
  }
}

export function getListing(id) {
  return getListings().find((l) => l.id === id) || null;
}

export function addListing(listing) {
  const listings = getListings();
  const updated = [listing, ...listings];
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(updated));
  return listing;
}

export function incrementViews(id) {
  if (!isClient()) return;
  const listings = getListings();
  const updated = listings.map((l) =>
    l.id === id ? { ...l, views: (l.views || 0) + 1 } : l
  );
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(updated));
}

// ── Conversations ─────────────────────────────────────────────────────────────

export function getConversations() {
  if (!isClient()) return MOCK_CONVERSATIONS;
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(MOCK_CONVERSATIONS));
    return MOCK_CONVERSATIONS;
  } catch {
    return MOCK_CONVERSATIONS;
  }
}

export function getConversation(id) {
  return getConversations().find((c) => c.id === id) || null;
}

export function sendMessage(convId, text, senderId) {
  const convs = getConversations();
  const now = new Date().toISOString();
  const updated = convs.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      messages: [
        ...c.messages,
        { id: `msg-${Date.now()}`, senderId, text, timestamp: now },
      ],
      lastMessageAt: now,
      unread: false,
    };
  });
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  return updated.find((c) => c.id === convId);
}

export function markTradeComplete(convId) {
  const convs = getConversations();
  const updated = convs.map((c) =>
    c.id === convId ? { ...c, tradeComplete: true } : c
  );
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
}

export function addConversation(conv) {
  const convs = getConversations();
  const updated = [conv, ...convs];
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
}

// ── Draft ─────────────────────────────────────────────────────────────────────

export function getDraft() {
  if (!isClient()) return null;
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  if (!isClient()) return;
  try {
    const { photo, photoPreview, ...safeDraft } = draft;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safeDraft));
  } catch {
    // localStorage full — skip draft save
  }
}

export function clearDraft() {
  if (!isClient()) return;
  localStorage.removeItem(DRAFT_KEY);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function daysRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isJustAdded(createdAt) {
  const diff = new Date() - new Date(createdAt);
  return diff < 48 * 60 * 60 * 1000; // within 48 hours
}

export function timeAgo(timestamp) {
  const diff = new Date() - new Date(timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
