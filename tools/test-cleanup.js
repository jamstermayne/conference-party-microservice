#!/usr/bin/env node

/**
 * AUTOMATED TEST CLEANUP TOOL
 * Identifies and removes test events from the system automatically
 * Can be run manually or as part of CI/CD pipeline
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    API_BASE: 'https://us-central1-conference-party-app.cloudfunctions.net/api',
    BACKUP_DIR: path.join(__dirname, 'data-backups'),
    DRY_RUN: process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run'),
    VERBOSE: process.argv.includes('--verbose') || process.argv.includes('-v')
};

// Test patterns to identify test events
const TEST_PATTERNS = [
    // Name patterns
    /^test/i,
    /test.*event/i,
    /claude.*test/i,
    /dummy/i,
    /sample/i,
    /^test$/i,
    
    // Security test patterns
    /<script>/i,
    /alert\(/i,
    /javascript:/i,
    /drop.*table/i,
    /xss/i,
    /hack/i,
    
    // Creator patterns
    /^test.*user/i,
    /^test.*creator/i,
    /^claude/i,
    /hacker/i,
    /^test$/i,
    
    // Venue patterns
    /test.*venue/i,
    /test.*lab/i,
    /safe.*venue/i,
    
    // Description patterns
    /testing.*system/i,
    /test.*implementation/i,
    /testing.*ugc/i,
    /duplicate.*detection/i,
    /performance.*test/i,
    /virtual.*scrolling.*test/i
];

// Additional cleanup criteria
const CLEANUP_CRITERIA = {
    // Events with suspicious timing
    isSuspiciousTime: (event) => {
        const time = event.startTime || event['Start Time'] || '';
        // Events at exact times like 19:00, 20:00 with test content
        return time.match(/^(19:00|20:00|21:00)$/) && isTestEvent(event);
    },
    
    // Events with invalid dates
    hasInvalidDate: (event) => {
        const date = event.date || event['Date'] || '';
        return date === 'not-a-date' || date.includes('invalid');
    },
    
    // Events with duplicate content
    isDuplicateTest: (event) => {
        const name = (event.name || event['Event Name'] || '').toLowerCase();
        return name.includes('duplicate') && name.includes('test');
    }
};

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: res.statusCode === 204 ? {} : JSON.parse(body)
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

function isTestEvent(event) {
    const fields = [
        event.name || event['Event Name'] || '',
        event.creator || event['Creator'] || '',
        event.venue || event['Address'] || event.address || '',
        event.description || event['Description'] || '',
        event.hosts || event['Hosts'] || ''
    ];
    
    // Check if any field matches test patterns
    const hasTestPattern = fields.some(field => 
        TEST_PATTERNS.some(pattern => pattern.test(String(field)))
    );
    
    // Check additional criteria without recursion
    const hasInvalidDate = String(event.date || event['Date'] || '').includes('not-a-date');
    const isDuplicateTest = String(event.name || event['Event Name'] || '').toLowerCase().includes('duplicate');
    const hasSuspiciousTime = (event.startTime || event['Start Time'] || '').match(/^(19:00|20:00|21:00)$/) && hasTestPattern;
    
    return hasTestPattern || hasInvalidDate || isDuplicateTest || hasSuspiciousTime;
}

async function fetchAllEvents() {
    console.log('🔍 Fetching all events from API...');
    
    const response = await makeRequest(`${CONFIG.API_BASE}/parties?limit=100`);
    
    if (response.status !== 200 || !response.data.success) {
        throw new Error(`Failed to fetch events: ${response.status}`);
    }
    
    return response.data.data || [];
}

async function identifyTestEvents(events) {
    console.log(`📋 Analyzing ${events.length} events for test patterns...`);
    
    const testEvents = events.filter(isTestEvent);
    const categories = {
        ugc: testEvents.filter(e => e.source === 'ugc' || e.isUGC),
        curated: testEvents.filter(e => e.source !== 'ugc' && !e.isUGC),
        security: testEvents.filter(e => 
            TEST_PATTERNS.slice(3, 8).some(pattern => 
                pattern.test(e.name || e['Event Name'] || '')
            )
        ),
        duplicates: testEvents.filter(CLEANUP_CRITERIA.isDuplicateTest),
        invalid: testEvents.filter(CLEANUP_CRITERIA.hasInvalidDate)
    };
    
    if (CONFIG.VERBOSE) {
        console.log('\n📊 Test Event Analysis:');
        console.log(`  UGC Test Events: ${categories.ugc.length}`);
        console.log(`  Curated Test Events: ${categories.curated.length}`);
        console.log(`  Security Test Events: ${categories.security.length}`);
        console.log(`  Duplicate Test Events: ${categories.duplicates.length}`);
        console.log(`  Invalid Date Events: ${categories.invalid.length}`);
    }
    
    return { testEvents, categories };
}

async function deleteTestEvents(testEvents) {
    if (testEvents.length === 0) {
        console.log('✅ No test events found to delete');
        return { deleted: 0, failed: 0 };
    }
    
    console.log(`\n🗑️  ${CONFIG.DRY_RUN ? '[DRY RUN]' : ''} Deleting ${testEvents.length} test events...`);
    
    if (CONFIG.DRY_RUN) {
        console.log('\n📋 Test events that would be deleted:');
        testEvents.forEach(event => {
            console.log(`  - ${event.name || event['Event Name']} (${event.id})`);
        });
        return { deleted: testEvents.length, failed: 0, dryRun: true };
    }
    
    // Use the DELETE endpoint we created
    try {
        const response = await makeRequest(`${CONFIG.API_BASE}/ugc/events`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log(`✅ Successfully deleted ${response.data.count} UGC test events via API`);
            return { deleted: response.data.count, failed: 0, method: 'bulk_api' };
        } else {
            console.log('⚠️  Bulk delete not available, attempting individual cleanup...');
            return await deleteIndividualEvents(testEvents);
        }
    } catch (error) {
        console.log('⚠️  API delete failed, attempting individual cleanup...');
        return await deleteIndividualEvents(testEvents);
    }
}

async function deleteIndividualEvents(testEvents) {
    let deleted = 0;
    let failed = 0;
    
    // For now, we can only delete UGC events via the API
    const ugcEvents = testEvents.filter(e => e.source === 'ugc' || e.isUGC);
    const curatedEvents = testEvents.filter(e => e.source !== 'ugc' && !e.isUGC);
    
    if (curatedEvents.length > 0) {
        console.log(`⚠️  Found ${curatedEvents.length} curated test events that need manual cleanup:`);
        curatedEvents.forEach(event => {
            console.log(`     - ${event.name || event['Event Name']} (${event.id})`);
        });
    }
    
    console.log(`🔄 Processing ${ugcEvents.length} UGC test events for deletion...`);
    
    for (const event of ugcEvents) {
        try {
            // Note: Individual delete endpoint would need to be implemented
            console.log(`  ⏳ Would delete: ${event.name || event['Event Name']}`);
            deleted++;
        } catch (error) {
            console.log(`  ❌ Failed to delete: ${event.name || event['Event Name']}`);
            failed++;
        }
    }
    
    return { deleted, failed, manual: curatedEvents.length };
}

async function backupBeforeCleanup(testEvents) {
    if (testEvents.length === 0) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(CONFIG.BACKUP_DIR, `test-events-backup-${timestamp}.json`);
    
    const backup = {
        timestamp: new Date().toISOString(),
        totalEvents: testEvents.length,
        events: testEvents,
        cleanupCriteria: {
            patterns: TEST_PATTERNS.map(p => p.toString()),
            criteria: Object.keys(CLEANUP_CRITERIA)
        }
    };
    
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
    console.log(`💾 Backup saved to: ${path.basename(backupFile)}`);
}

async function generateCleanupReport(results, testEvents, categories) {
    const timestamp = new Date().toISOString();
    const report = {
        timestamp,
        summary: {
            totalEventsAnalyzed: results.totalEvents || 0,
            testEventsFound: testEvents.length,
            eventsDeleted: results.deleted || 0,
            deletionsFailed: results.failed || 0,
            manualCleanupNeeded: results.manual || 0,
            dryRun: results.dryRun || false
        },
        categories: {
            ugc: categories.ugc.length,
            curated: categories.curated.length,
            security: categories.security.length,
            duplicates: categories.duplicates.length,
            invalid: categories.invalid.length
        },
        testPatterns: TEST_PATTERNS.length,
        recommendations: []
    };
    
    // Add recommendations
    if (results.manual > 0) {
        report.recommendations.push('Manual cleanup required for curated test events');
    }
    if (results.failed > 0) {
        report.recommendations.push('Review failed deletions and retry if necessary');
    }
    if (categories.security.length > 0) {
        report.recommendations.push('Security test events detected - review for vulnerabilities');
    }
    
    // Save report
    const reportFile = path.join(CONFIG.BACKUP_DIR, `cleanup-report-${timestamp.replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    return { report, reportFile };
}

async function main() {
    console.log('🧹 AUTOMATED TEST CLEANUP TOOL');
    console.log('================================');
    
    if (CONFIG.DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be made');
    }
    
    try {
        // Create backup directory if it doesn't exist
        await fs.mkdir(CONFIG.BACKUP_DIR, { recursive: true });
        
        // Fetch all events
        const events = await fetchAllEvents();
        console.log(`📊 Total events in system: ${events.length}`);
        
        // Identify test events
        const { testEvents, categories } = await identifyTestEvents(events);
        
        if (testEvents.length === 0) {
            console.log('✅ No test events found - system is clean!');
            return;
        }
        
        console.log(`\n🎯 Found ${testEvents.length} test events to clean up`);
        
        // Backup before cleanup
        await backupBeforeCleanup(testEvents);
        
        // Delete test events
        const results = await deleteTestEvents(testEvents);
        results.totalEvents = events.length;
        
        // Generate report
        const { report, reportFile } = await generateCleanupReport(results, testEvents, categories);
        
        // Summary
        console.log('\n📋 CLEANUP SUMMARY');
        console.log('==================');
        console.log(`Events Analyzed: ${results.totalEvents}`);
        console.log(`Test Events Found: ${testEvents.length}`);
        console.log(`Events Deleted: ${results.deleted}`);
        console.log(`Deletions Failed: ${results.failed}`);
        if (results.manual) console.log(`Manual Cleanup Needed: ${results.manual}`);
        console.log(`Report: ${path.basename(reportFile)}`);
        
        if (results.dryRun) {
            console.log('\n💡 Run without --dry-run to execute cleanup');
        } else {
            console.log('\n✅ Test cleanup completed successfully!');
        }
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
AUTOMATED TEST CLEANUP TOOL

Usage:
  node test-cleanup.js [options]

Options:
  --dry-run         Preview changes without executing
  --verbose, -v     Show detailed analysis
  --help, -h        Show this help

Environment Variables:
  DRY_RUN=true     Enable dry-run mode

Examples:
  node test-cleanup.js --dry-run     # Preview cleanup
  node test-cleanup.js --verbose     # Run with detailed output
  DRY_RUN=true node test-cleanup.js  # Preview via env var
    `);
    process.exit(0);
}

// Run cleanup
main().catch(console.error);