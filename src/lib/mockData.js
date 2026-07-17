export const CATEGORIES = [
  'Services',
  'Tools',
  'Electronics',
  'Furniture',
  'Outdoor/Sports',
  'Vehicles',
  'Kids/Baby',
  'Home/Garden',
  'Farm/Garden',
  'Tickets/Events',
  'Other',
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export const CITIES = ['Bentonville', 'Rogers', 'Springdale', 'Fayetteville', 'Other'];

export const SERVICE_CATEGORIES = ['Services'];

export const MOCK_USER = {
  id: 'user-1',
  name: 'Ben Williams',
  email: 'bwbuse@gmail.com',
  city: 'Bentonville',
  zip: '72712',
  completedTrades: 3,
};

export const MOCK_LISTINGS = [];

export const MOCK_CONVERSATIONS = [
  {
    id: 'conv-1',
    listingId: 'listing-6',
    listing: null, // will be resolved at runtime
    otherUser: {
      id: 'user-7',
      name: 'Ryan Tate',
      city: 'Bentonville',
      zip: '72712',
      completedTrades: 5,
    },
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-7',
        text: 'Hey! I saw your proposal for the DeWalt set. I love what you are offering. What kind of lawn mowing schedule were you thinking?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-2',
        senderId: 'user-1',
        text: 'Hi Ryan! I was thinking once a week through the summer, maybe bi-weekly in fall. About an hour per visit for a typical yard. Does that sound fair?',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-3',
        senderId: 'user-7',
        text: 'That sounds great. My yard is about 1/4 acre, fenced backyard. When could you come by to look at it?',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ],
    unread: true,
    lastMessageAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'conv-2',
    listingId: 'listing-3',
    listing: null,
    otherUser: {
      id: 'user-4',
      name: 'Jake Morrison',
      city: 'Fayetteville',
      zip: '72701',
      completedTrades: 12,
    },
    messages: [
      {
        id: 'msg-4',
        senderId: 'user-1',
        text: 'Jake -- I would love to trade guitar lessons for some web design help. I am building a site for my teaching studio. Interested?',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-5',
        senderId: 'user-4',
        text: 'That is awesome, yes! I have been wanting a proper site. How many lessons would we be talking for a 5-page site?',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
    ],
    unread: false,
    lastMessageAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
];

// Listing references removed — MOCK_LISTINGS is empty; inbox demo uses conversation data only.

export const TRADE_TEMPLATES = {
  Services: 'Hi! I saw your listing and I am interested in a trade. I can offer [describe your service] in exchange. I would love to discuss what works for both of us.',
  Tools: 'Hey! I have [tool/item] in great condition that I would love to trade for what you are offering. Happy to send photos or meet up to check things out first.',
  Electronics: 'Hi! I am interested in trading for your listing. I have [item] that I think would be a fair exchange. Want to discuss details?',
  Furniture: 'Hello! I have [furniture item] available that I would like to offer in trade. It is in [condition] condition and available for pickup. Interested?',
  'Outdoor/Sports': 'Hey! Saw your listing -- I have [item] that might interest you. Both are outdoor gear so it feels like a natural fit. Want to chat?',
  Vehicles: 'Hi! I am very interested in your vehicle listing. I have [offer] and would love to discuss a trade. Happy to meet in a public spot to look things over.',
  'Kids/Baby': 'Hi! I have [kids item] in great shape that might work as a trade. My kids have outgrown it and it is just sitting in the garage. Interested?',
  'Home/Garden': 'Hello! I have [item] that I think would be a great trade for what you are offering. It is in [condition] condition and ready to go.',
  'Farm/Garden': 'Hey neighbor! I am interested in trading. I have [produce/plants/tools] available. Would love to keep things local and work something out!',
  'Tickets/Events': 'Hi! I have [tickets/event passes] available that I would like to trade. They are for [event] on [date]. Want to discuss?',
  Other: 'Hi! I am interested in your listing. I have [offer] that I would love to trade. Let me know if you would like to discuss details!',
};
