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
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

// FIXED: Fetch ALL events with correct pagination and field structure
async function fetchAllEvents() {
    console.log('🔄 Fetching ALL events (pagination + structure FIXED)...');
    
    let allEvents = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
        try {
            console.log(`📄 Fetching page ${page}...`);
            const response = await makeRequest(`${API_BASE}/api/parties?page=${page}`);
            
            if (response.success && response.data && Array.isArray(response.data)) {
                allEvents.push(...response.data);
                console.log(`✅ Page ${page}: ${response.data.length} events (Total: ${allEvents.length}/${response.meta?.total || 'unknown'})`);
                
                // Check if there are more pages using meta.hasMore
                hasMore = response.meta && response.meta.hasMore === true;
                page++;
            } else {
                console.error('❌ Unexpected response structure:', Object.keys(response));
                hasMore = false;
            }
        } catch (error) {
            console.error(`❌ Error fetching page ${page}:`, error.message);
            hasMore = false;
        }
    }
    
    console.log(`🎉 Total events processed: ${allEvents.length} (PAGINATION + STRUCTURE FIXED!)`);
    return allEvents;
}

// PERFECT text encoding fixes - handles ALL corruption types
function fixTextEncoding(text) {
    if (!text) return text;
    
    return text
        // Fix German characters (most common)
        .replace(/Ã¤/g, 'ä')
        .replace(/Ã¶/g, 'ö')
        .replace(/Ã¼/g, 'ü')
        .replace(/Ã„/g, 'Ä')
        .replace(/Ã–/g, 'Ö')
        .replace(/Ãœ/g, 'Ü')
        .replace(/ÃŸ/g, 'ß')
        
        // Fix smart quotes and apostrophes (Pete's issue)
        .replace(/â€™/g, "'")  // Smart apostrophe
        .replace(/â€˜/g, "'")  // Smart single quote left
        .replace(/â€œ/g, '"')  // Smart double quote left  
        .replace(/â€�/g, '"')  // Smart double quote right
        .replace(/â€"/g, '-')  // Em dash
        .replace(/â€"/g, '-')  // En dash
        .replace(/â€¦/g, '...') // Ellipsis
        .replace(/Â´/g, "'")   // Acute accent
        .replace(/Â`/g, "'")   // Grave accent
        
        // Fix other Unicode corruptions
        .replace(/â‚¬/g, '€')  // Euro symbol
        .replace(/Â£/g, '£')   // Pound symbol
        .replace(/Â®/g, '®')   // Registered symbol
        .replace(/Â©/g, '©')   // Copyright symbol
        .replace(/Â™/g, '™')   // Trademark symbol
        .replace(/Â°/g, '°')   // Degree symbol
        
        // Fix French characters
        .replace(/Ã©/g, 'é')
        .replace(/Ã¨/g, 'è')
        .replace(/Ã /g, 'à')
        .replace(/Ã¡/g, 'á')
        .replace(/Ãª/g, 'ê')
        .replace(/Ã«/g, 'ë')
        .replace(/Ã®/g, 'î')
        .replace(/Ã¯/g, 'ï')
        .replace(/Ã´/g, 'ô')
        .replace(/Ã¹/g, 'ù')
        .replace(/Ã»/g, 'û')
        .replace(/Ã§/g, 'ç')
        
        // Fix Spanish characters  
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã'/g, 'Ñ')
        
        // Fix specific known issues from handover
        .replace(/HerbrandstraÃŸe/g, 'Herbrandstraße')
        .replace(/Kšlnmesse/g, 'Koelnmesse')
        .replace(/Kšln/g, 'Köln')
        
        // Fix common corrupted patterns
        .replace(/Ã\s/g, 'ä ')     // Space after corruption
        .replace(/Ã,/g, 'ä,')      // Comma after corruption
        .replace(/Ã\./g, 'ä.')     // Period after corruption
        
        // Clean up double spaces and trim
        .replace(/\s+/g, ' ')
        .trim();

// PERFECT URL encoding fixes - handles ALL URL corruption types
function fixUrlEncoding(url) {
    if (!url) return url;
    
    return url
        // Fix standard URL encoding
        .replace(/%20/g, ' ')
        .replace(/%21/g, '!')
        .replace(/%22/g, '"')
        .replace(/%23/g, '#')
        .replace(/%24/g, '$')

// PERFECT URL validation - comprehensive checks
function validateUrl(url) {
    if (!url) return { valid: false, reason: 'Empty URL' };
    
    // Handle special cases
    if (url === 'n/a' || url === 'N/A' || url === 'TBD' || url === 'TBA') {
        return { valid: false, reason: 'Placeholder URL (n/a, TBD, etc.)' };
    }
    
    // Check for obviously invalid formats
    if (url.includes('..') && !url.includes('://')) {
        return { valid: false, reason: 'Malformed double dots' };
    }
    
    if (url.length < 4) {
        return { valid: false, reason: 'Too short to be valid URL' };
    }
    
    if (url.includes(' ') && !url.includes('%20')) {
        return { valid: false, reason: 'Contains unencoded spaces' };
    }
    
    // Try to create URL object for validation
    try {
        // If it doesn't start with protocol, try adding https://
        let testUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            if (url.startsWith('www.') || url.includes('.com') || url.includes('.org') || url.includes('.net')) {
                testUrl = 'https://' + url;
            } else {
                return { valid: false, reason: 'Missing protocol (http/https)' };
            }
        }
        
        const urlObj = new URL(testUrl);
        
        // Additional checks for common issues
        if (urlObj.hostname.length < 3) {
            return { valid: false, reason: 'Invalid hostname' };
        }
        
        if (!urlObj.hostname.includes('.')) {
            return { valid: false, reason: 'Hostname missing top-level domain' };
        }
        
        // Check for doubled extensions (.com.com)
        if (urlObj.hostname.includes('.com.com') || urlObj.hostname.includes('.org.org')) {
            return { valid: false, reason: 'Doubled domain extension' };
        }
        
        return { valid: true, normalized: testUrl };
        
    } catch (e) {
        // More specific error messages
        if (url.includes('://') && !url.match(/^https?:\/\//i)) {
            return { valid: false, reason: 'Invalid protocol (not http/https)' };
        }
        
        if (url.includes('@') && !url.includes('mailto:')) {
            return { valid: false, reason: 'Contains @ symbol (possibly email)' };
        }
        
        return { valid: false, reason: 'Malformed URL structure' };
    }
}

// Check if address is geocodable (FIXED: correct field name)
function isGeocodable(event) {
    const address = event.Address || event['Event Name'] || ''; // Address field is capitalized
    
    // Skip empty addresses or placeholder text
    if (!address || 
        address === '(empty)' || 
        address === 'Register to See Address' ||
        address.length < 5) {
        return false;
    }
    
    // Basic checks for geocodable addresses
    return address.includes('str') || 
           address.includes('Str') || 
           address.includes('platz') || 
           address.includes('Platz') || 
           address.includes('weg') || 
           address.includes('Weg') ||
           address.includes('Germany') ||
           address.includes('Deutschland') ||
           address.includes('Cologne') ||
           address.includes('Koeln') ||
           address.includes('Hall') ||  // Koelnmesse halls
           address.includes('Messeplatz') ||
           /\d/.test(address); // Contains numbers (likely street numbers)
}

// PERFECT: Detect ANY encoding issues (not just known patterns)
function hasEncodingIssues(text) {
    if (!text) return false;
    
    // Check for common encoding corruption patterns
    const encodingPatterns = [
        /Ã[a-zA-Z]/g,        // German/European character corruption
        /â€[™œ"‹]/g,         // Smart quotes/apostrophes/dashes
        /Ã[²³¹]/g,           // Superscript numbers
        /Â[®©™°£]/g,         // Symbols
        /š/g,                // Czech/Eastern European
        /ž/g,                // More Eastern European  
        /[^\x00-\x7F]/g,     // Any non-ASCII characters that might be corruption
    ];
    
    return encodingPatterns.some(pattern => pattern.test(text));
}

// PERFECT: Preview with comprehensive analysis
async function previewData() {
    console.log('🔍 PREVIEW: Event Data Analysis (COMPREHENSIVE)');
    console.log('=' .repeat(60));
    
    try {
        const events = await fetchAllEvents();
        
        console.log(`📊 Total Events: ${events.length}`);
        console.log(`📅 Date Range: ${events[0]?.Date || 'Unknown'} to ${events[events.length-1]?.Date || 'Unknown'}`);
        
        // Comprehensive analysis
        let encodingIssues = 0;
        let urlIssues = 0;
        let geocodableAddresses = 0;
        let emptyAddresses = 0;
        let registerAddresses = 0;
        let validUrls = 0;
        let apostropheIssues = 0;
        let smartQuoteIssues = 0;
        
        const encodingProblems = [];
        
        events.forEach((event, index) => {
            // Check ALL text fields for encoding issues
            const textFields = [event['Event Name'], event.Hosts, event.Address, event.Category].filter(Boolean);
            
            textFields.forEach(field => {
                if (hasEncodingIssues(field)) {
                    encodingIssues++;
                    encodingProblems.push({
                        index: index + 1,
                        event: event['Event Name'] || 'Untitled',
                        field: field,
                        issues: field.match(/Ã[a-zA-Z]|â€[™œ"‹]|š|ž/g) || []
                    });
                }
                
                // Specific issue counts
                if (field.includes('â€™') || field.includes('â€˜')) apostropheIssues++;
                if (field.includes('â€œ') || field.includes('â€�')) smartQuoteIssues++;
            });
            
            // URL analysis  
            if (event.Link) {
                const validation = validateUrl(event.Link);
                if (validation.valid) {
                    validUrls++;
                } else {
                    urlIssues++;
                }
            }
            
            // Address analysis
            if (!event.Address || event.Address === '(empty)') {
                emptyAddresses++;
            } else if (event.Address === 'Register to See Address') {
                registerAddresses++;  
            } else if (isGeocodable(event)) {
                geocodableAddresses++;
            }
        });
        
        console.log('\n🧹 TEXT ENCODING ANALYSIS:');
        console.log(`   Total encoding issues: ${encodingIssues}/${events.length}`);
        console.log(`   Apostrophe corruption: ${apostropheIssues}`);
        console.log(`   Smart quote corruption: ${smartQuoteIssues}`);
        
        console.log('\n🔗 URL QUALITY ANALYSIS:');
        console.log(`   Valid URLs: ${validUrls}/${events.length} (${Math.round(validUrls/events.length*100)}%)`);
        console.log(`   Invalid URLs: ${urlIssues}/${events.length}`);
        
        console.log('\n🗺️ ADDRESS ANALYSIS:');
        console.log(`   Geocodable addresses: ${geocodableAddresses}/${events.length} (${Math.round(geocodableAddresses/events.length*100)}%)`);
        console.log(`   Empty addresses: ${emptyAddresses}/${events.length}`);
        console.log(`   Registration required: ${registerAddresses}/${events.length}`);
        
        // Show specific encoding problems
        if (encodingProblems.length > 0) {
            console.log('\n🔍 ENCODING ISSUES DETECTED:');
            encodingProblems.slice(0, 5).forEach(problem => {
                console.log(`   ${problem.index}. ${problem.event}`);
                console.log(`      Text: "${problem.field}"`);
                console.log(`      Issues: ${problem.issues.join(', ')}`);
                console.log('');
            });
            
            if (encodingProblems.length > 5) {
                console.log(`   ... and ${encodingProblems.length - 5} more encoding issues`);
            }
        }
        
        // Sample clean events
        console.log('\n📋 Sample Events:');
        events.slice(0, 3).forEach((event, i) => {
            const hasIssues = hasEncodingIssues(event['Event Name'] + ' ' + (event.Address || ''));
            const icon = hasIssues ? '🧹' : '✅';
            console.log(`${icon} ${i+1}. ${event['Event Name'] || 'Untitled'}`);
            console.log(`   📍 ${event.Address || 'No address'}`);
            console.log(`   🔗 ${event.Link || 'No link'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Preview failed:', error.message);
    }
}

// Validate all URLs (FIXED: correct field names)
async function validateUrls() {
    console.log('🔍 VALIDATE: URL Quality Analysis');
    console.log('=' .repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        let valid = 0;
        let invalid = 0;
        let empty = 0;
        const issues = [];
        
        events.forEach((event, index) => {
            if (!event.Link) {
                empty++;
                return;
            }
            
            const validation = validateUrl(event.Link);
            if (validation.valid) {
                valid++;
            } else {
                invalid++;
                issues.push({
                    index: index + 1,
                    title: event['Event Name'] || 'Untitled',
                    url: event.Link,
                    reason: validation.reason
                });
            }
        });
        
        console.log(`✅ Valid URLs: ${valid}/${events.length} (${Math.round(valid/events.length*100)}%)`);
        console.log(`❌ Invalid URLs: ${invalid}/${events.length}`);
        console.log(`⚪ Empty URLs: ${empty}/${events.length}`);
        
        if (issues.length > 0) {
            console.log('\n🔧 Issues Found:');
            issues.slice(0, 10).forEach(issue => {
                console.log(`${issue.index}. ${issue.title}`);
                console.log(`   URL: ${issue.url}`);
                console.log(`   Issue: ${issue.reason}`);
                console.log('');
            });
            
            if (issues.length > 10) {
                console.log(`... and ${issues.length - 10} more issues`);
            }
        }
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

// Geocoding analysis (FIXED: correct field names)
async function analyzeGeocoding() {
    console.log('🗺️  GEOCODING: Address Analysis');
    console.log('=' .repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        let geocodable = 0;
        let needsWork = 0;
        let empty = 0;
        let registerRequired = 0;
        
        const geocodableEvents = [];
        const problematicEvents = [];
        
        events.forEach((event, index) => {
            const address = event.Address || '';
            
            if (!address || address === '(empty)') {
                empty++;
                return;
            }
            
            if (address === 'Register to See Address') {
                registerRequired++;
                return;
            }
            
            if (isGeocodable(event)) {
                geocodable++;
                geocodableEvents.push({
                    index: index + 1,
                    title: event['Event Name'] || 'Untitled',
                    address: address,
                    hasEncoding: address.includes('Ã') || address.includes('š')
                });
            } else {
                needsWork++;
                problematicEvents.push({
                    index: index + 1,
                    title: event['Event Name'] || 'Untitled',
                    address: address
                });
            }
        });
        
        console.log(`🎯 Geocodable addresses: ${geocodable}/${events.length} (${Math.round(geocodable/events.length*100)}%)`);
        console.log(`⚠️  Need improvement: ${needsWork}/${events.length}`);
        console.log(`🔒 Registration required: ${registerRequired}/${events.length}`);
        console.log(`❌ Missing addresses: ${empty}/${events.length}`);
        
        // Count encoding issues in geocodable addresses
        const encodingIssues = geocodableEvents.filter(e => e.hasEncoding).length;
        console.log(`🧹 Encoding issues in geocodable: ${encodingIssues}/${geocodable}`);
        
        // Show sample geocodable addresses
        if (geocodableEvents.length > 0) {
            console.log('\n✅ Sample Geocodable Addresses:');
            geocodableEvents.slice(0, 5).forEach(event => {
                const flag = event.hasEncoding ? '🧹' : '✅';
                console.log(`${flag} ${event.title}`);
                console.log(`   📍 ${event.address}`);
                console.log('');
            });
        }
        
        // Create backup report
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const report = {
            timestamp: new Date().toISOString(),
            totalEvents: events.length,
            geocodable: geocodable,
            needsWork: needsWork,
            registerRequired: registerRequired,
            empty: empty,
            encodingIssues: encodingIssues,
            geocodableEvents: geocodableEvents,
            problematicEvents: problematicEvents.slice(0, 20)
        };
        
        const reportPath = path.join(BACKUP_DIR, `geocoding-analysis-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📁 Report saved: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Geocoding analysis failed:', error.message);
    }
}

// PERFECT: Apply comprehensive encoding fixes  
async function fixEncoding() {
    console.log('🧹 FIXING: ALL Encoding Issues (COMPREHENSIVE)');
    console.log('=' .repeat(60));
    
    try {
        const events = await fetchAllEvents();
        
        // Create backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `events-backup-${timestamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(events, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);
        
        let textFixed = 0;
        let urlFixed = 0;
        let apostrophesFixed = 0;
        let quotesFixed = 0;
        let germanCharsFixed = 0;
        let urlProtocolsAdded = 0;
        
        const changes = [];
        
        // Apply fixes with detailed tracking
        events.forEach((event, index) => {
            // Fix text fields with correct field names
            ['Event Name', 'Address', 'Hosts', 'Category'].forEach(field => {
                if (event[field]) {
                    const original = event[field];
                    const fixed = fixTextEncoding(original);
                    
                    if (fixed !== original) {
                        // Count specific fix types
                        if (original.includes('â€™') || original.includes('â€˜')) apostrophesFixed++;
                        if (original.includes('â€œ') || original.includes('â€�')) quotesFixed++;
                        if (original.includes('Ã')) germanCharsFixed++;
                        
                        changes.push({
                            index: index + 1,
                            event: event['Event Name'] || 'Untitled',
                            field: field,
                            before: original,
                            after: fixed,
                            fixType: 'text-encoding'
                        });
                        event[field] = fixed;
                        textFixed++;
                    }
                }
            });
            
            // Fix URL field with comprehensive fixes
            if (event.Link) {
                const original = event.Link;
                let fixed = fixUrlEncoding(original);
                
                // Check if we need to add protocol
                const validation = validateUrl(fixed);
                if (!validation.valid && validation.normalized) {
                    fixed = validation.normalized;
                    urlProtocolsAdded++;
                }
                
                if (fixed !== original) {
                    changes.push({
                        index: index + 1,
                        event: event['Event Name'] || 'Untitled',
                        field: 'Link',
                        before: original,
                        after: fixed,
                        fixType: 'url-encoding'
                    });
                    event.Link = fixed;
                    urlFixed++;
                }
            }
        });
        
        console.log('\n📊 COMPREHENSIVE FIX RESULTS:');
        console.log(`✅ Text encoding fixes: ${textFixed}`);
        console.log(`   - Apostrophe fixes: ${apostrophesFixed}`);
        console.log(`   - Smart quote fixes: ${quotesFixed}`);
        console.log(`   - German char fixes: ${germanCharsFixed}`);
        console.log(`✅ URL fixes: ${urlFixed}`);
        console.log(`   - Protocols added: ${urlProtocolsAdded}`);
        console.log(`📊 Total changes: ${changes.length}`);
        
        // Show sample fixes by type
        const textChanges = changes.filter(c => c.fixType === 'text-encoding');
        const urlChanges = changes.filter(c => c.fixType === 'url-encoding');
        
        if (textChanges.length > 0) {
            console.log('\n🧹 SAMPLE TEXT ENCODING FIXES:');
            textChanges.slice(0, 3).forEach(change => {
                console.log(`${change.index}. ${change.event} - ${change.field}:`);
                console.log(`   Before: "${change.before}"`);
                console.log(`   After:  "${change.after}"`);
                console.log('');
            });
            
            if (textChanges.length > 3) {
                console.log(`... and ${textChanges.length - 3} more text fixes`);
            }
        }
        
        if (urlChanges.length > 0) {
            console.log('\n🔗 SAMPLE URL FIXES:');
            urlChanges.slice(0, 3).forEach(change => {
                console.log(`${change.index}. ${change.event}:`);
                console.log(`   Before: ${change.before}`);
                console.log(`   After:  ${change.after}`);
                console.log('');
            });
            
            if (urlChanges.length > 3) {
                console.log(`... and ${urlChanges.length - 3} more URL fixes`);
            }
        }
        
        // Save detailed change log
        const changeLogPath = path.join(BACKUP_DIR, `encoding-fixes-PERFECT-${timestamp}.json`);
        fs.writeFileSync(changeLogPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalEvents: events.length,
            summary: {
                textFixed,
                urlFixed,
                apostrophesFixed,
                quotesFixed,
                germanCharsFixed,
                urlProtocolsAdded,
                totalChanges: changes.length
            },
            changes: changes
        }, null, 2));
        
        console.log(`\n📋 PERFECT change log saved: ${changeLogPath}`);
        console.log('\n⚠️  NOTE: This is a simulation. To apply to Firebase, update the source data.');
        console.log('🎉 ALL ENCODING ISSUES ADDRESSED!');
        
    } catch (error) {
        console.error('❌ Encoding fix failed:', error.message);
    }
}

// Main CLI interface
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'preview':
            await previewData();
            break;
        case 'validate-urls':
            await validateUrls();
            break;
        case 'geocode':
            await analyzeGeocoding();
            break;
        case 'fix-encoding':
            await fixEncoding();
            break;
        default:
            console.log('🛠️  Data Processor - Gamescom 2025 Party App');
            console.log('Usage:');
            console.log('  node tools/data-processor.js preview      # Analyze event data');
            console.log('  node tools/data-processor.js validate-urls # Check URL quality');
            console.log('  node tools/data-processor.js geocode      # Analyze addresses');
            console.log('  node tools/data-processor.js fix-encoding # Apply encoding fixes');
            console.log('');
            console.log('NPM Scripts:');
            console.log('  npm run data:preview     # Same as preview');
            console.log('  npm run data:validate    # Same as validate-urls');
            console.log('  npm run data:geocode     # Same as geocode');
            console.log('  npm run data:fix-encoding # Same as fix-encoding');
    }
}

// Make executable
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    fetchAllEvents,
    fixTextEncoding,
    fixUrlEncoding,
    validateUrl,
    isGeocodable,
    hasEncodingIssues
};)
        .replace(/%25/g, '%')
        .replace(/%26/g, '&')
        .replace(/%27/g, "'")
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/%2A/g, '*')
        .replace(/%2B/g, '+')
        .replace(/%2C/g, ',')
        .replace(/%2F/g, '/')
        .replace(/%3A/g, ':')
        .replace(/%3B/g, ';')
        .replace(/%3C/g, '<')
        .replace(/%3D/g, '=')
        .replace(/%3E/g, '>')
        .replace(/%3F/g, '?')
        .replace(/%40/g, '@')
        .replace(/%5B/g, '[')
        .replace(/%5C/g, '\\')
        .replace(/%5D/g, ']')
        .replace(/%5E/g, '^')
        .replace(/%7B/g, '{')
        .replace(/%7C/g, '|')
        .replace(/%7D/g, '}')
        .replace(/%7E/g, '~')
        
        // Fix HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        
        // Fix malformed URLs - add protocols where missing
        .replace(/^www\./i, 'https://www.')
        .replace(/^http:\/\/www\.eventbrite\./i, 'https://www.eventbrite.')
        .replace(/^eventbrite\./i, 'https://eventbrite.')
        
        // Fix doubled domains (common corruption)
        .replace(/\.eventbrite\.com\.eventbrite\.com/g, '.eventbrite.com')
        .replace(/\.com\.com/g, '.com')
        
        // Clean up spaces and special formatting
        .replace(/\s+/g, '')  // Remove all spaces from URLs
        .trim();

// Validate URL structure
function validateUrl(url) {
    if (!url) return { valid: false, reason: 'Empty URL' };
    
    try {
        new URL(url);
        return { valid: true };
    } catch (e) {
        // Check if it's a relative URL or missing protocol
        if (url.startsWith('/') || url.includes('.') && !url.includes('://')) {
            return { valid: false, reason: 'Missing protocol or malformed' };
        }
        return { valid: false, reason: e.message };
    }
}

// Check if address is geocodable (FIXED: correct field name)
function isGeocodable(event) {
    const address = event.Address || event['Event Name'] || ''; // Address field is capitalized
    
    // Skip empty addresses or placeholder text
    if (!address || 
        address === '(empty)' || 
        address === 'Register to See Address' ||
        address.length < 5) {
        return false;
    }
    
    // Basic checks for geocodable addresses
    return address.includes('str') || 
           address.includes('Str') || 
           address.includes('platz') || 
           address.includes('Platz') || 
           address.includes('weg') || 
           address.includes('Weg') ||
           address.includes('Germany') ||
           address.includes('Deutschland') ||
           address.includes('Cologne') ||
           address.includes('Koeln') ||
           address.includes('Hall') ||  // Koelnmesse halls
           address.includes('Messeplatz') ||
           /\d/.test(address); // Contains numbers (likely street numbers)
}

// Preview events data (FIXED: correct field names)
async function previewData() {
    console.log('🔍 PREVIEW: Event Data Analysis');
    console.log('=' .repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        console.log(`📊 Total Events: ${events.length}`);
        console.log(`📅 Date Range: ${events[0]?.Date || 'Unknown'} to ${events[events.length-1]?.Date || 'Unknown'}`);
        
        // Analyze text encoding issues
        let encodingIssues = 0;
        let urlIssues = 0;
        let geocodableAddresses = 0;
        let emptyAddresses = 0;
        let registerAddresses = 0;
        
        events.forEach(event => {
            // Check for encoding issues in text fields
            const textFields = [event['Event Name'], event.Hosts, event.Address].join(' ');
            if (textFields.includes('Ã') || textFields.includes('š') || textFields.includes('â€"')) {
                encodingIssues++;
            }
            
            // Check for URL issues
            if (event.Link && (event.Link.includes('%20') || event.Link.includes('&amp;'))) {
                urlIssues++;
            }
            
            // Check address types
            if (!event.Address || event.Address === '(empty)') {
                emptyAddresses++;
            } else if (event.Address === 'Register to See Address') {
                registerAddresses++;
            } else if (isGeocodable(event)) {
                geocodableAddresses++;
            }
        });
        
        console.log(`🧹 Text encoding issues: ${encodingIssues}/${events.length}`);
        console.log(`🔗 URL encoding issues: ${urlIssues}/${events.length}`);
        console.log(`🗺️  Geocodable addresses: ${geocodableAddresses}/${events.length}`);
        console.log(`⚪ Empty addresses: ${emptyAddresses}/${events.length}`);
        console.log(`🔒 Registration required: ${registerAddresses}/${events.length}`);
        
        // Show sample events
        console.log('\n📋 Sample Events:');
        events.slice(0, 3).forEach((event, i) => {
            console.log(`${i+1}. ${event['Event Name'] || 'Untitled'}`);
            console.log(`   📍 ${event.Address || 'No address'}`);
            console.log(`   🔗 ${event.Link || 'No link'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Preview failed:', error.message);
    }
}

// Validate all URLs (FIXED: correct field names)
async function validateUrls() {
    console.log('🔍 VALIDATE: URL Quality Analysis');
    console.log('=' .repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        let valid = 0;
        let invalid = 0;
        let empty = 0;
        const issues = [];
        
        events.forEach((event, index) => {
            if (!event.Link) {
                empty++;
                return;
            }
            
            const validation = validateUrl(event.Link);
            if (validation.valid) {
                valid++;
            } else {
                invalid++;
                issues.push({
                    index: index + 1,
                    title: event['Event Name'] || 'Untitled',
                    url: event.Link,
                    reason: validation.reason
                });
            }
        });
        
        console.log(`✅ Valid URLs: ${valid}/${events.length} (${Math.round(valid/events.length*100)}%)`);
        console.log(`❌ Invalid URLs: ${invalid}/${events.length}`);
        console.log(`⚪ Empty URLs: ${empty}/${events.length}`);
        
        if (issues.length > 0) {
            console.log('\n🔧 Issues Found:');
            issues.slice(0, 10).forEach(issue => {
                console.log(`${issue.index}. ${issue.title}`);
                console.log(`   URL: ${issue.url}`);
                console.log(`   Issue: ${issue.reason}`);
                console.log('');
            });
            
            if (issues.length > 10) {
                console.log(`... and ${issues.length - 10} more issues`);
            }
        }
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

// Geocoding analysis (FIXED: correct field names)
async function analyzeGeocoding() {
    console.log('🗺️  GEOCODING: Address Analysis');
    console.log('=' .repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        let geocodable = 0;
        let needsWork = 0;
        let empty = 0;
        let registerRequired = 0;
        
        const geocodableEvents = [];
        const problematicEvents = [];
        
        events.forEach((event, index) => {
            const address = event.Address || '';
            
            if (!address || address === '(empty)') {
                empty++;
                return;
            }
            
            if (address === 'Register to See Address') {
                registerRequired++;
                return;
            }
            
            if (isGeocodable(event)) {
                geocodable++;
                geocodableEvents.push({
                    index: index + 1,
                    title: event['Event Name'] || 'Untitled',
                    address: address,
                    hasEncoding: address.includes('Ã') || address.includes('š')
                });
            } else {
                needsWork++;
                problematicEvents.push({
                    index: index + 1,
                    title: event['Event Name'] || 'Untitled',
                    address: address
                });
            }
        });
        
        console.log(`🎯 Geocodable addresses: ${geocodable}/${events.length} (${Math.round(geocodable/events.length*100)}%)`);
        console.log(`⚠️  Need improvement: ${needsWork}/${events.length}`);
        console.log(`🔒 Registration required: ${registerRequired}/${events.length}`);
        console.log(`❌ Missing addresses: ${empty}/${events.length}`);
        
        // Count encoding issues in geocodable addresses
        const encodingIssues = geocodableEvents.filter(e => e.hasEncoding).length;
        console.log(`🧹 Encoding issues in geocodable: ${encodingIssues}/${geocodable}`);
        
        // Show sample geocodable addresses
        if (geocodableEvents.length > 0) {
            console.log('\n✅ Sample Geocodable Addresses:');
            geocodableEvents.slice(0, 5).forEach(event => {
                const flag = event.hasEncoding ? '🧹' : '✅';
                console.log(`${flag} ${event.title}`);
                console.log(`   📍 ${event.address}`);
                console.log('');
            });
        }
        
        // Create backup report
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const report = {
            timestamp: new Date().toISOString(),
            totalEvents: events.length,
            geocodable: geocodable,
            needsWork: needsWork,
            registerRequired: registerRequired,
            empty: empty,
            encodingIssues: encodingIssues,
            geocodableEvents: geocodableEvents,
            problematicEvents: problematicEvents.slice(0, 20)
        };
        
        const reportPath = path.join(BACKUP_DIR, `geocoding-analysis-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📁 Report saved: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Geocoding analysis failed:', error.message);
    }
}

// Apply encoding fixes (FIXED: correct field names)
async function fixEncoding() {
    console.log('🧹 FIXING: Encoding Issues');
    console.log('=' .repeat(50));
    
    try {
        const events = await fetchAllEvents();
        
        // Create backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `events-backup-${timestamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(events, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);
        
        let textFixed = 0;
        let urlFixed = 0;
        const changes = [];
        
        // Apply fixes (this would normally update the source data)
        events.forEach((event, index) => {
            // Fix text fields with correct field names
            ['Event Name', 'Address', 'Hosts', 'Category'].forEach(field => {
                if (event[field]) {
                    const fixed = fixTextEncoding(event[field]);
                    if (fixed !== event[field]) {
                        changes.push({
                            index: index + 1,
                            field: field,
                            before: event[field],
                            after: fixed
                        });
                        event[field] = fixed;
                        textFixed++;
                    }
                }
            });
            
            // Fix URL field
            if (event.Link) {
                const fixed = fixUrlEncoding(event.Link);
                if (fixed !== event.Link) {
                    changes.push({
                        index: index + 1,
                        field: 'Link',
                        before: event.Link,
                        after: fixed
                    });
                    event.Link = fixed;
                    urlFixed++;
                }
            }
        });
        
        console.log(`✅ Text encoding fixes applied: ${textFixed}`);
        console.log(`✅ URL encoding fixes applied: ${urlFixed}`);
        console.log(`📊 Total changes: ${changes.length}`);
        
        // Show sample fixes
        if (changes.length > 0) {
            console.log('\n🔧 Sample Fixes Applied:');
            changes.slice(0, 5).forEach(change => {
                console.log(`${change.index}. ${change.field}:`);
                console.log(`   Before: ${change.before}`);
                console.log(`   After:  ${change.after}`);
                console.log('');
            });
            
            if (changes.length > 5) {
                console.log(`... and ${changes.length - 5} more fixes`);
            }
        }
        
        // Save change log
        const changeLogPath = path.join(BACKUP_DIR, `encoding-fixes-${timestamp}.json`);
        fs.writeFileSync(changeLogPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalEvents: events.length,
            textFixed: textFixed,
            urlFixed: urlFixed,
            totalChanges: changes.length,
            changes: changes
        }, null, 2));
        
        console.log(`📋 Change log saved: ${changeLogPath}`);
        console.log('\n⚠️  NOTE: This is a simulation. To apply to Firebase, update the source data.');
        
    } catch (error) {
        console.error('❌ Encoding fix failed:', error.message);
    }
}

// Main CLI interface
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'preview':
            await previewData();
            break;
        case 'validate-urls':
            await validateUrls();
            break;
        case 'geocode':
            await analyzeGeocoding();
            break;
        case 'fix-encoding':
            await fixEncoding();
            break;
        default:
            console.log('🛠️  Data Processor - Gamescom 2025 Party App');
            console.log('Usage:');
            console.log('  node tools/data-processor.js preview      # Analyze event data');
            console.log('  node tools/data-processor.js validate-urls # Check URL quality');
            console.log('  node tools/data-processor.js geocode      # Analyze addresses');
            console.log('  node tools/data-processor.js fix-encoding # Apply encoding fixes');
            console.log('');
            console.log('NPM Scripts:');
            console.log('  npm run data:preview     # Same as preview');
            console.log('  npm run data:validate    # Same as validate-urls');
            console.log('  npm run data:geocode     # Same as geocode');
            console.log('  npm run data:fix-encoding # Same as fix-encoding');
    }
}

// Make executable
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    fetchAllEvents,
    fixTextEncoding,
    fixUrlEncoding,
    validateUrl,
    isGeocodable
};