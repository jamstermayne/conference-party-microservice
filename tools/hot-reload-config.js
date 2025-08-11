/**
 * HOT RELOAD CONFIGURATION
 * Centralized configuration for hot reload development environment
 */

module.exports = {
    // Server Configuration
    server: {
        port: 3000,
        wsPort: 3001,
        publicDir: './public',
        apiProxy: 'https://us-central1-conference-party-app.cloudfunctions.net',
        enableCompression: true,
        enableCORS: true
    },

    // File Watching Configuration
    watching: {
        // File patterns to watch
        patterns: {
            javascript: ['public/**/*.js', '!public/node_modules/**'],
            css: ['public/**/*.css'],
            html: ['public/**/*.html'],
            functions: ['functions/src/**/*.ts'],
            config: ['*.json', 'public/manifest.json', 'public/sw.js']
        },

        // Directories to ignore
        ignored: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            '**/logs/**',
            '**/coverage/**'
        ],

        // Polling interval (ms) for systems that don't support native watching
        pollingInterval: 1000,

        // Debounce delay (ms) to prevent multiple rapid reloads
        debounceDelay: 100
    },

    // Hot Reload Behavior
    reload: {
        // Types of reloads
        strategies: {
            javascript: 'module-reload',    // Reload specific modules
            css: 'style-injection',         // Inject styles without page reload
            html: 'page-reload',           // Full page reload
            functions: 'build-and-notify', // Build functions and notify
            config: 'page-reload'          // Full reload for config changes
        },

        // Performance thresholds
        performance: {
            maxReloadTime: 2000,      // ms - warn if reload takes longer
            maxRenderTime: 16.67,     // ms - one frame at 60fps
            maxMemoryUsage: 100,      // MB - warn if memory usage is high
            maxClients: 10            // Maximum concurrent clients
        },

        // State preservation
        statePreservation: {
            enabled: true,
            preserveScrollPosition: true,
            preserveFormInputs: true,
            preserveLocalStorage: true,
            preserveSessionStorage: true,
            customStateKeys: [
                'userPreferences',
                'eventFilters',
                'virtualListState',
                'authState'
            ]
        }
    },

    // Dependency Management
    dependencies: {
        // Automatic dependency detection
        autoDetection: true,
        
        // Module dependency graph
        moduleGraph: {
            // Core modules that affect everything
            core: [
                'storage-manager.js',
                'router.js',
                'api.js',
                'event-system.js'
            ],

            // Controller modules
            controllers: [
                'controllers/HomeController.js',
                'controllers/EventController.js',
                'controllers/PeopleController.js',
                'controllers/OpportunitiesController.js',
                'controllers/MeController.js'
            ],

            // Component modules
            components: [
                'components/VirtualizedEventList.js',
                'event-list-integration.js',
                'app-with-virtualization.js'
            ]
        },

        // When these files change, reload these dependents
        dependencyMap: {
            'storage-manager.js': ['**/*.js'],
            'api.js': ['controllers/**/*.js', 'components/**/*.js'],
            'router.js': ['app.js', 'app-with-virtualization.js'],
            'components/VirtualizedEventList.js': ['event-list-integration.js']
        }
    },

    // Build Integration
    build: {
        // Auto-build Firebase Functions on change
        functions: {
            enabled: true,
            command: 'cd functions && npm run build',
            timeout: 30000, // 30 seconds
            retries: 3
        },

        // Auto-build TypeScript
        typescript: {
            enabled: false, // Not currently using TypeScript in frontend
            command: 'tsc',
            timeout: 10000
        },

        // Auto-build SCSS/SASS
        scss: {
            enabled: false, // Using vanilla CSS
            command: 'sass public/scss:public/css',
            timeout: 5000
        }
    },

    // Development Features
    development: {
        // Error overlay
        errorOverlay: {
            enabled: true,
            showStackTrace: true,
            showSourceCode: true,
            position: 'top-left'
        },

        // Development dashboard
        dashboard: {
            enabled: true,
            path: '/dev-dashboard',
            showMetrics: true,
            showLogs: true,
            showFileTree: true
        },

        // Performance monitoring
        performance: {
            enabled: true,
            showFPS: true,
            showMemory: true,
            showReloadTimes: true,
            logSlowOperations: true
        },

        // Network proxying
        proxy: {
            '/api': 'https://us-central1-conference-party-app.cloudfunctions.net',
            '/health': 'https://us-central1-conference-party-app.cloudfunctions.net/api/health'
        }
    },

    // Client Configuration
    client: {
        // WebSocket configuration
        websocket: {
            reconnectAttempts: 10,
            reconnectDelay: 2000,
            heartbeatInterval: 30000
        },

        // UI indicators
        ui: {
            showConnectionStatus: true,
            showReloadNotifications: true,
            showErrorNotifications: true,
            notificationDuration: 3000,
            position: 'top-right'
        },

        // Keyboard shortcuts
        shortcuts: {
            'Ctrl+R': 'reload-page',
            'Ctrl+Shift+R': 'hard-reload',
            'Ctrl+D': 'toggle-dashboard',
            'Ctrl+E': 'show-errors',
            'F12': 'open-devtools'
        }
    },

    // Logging Configuration
    logging: {
        level: 'info', // error, warn, info, debug, trace
        
        // Log to console
        console: {
            enabled: true,
            colorize: true,
            timestamp: true
        },

        // Log to file
        file: {
            enabled: false,
            path: './logs/hot-reload.log',
            maxSize: '10MB',
            maxFiles: 5
        },

        // Log categories
        categories: {
            server: true,
            watcher: true,
            reload: true,
            performance: true,
            errors: true,
            client: true
        }
    },

    // Advanced Features
    advanced: {
        // Code transformation
        transforms: {
            enabled: false,
            babel: false,
            typescript: false,
            minification: false
        },

        // Module resolution
        moduleResolution: {
            alias: {
                '@': './public/js',
                '@components': './public/js/components',
                '@controllers': './public/js/controllers',
                '@utils': './public/js/utils'
            }
        },

        // Security
        security: {
            enableCSP: false, // Disabled for development
            allowEval: true,  // Required for hot reload
            corsOrigins: ['localhost', '127.0.0.1']
        }
    }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
    module.exports.development.errorOverlay.enabled = false;
    module.exports.development.dashboard.enabled = false;
    module.exports.logging.level = 'warn';
    module.exports.advanced.security.enableCSP = true;
    module.exports.advanced.security.allowEval = false;
}

// Export configuration
module.exports.getConfig = function(environment = 'development') {
    const config = { ...module.exports };
    
    // Remove helper functions from exported config
    delete config.getConfig;
    
    return config;
};