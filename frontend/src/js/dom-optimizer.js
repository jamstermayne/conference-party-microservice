/**
 * ⚡ DOM OPTIMIZER
 * High-performance DOM manipulation with batching and virtual operations
 * Reduces layout thrashing and improves rendering performance
 */

class DOMOptimizer {
    constructor() {
        this.updateQueue = new Map();
        this.readQueue = new Map();
        this.frameRequested = false;
        this.templateCache = new Map();
        this.componentCache = new Map();
        this.observer = null;
        
        this.setupIntersectionObserver();
        this.setupMutationObserver();
    }
    
    /**
     * Batch DOM updates for next animation frame
     */
    batchUpdate(element, updates) {
        const key = this.getElementKey(element);
        
        if (this.updateQueue.has(key)) {
            Object.assign(this.updateQueue.get(key), updates);
        } else {
            this.updateQueue.set(key, { element, updates });
        }
        
        this.scheduleUpdate();
    }
    
    /**
     * Batch DOM reads to avoid layout thrashing
     */
    batchRead(element, reads) {
        const key = this.getElementKey(element);
        
        if (this.readQueue.has(key)) {
            Object.assign(this.readQueue.get(key), reads);
        } else {
            this.readQueue.set(key, { element, reads });
        }
        
        this.scheduleUpdate();
    }
    
    /**
     * Schedule batched update for next frame
     */
    scheduleUpdate() {
        if (!this.frameRequested) {
            this.frameRequested = true;
            requestAnimationFrame(() => this.flushUpdates());
        }
    }
    
    /**
     * Flush all queued operations
     */
    flushUpdates() {
        // Perform all reads first (to avoid layout thrashing)
        const readResults = new Map();
        this.readQueue.forEach(({ element, reads }, key) => {
            const results = {};
            for (const [prop, callback] of Object.entries(reads)) {
                try {
                    results[prop] = this.performRead(element, prop);
                    if (callback) callback(results[prop]);
                } catch (error) {
                    console.error('DOM read error:', error);
                }
            }
            readResults.set(key, results);
        });
        
        // Then perform all writes
        this.updateQueue.forEach(({ element, updates }) => {
            this.performUpdates(element, updates);
        });
        
        // Clear queues
        this.updateQueue.clear();
        this.readQueue.clear();
        this.frameRequested = false;
        
        return readResults;
    }
    
    /**
     * Perform DOM read operation
     */
    performRead(element, property) {
        switch (property) {
            case 'bounds':
                return element.getBoundingClientRect();
            case 'offset':
                return { top: element.offsetTop, left: element.offsetLeft };
            case 'scroll':
                return { top: element.scrollTop, left: element.scrollLeft };
            case 'computed':
                return getComputedStyle(element);
            case 'dimensions':
                return {
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    clientWidth: element.clientWidth,
                    clientHeight: element.clientHeight
                };
            default:
                return element[property];
        }
    }
    
    /**
     * Perform DOM updates efficiently
     */
    performUpdates(element, updates) {
        if (!element || !element.parentNode) return;
        
        // Batch style updates
        if (updates.styles) {
            Object.assign(element.style, updates.styles);
        }
        
        // Batch attribute updates
        if (updates.attributes) {
            for (const [attr, value] of Object.entries(updates.attributes)) {
                if (value === null) {
                    element.removeAttribute(attr);
                } else {
                    element.setAttribute(attr, value);
                }
            }
        }
        
        // Batch class updates
        if (updates.classes) {
            const { add, remove, toggle } = updates.classes;
            if (add) element.classList.add(...(Array.isArray(add) ? add : [add]));
            if (remove) element.classList.remove(...(Array.isArray(remove) ? remove : [remove]));
            if (toggle) element.classList.toggle(toggle);
        }
        
        // Text content update
        if (updates.textContent !== undefined) {
            element.textContent = updates.textContent;
        }
        
        // HTML content update (use with caution)
        if (updates.innerHTML !== undefined) {
            element.innerHTML = updates.innerHTML;
        }
        
        // Property updates
        if (updates.properties) {
            Object.assign(element, updates.properties);
        }
    }
    
    /**
     * Create elements with template caching
     */
    createElement(template, data = {}) {
        const cacheKey = this.generateTemplateKey(template);
        
        let element;
        if (this.templateCache.has(cacheKey)) {
            element = this.templateCache.get(cacheKey).cloneNode(true);
        } else {
            element = this.parseTemplate(template);
            this.templateCache.set(cacheKey, element.cloneNode(true));
        }
        
        // Apply data binding
        if (Object.keys(data).length > 0) {
            this.bindData(element, data);
        }
        
        return element;
    }
    
    /**
     * Parse HTML template string
     */
    parseTemplate(template) {
        const div = document.createElement('div');
        div.innerHTML = template.trim();
        return div.firstElementChild || div;
    }
    
    /**
     * Bind data to template
     */
    bindData(element, data) {
        // Find all data binding attributes
        const bindElements = element.querySelectorAll('[data-bind]');
        
        bindElements.forEach(el => {
            const binding = el.getAttribute('data-bind');
            const value = this.getNestedValue(data, binding);
            
            if (value !== undefined) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = value;
                } else {
                    el.textContent = value;
                }
            }
        });
        
        // Handle root element binding
        const rootBinding = element.getAttribute('data-bind');
        if (rootBinding) {
            const value = this.getNestedValue(data, rootBinding);
            if (value !== undefined) {
                element.textContent = value;
            }
        }
    }
    
    /**
     * Get nested object value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    /**
     * Efficiently update lists with virtual scrolling
     */
    updateList(container, items, itemRenderer, options = {}) {
        const {
            itemHeight = 50,
            containerHeight = container.offsetHeight,
            bufferSize = 5
        } = options;
        
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const startIndex = Math.max(0, Math.floor(container.scrollTop / itemHeight) - bufferSize);
        const endIndex = Math.min(items.length, startIndex + visibleCount + bufferSize * 2);
        
        // Create fragment for efficient insertion
        const fragment = document.createDocumentFragment();
        
        // Clear existing items
        container.innerHTML = '';
        
        // Add spacer for items before visible area
        if (startIndex > 0) {
            const spacer = document.createElement('div');
            spacer.style.height = `${startIndex * itemHeight}px`;
            fragment.appendChild(spacer);
        }
        
        // Render visible items
        for (let i = startIndex; i < endIndex; i++) {
            const item = items[i];
            const element = itemRenderer(item, i);
            fragment.appendChild(element);
        }
        
        // Add spacer for items after visible area
        const remainingItems = items.length - endIndex;
        if (remainingItems > 0) {
            const spacer = document.createElement('div');
            spacer.style.height = `${remainingItems * itemHeight}px`;
            fragment.appendChild(spacer);
        }
        
        container.appendChild(fragment);
    }
    
    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const lazyCallback = element._lazyCallback;
                    
                    if (lazyCallback) {
                        lazyCallback(element);
                        element._lazyCallback = null;
                        this.observer.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });
    }
    
    /**
     * Setup mutation observer for performance monitoring
     */
    setupMutationObserver() {
        if (typeof MutationObserver !== 'undefined') {
            const mutationObserver = new MutationObserver((mutations) => {
                let mutationCount = 0;
                mutations.forEach(mutation => {
                    mutationCount += mutation.addedNodes.length + mutation.removedNodes.length;
                });
                
                // Log excessive mutations
                if (mutationCount > 50) {
                    console.warn(`High DOM mutation count: ${mutationCount}`);
                }
            });
            
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    /**
     * Lazy load element when it comes into view
     */
    lazyLoad(element, callback) {
        element._lazyCallback = callback;
        this.observer.observe(element);
    }
    
    /**
     * Efficiently show/hide elements
     */
    toggleVisibility(element, visible, animate = false) {
        if (animate) {
            this.batchUpdate(element, {
                styles: {
                    opacity: visible ? '1' : '0',
                    transform: visible ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'opacity 0.2s, transform 0.2s'
                }
            });
            
            setTimeout(() => {
                if (!visible) {
                    this.batchUpdate(element, {
                        styles: { display: 'none' }
                    });
                }
            }, 200);
        } else {
            this.batchUpdate(element, {
                styles: { display: visible ? '' : 'none' }
            });
        }
    }
    
    /**
     * Get unique key for element
     */
    getElementKey(element) {
        if (!element._domKey) {
            element._domKey = Math.random().toString(36).substr(2, 9);
        }
        return element._domKey;
    }
    
    /**
     * Generate template cache key
     */
    generateTemplateKey(template) {
        return btoa(template).substr(0, 16);
    }
    
    /**
     * Clear all caches
     */
    clearCaches() {
        this.templateCache.clear();
        this.componentCache.clear();
    }
    
    /**
     * Get performance statistics
     */
    getStats() {
        return {
            queuedUpdates: this.updateQueue.size,
            queuedReads: this.readQueue.size,
            templatesCached: this.templateCache.size,
            componentsCached: this.componentCache.size,
            frameRequested: this.frameRequested
        };
    }
}

// Create global instance
window.DOMOptimizer = new DOMOptimizer();

// Convenience methods
window.DOM = {
    batch: (element, updates) => window.DOMOptimizer.batchUpdate(element, updates),
    read: (element, reads) => window.DOMOptimizer.batchRead(element, reads),
    create: (template, data) => window.DOMOptimizer.createElement(template, data),
    updateList: (container, items, renderer, options) => 
        window.DOMOptimizer.updateList(container, items, renderer, options),
    lazyLoad: (element, callback) => window.DOMOptimizer.lazyLoad(element, callback),
    toggle: (element, visible, animate) => 
        window.DOMOptimizer.toggleVisibility(element, visible, animate),
    flush: () => window.DOMOptimizer.flushUpdates()
};

console.log('⚡ DOMOptimizer initialized - Performance enhanced DOM operations');