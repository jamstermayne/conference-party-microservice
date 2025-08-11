/**
 * VIRTUALIZED EVENT LIST - High Performance Event Rendering
 * Handles 10,000+ events with 60fps scrolling performance
 */

class VirtualizedEventList {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        
        // Configuration
        this.itemHeight = options.itemHeight || 120;
        this.overscan = options.overscan || 5; // Extra items to render outside viewport
        this.gap = options.gap || 10;
        this.threshold = options.loadThreshold || 0.8; // Load more when 80% scrolled
        
        // State
        this.items = [];
        this.visibleItems = [];
        this.startIndex = 0;
        this.endIndex = 0;
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        
        // Performance tracking
        this.lastRenderTime = 0;
        this.renderCount = 0;
        this.avgRenderTime = 0;
        
        // Callbacks
        this.onRenderItem = options.onRenderItem || this.defaultRenderItem.bind(this);
        this.onLoadMore = options.onLoadMore || null;
        this.onItemClick = options.onItemClick || null;
        this.onItemSwipe = options.onItemSwipe || null;
        
        // Touch/gesture handling
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isScrolling = false;
        this.swipeThreshold = 50;
        
        this.init();
    }

    init() {
        this.setupContainer();
        this.setupEventListeners();
        this.updateViewport();
        
        console.log('🚀 VirtualizedEventList initialized', {
            itemHeight: this.itemHeight,
            overscan: this.overscan,
            container: this.container
        });
    }

    setupContainer() {
        // Create virtualized structure
        this.container.innerHTML = `
            <div class="virtual-list-wrapper" style="
                position: relative;
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
            ">
                <div class="virtual-list-spacer-top" style="height: 0px;"></div>
                <div class="virtual-list-content" style="
                    position: relative;
                    will-change: transform;
                "></div>
                <div class="virtual-list-spacer-bottom" style="height: 0px;"></div>
                <div class="virtual-list-loading" style="
                    display: none;
                    text-align: center;
                    padding: 20px;
                    color: #999;
                ">Loading more events...</div>
            </div>
        `;

        this.wrapper = this.container.querySelector('.virtual-list-wrapper');
        this.topSpacer = this.container.querySelector('.virtual-list-spacer-top');
        this.content = this.container.querySelector('.virtual-list-content');
        this.bottomSpacer = this.container.querySelector('.virtual-list-spacer-bottom');
        this.loadingIndicator = this.container.querySelector('.virtual-list-loading');
        
        // Add performance monitoring
        this.wrapper.setAttribute('data-virtual-list', 'true');
    }

    setupEventListeners() {
        // Scroll handling with requestAnimationFrame for 60fps
        this.wrapper.addEventListener('scroll', this.throttledScrollHandler.bind(this));
        
        // Resize handling
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 100));
        
        // Touch gestures for swipe actions
        this.content.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.content.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.content.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Click handling with event delegation
        this.content.addEventListener('click', this.handleClick.bind(this));
        
        // Performance monitoring
        this.setupPerformanceObserver();
    }

    throttledScrollHandler() {
        if (!this.isScrolling) {
            requestAnimationFrame(() => {
                this.handleScroll();
                this.isScrolling = false;
            });
            this.isScrolling = true;
        }
    }

    handleScroll() {
        const scrollTop = this.wrapper.scrollTop;
        const scrollHeight = this.wrapper.scrollHeight;
        const clientHeight = this.wrapper.clientHeight;
        
        // Update scroll position
        this.scrollTop = scrollTop;
        
        // Check if need to load more items
        if (this.onLoadMore && scrollTop + clientHeight >= scrollHeight * this.threshold) {
            this.loadMore();
        }
        
        // Update visible range
        this.updateVisibleRange();
        this.render();
    }

    updateVisibleRange() {
        const containerHeight = this.wrapper.clientHeight;
        const itemHeightWithGap = this.itemHeight + this.gap;
        
        // Calculate visible range with overscan
        const visibleStart = Math.floor(this.scrollTop / itemHeightWithGap);
        const visibleEnd = Math.ceil((this.scrollTop + containerHeight) / itemHeightWithGap);
        
        this.startIndex = Math.max(0, visibleStart - this.overscan);
        this.endIndex = Math.min(this.items.length, visibleEnd + this.overscan);
        
        // Update spacers
        this.topSpacer.style.height = `${this.startIndex * itemHeightWithGap}px`;
        this.bottomSpacer.style.height = `${(this.items.length - this.endIndex) * itemHeightWithGap}px`;
    }

    render() {
        const startTime = performance.now();
        
        // Clear content
        this.content.innerHTML = '';
        
        // Render visible items
        const fragment = document.createDocumentFragment();
        
        for (let i = this.startIndex; i < this.endIndex; i++) {
            const item = this.items[i];
            if (item) {
                const element = this.createItemElement(item, i);
                fragment.appendChild(element);
            }
        }
        
        this.content.appendChild(fragment);
        
        // Performance tracking
        const renderTime = performance.now() - startTime;
        this.trackRenderPerformance(renderTime);
        
        // Dispatch render event
        this.container.dispatchEvent(new CustomEvent('virtual-list-rendered', {
            detail: {
                startIndex: this.startIndex,
                endIndex: this.endIndex,
                renderTime: renderTime,
                itemCount: this.endIndex - this.startIndex
            }
        }));
    }

    createItemElement(item, index) {
        const element = document.createElement('div');
        element.className = 'virtual-list-item';
        element.setAttribute('data-index', index);
        element.setAttribute('data-item-id', item.id || index);
        
        // Base styling for performance
        element.style.cssText = `
            height: ${this.itemHeight}px;
            margin-bottom: ${this.gap}px;
            contain: layout style paint;
            will-change: transform;
            position: relative;
        `;
        
        // Render item content
        const content = this.onRenderItem(item, index, element);
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }
        
        return element;
    }

    defaultRenderItem(item, index) {
        return `
            <div class="event-card" style="
                height: 100%;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 15px;
                display: flex;
                align-items: center;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            ">
                <div class="event-info" style="flex: 1;">
                    <h3 style="color: #00ff88; margin: 0 0 5px 0; font-size: 16px;">
                        ${item['Event Name'] || item.name || 'Unnamed Event'}
                    </h3>
                    <p style="color: #ccc; margin: 0; font-size: 14px;">
                        📅 ${item.Date || item.date || 'TBD'} • 
                        ⏰ ${item['Start Time'] || item.startTime || 'TBD'} • 
                        📍 ${item.Address || item.venue || 'Location TBD'}
                    </p>
                </div>
                <div class="swipe-actions" style="
                    display: flex;
                    gap: 10px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                ">
                    <button class="btn-swipe-like" style="
                        background: #00ff88;
                        color: #000;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-weight: 600;
                    ">👍 Like</button>
                    <button class="btn-swipe-pass" style="
                        background: #666;
                        color: #fff;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 20px;
                        cursor: pointer;
                    ">👎 Pass</button>
                </div>
            </div>
        `;
    }

    // Touch gesture handling
    handleTouchStart(e) {
        this.touchStartY = e.touches[0].clientY;
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchMove(e) {
        if (!this.touchStartY) return;
        
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaY = this.touchStartY - touchY;
        const deltaX = this.touchStartX - touchX;
        
        // Horizontal swipe detection
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
            e.preventDefault(); // Prevent scrolling during swipe
            
            const target = e.target.closest('.virtual-list-item');
            if (target) {
                const direction = deltaX > 0 ? 'left' : 'right';
                this.showSwipeActions(target, direction);
            }
        }
    }

    handleTouchEnd(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const deltaY = this.touchStartY - touchEndY;
        const deltaX = this.touchStartX - touchEndX;
        
        // Detect swipe gesture completion
        if (Math.abs(deltaX) > this.swipeThreshold) {
            const target = e.target.closest('.virtual-list-item');
            if (target && this.onItemSwipe) {
                const index = parseInt(target.getAttribute('data-index'));
                const item = this.items[index];
                const direction = deltaX > 0 ? 'left' : 'right';
                
                this.onItemSwipe(item, index, direction);
            }
        }
        
        // Reset touch state
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.hideSwipeActions();
    }

    showSwipeActions(element, direction) {
        const actions = element.querySelector('.swipe-actions');
        if (actions) {
            actions.style.opacity = '1';
            actions.style.transform = direction === 'left' ? 'translateX(-20px)' : 'translateX(20px)';
        }
    }

    hideSwipeActions() {
        const actions = this.content.querySelectorAll('.swipe-actions');
        actions.forEach(action => {
            action.style.opacity = '0';
            action.style.transform = 'translateX(0)';
        });
    }

    handleClick(e) {
        const target = e.target.closest('.virtual-list-item');
        if (target && this.onItemClick) {
            const index = parseInt(target.getAttribute('data-index'));
            const item = this.items[index];
            
            // Check if click was on a button
            if (e.target.matches('.btn-swipe-like, .btn-swipe-pass')) {
                const action = e.target.matches('.btn-swipe-like') ? 'like' : 'pass';
                if (this.onItemSwipe) {
                    this.onItemSwipe(item, index, action);
                }
                e.stopPropagation();
                return;
            }
            
            this.onItemClick(item, index, e);
        }
    }

    // Public API
    setItems(items) {
        this.items = items || [];
        this.updateViewport();
        this.updateVisibleRange();
        this.render();
        
        console.log('📊 VirtualizedEventList updated', {
            totalItems: this.items.length,
            visibleRange: `${this.startIndex}-${this.endIndex}`,
            performance: `${this.avgRenderTime.toFixed(2)}ms avg render`
        });
    }

    appendItems(newItems) {
        const startLength = this.items.length;
        this.items = this.items.concat(newItems || []);
        
        this.updateViewport();
        this.updateVisibleRange();
        this.render();
        
        console.log('➕ VirtualizedEventList appended', {
            added: newItems?.length || 0,
            total: this.items.length,
            newRange: `${this.startIndex}-${this.endIndex}`
        });
        
        return this.items.length - startLength;
    }

    updateViewport() {
        const containerHeight = this.wrapper.clientHeight;
        const itemHeightWithGap = this.itemHeight + this.gap;
        this.totalHeight = this.items.length * itemHeightWithGap;
        this.containerHeight = containerHeight;
        
        // Update container height
        this.wrapper.style.height = '100%';
    }

    scrollToIndex(index, behavior = 'smooth') {
        const itemHeightWithGap = this.itemHeight + this.gap;
        const targetScroll = index * itemHeightWithGap;
        
        this.wrapper.scrollTo({
            top: targetScroll,
            behavior: behavior
        });
    }

    scrollToTop(behavior = 'smooth') {
        this.wrapper.scrollTo({
            top: 0,
            behavior: behavior
        });
    }

    async loadMore() {
        if (this.loadingIndicator.style.display === 'block') return; // Already loading
        
        this.loadingIndicator.style.display = 'block';
        
        try {
            if (this.onLoadMore) {
                await this.onLoadMore();
            }
        } catch (error) {
            console.error('Error loading more items:', error);
        } finally {
            this.loadingIndicator.style.display = 'none';
        }
    }

    handleResize() {
        this.updateViewport();
        this.updateVisibleRange();
        this.render();
    }

    // Performance monitoring
    trackRenderPerformance(renderTime) {
        this.lastRenderTime = renderTime;
        this.renderCount++;
        
        // Calculate rolling average
        const alpha = 0.1;
        this.avgRenderTime = this.avgRenderTime * (1 - alpha) + renderTime * alpha;
        
        // Performance warning
        if (renderTime > 16.67) { // More than one frame at 60fps
            console.warn('⚠️ Slow render detected:', {
                renderTime: renderTime.toFixed(2) + 'ms',
                itemsRendered: this.endIndex - this.startIndex,
                avgRenderTime: this.avgRenderTime.toFixed(2) + 'ms'
            });
        }
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name.includes('virtual-list')) {
                        console.log('🔍 Performance entry:', entry);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public getters
    get visibleRange() {
        return { start: this.startIndex, end: this.endIndex };
    }

    get itemCount() {
        return this.items.length;
    }

    get renderStats() {
        return {
            avgRenderTime: this.avgRenderTime,
            lastRenderTime: this.lastRenderTime,
            renderCount: this.renderCount,
            itemsPerRender: this.endIndex - this.startIndex
        };
    }

    // Cleanup
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.wrapper.removeEventListener('scroll', this.throttledScrollHandler);
        this.content.removeEventListener('touchstart', this.handleTouchStart);
        this.content.removeEventListener('touchmove', this.handleTouchMove);
        this.content.removeEventListener('touchend', this.handleTouchEnd);
        this.content.removeEventListener('click', this.handleClick);
        
        console.log('🗑️ VirtualizedEventList destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VirtualizedEventList;
} else {
    window.VirtualizedEventList = VirtualizedEventList;
}