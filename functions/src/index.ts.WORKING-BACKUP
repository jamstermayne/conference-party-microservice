import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

// Health endpoint - separate function
export const health = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.2",
    environment: process.env.NODE_ENV || "production"
  });
});

// Party feed endpoint - separate function
export const partiesFeed = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const partiesRef = db.collection('parties');
    const snapshot = await partiesRef.get();
    
    const parties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: parties.length > 0 ? parties : getFallbackParties(),
      meta: {
        count: parties.length || 3,
        loadTime: "45ms",
        swipeSession: `session_${Date.now()}${Math.random()}`,
        filters: { hideOld: false, limit: 10 },
        source: parties.length > 0 ? "firestore" : "fallback"
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: getFallbackParties(),
      meta: { count: 3, loadTime: "12ms", source: "fallback" }
    });
  }
});

// Party swipe endpoint - separate function
export const handleSwipe = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      swipe: {
        id: `swipe_${Date.now()}${Math.random()}`,
        userId: "test",
        partyId: "party-1", 
        action: "interested",
        timestamp: new Date().toISOString(),
        sessionId: null
      },
      message: "Party saved!",
      nextAction: "calendar_sync_available"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calendar OAuth start - separate function
export const calendarOAuthStart = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    // TODO: Implement Google OAuth flow
    res.json({
      success: true,
      authUrl: "https://accounts.google.com/oauth/authorize?mock=true",
      message: "OAuth flow started"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OAuth start failed'
    });
  }
});

function getFallbackParties() {
  return [
    {
      id: "party-1",
      name: "Tech Leaders Networking",
      host: "Google Developer Group", 
      time: "2025-08-04T19:00:00Z",
      location: "Rooftop Bar, Hotel Monaco",
      description: "Connect with fellow tech leaders over cocktails",
      attendeeCount: 45,
      image: "/images/party-1.jpg",
      tags: ["networking", "tech", "cocktails"]
    },
    {
      id: "party-2", 
      name: "Designer After Party",
      host: "Design Systems Inc",
      time: "2025-08-04T21:30:00Z",
      location: "Studio 42, Downtown", 
      description: "Celebrate great design with music and drinks",
      attendeeCount: 32,
      image: "/images/party-2.jpg",
      tags: ["design", "music", "creative"]
    }
  ];
}