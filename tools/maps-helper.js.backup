#!/usr/bin/env node

/**
 * TOOL #5: MAPS HELPER - Google Maps API Integration (FIXED)
 * 
 * Features:
 * - Google Geocoding API integration with rate limiting
 * - Sequential processing (1-second delays)
 * - Firebase caching with comprehensive structure
 * - Graceful error handling and status reporting
 * - PWA-ready output format
 * - Integration with API data (fixed field names)
 * 
 * Usage:
 * npm run maps:geocode    # Geocode all events
 * npm run maps:status     # Check geocoding status
 * npm run maps:verify     # Verify API key and connection
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'MISSING_API_KEY';
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const FIREBASE_CONFIG = {
    projectId: 'conference-party-app',
    region: 'us-central1'
};

// Firebase Admin SDK (using REST API for simplicity)
const FIREBASE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

class MapsHelper {
    constructor() {
        this.results = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            emptyAddresses: 0,
            errors: []
        };
        this.startTime = Date.now();
    }

    /**
     * Main entry point - check command line arguments
     */
    async run() {
        const command = process.argv[2] || 'help';
        
        console.log('🗺️  TOOL #5: MAPS HELPER');
        console.log('=====================================');
        
        switch (command) {
            case 'geocode':
                await this.geocodeAllEvents();
                break;
            case 'status':
                await this.checkStatus();
                break;
            case 'verify':
                await this.verifyApiConnection();
                break;
            case 'help':
            default:
                this.showHelp();
                break;
        }
    }

    /**
     * Show help information
     */
    showHelp() {
        console.log(`
Usage:
  npm run maps:geocode    # Geocode all events from API
  npm run maps:status     # Check geocoding status in local backup
  npm run maps:verify     # Verify Google Maps API connection
  npm run maps:help       # Show this help

Environment Variables Required:
  GOOGLE_MAPS_API_KEY     # Google Maps Geocoding API key

Examples:
  export GOOGLE_MAPS_API_KEY="your_api_key_here"
  npm run maps:geocode

Files Created:
  tools/data-backups/geocoded-events-{date}.json
  tools/data-backups/geocoding-report-{timestamp}.json
`);
    }

    /**
     * Verify API key and Google Maps connection
     */
    async verifyApiConnection() {
        console.log('🔐 Verifying Google Maps API connection...');
        
        if (API_KEY === 'MISSING_API_KEY') {
            console.error('❌ GOOGLE_MAPS_API_KEY environment variable not set');
            console.log('');
            console.log('Setup instructions:');
            console.log('export GOOGLE_MAPS_API_KEY="your_api_key_here"');
            console.log('# OR create .env file:');
            console.log('echo "GOOGLE_MAPS_API_KEY=your_api_key_here" > .env');
            process.exit(1);
        }

        console.log('✅ API key found in environment');
        
        // Test with a simple geocoding request
        try {
            console.log('🌍 Testing geocoding with sample address...');
            const testResult = await this.geocodeAddress('Cologne, Germany', 'test-event');
            
            if (testResult.success) {
                console.log('✅ Google Maps API connection successful');
                console.log(`   📍 Test result: ${testResult.data.formattedAddress}`);
                console.log(`   🎯 Coordinates: ${testResult.data.lat}, ${testResult.data.lng}`);
            } else {
                console.log('❌ API connection failed:', testResult.error);
            }
        } catch (error) {
            console.error('❌ API verification failed:', error.message);
        }
    }

    /**
     * Main geocoding function - process all events
     */
    async geocodeAllEvents() {
        console.log('🚀 Starting geocoding process...');
        
        // Verify API key first
        if (API_KEY === 'MISSING_API_KEY') {
            console.error('❌ GOOGLE_MAPS_API_KEY environment variable not set');
            console.log('Run: npm run maps:verify for setup instructions');
            process.exit(1);
        }

        // Get events from API
        console.log('📊 Loading event data from API...');
        const events = await this.loadEventsFromApi();
        
        if (!events || events.length === 0) {
            console.error('❌ No events found from API');
            console.log('Run: npm run api:test:parties to verify API connectivity');
            return;
        }

        console.log(`📍 Found ${events.length} events to geocode`);
        this.results.total = events.length;

        // Check which events are already geocoded
        const existingGeocoded = await this.getExistingGeocodedEvents();
        
        // Process each event sequentially with delays
        console.log('⏳ Processing addresses sequentially (1-second delays)...');
        
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const progress = `[${i + 1}/${events.length}]`;
            
            console.log(`\n${progress} Processing: ${event.name}`);
            console.log(`   📍 Address: ${event.address}`);
            
            // Skip if already geocoded
            if (existingGeocoded[event.id]) {
                console.log('   ⏭️  Already geocoded, skipping...');
                this.results.skipped++;
                continue;
            }

            // Skip empty addresses
            if (!event.address || event.address === '(empty)' || event.address.trim() === '') {
                console.log('   ⚠️  Empty address, skipping...');
                this.results.emptyAddresses++;
                await this.saveFailedGeocodingResult(event, 'Empty or missing address');
                continue;
            }

            try {
                // Geocode the address
                const result = await this.geocodeAddress(event.address, event.id);
                
                if (result.success) {
                    // Save to local backup
                    await this.saveGeocodingResult(event, result.data);
                    console.log(`   ✅ Success: ${result.data.formattedAddress}`);
                    console.log(`   📍 Coordinates: ${result.data.lat}, ${result.data.lng}`);
                    this.results.success++;
                } else {
                    console.log(`   ❌ Failed: ${result.error}`);
                    this.results.failed++;
                    this.results.errors.push({
                        eventId: event.id,
                        eventName: event.name,
                        address: event.address,
                        error: result.error
                    });
                    
                    // Save failed attempt to local backup
                    await this.saveFailedGeocodingResult(event, result.error);
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                this.results.failed++;
                this.results.errors.push({
                    eventId: event.id,
                    eventName: event.name,
                    address: event.address,
                    error: error.message
                });
            }

            // Rate limiting: 1-second delay between requests
            if (i < events.length - 1) {
                console.log('   ⏱️  Waiting 1 second...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Generate final report
        await this.generateFinalReport();
    }

    /**
     * Load events from API with correct field names
     */
    async loadEventsFromApi() {
        try {
            console.log('📡 Fetching live event data from API...');
            const allEvents = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
                const pageUrl = `https://us-central1-conference-party-app.cloudfunctions.net/api/parties?page=${page}`;
                const pageData = await this.fetchJsonFromUrl(pageUrl);
                
                if (pageData && pageData.data && pageData.data.length > 0) {
                    allEvents.push(...pageData.data);
                    hasMore = pageData.meta && pageData.meta.hasMore;
                    page++;
                    console.log(`   📄 Loaded page ${page - 1}: ${pageData.data.length} events`);
                } else {
                    hasMore = false;
                }
            }
            
            console.log(`📊 Total events loaded: ${allEvents.length}`);
            
            // Transform to our format with correct field names
            const formatted = allEvents.map(event => ({
                id: event.id || `event-${Date.now()}-${Math.random()}`,
                name: event["Event Name"] || 'Unknown Event',
                address: event["Address"] || '',
                hosts: event["Hosts"] || '',
                category: event["Category"] || '',
                date: event["Date"] || '',
                time: event["Time"] || '',
                originalData: event
            }));
            
            return formatted;
        } catch (error) {
            console.error('Error loading events from API:', error.message);
            return [];
        }
    }

    /**
     * Fetch JSON from URL
     */
    async fetchJsonFromUrl(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (error) {
                        console.log(`JSON parsing failed for ${url}`);
                        resolve(null);
                    }
                });
            }).on('error', (error) => {
                console.log(`HTTP request failed for ${url}:`, error.message);
                resolve(null);
            });
        });
    }

    /**
     * Geocode a single address using Google Maps API
     */
    async geocodeAddress(address, eventId) {
        return new Promise((resolve) => {
            const encodedAddress = encodeURIComponent(address);
            const url = `${GEOCODING_URL}?address=${encodedAddress}&key=${API_KEY}&region=de&language=en`;
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (response.status === 'OK' && response.results && response.results.length > 0) {
                            const result = response.results[0];
                            const location = result.geometry.location;
                            
                            resolve({
                                success: true,
                                data: {
                                    lat: location.lat,
                                    lng: location.lng,
                                    placeId: result.place_id,
                                    formattedAddress: result.formatted_address,
                                    addressComponents: result.address_components,
                                    viewport: result.geometry.viewport,
                                    locationType: result.geometry.location_type
                                }
                            });
                        } else {
                            resolve({
                                success: false,
                                error: `Geocoding failed: ${response.status} - ${response.error_message || 'Unknown error'}`
                            });
                        }
                    } catch (error) {
                        resolve({
                            success: false,
                            error: `JSON parsing error: ${error.message}`
                        });
                    }
                });
            }).on('error', (error) => {
                resolve({
                    success: false,
                    error: `HTTP request error: ${error.message}`
                });
            });
        });
    }

    /**
     * Save successful geocoding result to local backup
     */
    async saveGeocodingResult(event, geocodingData) {
        const doc = {
            fields: {
                eventId: { stringValue: event.id },
                eventName: { stringValue: event.name },
                originalAddress: { stringValue: event.address },
                cleanedAddress: { stringValue: event.address },
                hosts: { stringValue: event.hosts },
                category: { stringValue: event.category },
                date: { stringValue: event.date },
                time: { stringValue: event.time },
                geocoding: {
                    mapValue: {
                        fields: {
                            lat: { doubleValue: geocodingData.lat },
                            lng: { doubleValue: geocodingData.lng },
                            placeId: { stringValue: geocodingData.placeId },
                            formattedAddress: { stringValue: geocodingData.formattedAddress },
                            locationType: { stringValue: geocodingData.locationType || 'UNKNOWN' }
                        }
                    }
                },
                timestamp: { timestampValue: new Date().toISOString() },
                source: { stringValue: 'google-maps-api' },
                status: { stringValue: 'success' }
            }
        };

        await this.saveToLocalBackup(event.id, doc);
    }

    /**
     * Save failed geocoding result to local backup
     */
    async saveFailedGeocodingResult(event, error) {
        const doc = {
            fields: {
                eventId: { stringValue: event.id },
                eventName: { stringValue: event.name },
                originalAddress: { stringValue: event.address },
                hosts: { stringValue: event.hosts || '' },
                category: { stringValue: event.category || '' },
                date: { stringValue: event.date || '' },
                time: { stringValue: event.time || '' },
                timestamp: { timestampValue: new Date().toISOString() },
                source: { stringValue: 'google-maps-api' },
                status: { stringValue: 'failed' },
                error: { stringValue: error }
            }
        };

        await this.saveToLocalBackup(event.id, doc);
    }

    /**
     * Save to local backup file (since we can't directly access Firestore in this environment)
     */
    async saveToLocalBackup(eventId, doc) {
        try {
            const backupDir = path.join(__dirname, 'data-backups');
            await fs.mkdir(backupDir, { recursive: true });
            
            const filename = path.join(backupDir, `geocoded-events-${new Date().toISOString().split('T')[0]}.json`);
            
            let existingData = {};
            try {
                const existing = await fs.readFile(filename, 'utf8');
                existingData = JSON.parse(existing);
            } catch (error) {
                // File doesn't exist yet
                existingData = { 
                    events: {}, 
                    metadata: { 
                        created: new Date().toISOString(),
                        toolVersion: 'maps-helper-v1.0'
                    } 
                };
            }

            existingData.events[eventId] = doc;
            existingData.metadata.updated = new Date().toISOString();
            existingData.metadata.total = Object.keys(existingData.events).length;

            await fs.writeFile(filename, JSON.stringify(existingData, null, 2));
        } catch (error) {
            console.error('Error saving to local backup:', error.message);
        }
    }

    /**
     * Get existing geocoded events (from local backup)
     */
    async getExistingGeocodedEvents() {
        try {
            const backupDir = path.join(__dirname, 'data-backups');
            const filename = path.join(backupDir, `geocoded-events-${new Date().toISOString().split('T')[0]}.json`);
            
            const data = await fs.readFile(filename, 'utf8');
            const parsed = JSON.parse(data);
            
            const existing = {};
            for (const [eventId, doc] of Object.entries(parsed.events || {})) {
                existing[eventId] = doc;
            }
            
            console.log(`📂 Found ${Object.keys(existing).length} previously geocoded events`);
            return existing;
        } catch (error) {
            console.log('📭 No existing geocoding data found for today');
            return {};
        }
    }

    /**
     * Check status of geocoding progress
     */
    async checkStatus() {
        console.log('📊 Checking geocoding status...');
        
        try {
            const backupDir = path.join(__dirname, 'data-backups');
            const filename = path.join(backupDir, `geocoded-events-${new Date().toISOString().split('T')[0]}.json`);
            
            const data = await fs.readFile(filename, 'utf8');
            const parsed = JSON.parse(data);
            
            const events = parsed.events || {};
            const total = Object.keys(events).length;
            const successful = Object.values(events).filter(e => 
                e.fields.status.stringValue === 'success'
            ).length;
            const failed = Object.values(events).filter(e => 
                e.fields.status.stringValue === 'failed'
            ).length;

            console.log(`📈 Geocoding Status Report:`);
            console.log(`   Total processed: ${total}`);
            console.log(`   ✅ Successful: ${successful}`);
            console.log(`   ❌ Failed: ${failed}`);
            console.log(`   📅 Last updated: ${parsed.metadata?.updated || 'Unknown'}`);

            if (failed > 0) {
                console.log('\n❌ Failed Events:');
                Object.values(events)
                    .filter(e => e.fields.status.stringValue === 'failed')
                    .forEach(event => {
                        console.log(`   - ${event.fields.eventName.stringValue}: ${event.fields.error?.stringValue || 'Unknown error'}`);
                    });
            }

            if (successful > 0) {
                console.log('\n✅ Sample Successful Events:');
                Object.values(events)
                    .filter(e => e.fields.status.stringValue === 'success')
                    .slice(0, 3)
                    .forEach(event => {
                        const geocoding = event.fields.geocoding.mapValue.fields;
                        console.log(`   - ${event.fields.eventName.stringValue}: ${geocoding.lat.doubleValue}, ${geocoding.lng.doubleValue}`);
                    });
            }

        } catch (error) {
            console.log('📭 No geocoding data found for today');
            console.log('Run: npm run maps:geocode to start geocoding process');
        }
    }

    /**
     * Generate final report after geocoding
     */
    async generateFinalReport() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        
        console.log('\n🎯 GEOCODING COMPLETE - FINAL REPORT');
        console.log('=====================================');
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log(`📊 Total events: ${this.results.total}`);
        console.log(`✅ Successful: ${this.results.success}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️  Skipped (already geocoded): ${this.results.skipped}`);
        console.log(`📭 Empty addresses: ${this.results.emptyAddresses}`);
        
        const processedCount = this.results.success + this.results.failed;
        if (processedCount > 0) {
            console.log(`📈 Success rate: ${Math.round((this.results.success / processedCount) * 100)}%`);
        }

        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.results.errors.slice(0, 5).forEach((error, i) => {
                console.log(`   ${i + 1}. ${error.eventName}: ${error.error}`);
            });
            if (this.results.errors.length > 5) {
                console.log(`   ... and ${this.results.errors.length - 5} more errors`);
            }
        }

        // Save summary report
        const reportData = {
            timestamp: new Date().toISOString(),
            duration,
            results: this.results,
            summary: {
                total: this.results.total,
                successful: this.results.success,
                failed: this.results.failed,
                skipped: this.results.skipped,
                emptyAddresses: this.results.emptyAddresses,
                successRate: processedCount > 0 ? Math.round((this.results.success / processedCount) * 100) : 0
            }
        };

        const backupDir = path.join(__dirname, 'data-backups');
        await fs.mkdir(backupDir, { recursive: true });
        
        const reportFile = path.join(backupDir, `geocoding-report-${Date.now()}.json`);
        await fs.writeFile(reportFile, JSON.stringify(reportData, null, 2));
        
        console.log(`\n📁 Reports saved:`);
        console.log(`   📄 Geocoded data: tools/data-backups/geocoded-events-${new Date().toISOString().split('T')[0]}.json`);
        console.log(`   📊 Summary report: ${reportFile}`);
        console.log('\n🔧 Next steps:');
        console.log('   1. Run: npm run maps:status (check status anytime)');
        console.log('   2. Geocoded data ready for PWA consumption');
        console.log('   3. Ready to build Tool #6: Calendar Helper');
        
        // Show success if we got good results
        if (this.results.success > 0) {
            console.log(`\n🎉 SUCCESS: ${this.results.success} events geocoded with coordinates!`);
        }
    }
}

// Run the tool
if (require.main === module) {
    const mapsHelper = new MapsHelper();
    mapsHelper.run().catch(error => {
        console.error('❌ Maps Helper failed:', error.message);
        process.exit(1);
    });
}

module.exports = MapsHelper;