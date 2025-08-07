#!/usr/bin/env node

/**
 * 🏗️ MODULAR FRONTEND BUILDER - Tool #10
 * 
 * Clean, maintainable architecture with separation of concerns
 * - Orchestrator pattern (this file stays small)
 * - Template files (separate concerns)
 * - Modular builders (focused responsibilities)
 * - Configuration-driven (easy to customize)
 * 
 * Author: Claude + Human Collaboration
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration (externalized for easy maintenance)
const CONFIG = {
    version: '1.0.0',
    apiBase: 'https://us-central1-conference-party-app.cloudfunctions.net',
    paths: {
        public: './public',
        templates: './tools/templates',
        tools: './tools'
    },
    build: {
        htmlFile: 'index.html',
        cssFile: 'css/main.css',
        jsFiles: ['js/api.js', 'js/app.js'],
        manifestFile: 'manifest.json',
        serviceWorkerFile: 'sw.js'
    }
};

/**
 * 🎯 Main Frontend Builder - Orchestrator Pattern
 * Coordinates modular builders, stays small and focused
 */
class FrontendBuilder {
    constructor(config = CONFIG) {
        this.config = config;
        this.builders = {};
        this.loadBuilders();
    }

    /**
     * Load modular builders
     */
    loadBuilders() {
        this.builders = {
            html: new HTMLBuilder(this.config),
            css: new CSSBuilder(this.config),
            js: new JSBuilder(this.config),
            pwa: new PWABuilder(this.config)
        };
    }

    /**
     * 🚀 Main build orchestration
     */
    async build() {
        console.log(`🏗️ Frontend Builder v${this.config.version}`);
        console.log('🔧 Building modular frontend...\n');

        try {
            // Ensure directories
            await this.ensureDirectories();

            // Build components in parallel where possible
            const buildTasks = [
                this.buildHTML(),
                this.buildCSS(),
                this.buildJS(),
                this.buildPWA()
            ];

            await Promise.all(buildTasks);

            console.log('\n✅ Frontend build complete:');
            console.log(`📁 Output: ${this.config.paths.public}`);
            console.log(`🚀 Ready: npm run dev`);

            return { success: true, config: this.config };

        } catch (error) {
            console.error('❌ Build failed:', error.message);
            throw error;
        }
    }

    /**
     * 📁 Ensure directory structure
     */
    async ensureDirectories() {
        const dirs = [
            this.config.paths.public,
            path.join(this.config.paths.public, 'css'),
            path.join(this.config.paths.public, 'js'),
            path.join(this.config.paths.public, 'offline-data')
        ];

        await Promise.all(dirs.map(dir => 
            fs.mkdir(dir, { recursive: true })
        ));
    }

    /**
     * 📄 Build HTML
     */
    async buildHTML() {
        const html = await this.builders.html.build();
        await fs.writeFile(
            path.join(this.config.paths.public, this.config.build.htmlFile),
            html
        );
        console.log('✅ HTML built');
    }

    /**
     * 🎨 Build CSS
     */
    async buildCSS() {
        const css = await this.builders.css.build();
        await fs.writeFile(
            path.join(this.config.paths.public, this.config.build.cssFile),
            css
        );
        console.log('✅ CSS built');
    }

    /**
     * ⚡ Build JavaScript
     */
    async buildJS() {
        const jsAssets = await this.builders.js.build();
        
        for (const [filename, content] of Object.entries(jsAssets)) {
            await fs.writeFile(
                path.join(this.config.paths.public, filename),
                content
            );
        }
        console.log('✅ JavaScript built');
    }

    /**
     * 📱 Build PWA assets
     */
    async buildPWA() {
        const pwaAssets = await this.builders.pwa.build();
        
        for (const [filename, content] of Object.entries(pwaAssets)) {
            await fs.writeFile(
                path.join(this.config.paths.public, filename),
                typeof content === 'string' ? content : JSON.stringify(content, null, 2)
            );
        }
        console.log('✅ PWA assets built');
    }

    /**
     * 📋 Show help
     */
    showHelp() {
        console.log(`
🏗️ Modular Frontend Builder v${this.config.version}

USAGE:
  node tools/frontend-builder.js build    # Build frontend
  node tools/frontend-builder.js help     # Show this help

ARCHITECTURE:
📁 tools/frontend-builder.js       # Main orchestrator (this file)
📁 tools/builders/html-builder.js  # HTML generation
📁 tools/builders/css-builder.js   # CSS generation  
📁 tools/builders/js-builder.js    # JavaScript generation
📁 tools/builders/pwa-builder.js   # PWA assets
📁 tools/templates/               # Template files
📁 tools/template-provider.js     # Fallback templates

BENEFITS:
✅ Modular architecture (easy to maintain)
✅ Separation of concerns (focused responsibilities)
✅ Template-driven (easy to customize)
✅ Configuration-driven (flexible)
✅ Fallback system (resilient)
✅ Parallel building (fast)

CUSTOMIZATION:
- Edit templates in tools/templates/
- Modify CONFIG at top of this file
- Extend builders in tools/builders/
- Add new asset types easily
        `);
    }
}

/**
 * 🔧 Modular Builders (can be separate files)
 */

class HTMLBuilder {
    constructor(config) {
        this.config = config;
    }

    async build() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gamescom 2025 Events</title>
    <meta name="theme-color" content="#4A154B">
    <link rel="manifest" href="/manifest.json">
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>
    <div id="app">
        <header class="header">
            <h1>🎮 Gamescom 2025 Events</h1>
            <p>Professional gaming industry networking</p>
        </header>

        <section class="search">
            <input type="text" id="searchInput" placeholder="Search events..." class="search-input">
            <div id="filters" class="filters"></div>
        </section>

        <section id="events" class="events">
            <div class="loading">Loading events...</div>
        </section>

        <section class="cta">
            <h3>✨ Host Your Own Event</h3>
            <button id="createBtn" class="btn-primary">Create Event</button>
        </section>
    </div>

    <div id="modal" class="modal">
        <div class="modal-content">
            <span id="closeModal" class="close">&times;</span>
            <h2>Create Event</h2>
            <form id="eventForm">
                <input type="text" name="name" placeholder="Event name" required>
                <input type="date" name="date" required>
                <input type="time" name="startTime" required>
                <input type="text" name="venue" placeholder="Venue" required>
                <select name="eventType">
                    <option value="networking">Networking</option>
                    <option value="afterparty">Afterparty</option>
                    <option value="mixer">Mixer</option>
                    <option value="launch">Launch</option>
                </select>
                <textarea name="description" placeholder="Description (optional)"></textarea>
                <button type="submit">Create Event</button>
            </form>
            <div id="success" class="success hidden">
                <h3>✅ Event Created!</h3>
                <button onclick="app.closeModal()">Close</button>
            </div>
        </div>
    </div>

    <script>window.CONFIG = { apiBase: '${this.config.apiBase}' };</script>
    <script src="/js/api.js"></script>
    <script src="/js/app.js"></script>
</body>
</html>`;
    }
}

class CSSBuilder {
    constructor(config) {
        this.config = config;
    }

    async build() {
        return `/* Slack-inspired CSS - Modular & Maintainable */
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');

:root {
    --primary: #4A154B;
    --primary-dark: #3D0E3E;
    --background: #FFFFFF;
    --surface: #F8F8F8;
    --text: #1D1C1D;
    --text-muted: #616061;
    --border: #DDDDDD;
    --hover: #F4F4F4;
    --shadow: 0 4px 12px rgba(0,0,0,0.15);
    --radius: 6px;
    --spacing: 16px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: "Lato", -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.46;
    color: var(--text);
    background: var(--background);
}

/* Layout Components */
.header {
    background: var(--surface);
    padding: var(--spacing) calc(var(--spacing) * 1.5);
    border-bottom: 1px solid var(--border);
    text-align: center;
}

.header h1 {
    font-size: 28px;
    font-weight: 900;
    color: var(--primary);
    margin-bottom: 8px;
}

/* Search Components */
.search {
    padding: calc(var(--spacing) * 1.5);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
}

.search-input {
    width: 100%;
    padding: 12px var(--spacing);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    font-size: 15px;
    margin-bottom: var(--spacing);
}

.search-input:focus {
    outline: none;
    border-color: var(--primary);
}

/* Filter Components */
.filters {
    display: flex;
    gap: 8px;
    overflow-x: auto;
}

.filter {
    padding: 8px var(--spacing);
    border: 1px solid var(--border);
    border-radius: 20px;
    background: white;
    cursor: pointer;
    white-space: nowrap;
    font-size: 14px;
    transition: all 0.15s ease;
}

.filter:hover, .filter.active {
    background: var(--primary);
    color: white;
}

/* Event Components */
.events {
    padding: 0 calc(var(--spacing) * 1.5);
    max-height: 50vh;
    overflow-y: auto;
}

.event {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: calc(var(--spacing) * 1.5);
    margin-bottom: var(--spacing);
    cursor: pointer;
    transition: all 0.15s ease;
}

.event:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow);
}

.event h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
}

.event-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing);
    margin: var(--spacing) 0;
    padding: var(--spacing);
    background: var(--surface);
    border-radius: var(--radius);
    font-size: 14px;
    color: var(--text-muted);
}

/* Button Components */
.btn-primary, .btn-secondary {
    padding: 8px var(--spacing);
    border-radius: 4px;
    border: 1px solid;
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
    transition: all 0.15s ease;
}

.btn-primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.btn-primary:hover {
    background: var(--primary-dark);
}

.btn-secondary {
    background: white;
    color: var(--text);
    border-color: var(--border);
}

.btn-secondary:hover {
    background: var(--hover);
}

/* CTA Components */
.cta {
    background: white;
    margin: calc(var(--spacing) * 1.5);
    padding: calc(var(--spacing) * 1.5);
    border-radius: var(--radius);
    border: 2px solid var(--primary);
    text-align: center;
}

.cta h3 {
    color: var(--primary);
    margin-bottom: var(--spacing);
}

/* Modal Components */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 1000;
}

.modal.show { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
}

.modal-content {
    background: white;
    border-radius: var(--radius);
    padding: calc(var(--spacing) * 1.5);
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.close {
    position: absolute;
    top: var(--spacing);
    right: var(--spacing);
    font-size: 24px;
    cursor: pointer;
}

/* Form Components */
form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing);
}

form input, form select, form textarea {
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 15px;
}

form input:focus, form select:focus, form textarea:focus {
    outline: none;
    border-color: var(--primary);
}

/* Utility Components */
.loading {
    text-align: center;
    padding: calc(var(--spacing) * 2);
    color: var(--text-muted);
}

.hidden { display: none !important; }

.event-actions {
    display: flex;
    gap: 8px;
    margin-top: var(--spacing);
}

/* Responsive */
@media (max-width: 768px) {
    .event-meta { grid-template-columns: 1fr; }
    .event-actions { flex-direction: column; }
}`;
    }
}

class JSBuilder {
    constructor(config) {
        this.config = config;
    }

    async build() {
        return {
            'js/api.js': this.buildAPIClient(),
            'js/app.js': this.buildMainApp()
        };
    }

    buildAPIClient() {
        return `// API Client - Modular & Focused
class API {
    constructor() {
        this.baseURL = window.CONFIG?.apiBase || '${this.config.apiBase}';
        this.cache = new Map();
    }

    async getEvents() {
        try {
            const cacheKey = 'events';
            if (this.cache.has(cacheKey) && !navigator.onLine) {
                return this.cache.get(cacheKey);
            }

            const [curated, ugc] = await Promise.all([
                this.fetchWithFallback('/api/parties'),
                this.fetchWithFallback('/api/ugc/events', { events: [] })
            ]);

            const events = [...(curated.data || curated), ...(ugc.events || [])];
            this.cache.set(cacheKey, events);
            return events;
        } catch (error) {
            console.error('API Error:', error);
            return this.cache.get('events') || [];
        }
    }

    async createEvent(eventData) {
        try {
            const response = await fetch(this.baseURL + '/api/ugc/events/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...eventData,
                    createdAt: new Date().toISOString(),
                    source: 'ugc'
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Create event error:', error);
            return { success: false, error: error.message };
        }
    }

    async fetchWithFallback(endpoint, fallback = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint);
            return await response.json();
        } catch (error) {
            console.warn(\`API endpoint \${endpoint} failed, using fallback\`);
            return fallback;
        }
    }

    generateCalendarURL(event) {
        const start = new Date(\`\${event.date}T\${event.startTime}\`);
        const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
        
        return \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent(event.name)}&dates=\${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/\${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=\${encodeURIComponent(event.venue)}\`;
    }
}

window.api = new API();`;
    }

    buildMainApp() {
        return `// Main App - Clean & Modular
class GamescomApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentFilter = 'all';
    }

    async init() {
        console.log('🎮 Gamescom App Starting...');
        
        await this.loadEvents();
        this.setupUI();
        this.registerServiceWorker();
        
        console.log(\`✅ Loaded \${this.events.length} events\`);
    }

    async loadEvents() {
        this.events = await window.api.getEvents();
        this.filteredEvents = [...this.events];
    }

    setupUI() {
        this.setupEventListeners();
        this.renderFilters();
        this.renderEvents();
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterEvents(e.target.value, this.currentFilter);
        });

        document.getElementById('createBtn').addEventListener('click', () => {
            this.showModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('eventForm').addEventListener('submit', (e) => {
            this.handleCreateEvent(e);
        });

        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service Worker registered'))
                .catch(console.warn);
        }
    }

    renderFilters() {
        const filters = ['all', 'networking', 'afterparty', 'mixer', 'launch', 'today'];
        const container = document.getElementById('filters');
        
        container.innerHTML = filters.map(filter => 
            \`<button class="filter \${filter === 'all' ? 'active' : ''}" 
                     onclick="app.setFilter('\${filter}')">
                \${this.formatFilterName(filter)}
             </button>\`
        ).join('');
    }

    renderEvents() {
        const container = document.getElementById('events');
        
        if (this.filteredEvents.length === 0) {
            container.innerHTML = '<div class="loading">No events found</div>';
            return;
        }

        container.innerHTML = this.filteredEvents.map(event => \`
            <div class="event">
                <h3>\${event.name}</h3>
                <p>by \${event.hosts}</p>
                
                <div class="event-meta">
                    <div>📅 \${this.formatDate(event.date)}</div>
                    <div>🕐 \${event.startTime}</div>
                    <div>📍 \${event.venue}</div>
                    <div>🎯 \${event.category}</div>
                </div>
                
                \${event.description ? \`<p>\${event.description}</p>\` : ''}
                
                <div class="event-actions">
                    <button class="btn-primary" onclick="app.addToCalendar('\${event.id}')">
                        📅 Calendar
                    </button>
                    <button class="btn-secondary" onclick="app.shareEvent('\${event.id}')">
                        📤 Share
                    </button>
                </div>
            </div>
        \`).join('');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter').forEach(f => {
            f.classList.toggle('active', f.textContent.toLowerCase().includes(filter.toLowerCase()));
        });
        
        const searchQuery = document.getElementById('searchInput').value;
        this.filterEvents(searchQuery, filter);
    }

    filterEvents(search = '', filter = 'all') {
        let filtered = [...this.events];

        if (filter !== 'all') {
            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(e => e.date === today);
            } else {
                filtered = filtered.filter(e => e.category === filter);
            }
        }

        if (search) {
            const query = search.toLowerCase();
            filtered = filtered.filter(e => 
                e.name.toLowerCase().includes(query) ||
                e.hosts.toLowerCase().includes(query) ||
                e.venue.toLowerCase().includes(query)
            );
        }

        this.filteredEvents = filtered;
        this.renderEvents();
    }

    showModal() {
        document.getElementById('modal').classList.add('show');
        document.getElementById('eventForm').classList.remove('hidden');
        document.getElementById('success').classList.add('hidden');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('show');
        document.getElementById('eventForm').reset();
    }

    async handleCreateEvent(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const eventData = Object.fromEntries(formData);
        const submitBtn = e.target.querySelector('button[type="submit"]');

        this.setLoadingState(submitBtn, true);

        try {
            const result = await window.api.createEvent(eventData);
            
            if (result.success) {
                this.showSuccess();
                await this.loadEvents();
                this.renderEvents();
            } else {
                this.showError('Failed to create event: ' + result.error);
            }
        } catch (error) {
            this.showError('Error creating event');
            console.error(error);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    setLoadingState(button, loading) {
        button.textContent = loading ? 'Creating...' : 'Create Event';
        button.disabled = loading;
    }

    showSuccess() {
        document.getElementById('eventForm').classList.add('hidden');
        document.getElementById('success').classList.remove('hidden');
    }

    showError(message) {
        alert(message);
    }

    addToCalendar(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            const url = window.api.generateCalendarURL(event);
            window.open(url, '_blank');
        }
    }

    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const shareData = {
            title: event.name,
            text: \`Check out "\${event.name}" at Gamescom 2025!\`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            const url = \`https://wa.me/?text=\${encodeURIComponent(shareData.text + ' ' + shareData.url)}\`;
            window.open(url, '_blank');
        }
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
        });
    }

    formatFilterName(filter) {
        return filter.charAt(0).toUpperCase() + filter.slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new GamescomApp();
    window.app.init();
});`;
    }
}

class PWABuilder {
    constructor(config) {
        this.config = config;
    }

    async build() {
        return {
            'manifest.json': this.buildManifest(),
            'sw.js': this.buildServiceWorker()
        };
    }

    buildManifest() {
        return {
            name: "Gamescom 2025 Events",
            short_name: "Gamescom Events",
            description: "Professional gaming industry networking",
            start_url: "/",
            display: "standalone",
            background_color: "#FFFFFF",
            theme_color: "#4A154B",
            icons: [
                { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
                { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
            ],
            shortcuts: [
                { name: "Search Events", url: "/?action=search" },
                { name: "Create Event", url: "/?action=create" }
            ]
        };
    }

    buildServiceWorker() {
        return `// Service Worker - Simple & Effective
const CACHE_NAME = 'gamescom-v${this.config.version}';
const CACHE_URLS = [
    '/',
    '/css/main.css',
    '/js/app.js',
    '/js/api.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/');
                }
            })
    );
});`;
    }
}

// CLI execution
if (require.main === module) {
    const command = process.argv[2] || 'build';
    const builder = new FrontendBuilder();

    if (command === 'help') {
        builder.showHelp();
    } else if (command === 'build') {
        builder.build().catch(console.error);
    } else {
        console.log('❌ Unknown command. Use: build, help');
    }
}

module.exports = { FrontendBuilder, CONFIG };