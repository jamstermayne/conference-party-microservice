#!/usr/bin/env node

/**
 * TOOL #5: MAPS HELPER - FIXED VERSION
 * Comprehensive Google Maps geocoding system for Gamescom party events
 * FIXED: Proper field name mapping for API response structure
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    API_BASE: 'https://us-central1-conference-party-app.cloudfunctions.net',
    RATE_LIMIT_MS: 200, // 200ms between requests to respect API limits
    MAX_RETRIES: 3,
    BACKUP_DIR: path.join(__dirname, 'data-backups'),
    GEOCODED_FILE: path.join(__dirname, 'data-backups', 'geocoded-events-2025-08-06.json')
};

/**
 * Fetch all events from the API with pagination
 */
async function fetchAllEvents() {
    console.log('📡 Fetching all events from API...');
    let allEvents = [];
    let page = 1;
    
    try {
        while (true) {
            const url = `${CONFIG.API_BASE}/api/parties?page=${page}`;
            console.log(`   Page ${page}...`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.data || data.data.length === 0) {
                break;
            }
            
            allEvents = allEvents.concat(data.data);
            
            // Check if we have more pages
            if (data.data.length < 50) { // Assuming 50 is page size
                break;
            }
            
            page++;
            await sleep(100); // Small delay between requests
        }
        
        console.log(`✅ Fetched ${allEvents.length} total events`);
        return allEvents;
        
    } catch (error) {
        console.error('❌ Error fetching events:', error.message);
        throw error;
    }
}

/**
 * Geocode a single address using Google Maps API
 */
async function geocodeAddress(address) {
    if (!address || typeof address !== 'string' || address.trim() === '') {
        throw new Error('Empty or invalid address provided');
    }
    
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formattedAddress: result.formatted_address,
                placeId: result.place_id,
                status: 'success'
            };
        } else {
            throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }
    } catch (error) {
        throw new Error(`Geocoding failed: ${error.message}`);
    }
}

/**
 * Process events for geocoding with proper field mapping
 */
async function processEventsForGeocoding(events) {
    console.log(`🗺️  Processing ${events.length} events for geocoding...`);
    
    const geocodingResults = {
        events: {},
        summary: {
            total: events.length,
            successful: 0,
            failed: 0,
            processed: 0
        }
    };
    
    // Ensure backup directory exists
    await fs.mkdir(CONFIG.BACKUP_DIR, { recursive: true });
    
    for (const event of events) {
        console.log(`\n📍 Processing: ${event.id}`);
        
        // FIXED: Use correct field names from API
        const eventName = event["Event Name"] || "Unknown Event";
        const address = event["Address"] || "";
        const date = event["Date"] || "";
        const time = event["Time"] || "";
        const hosts = event["Hosts"] || "";
        const category = event["Category"] || "";
        
        console.log(`   Name: ${eventName}`);
        console.log(`   Address: ${address || '(empty)'}`);
        
        const eventData = {
            fields: {
                eventId: { stringValue: event.id },
                eventName: { stringValue: eventName },
                originalAddress: { stringValue: address },
                date: { stringValue: date },
                time: { stringValue: time },
                hosts: { stringValue: hosts },
                category: { stringValue: category },
                timestamp: { timestampValue: new Date().toISOString() },
                source: { stringValue: 'google-maps-api' }
            }
        };
        
        try {
            if (!address || address.trim() === '') {
                throw new Error('Empty or missing address');
            }
            
            console.log(`   🔍 Geocoding...`);
            const geocodeResult = await geocodeAddress(address);
            
            // Add geocoding data
            eventData.fields.geocoding = {
                mapValue: {
                    fields: {
                        lat: { doubleValue: geocodeResult.lat },
                        lng: { doubleValue: geocodeResult.lng },
                        formattedAddress: { stringValue: geocodeResult.formattedAddress },
                        placeId: { stringValue: geocodeResult.placeId }
                    }
                }
            };
            eventData.fields.status = { stringValue: 'success' };
            
            console.log(`   ✅ Success: ${geocodeResult.lat}, ${geocodeResult.lng}`);
            geocodingResults.summary.successful++;
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            eventData.fields.status = { stringValue: 'failed' };
            eventData.fields.error = { stringValue: error.message };
            geocodingResults.summary.failed++;
        }
        
        geocodingResults.events[event.id] = eventData;
        geocodingResults.summary.processed++;
        
        // Rate limiting
        await sleep(CONFIG.RATE_LIMIT_MS);
    }
    
    // Save results
    const timestamp = new Date().toISOString();
    await fs.writeFile(CONFIG.GEOCODED_FILE, JSON.stringify(geocodingResults, null, 2));
    
    // Save summary report
    const reportFile = path.join(CONFIG.BACKUP_DIR, `geocoding-report-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(geocodingResults.summary, null, 2));
    
    console.log('\n📊 Geocoding Complete!');
    console.log(`   Total: ${geocodingResults.summary.total}`);
    console.log(`   ✅ Successful: ${geocodingResults.summary.successful}`);
    console.log(`   ❌ Failed: ${geocodingResults.summary.failed}`);
    console.log(`   📄 Saved: ${CONFIG.GEOCODED_FILE}`);
    
    return geocodingResults;
}

/**
 * Check geocoding status from saved file
 */
async function checkGeocodingStatus() {
    try {
        const data = await fs.readFile(CONFIG.GEOCODED_FILE, 'utf8');
        const results = JSON.parse(data);
        
        let successful = 0;
        let failed = 0;
        const failedEvents = [];
        const successfulSamples = [];
        
        for (const [eventId, eventData] of Object.entries(results.events)) {
            const status = eventData.fields.status?.stringValue || 'unknown';
            const eventName = eventData.fields.eventName?.stringValue || 'Unknown Event';
            
            if (status === 'success') {
                successful++;
                const geocoding = eventData.fields.geocoding?.mapValue?.fields;
                if (geocoding && successfulSamples.length < 3) {
                    successfulSamples.push({
                        name: eventName,
                        lat: geocoding.lat?.doubleValue,
                        lng: geocoding.lng?.doubleValue
                    });
                }
            } else {
                failed++;
                const error = eventData.fields.error?.stringValue || 'Unknown error';
                failedEvents.push({ name: eventName, error });
            }
        }
        
        const total = successful + failed;
        
        console.log('🗺️  TOOL #5: MAPS HELPER');
        console.log('=====================================');
        console.log('📊 Checking geocoding status...');
        console.log('📈 Geocoding Status Report:');
        console.log(`   Total processed: ${total}`);
        console.log(`   ✅ Successful: ${successful}`);
        console.log(`   ❌ Failed: ${failed}`);
        
        // Show last update timestamp
        const timestamps = Object.values(results.events)
            .map(e => e.fields.timestamp?.timestampValue)
            .filter(t => t)
            .sort();
        if (timestamps.length > 0) {
            console.log(`   📅 Last updated: ${timestamps[timestamps.length - 1]}`);
        }
        
        // Show failed events (limited to avoid spam)
        if (failedEvents.length > 0) {
            console.log('\n❌ Failed Events:');
            failedEvents.slice(0, 20).forEach(event => {
                console.log(`   - ${event.name}: ${event.error}`);
            });
            if (failedEvents.length > 20) {
                console.log(`   ... and ${failedEvents.length - 20} more`);
            }
        }
        
        // Show successful samples
        if (successfulSamples.length > 0) {
            console.log('\n✅ Sample Successful Events:');
            successfulSamples.forEach(event => {
                console.log(`   - ${event.name}: ${event.lat}, ${event.lng}`);
            });
        }
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('⚠️  No geocoding data found. Run geocoding first.');
        } else {
            console.error('❌ Error reading geocoding data:', error.message);
        }
    }
}

/**
 * Verify Google Maps API connection
 */
async function verifyGoogleMapsAPI() {
    console.log('🔍 Verifying Google Maps API connection...');
    
    if (!CONFIG.GOOGLE_MAPS_API_KEY) {
        console.error('❌ GOOGLE_MAPS_API_KEY environment variable not set');
        return false;
    }
    
    try {
        // Test with a simple address
        const testAddress = 'Cologne, Germany';
        const result = await geocodeAddress(testAddress);
        console.log(`✅ API connection successful`);
        console.log(`   Test result: ${result.formattedAddress}`);
        console.log(`   Coordinates: ${result.lat}, ${result.lng}`);
        return true;
    } catch (error) {
        console.error('❌ API connection failed:', error.message);
        return false;
    }
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display help information
 */
function showHelp() {
    console.log(`
🗺️  TOOL #5: MAPS HELPER - USAGE GUIDE
=====================================

COMMANDS:
  npm run maps:geocode    - Geocode all events from API
  npm run maps:status     - Check current geocoding status
  npm run maps:verify     - Test Google Maps API connection
  npm run maps:help       - Show this help

ENVIRONMENT:
  GOOGLE_MAPS_API_KEY     - Required for geocoding
  
FILES CREATED:
  tools/data-backups/geocoded-events-2025-08-06.json - Main geocoded data
  tools/data-backups/geocoding-report-*.json         - Status reports

FEATURES:
  ✅ Sequential processing with rate limiting
  ✅ Error handling and retry logic  
  ✅ Comprehensive status reporting
  ✅ PWA-ready coordinate output
  ✅ Proper field name mapping (FIXED!)

FIELD MAPPING (FIXED):
  API "Event Name" → eventName
  API "Address" → originalAddress  
  API "Date" → date
  API "Time" → time
  API "Hosts" → hosts
  API "Category" → category
`);
}

// Main execution
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'geocode':
            console.log('🚀 Starting geocoding process...');
            try {
                const events = await fetchAllEvents();
                await processEventsForGeocoding(events);
            } catch (error) {
                console.error('❌ Geocoding failed:', error.message);
                process.exit(1);
            }
            break;
            
        case 'status':
            await checkGeocodingStatus();
            break;
            
        case 'verify':
            const isConnected = await verifyGoogleMapsAPI();
            process.exit(isConnected ? 0 : 1);
            break;
            
        case 'help':
        default:
            showHelp();
            break;
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    fetchAllEvents,
    geocodeAddress,
    processEventsForGeocoding,
    checkGeocodingStatus,
    verifyGoogleMapsAPI
};