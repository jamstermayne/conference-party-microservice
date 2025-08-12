/**
 * Seed script for populating Firestore with test hotspot data
 * Run with: npm run seed:hotspots
 */

import * as admin from "firebase-admin";

// Initialize admin SDK
const serviceAccount = process.env["GOOGLE_APPLICATION_CREDENTIALS"];
if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccount ? 
      admin.credential.cert(require(serviceAccount)) : 
      admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

const CONFERENCE_ID = "gamescom2025";

// Test venues with realistic attendance patterns
const testVenues = [
  {
    id: "koelnmesse-confex",
    name: "Kölnmesse Confex",
    lat: 50.943,
    lon: 6.958,
    baseCount: 120,
    variance: 30,
  },
  {
    id: "odyssey-club",
    name: "Odyssey Club",
    lat: 50.937,
    lon: 6.96,
    baseCount: 80,
    variance: 20,
  },
  {
    id: "meltdown-cologne",
    name: "Meltdown Cologne",
    lat: 50.940,
    lon: 6.955,
    baseCount: 50,
    variance: 15,
  },
  {
    id: "dom-hotel",
    name: "Dom Hotel",
    lat: 50.941,
    lon: 6.957,
    baseCount: 100,
    variance: 25,
  },
  {
    id: "gamescom-party-hall",
    name: "Gamescom Party Hall",
    lat: 50.942,
    lon: 6.959,
    baseCount: 65,
    variance: 20,
  },
  {
    id: "marriott-bar",
    name: "Marriott Bar",
    lat: 50.944,
    lon: 6.961,
    baseCount: 45,
    variance: 10,
  },
  {
    id: "xyz-venue",
    name: "XYZ Venue",
    lat: 50.946,
    lon: 6.963,
    baseCount: 30,
    variance: 10,
  },
  {
    id: "indie-arena-booth",
    name: "Indie Arena Booth",
    lat: 50.947,
    lon: 6.982,
    baseCount: 75,
    variance: 25,
  },
  {
    id: "retro-gaming-lounge",
    name: "Retro Gaming Lounge",
    lat: 50.939,
    lon: 6.965,
    baseCount: 40,
    variance: 15,
  },
  {
    id: "esports-arena",
    name: "Esports Arena",
    lat: 50.945,
    lon: 6.978,
    baseCount: 150,
    variance: 40,
  },
  {
    id: "vr-experience-zone",
    name: "VR Experience Zone",
    lat: 50.943,
    lon: 6.972,
    baseCount: 55,
    variance: 20,
  },
  {
    id: "developer-meetup-space",
    name: "Developer Meetup Space",
    lat: 50.948,
    lon: 6.968,
    baseCount: 35,
    variance: 10,
  },
];

// Test events to link with venues
const testEvents = [
  {
    id: "opening-ceremony",
    name: "Gamescom 2025 Opening Ceremony",
    venue_id: "koelnmesse-confex",
    venue: "Kölnmesse Confex",
    conference: CONFERENCE_ID,
    coordinates: {lat: 50.943, lng: 6.958},
    date: "2025-08-20",
    time: "10:00",
    rsvp_count: 85,
    checkin_count: 42,
  },
  {
    id: "indie-showcase",
    name: "Indie Games Showcase",
    venue_id: "indie-arena-booth",
    venue: "Indie Arena Booth",
    conference: CONFERENCE_ID,
    coordinates: {lat: 50.947, lng: 6.982},
    date: "2025-08-21",
    time: "14:00",
    rsvp_count: 60,
    checkin_count: 30,
  },
  {
    id: "esports-finals",
    name: "Esports Championship Finals",
    venue_id: "esports-arena",
    venue: "Esports Arena",
    conference: CONFERENCE_ID,
    coordinates: {lat: 50.945, lng: 6.978},
    date: "2025-08-22",
    time: "18:00",
    rsvp_count: 120,
    checkin_count: 95,
  },
  {
    id: "developer-mixer",
    name: "Developer Networking Mixer",
    venue_id: "marriott-bar",
    venue: "Marriott Bar",
    conference: CONFERENCE_ID,
    coordinates: {lat: 50.944, lng: 6.961},
    date: "2025-08-20",
    time: "20:00",
    rsvp_count: 40,
    checkin_count: 25,
  },
  {
    id: "vr-demo-day",
    name: "VR Technology Demo Day",
    venue_id: "vr-experience-zone",
    venue: "VR Experience Zone",
    conference: CONFERENCE_ID,
    coordinates: {lat: 50.943, lng: 6.972},
    date: "2025-08-21",
    time: "11:00",
    rsvp_count: 45,
    checkin_count: 28,
  },
];

async function seedHotspots() {
  console.log("🌱 Starting hotspot data seeding...");

  try {
    // 1. Seed events
    console.log("📝 Creating test events...");
    const batch = db.batch();
    
    for (const event of testEvents) {
      const eventRef = db.collection("events").doc(event.id);
      batch.set(eventRef, {
        ...event,
        created_at: Date.now(),
        last_activity: Date.now() - Math.random() * 3600000, // Random activity in last hour
      });
    }
    
    await batch.commit();
    console.log(`✅ Created ${testEvents.length} test events`);

    // 2. Generate hotspot aggregation
    console.log("🔥 Generating hotspot data...");
    const hotspotsData: Record<string, any> = {};
    
    for (const venue of testVenues) {
      // Add some randomness to make it realistic
      const randomVariance = Math.floor(Math.random() * venue.variance * 2 - venue.variance);
      const count = Math.max(0, venue.baseCount + randomVariance);
      
      hotspotsData[venue.id] = {
        name: venue.name,
        lat: venue.lat,
        lon: venue.lon,
        count: count,
        last_update: Date.now() - Math.random() * 300000, // Random update in last 5 minutes
      };
    }

    // 3. Save to Firestore
    const hotspotsRef = db.collection("hotspots").doc(CONFERENCE_ID);
    await hotspotsRef.set(hotspotsData);
    console.log(`✅ Saved hotspot data for ${Object.keys(hotspotsData).length} venues`);

    // 4. Create some test RSVPs
    console.log("🎟️ Creating test RSVPs...");
    const rsvpBatch = db.batch();
    let rsvpCount = 0;
    
    for (const event of testEvents) {
      // Create 5-10 RSVPs per event
      const numRsvps = Math.floor(Math.random() * 5) + 5;
      for (let i = 0; i < numRsvps; i++) {
        const rsvpRef = db.collection("rsvps").doc();
        rsvpBatch.set(rsvpRef, {
          event_id: event.id,
          user_id: `test-user-${Math.floor(Math.random() * 1000)}`,
          created_at: Date.now() - Math.random() * 86400000, // Random time in last 24h
        });
        rsvpCount++;
      }
    }
    
    await rsvpBatch.commit();
    console.log(`✅ Created ${rsvpCount} test RSVPs`);

    // 5. Create some test check-ins
    console.log("📍 Creating test check-ins...");
    const checkinBatch = db.batch();
    let checkinCount = 0;
    
    for (const event of testEvents) {
      // Create 2-5 check-ins per event
      const numCheckins = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numCheckins; i++) {
        const checkinRef = db.collection("checkins").doc();
        checkinBatch.set(checkinRef, {
          event_id: event.id,
          user_id: `test-user-${Math.floor(Math.random() * 1000)}`,
          timestamp: Date.now() - Math.random() * 3600000, // Random time in last hour
          location: new admin.firestore.GeoPoint(
            event.coordinates.lat + (Math.random() - 0.5) * 0.001,
            event.coordinates.lng + (Math.random() - 0.5) * 0.001
          ),
        });
        checkinCount++;
      }
    }
    
    await checkinBatch.commit();
    console.log(`✅ Created ${checkinCount} test check-ins`);

    console.log("\n🎉 Hotspot seeding complete!");
    console.log("📊 Summary:");
    console.log(`   - ${testVenues.length} venues`);
    console.log(`   - ${testEvents.length} events`);
    console.log(`   - ${rsvpCount} RSVPs`);
    console.log(`   - ${checkinCount} check-ins`);
    console.log("\n🔗 Test the API at: /api/hotspots?conference=gamescom2025");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedHotspots()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export {seedHotspots};