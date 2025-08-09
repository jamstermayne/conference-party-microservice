#!/usr/bin/env node
/**
 * DELETE UGC TEST EVENTS
 * Script to remove test events created during UGC system development
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set. Using default credentials.');
}

const app = initializeApp();
const db = getFirestore(app);

/**
 * Delete all UGC test events from Firestore
 */
async function deleteUGCTestEvents() {
  console.log('🗑️  Starting deletion of UGC test events...\n');

  try {
    // Get all events from the 'events' collection
    const eventsRef = db.collection('events');
    const snapshot = await eventsRef.get();

    if (snapshot.empty) {
      console.log('✅ No events found in database');
      return;
    }

    console.log(`📊 Found ${snapshot.size} total events`);

    // Filter UGC events (events with source='ugc' or isUGC=true)
    const ugcEvents = [];
    const curatedEvents = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.source === 'ugc' || data.isUGC === true) {
        ugcEvents.push({ id: doc.id, ...data });
      } else {
        curatedEvents.push({ id: doc.id, ...data });
      }
    });

    console.log(`🧪 Found ${ugcEvents.length} UGC test events`);
    console.log(`📝 Found ${curatedEvents.length} curated events (will be preserved)\n`);

    if (ugcEvents.length === 0) {
      console.log('✅ No UGC test events to delete');
      return;
    }

    // Show what will be deleted
    console.log('🗑️  The following UGC test events will be deleted:');
    ugcEvents.forEach((event, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${event.name || event['Event Name']} (${event.creator || event.Hosts}) - ${event.date || event.Date}`);
    });

    console.log('\n⚠️  This will permanently delete all UGC test events!');
    console.log('🔒 Curated events from Google Sheets will be preserved.');

    // In a real scenario, you might want to add a confirmation prompt here
    // For automation purposes, we'll proceed directly

    console.log('\n🚀 Proceeding with deletion...\n');

    // Delete UGC events in batches
    const batchSize = 10;
    let deletedCount = 0;

    for (let i = 0; i < ugcEvents.length; i += batchSize) {
      const batch = db.batch();
      const batchEvents = ugcEvents.slice(i, i + batchSize);

      batchEvents.forEach(event => {
        const docRef = eventsRef.doc(event.id);
        batch.delete(docRef);
      });

      await batch.commit();
      deletedCount += batchEvents.length;
      
      console.log(`✅ Deleted batch ${Math.ceil((i + 1) / batchSize)}: ${batchEvents.length} events (${deletedCount}/${ugcEvents.length} total)`);
    }

    console.log(`\n🎉 Successfully deleted ${deletedCount} UGC test events!`);
    console.log(`🔒 ${curatedEvents.length} curated events remain in the database`);

    // Verify the cleanup
    const finalSnapshot = await eventsRef.get();
    console.log(`\n📊 Final database state:`);
    console.log(`   Total events: ${finalSnapshot.size}`);
    
    // Count remaining event types
    let remainingUGC = 0;
    let remainingCurated = 0;
    
    finalSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.source === 'ugc' || data.isUGC === true) {
        remainingUGC++;
      } else {
        remainingCurated++;
      }
    });
    
    console.log(`   UGC events: ${remainingUGC}`);
    console.log(`   Curated events: ${remainingCurated}`);

    if (remainingUGC === 0) {
      console.log('\n✅ Database cleanup completed successfully!');
      console.log('🗄️  Only production events from Google Sheets remain');
    } else {
      console.log(`\n⚠️  ${remainingUGC} UGC events still remain`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
deleteUGCTestEvents()
  .then(() => {
    console.log('\n🏁 Cleanup process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });