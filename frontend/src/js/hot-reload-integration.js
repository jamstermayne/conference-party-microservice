/**
 * HOT RELOAD INTEGRATION - Professional Intelligence Platform
 * Seamlessly integrates hot reload with existing PWA architecture
 * Preserves application state during development
 */

class HotReloadIntegration {
    constructor() {
        this.stateSnapshot = {};
        this.preservedModules = new Set([
            'storage-manager.js',
            'event-system.js',
            'api.js'
        ]);
        
        this.initializeIntegration();
    }

    initializeIntegration() {
        // Only initialize in development mode
        if (!this.isDevelopment()) {
            return;
        }

        console.log('🔥 Hot Reload Integration initializing...');

        // Hook into platform initialization
        this.setupPlatformHooks();
        
        // Setup state preservation
        this.setupStatePreservation();
        
        // Setup module refresh capabilities
        this.setupModuleRefresh();
        
        // Listen for hot reload events
        this.setupHotReloadListeners();

        console.log('✅ Hot Reload Integration ready');
    }

    isDevelopment() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.search.includes('dev=1');
    }

    setupPlatformHooks() {
        // Hook into platform initialization
        document.addEventListener('platformInitialized', (e) => {
            console.log('🚀 Platform initialized, hot reload ready', e.detail);
            
            // Store reference to platform
            this.platform = window.platform;
            
            // Enable hot reload features
            if (this.platform) {
                this.platform.hotReload = this;
            }
        });

        // Hook into virtual list initialization
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for eventListManager to be available
            const checkForEventListManager = () => {
                if (window.eventListManager) {
                    console.log('📊 Virtual List Manager detected, enabling hot reload');
                    this.virtualListManager = window.eventListManager;
                } else {
                    setTimeout(checkForEventListManager, 100);
                }
            };
            checkForEventListManager();
        });
    }

    setupStatePreservation() {
        // Preserve application state before reload
        window.addEventListener('beforeunload', () => {
            this.preserveApplicationState();
        });

        // Restore state after reload
        window.addEventListener('load', () => {
            this.restoreApplicationState();
        });

        // Preserve state on hot reload events
        if (window.hotReload && window.hotReload.broadcast) {
            const originalBroadcast = window.hotReload.broadcast;
            window.hotReload.broadcast = (message) => {
                if (message.type === 'js-reload') {
                    this.preserveApplicationState();
                }
                return originalBroadcast.call(window.hotReload, message);
            };
        }
    }

    preserveApplicationState() {
        console.log('💾 Preserving application state...');
        
        const state = {
            timestamp: Date.now(),
            location: {
                pathname: location.pathname,
                search: location.search,
                hash: location.hash
            },
            scroll: {
                x: window.scrollX,
                y: window.scrollY
            }
        };

        // Preserve storage manager state
        if (window.Store && window.Store.getAll) {
            state.storage = window.Store.getAll();
        }

        // Preserve virtual list state
        if (this.virtualListManager) {
            state.virtualList = {
                scrollPosition: this.virtualListManager.virtualList?.wrapper?.scrollTop || 0,
                visibleRange: this.virtualListManager.virtualList?.visibleRange || null,
                filters: this.virtualListManager.filters || {},
                currentPage: this.virtualListManager.currentPage || 1
            };
        }

        // Preserve platform state
        if (this.platform) {
            state.platform = {
                currentController: this.platform.currentController?.constructor?.name,
                isInitialized: this.platform.isInitialized
            };
        }

        // Preserve form inputs
        state.forms = this.preserveFormInputs();

        // Store in sessionStorage for hot reload persistence
        sessionStorage.setItem('hotReloadState', JSON.stringify(state));
        
        this.stateSnapshot = state;
        console.log('✅ Application state preserved', state);
    }

    restoreApplicationState() {
        try {
            const storedState = sessionStorage.getItem('hotReloadState');
            if (!storedState) return;

            const state = JSON.parse(storedState);
            console.log('🔄 Restoring application state...', state);

            // Restore scroll position
            if (state.scroll) {
                setTimeout(() => {
                    window.scrollTo(state.scroll.x, state.scroll.y);
                }, 100);
            }

            // Restore storage state
            if (state.storage && window.Store) {
                Object.entries(state.storage).forEach(([key, value]) => {
                    window.Store.set(key, value);
                });
            }

            // Restore virtual list state
            if (state.virtualList && this.virtualListManager) {
                setTimeout(() => {
                    if (this.virtualListManager.virtualList) {
                        // Restore scroll position
                        if (state.virtualList.scrollPosition) {
                            this.virtualListManager.virtualList.wrapper.scrollTop = 
                                state.virtualList.scrollPosition;
                        }

                        // Restore filters
                        if (state.virtualList.filters) {
                            this.virtualListManager.filters = { 
                                ...this.virtualListManager.filters, 
                                ...state.virtualList.filters 
                            };
                        }
                    }
                }, 200);
            }

            // Restore form inputs
            if (state.forms) {
                this.restoreFormInputs(state.forms);
            }

            console.log('✅ Application state restored');

        } catch (error) {
            console.warn('⚠️ Failed to restore application state:', error);
        }
    }

    preserveFormInputs() {
        const forms = {};
        
        document.querySelectorAll('input, textarea, select').forEach(element => {
            if (element.id || element.name) {
                const key = element.id || element.name;
                
                if (element.type === 'checkbox' || element.type === 'radio') {
                    forms[key] = element.checked;
                } else {
                    forms[key] = element.value;
                }
            }
        });

        return forms;
    }

    restoreFormInputs(forms) {
        Object.entries(forms).forEach(([key, value]) => {
            const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            
            if (element) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = value;
                } else {
                    element.value = value;
                }

                // Trigger change event
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    setupModuleRefresh() {
        // Add refresh capabilities to platform
        if (!window.platform) {
            window.platform = {};
        }

        window.platform.refreshModules = (moduleList) => {
            console.log('🔄 Refreshing modules:', moduleList);

            moduleList.forEach(modulePath => {
                this.refreshModule(modulePath);
            });
        };

        // Add refresh capabilities to virtual list manager
        if (this.virtualListManager) {
            const originalRefresh = this.virtualListManager.refreshEvents;
            this.virtualListManager.refreshEvents = async () => {
                console.log('📊 Refreshing virtual list with hot reload integration...');
                
                // Preserve scroll position
                const scrollTop = this.virtualListManager.virtualList?.wrapper?.scrollTop || 0;
                
                // Call original refresh
                if (originalRefresh) {
                    await originalRefresh.call(this.virtualListManager);
                }
                
                // Restore scroll position
                setTimeout(() => {
                    if (this.virtualListManager.virtualList?.wrapper) {
                        this.virtualListManager.virtualList.wrapper.scrollTop = scrollTop;
                    }
                }, 100);
            };
        }
    }

    refreshModule(modulePath) {
        console.log('🔧 Refreshing module:', modulePath);

        // Handle specific module types
        if (modulePath.includes('VirtualizedEventList')) {
            this.refreshVirtualizedEventList();
        } else if (modulePath.includes('Controller')) {
            this.refreshController(modulePath);
        } else if (modulePath.includes('storage-manager')) {
            this.refreshStorageManager();
        } else if (modulePath.includes('api')) {
            this.refreshAPIModule();
        }
    }

    refreshVirtualizedEventList() {
        console.log('📊 Refreshing VirtualizedEventList...');
        
        if (this.virtualListManager && this.virtualListManager.virtualList) {
            // Preserve current state
            const currentState = {
                scrollTop: this.virtualListManager.virtualList.wrapper.scrollTop,
                visibleRange: this.virtualListManager.virtualList.visibleRange,
                items: this.virtualListManager.events
            };

            // Re-render virtual list
            setTimeout(() => {
                if (this.virtualListManager.virtualList.render) {
                    this.virtualListManager.virtualList.render();
                }

                // Restore state
                if (this.virtualListManager.virtualList.wrapper) {
                    this.virtualListManager.virtualList.wrapper.scrollTop = currentState.scrollTop;
                }
            }, 50);
        }
    }

    refreshController(controllerPath) {
        console.log('🎮 Refreshing controller:', controllerPath);
        
        if (this.platform && this.platform.controllers) {
            const controllerName = controllerPath.match(/\/([^/]+)Controller\.js$/)?.[1]?.toLowerCase();
            
            if (controllerName && this.platform.controllers.has(controllerName)) {
                const controller = this.platform.controllers.get(controllerName);
                
                // Refresh controller if it has a refresh method
                if (controller && typeof controller.refresh === 'function') {
                    controller.refresh();
                }
            }
        }
    }

    refreshStorageManager() {
        console.log('💾 Refreshing StorageManager...');
        
        // Storage manager typically doesn't need refresh as it maintains state
        // Just log that it's still functional
        if (window.Store) {
            console.log('✅ StorageManager operational');
        }
    }

    refreshAPIModule() {
        console.log('🔗 Refreshing API module...');
        
        // API module refresh - typically involves clearing caches
        if (window.api && typeof window.api.clearCache === 'function') {
            window.api.clearCache();
        }
    }

    setupHotReloadListeners() {
        // Listen for custom hot reload events from the platform
        document.addEventListener('virtual-list-rendered', (e) => {
            // Virtual list has been re-rendered, ensure state consistency
            if (this.stateSnapshot.virtualList) {
                setTimeout(() => {
                    this.syncVirtualListState();
                }, 50);
            }
        });

        // Listen for platform re-initialization
        document.addEventListener('platformInitialized', (e) => {
            if (e.detail.isReload) {
                this.restoreApplicationState();
            }
        });

        // Performance monitoring for hot reload
        let reloadStartTime = null;
        
        document.addEventListener('beforeunload', () => {
            reloadStartTime = performance.now();
        });

        window.addEventListener('load', () => {
            if (reloadStartTime) {
                const reloadTime = performance.now() - reloadStartTime;
                console.log(`⚡ Hot reload completed in ${reloadTime.toFixed(2)}ms`);
            }
        });
    }

    syncVirtualListState() {
        if (!this.virtualListManager || !this.stateSnapshot.virtualList) return;

        const savedState = this.stateSnapshot.virtualList;
        
        // Restore filters if they don't match
        if (JSON.stringify(this.virtualListManager.filters) !== JSON.stringify(savedState.filters)) {
            this.virtualListManager.filters = { ...savedState.filters };
        }

        // Restore scroll position if it's significantly different
        if (this.virtualListManager.virtualList?.wrapper) {
            const currentScroll = this.virtualListManager.virtualList.wrapper.scrollTop;
            const savedScroll = savedState.scrollPosition || 0;
            
            if (Math.abs(currentScroll - savedScroll) > 50) {
                this.virtualListManager.virtualList.wrapper.scrollTop = savedScroll;
            }
        }
    }

    // Public API for manual state management
    saveState() {
        this.preserveApplicationState();
    }

    loadState() {
        this.restoreApplicationState();
    }

    clearState() {
        sessionStorage.removeItem('hotReloadState');
        this.stateSnapshot = {};
    }

    getPerformanceMetrics() {
        return {
            stateSize: JSON.stringify(this.stateSnapshot).length,
            preservedModules: Array.from(this.preservedModules),
            isActive: this.isDevelopment(),
            platform: !!this.platform,
            virtualList: !!this.virtualListManager
        };
    }
}

// Initialize hot reload integration
let hotReloadIntegration;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        hotReloadIntegration = new HotReloadIntegration();
        window.hotReloadIntegration = hotReloadIntegration;
    });
} else {
    hotReloadIntegration = new HotReloadIntegration();
    window.hotReloadIntegration = hotReloadIntegration;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HotReloadIntegration;
}

console.log('🔥 Hot Reload Integration loaded!');