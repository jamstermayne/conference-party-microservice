import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
} catch (error) {
  // Already initialized
}

const app = express();

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

// Interfaces (1 function, 1 thing: type definitions)
interface Venue {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
  type: 'conference' | 'party' | 'networking' | 'exhibition';
  amenities?: string[];
}

interface Hotspot {
  venueId: string;
  venueName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  currentOccupancy: number;
  densityLevel: 'low' | 'medium' | 'high' | 'very_high';
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: string;
  activeEvents?: string[];
  nearbyProfessionals?: number;
}

interface HeatmapData {
  timestamp: string;
  venues: Hotspot[];
  totalActive: number;
  peakVenue: {
    id: string;
    name: string;
    occupancy: number;
  };
  recommendations: string[];
}

// Cache for hotspot data (1 function, 1 thing: caching)
let hotspotsCache: HeatmapData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

// Health check endpoint (1 function, 1 thing: health monitoring)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "hotspots-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    cache: {
      hasData: !!hotspotsCache,
      lastUpdated: new Date(cacheTimestamp).toISOString(),
      ttl: CACHE_TTL
    },
    endpoints: {
      health: "operational",
      hotspots: "operational",
      venues: "operational",
      density: "operational",
      nearby: "operational",
      update: "operational"
    }
  });
});

// Gamescom 2025 venue data (1 function, 1 thing: venue configuration)
const GAMESCOM_VENUES: Venue[] = [
  {
    id: "koelnmesse-hall-1",
    name: "Hall 1 - Gaming Publishers",
    address: "Messeplatz 1, 50679 Köln",
    coordinates: { lat: 50.9406, lng: 6.9825 },
    capacity: 5000,
    type: "exhibition",
    amenities: ["WiFi", "Food Court", "Rest Areas"]
  },
  {
    id: "koelnmesse-hall-10",
    name: "Hall 10 - Indie Games",
    address: "Messeplatz 1, 50679 Köln",
    coordinates: { lat: 50.9421, lng: 6.9837 },
    capacity: 3000,
    type: "exhibition",
    amenities: ["WiFi", "Developer Lounges"]
  },
  {
    id: "koelnmesse-confex",
    name: "Confex Conference Center",
    address: "Deutz-Mülheimer Str. 51, 50679 Köln",
    coordinates: { lat: 50.9398, lng: 6.9819 },
    capacity: 1500,
    type: "conference",
    amenities: ["WiFi", "Meeting Rooms", "Business Center"]
  },
  {
    id: "marriott-cologne",
    name: "Marriott Hotel Cologne",
    address: "Johannisstraße 76-80, 50668 Köln",
    coordinates: { lat: 50.9353, lng: 6.9578 },
    capacity: 500,
    type: "networking",
    amenities: ["Bar", "Rooftop", "Restaurant"]
  },
  {
    id: "hyatt-regency",
    name: "Hyatt Regency Cologne",
    address: "Kennedy-Ufer 2A, 50679 Köln",
    coordinates: { lat: 50.9408, lng: 6.9743 },
    capacity: 400,
    type: "networking",
    amenities: ["Bar", "Terrace", "Spa"]
  },
  {
    id: "lanxess-arena",
    name: "Lanxess Arena - Esports Finals",
    address: "Willy-Brandt-Platz 3, 50679 Köln",
    coordinates: { lat: 50.9385, lng: 6.9830 },
    capacity: 8000,
    type: "party",
    amenities: ["Food Court", "VIP Lounges"]
  },
  {
    id: "bootshaus",
    name: "Bootshaus - Official After Party",
    address: "Auenweg 173, 51063 Köln",
    coordinates: { lat: 50.9614, lng: 7.0224 },
    capacity: 1200,
    type: "party",
    amenities: ["Bar", "Dance Floor", "Outdoor Area"]
  }
];

// Calculate density level (1 function, 1 thing: density calculation)
function calculateDensityLevel(occupancy: number, capacity: number): 'low' | 'medium' | 'high' | 'very_high' {
  const percentage = (occupancy / capacity) * 100;
  if (percentage < 25) return 'low';
  if (percentage < 50) return 'medium';
  if (percentage < 75) return 'high';
  return 'very_high';
}

// Generate mock occupancy data (1 function, 1 thing: data simulation)
function generateMockOccupancy(venue: Venue): number {
  const hour = new Date().getHours();
  const baseOccupancy = venue.capacity * 0.3; // Base 30% occupancy

  // Time-based adjustments
  let multiplier = 1;
  if (hour >= 10 && hour <= 12) multiplier = 1.5; // Morning peak
  if (hour >= 14 && hour <= 17) multiplier = 2.0; // Afternoon peak
  if (hour >= 19 && hour <= 22) multiplier = venue.type === 'party' ? 2.5 : 0.8; // Evening

  // Add randomness
  const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variation

  return Math.min(
    venue.capacity,
    Math.floor(baseOccupancy * multiplier * randomFactor)
  );
}

// Get current hotspots (1 function, 1 thing: hotspot retrieval)
app.get("/hotspots", async (req: Request, res: Response): Promise<any> => {
  try {
    const { refresh } = req.query;
    const now = Date.now();

    // Return cached data if fresh and not forced refresh
    if (!refresh && hotspotsCache && (now - cacheTimestamp) < CACHE_TTL) {
      return res.status(200).json({
        success: true,
        cached: true,
        data: hotspotsCache
      });
    }

    // Generate hotspot data for each venue
    const hotspots: Hotspot[] = GAMESCOM_VENUES.map(venue => {
      const occupancy = generateMockOccupancy(venue);
      const previousOccupancy = hotspotsCache?.venues.find(v => v.venueId === venue.id)?.currentOccupancy || occupancy;

      return {
        venueId: venue.id,
        venueName: venue.name,
        coordinates: venue.coordinates,
        currentOccupancy: occupancy,
        densityLevel: calculateDensityLevel(occupancy, venue.capacity),
        trendDirection: occupancy > previousOccupancy ? 'increasing' :
                       occupancy < previousOccupancy ? 'decreasing' : 'stable',
        lastUpdated: new Date().toISOString(),
        nearbyProfessionals: Math.floor(occupancy * 0.4) // Assume 40% are professionals
      } as Hotspot;
    });

    // Find peak venue
    const peakVenue = hotspots.reduce((max, current) =>
      current.currentOccupancy > max.currentOccupancy ? current : max
    );

    // Generate recommendations
    const recommendations: string[] = [];
    const lowDensityVenues = hotspots.filter(h => h.densityLevel === 'low');
    const highDensityVenues = hotspots.filter(h => h.densityLevel === 'very_high');

    if (lowDensityVenues.length > 0) {
      recommendations.push(`${lowDensityVenues[0].venueName} has low crowd density - perfect for focused networking`);
    }

    if (highDensityVenues.length > 0) {
      recommendations.push(`${highDensityVenues[0].venueName} is at peak capacity - great for high-energy networking`);
    }

    const networkingVenues = hotspots.filter(h =>
      GAMESCOM_VENUES.find(v => v.id === h.venueId)?.type === 'networking'
    );

    if (networkingVenues.length > 0) {
      const bestNetworking = networkingVenues.reduce((best, current) =>
        current.densityLevel === 'medium' ? current : best
      );
      recommendations.push(`${bestNetworking.venueName} has optimal networking conditions`);
    }

    // Create heatmap data
    const heatmapData: HeatmapData = {
      timestamp: new Date().toISOString(),
      venues: hotspots,
      totalActive: hotspots.reduce((sum, h) => sum + h.currentOccupancy, 0),
      peakVenue: {
        id: peakVenue.venueId,
        name: peakVenue.venueName,
        occupancy: peakVenue.currentOccupancy
      },
      recommendations
    };

    // Update cache
    hotspotsCache = heatmapData;
    cacheTimestamp = now;

    res.status(200).json({
      success: true,
      cached: false,
      data: heatmapData
    });

  } catch (error) {
    console.error('[Hotspots] Get hotspots error:', error);
    res.status(500).json({ error: "Failed to fetch hotspots" });
  }
});

// Get all venues (1 function, 1 thing: venue listing)
app.get("/venues", async (req: Request, res: Response): Promise<any> => {
  try {
    const { type } = req.query;

    let venues = GAMESCOM_VENUES;

    if (type) {
      venues = venues.filter(v => v.type === type);
    }

    res.status(200).json({
      success: true,
      venues,
      count: venues.length
    });

  } catch (error) {
    console.error('[Hotspots] Get venues error:', error);
    res.status(500).json({ error: "Failed to fetch venues" });
  }
});

// Get density at specific location (1 function, 1 thing: density query)
app.get("/density", async (req: Request, res: Response): Promise<any> => {
  try {
    const { lat, lng, radius = '500' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "Latitude and longitude are required"
      });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const searchRadius = parseInt(radius as string);

    // Find venues within radius
    const nearbyVenues = GAMESCOM_VENUES.filter(venue => {
      const distance = calculateDistance(
        userLat, userLng,
        venue.coordinates.lat, venue.coordinates.lng
      );
      return distance <= searchRadius;
    });

    if (nearbyVenues.length === 0) {
      return res.status(200).json({
        success: true,
        density: 'none',
        message: "No venues within specified radius",
        nearestVenue: null
      });
    }

    // Calculate aggregate density
    const totalOccupancy = nearbyVenues.reduce((sum, venue) =>
      sum + generateMockOccupancy(venue), 0
    );

    const totalCapacity = nearbyVenues.reduce((sum, venue) =>
      sum + venue.capacity, 0
    );

    const densityLevel = calculateDensityLevel(totalOccupancy, totalCapacity);

    // Find nearest venue
    const nearestVenue = nearbyVenues.reduce((nearest, venue) => {
      const distanceToVenue = calculateDistance(
        userLat, userLng,
        venue.coordinates.lat, venue.coordinates.lng
      );
      const distanceToNearest = calculateDistance(
        userLat, userLng,
        nearest.coordinates.lat, nearest.coordinates.lng
      );
      return distanceToVenue < distanceToNearest ? venue : nearest;
    });

    res.status(200).json({
      success: true,
      density: densityLevel,
      nearbyVenues: nearbyVenues.length,
      totalPeople: totalOccupancy,
      nearestVenue: {
        id: nearestVenue.id,
        name: nearestVenue.name,
        distance: Math.round(calculateDistance(
          userLat, userLng,
          nearestVenue.coordinates.lat, nearestVenue.coordinates.lng
        )),
        occupancy: generateMockOccupancy(nearestVenue)
      }
    });

  } catch (error) {
    console.error('[Hotspots] Get density error:', error);
    res.status(500).json({ error: "Failed to calculate density" });
  }
});

// Get nearby professionals count (1 function, 1 thing: proximity networking)
app.get("/nearby", async (req: Request, res: Response): Promise<any> => {
  try {
    const { venueId } = req.query;

    if (!venueId) {
      return res.status(400).json({
        error: "Venue ID is required"
      });
    }

    const venue = GAMESCOM_VENUES.find(v => v.id === venueId);

    if (!venue) {
      return res.status(404).json({
        error: "Venue not found"
      });
    }

    const occupancy = generateMockOccupancy(venue);
    const professionals = Math.floor(occupancy * 0.4); // 40% are professionals

    // Generate mock professional categories
    const categories = {
      developers: Math.floor(professionals * 0.35),
      publishers: Math.floor(professionals * 0.25),
      investors: Math.floor(professionals * 0.15),
      media: Math.floor(professionals * 0.15),
      serviceProviders: Math.floor(professionals * 0.10)
    };

    res.status(200).json({
      success: true,
      venue: {
        id: venue.id,
        name: venue.name
      },
      nearby: {
        total: professionals,
        categories,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Hotspots] Get nearby error:', error);
    res.status(500).json({ error: "Failed to fetch nearby professionals" });
  }
});

// Update venue occupancy (1 function, 1 thing: occupancy update)
app.post("/update", async (req: Request, res: Response): Promise<any> => {
  try {
    const { venueId, occupancy, userId } = req.body;

    if (!venueId || occupancy === undefined) {
      return res.status(400).json({
        error: "Venue ID and occupancy are required"
      });
    }

    const venue = GAMESCOM_VENUES.find(v => v.id === venueId);

    if (!venue) {
      return res.status(404).json({
        error: "Venue not found"
      });
    }

    // In production, this would update Firestore
    // For now, we'll just validate and return success
    const db = admin.firestore();
    await db.collection('venue_updates').add({
      venueId,
      occupancy,
      reportedBy: userId || 'anonymous',
      timestamp: new Date().toISOString()
    });

    // Clear cache to force refresh
    hotspotsCache = null;
    cacheTimestamp = 0;

    res.status(200).json({
      success: true,
      message: "Venue occupancy updated",
      venue: {
        id: venueId,
        name: venue.name,
        newOccupancy: occupancy
      }
    });

  } catch (error) {
    console.error('[Hotspots] Update error:', error);
    res.status(500).json({ error: "Failed to update venue occupancy" });
  }
});

// Helper function: Calculate distance between coordinates (1 function, 1 thing: distance calculation)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
}

// Export the function
export const hotspotsService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
}, app);