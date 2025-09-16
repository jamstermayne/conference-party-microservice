/**
 * Test Matchmaking Database Connection
 * Verifies that the matchmaking service can read/write to Firestore
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testFirestoreConnection() {
  console.log('Testing Firestore connection for matchmaking...\n');

  try {
    // Test 1: Write a test company
    console.log('Test 1: Writing test company to Firestore...');
    const testCompany = {
      name: 'Test Company',
      industry: 'Technology',
      goals: ['partnership', 'investment'],
      size: 'medium',
      createdAt: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection('companies').add(testCompany);
    console.log('✅ Successfully wrote company with ID:', docRef.id);

    // Test 2: Read the company back
    console.log('\nTest 2: Reading company from Firestore...');
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('✅ Successfully read company:', doc.data().name);
    } else {
      console.log('❌ Company not found');
    }

    // Test 3: List all companies
    console.log('\nTest 3: Listing all companies...');
    const snapshot = await db.collection('companies').limit(5).get();
    console.log(`✅ Found ${snapshot.size} companies in Firestore`);
    snapshot.forEach(doc => {
      console.log(`  - ${doc.id}: ${doc.data().name || 'Unnamed'}`);
    });

    // Test 4: Clean up test data
    console.log('\nTest 4: Cleaning up test data...');
    await docRef.delete();
    console.log('✅ Test company deleted');

    console.log('\n✅ All Firestore tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Firestore test failed:', error.message);
    return false;
  }
}

// Run the test
testFirestoreConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });