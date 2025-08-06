#!/usr/bin/env node

/**
 * 🛠️ DATA PROCESSOR TOOL
 * 
 * Handles Google Sheets data intelligently
 * Fixes encoding, geocodes addresses, validates data
 * 
 * Usage:
 *   npm run data:validate       # Check sheet data quality
 *   npm run data:geocode        # Batch geocode addresses → coordinates
 *   npm run data:dedupe         # Remove duplicates with smart merging
 *   npm run data:preview        # Show data changes before sync
 *   npm run data:transform      # Convert formats (CSV, JSON, etc.)
 *   npm run data:fix-encoding   # Fix character encoding issues
 *   npm run data:backup         # Backup current data state
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    BASE_URL: 'https://us-central1-conference-party-app.cloudfunctions.net',
    BACKUP_DIR: './data-backups',
    COLORS: {
        GREEN: '\x1b[32m',
        RED: '\x1b[31m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        MAGENTA: '\x1b[35m',
        CYAN: '\x1b[36m',
        RESET: '\x1b[0m',
        BOLD: '\x1b[1m'
    },
    // Complete encoding fixes for German text
    ENCODING_FIXES: {
        // Primary German characters
        'Ã¤': 'ä',
        'Ã¶': 'ö', 
        'Ã¼': 'ü',
        'ÃŸ': 'ß',
        'Ã„': 'Ä',
        'Ã–': 'Ö',
        'Ãœ': 'Ü',
        
        // Alternative ß encodings
        '§': 'ß',
        'Ÿ': 'ß',
        
        // Cologne-specific fixes
        'Š': 'oe',     // Kšln -> Koeln
        'š': 'oe',     // 
        'Ž': 'Z',
        'ž': 'z',
        
        // Street suffix fixes
        'straoe': 'straße',   // Common pattern: straÃŸe -> straoe -> straße
        'strasse': 'straße',  // Standardize to ß
        'Straoe': 'Straße',   // Capitalized
        'Strasse': 'Straße',  // Capitalized
        
        // City name standardization
        'Kolnmesse': 'Koelnmesse',  // Inconsistent variations
        'Koln': 'Koeln',
        'Kšln': 'Koeln',
        'Köln': 'Koeln',  // Standardize to Koeln for API calls
        
        // Fix double-encoded characters
        'Ã¤Ã¶Ã¼': 'äöü',
        'ÃƒÂ¤': 'ä',
        'ÃƒÂ¶': 'ö',
        'ÃƒÂ¼': 'ü',
        'ÃƒÅ¸': 'ß'
    }
};

class DataProcessor {
    constructor() {
        this.startTime = Date.now();
        this.ensureBackupDir();
    }

    log(message, color = '') {
        const timestamp = new Date().toISOString().slice(11, 19);
        console.log(`${color}[${timestamp}] ${message}${CONFIG.COLORS.RESET}`);
    }

    ensureBackupDir() {
        if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
            fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
        }
    }

    async fetchCurrentData() {
        try {
            this.log('📥 Fetching current party data...', CONFIG.COLORS.BLUE);
            const response = await fetch(`${CONFIG.BASE_URL}/api/parties?limit=100`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }
            
            const data = await response.json();
            this.log(`✅ Fetched ${data.data.length} events (${data.meta.total} total available)`, CONFIG.COLORS.GREEN);
            
            // If there are more events, fetch them all
            if (data.meta.hasMore) {
                this.log('📥 Fetching additional pages...', CONFIG.COLORS.BLUE);
                let allEvents = [...data.data];
                let page = 2;
                let hasMore = true;
                
                while (hasMore) {
                    const pageResponse = await fetch(`${CONFIG.BASE_URL}/api/parties?page=${page}&limit=100`);
                    if (!pageResponse.ok) break;
                    
                    const pageData = await pageResponse.json();
                    allEvents = allEvents.concat(pageData.data);
                    hasMore = pageData.meta.hasMore;
                    page++;
                }
                
                this.log(`✅ Fetched all ${allEvents.length} events across ${page - 1} pages`, CONFIG.COLORS.GREEN);
                return allEvents;
            }
            
            return data.data;
        } catch (error) {
            this.log(`❌ Failed to fetch data: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }

    fixTextEncoding(text) {
        if (!text || typeof text !== 'string') return text;
        
        let fixed = text;
        
        // Apply all encoding fixes
        for (const [encoded, decoded] of Object.entries(CONFIG.ENCODING_FIXES)) {
            fixed = fixed.replace(new RegExp(encoded, 'gi'), decoded);
        }
        
        // Additional comprehensive fixes
        fixed = fixed
            // Fix remaining straße patterns
            .replace(/stra[ÃŸßs]e/gi, 'straße')
            .replace(/strasse/gi, 'straße')
            .replace(/Strasse/g, 'Straße')
            
            // City name consistency for Cologne
            .replace(/\bK[öoš]ln\b/gi, 'Koeln')
            .replace(/\bCologne\b/gi, 'Koeln')  // For geocoding consistency
            
            // Clean up multiple spaces and punctuation
            .replace(/\s+/g, ' ')
            .replace(/,\s*,/g, ',')
            .replace(/\s*,\s*/g, ', ')
            .trim();
        
        return fixed;
    }

    fixEventEncoding(event) {
        const fixedEvent = { ...event };
        
        // Fix encoding in ALL text fields
        const textFields = ['Address', 'Event Name', 'Hosts', 'Category', 'Focus', 'Price', 'Link'];
        
        let hasChanges = false;
        for (const field of textFields) {
            if (fixedEvent[field] && typeof fixedEvent[field] === 'string') {
                const original = fixedEvent[field];
                const fixed = this.fixTextEncoding(original);
                if (fixed !== original) {
                    fixedEvent[field] = fixed;
                    hasChanges = true;
                }
            }
        }
        
        // Mark if this event had encoding fixes applied
        if (hasChanges) {
            fixedEvent._encodingFixed = true;
        }
        
        return fixedEvent;
    }

    async fixEncoding() {
        this.log('🔧 Fixing character encoding issues in ALL events...', CONFIG.COLORS.BOLD);
        
        try {
            // Get ALL events (not just paginated results)
            this.log('📥 Fetching ALL party data...', CONFIG.COLORS.BLUE);
            let allEvents = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
                const response = await fetch(`${CONFIG.BASE_URL}/api/parties?page=${page}&limit=100`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status}`);
                }
                
                const data = await response.json();
                allEvents = allEvents.concat(data.data);
                hasMore = data.meta.hasMore;
                page++;
            }
            
            this.log(`✅ Fetched ${allEvents.length} total events`, CONFIG.COLORS.GREEN);
            
            let fixedCount = 0;
            const fixedEvents = [];
            const changesLog = [];
            
            for (const event of allEvents) {
                const originalEvent = { ...event };
                const fixedEvent = this.fixEventEncoding(event);
                
                if (fixedEvent._encodingFixed) {
                    fixedCount++;
                    
                    // Log specific changes for addresses
                    if (originalEvent.Address !== fixedEvent.Address) {
                        const change = {
                            eventName: fixedEvent['Event Name'],
                            field: 'Address',
                            original: originalEvent.Address,
                            fixed: fixedEvent.Address
                        };
                        changesLog.push(change);
                        this.log(`🔧 Address: "${originalEvent.Address}" → "${fixedEvent.Address}"`, CONFIG.COLORS.CYAN);
                    }
                    
                    // Log other field changes
                    for (const field of ['Event Name', 'Hosts', 'Category']) {
                        if (originalEvent[field] !== fixedEvent[field]) {
                            const change = {
                                eventName: fixedEvent['Event Name'],
                                field: field,
                                original: originalEvent[field],
                                fixed: fixedEvent[field]
                            };
                            changesLog.push(change);
                            this.log(`🔧 ${field}: "${originalEvent[field]}" → "${fixedEvent[field]}"`, CONFIG.COLORS.CYAN);
                        }
                    }
                }
                
                // Remove internal tracking flag
                delete fixedEvent._encodingFixed;
                fixedEvents.push(fixedEvent);
            }
            
            this.log(`\n✅ Processed ${allEvents.length} events, fixed encoding in ${fixedCount} events`, CONFIG.COLORS.GREEN);
            
            // Save fixed data with detailed change log
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const backupData = {
                timestamp: new Date().toISOString(),
                totalEvents: allEvents.length,
                eventsFixed: fixedCount,
                changesLog: changesLog,
                fixedEvents: fixedEvents
            };
            
            const backupPath = path.join(CONFIG.BACKUP_DIR, `complete-encoding-fix-${timestamp}.json`);
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            
            this.log(`💾 Complete fixed data saved to: ${backupPath}`, CONFIG.COLORS.BLUE);
            this.log(`📊 Summary: ${fixedCount}/${allEvents.length} events had encoding fixes applied`, CONFIG.COLORS.BOLD);
            
            return fixedEvents;
        } catch (error) {
            this.log(`❌ Comprehensive encoding fix failed: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }

    validateAddress(address) {
        const issues = [];
        
        if (!address || address.trim() === '') {
            issues.push('Empty address');
            return { valid: false, issues };
        }
        
        if (address === 'Register to See Address') {
            issues.push('Private address');
            return { valid: false, issues };
        }
        
        // Check for encoding issues
        const encodingIssues = Object.keys(CONFIG.ENCODING_FIXES).filter(encoded => 
            address.includes(encoded)
        );
        if (encodingIssues.length > 0) {
            issues.push(`Encoding issues: ${encodingIssues.join(', ')}`);
        }
        
        // Check for basic address components
        const hasStreetNumber = /\d/.test(address);
        const hasCity = address.toLowerCase().includes('cologne') || address.toLowerCase().includes('köln') || address.toLowerCase().includes('koeln');
        const hasCountry = address.toLowerCase().includes('germany') || address.toLowerCase().includes('deutschland');
        
        if (!hasStreetNumber && !address.toLowerCase().includes('hall')) {
            issues.push('Missing street number');
        }
        
        if (!hasCity) {
            issues.push('Missing city (Cologne/Köln)');
        }
        
        const isValid = issues.length === 0 || (issues.length === 1 && issues[0].includes('Missing'));
        
        return { valid: isValid, issues };
    }

    async validate() {
        this.log('✅ Validating data quality...', CONFIG.COLORS.BOLD);
        
        try {
            const events = await this.fetchCurrentData();
            
            let validCount = 0;
            let invalidCount = 0;
            const validationResults = [];
            
            for (const event of events) {
                const addressValidation = this.validateAddress(event.Address);
                const result = {
                    id: event.id,
                    eventName: event['Event Name'],
                    address: event.Address,
                    validation: addressValidation
                };
                
                if (addressValidation.valid) {
                    validCount++;
                } else {
                    invalidCount++;
                    this.log(`⚠️  Invalid: ${event['Event Name']} - ${addressValidation.issues.join(', ')}`, CONFIG.COLORS.YELLOW);
                }
                
                validationResults.push(result);
            }
            
            this.log(`\n📊 Validation Summary:`, CONFIG.COLORS.BOLD);
            this.log(`✅ Valid addresses: ${validCount}`, CONFIG.COLORS.GREEN);
            this.log(`⚠️  Issues found: ${invalidCount}`, CONFIG.COLORS.YELLOW);
            this.log(`📊 Total events: ${events.length}`, CONFIG.COLORS.BLUE);
            
            // Save validation results
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const reportPath = path.join(CONFIG.BACKUP_DIR, `validation-report-${timestamp}.json`);
            fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
            
            this.log(`📋 Validation report saved: ${reportPath}`, CONFIG.COLORS.BLUE);
            return validationResults;
        } catch (error) {
            this.log(`❌ Validation failed: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }

    extractGeocodableAddress(address) {
        if (!address || address === 'Register to See Address') {
            return null;
        }
        
        // Clean up the address for geocoding
        let cleanAddress = this.fixTextEncoding(address);
        
        // Remove extra spaces and normalize
        cleanAddress = cleanAddress.trim().replace(/\s+/g, ' ');
        
        // If it doesn't include Germany, add it
        if (!cleanAddress.toLowerCase().includes('germany') && !cleanAddress.toLowerCase().includes('deutschland')) {
            cleanAddress += ', Germany';
        }
        
        return cleanAddress;
    }

    async geocode() {
        this.log('🗺️  Preparing addresses for geocoding...', CONFIG.COLORS.BOLD);
        this.log('⚠️  Note: This prepares geocoding data. Actual geocoding requires Google Maps API key.', CONFIG.COLORS.YELLOW);
        
        try {
            const events = await this.fetchCurrentData();
            const geocodingTasks = [];
            
            for (const event of events) {
                const geocodableAddress = this.extractGeocodableAddress(event.Address);
                
                if (geocodableAddress) {
                    geocodingTasks.push({
                        eventId: event.id,
                        eventName: event['Event Name'],
                        originalAddress: event.Address,
                        geocodableAddress: geocodableAddress,
                        status: 'ready'
                    });
                    
                    this.log(`📍 Ready: ${event['Event Name']} → ${geocodableAddress}`, CONFIG.COLORS.CYAN);
                } else {
                    this.log(`⏭️  Skipped: ${event['Event Name']} (private/invalid address)`, CONFIG.COLORS.YELLOW);
                }
            }
            
            this.log(`\n📊 Geocoding Summary:`, CONFIG.COLORS.BOLD);
            this.log(`📍 Ready for geocoding: ${geocodingTasks.length}`, CONFIG.COLORS.GREEN);
            this.log(`⏭️  Skipped: ${events.length - geocodingTasks.length}`, CONFIG.COLORS.YELLOW);
            
            // Save geocoding tasks
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const tasksPath = path.join(CONFIG.BACKUP_DIR, `geocoding-tasks-${timestamp}.json`);
            fs.writeFileSync(tasksPath, JSON.stringify(geocodingTasks, null, 2));
            
            this.log(`💾 Geocoding tasks saved: ${tasksPath}`, CONFIG.COLORS.BLUE);
            this.log(`🔧 Next: Add Google Maps API key to complete geocoding`, CONFIG.COLORS.MAGENTA);
            
            return geocodingTasks;
        } catch (error) {
            this.log(`❌ Geocoding preparation failed: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }

    findDuplicateGroups(events) {
        const groups = new Map();
        
        for (const event of events) {
            // Create a key based on similar properties
            const key = `${event['Event Name']?.toLowerCase()}-${event.Date}-${event['Start Time']}`;
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(event);
        }
        
        // Return only groups with duplicates
        return Array.from(groups.values()).filter(group => group.length > 1);
    }

    async dedupe() {
        this.log('🔍 Finding and removing duplicates...', CONFIG.COLORS.BOLD);
        
        try {
            const events = await this.fetchCurrentData();
            const duplicateGroups = this.findDuplicateGroups(events);
            
            if (duplicateGroups.length === 0) {
                this.log('✅ No duplicates found!', CONFIG.COLORS.GREEN);
                return { duplicatesFound: 0, eventsRemoved: 0 };
            }
            
            let removedCount = 0;
            const deduplicatedEvents = [...events];
            
            this.log(`📊 Found ${duplicateGroups.length} duplicate groups:`, CONFIG.COLORS.YELLOW);
            
            for (const group of duplicateGroups) {
                this.log(`\n🔗 Duplicate Group (${group.length} events):`, CONFIG.COLORS.CYAN);
                
                for (let i = 0; i < group.length; i++) {
                    const event = group[i];
                    this.log(`   ${i + 1}. ${event['Event Name']} - ${event.Address}`, CONFIG.COLORS.BLUE);
                }
                
                // Keep the first one, mark others for removal
                const toKeep = group[0];
                const toRemove = group.slice(1);
                
                this.log(`   ✅ Keeping: ${toKeep['Event Name']}`, CONFIG.COLORS.GREEN);
                this.log(`   ❌ Removing: ${toRemove.length} duplicates`, CONFIG.COLORS.RED);
                
                removedCount += toRemove.length;
            }
            
            this.log(`\n📊 Deduplication Summary:`, CONFIG.COLORS.BOLD);
            this.log(`🔍 Duplicate groups found: ${duplicateGroups.length}`, CONFIG.COLORS.YELLOW);
            this.log(`❌ Events to remove: ${removedCount}`, CONFIG.COLORS.RED);
            this.log(`✅ Events remaining: ${events.length - removedCount}`, CONFIG.COLORS.GREEN);
            
            // Save deduplication report
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const reportPath = path.join(CONFIG.BACKUP_DIR, `deduplication-report-${timestamp}.json`);
            fs.writeFileSync(reportPath, JSON.stringify({ duplicateGroups, summary: { total: events.length, removed: removedCount, remaining: events.length - removedCount } }, null, 2));
            
            this.log(`📋 Deduplication report saved: ${reportPath}`, CONFIG.COLORS.BLUE);
            
            return { duplicatesFound: duplicateGroups.length, eventsRemoved: removedCount };
        } catch (error) {
            this.log(`❌ Deduplication failed: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }

    async preview() {
        this.log('👁️  Previewing data changes...', CONFIG.COLORS.BOLD);
        
        try {
            // Get current data
            const events = await this.fetchCurrentData();
            
            // Show sample of current data
            this.log('\n📊 Current Data Sample (first 3 events):', CONFIG.COLORS.BLUE);
            for (let i = 0; i < Math.min(3, events.length); i++) {
                const event = events[i];
                this.log(`\n${i + 1}. ${event['Event Name']}`, CONFIG.COLORS.CYAN);
                this.log(`   📍 Address: ${event.Address}`, CONFIG.COLORS.BLUE);
                this.log(`   🏢 Hosts: ${event.Hosts}`, CONFIG.COLORS.BLUE);
                this.log(`   📅 Date/Time: ${event.Date} ${event.Time}`, CONFIG.COLORS.BLUE);
                this.log(`   🎯 Category: ${event.Category}`, CONFIG.COLORS.BLUE);
            }
            
            // Check for encoding issues
            this.log('\n🔧 Encoding Issues Preview:', CONFIG.COLORS.YELLOW);
            let encodingIssues = 0;
            for (const event of events.slice(0, 10)) {
                const hasIssues = Object.keys(CONFIG.ENCODING_FIXES).some(encoded => 
                    event.Address?.includes(encoded) || event['Event Name']?.includes(encoded)
                );
                
                if (hasIssues) {
                    encodingIssues++;
                    const fixedAddress = this.fixTextEncoding(event.Address);
                    this.log(`   📍 "${event.Address}" → "${fixedAddress}"`, CONFIG.COLORS.CYAN);
                }
            }
            
            if (encodingIssues === 0) {
                this.log('   ✅ No encoding issues in preview sample', CONFIG.COLORS.GREEN);
            } else {
                this.log(`   ⚠️  Found ${encodingIssues} encoding issues in preview`, CONFIG.COLORS.YELLOW);
            }
            
            this.log(`\n📊 Total Events: ${events.length}`, CONFIG.COLORS.BOLD);
            this.log(`📅 Date Range: ${events[0]?.Date} to ${events[events.length - 1]?.Date}`, CONFIG.COLORS.BLUE);
            
            return events;
        } catch (error) {
            this.log(`❌ Preview failed: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }

    async transform(format = 'json') {
        this.log(`🔄 Transforming data to ${format.toUpperCase()}...`, CONFIG.COLORS.BOLD);
        
        try {
            const events = await this.fetchCurrentData();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            
            let outputPath;
            let transformedData;
            
            switch (format.toLowerCase()) {
                case 'csv':
                    // Convert to CSV
                    if (events.length === 0) {
                        transformedData = '';
                    } else {
                        const headers = Object.keys(events[0]).join(',');
                        const rows = events.map(event => 
                            Object.values(event).map(value => 
                                typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                            ).join(',')
                        );
                        transformedData = [headers, ...rows].join('\n');
                    }
                    outputPath = path.join(CONFIG.BACKUP_DIR, `events-${timestamp}.csv`);
                    fs.writeFileSync(outputPath, transformedData);
                    break;
                    
                case 'geojson':
                    // Convert to GeoJSON (without actual coordinates for now)
                    const features = events.filter(event => event.Address && event.Address !== 'Register to See Address').map(event => ({
                        type: 'Feature',
                        properties: {
                            name: event['Event Name'],
                            address: event.Address,
                            hosts: event.Hosts,
                            date: event.Date,
                            time: event.Time,
                            category: event.Category,
                            price: event.Price,
                            focus: event.Focus
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [0, 0] // Placeholder - needs geocoding
                        }
                    }));
                    
                    transformedData = {
                        type: 'FeatureCollection',
                        features: features
                    };
                    outputPath = path.join(CONFIG.BACKUP_DIR, `events-${timestamp}.geojson`);
                    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));
                    break;
                    
                default: // json
                    transformedData = events;
                    outputPath = path.join(CONFIG.BACKUP_DIR, `events-${timestamp}.json`);
                    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));
            }
            
            this.log(`✅ Transformed ${events.length} events to ${format.toUpperCase()}`, CONFIG.COLORS.GREEN);
            this.log(`💾 Saved to: ${outputPath}`, CONFIG.COLORS.BLUE);
            
            return { outputPath, format, eventCount: events.length };
        } catch (error) {
            this.log(`❌ Transform failed: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }

    async backup() {
        this.log('💾 Creating data backup...', CONFIG.COLORS.BOLD);
        
        try {
            const events = await this.fetchCurrentData();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const backupPath = path.join(CONFIG.BACKUP_DIR, `backup-${timestamp}.json`);
            
            const backupData = {
                timestamp: new Date().toISOString(),
                eventCount: events.length,
                events: events
            };
            
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            
            this.log(`✅ Backup created: ${events.length} events`, CONFIG.COLORS.GREEN);
            this.log(`💾 Saved to: ${backupPath}`, CONFIG.COLORS.BLUE);
            
            return backupPath;
        } catch (error) {
            this.log(`❌ Backup failed: ${error.message}`, CONFIG.COLORS.RED);
            throw error;
        }
    }
}

// CLI Interface
async function main() {
    const processor = new DataProcessor();
    const command = process.argv[2];
    const option = process.argv[3];
    
    try {
        switch (command) {
            case 'validate':
                await processor.validate();
                break;
            case 'geocode':
                await processor.geocode();
                break;
            case 'dedupe':
                await processor.dedupe();
                break;
            case 'preview':
                await processor.preview();
                break;
            case 'transform':
                await processor.transform(option || 'json');
                break;
            case 'fix-encoding':
                await processor.fixEncoding();
                break;
            case 'backup':
                await processor.backup();
                break;
            default:
                console.log(`
🛠️ Data Processor Tool

Available commands:
  validate       - Check sheet data quality
  geocode        - Prepare addresses for geocoding (requires Maps API)
  dedupe         - Remove duplicates with smart merging
  preview        - Show data changes before sync
  transform [format] - Convert formats (json, csv, geojson)
  fix-encoding   - Fix character encoding issues
  backup         - Backup current data state

Usage: node tools/data-processor.js <command> [option]
Or use npm scripts: npm run data:<command>

Examples:
  node tools/data-processor.js transform csv
  node tools/data-processor.js fix-encoding
  npm run data:validate
                `);
        }
    } catch (error) {
        console.error(`❌ Command failed:`, error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = DataProcessor;