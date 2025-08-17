/**
 * 🚨 EMERGENCY PERFORMANCE CLEANUP
 * 
 * Immediate removal of critical conflicts and dead code
 * Fixes premium party list loading issues
 */

const fs = require('fs');
const path = require('path');

class EmergencyCleanup {
  constructor() {
    this.removed = [];
    this.conflicts = [];
    this.preserved = [];
  }

  async executeCleanup() {
    console.log('🚨 EMERGENCY CLEANUP - Fixing critical conflicts...\n');
    
    // Phase 1: Remove legacy party systems that conflict with premium
    await this.removeLegacyPartySystems();
    
    // Phase 2: Remove unused legacy app classes
    await this.removeLegacyApps();
    
    // Phase 3: Consolidate critical CSS conflicts
    await this.fixCriticalCSS();
    
    // Phase 4: Update index.html to only load production files
    await this.optimizeIndexHtml();
    
    // Phase 5: Remove large dead code files
    await this.removeDeadCode();
    
    this.generateReport();
  }

  async removeLegacyPartySystems() {
    console.log('🎯 Removing legacy party systems conflicting with premium...');
    
    const legacyPartyFiles = [
      // Legacy party JavaScript files  
      'frontend/src/js/party-cards.js',
      'frontend/src/js/party-card.js',
      'frontend/src/assets/js/party-discovery.js',
      'frontend/src/assets/js/party-discovery-demo.js',
      'frontend/src/assets/js/party-flow.js',
      'frontend/src/assets/js/party-search.js',
      'frontend/src/assets/js/party-showcase-signature.js',
      'frontend/src/assets/js/party-card-interactions.js',
      'frontend/src/js/parties-polish.js',
      'frontend/src/js/parties-infinite.js',
      
      // Legacy party CSS files
      'frontend/src/assets/css/party-discovery.css',
      'frontend/src/assets/css/party-search.css',
      'frontend/src/assets/css/party-flow-container.css',
      'frontend/src/assets/css/party-cards-modern.css',
      'frontend/src/assets/css/party-cards-ive.css',
      'frontend/src/assets/css/party-cards-signature.css',
      'frontend/src/assets/css/party-carousel-modern.css'
    ];

    // Keep only the premium party system
    const preserveFiles = [
      'frontend/src/assets/js/party-list-premium.js',
      'frontend/src/assets/css/party-list-premium.css',
      'frontend/src/assets/js/party-cache-manager.js'
    ];

    for (const file of legacyPartyFiles) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          this.removed.push({ file, reason: 'legacy-party-conflict', type: 'critical' });
          console.log(`✅ Removed: ${file}`);
        } catch (error) {
          console.warn(`⚠️  Could not remove: ${file}`);
        }
      }
    }

    preserveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.preserved.push(file);
      }
    });
  }

  async removeLegacyApps() {
    console.log('🎯 Removing legacy app classes conflicting with UnifiedConferenceApp...');
    
    const legacyAppFiles = [
      'frontend/src/js/app.js', // ProfessionalIntelligenceApp
      'frontend/src/js/maps.js', // GamescomMapsApp  
      'frontend/src/js/calendar.js', // GamescomCalendarApp
      'frontend/src/js/referral.js', // GamescomReferralApp
      'frontend/src/js/navigation.js', // NavigationManager (old)
      'frontend/src/js/navigation-optimized.js', // OptimizedNavigationManager
      'frontend/src/js/cache-manager.js', // CacheManager (old)
    ];

    // Keep only the unified systems
    const preserveFiles = [
      'frontend/src/assets/js/app-unified.js', // UnifiedConferenceApp
      'frontend/src/assets/js/party-cache-manager.js', // New cache system
      'frontend/src/assets/js/router-2panel-lite.js' // Current router
    ];

    for (const file of legacyAppFiles) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          this.removed.push({ file, reason: 'legacy-app-conflict', type: 'critical' });
          console.log(`✅ Removed: ${file}`);
        } catch (error) {
          console.warn(`⚠️  Could not remove: ${file}`);
        }
      }
    }
  }

  async fixCriticalCSS() {
    console.log('🎯 Fixing critical CSS conflicts...');
    
    // Remove duplicate CSS token systems
    const duplicateTokenFiles = [
      'frontend/src/css/tokens.css', // Old tokens
      'frontend/src/assets/css/tokens/color-tokens.css', // Conflicting tokens
      'frontend/src/assets/css/color-tokens.old.css', // Obviously old
      'frontend/src/css/design-system.css', // Old design system
      'frontend/src/css/design-system-enhanced.css', // Duplicate
    ];

    // Keep only the unified token system
    const preserveCSSFiles = [
      'frontend/src/assets/css/tokens.css', // Main tokens
      'frontend/src/assets/css/app-unified.css', // Unified app styles
      'frontend/src/assets/css/party-list-premium.css' // Premium party styles
    ];

    for (const file of duplicateTokenFiles) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          this.removed.push({ file, reason: 'duplicate-css-tokens', type: 'high' });
          console.log(`✅ Removed: ${file}`);
        } catch (error) {
          console.warn(`⚠️  Could not remove: ${file}`);
        }
      }
    }

    // Remove unused layout CSS files
    const unusedLayoutFiles = [
      'frontend/src/css/layout.css',
      'frontend/src/css/layout-polish.css', 
      'frontend/src/css/panels.css',
      'frontend/src/assets/css/panel-stack.css',
      'frontend/src/assets/css/panels-production.css',
      'frontend/src/assets/css/panels-2panel.css'
    ];

    for (const file of unusedLayoutFiles) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          this.removed.push({ file, reason: 'unused-layout-css', type: 'medium' });
          console.log(`✅ Removed: ${file}`);
        } catch (error) {
          console.warn(`⚠️  Could not remove: ${file}`);
        }
      }
    }
  }

  async optimizeIndexHtml() {
    console.log('🎯 Optimizing index.html to load only production files...');
    
    const indexPath = 'frontend/src/index.html';
    if (!fs.existsSync(indexPath)) {
      console.warn('⚠️  index.html not found');
      return;
    }

    // Read current index.html
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Remove any references to removed files
    const removedPaths = this.removed.map(r => r.file.replace('frontend/src/', ''));
    
    removedPaths.forEach(path => {
      const patterns = [
        new RegExp(`<script[^>]*src="[^"]*${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"[^>]*></script>`, 'g'),
        new RegExp(`<link[^>]*href="[^"]*${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"[^>]*>`, 'g')
      ];
      
      patterns.forEach(pattern => {
        content = content.replace(pattern, '');
      });
    });

    // Clean up extra whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Write optimized index.html
    fs.writeFileSync(indexPath, content);
    console.log('✅ Optimized index.html');
  }

  async removeDeadCode() {
    console.log('🎯 Removing large dead code files...');
    
    // These are clearly unused based on the audit
    const deadFiles = [
      // Old controller systems (replaced by unified app)
      'frontend/src/js/controllers/AppController.js',
      'frontend/src/js/controllers/events.js',
      'frontend/src/js/controllers/people.js',
      
      // Old service files
      'frontend/src/js/services/resilience.js',
      'frontend/src/js/services/connections.js',
      'frontend/src/js/services/icsSync.js',
      
      // Old component files
      'frontend/src/js/components/cards.js',
      'frontend/src/js/components/demo.js',
      
      // Old manager files
      'frontend/src/js/opportunity-toggle.js',
      'frontend/src/js/proximity-manager.js',
      'frontend/src/js/conference-manager.js',
      'frontend/src/js/search-manager.js',
      
      // Development/config files not needed in production
      'frontend/src/config/dev-server.js',
      'frontend/src/config/environments.js',
      
      // Old CSS files
      'frontend/src/css/onboarding.css',
      'frontend/src/css/opportunity-system.css',
      'frontend/src/css/proximity-system.css',
      'frontend/src/css/conference-system.css',
      'frontend/src/css/slack-theme.css',
      'frontend/src/css/hotspots-page.css'
    ];

    for (const file of deadFiles) {
      if (fs.existsSync(file)) {
        try {
          const size = fs.statSync(file).size;
          fs.unlinkSync(file);
          this.removed.push({ file, reason: 'dead-code', type: 'cleanup', size });
          console.log(`✅ Removed: ${file} (${(size/1024).toFixed(1)}KB)`);
        } catch (error) {
          console.warn(`⚠️  Could not remove: ${file}`);
        }
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🚨 EMERGENCY CLEANUP COMPLETE');
    console.log('='.repeat(60));
    
    const totalRemoved = this.removed.length;
    const totalSize = this.removed.reduce((sum, item) => sum + (item.size || 0), 0);
    
    console.log(`🗑️  Files Removed: ${totalRemoved}`);
    console.log(`💾 Size Freed: ${(totalSize / 1024).toFixed(1)}KB`);
    console.log(`🛡️  Files Preserved: ${this.preserved.length}`);
    
    // Group by reason
    const reasons = {};
    this.removed.forEach(item => {
      if (!reasons[item.reason]) reasons[item.reason] = 0;
      reasons[item.reason]++;
    });
    
    console.log('\n📊 Cleanup Breakdown:');
    Object.entries(reasons).forEach(([reason, count]) => {
      console.log(`   ${reason}: ${count} files`);
    });
    
    console.log('\n🚀 Critical Issues Fixed:');
    console.log('   ✅ Legacy party systems removed');
    console.log('   ✅ Conflicting app classes removed');
    console.log('   ✅ Duplicate CSS tokens removed');
    console.log('   ✅ Premium party list should now load');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Test that premium party list loads correctly');
    console.log('   2. Verify unified app functionality');
    console.log('   3. Deploy optimized build');
    
    // Save cleanup report
    const report = {
      timestamp: new Date().toISOString(),
      removed: this.removed,
      preserved: this.preserved,
      summary: {
        totalRemoved,
        totalSize,
        reasons
      }
    };
    
    fs.writeFileSync('tools/data-backups/emergency-cleanup-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Cleanup report: tools/data-backups/emergency-cleanup-report.json');
    console.log('='.repeat(60));
  }
}

// Execute cleanup
if (require.main === module) {
  const cleanup = new EmergencyCleanup();
  cleanup.executeCleanup().catch(console.error);
}

module.exports = EmergencyCleanup;