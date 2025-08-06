#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'https://us-central1-conference-party-app.cloudfunctions.net';
const BACKUP_DIR = path.join(__dirname, 'data-backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Utility function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Log function with timestamp
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
}

// Fetch all events from API (handles pagination)
async function fetchAllEvents() {
    const events = [];
    let page = 1;
    let totalFetched = 0;
    
    try {
        // First page
        log('📥 Fetching current party data...');
        const response = await makeRequest(`${API_BASE}/api/parties?page=${page}&limit=50`);
        
        if (!response || !response.data) {
            throw new Error('Invalid API response format');
        }
        
        events.push(...response.data);
        totalFetched = response.data.length;
        log(`✅ Fetched ${totalFetched} events (${response.totalEvents || events.length} total available)`);
        
        // Additional pages if needed
        if (response.totalEvents > totalFetched || response.data.length === 50) {
            log('📥 Fetching additional pages...');
            page++;
            
            while (true) {
                const pageResponse = await makeRequest(`${API_BASE}/api/parties?page=${page}&limit=50`);
                
                if (!pageResponse || !pageResponse.data || pageResponse.data.length === 0) {
                    break;
                }
                
                events.push(...pageResponse.data);
                totalFetched += pageResponse.data.length;
                
                if (pageResponse.data.length < 50) {
                    break;
                }
                
                page++;
            }
        }
        
        log(`✅ Fetched all ${totalFetched} events across ${page} pages`);
        return events;
        
    } catch (error) {
        throw new Error(`Failed to fetch events: ${error.message}`);
    }
}

function cleanAddress(address, eventName) {
    if (!address || address === '(empty)' || address === 'Register to See Address' || address === 'n/a') {
        return null;
    }
    
    // Fix encoding issues
    let cleaned = address
        .replace(/Ã¤/g, 'ä')
        .replace(/Ã¶/g, 'ö')
        .replace(/Ã¼/g, 'ü')
        .replace(/ÃŸ/g, 'ß')
        .replace(/â€™/g, "'")
        .replace(/â€˜/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€�/g, '"')
        .replace(/â€"/g, '—')  // ✅ FIXED: em dash instead of hyphen
        .replace(/Kšlnmesse/g, 'Koelnmesse')
        .replace(/Kšln/g, 'Koeln')
        .replace(/HerbrandstraÃŸe/g, 'Herbrandstraße')
        .replace(/straÃŸe/g, 'straße')
        .replace(/straue/g, 'straße')
        .replace(/straBe/g, 'straße')
        
        // SPECIFIC FIX: Pete's apostrophe corruption  
        .replace(/Pet's/g, "Pete's")
        .replace(/Pet'/g, "Pete'")
        
        .trim();
    
    // Ensure Germany is included for geocoding
    if (!cleaned.toLowerCase().includes('germany') && !cleaned.toLowerCase().includes('deutschland')) {
        cleaned += ', Germany';
    }
    
    return cleaned;
}

// Check if address is geocodable (has enough information)
function isGeocodable(address) {
    if (!address) return false;
    
    // Must have at least a street name or venue name
    const hasStreetInfo = address.match(/\d+/) || // has numbers (likely street number)
                         address.includes('straße') || address.includes('strasse') || 
                         address.includes('str.') || address.includes('platz') ||
                         address.includes('ring') || address.includes('weg');
    
    const hasVenueInfo = address.match(/[A-Z][a-z]+/) && // has proper names
                        address.length > 10; // reasonable length
    
    return hasStreetInfo || hasVenueInfo;
}

// Validate URL format
function validateUrl(url) {
    if (!url) return { valid: false, reason: 'empty' };
    
    try {
        // Basic URL validation
        if (!url.includes('http')) {
            return { valid: false, reason: 'no-protocol' };
        }
        
        new URL(url);
        return { valid: true };
    } catch (error) {
        return { valid: false, reason: 'invalid-format' };
    }
}

// Main geocoding preparation function
async function prepareGeocoding() {
    log('🗺️  Preparing addresses for geocoding...');
    log('⚠️  Note: This prepares geocoding data. Actual geocoding requires Google Maps API key.');
    
    try {
        const events = await fetchAllEvents();
        const geocodingTasks = [];
        let readyCount = 0;
        let skippedCount = 0;
        
        events.forEach((event, index) => {
            const eventName = event['Event Name'] || event.name || `Event ${index + 1}`;
            const rawAddress = event.Address || event.address || event.location;
            
            // Clean the address
            const cleanedAddress = cleanAddress(rawAddress, eventName);
            
            if (cleanedAddress && isGeocodable(cleanedAddress)) {
                log(`📍 Ready: ${eventName} → ${cleanedAddress}`);
                geocodingTasks.push({
                    eventName,
                    originalAddress: rawAddress,
                    cleanedAddress: cleanedAddress,
                    eventData: event
                });
                readyCount++;
            } else {
                log(`⏭️  Skipped: ${eventName} (private/invalid address)`);
                skippedCount++;
            }
        });
        
        // Save geocoding tasks
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(BACKUP_DIR, `geocoding-tasks-${timestamp.split('T')[0]}.json`);
        
        fs.writeFileSync(outputPath, JSON.stringify({
            generatedAt: new Date().toISOString(),
            totalEvents: events.length,
            readyForGeocoding: readyCount,
            skipped: skippedCount,
            tasks: geocodingTasks
        }, null, 2));
        
        console.log('\n📊 Geocoding Summary:');
        log(`📍 Ready for geocoding: ${readyCount}`);
        log(`⏭️  Skipped: ${skippedCount}`);
        log(`💾 Geocoding tasks saved: ${outputPath}`);
        log('🔧 Next: Add Google Maps API key to complete geocoding');
        
    } catch (error) {
        log(`❌ Geocoding preparation failed: ${error.message}`);
    }
}

// Text encoding fixes - ENHANCED for Pete's issue
function fixTextEncoding(text) {
    if (!text) return text;
    
    return text
        // Fix German characters
        .replace(/Ã¤/g, 'ä')
        .replace(/Ã¶/g, 'ö')
        .replace(/Ã¼/g, 'ü')
        .replace(/ÃŸ/g, 'ß')
        .replace(/Kšlnmesse/g, 'Koelnmesse')
        .replace(/Kšln/g, 'Köln')
        .replace(/HerbrandstraÃŸe/g, 'Herbrandstraße')
        
        // Fix smart quotes and apostrophes
        .replace(/â€™/g, "'")
        .replace(/â€˜/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€�/g, '"')
        .replace(/â€"/g, '—')  // ✅ FIXED: em dash instead of hyphen
        
        // SPECIFIC FIX: Pete's apostrophe corruption
        .replace(/Pet's/g, "Pete's")
        .replace(/Pet'/g, "Pete'")
        
        // Fix other common apostrophe corruptions
        .replace(/don't/g, "don't")
        .replace(/can't/g, "can't")
        .replace(/won't/g, "won't")
        
        .trim();
}

// URL fixes
function fixUrlEncoding(url) {
    if (!url) return url;
    
    return url
        .replace(/%20/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
}

// Preview event data quality
async function previewData() {
    console.log('🔍 PREVIEW: Event Data Analysis');
    console.log('='.repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        let encodingIssues = 0;
        let urlIssues = 0;
        let geocodableAddresses = 0;
        let emptyAddresses = 0;
        let registerAddresses = 0;
        
        events.forEach(event => {
            const textFields = [event['Event Name'], event.Hosts, event.Address].join(' ');
            if (textFields.includes('Ã') || textFields.includes('š') || textFields.includes('â€')) {
                encodingIssues++;
            }
            
            if (event.Link && (event.Link.includes('%20') || event.Link.includes('&amp;'))) {
                urlIssues++;
            }
            
            const cleanedAddress = cleanAddress(event.Address);
            if (!event.Address || event.Address === '(empty)') {
                emptyAddresses++;
            } else if (event.Address === 'Register to See Address') {
                registerAddresses++;
            } else if (cleanedAddress && isGeocodable(cleanedAddress)) {
                geocodableAddresses++;
            }
        });
        
        console.log(`📊 Total Events: ${events.length}`);
        console.log(`🧹 Text encoding issues: ${encodingIssues}/${events.length}`);
        console.log(`🔗 URL encoding issues: ${urlIssues}/${events.length}`);
        console.log(`🗺️  Geocodable addresses: ${geocodableAddresses}/${events.length} (${Math.round(geocodableAddresses/events.length*100)}%)`);
        console.log(`⚪ Empty addresses: ${emptyAddresses}/${events.length}`);
        console.log(`🔒 Registration required: ${registerAddresses}/${events.length}`);
        
    } catch (error) {
        console.error('❌ Preview failed:', error.message);
    }
}

// Validate URLs
async function validateUrls() {
    console.log('🔍 VALIDATE: URL Quality Analysis');
    console.log('='.repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        let valid = 0;
        let invalid = 0;
        let empty = 0;
        const issues = [];
        
        events.forEach((event, index) => {
            const url = event.Link || event.url;
            const eventName = event['Event Name'] || event.name || `Event ${index + 1}`;
            
            if (!url) {
                empty++;
                return;
            }
            
            const validation = validateUrl(url);
            if (validation.valid) {
                valid++;
            } else {
                invalid++;
                issues.push({
                    event: eventName,
                    url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
                    issue: validation.reason
                });
            }
        });
        
        console.log(`📊 URL Validation Results:`);
        console.log(`✅ Valid URLs: ${valid}`);
        console.log(`❌ Invalid URLs: ${invalid}`);
        console.log(`⚪ Empty URLs: ${empty}`);
        
        if (issues.length > 0) {
            console.log('\n🔍 Sample Issues:');
            issues.slice(0, 5).forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.event}`);
                console.log(`   Issue: ${issue.issue}`);
                console.log(`   URL: ${issue.url}\n`);
            });
            
            if (issues.length > 5) {
                console.log(`... and ${issues.length - 5} more issues`);
            }
        }
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

// Apply encoding fixes
async function fixEncoding() {
    console.log('🧹 FIXING: Encoding Issues');
    console.log('='.repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `events-backup-${timestamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(events, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);
        
        let textFixed = 0;
        let urlFixed = 0;
        const changes = [];
        
        events.forEach((event, index) => {
            ['Event Name', 'Address', 'Hosts'].forEach(field => {
                if (event[field]) {
                    const fixed = fixTextEncoding(event[field]);
                    if (fixed !== event[field]) {
                        changes.push({
                            index: index + 1,
                            field,
                            before: event[field],
                            after: fixed
                        });
                        textFixed++;
                    }
                }
            });
            
            if (event.Link) {
                const fixed = fixUrlEncoding(event.Link);
                if (fixed !== event.Link) {
                    changes.push({
                        index: index + 1,
                        field: 'Link',
                        before: event.Link,
                        after: fixed
                    });
                    urlFixed++;
                }
            }
        });
        
        console.log(`✅ Text encoding fixes applied: ${textFixed}`);
        console.log(`✅ URL encoding fixes applied: ${urlFixed}`);
        
        if (changes.length > 0) {
            console.log('\n🔧 Sample Fixes:');
            changes.slice(0, 3).forEach(change => {
                console.log(`${change.index}. ${change.field}:`);
                console.log(`   Before: ${change.before}`);
                console.log(`   After:  ${change.after}\n`);
            });
            
            if (changes.length > 3) {
                console.log(`... and ${changes.length - 3} more fixes`);
            }
        }
        
        const changeLogPath = path.join(BACKUP_DIR, `encoding-fixes-${timestamp}.json`);
        fs.writeFileSync(changeLogPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalEvents: events.length,
            textFixed,
            urlFixed,
            changes
        }, null, 2));
        
        console.log(`📋 Change log saved: ${changeLogPath}`);
        console.log('⚠️  NOTE: This is a simulation. To apply to Firebase, update the source data.');
        
    } catch (error) {
        console.error('❌ Encoding fix failed:', error.message);
    }
}

// CLI interface
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'preview':
            await previewData();
            break;
        case 'validate':
            await validateUrls();
            break;
        case 'geocode':
            await prepareGeocoding();
            break;
        case 'fix-encoding':
            await fixEncoding();
            break;
        default:
            console.log('🛠️  Data Processor - Gamescom 2025 Party Discovery App');
            console.log('Usage:');
            console.log('  npm run data:preview      # Analyze event data');
            console.log('  npm run data:validate     # Check URL quality');
            console.log('  npm run data:geocode      # Prepare addresses for geocoding');
            console.log('  npm run data:fix-encoding # Apply encoding fixes');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { fetchAllEvents, cleanAddress, fixTextEncoding, validateUrl, isGeocodable };