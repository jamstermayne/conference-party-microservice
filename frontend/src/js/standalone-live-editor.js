/**
 * STANDALONE LIVE VISUAL EDITOR
 * No WebSocket dependency - works offline
 * Perfect for demonstrations and standalone usage
 */

class StandaloneLiveEditor {
    constructor() {
        this.isActive = false;
        this.selectedElement = null;
        this.editableProperties = new Map();
        this.undoHistory = [];
        this.redoHistory = [];
        this.maxHistorySize = 50;
        this.copiedStyles = null;
        
        console.log('✏️ Standalone Live Editor initializing...');
        this.init();
    }

    init() {
        this.setupEditableProperties();
        this.setupKeyboardShortcuts();
        this.setupVisualEditingOverlay();
        this.addVisualIndicators();
        
        // Auto-activate in development
        if (this.isDevelopmentMode()) {
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 1000);
        }
        
        console.log('✅ Standalone Live Editor ready');
    }

    isDevelopmentMode() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.search.includes('edit=1') ||
               location.hostname.includes('codespaces');
    }

    setupEditableProperties() {
        this.editableProperties = new Map([
            // Layout Properties
            ['width', { type: 'dimension', unit: 'px', min: 0, max: 2000 }],
            ['height', { type: 'dimension', unit: 'px', min: 0, max: 2000 }],
            ['padding', { type: 'spacing', unit: 'rem', min: 0, max: 10, step: 0.25 }],
            ['margin', { type: 'spacing', unit: 'rem', min: 0, max: 10, step: 0.25 }],
            ['gap', { type: 'spacing', unit: 'rem', min: 0, max: 5, step: 0.25 }],
            
            // Typography Properties  
            ['fontSize', { type: 'dimension', unit: 'rem', min: 0.5, max: 5, step: 0.125, cssProperty: 'font-size' }],
            ['fontWeight', { type: 'select', options: ['300', '400', '500', '600', '700'], cssProperty: 'font-weight' }],
            ['lineHeight', { type: 'number', min: 1, max: 3, step: 0.1, cssProperty: 'line-height' }],
            
            // Color Properties
            ['color', { type: 'color' }],
            ['backgroundColor', { type: 'color', cssProperty: 'background-color' }],
            ['borderColor', { type: 'color', cssProperty: 'border-color' }],
            
            // Border Properties
            ['borderRadius', { type: 'dimension', unit: 'rem', min: 0, max: 2, step: 0.125, cssProperty: 'border-radius' }],
            ['borderWidth', { type: 'dimension', unit: 'px', min: 0, max: 10, cssProperty: 'border-width' }],
            
            // Effects
            ['opacity', { type: 'number', min: 0, max: 1, step: 0.05 }],
            
            // Flexbox Properties
            ['justifyContent', { type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'], cssProperty: 'justify-content' }],
            ['alignItems', { type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'], cssProperty: 'align-items' }],
        ]);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const isMod = e.ctrlKey || e.metaKey;
            
            switch (e.key) {
                case 'e':
                case 'E':
                    if (isMod) {
                        e.preventDefault();
                        this.toggleEditor();
                    }
                    break;
                    
                case 'Escape':
                    if (this.isActive) {
                        e.preventDefault();
                        this.deselectElement();
                    }
                    break;
                    
                case 'z':
                case 'Z':
                    if (this.isActive && isMod && !e.shiftKey) {
                        e.preventDefault();
                        this.undo();
                    } else if (this.isActive && isMod && e.shiftKey) {
                        e.preventDefault();
                        this.redo();
                    }
                    break;
                    
                case 's':
                case 'S':
                    if (this.isActive && isMod) {
                        e.preventDefault();
                        this.exportStyles();
                    }
                    break;
            }
        });
    }

    setupVisualEditingOverlay() {
        // Create editing overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'standalone-editor-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 10000;
            display: none;
        `;
        
        // Create floating toolbar
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'standalone-editor-toolbar';
        this.toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-title">
                    ✏️ <strong>Live Editor</strong>
                    <span class="toolbar-status">Ready</span>
                </div>
                <div class="toolbar-buttons">
                    <button class="toolbar-btn" data-action="help" title="Help (H)">❓</button>
                    <button class="toolbar-btn" data-action="export" title="Export (Ctrl+S)">💾</button>
                    <button class="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)">↶</button>
                    <button class="toolbar-btn" data-action="close" title="Close (Ctrl+E)">×</button>
                </div>
            </div>
        `;
        
        this.toolbar.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: rgba(15, 15, 18, 0.95);
            backdrop-filter: blur(12px);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 1rem;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            pointer-events: auto;
            min-width: 280px;
            animation: slideIn 0.3s ease;
        `;

        // Create property panel
        this.propertyPanel = document.createElement('div');
        this.propertyPanel.className = 'standalone-property-panel';
        this.propertyPanel.style.cssText = `
            position: fixed;
            top: 6rem;
            right: 1rem;
            width: 320px;
            max-height: 70vh;
            overflow-y: auto;
            background: rgba(15, 15, 18, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid #333;
            border-radius: 12px;
            padding: 1rem;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            pointer-events: auto;
            display: none;
            animation: slideIn 0.3s ease;
        `;
        
        this.overlay.appendChild(this.toolbar);
        this.overlay.appendChild(this.propertyPanel);
        document.body.appendChild(this.overlay);
        
        this.setupToolbarEvents();
        this.addEditorStyles();
    }

    addEditorStyles() {
        const style = document.createElement('style');
        style.id = 'standalone-editor-styles';
        style.textContent = `
            @keyframes slideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(-20px); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
            }

            .toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }

            .toolbar-title {
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .toolbar-status {
                background: #00ff88;
                color: #000;
                padding: 0.125rem 0.5rem;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .toolbar-buttons {
                display: flex;
                gap: 0.5rem;
            }

            .toolbar-btn {
                background: transparent;
                border: 1px solid #444;
                color: #fff;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .toolbar-btn:hover {
                background: #00ff88;
                color: #000;
                border-color: #00ff88;
                transform: scale(1.05);
            }

            .design-editable-highlight {
                outline: 2px dashed rgba(0, 255, 136, 0.7) !important;
                outline-offset: 2px !important;
                position: relative;
            }

            .design-editable-highlight::after {
                content: '✏️ Click to Edit';
                position: absolute;
                top: -8px;
                right: -8px;
                background: #00ff88;
                color: #000;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                z-index: 10001;
                white-space: nowrap;
            }

            .design-selected {
                outline: 3px solid #00ff88 !important;
                outline-offset: 2px !important;
                position: relative;
            }

            .design-selected::after {
                content: '✏️ Editing';
                position: absolute;
                top: -8px;
                right: -8px;
                background: #00ff88;
                color: #000;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                z-index: 10001;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .property-control {
                margin-bottom: 1rem;
            }

            .property-label {
                display: block;
                color: #00ff88;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .property-input {
                width: 100%;
                background: #333;
                border: 1px solid #555;
                color: #fff;
                padding: 0.5rem;
                border-radius: 6px;
                font-size: 14px;
            }

            .property-input:focus {
                outline: none;
                border-color: #00ff88;
                box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.2);
            }

            .property-slider {
                width: 100%;
                height: 6px;
                background: #333;
                border-radius: 3px;
                outline: none;
                -webkit-appearance: none;
            }

            .property-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                background: #00ff88;
                border-radius: 50%;
                cursor: pointer;
            }

            .property-slider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                background: #00ff88;
                border-radius: 50%;
                cursor: pointer;
                border: none;
            }

            .property-section-title {
                color: #00ff88;
                font-size: 14px;
                font-weight: 600;
                margin: 1rem 0 0.5rem 0;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #333;
            }

            .color-input-group {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }

            .color-picker {
                width: 40px;
                height: 40px;
                border: 1px solid #555;
                border-radius: 6px;
                background: none;
                cursor: pointer;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .standalone-editor-toolbar,
                .standalone-property-panel {
                    right: 0.5rem;
                    left: 0.5rem;
                    width: auto;
                }
                
                .standalone-property-panel {
                    max-height: 50vh;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupToolbarEvents() {
        this.toolbar.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleToolbarAction(action);
            }
        });
    }

    handleToolbarAction(action) {
        switch (action) {
            case 'help':
                this.showHelp();
                break;
            case 'export':
                this.exportStyles();
                break;
            case 'undo':
                this.undo();
                break;
            case 'close':
                this.toggleEditor();
                break;
        }
    }

    toggleEditor() {
        this.isActive = !this.isActive;
        
        if (this.isActive) {
            this.activateEditor();
        } else {
            this.deactivateEditor();
        }
    }

    activateEditor() {
        console.log('✏️ Activating standalone live editor...');
        
        // Show overlay
        this.overlay.style.display = 'block';
        
        // Update toolbar status
        const status = this.toolbar.querySelector('.toolbar-status');
        if (status) {
            status.textContent = 'Active';
            status.style.background = '#00ff88';
        }
        
        // Make elements selectable
        this.makeElementsSelectable();
        
        // Show notification
        this.showNotification('✏️ Live Editor Active - Click any element to edit!', 'success');
    }

    deactivateEditor() {
        console.log('🔒 Deactivating live editor...');
        
        // Hide overlay
        this.overlay.style.display = 'none';
        
        // Deselect current element
        this.deselectElement();
        
        // Remove selectability
        this.removeElementSelectability();
        
        // Show notification
        this.showNotification('🔒 Live Editor Disabled', 'info');
    }

    makeElementsSelectable() {
        const editableSelectors = [
            '.design-editable',
            '.btn-system, button',
            '.card-system, .demo-party-card',
            '.input-system, input',
            '.nav-tab-system',
            'h1, h2, h3, h4, h5, h6',
            '.sidebar-professional',
            '.badge-system'
        ];
        
        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (element.closest('.standalone-editor-overlay')) return; // Skip editor elements
                
                element.classList.add('design-editable-highlight');
                element.style.cursor = 'pointer';
                
                element.addEventListener('click', this.handleElementClick.bind(this), true);
                element.addEventListener('mouseenter', this.handleElementHover.bind(this));
                element.addEventListener('mouseleave', this.handleElementLeave.bind(this));
            });
        });
    }

    removeElementSelectability() {
        document.querySelectorAll('.design-editable-highlight').forEach(element => {
            element.classList.remove('design-editable-highlight');
            element.style.cursor = '';
            element.removeEventListener('click', this.handleElementClick, true);
            element.removeEventListener('mouseenter', this.handleElementHover);
            element.removeEventListener('mouseleave', this.handleElementLeave);
        });
    }

    handleElementClick(e) {
        if (!this.isActive) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.selectElement(e.target);
    }

    handleElementHover(e) {
        if (!this.isActive || e.target === this.selectedElement) return;
        // Hover effects are handled by CSS
    }

    handleElementLeave(e) {
        if (!this.isActive || e.target === this.selectedElement) return;
        // Leave effects are handled by CSS
    }

    selectElement(element) {
        // Deselect previous element
        this.deselectElement();
        
        this.selectedElement = element;
        
        // Visual selection indicator
        element.classList.add('design-selected');
        element.classList.remove('design-editable-highlight');
        
        // Show property panel
        this.showPropertyPanel(element);
        
        // Update toolbar status
        const status = this.toolbar.querySelector('.toolbar-status');
        if (status) {
            status.textContent = 'Editing';
            status.style.background = '#ff6b6b';
        }
        
        console.log('🎯 Element selected:', element.tagName, element.className);
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('design-selected');
            this.selectedElement.classList.add('design-editable-highlight');
            this.selectedElement = null;
        }
        
        // Hide property panel
        this.propertyPanel.style.display = 'none';
        
        // Update toolbar status
        const status = this.toolbar.querySelector('.toolbar-status');
        if (status) {
            status.textContent = 'Active';
            status.style.background = '#00ff88';
        }
    }

    showPropertyPanel(element) {
        const computedStyle = getComputedStyle(element);
        
        this.propertyPanel.innerHTML = `
            <div class="property-header">
                <h3 style="color: #00ff88; margin: 0 0 1rem 0; font-size: 16px;">
                    🎨 Element Properties
                </h3>
                <div style="color: #999; font-size: 12px; font-family: monospace; margin-bottom: 1rem;">
                    ${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ')[0] : ''}
                </div>
            </div>
            
            <div class="property-sections">
                ${this.generatePropertySections(element, computedStyle)}
            </div>
        `;
        
        this.propertyPanel.style.display = 'block';
        this.setupPropertyInputs();
    }

    generatePropertySections(element, computedStyle) {
        const sections = [
            {
                title: '📐 Layout & Spacing',
                properties: ['padding', 'margin', 'width', 'height']
            },
            {
                title: '🎨 Colors',
                properties: ['color', 'backgroundColor', 'borderColor']
            },
            {
                title: '🔤 Typography', 
                properties: ['fontSize', 'fontWeight', 'lineHeight']
            },
            {
                title: '🔲 Borders & Effects',
                properties: ['borderRadius', 'borderWidth', 'opacity']
            }
        ];
        
        return sections.map(section => `
            <div class="property-section">
                <h4 class="property-section-title">${section.title}</h4>
                ${section.properties.map(prop => 
                    this.generatePropertyControl(prop, element, computedStyle)
                ).join('')}
            </div>
        `).join('');
    }

    generatePropertyControl(property, element, computedStyle) {
        const config = this.editableProperties.get(property);
        if (!config) return '';
        
        const cssProperty = config.cssProperty || property;
        const currentValue = computedStyle.getPropertyValue(cssProperty) || '';
        
        switch (config.type) {
            case 'dimension':
            case 'spacing':
                return this.generateSliderControl(property, currentValue, config);
            case 'number':
                return this.generateSliderControl(property, currentValue, config);
            case 'color':
                return this.generateColorControl(property, currentValue, config);
            case 'select':
                return this.generateSelectControl(property, currentValue, config);
            default:
                return this.generateTextControl(property, currentValue, config);
        }
    }

    generateSliderControl(property, currentValue, config) {
        const numericValue = parseFloat(currentValue) || config.min || 0;
        
        return `
            <div class="property-control">
                <label class="property-label">${property}</label>
                <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem;">
                    <input type="range" 
                           class="property-slider"
                           data-property="${property}"
                           min="${config.min || 0}"
                           max="${config.max || 100}"
                           step="${config.step || 1}"
                           value="${numericValue}">
                    <span style="color: #999; font-size: 12px; min-width: 60px;">
                        ${numericValue}${config.unit || ''}
                    </span>
                </div>
            </div>
        `;
    }

    generateColorControl(property, currentValue, config) {
        const hexValue = this.rgbToHex(currentValue) || '#000000';
        
        return `
            <div class="property-control">
                <label class="property-label">${property}</label>
                <div class="color-input-group">
                    <input type="color"
                           class="color-picker"
                           data-property="${property}"
                           value="${hexValue}">
                    <input type="text"
                           class="property-input"
                           data-property="${property}"
                           data-input-type="text"
                           value="${hexValue}"
                           placeholder="#000000"
                           style="font-family: monospace; font-size: 12px;">
                </div>
            </div>
        `;
    }

    generateSelectControl(property, currentValue, config) {
        return `
            <div class="property-control">
                <label class="property-label">${property}</label>
                <select class="property-input" data-property="${property}">
                    ${config.options.map(option => `
                        <option value="${option}" ${currentValue === option ? 'selected' : ''}>
                            ${option}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    generateTextControl(property, currentValue, config) {
        return `
            <div class="property-control">
                <label class="property-label">${property}</label>
                <input type="text"
                       class="property-input"
                       data-property="${property}"
                       value="${currentValue}">
            </div>
        `;
    }

    setupPropertyInputs() {
        const inputs = this.propertyPanel.querySelectorAll('[data-property]');
        
        inputs.forEach(input => {
            const property = input.getAttribute('data-property');
            const config = this.editableProperties.get(property);
            
            input.addEventListener('input', (e) => {
                this.updateElementProperty(property, e.target.value, config);
                
                // Update slider display
                if (input.type === 'range') {
                    const span = input.parentElement.querySelector('span');
                    if (span) {
                        span.textContent = `${e.target.value}${config.unit || ''}`;
                    }
                }
            });
        });
    }

    updateElementProperty(property, value, config) {
        if (!this.selectedElement || !config) return;
        
        const cssProperty = config.cssProperty || property;
        let cssValue = value;
        
        // Add units if needed
        if (config.unit && !isNaN(value) && value !== '') {
            cssValue = value + config.unit;
        }
        
        // Save to history before changing
        this.saveToHistory();
        
        // Apply the change
        this.selectedElement.style.setProperty(cssProperty, cssValue);
        
        console.log(`🎨 Updated ${property}:`, cssValue);
    }

    saveToHistory() {
        if (!this.selectedElement) return;
        
        const state = {
            element: this.selectedElement,
            styles: this.selectedElement.style.cssText,
            timestamp: Date.now()
        };
        
        this.undoHistory.push(state);
        this.redoHistory = []; // Clear redo history
        
        // Limit history size
        if (this.undoHistory.length > this.maxHistorySize) {
            this.undoHistory.shift();
        }
    }

    undo() {
        if (this.undoHistory.length === 0) {
            this.showNotification('Nothing to undo', 'info');
            return;
        }
        
        const currentState = {
            element: this.selectedElement,
            styles: this.selectedElement?.style.cssText || '',
            timestamp: Date.now()
        };
        
        this.redoHistory.push(currentState);
        
        const previousState = this.undoHistory.pop();
        
        if (previousState.element && previousState.element.isConnected) {
            previousState.element.style.cssText = previousState.styles;
            this.selectElement(previousState.element);
        }
        
        this.showNotification('↶ Undo applied', 'success');
    }

    exportStyles() {
        const styledElements = document.querySelectorAll('[style]');
        let css = '/* Live Editor Exported Styles */\n\n';
        
        styledElements.forEach((element, index) => {
            if (element.style.cssText && !element.closest('.standalone-editor-overlay')) {
                const selector = this.generateSelector(element, index);
                css += `${selector} {\n`;
                
                const styles = element.style.cssText.split(';');
                styles.forEach(style => {
                    if (style.trim()) {
                        css += `  ${style.trim()};\n`;
                    }
                });
                
                css += '}\n\n';
            }
        });
        
        this.downloadCSS(css, 'live-editor-styles.css');
        this.showNotification('💾 Styles exported!', 'success');
    }

    generateSelector(element, index) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        if (element.className) {
            const classes = element.className.split(' ').filter(c => 
                c.trim() && !c.includes('design-') && !c.includes('standalone-')
            );
            if (classes.length > 0) {
                return `.${classes[0]}`;
            }
        }
        
        return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }

    downloadCSS(css, filename) {
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    showHelp() {
        const helpHTML = `
            <div style="max-width: 500px; line-height: 1.6;">
                <h2 style="color: #00ff88; margin-bottom: 1rem;">✏️ Live Editor Guide</h2>
                
                <h3 style="color: #fff; margin: 1rem 0 0.5rem;">🚀 Getting Started</h3>
                <ul style="color: #ccc; margin: 0 0 1rem; padding-left: 1rem;">
                    <li>Press <strong>Ctrl+E</strong> to toggle the editor</li>
                    <li>Click any highlighted element to edit it</li>
                    <li>Use the property panel to make changes</li>
                    <li>Press <strong>Ctrl+S</strong> to export your styles</li>
                </ul>
                
                <h3 style="color: #fff; margin: 1rem 0 0.5rem;">⌨️ Keyboard Shortcuts</h3>
                <ul style="color: #ccc; margin: 0 0 1rem; padding-left: 1rem;">
                    <li><strong>Ctrl+E</strong> - Toggle editor on/off</li>
                    <li><strong>Escape</strong> - Deselect element</li>
                    <li><strong>Ctrl+Z</strong> - Undo changes</li>
                    <li><strong>Ctrl+S</strong> - Export styles</li>
                    <li><strong>H</strong> - Show this help</li>
                </ul>
                
                <h3 style="color: #fff; margin: 1rem 0 0.5rem;">🎨 What You Can Edit</h3>
                <ul style="color: #ccc; margin: 0; padding-left: 1rem;">
                    <li><strong>Layout:</strong> Padding, margin, width, height</li>
                    <li><strong>Colors:</strong> Text, background, borders</li>
                    <li><strong>Typography:</strong> Size, weight, line height</li>
                    <li><strong>Effects:</strong> Border radius, opacity</li>
                </ul>
                
                <div style="background: rgba(0, 255, 136, 0.1); padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #00ff88;">
                    <strong style="color: #00ff88;">💡 Pro Tip:</strong>
                    <p style="margin: 0.5rem 0 0; color: #ccc;">
                        All changes are applied instantly! Export your styles when you're happy with the results.
                    </p>
                </div>
            </div>
        `;
        
        this.showModal('Live Editor Help', helpHTML);
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            padding: 2rem;
            backdrop-filter: blur(10px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border: 2px solid #00ff88;
                border-radius: 12px;
                padding: 2rem;
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 50px rgba(0, 255, 136, 0.3);
                position: relative;
            ">
                <button onclick="this.closest('[style*=fixed]').remove()" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: #999;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.15s ease;
                " onmouseover="this.style.background='#333'; this.style.color='#fff';" onmouseout="this.style.background='none'; this.style.color='#999';">×</button>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            success: '#00ff88',
            info: '#3b82f6',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.info};
            color: ${type === 'success' ? '#000' : '#fff'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 15000;
            animation: slideUp 0.3s ease;
            max-width: 400px;
            text-align: center;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showWelcomeMessage() {
        const welcome = document.createElement('div');
        welcome.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 2rem;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 20px 50px rgba(0, 255, 136, 0.4);
            z-index: 15000;
            max-width: 500px;
            text-align: center;
            animation: slideIn 0.5s ease;
        `;
        
        welcome.innerHTML = `
            <h2 style="color: #00ff88; margin: 0 0 1rem;">✏️ Live Visual Editor</h2>
            <p style="margin: 0 0 1.5rem; color: #ccc; line-height: 1.5;">
                Welcome to the Live Visual Editor! You can now edit any element by clicking on it.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="this.closest('[style*=fixed]').remove(); standaloneLiveEditor.activateEditor();" style="
                    background: #00ff88;
                    color: #000;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">🚀 Start Editing</button>
                <button onclick="this.closest('[style*=fixed]').remove();" style="
                    background: transparent;
                    color: #999;
                    border: 1px solid #555;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                ">Later</button>
            </div>
            <p style="font-size: 12px; color: #666; margin: 1rem 0 0; line-height: 1.4;">
                💡 Tip: Press <strong>Ctrl+E</strong> anytime to toggle the editor
            </p>
        `;
        
        document.body.appendChild(welcome);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (welcome.parentNode) {
                welcome.remove();
            }
        }, 10000);
    }

    addVisualIndicators() {
        // Visual indicators are handled by CSS classes
    }

    rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'inherit') return '#000000';
        
        if (rgb.startsWith('#')) return rgb;
        
        const match = rgb.match(/rgba?\(([^)]+)\)/);
        if (!match) return '#000000';
        
        const values = match[1].split(',').map(v => parseInt(v.trim()));
        
        return '#' + values.slice(0, 3).map(v => 
            Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
        ).join('');
    }
}

// Initialize Standalone Live Editor
let standaloneLiveEditor;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        standaloneLiveEditor = new StandaloneLiveEditor();
        window.standaloneLiveEditor = standaloneLiveEditor;
    });
} else {
    standaloneLiveEditor = new StandaloneLiveEditor();
    window.standaloneLiveEditor = standaloneLiveEditor;
}

// CSS animations
if (!document.getElementById('standalone-editor-animations')) {
    const style = document.createElement('style');
    style.id = 'standalone-editor-animations';
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

console.log('✏️ Standalone Live Visual Editor loaded and ready!');