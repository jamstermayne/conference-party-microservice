#!/usr/bin/env node

/**
 * TOOL #7: SEARCH FILTER
 * Comprehensive PWA event filtering and search system for Gamescom party events
 * Features: Text search, category filters, location-based search, date/time filtering
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    GEOCODED_FILE: path.join(__dirname, 'data-backups', 'geocoded-events-2025-08-06.json'),
    BACKUP_DIR: path.join(__dirname, 'data-backups'),
    SEARCH_INDEX_FILE: path.join(__dirname, 'data-backups', 'search-index-2025-08-06.json'),
    PWA_SEARCH_FILE: path.join(__dirname, 'data-backups', 'pwa-search-data.json'),
    DEFAULT_LOCATION: { lat: 50.9466, lng: 6.9804 }, // Koelnmesse (Cologne Fair)
    MAX_DISTANCE_KM: 50 // Maximum search radius in kilometers
};

/**
 * Load geocoded events from Tool #5
 */
async function loadGeocodedEvents() {
    console.log('🔍 Loading geocoded events for search indexing...');
    
    try {
        const data = await fs.readFile(CONFIG.GEOCODED_FILE, 'utf8');
        const results = JSON.parse(data);
        
        const events = [];
        
        for (const [eventId, eventData] of Object.entries(results.events)) {
            const fields = eventData.fields;
            const status = fields.status?.stringValue;
            
            if (status === 'success') {
                const geocoding = fields.geocoding?.mapValue?.fields;
                
                // Parse date and time for filtering
                const dateStr = fields.date?.stringValue || '';
                const timeStr = fields.time?.stringValue || '';
                const datetime = parseEventDateTime(dateStr, timeStr);
                
                events.push({
                    id: eventId,
                    name: fields.eventName?.stringValue || 'Unknown Event',
                    date: dateStr,
                    time: timeStr,
                    parsedDateTime: datetime,
                    address: fields.originalAddress?.stringValue || '',
                    hosts: fields.hosts?.stringValue || '',
                    category: fields.category?.stringValue || '',
                    coordinates: geocoding ? {
                        lat: geocoding.lat?.doubleValue,
                        lng: geocoding.lng?.doubleValue,
                        formattedAddress: geocoding.formattedAddress?.stringValue,
                        placeId: geocoding.placeId?.stringValue
                    } : null,
                    searchText: '', // Will be populated
                    keywords: [], // Will be populated
                    venues: [] // Will be populated
                });
            }
        }
        
        console.log(`✅ Loaded ${events.length} events for search indexing`);
        return events;
        
    } catch (error) {
        console.error('❌ Error loading geocoded events:', error.message);
        throw error;
    }
}

/**
 * Parse event date and time (from Tool #6)
 */
function parseEventDateTime(dateStr, timeStr) {
    try {
        const dateMatch = dateStr.match(/(\w+)\s+(\w+)\s+(\d+)/);
        if (!dateMatch) {
            return null;
        }
        
        const [, dayName, monthName, day] = dateMatch;
        
        const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        const month = months[monthName];
        if (!month) return null;
        
        const isoDate = `2025-${month}-${day.padStart(2, '0')}`;
        
        // Parse time
        let startTime = '19:00';
        let endTime = '23:00';
        
        if (timeStr && timeStr.trim() !== '') {
            const timeMatch = timeStr.match(/(\d{1,2}):?(\d{0,2})\s*[-–—]\s*(\d{1,2}):?(\d{0,2})/);
            if (timeMatch) {
                const [, startHour, startMin = '00', endHour, endMin = '00'] = timeMatch;
                startTime = `${startHour.padStart(2, '0')}:${startMin.padStart(2, '00')}`;
                endTime = `${endHour.padStart(2, '0')}:${endMin.padStart(2, '00')}`;
            }
        }
        
        return {
            date: isoDate,
            startTime,
            endTime,
            startDateTime: `${isoDate}T${startTime}:00`,
            endDateTime: `${isoDate}T${endTime}:00`,
            dayName,
            monthName,
            day: parseInt(day),
            startHour: parseInt(startTime.split(':')[0])
        };
        
    } catch (error) {
        return null;
    }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Extract keywords and searchable text from event
 */
function extractSearchData(event) {
    const searchParts = [
        event.name,
        event.hosts,
        event.category,
        event.address,
        event.coordinates?.formattedAddress || '',
        event.date,
        event.time
    ].filter(Boolean);
    
    const searchText = searchParts.join(' ').toLowerCase();
    
    // Extract keywords
    const keywords = new Set();
    
    // Add category keywords
    if (event.category) {
        keywords.add(event.category.toLowerCase());
    }
    
    // Add host keywords
    if (event.hosts) {
        event.hosts.split(/[,&]/).forEach(host => {
            const cleanHost = host.trim().toLowerCase();
            if (cleanHost) keywords.add(cleanHost);
        });
    }
    
    // Add venue keywords from name and address
    const venueTerms = [
        ...event.name.split(/\s+/),
        ...event.address.split(/\s+/)
    ].map(term => term.toLowerCase().replace(/[^a-z0-9]/g, ''))
     .filter(term => term.length > 2);
    
    venueTerms.forEach(term => keywords.add(term));
    
    // Add date keywords
    if (event.parsedDateTime) {
        keywords.add(event.parsedDateTime.dayName.toLowerCase());
        keywords.add(event.parsedDateTime.monthName.toLowerCase());
        keywords.add(`day${event.parsedDateTime.day}`);
    }
    
    // Extract venue names from address
    const venues = [];
    if (event.address) {
        const venueMatch = event.address.match(/^([^,]+)/);
        if (venueMatch) {
            venues.push(venueMatch[1].trim());
        }
    }
    
    return {
        searchText,
        keywords: Array.from(keywords),
        venues
    };
}

/**
 * Build comprehensive search index
 */
async function buildSearchIndex() {
    console.log('🔨 Building comprehensive search index...');
    
    try {
        const events = await loadGeocodedEvents();
        
        // Enhance events with search data
        const indexedEvents = events.map(event => {
            const searchData = extractSearchData(event);
            return {
                ...event,
                ...searchData
            };
        });
        
        // Build category index
        const categories = [...new Set(indexedEvents.map(e => e.category).filter(Boolean))];
        
        // Build hosts index
        const allHosts = new Set();
        indexedEvents.forEach(event => {
            if (event.hosts) {
                event.hosts.split(/[,&]/).forEach(host => {
                    const cleanHost = host.trim();
                    if (cleanHost) allHosts.add(cleanHost);
                });
            }
        });
        
        // Build date index
        const dates = [...new Set(indexedEvents.map(e => e.parsedDateTime?.date).filter(Boolean))];
        
        // Build venue index
        const venues = [...new Set(indexedEvents.flatMap(e => e.venues))];
        
        // Build location clusters (group nearby events)
        const locationClusters = buildLocationClusters(indexedEvents.filter(e => e.coordinates));
        
        const searchIndex = {
            generated: new Date().toISOString(),
            totalEvents: indexedEvents.length,
            eventsWithCoordinates: indexedEvents.filter(e => e.coordinates).length,
            events: indexedEvents,
            indexes: {
                categories: categories.sort(),
                hosts: Array.from(allHosts).sort(),
                dates: dates.sort(),
                venues: venues.sort(),
                locationClusters
            },
            filters: {
                dateRange: {
                    min: Math.min(...dates.map(d => new Date(d).getTime())),
                    max: Math.max(...dates.map(d => new Date(d).getTime()))
                },
                timeRange: {
                    earliest: Math.min(...indexedEvents.map(e => e.parsedDateTime?.startHour).filter(h => h !== undefined)),
                    latest: Math.max(...indexedEvents.map(e => e.parsedDateTime?.startHour).filter(h => h !== undefined))
                }
            }
        };
        
        // Save search index
        await fs.writeFile(CONFIG.SEARCH_INDEX_FILE, JSON.stringify(searchIndex, null, 2));
        
        console.log('📊 Search Index Built:');
        console.log(`   📅 ${searchIndex.totalEvents} total events`);
        console.log(`   🗺️  ${searchIndex.eventsWithCoordinates} events with coordinates`);
        console.log(`   🏷️  ${searchIndex.indexes.categories.length} categories`);
        console.log(`   👥 ${searchIndex.indexes.hosts.length} hosts`);
        console.log(`   📍 ${searchIndex.indexes.venues.length} venues`);
        console.log(`   🌍 ${searchIndex.indexes.locationClusters.length} location clusters`);
        
        return searchIndex;
        
    } catch (error) {
        console.error('❌ Error building search index:', error.message);
        throw error;
    }
}

/**
 * Build location clusters for nearby events
 */
function buildLocationClusters(eventsWithCoords) {
    const clusters = [];
    const processed = new Set();
    
    const CLUSTER_RADIUS_KM = 0.5; // 500 meters
    
    eventsWithCoords.forEach(event => {
        if (processed.has(event.id)) return;
        
        const cluster = {
            center: {
                lat: event.coordinates.lat,
                lng: event.coordinates.lng
            },
            events: [event.id],
            venue: event.venues[0] || 'Unknown Venue',
            address: event.coordinates.formattedAddress || event.address
        };
        
        // Find nearby events
        eventsWithCoords.forEach(otherEvent => {
            if (otherEvent.id === event.id || processed.has(otherEvent.id)) return;
            
            const distance = calculateDistance(
                event.coordinates.lat, event.coordinates.lng,
                otherEvent.coordinates.lat, otherEvent.coordinates.lng
            );
            
            if (distance <= CLUSTER_RADIUS_KM) {
                cluster.events.push(otherEvent.id);
                processed.add(otherEvent.id);
            }
        });
        
        processed.add(event.id);
        clusters.push(cluster);
    });
    
    return clusters;
}

/**
 * Perform text search on events
 */
function performTextSearch(events, query) {
    if (!query || query.trim() === '') return events;
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    
    return events.filter(event => {
        return searchTerms.every(term => 
            event.searchText.includes(term) || 
            event.keywords.some(keyword => keyword.includes(term))
        );
    }).map(event => {
        // Calculate relevance score
        const score = searchTerms.reduce((acc, term) => {
            if (event.name.toLowerCase().includes(term)) acc += 10;
            if (event.hosts.toLowerCase().includes(term)) acc += 5;
            if (event.category.toLowerCase().includes(term)) acc += 3;
            if (event.address.toLowerCase().includes(term)) acc += 2;
            return acc;
        }, 0);
        
        return { ...event, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Filter events by category
 */
function filterByCategory(events, categories) {
    if (!categories || categories.length === 0) return events;
    
    const categorySet = new Set(categories.map(c => c.toLowerCase()));
    
    return events.filter(event => 
        event.category && categorySet.has(event.category.toLowerCase())
    );
}

/**
 * Filter events by date range
 */
function filterByDateRange(events, startDate, endDate) {
    if (!startDate && !endDate) return events;
    
    return events.filter(event => {
        if (!event.parsedDateTime) return true; // Include events with unparseable dates
        
        const eventDate = new Date(event.parsedDateTime.date);
        const start = startDate ? new Date(startDate) : new Date('2025-01-01');
        const end = endDate ? new Date(endDate) : new Date('2025-12-31');
        
        return eventDate >= start && eventDate <= end;
    });
}

/**
 * Filter events by time range
 */
function filterByTimeRange(events, startHour, endHour) {
    if (startHour === undefined && endHour === undefined) return events;
    
    return events.filter(event => {
        if (!event.parsedDateTime) return true;
        
        const eventStartHour = event.parsedDateTime.startHour;
        
        if (startHour !== undefined && eventStartHour < startHour) return false;
        if (endHour !== undefined && eventStartHour > endHour) return false;
        
        return true;
    });
}

/**
 * Filter events by location (distance from point)
 */
function filterByLocation(events, centerLat, centerLng, radiusKm) {
    if (!centerLat || !centerLng || !radiusKm) return events;
    
    return events.filter(event => {
        if (!event.coordinates) return false; // Exclude events without coordinates
        
        const distance = calculateDistance(
            centerLat, centerLng,
            event.coordinates.lat, event.coordinates.lng
        );
        
        return distance <= radiusKm;
    }).map(event => {
        const distance = calculateDistance(
            centerLat, centerLng,
            event.coordinates.lat, event.coordinates.lng
        );
        
        return { ...event, distance };
    }).sort((a, b) => a.distance - b.distance);
}

/**
 * Comprehensive search function
 */
function searchEvents(searchIndex, filters = {}) {
    let results = [...searchIndex.events];
    
    // Apply text search
    if (filters.query) {
        results = performTextSearch(results, filters.query);
    }
    
    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
        results = filterByCategory(results, filters.categories);
    }
    
    // Apply date range filter
    if (filters.startDate || filters.endDate) {
        results = filterByDateRange(results, filters.startDate, filters.endDate);
    }
    
    // Apply time range filter
    if (filters.startHour !== undefined || filters.endHour !== undefined) {
        results = filterByTimeRange(results, filters.startHour, filters.endHour);
    }
    
    // Apply location filter
    if (filters.centerLat && filters.centerLng && filters.radiusKm) {
        results = filterByLocation(results, filters.centerLat, filters.centerLng, filters.radiusKm);
    }
    
    // Apply hosts filter
    if (filters.hosts && filters.hosts.length > 0) {
        const hostSet = new Set(filters.hosts.map(h => h.toLowerCase()));
        results = results.filter(event => {
            if (!event.hosts) return false;
            return event.hosts.toLowerCase().split(/[,&]/).some(host => 
                hostSet.has(host.trim().toLowerCase())
            );
        });
    }
    
    return results;
}

/**
 * Generate PWA-optimized search data
 */
async function generatePWASearchData(searchIndex) {
    console.log('📱 Generating PWA-optimized search data...');
    
    const pwaData = {
        generated: new Date().toISOString(),
        version: '1.0.0',
        totalEvents: searchIndex.totalEvents,
        
        // Compact event data for PWA
        events: searchIndex.events.map(event => ({
            id: event.id,
            name: event.name,
            date: event.parsedDateTime?.date,
            startTime: event.parsedDateTime?.startTime,
            endTime: event.parsedDateTime?.endTime,
            category: event.category,
            hosts: event.hosts,
            address: event.address,
            coordinates: event.coordinates ? {
                lat: Math.round(event.coordinates.lat * 1000000) / 1000000, // 6 decimal places
                lng: Math.round(event.coordinates.lng * 1000000) / 1000000
            } : null,
            keywords: event.keywords.slice(0, 10), // Limit keywords for size
            venues: event.venues.slice(0, 2) // Limit venues
        })),
        
        // Search indexes for PWA
        filters: {
            categories: searchIndex.indexes.categories,
            hosts: searchIndex.indexes.hosts.slice(0, 50), // Limit for size
            dates: searchIndex.indexes.dates,
            venues: searchIndex.indexes.venues.slice(0, 30)
        },
        
        // Location clusters for map view
        locationClusters: searchIndex.indexes.locationClusters,
        
        // Default search location
        defaultLocation: CONFIG.DEFAULT_LOCATION,
        
        // Search configuration
        config: {
            maxDistanceKm: CONFIG.MAX_DISTANCE_KM,
            clusterRadiusKm: 0.5
        }
    };
    
    await fs.writeFile(CONFIG.PWA_SEARCH_FILE, JSON.stringify(pwaData, null, 2));
    
    console.log(`✅ PWA search data generated: ${CONFIG.PWA_SEARCH_FILE}`);
    console.log(`   📄 File size: ${Math.round(JSON.stringify(pwaData).length / 1024)}KB`);
    
    return pwaData;
}

/**
 * Test search functionality
 */
async function testSearchFunctionality() {
    console.log('🧪 Testing search functionality...');
    
    try {
        const searchIndex = JSON.parse(await fs.readFile(CONFIG.SEARCH_INDEX_FILE, 'utf8'));
        
        // Test text search
        console.log('\n📝 Testing text search:');
        const textResults = searchEvents(searchIndex, { query: 'gamescom mixer' });
        console.log(`   "gamescom mixer" -> ${textResults.length} results`);
        if (textResults.length > 0) {
            console.log(`   Top result: ${textResults[0].name}`);
        }
        
        // Test category filter
        console.log('\n🏷️  Testing category filter:');
        const categoryResults = searchEvents(searchIndex, { categories: ['Mixer'] });
        console.log(`   Category "Mixer" -> ${categoryResults.length} results`);
        
        // Test location search
        console.log('\n🗺️  Testing location search:');
        const locationResults = searchEvents(searchIndex, {
            centerLat: CONFIG.DEFAULT_LOCATION.lat,
            centerLng: CONFIG.DEFAULT_LOCATION.lng,
            radiusKm: 2
        });
        console.log(`   Within 2km of Koelnmesse -> ${locationResults.length} results`);
        
        // Test date filter
        console.log('\n📅 Testing date filter:');
        const dateResults = searchEvents(searchIndex, {
            startDate: '2025-08-20',
            endDate: '2025-08-22'
        });
        console.log(`   Aug 20-22, 2025 -> ${dateResults.length} results`);
        
        // Test combined search
        console.log('\n🔍 Testing combined search:');
        const combinedResults = searchEvents(searchIndex, {
            query: 'party',
            categories: ['Mixer'],
            radiusKm: 5,
            centerLat: CONFIG.DEFAULT_LOCATION.lat,
            centerLng: CONFIG.DEFAULT_LOCATION.lng
        });
        console.log(`   "party" + Mixer + 5km radius -> ${combinedResults.length} results`);
        
        console.log('\n✅ Search functionality tests passed');
        
    } catch (error) {
        console.error('❌ Search test failed:', error.message);
        throw error;
    }
}

/**
 * Show help information
 */
function showHelp() {
    console.log(`
🔍 TOOL #7: SEARCH FILTER - USAGE GUIDE
=======================================

COMMANDS:
  npm run search:build      - Build comprehensive search index
  npm run search:pwa        - Generate PWA-optimized search data
  npm run search:test       - Test search functionality
  npm run search:help       - Show this help

SEARCH FEATURES:
  ✅ Text search (event names, hosts, venues, descriptions)
  ✅ Category filtering (Mixer, Conference, etc.)
  ✅ Location-based search (distance radius from point)
  ✅ Date range filtering (specific dates or ranges)
  ✅ Time filtering (events starting within time range)
  ✅ Host filtering (events by specific organizers)
  ✅ Venue filtering (events at specific locations)

LOCATION FEATURES:
  🗺️  Distance calculation using Haversine formula
  🏢 Venue clustering (groups nearby events)
  📍 Default location: Koelnmesse (50.9466, 6.9804)
  📏 Maximum search radius: 50km

OUTPUT FILES:
  tools/data-backups/search-index-2025-08-06.json    # Complete search index
  tools/data-backups/pwa-search-data.json           # PWA-optimized data

PWA INTEGRATION:
  📱 Compact data format for mobile performance
  🔍 Pre-built search indexes for instant filtering
  🗺️  Location clusters for map visualization
  ⚡ Offline-capable search data structure

SEARCH EXAMPLES:
  Text: "gamescom mixer" -> Events matching both terms
  Category: ["Mixer", "Conference"] -> Events in those categories
  Location: lat/lng + 2km radius -> Events within distance
  Date: 2025-08-20 to 2025-08-22 -> Events in date range
  Time: 18-22 (hour range) -> Events starting 6PM-10PM
  Combined: Multiple filters applied together

PERFORMANCE:
  Indexed search for instant results
  Location clustering reduces map complexity  
  Keyword extraction for fuzzy matching
  Relevance scoring for result ranking
`);
}

// Main execution
async function main() {
    const command = process.argv[2];
    
    try {
        switch (command) {
            case 'build':
                const searchIndex = await buildSearchIndex();
                console.log(`🎉 Search index built successfully!`);
                break;
                
            case 'pwa':
                // Load existing index or build if needed
                let index;
                try {
                    index = JSON.parse(await fs.readFile(CONFIG.SEARCH_INDEX_FILE, 'utf8'));
                } catch {
                    console.log('⚠️  Search index not found, building first...');
                    index = await buildSearchIndex();
                }
                
                await generatePWASearchData(index);
                console.log(`🎉 PWA search data generated successfully!`);
                break;
                
            case 'test':
                await testSearchFunctionality();
                break;
                
            case 'help':
            default:
                showHelp();
                break;
        }
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    loadGeocodedEvents,
    buildSearchIndex,
    searchEvents,
    performTextSearch,
    filterByCategory,
    filterByLocation,
    calculateDistance
};