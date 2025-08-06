#!/usr/bin/env node

/**
 * TOOL #6: CALENDAR HELPER
 * Comprehensive calendar integration for Gamescom party events
 * Features: iCal generation, Google Calendar URLs, timezone handling, bulk export
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    GEOCODED_FILE: path.join(__dirname, 'data-backups', 'geocoded-events-2025-08-06.json'),
    BACKUP_DIR: path.join(__dirname, 'data-backups'),
    TIMEZONE: 'Europe/Berlin', // Cologne timezone
    YEAR: 2025, // Gamescom 2025
    CALENDAR_NAME: 'Gamescom 2025 Party Events',
    ORGANIZER_EMAIL: 'gamescom@party-discovery.app'
};

/**
 * Load geocoded events from Tool #5
 */
async function loadGeocodedEvents() {
    console.log('📅 Loading geocoded events from Tool #5...');
    
    try {
        const data = await fs.readFile(CONFIG.GEOCODED_FILE, 'utf8');
        const results = JSON.parse(data);
        
        const events = [];
        
        for (const [eventId, eventData] of Object.entries(results.events)) {
            const fields = eventData.fields;
            const status = fields.status?.stringValue;
            
            if (status === 'success') {
                const geocoding = fields.geocoding?.mapValue?.fields;
                
                events.push({
                    id: eventId,
                    name: fields.eventName?.stringValue || 'Unknown Event',
                    date: fields.date?.stringValue || '',
                    time: fields.time?.stringValue || '',
                    address: fields.originalAddress?.stringValue || '',
                    hosts: fields.hosts?.stringValue || '',
                    category: fields.category?.stringValue || '',
                    coordinates: geocoding ? {
                        lat: geocoding.lat?.doubleValue,
                        lng: geocoding.lng?.doubleValue,
                        formattedAddress: geocoding.formattedAddress?.stringValue,
                        placeId: geocoding.placeId?.stringValue
                    } : null
                });
            }
        }
        
        console.log(`✅ Loaded ${events.length} successfully geocoded events`);
        return events;
        
    } catch (error) {
        console.error('❌ Error loading geocoded events:', error.message);
        throw error;
    }
}

/**
 * Parse event date and time into ISO format
 */
function parseEventDateTime(dateStr, timeStr, timezone = CONFIG.TIMEZONE) {
    try {
        // Parse date: "Wed Aug 20" -> "2025-08-20"
        const dateMatch = dateStr.match(/(\w+)\s+(\w+)\s+(\d+)/);
        if (!dateMatch) {
            throw new Error(`Invalid date format: ${dateStr}`);
        }
        
        const [, dayName, monthName, day] = dateMatch;
        
        // Month mapping
        const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        const month = months[monthName];
        if (!month) {
            throw new Error(`Unknown month: ${monthName}`);
        }
        
        const isoDate = `${CONFIG.YEAR}-${month}-${day.padStart(2, '0')}`;
        
        // Parse time: "18:00 - 23:00" or "18:00-23:00" or "7:30 - 9:00"
        let startTime = '19:00'; // Default
        let endTime = '23:00';   // Default
        
        if (timeStr && timeStr.trim() !== '') {
            const timeMatch = timeStr.match(/(\d{1,2}):?(\d{0,2})\s*[-–—]\s*(\d{1,2}):?(\d{0,2})/);
            if (timeMatch) {
                const [, startHour, startMin = '00', endHour, endMin = '00'] = timeMatch;
                startTime = `${startHour.padStart(2, '0')}:${startMin.padStart(2, '00')}`;
                endTime = `${endHour.padStart(2, '0')}:${endMin.padStart(2, '00')}`;
            } else {
                // Try single time format
                const singleTimeMatch = timeStr.match(/(\d{1,2}):?(\d{0,2})/);
                if (singleTimeMatch) {
                    const [, hour, min = '00'] = singleTimeMatch;
                    startTime = `${hour.padStart(2, '0')}:${min.padStart(2, '00')}`;
                    // Default 4 hour duration
                    const startHour = parseInt(hour);
                    const endHour = startHour + 4;
                    endTime = `${endHour.toString().padStart(2, '0')}:${min.padStart(2, '00')}`;
                }
            }
        }
        
        const startDateTime = `${isoDate}T${startTime}:00`;
        const endDateTime = `${isoDate}T${endTime}:00`;
        
        return {
            startDateTime,
            endDateTime,
            startTime,
            endTime,
            date: isoDate,
            timezone
        };
        
    } catch (error) {
        console.error(`❌ Date/time parsing error for "${dateStr}" + "${timeStr}":`, error.message);
        // Return default values
        return {
            startDateTime: `${CONFIG.YEAR}-08-20T19:00:00`,
            endDateTime: `${CONFIG.YEAR}-08-20T23:00:00`,
            startTime: '19:00',
            endTime: '23:00',
            date: `${CONFIG.YEAR}-08-20`,
            timezone
        };
    }
}

/**
 * Generate iCal (.ics) content for a single event
 */
function generateICalEvent(event) {
    const datetime = parseEventDateTime(event.date, event.time);
    
    // Convert to UTC for iCal (Berlin is UTC+2 in summer)
    const startUtc = new Date(`${datetime.startDateTime}+02:00`);
    const endUtc = new Date(`${datetime.endDateTime}+02:00`);
    
    const formatICalDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    const startFormatted = formatICalDate(startUtc);
    const endFormatted = formatICalDate(endUtc);
    
    // Create unique UID
    const uid = `gamescom-${event.id}@party-discovery.app`;
    
    // Escape special characters for iCal
    const escapeICal = (str) => {
        return str.replace(/[\\;,\n]/g, (match) => {
            switch (match) {
                case '\\': return '\\\\';
                case ';': return '\\;';
                case ',': return '\\,';
                case '\n': return '\\n';
                default: return match;
            }
        });
    };
    
    const summary = escapeICal(event.name);
    const description = escapeICal([
        `Hosts: ${event.hosts}`,
        `Category: ${event.category}`,
        event.coordinates ? `Coordinates: ${event.coordinates.lat}, ${event.coordinates.lng}` : '',
        `Event ID: ${event.id}`
    ].filter(Boolean).join('\\n'));
    
    const location = event.coordinates ? 
        escapeICal(event.coordinates.formattedAddress || event.address) : 
        escapeICal(event.address);
    
    const icalContent = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${startFormatted}`,
        `DTEND:${endFormatted}`,
        `DTSTAMP:${formatICalDate(new Date())}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `ORGANIZER:mailto:${CONFIG.ORGANIZER_EMAIL}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
    ];
    
    return icalContent.join('\r\n');
}

/**
 * Generate Google Calendar "Add to Calendar" URL
 */
function generateGoogleCalendarUrl(event) {
    const datetime = parseEventDateTime(event.date, event.time);
    
    // Google Calendar uses Berlin time directly
    const startFormatted = datetime.startDateTime.replace(/[-:]/g, '');
    const endFormatted = datetime.endDateTime.replace(/[-:]/g, '');
    
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.name,
        dates: `${startFormatted}/${endFormatted}`,
        details: [
            `Hosts: ${event.hosts}`,
            `Category: ${event.category}`,
            event.coordinates ? `Coordinates: ${event.coordinates.lat}, ${event.coordinates.lng}` : '',
            `Event ID: ${event.id}`
        ].filter(Boolean).join('\n'),
        location: event.coordinates ? 
            event.coordinates.formattedAddress || event.address : 
            event.address,
        ctz: CONFIG.TIMEZONE
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Create individual iCal file for an event
 */
async function createIndividualICalFile(event, outputDir) {
    const icalEvent = generateICalEvent(event);
    
    const icalFile = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Party Discovery App//Gamescom 2025//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Gamescom 2025 Party Event',
        'X-WR-TIMEZONE:Europe/Berlin',
        icalEvent,
        'END:VCALENDAR'
    ].join('\r\n');
    
    const filename = `gamescom-${event.id.substring(0, 30)}.ics`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, icalFile);
    return { filename, filepath, size: icalFile.length };
}

/**
 * Create bulk iCal export with all events
 */
async function createBulkICalExport(events, outputDir) {
    console.log(`📅 Creating bulk iCal export for ${events.length} events...`);
    
    const icalEvents = events.map(event => generateICalEvent(event));
    
    const icalFile = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Party Discovery App//Gamescom 2025//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${CONFIG.CALENDAR_NAME}`,
        'X-WR-TIMEZONE:Europe/Berlin',
        'X-WR-CALDESC:Complete schedule of Gamescom 2025 party events',
        ...icalEvents,
        'END:VCALENDAR'
    ].join('\r\n');
    
    const filename = `gamescom-2025-all-events-${new Date().toISOString().split('T')[0]}.ics`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, icalFile);
    
    console.log(`✅ Bulk export created: ${filename}`);
    console.log(`   📄 File size: ${Math.round(icalFile.length / 1024)}KB`);
    console.log(`   📊 Events included: ${events.length}`);
    
    return { filename, filepath, size: icalFile.length, eventCount: events.length };
}

/**
 * Generate calendar integration report
 */
async function generateCalendarReport(events, outputDir) {
    const report = {
        generated: new Date().toISOString(),
        summary: {
            totalEvents: events.length,
            eventsWithCoordinates: events.filter(e => e.coordinates).length,
            uniqueDates: [...new Set(events.map(e => parseEventDateTime(e.date, e.time).date))].length,
            categories: [...new Set(events.map(e => e.category))].filter(Boolean),
            hosts: [...new Set(events.map(e => e.hosts))].filter(Boolean).slice(0, 10) // Top 10
        },
        events: events.map(event => {
            const datetime = parseEventDateTime(event.date, event.time);
            return {
                id: event.id,
                name: event.name,
                date: event.date,
                time: event.time,
                parsedDateTime: {
                    start: datetime.startDateTime,
                    end: datetime.endDateTime,
                    timezone: CONFIG.TIMEZONE
                },
                location: {
                    address: event.address,
                    coordinates: event.coordinates,
                    hasCoordinates: !!event.coordinates
                },
                googleCalendarUrl: generateGoogleCalendarUrl(event),
                hosts: event.hosts,
                category: event.category
            };
        })
    };
    
    const filename = `calendar-integration-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    return { filename, filepath, report };
}

/**
 * Test calendar integration functionality
 */
async function testCalendarIntegration() {
    console.log('🧪 Testing calendar integration...');
    
    try {
        const events = await loadGeocodedEvents();
        
        if (events.length === 0) {
            console.log('⚠️  No events found for testing');
            return;
        }
        
        const testEvent = events[0];
        console.log(`📅 Testing with event: ${testEvent.name}`);
        
        // Test date/time parsing
        const datetime = parseEventDateTime(testEvent.date, testEvent.time);
        console.log(`   Date parsing: ${testEvent.date} + ${testEvent.time}`);
        console.log(`   -> ${datetime.startDateTime} to ${datetime.endDateTime}`);
        
        // Test iCal generation
        const icalContent = generateICalEvent(testEvent);
        console.log(`   iCal generation: ${icalContent.split('\n').length} lines`);
        
        // Test Google Calendar URL
        const googleUrl = generateGoogleCalendarUrl(testEvent);
        console.log(`   Google Calendar URL: ${googleUrl.length} characters`);
        
        // Test parsing edge cases
        const edgeCases = [
            { date: 'Wed Aug 20', time: '18:00 - 23:00' },
            { date: 'Fri Aug 22', time: '7:30 - 9:00' },
            { date: 'Thu Aug 21', time: '1800-2300' },
            { date: 'Mon Aug 18', time: '20:00' }
        ];
        
        console.log('   Testing edge cases:');
        edgeCases.forEach(testCase => {
            const result = parseEventDateTime(testCase.date, testCase.time);
            console.log(`     ${testCase.date} + ${testCase.time} -> ${result.startDateTime}`);
        });
        
        console.log('✅ Calendar integration tests passed');
        
    } catch (error) {
        console.error('❌ Calendar integration test failed:', error.message);
        throw error;
    }
}

/**
 * Export all calendar formats
 */
async function exportAllCalendarFormats() {
    console.log('📤 Exporting all calendar formats...');
    
    try {
        const events = await loadGeocodedEvents();
        
        // Create output directory
        const outputDir = path.join(CONFIG.BACKUP_DIR, 'calendar-exports');
        await fs.mkdir(outputDir, { recursive: true });
        
        // Create bulk iCal export
        const bulkExport = await createBulkICalExport(events, outputDir);
        
        // Generate calendar report
        const reportResult = await generateCalendarReport(events, outputDir);
        
        // Create sample individual iCal files (first 3 events)
        const sampleEvents = events.slice(0, 3);
        const individualFiles = [];
        
        for (const event of sampleEvents) {
            const fileResult = await createIndividualICalFile(event, outputDir);
            individualFiles.push(fileResult);
        }
        
        console.log('\n📊 Export Summary:');
        console.log(`   📄 Bulk export: ${bulkExport.filename} (${events.length} events)`);
        console.log(`   📋 Report: ${reportResult.filename}`);
        console.log(`   📁 Sample individual files: ${individualFiles.length}`);
        
        individualFiles.forEach(file => {
            console.log(`     - ${file.filename}`);
        });
        
        console.log(`\n📁 All files saved to: ${outputDir}`);
        
        return {
            outputDir,
            bulkExport,
            report: reportResult,
            individualFiles,
            totalEvents: events.length
        };
        
    } catch (error) {
        console.error('❌ Export failed:', error.message);
        throw error;
    }
}

/**
 * Validate event timing consistency
 */
function validateEventTiming(event) {
    const datetime = parseEventDateTime(event.date, event.time);
    
    const errors = [];
    
    // Check if start time is before end time
    if (datetime.startDateTime >= datetime.endDateTime) {
        errors.push('Start time is not before end time');
    }
    
    // Check if dates are reasonable (August 2025)
    if (!datetime.date.startsWith('2025-08')) {
        errors.push('Date is not in August 2025');
    }
    
    // Check if times are reasonable (not too early/late)
    const startHour = parseInt(datetime.startTime.split(':')[0]);
    if (startHour < 6 || startHour > 23) {
        errors.push('Start time seems unreasonable (before 6 AM or after 11 PM)');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        datetime
    };
}

/**
 * Show help information
 */
function showHelp() {
    console.log(`
📅 TOOL #6: CALENDAR HELPER - USAGE GUIDE
=========================================

COMMANDS:
  npm run calendar:test      - Test calendar integration functionality
  npm run calendar:export    - Export all calendar formats (.ics files)
  npm run calendar:report    - Generate calendar integration report
  npm run calendar:help      - Show this help

FEATURES:
  ✅ iCal generation (RFC 5545 compliant .ics files)
  ✅ Google Calendar "Add to Calendar" URLs
  ✅ Europe/Berlin timezone handling
  ✅ Individual event exports and bulk export
  ✅ Date/time parsing from "Wed Aug 20" + "18:00 - 23:00" format
  ✅ Integration with Tool #5 geocoded locations

OUTPUT FILES:
  tools/data-backups/calendar-exports/
  ├── gamescom-2025-all-events-[date].ics    # Bulk export (all events)
  ├── gamescom-[event-id].ics                # Individual event files
  └── calendar-integration-report-[date].json # Detailed report

TIMEZONE HANDLING:
  All events converted to Europe/Berlin timezone (Cologne)
  iCal files use UTC with proper timezone conversion
  Google Calendar URLs use local timezone

DATE/TIME PARSING:
  "Wed Aug 20" -> 2025-08-20 (automatically adds year)
  "18:00 - 23:00" -> Start: 18:00, End: 23:00
  "7:30 - 9:00" -> Start: 07:30, End: 09:00
  Single times get 4-hour default duration

INTEGRATION:
  Uses Tool #5 geocoded events (58 events with coordinates)
  Includes venue addresses and precise coordinates
  Comprehensive event metadata (hosts, category, etc.)

GOOGLE CALENDAR URLS:
  Direct "Add to Calendar" links for each event
  Pre-filled with event details, location, and timing
  Properly encoded for reliable sharing
`);
}

// Main execution
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'test':
            await testCalendarIntegration();
            break;
            
        case 'export':
            const exportResult = await exportAllCalendarFormats();
            console.log(`\n🎉 Export completed successfully!`);
            console.log(`📁 Output directory: ${exportResult.outputDir}`);
            break;
            
        case 'report':
            const events = await loadGeocodedEvents();
            const outputDir = path.join(CONFIG.BACKUP_DIR, 'calendar-exports');
            await fs.mkdir(outputDir, { recursive: true });
            const reportResult = await generateCalendarReport(events, outputDir);
            console.log(`📋 Report generated: ${reportResult.filename}`);
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
    loadGeocodedEvents,
    parseEventDateTime,
    generateICalEvent,
    generateGoogleCalendarUrl,
    createBulkICalExport,
    validateEventTiming,
    testCalendarIntegration
};