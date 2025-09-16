import { refreshAccessToken } from './oauth';
import { MTMAccount, getAccessToken, getRefreshToken, updateTokens } from './models';

/**
 * MTM API Base URL
 */
const MTM_API_BASE = 'https://api.meettomatch.com/v1';

/**
 * MTM Meeting from API
 */
export interface MTMMeeting {
  id: string;
  title: string;
  timeslot: {
    start: string;
    end: string;
    timezone: string;
  };
  participants: Array<{
    id: string;
    name: string;
    org?: string;
    role?: string;
  }>;
  location?: {
    type: 'venue' | 'online' | 'hybrid';
    venue?: string;
    address?: string;
    online?: {
      url: string;
      platform: string;
    };
  };
  status: 'confirmed' | 'pending' | 'declined' | 'canceled';
  links?: {
    joinUrl?: string;
    detailsUrl?: string;
  };
  updatedAt: string;
  etag?: string;
}

/**
 * MTM API Response
 */
interface MTMListResponse {
  meetings: MTMMeeting[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
  };
}

/**
 * Ensure access token is fresh
 */
export async function ensureFreshToken(
  account: MTMAccount,
  uid: string
): Promise<string> {
  // Check if token is still valid (with 5 min buffer)
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes
  
  if (account.expiresAt && account.expiresAt > now + buffer) {
    return getAccessToken(account);
  }
  
  // Token expired or expiring soon, refresh it
  console.log('[MTM] Refreshing access token for user');
  
  try {
    const refreshToken = getRefreshToken(account);
    const result = await refreshAccessToken(refreshToken);
    
    // Update stored tokens
    await updateTokens(
      uid,
      result.access_token,
      result.refresh_token,
      result.expires_in
    );
    
    return result.access_token;
  } catch (error) {
    console.error('[MTM] Token refresh failed:', error);
    throw new Error('Session expired—please reconnect');
  }
}

/**
 * List meetings from MTM API
 */
export async function listMeetings(
  accessToken: string,
  from: string,
  to: string,
  page: number = 1,
  pageSize: number = 50
): Promise<MTMListResponse> {
  const params = new URLSearchParams({
    from,
    to,
    page: page.toString(),
    pageSize: pageSize.toString(),
    status: 'confirmed,pending', // Only fetch active meetings
  });
  
  const response = await fetch(`${MTM_API_BASE}/meetings?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  
  if (response.status === 401) {
    throw new Error('Unauthorized: token may be expired');
  }
  
  if (response.status === 429) {
    // Rate limited
    const retryAfter = response.headers.get('Retry-After') || '60';
    throw new Error(`Rate limited: retry after ${retryAfter} seconds`);
  }
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MTM API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

/**
 * Paginate through all meetings
 */
export async function* paginateMeetings(
  accessToken: string,
  from: string,
  to: string
): AsyncGenerator<MTMMeeting> {
  let page = 1;
  let hasNext = true;
  
  while (hasNext) {
    const response = await listMeetings(accessToken, from, to, page);
    
    for (const meeting of response.meetings) {
      yield meeting;
    }
    
    hasNext = response.pagination.hasNext;
    page++;
    
    // Add small delay to avoid rate limiting
    if (hasNext) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Get user profile from MTM
 */
export async function getUserProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  email: string;
  org?: string;
}> {
  const response = await fetch(`${MTM_API_BASE}/profile`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Geocode a location string (using cache)
 */
const geocodeCache = new Map<string, { lat: number; lng: number }>();

export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  if (!location || location === 'Online') {
    return null;
  }
  
  // Check cache
  if (geocodeCache.has(location)) {
    return geocodeCache.get(location)!;
  }
  
  try {
    // Use Google Maps Geocoding API
    const apiKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!apiKey) {
      console.warn('[MTM] Google Maps API key not configured');
      return null;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const coords = {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };
      
      // Cache result
      geocodeCache.set(location, coords);
      
      return coords;
    }
  } catch (error) {
    console.error('[MTM] Geocoding failed:', error);
  }
  
  return null;
}

/**
 * Convert MTM timezone to IANA timezone
 */
export function normalizeTimezone(tz: string): string {
  // Common timezone mappings
  const mappings: Record<string, string> = {
    'CET': 'Europe/Berlin',
    'CEST': 'Europe/Berlin',
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    'GMT': 'UTC',
    'BST': 'Europe/London',
  };
  
  return mappings[tz] || tz;
}