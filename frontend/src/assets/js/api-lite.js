// Optimized API client with fallbacks
const API_ENDPOINTS = [
  'https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api',
  'https://conference-party-app.web.app/api'
];

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

export async function getJSON(url, options = {}) {
  const { timeout = 8000, useCache = true } = options;
  
  // Check cache first
  if (useCache && cache.has(url)) {
    const { data, timestamp } = cache.get(url);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(url, { 
      headers: { 'accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    
    const data = await res.json().catch(() => ({}));
    
    // Cache successful responses
    if (useCache && res.ok) {
      cache.set(url, { data, timestamp: Date.now() });
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout for ${url}`);
    }
    throw error;
  }
}

const CONF = 'gamescom2025';

export async function fetchParties() {
  const fallbackData = getFallbackParties();
  
  for (const baseUrl of API_ENDPOINTS) {
    try {
      // All endpoints now use /parties consistently
      const url = `${baseUrl}/parties?conference=${encodeURIComponent(CONF)}`;
      const raw = await getJSON(url, { timeout: 5000 });
      
      const parties = Array.isArray(raw?.data) ? raw.data : 
                     Array.isArray(raw) ? raw : 
                     raw?.parties || [];
      
      if (parties.length > 0) {
        console.log(`[API] Loaded ${parties.length} parties from ${baseUrl}`);
        return parties;
      }
    } catch (error) {
      console.warn(`[API] Failed to fetch from ${baseUrl}:`, error.message);
      continue;
    }
  }
  
  // Use fallback data if all endpoints fail
  console.log('[API] Using fallback party data');
  return fallbackData;
}

function getFallbackParties() {
  return [
    {
      id: 'gamescom-opening',
      title: 'Gamescom Opening Night Live',
      venue: 'Koelnmesse Hall 11',
      start: '2025-08-19T18:00:00',
      date: '2025-08-19',
      description: 'The biggest gaming event kicks off with exclusive reveals, celebrity guests, and premium networking.',
      category: 'opening'
    },
    {
      id: 'xbox-afterparty',
      title: 'Xbox Showcase After Party',
      venue: 'Hyatt Regency Cologne',
      start: '2025-08-19T21:00:00',
      date: '2025-08-19',
      description: 'Celebrate the latest Xbox announcements with developers, press, and VIP guests.',
      category: 'party'
    },
    {
      id: 'indie-mixer',
      title: 'Indie Developer Mixer',
      venue: 'Belgian Quarter',
      start: '2025-08-20T19:00:00',
      date: '2025-08-20',
      description: 'Connect with independent developers, publishers, and investors.',
      category: 'networking'
    },
    {
      id: 'playstation-lounge',
      title: 'PlayStation VIP Lounge',
      venue: 'Excelsior Hotel Ernst',
      start: '2025-08-20T20:00:00',
      date: '2025-08-20',
      description: 'Exclusive PlayStation experience with hands-on demos and developer Q&As.',
      category: 'vip'
    },
    {
      id: 'esports-finale',
      title: 'Esports Championship Finale',
      venue: 'Lanxess Arena',
      start: '2025-08-21T20:00:00',
      date: '2025-08-21',
      description: 'Witness the grand finale of Europe\'s biggest esports tournament.',
      category: 'esports'
    }
  ];
}
export async function fetchInvites(){
  try{ const raw = await getJSON(`${API_BASE}/api/invites`); return Array.isArray(raw) ? raw : (raw.items||[]); }
  catch{ return JSON.parse(localStorage.getItem('invites')||'[]'); }
}
export function saveInvites(list){ localStorage.setItem('invites', JSON.stringify(list)); }
