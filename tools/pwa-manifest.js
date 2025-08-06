#!/usr/bin/env node

/**
 * 📱 GAMESCOM 2025 - PWA MANIFEST GENERATOR
 * 
 * Focused tool: Generate PWA manifest with icons and shortcuts
 * Part of Tool #8 modular architecture
 * 
 * Author: Claude Sonnet 4
 * Date: August 6, 2025
 */

const fs = require('fs').promises;
const path = require('path');

class ManifestGenerator {
    constructor() {
        this.version = '1.0.0';
        this.appName = 'Gamescom 2025 Party Discovery';
        this.shortName = 'GamesCom Parties';
        this.themeColor = '#ff6b6b';
        this.backgroundColor = '#1a1a1a';
    }

    /**
     * 📱 Generate complete PWA manifest
     */
    async generateManifest(eventData = {}) {
        const manifest = {
            name: this.appName,
            short_name: this.shortName,
            description: "Discover the best parties and events at Gamescom 2025 in Cologne",
            start_url: "/",
            display: "standalone",
            background_color: this.backgroundColor,
            theme_color: this.themeColor,
            orientation: "portrait-primary",
            categories: ["entertainment", "social", "events"],
            lang: "en",
            dir: "ltr",
            
            icons: this.generateIconSet(),
            screenshots: this.generateScreenshots(),
            shortcuts: this.generateShortcuts(),
            
            // PWA-specific metadata
            scope: "/",
            id: "gamescom-party-discovery",
            launch_handler: {
                client_mode: "navigate-existing"
            },
            
            // Display overrides for different platforms
            display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
            
            // Protocol handlers
            protocol_handlers: [
                {
                    protocol: "web+gamescom",
                    url: "/?event=%s"
                }
            ],
            
            // Related applications
            related_applications: [],
            prefer_related_applications: false
        };

        return manifest;
    }

    /**
     * 🎨 Generate icon set for all platforms
     */
    generateIconSet() {
        const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
        
        return sizes.map(size => ({
            src: `/images/icon-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: "image/png",
            purpose: "any maskable"
        }));
    }

    /**
     * 📸 Generate app screenshots
     */
    generateScreenshots() {
        return [
            {
                src: "/images/screenshot-mobile.png",
                sizes: "390x844",
                type: "image/png",
                form_factor: "narrow",
                label: "Mobile event discovery"
            },
            {
                src: "/images/screenshot-desktop.png", 
                sizes: "1280x720",
                type: "image/png",
                form_factor: "wide",
                label: "Desktop event browser"
            }
        ];
    }

    /**
     * ⚡ Generate app shortcuts
     */
    generateShortcuts() {
        return [
            {
                name: "Search Events",
                short_name: "Search",
                description: "Search for parties and events", 
                url: "/?action=search",
                icons: [{ src: "/images/search-icon.png", sizes: "96x96" }]
            },
            {
                name: "Today's Events",
                short_name: "Today", 
                description: "See what's happening today",
                url: "/?filter=today",
                icons: [{ src: "/images/today-icon.png", sizes: "96x96" }]
            },
            {
                name: "My Calendar",
                short_name: "Calendar",
                description: "View saved events",
                url: "/?view=calendar", 
                icons: [{ src: "/images/calendar-icon.png", sizes: "96x96" }]
            },
            {
                name: "Map View",
                short_name: "Map",
                description: "Browse events on map",
                url: "/?view=map", 
                icons: [{ src: "/images/map-icon.png", sizes: "96x96" }]
            }
        ];
    }

    /**
     * 💾 Save manifest to file
     */
    async saveManifest(outputPath, eventData = {}) {
        try {
            const manifest = await this.generateManifest(eventData);
            const manifestJson = JSON.stringify(manifest, null, 2);
            
            await fs.writeFile(outputPath, manifestJson);
            
            console.log(`✅ PWA Manifest saved: ${path.relative(process.cwd(), outputPath)}`);
            console.log(`📱 App Name: ${manifest.name}`);
            console.log(`🎨 Theme Color: ${manifest.theme_color}`);
            console.log(`📱 Icons: ${manifest.icons.length} sizes`);
            console.log(`⚡ Shortcuts: ${manifest.shortcuts.length} actions`);
            console.log(`📸 Screenshots: ${manifest.screenshots.length} form factors`);
            
            return manifest;

        } catch (error) {
            console.error('❌ Failed to save manifest:', error.message);
            throw error;
        }
    }

    /**
     * 🧪 Test manifest generation
     */
    async testGeneration() {
        console.log('🧪 Testing PWA manifest generation...');
        
        const manifest = await this.generateManifest();
        const sizeKB = Math.round(JSON.stringify(manifest).length / 1024);
        
        console.log(`✅ PWA Manifest generated: ${sizeKB}KB`);
        console.log(`✅ Icons: ${manifest.icons.length} sizes (${manifest.icons[0].sizes} to ${manifest.icons[manifest.icons.length-1].sizes})`);
        console.log(`✅ Shortcuts: ${manifest.shortcuts.length} quick actions`);
        console.log(`✅ Screenshots: ${manifest.screenshots.length} form factors`);
        console.log(`✅ Display modes: ${manifest.display_override.length} fallbacks`);
        
        return manifest;
    }

    /**
     * 🔍 Validate manifest structure
     */
    async validateManifest(manifest) {
        const required = ['name', 'start_url', 'display', 'icons'];
        const missing = required.filter(field => !manifest[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (!manifest.icons || manifest.icons.length === 0) {
            throw new Error('At least one icon is required');
        }

        console.log('✅ Manifest validation passed');
        return true;
    }
}

// Export for use by orchestrator
module.exports = ManifestGenerator;

// CLI execution
if (require.main === module) {
    const generator = new ManifestGenerator();
    generator.testGeneration()
        .then(manifest => generator.validateManifest(manifest))
        .then(() => console.log('✅ PWA Manifest generator ready'))
        .catch(err => console.error('❌ Test failed:', err.message));
}