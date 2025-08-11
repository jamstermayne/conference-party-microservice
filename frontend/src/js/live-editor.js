/**
 * LIVE VISUAL EDITOR - Professional Intelligence Platform
 * Real-time visual editing with perfect design consistency
 * Click-to-edit interface with instant visual feedback
 */

class LiveVisualEditor {
    constructor() {
        this.isActive = false;
        this.selectedElement = null;
        this.editableProperties = new Map();
        this.undoHistory = [];
        this.redoHistory = [];
        this.maxHistorySize = 50;
        
        // Design system integration
        this.designSystem = null;
        this.ws = null;
        
        // Editing state
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragStartSize = { width: 0, height: 0 };
        
        this.init();
    }

    init() {
        console.log('✏️ Live Visual Editor initializing...');
        
        // Only initialize in development mode
        if (!this.isDevelopmentMode()) {
            return;
        }
        
        this.setupEditableProperties();
        this.setupKeyboardShortcuts();
        this.connectToDesignSystem();
        this.setupVisualEditingOverlay();
        
        console.log('✅ Live Visual Editor ready');
    }

    isDevelopmentMode() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.search.includes('edit=1') ||
               document.body.hasAttribute('data-dev-mode');
    }

    setupEditableProperties() {
        // Define which CSS properties can be edited visually
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
            ['letterSpacing', { type: 'dimension', unit: 'em', min: -0.1, max: 0.2, step: 0.01, cssProperty: 'letter-spacing' }],
            
            // Color Properties
            ['color', { type: 'color' }],
            ['backgroundColor', { type: 'color', cssProperty: 'background-color' }],
            ['borderColor', { type: 'color', cssProperty: 'border-color' }],
            
            // Border Properties
            ['borderRadius', { type: 'dimension', unit: 'rem', min: 0, max: 2, step: 0.125, cssProperty: 'border-radius' }],
            ['borderWidth', { type: 'dimension', unit: 'px', min: 0, max: 10, cssProperty: 'border-width' }],
            
            // Effects
            ['opacity', { type: 'number', min: 0, max: 1, step: 0.05 }],
            ['transform', { type: 'transform' }],
            ['boxShadow', { type: 'shadow', cssProperty: 'box-shadow' }],
            
            // Flexbox Properties
            ['justifyContent', { type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'], cssProperty: 'justify-content' }],
            ['alignItems', { type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'], cssProperty: 'align-items' }],
            ['flexDirection', { type: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'], cssProperty: 'flex-direction' }],
            ['flexWrap', { type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'], cssProperty: 'flex-wrap' }],
        ]);
        
        console.log('📝 Editable properties configured:', this.editableProperties.size);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when editor is active
            if (!this.isActive) return;
            
            // Check for modifier keys
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
                    e.preventDefault();
                    this.deselectElement();
                    break;
                    
                case 'z':
                case 'Z':
                    if (isMod && !e.shiftKey) {
                        e.preventDefault();
                        this.undo();
                    } else if (isMod && e.shiftKey) {
                        e.preventDefault();
                        this.redo();
                    }
                    break;
                    
                case 's':
                case 'S':
                    if (isMod) {
                        e.preventDefault();
                        this.exportStyles();
                    }
                    break;
                    
                case 'r':
                case 'R':
                    if (isMod && e.shiftKey) {
                        e.preventDefault();
                        this.resetElement();
                    }
                    break;
                    
                case 'c':
                case 'C':
                    if (isMod && this.selectedElement) {
                        e.preventDefault();
                        this.copyElementStyles();
                    }
                    break;
                    
                case 'v':
                case 'V':
                    if (isMod && this.selectedElement && this.copiedStyles) {
                        e.preventDefault();
                        this.pasteElementStyles();
                    }
                    break;
            }
        });
        
        console.log('⌨️ Keyboard shortcuts configured');
    }

    connectToDesignSystem() {
        // Connect to design system editor if available
        try {
            this.ws = new WebSocket('ws://localhost:3101'); // Design system editor WebSocket
            
            this.ws.onopen = () => {
                console.log('🎨 Connected to Design System Editor');
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleDesignSystemMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('🎨 Design System Editor disconnected');
            };
            
        } catch (error) {
            console.log('🎨 Design System Editor not available, running standalone');
        }
    }

    handleDesignSystemMessage(data) {
        switch (data.type) {
            case 'token-updated':
                this.refreshDesignTokens();
                break;
                
            case 'component-updated':
                this.refreshComponent(data.component);
                break;
                
            case 'theme-changed':
                this.applyTheme(data.theme);
                break;
        }
    }

    setupVisualEditingOverlay() {
        // Create editing overlay UI
        this.overlay = document.createElement('div');
        this.overlay.className = 'live-editor-overlay';
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
        
        // Create editor toolbar
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'live-editor-toolbar';
        this.toolbar.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid #333;
            border-radius: 0.75rem;
            padding: 0.75rem;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 0.875rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            display: flex;
            gap: 0.5rem;
            align-items: center;
        `;
        
        // Create property panel
        this.propertyPanel = document.createElement('div');
        this.propertyPanel.className = 'live-editor-properties';
        this.propertyPanel.style.cssText = `
            position: fixed;
            top: 5rem;
            right: 1rem;
            width: 320px;
            max-height: 70vh;
            overflow-y: auto;
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid #333;
            border-radius: 0.75rem;
            padding: 1rem;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 0.875rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            display: none;
        `;
        
        this.overlay.appendChild(this.toolbar);
        this.overlay.appendChild(this.propertyPanel);
        document.body.appendChild(this.overlay);
        
        this.setupToolbar();
        console.log('🎨 Visual editing overlay created');
    }

    setupToolbar() {
        this.toolbar.innerHTML = `
            <button class="editor-btn" data-action="toggle" title="Toggle Editor (Ctrl+E)">
                ✏️ Edit
            </button>
            <button class="editor-btn" data-action="undo" title="Undo (Ctrl+Z)">
                ↶
            </button>
            <button class="editor-btn" data-action="redo" title="Redo (Ctrl+Shift+Z)">
                ↷
            </button>
            <button class="editor-btn" data-action="export" title="Export CSS (Ctrl+S)">
                💾
            </button>
            <button class="editor-btn" data-action="help" title="Show Help">
                ❓
            </button>
        `;
        
        // Style buttons
        const buttons = this.toolbar.querySelectorAll('.editor-btn');
        buttons.forEach(btn => {
            btn.style.cssText = `
                background: transparent;
                border: 1px solid #444;
                color: #fff;
                padding: 0.5rem 0.75rem;
                border-radius: 0.375rem;
                cursor: pointer;
                font-size: 0.8125rem;
                transition: all 0.15s ease;
            `;
            
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#00ff88';
                btn.style.color = '#000';
                btn.style.borderColor = '#00ff88';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'transparent';
                btn.style.color = '#fff';
                btn.style.borderColor = '#444';
            });
            
            btn.addEventListener('click', (e) => {
                this.handleToolbarAction(e.target.dataset.action);
            });
        });
    }

    handleToolbarAction(action) {
        switch (action) {
            case 'toggle':
                this.toggleEditor();
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'export':
                this.exportStyles();
                break;
            case 'help':
                this.showHelp();
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
        console.log('✏️ Activating visual editor...');
        
        // Show overlay
        this.overlay.style.display = 'block';
        
        // Update toolbar button
        const toggleBtn = this.toolbar.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.textContent = '🔒 Lock';
            toggleBtn.style.background = '#00ff88';
            toggleBtn.style.color = '#000';
            toggleBtn.style.borderColor = '#00ff88';
        }
        
        // Make elements selectable
        this.makeElementsSelectable();
        
        // Add visual indicators
        this.addVisualIndicators();
        
        // Show notification
        this.showNotification('✏️ Visual Editor Active - Click elements to edit', 'success');
    }

    deactivateEditor() {
        console.log('🔒 Deactivating visual editor...');
        
        // Hide overlay
        this.overlay.style.display = 'none';
        
        // Update toolbar button
        const toggleBtn = this.toolbar.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.textContent = '✏️ Edit';
            toggleBtn.style.background = 'transparent';
            toggleBtn.style.color = '#fff';
            toggleBtn.style.borderColor = '#444';
        }
        
        // Deselect current element
        this.deselectElement();
        
        // Remove selectability
        this.removeElementSelectability();
        
        // Remove visual indicators
        this.removeVisualIndicators();
        
        // Show notification
        this.showNotification('🔒 Visual Editor Disabled', 'info');
    }

    makeElementsSelectable() {
        // Find editable elements
        const editableSelectors = [
            '.btn, button',
            '.card, .event-card',
            '.input, input, textarea',
            '.nav-tab',
            'h1, h2, h3, h4, h5, h6',
            'p, span, div',
            '.badge',
            '.loading'
        ];
        
        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                // Skip if already has editor attributes
                if (element.hasAttribute('data-editor-selectable')) return;
                
                element.setAttribute('data-editor-selectable', 'true');
                element.style.cursor = 'pointer';
                
                // Add click handler
                element.addEventListener('click', this.handleElementClick.bind(this), true);
                
                // Add hover effect
                element.addEventListener('mouseenter', this.handleElementHover.bind(this));
                element.addEventListener('mouseleave', this.handleElementLeave.bind(this));
            });
        });
    }

    removeElementSelectability() {
        document.querySelectorAll('[data-editor-selectable]').forEach(element => {
            element.removeAttribute('data-editor-selectable');
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
        
        e.target.style.outline = '2px dashed rgba(0, 255, 136, 0.5)';
        e.target.style.outlineOffset = '2px';
    }

    handleElementLeave(e) {
        if (!this.isActive || e.target === this.selectedElement) return;
        
        e.target.style.outline = '';
        e.target.style.outlineOffset = '';
    }

    selectElement(element) {
        // Deselect previous element
        this.deselectElement();
        
        this.selectedElement = element;
        
        // Visual selection indicator
        element.style.outline = '2px solid #00ff88';
        element.style.outlineOffset = '2px';
        element.setAttribute('data-editor-selected', 'true');
        
        // Show property panel
        this.showPropertyPanel(element);
        
        console.log('🎯 Element selected:', element.tagName, element.className);
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.style.outline = '';
            this.selectedElement.style.outlineOffset = '';
            this.selectedElement.removeAttribute('data-editor-selected');
            this.selectedElement = null;
        }
        
        // Hide property panel
        this.propertyPanel.style.display = 'none';
    }

    showPropertyPanel(element) {
        const computedStyle = getComputedStyle(element);
        
        this.propertyPanel.innerHTML = `
            <div class="property-header" style="
                border-bottom: 1px solid #333;
                padding-bottom: 0.75rem;
                margin-bottom: 0.75rem;
            ">
                <h3 style="
                    color: #00ff88;
                    font-size: 1rem;
                    margin: 0 0 0.25rem 0;
                    font-weight: 600;
                ">Element Properties</h3>
                <div style="
                    color: #999;
                    font-size: 0.75rem;
                    font-family: monospace;
                ">${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ').join('.') : ''}</div>
            </div>
            
            <div class="property-sections">
                ${this.generatePropertySections(element, computedStyle)}
            </div>
        `;
        
        this.propertyPanel.style.display = 'block';
        
        // Setup property inputs
        this.setupPropertyInputs();
    }

    generatePropertySections(element, computedStyle) {
        const sections = [
            {
                title: '📐 Layout',
                properties: ['width', 'height', 'padding', 'margin', 'gap']
            },
            {
                title: '🔤 Typography', 
                properties: ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing']
            },
            {
                title: '🎨 Colors',
                properties: ['color', 'backgroundColor', 'borderColor']
            },
            {
                title: '🔲 Borders',
                properties: ['borderRadius', 'borderWidth']
            },
            {
                title: '✨ Effects',
                properties: ['opacity', 'boxShadow']
            },
            {
                title: '📦 Flexbox',
                properties: ['justifyContent', 'alignItems', 'flexDirection', 'flexWrap']
            }
        ];
        
        return sections.map(section => `
            <div class="property-section" style="margin-bottom: 1.5rem;">
                <h4 style="
                    color: #ccc;
                    font-size: 0.8125rem;
                    margin: 0 0 0.75rem 0;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                ">${section.title}</h4>
                <div class="property-controls">
                    ${section.properties.map(prop => 
                        this.generatePropertyControl(prop, element, computedStyle)
                    ).join('')}
                </div>
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
                return this.generateDimensionControl(property, currentValue, config);
                
            case 'number':
                return this.generateNumberControl(property, currentValue, config);
                
            case 'color':
                return this.generateColorControl(property, currentValue, config);
                
            case 'select':
                return this.generateSelectControl(property, currentValue, config);
                
            default:
                return this.generateTextControl(property, currentValue, config);
        }
    }

    generateDimensionControl(property, currentValue, config) {
        const numericValue = parseFloat(currentValue) || config.min || 0;
        
        return `
            <div class="property-control" style="margin-bottom: 0.75rem;">
                <label style="
                    display: block;
                    color: #ccc;
                    font-size: 0.75rem;
                    margin-bottom: 0.25rem;
                    text-transform: capitalize;
                ">${property.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="range" 
                           data-property="${property}"
                           min="${config.min || 0}"
                           max="${config.max || 100}"
                           step="${config.step || 1}"
                           value="${numericValue}"
                           style="flex: 1; accent-color: #00ff88;">
                    <input type="number"
                           data-property="${property}"
                           data-input-type="number"
                           min="${config.min || 0}"
                           max="${config.max || 100}"
                           step="${config.step || 1}"
                           value="${numericValue}"
                           style="
                               width: 4rem;
                               background: #333;
                               border: 1px solid #555;
                               color: #fff;
                               padding: 0.25rem;
                               border-radius: 0.25rem;
                               font-size: 0.75rem;
                           ">
                    <span style="color: #999; font-size: 0.75rem;">${config.unit || ''}</span>
                </div>
            </div>
        `;
    }

    generateNumberControl(property, currentValue, config) {
        const numericValue = parseFloat(currentValue) || config.min || 0;
        
        return `
            <div class="property-control" style="margin-bottom: 0.75rem;">
                <label style="
                    display: block;
                    color: #ccc;
                    font-size: 0.75rem;
                    margin-bottom: 0.25rem;
                    text-transform: capitalize;
                ">${property.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                <input type="range"
                       data-property="${property}"
                       min="${config.min || 0}"
                       max="${config.max || 10}"
                       step="${config.step || 0.1}"
                       value="${numericValue}"
                       style="width: 100%; accent-color: #00ff88;">
                <div style="color: #999; font-size: 0.75rem; text-align: center;">${numericValue}</div>
            </div>
        `;
    }

    generateColorControl(property, currentValue, config) {
        // Convert RGB to hex if needed
        const hexValue = this.rgbToHex(currentValue) || '#000000';
        
        return `
            <div class="property-control" style="margin-bottom: 0.75rem;">
                <label style="
                    display: block;
                    color: #ccc;
                    font-size: 0.75rem;
                    margin-bottom: 0.25rem;
                    text-transform: capitalize;
                ">${property.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="color"
                           data-property="${property}"
                           value="${hexValue}"
                           style="
                               width: 2rem;
                               height: 2rem;
                               border: 1px solid #555;
                               border-radius: 0.25rem;
                               background: none;
                           ">
                    <input type="text"
                           data-property="${property}"
                           data-input-type="text"
                           value="${hexValue}"
                           placeholder="#000000"
                           style="
                               flex: 1;
                               background: #333;
                               border: 1px solid #555;
                               color: #fff;
                               padding: 0.25rem;
                               border-radius: 0.25rem;
                               font-size: 0.75rem;
                               font-family: monospace;
                           ">
                </div>
            </div>
        `;
    }

    generateSelectControl(property, currentValue, config) {
        return `
            <div class="property-control" style="margin-bottom: 0.75rem;">
                <label style="
                    display: block;
                    color: #ccc;
                    font-size: 0.75rem;
                    margin-bottom: 0.25rem;
                    text-transform: capitalize;
                ">${property.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                <select data-property="${property}"
                        style="
                            width: 100%;
                            background: #333;
                            border: 1px solid #555;
                            color: #fff;
                            padding: 0.5rem;
                            border-radius: 0.25rem;
                            font-size: 0.75rem;
                        ">
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
            <div class="property-control" style="margin-bottom: 0.75rem;">
                <label style="
                    display: block;
                    color: #ccc;
                    font-size: 0.75rem;
                    margin-bottom: 0.25rem;
                    text-transform: capitalize;
                ">${property.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                <input type="text"
                       data-property="${property}"
                       value="${currentValue}"
                       style="
                           width: 100%;
                           background: #333;
                           border: 1px solid #555;
                           color: #fff;
                           padding: 0.5rem;
                           border-radius: 0.25rem;
                           font-size: 0.75rem;
                       ">
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
            });
            
            input.addEventListener('change', (e) => {
                this.saveToHistory();
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
        
        // Apply the change
        this.selectedElement.style.setProperty(cssProperty, cssValue);
        
        // Update related inputs (for sliders and number inputs)
        this.syncPropertyInputs(property, value);
        
        console.log(`🎨 Updated ${property}:`, cssValue);
    }

    syncPropertyInputs(property, value) {
        const inputs = this.propertyPanel.querySelectorAll(`[data-property="${property}"]`);
        
        inputs.forEach(input => {
            if (input.value !== value) {
                input.value = value;
            }
        });
    }

    saveToHistory() {
        if (!this.selectedElement) return;
        
        const state = {
            element: this.selectedElement,
            styles: this.selectedElement.style.cssText,
            timestamp: Date.now()
        };
        
        this.undoHistory.push(state);
        
        // Clear redo history when new change is made
        this.redoHistory = [];
        
        // Limit history size
        if (this.undoHistory.length > this.maxHistorySize) {
            this.undoHistory.shift();
        }
    }

    undo() {
        if (this.undoHistory.length === 0) return;
        
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
        
        console.log('↶ Undo applied');
        this.showNotification('↶ Undo', 'info');
    }

    redo() {
        if (this.redoHistory.length === 0) return;
        
        const currentState = {
            element: this.selectedElement,
            styles: this.selectedElement?.style.cssText || '',
            timestamp: Date.now()
        };
        
        this.undoHistory.push(currentState);
        
        const nextState = this.redoHistory.pop();
        
        if (nextState.element && nextState.element.isConnected) {
            nextState.element.style.cssText = nextState.styles;
            this.selectElement(nextState.element);
        }
        
        console.log('↷ Redo applied');
        this.showNotification('↷ Redo', 'info');
    }

    copyElementStyles() {
        if (!this.selectedElement) return;
        
        this.copiedStyles = {
            cssText: this.selectedElement.style.cssText,
            computedStyle: getComputedStyle(this.selectedElement)
        };
        
        console.log('📋 Styles copied');
        this.showNotification('📋 Styles Copied', 'success');
    }

    pasteElementStyles() {
        if (!this.selectedElement || !this.copiedStyles) return;
        
        this.saveToHistory();
        this.selectedElement.style.cssText = this.copiedStyles.cssText;
        this.showPropertyPanel(this.selectedElement);
        
        console.log('📋 Styles pasted');
        this.showNotification('📋 Styles Pasted', 'success');
    }

    resetElement() {
        if (!this.selectedElement) return;
        
        this.saveToHistory();
        this.selectedElement.style.cssText = '';
        this.showPropertyPanel(this.selectedElement);
        
        console.log('🔄 Element reset');
        this.showNotification('🔄 Element Reset', 'info');
    }

    exportStyles() {
        const allStyledElements = document.querySelectorAll('[style]');
        let css = '/* Exported Styles from Live Editor */\n\n';
        
        allStyledElements.forEach((element, index) => {
            if (element.style.cssText) {
                const selector = this.generateSelector(element, index);
                css += `${selector} {\n`;
                
                // Convert inline styles to CSS
                const styles = element.style.cssText.split(';');
                styles.forEach(style => {
                    if (style.trim()) {
                        css += `  ${style.trim()};\n`;
                    }
                });
                
                css += '}\n\n';
            }
        });
        
        // Download CSS file
        this.downloadCSS(css, 'live-editor-styles.css');
        
        console.log('💾 Styles exported');
        this.showNotification('💾 Styles Exported', 'success');
    }

    generateSelector(element, index) {
        // Generate a meaningful CSS selector
        if (element.id) {
            return `#${element.id}`;
        }
        
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
                return `.${classes.join('.')}`;
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
        const helpContent = `
            <div style="max-width: 500px;">
                <h3 style="color: #00ff88; margin-bottom: 1rem;">Live Visual Editor Help</h3>
                
                <h4 style="color: #ccc; margin: 1rem 0 0.5rem 0;">Keyboard Shortcuts:</h4>
                <ul style="margin: 0; padding-left: 1rem; color: #999; font-size: 0.875rem;">
                    <li><strong>Ctrl+E</strong> - Toggle editor on/off</li>
                    <li><strong>Escape</strong> - Deselect element</li>
                    <li><strong>Ctrl+Z</strong> - Undo changes</li>
                    <li><strong>Ctrl+Shift+Z</strong> - Redo changes</li>
                    <li><strong>Ctrl+C</strong> - Copy element styles</li>
                    <li><strong>Ctrl+V</strong> - Paste element styles</li>
                    <li><strong>Ctrl+S</strong> - Export styles to CSS</li>
                    <li><strong>Ctrl+Shift+R</strong> - Reset element styles</li>
                </ul>
                
                <h4 style="color: #ccc; margin: 1rem 0 0.5rem 0;">How to Use:</h4>
                <ol style="margin: 0; padding-left: 1rem; color: #999; font-size: 0.875rem;">
                    <li>Click the ✏️ Edit button to activate</li>
                    <li>Click any element to select it</li>
                    <li>Use the property panel to make changes</li>
                    <li>Changes apply instantly</li>
                    <li>Export your styles when done</li>
                </ol>
            </div>
        `;
        
        this.showModal('Live Editor Help', helpContent);
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            padding: 2rem;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 0.75rem;
                padding: 2rem;
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                ">
                    <h2 style="margin: 0; color: #00ff88;">${title}</h2>
                    <button onclick="this.closest('[style*=fixed]').remove()" style="
                        background: none;
                        border: none;
                        color: #999;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0;
                        margin-left: 1rem;
                    ">×</button>
                </div>
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
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#374151'};
            color: #fff;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 0.875rem;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10002;
            animation: slideUp 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    addVisualIndicators() {
        // Add CSS for visual indicators
        if (!document.getElementById('live-editor-styles')) {
            const style = document.createElement('style');
            style.id = 'live-editor-styles';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(0); opacity: 1; }
                    to { transform: translateX(-50%) translateY(100%); opacity: 0; }
                }
                
                [data-editor-selectable]:hover {
                    outline: 2px dashed rgba(0, 255, 136, 0.5) !important;
                    outline-offset: 2px !important;
                }
                
                [data-editor-selected] {
                    outline: 2px solid #00ff88 !important;
                    outline-offset: 2px !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    removeVisualIndicators() {
        const style = document.getElementById('live-editor-styles');
        if (style) {
            style.remove();
        }
    }

    rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'inherit') return '#000000';
        
        // Handle hex colors
        if (rgb.startsWith('#')) return rgb;
        
        // Handle rgb/rgba colors
        const match = rgb.match(/rgba?\(([^)]+)\)/);
        if (!match) return '#000000';
        
        const values = match[1].split(',').map(v => parseInt(v.trim()));
        
        return '#' + values.slice(0, 3).map(v => 
            Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
        ).join('');
    }

    refreshDesignTokens() {
        // Refresh design tokens from design system
        console.log('🔄 Refreshing design tokens...');
    }

    refreshComponent(componentName) {
        // Refresh specific component styles
        console.log('🔄 Refreshing component:', componentName);
    }

    applyTheme(themeName) {
        // Apply theme change
        console.log('🎨 Applying theme:', themeName);
        document.body.setAttribute('data-theme', themeName);
    }
}

// Initialize Live Visual Editor
let liveEditor;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        liveEditor = new LiveVisualEditor();
        window.liveEditor = liveEditor;
    });
} else {
    liveEditor = new LiveVisualEditor();
    window.liveEditor = liveEditor;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveVisualEditor;
}

console.log('✏️ Live Visual Editor loaded!');