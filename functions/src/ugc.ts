import {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

/**
 * 🔍 DUPLICATE DETECTION UTILITIES
 */

// Normalize venue names for comparison
function normalizeVenue(venue: string): string {
  return venue.toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// Calculate similarity between two venue names (0-1 scale)
function calculateVenueSimilarity(venue1: string, venue2: string): number {
  const norm1 = normalizeVenue(venue1);
  const norm2 = normalizeVenue(venue2);

  // Exact match
  if (norm1 === norm2) return 1.0;

  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;

  // Handle common typos and variations
  const typoDistance = calculateLevenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  if (maxLength > 0) {
    const typeSimilarity = 1 - (typoDistance / maxLength);
    if (typeSimilarity >= 0.85) return 0.85; // High similarity for typos
  }

  // Simple word overlap calculation
  const words1 = norm1.split(" ").filter((w) => w.length > 2); // Ignore short words
  const words2 = norm2.split(" ").filter((w) => w.length > 2);
  const commonWords = words1.filter((word) =>
    words2.some((w2) => w2.includes(word) || word.includes(w2) || calculateLevenshteinDistance(word, w2) <= 1)
  );

  if (commonWords.length === 0) return 0;

  return (commonWords.length * 2) / (words1.length + words2.length);
}

// Simple Levenshtein distance calculation for typo detection
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Check if two time slots overlap (within 2 hours)
function checkTimeOverlap(time1: string, time2: string): boolean {
  const [hours1, minutes1] = time1.split(":").map(Number);
  const [hours2, minutes2] = time2.split(":").map(Number);

  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  // Consider events within 2 hours as potentially overlapping
  const timeDifference = Math.abs(totalMinutes1 - totalMinutes2);
  return timeDifference <= 120; // 120 minutes = 2 hours
}

// Check for duplicate events
async function checkForDuplicates(eventData: any): Promise<{
    isDuplicate: boolean;
    duplicates: any[];
    warnings: string[];
}> {
  const db = getFirestore();

  // Query events for the same date
  const sameDate = await db.collection("events")
    .where("date", "==", eventData.date)
    .where("status", "==", "active")
    .get();

  // Also check the parties collection for existing events
  const partiesQuery = await db.collection("parties")
    .where("active", "==", true)
    .get();

  const allEvents: any[] = [
    ...sameDate.docs.map((doc) => ({id: doc.id, ...doc.data(), collection: "events"})),
    ...partiesQuery.docs
      .filter((doc) => {
        const data = doc.data();
        return data["Date"] === eventData.date || data.date === eventData.date;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          collection: "parties",
          // Normalize field names
          name: data["Event Name"] || data.name,
          venue: data["Address"] || data.venue,
          startTime: data["Start Time"] || data.startTime,
        };
      }),
  ];

  const duplicates = [];
  const warnings = [];

  for (const event of allEvents) {
    // Skip if same event (editing case)
    if (event.id === eventData.id) continue;

    // Ensure venue exists before comparison
    if (!event.venue || !eventData.venue) continue;

    const venueSimilarity = calculateVenueSimilarity(eventData.venue, event.venue);
    const timeOverlap = event.startTime ? checkTimeOverlap(eventData.startTime, event.startTime) : false;

    // High confidence duplicate
    if (venueSimilarity >= 0.8 && timeOverlap) {
      duplicates.push({
        id: event.id,
        name: event.name || "Unnamed Event",
        venue: event.venue,
        startTime: event.startTime,
        creator: event.creator || event.hosts || "Unknown",
        similarity: venueSimilarity,
        collection: event.collection,
      });
    }
    // Potential duplicate warning
    else if (venueSimilarity >= 0.6 && timeOverlap) {
      warnings.push(`Similar event "${event.name || "Unnamed Event"}" at "${event.venue}" around ${event.startTime}`);
    }
  }

  return {
    isDuplicate: duplicates.length > 0,
    duplicates,
    warnings,
  };
}

/**
 * 🔒 SECURITY UTILITIES
 */
const rateLimitStore = new Map<string, number[]>();

function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .substring(0, 1000); // Hard limit
}

function checkRateLimit(clientIP: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(clientIP) || [];

  // Remove old requests outside the time window
  const recentRequests = userRequests.filter((timestamp) => now - timestamp < windowMs);

  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  rateLimitStore.set(clientIP, recentRequests);

  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupRateLimitStore(now, windowMs);
  }

  return true;
}

function cleanupRateLimitStore(now: number, windowMs: number): void {
  for (const [ip, requests] of rateLimitStore.entries()) {
    const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);
    if (recentRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, recentRequests);
    }
  }
}

/**
 * 🎉 CREATE UGC EVENT ENDPOINT
 * Handles user-generated event creation
 */
export const createUGCEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Creating UGC event:", req.body);

    const eventData = req.body;

    // Additional security validation
    if (!eventData || typeof eventData !== "object") {
      res.status(400).json({
        success: false,
        error: "Invalid request data",
      });
      return;
    }

    // Check for excessively large payloads within individual fields
    const maxFieldLength = 10000;
    for (const [key, value] of Object.entries(eventData)) {
      if (typeof value === "string" && value.length > maxFieldLength) {
        res.status(400).json({
          success: false,
          error: `Field '${key}' exceeds maximum length of ${maxFieldLength} characters`,
        });
        return;
      }
    }

    // Validate required fields including creator
    if (!eventData.name || !eventData.creator || !eventData.date || !eventData.startTime || !eventData.venue) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: name, creator, date, startTime, venue",
      });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(eventData.date)) {
      res.status(400).json({
        success: false,
        error: "Date must be in YYYY-MM-DD format",
      });
      return;
    }

    // Validate time format (HH:MM)
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(eventData.startTime)) {
      res.status(400).json({
        success: false,
        error: "Start time must be in HH:MM format",
      });
      return;
    }

    // Validate date is not in the past
    const eventDate = new Date(eventData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      res.status(400).json({
        success: false,
        error: "Event date cannot be in the past",
      });
      return;
    }

    // Validate creator field
    if (typeof eventData.creator !== "string" || eventData.creator.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: "Creator name must be at least 2 characters long",
      });
      return;
    }

    if (eventData.creator.trim().length > 100) {
      res.status(400).json({
        success: false,
        error: "Creator name cannot exceed 100 characters",
      });
      return;
    }

    // Sanitize all inputs to prevent XSS
    eventData.name = sanitizeInput(eventData.name);
    eventData.creator = sanitizeInput(eventData.creator);
    eventData.venue = sanitizeInput(eventData.venue);
    eventData.description = eventData.description ? sanitizeInput(eventData.description) : "";

    // Rate limiting check
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    if (!checkRateLimit(clientIP)) {
      res.status(429).json({
        success: false,
        error: "Too many requests. Please wait before creating another event.",
      });
      return;
    }

    // Check for duplicates unless user has confirmed
    const forceCreate = req.body.forceCreate === true;
    if (!forceCreate) {
      const duplicateCheck = await checkForDuplicates(eventData);

      if (duplicateCheck.isDuplicate) {
        res.status(409).json({
          success: false,
          error: "Potential duplicate event detected",
          duplicateWarning: true,
          duplicates: duplicateCheck.duplicates,
          warnings: duplicateCheck.warnings,
          message: "An event with similar venue and time already exists. " +
            "Please review or confirm if you want to create anyway.",
          eventData: eventData,
        });
        return;
      }

      if (duplicateCheck.warnings.length > 0) {
        // Continue with creation but include warnings
        console.log("Event creation with warnings:", duplicateCheck.warnings);
      }
    }

    // Generate unique ID
    const eventId = `ugc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create event object
    const ugcEvent = {
      id: eventId,
      name: eventData.name,
      creator: eventData.creator.trim(),
      date: eventData.date,
      startTime: eventData.startTime,
      venue: eventData.venue,
      category: eventData.category || "networking",
      description: eventData.description || "",
      hosts: eventData.creator.trim(),
      source: "ugc",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Add some default fields for compatibility
      endTime: null,
      coordinates: null,
      address: eventData.venue,
    };

    // Save to Firestore
    const db = getFirestore();
    await db.collection("events").doc(eventId).set(ugcEvent);

    console.log("UGC event created successfully:", eventId);

    // Return success response
    res.json({
      success: true,
      eventId: eventId,
      message: "Event created successfully",
      event: ugcEvent,
    });
  } catch (error) {
    console.error("UGC Event Creation Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    });
  }
};

/**
 * 📊 GET UGC EVENTS ENDPOINT
 * Returns user-generated events
 */
export const getUGCEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log("Fetching UGC events...");

    const db = getFirestore();
    const ugcEvents = await db.collection("events")
      .where("source", "==", "ugc")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .get();

    const events = ugcEvents.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Found ${events.length} UGC events`);

    res.json({
      success: true,
      events: events,
      count: events.length,
    });
  } catch (error) {
    console.error("Get UGC Events Error:", error);
    res.status(500).json({
      success: false,
      events: [],
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
