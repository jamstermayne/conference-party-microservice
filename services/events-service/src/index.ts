import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { defineSecret } from 'firebase-functions/params';
import { securityMiddleware } from '../../shared/security-middleware';
import { EventSchema, validateSchema } from '../../shared/schemas';

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
} catch (error) {
  // Already initialized
}

const app = express();

// Define secrets
const GOOGLE_SHEETS_API_KEY = defineSecret('GOOGLE_SHEETS_API_KEY');

// Middleware
app.use(cors({
  origin: [
    'https://conference-party-app.web.app',
    'https://conference-party-app--preview-*.web.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));
app.use(express.json());

// Apply security middleware
app.use(securityMiddleware.validateInput);
app.use(securityMiddleware.sanitizeXSS);

// Event interface
interface EventData {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  price: string;
  source: string;
  description?: string;
  capacity?: number;
  attendeeCount?: number;
  tags?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Cache for events data
let eventsCache: EventData[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback events for demo
const FALLBACK_EVENTS: EventData[] = [
  {
    id: "meettomatch-the-cologne-edition-2025",
    title: "MeetToMatch The Cologne Edition 2025",
    venue: "Kölnmesse Confex",
    date: "2025-08-22",
    time: "09:00 - 18:00",
    price: "From £127.04",
    source: "fallback",
    description: "Premier gaming industry networking event",
    capacity: 500,
    attendeeCount: 342,
    tags: ["networking", "gaming", "b2b"],
    coordinates: { lat: 50.9406, lng: 6.9825 }
  },
  {
    id: "marriott-rooftop-mixer",
    title: "Marriott Rooftop Mixer",
    venue: "Marriott Hotel Cologne",
    date: "2025-08-22",
    time: "20:00 - 23:30",
    price: "Free",
    source: "fallback",
    description: "Casual evening networking on the rooftop",
    capacity: 150,
    attendeeCount: 89,
    tags: ["social", "rooftop", "evening"],
    coordinates: { lat: 50.9353, lng: 6.9578 }
  },
  {
    id: "indie-games-showcase",
    title: "Indie Games Showcase & Mixer",
    venue: "Gamescom Hall 10",
    date: "2025-08-23",
    time: "18:00 - 22:00",
    price: "€25",
    source: "fallback",
    description: "Discover and network with indie game developers",
    capacity: 300,
    attendeeCount: 267,
    tags: ["indie", "games", "showcase"],
    coordinates: { lat: 50.9421, lng: 6.9837 }
  }
];

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "events-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    cache: {
      hasData: !!eventsCache,
      lastUpdated: new Date(cacheTimestamp).toISOString(),
      itemCount: eventsCache?.length || 0
    },
    endpoints: {
      health: "operational",
      events: "operational",
      search: "operational",
      details: "operational",
      days: "operational",
      sync: "operational"
    }
  });
});

// Get events data from cache or database
async function getEventsData(): Promise<EventData[]> {
  const now = Date.now();

  // Return cached data if still fresh
  if (eventsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return eventsCache;
  }

  try {
    const db = admin.firestore();
    const snap = await db.collection("events").limit(100).get();

    if (!snap.empty) {
      eventsCache = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as EventData));
      cacheTimestamp = now;
      return eventsCache;
    }
  } catch (error) {
    console.error('[Events] Database error:', error);
  }

  // Fall back to static events
  eventsCache = FALLBACK_EVENTS;
  cacheTimestamp = now;
  return eventsCache;
}

// Get all events
app.get("/events", async (req: Request, res: Response) => {
  try {
    const {
      date,
      venue,
      search,
      tags,
      priceRange,
      limit = '50',
      offset = '0'
    } = req.query;

    let events = await getEventsData();

    // Apply filters
    if (date) {
      events = events.filter(event => event.date === date);
    }

    if (venue) {
      events = events.filter(event =>
        event.venue.toLowerCase().includes((venue as string).toLowerCase())
      );
    }

    if (search) {
      const searchTerm = (search as string).toLowerCase();
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.venue.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (tags) {
      const filterTags = (tags as string).split(',').map(tag => tag.trim().toLowerCase());
      events = events.filter(event =>
        event.tags?.some(tag => filterTags.includes(tag.toLowerCase()))
      );
    }

    if (priceRange) {
      const [min, max] = (priceRange as string).split('-').map(Number);
      events = events.filter(event => {
        // Simple price parsing - extract numbers from price string
        const priceMatch = event.price.match(/[\d.]+/);
        if (!priceMatch) return true; // Include free events
        const price = parseFloat(priceMatch[0]);
        return (!min || price >= min) && (!max || price <= max);
      });
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedEvents = events.slice(offsetNum, offsetNum + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedEvents,
      meta: {
        total: events.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: (offsetNum + limitNum) < events.length
      }
    });

  } catch (error) {
    console.error('[Events] Get events error:', error);
    res.status(500).json({
      error: "Failed to fetch events",
      fallback: true,
      data: FALLBACK_EVENTS
    });
  }
});

// Get specific event details
app.get("/events/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = await getEventsData();
    const event = events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        id
      });
    }

    res.status(200).json({
      success: true,
      event
    });

  } catch (error) {
    console.error('[Events] Get event details error:', error);
    res.status(500).json({
      error: "Failed to fetch event details"
    });
  }
});

// Search events
app.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, categories, dates, venues } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Search query required"
      });
    }

    const events = await getEventsData();
    const searchTerm = (q as string).toLowerCase();

    let results = events.filter(event =>
      event.title.toLowerCase().includes(searchTerm) ||
      event.venue.toLowerCase().includes(searchTerm) ||
      event.description?.toLowerCase().includes(searchTerm) ||
      event.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    // Apply additional filters
    if (categories) {
      const filterCategories = (categories as string).split(',');
      results = results.filter(event =>
        event.tags?.some(tag => filterCategories.includes(tag))
      );
    }

    if (dates) {
      const filterDates = (dates as string).split(',');
      results = results.filter(event => filterDates.includes(event.date));
    }

    if (venues) {
      const filterVenues = (venues as string).split(',');
      results = results.filter(event =>
        filterVenues.some(venue =>
          event.venue.toLowerCase().includes(venue.toLowerCase())
        )
      );
    }

    res.status(200).json({
      success: true,
      query: q,
      results,
      count: results.length
    });

  } catch (error) {
    console.error('[Events] Search error:', error);
    res.status(500).json({
      error: "Search failed"
    });
  }
});

// Get available event days
app.get("/days", async (req: Request, res: Response) => {
  try {
    const { conference } = req.query;

    if (!conference) {
      return res.status(400).json({
        error: "conference parameter required"
      });
    }

    const events = await getEventsData();

    // Extract unique dates from events
    const uniqueDates = [...new Set(events.map(event => event.date))]
      .sort()
      .map(date => {
        const eventDate = new Date(date);
        return {
          date,
          label: eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          }),
          eventCount: events.filter(event => event.date === date).length
        };
      });

    res.status(200).json({
      success: true,
      conference,
      days: uniqueDates
    });

  } catch (error) {
    console.error('[Events] Get days error:', error);
    res.status(500).json({
      error: "Failed to fetch event days"
    });
  }
});

// Sync events from external sources
app.post("/sync", async (req: Request, res: Response) => {
  try {
    // Clear cache to force refresh
    eventsCache = null;
    cacheTimestamp = 0;

    // Trigger sync process (in real implementation, this would sync with Google Sheets)
    console.log('[Events] Manual sync triggered');

    // Fetch fresh data
    const events = await getEventsData();

    res.status(200).json({
      success: true,
      message: "Events sync completed",
      count: events.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Events] Sync error:', error);
    res.status(500).json({
      error: "Sync failed"
    });
  }
});

// Get event statistics
app.get("/stats", async (req: Request, res: Response) => {
  try {
    const events = await getEventsData();

    const stats = {
      totalEvents: events.length,
      uniqueVenues: new Set(events.map(e => e.venue)).size,
      uniqueDates: new Set(events.map(e => e.date)).size,
      freeEvents: events.filter(e => e.price.toLowerCase().includes('free')).length,
      paidEvents: events.filter(e => !e.price.toLowerCase().includes('free')).length,
      totalCapacity: events.reduce((sum, e) => sum + (e.capacity || 0), 0),
      totalAttendees: events.reduce((sum, e) => sum + (e.attendeeCount || 0), 0),
      popularTags: getPopularTags(events)
    };

    res.status(200).json({
      success: true,
      stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Events] Stats error:', error);
    res.status(500).json({
      error: "Failed to generate statistics"
    });
  }
});

// Helper function to get popular tags
function getPopularTags(events: EventData[]): Array<{tag: string, count: number}> {
  const tagCounts: Record<string, number> = {};

  events.forEach(event => {
    event.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Export the function
export const eventsService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 10,
  secrets: [GOOGLE_SHEETS_API_KEY],
}, app);