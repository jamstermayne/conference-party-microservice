#!/usr/bin/env node

/**
 * DESIGN SYSTEM VISUAL EDITOR
 * Live visual editing with perfect design consistency
 * Real-time preview and component library generation
 */

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class DesignSystemEditor {
    constructor(options = {}) {
        this.port = options.port || 3001;
        this.publicDir = options.publicDir || path.resolve('./public');
        this.designTokensFile = path.join(this.publicDir, 'css/tokens.css');
        this.componentLibraryFile = path.join(this.publicDir, 'css/design-system.css');
        
        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        
        // Design system state
        this.designTokens = new Map();
        this.components = new Map();
        this.themes = new Map();
        this.layouts = new Map();
        
        // Visual editing state
        this.selectedElement = null;
        this.editHistory = [];
        this.previewModes = ['mobile', 'tablet', 'desktop'];
        this.currentTheme = 'professional-dark';
        
        console.log('🎨 Design System Editor initializing...');
    }

    async start() {
        try {
            this.loadDesignSystem();
            this.setupServer();
            this.setupWebSocket();
            this.setupFileWatchers();
            
            this.server = this.app.listen(this.port, () => {
                console.log(`🎨 Design System Editor running at http://localhost:${this.port}`);
                console.log(`📐 Visual Editor: http://localhost:${this.port}/design-editor`);
                console.log(`🎯 Component Library: http://localhost:${this.port}/components`);
                console.log(`🎨 Design Tokens: http://localhost:${this.port}/tokens`);
            });
            
        } catch (error) {
            console.error('❌ Failed to start Design System Editor:', error);
            process.exit(1);
        }
    }

    loadDesignSystem() {
        console.log('📚 Loading design system...');
        
        // Load design tokens
        this.loadDesignTokens();
        
        // Load components
        this.loadComponents();
        
        // Load themes
        this.loadThemes();
        
        console.log('✅ Design system loaded');
    }

    loadDesignTokens() {
        const tokens = {
            // Color System
            colors: {
                primary: {
                    50: '#f0fff4',
                    100: '#dcfce7',
                    500: '#00ff88',
                    600: '#00cc70',
                    900: '#064e3b'
                },
                neutral: {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                    950: '#0a0a0a'
                },
                surface: {
                    bg: '#0f0f12',
                    card: '#1a1a1f',
                    elevated: '#2a2a35'
                },
                accent: {
                    purple: '#8b5cf6',
                    blue: '#3b82f6',
                    orange: '#f97316',
                    red: '#ef4444'
                }
            },
            
            // Typography Scale
            typography: {
                fontFamily: {
                    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    mono: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", monospace'
                },
                fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    base: '1rem',
                    lg: '1.125rem',
                    xl: '1.25rem',
                    '2xl': '1.5rem',
                    '3xl': '1.875rem',
                    '4xl': '2.25rem'
                },
                fontWeight: {
                    normal: '400',
                    medium: '500',
                    semibold: '600',
                    bold: '700'
                },
                lineHeight: {
                    none: '1',
                    tight: '1.25',
                    normal: '1.5',
                    relaxed: '1.625'
                }
            },
            
            // Spacing System
            spacing: {
                px: '1px',
                0: '0',
                1: '0.25rem',
                2: '0.5rem',
                3: '0.75rem',
                4: '1rem',
                5: '1.25rem',
                6: '1.5rem',
                8: '2rem',
                10: '2.5rem',
                12: '3rem',
                16: '4rem',
                20: '5rem',
                24: '6rem'
            },
            
            // Border Radius
            borderRadius: {
                none: '0',
                sm: '0.125rem',
                base: '0.25rem',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                '2xl': '1rem',
                full: '9999px'
            },
            
            // Shadows
            boxShadow: {
                sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                glow: '0 0 20px rgba(0, 255, 136, 0.3)'
            },
            
            // Animation
            animation: {
                duration: {
                    fast: '150ms',
                    normal: '300ms',
                    slow: '500ms'
                },
                easing: {
                    linear: 'linear',
                    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                }
            }
        };
        
        this.designTokens = new Map(Object.entries(tokens));
        console.log('🎨 Design tokens loaded:', this.designTokens.size, 'categories');
    }

    loadComponents() {
        const components = {
            // Button Components
            button: {
                base: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    fontFamily: 'var(--font-system)',
                    fontSize: '0.875rem',
                    lineHeight: '1.25'
                },
                variants: {
                    primary: {
                        background: 'var(--primary-500)',
                        color: '#000',
                        padding: '0.75rem 1.5rem'
                    },
                    secondary: {
                        background: 'var(--neutral-700)',
                        color: '#fff',
                        padding: '0.75rem 1.5rem'
                    },
                    ghost: {
                        background: 'transparent',
                        color: 'var(--primary-500)',
                        border: '1px solid var(--primary-500)',
                        padding: '0.75rem 1.5rem'
                    },
                    icon: {
                        background: 'transparent',
                        color: 'var(--neutral-400)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem'
                    }
                },
                sizes: {
                    sm: {
                        fontSize: '0.75rem',
                        padding: '0.5rem 1rem'
                    },
                    base: {
                        fontSize: '0.875rem',
                        padding: '0.75rem 1.5rem'
                    },
                    lg: {
                        fontSize: '1rem',
                        padding: '1rem 2rem'
                    }
                },
                states: {
                    hover: {
                        transform: 'translateY(-1px)',
                        boxShadow: 'var(--shadow-md)'
                    },
                    active: {
                        transform: 'translateY(0)'
                    },
                    disabled: {
                        opacity: '0.5',
                        cursor: 'not-allowed'
                    }
                }
            },
            
            // Card Components
            card: {
                base: {
                    background: 'var(--surface-card)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--neutral-800)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-base)'
                },
                variants: {
                    elevated: {
                        background: 'var(--surface-elevated)',
                        boxShadow: 'var(--shadow-lg)'
                    },
                    interactive: {
                        cursor: 'pointer',
                        transition: 'all 300ms ease'
                    },
                    professional: {
                        background: 'linear-gradient(135deg, var(--surface-card), var(--surface-elevated))',
                        border: '1px solid var(--primary-500)',
                        boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)'
                    }
                },
                states: {
                    hover: {
                        transform: 'translateY(-2px)',
                        boxShadow: 'var(--shadow-xl)'
                    }
                }
            },
            
            // Input Components
            input: {
                base: {
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--neutral-700)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-system)',
                    transition: 'all 150ms ease'
                },
                states: {
                    focus: {
                        outline: 'none',
                        borderColor: 'var(--primary-500)',
                        boxShadow: '0 0 0 3px rgba(0, 255, 136, 0.1)'
                    },
                    error: {
                        borderColor: 'var(--accent-red)',
                        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
                    }
                }
            },
            
            // Navigation Components
            navigation: {
                tab: {
                    base: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0.75rem 0.5rem',
                        color: 'var(--neutral-400)',
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        transition: 'all 150ms ease',
                        borderRadius: '0.5rem'
                    },
                    states: {
                        active: {
                            color: 'var(--primary-500)',
                            background: 'rgba(0, 255, 136, 0.1)'
                        },
                        hover: {
                            color: 'var(--neutral-300)',
                            background: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                }
            },
            
            // Event List Components
            eventCard: {
                base: {
                    background: 'linear-gradient(135deg, var(--surface-card), var(--surface-elevated))',
                    border: '1px solid var(--neutral-800)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 300ms ease',
                    position: 'relative',
                    overflow: 'hidden'
                },
                variants: {
                    ugc: {
                        background: 'linear-gradient(135deg, #1a4d3a, var(--surface-card))',
                        border: '1px solid var(--primary-500)'
                    },
                    curated: {
                        background: 'linear-gradient(135deg, var(--surface-card), var(--surface-elevated))',
                        border: '1px solid var(--neutral-700)'
                    }
                },
                states: {
                    hover: {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0, 255, 136, 0.2)',
                        borderColor: 'var(--primary-500)'
                    }
                }
            }
        };
        
        this.components = new Map(Object.entries(components));
        console.log('🧩 Components loaded:', this.components.size, 'types');
    }

    loadThemes() {
        const themes = {
            'professional-dark': {
                name: 'Professional Dark',
                colors: {
                    '--bg-primary': '#0f0f12',
                    '--surface-card': '#1a1a1f',
                    '--surface-elevated': '#2a2a35',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#a1a1aa',
                    '--primary-500': '#00ff88',
                    '--border-subtle': '#2a2a35'
                }
            },
            'professional-light': {
                name: 'Professional Light',
                colors: {
                    '--bg-primary': '#ffffff',
                    '--surface-card': '#f8fafc',
                    '--surface-elevated': '#f1f5f9',
                    '--text-primary': '#0f172a',
                    '--text-secondary': '#64748b',
                    '--primary-500': '#00cc70',
                    '--border-subtle': '#e2e8f0'
                }
            },
            'gaming': {
                name: 'Gaming',
                colors: {
                    '--bg-primary': '#0a0a0f',
                    '--surface-card': '#1a1a2e',
                    '--surface-elevated': '#16213e',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#94a3b8',
                    '--primary-500': '#8b5cf6',
                    '--border-subtle': '#1e293b'
                }
            }
        };
        
        this.themes = new Map(Object.entries(themes));
        console.log('🎨 Themes loaded:', this.themes.size, 'themes');
    }

    setupServer() {
        this.app.use(express.json());
        this.app.use(express.static(this.publicDir));
        
        // Design Editor Interface
        this.app.get('/design-editor', (req, res) => {
            res.send(this.generateDesignEditor());
        });
        
        // Component Library
        this.app.get('/components', (req, res) => {
            res.send(this.generateComponentLibrary());
        });
        
        // Design Tokens API
        this.app.get('/tokens', (req, res) => {
            res.json(Object.fromEntries(this.designTokens));
        });
        
        // Live CSS Generation
        this.app.get('/generated-tokens.css', (req, res) => {
            res.setHeader('Content-Type', 'text/css');
            res.send(this.generateTokensCSS());
        });
        
        this.app.get('/generated-components.css', (req, res) => {
            res.setHeader('Content-Type', 'text/css');
            res.send(this.generateComponentsCSS());
        });
        
        // Theme switching
        this.app.post('/api/theme', (req, res) => {
            const { theme } = req.body;
            if (this.themes.has(theme)) {
                this.currentTheme = theme;
                this.broadcast({ type: 'theme-changed', theme });
                res.json({ success: true, theme });
            } else {
                res.status(400).json({ error: 'Theme not found' });
            }
        });
        
        // Token updates
        this.app.post('/api/tokens/update', (req, res) => {
            const { category, key, value } = req.body;
            this.updateDesignToken(category, key, value);
            res.json({ success: true });
        });
        
        // Component updates
        this.app.post('/api/components/update', (req, res) => {
            const { component, variant, property, value } = req.body;
            this.updateComponent(component, variant, property, value);
            res.json({ success: true });
        });
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.port + 100 });
        
        this.wss.on('connection', (ws) => {
            console.log('🎨 Design editor client connected');
            this.clients.add(ws);
            
            ws.send(JSON.stringify({
                type: 'connected',
                tokens: Object.fromEntries(this.designTokens),
                components: Object.fromEntries(this.components),
                themes: Object.fromEntries(this.themes),
                currentTheme: this.currentTheme
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
    }

    setupFileWatchers() {
        // Watch CSS files for changes
        const cssWatcher = chokidar.watch(`${this.publicDir}/css/**/*.css`, {
            ignoreInitial: true
        });
        
        cssWatcher.on('change', (filePath) => {
            console.log('🎨 CSS file changed:', path.relative(this.publicDir, filePath));
            this.handleCSSChange(filePath);
        });
    }

    handleCSSChange(filePath) {
        // Analyze CSS changes and update design system
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Extract custom properties (CSS variables)
            const customProps = content.match(/--[\w-]+:\s*[^;]+/g) || [];
            
            customProps.forEach(prop => {
                const [key, value] = prop.split(':').map(s => s.trim());
                console.log('🎨 Found CSS custom property:', key, '=', value);
            });
            
            // Broadcast changes to clients
            this.broadcast({
                type: 'css-changed',
                file: path.relative(this.publicDir, filePath),
                customProperties: customProps
            });
            
        } catch (error) {
            console.error('Error processing CSS change:', error);
        }
    }

    updateDesignToken(category, key, value) {
        if (this.designTokens.has(category)) {
            const categoryData = this.designTokens.get(category);
            if (typeof categoryData === 'object' && key in categoryData) {
                categoryData[key] = value;
                
                // Regenerate CSS
                this.regenerateCSS();
                
                // Broadcast update
                this.broadcast({
                    type: 'token-updated',
                    category,
                    key,
                    value
                });
                
                console.log('🎨 Token updated:', `${category}.${key} = ${value}`);
            }
        }
    }

    updateComponent(componentName, variant, property, value) {
        if (this.components.has(componentName)) {
            const component = this.components.get(componentName);
            
            if (variant === 'base' && component.base) {
                component.base[property] = value;
            } else if (component.variants && component.variants[variant]) {
                component.variants[variant][property] = value;
            }
            
            // Regenerate CSS
            this.regenerateCSS();
            
            // Broadcast update
            this.broadcast({
                type: 'component-updated',
                component: componentName,
                variant,
                property,
                value
            });
            
            console.log('🧩 Component updated:', `${componentName}.${variant}.${property} = ${value}`);
        }
    }

    regenerateCSS() {
        // Generate updated CSS files
        const tokensCSS = this.generateTokensCSS();
        const componentsCSS = this.generateComponentsCSS();
        
        // Write to files
        fs.writeFileSync(this.designTokensFile, tokensCSS);
        fs.writeFileSync(this.componentLibraryFile, componentsCSS);
        
        // Broadcast CSS updates
        this.broadcast({
            type: 'css-regenerated',
            tokensCSS,
            componentsCSS
        });
    }

    generateTokensCSS() {
        let css = '/* Design Tokens - Auto Generated */\n\n:root {\n';
        
        // Generate CSS custom properties from design tokens
        this.designTokens.forEach((categoryData, category) => {
            css += `  /* ${category.charAt(0).toUpperCase() + category.slice(1)} */\n`;
            
            if (typeof categoryData === 'object') {
                this.generateCSSVariables(categoryData, category, css, '  ');
            }
        });
        
        css += '}\n\n';
        
        // Add theme variations
        this.themes.forEach((themeData, themeName) => {
            css += `[data-theme="${themeName}"] {\n`;
            
            Object.entries(themeData.colors || {}).forEach(([key, value]) => {
                css += `  ${key}: ${value};\n`;
            });
            
            css += '}\n\n';
        });
        
        return css;
    }

    generateCSSVariables(obj, prefix = '', css = '', indent = '') {
        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object') {
                this.generateCSSVariables(value, `${prefix}-${key}`, css, indent);
            } else {
                css += `${indent}--${prefix}-${key}: ${value};\n`;
            }
        });
        return css;
    }

    generateComponentsCSS() {
        let css = '/* Component Styles - Auto Generated */\n\n';
        
        this.components.forEach((componentData, componentName) => {
            css += `/* ${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Component */\n`;
            
            // Base styles
            if (componentData.base) {
                css += `.${componentName} {\n`;
                Object.entries(componentData.base).forEach(([property, value]) => {
                    css += `  ${this.camelToKebab(property)}: ${value};\n`;
                });
                css += '}\n\n';
            }
            
            // Variants
            if (componentData.variants) {
                Object.entries(componentData.variants).forEach(([variantName, styles]) => {
                    css += `.${componentName}--${variantName} {\n`;
                    Object.entries(styles).forEach(([property, value]) => {
                        css += `  ${this.camelToKebab(property)}: ${value};\n`;
                    });
                    css += '}\n\n';
                });
            }
            
            // Sizes
            if (componentData.sizes) {
                Object.entries(componentData.sizes).forEach(([sizeName, styles]) => {
                    css += `.${componentName}--${sizeName} {\n`;
                    Object.entries(styles).forEach(([property, value]) => {
                        css += `  ${this.camelToKebab(property)}: ${value};\n`;
                    });
                    css += '}\n\n';
                });
            }
            
            // States
            if (componentData.states) {
                Object.entries(componentData.states).forEach(([stateName, styles]) => {
                    const selector = stateName === 'hover' ? ':hover' : 
                                   stateName === 'focus' ? ':focus' :
                                   stateName === 'active' ? ':active' :
                                   `.${componentName}--${stateName}`;
                    
                    css += `.${componentName}${selector} {\n`;
                    Object.entries(styles).forEach(([property, value]) => {
                        css += `  ${this.camelToKebab(property)}: ${value};\n`;
                    });
                    css += '}\n\n';
                });
            }
        });
        
        return css;
    }

    camelToKebab(string) {
        return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    generateDesignEditor() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 Design System Editor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0f0f0f;
            color: #fff;
            height: 100vh;
            display: flex;
        }
        
        .editor-sidebar {
            width: 320px;
            background: #1a1a1a;
            border-right: 1px solid #333;
            overflow-y: auto;
        }
        
        .editor-main {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .editor-toolbar {
            background: #1a1a1a;
            border-bottom: 1px solid #333;
            padding: 1rem;
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .editor-canvas {
            flex: 1;
            background: #0f0f0f;
            position: relative;
            overflow: auto;
        }
        
        .editor-preview {
            background: #fff;
            margin: 2rem;
            border-radius: 8px;
            min-height: 80vh;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .sidebar-section {
            padding: 1rem;
            border-bottom: 1px solid #333;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #00ff88;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .token-group {
            margin-bottom: 1rem;
        }
        
        .token-label {
            font-size: 12px;
            color: #999;
            margin-bottom: 0.5rem;
        }
        
        .token-input {
            width: 100%;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 0.5rem;
            color: #fff;
            font-size: 12px;
        }
        
        .token-input:focus {
            outline: none;
            border-color: #00ff88;
        }
        
        .component-item {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .component-item:hover {
            border-color: #00ff88;
            background: #333;
        }
        
        .component-item.active {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .toolbar-button {
            background: #333;
            color: #fff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .toolbar-button:hover {
            background: #00ff88;
            color: #000;
        }
        
        .toolbar-button.active {
            background: #00ff88;
            color: #000;
        }
        
        .theme-selector {
            background: #2a2a2a;
            border: 1px solid #444;
            color: #fff;
            padding: 0.5rem;
            border-radius: 4px;
        }
        
        .preview-controls {
            position: absolute;
            top: 1rem;
            right: 1rem;
            display: flex;
            gap: 0.5rem;
        }
        
        .preview-device {
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .preview-device.active {
            background: #00ff88;
            color: #000;
        }
        
        @media (max-width: 768px) {
            .editor-sidebar {
                width: 100%;
                height: 40vh;
            }
            
            .editor-main {
                height: 60vh;
            }
            
            body {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="editor-sidebar">
        <div class="sidebar-section">
            <div class="section-title">🎨 Design Tokens</div>
            <div id="tokens-panel">
                <!-- Tokens will be populated here -->
            </div>
        </div>
        
        <div class="sidebar-section">
            <div class="section-title">🧩 Components</div>
            <div id="components-panel">
                <!-- Components will be populated here -->
            </div>
        </div>
        
        <div class="sidebar-section">
            <div class="section-title">🎯 Themes</div>
            <select class="theme-selector" id="theme-selector">
                <option value="professional-dark">Professional Dark</option>
                <option value="professional-light">Professional Light</option>
                <option value="gaming">Gaming</option>
            </select>
        </div>
    </div>
    
    <div class="editor-main">
        <div class="editor-toolbar">
            <button class="toolbar-button active" data-view="design">Design View</button>
            <button class="toolbar-button" data-view="code">Code View</button>
            <button class="toolbar-button" data-view="preview">Live Preview</button>
            <button class="toolbar-button" id="export-css">Export CSS</button>
            <button class="toolbar-button" id="reset-changes">Reset</button>
        </div>
        
        <div class="editor-canvas">
            <div class="preview-controls">
                <button class="preview-device active" data-device="mobile">📱 Mobile</button>
                <button class="preview-device" data-device="tablet">📟 Tablet</button>
                <button class="preview-device" data-device="desktop">🖥️ Desktop</button>
            </div>
            
            <div class="editor-preview" id="preview-frame">
                <!-- Live preview will be loaded here -->
            </div>
        </div>
    </div>

    <script>
        class DesignSystemEditor {
            constructor() {
                this.ws = null;
                this.currentTheme = 'professional-dark';
                this.selectedComponent = null;
                this.tokens = {};
                this.components = {};
                this.themes = {};
                
                this.init();
            }
            
            init() {
                this.connectWebSocket();
                this.setupEventListeners();
                this.loadPreview();
            }
            
            connectWebSocket() {
                this.ws = new WebSocket('ws://localhost:${this.port + 100}');
                
                this.ws.onopen = () => {
                    console.log('🎨 Connected to Design System Editor');
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };
                
                this.ws.onclose = () => {
                    console.log('🎨 Disconnected from Design System Editor');
                    // Auto-reconnect
                    setTimeout(() => this.connectWebSocket(), 2000);
                };
            }
            
            handleMessage(data) {
                switch (data.type) {
                    case 'connected':
                        this.tokens = data.tokens;
                        this.components = data.components;
                        this.themes = data.themes;
                        this.currentTheme = data.currentTheme;
                        this.renderTokensPanel();
                        this.renderComponentsPanel();
                        break;
                        
                    case 'token-updated':
                        this.tokens[data.category][data.key] = data.value;
                        this.updatePreview();
                        break;
                        
                    case 'component-updated':
                        if (this.components[data.component]) {
                            if (data.variant === 'base') {
                                this.components[data.component].base[data.property] = data.value;
                            } else if (this.components[data.component].variants) {
                                this.components[data.component].variants[data.variant][data.property] = data.value;
                            }
                        }
                        this.updatePreview();
                        break;
                        
                    case 'theme-changed':
                        this.currentTheme = data.theme;
                        this.updatePreview();
                        break;
                        
                    case 'css-regenerated':
                        this.updatePreview();
                        break;
                }
            }
            
            setupEventListeners() {
                // Theme selector
                document.getElementById('theme-selector').addEventListener('change', (e) => {
                    this.changeTheme(e.target.value);
                });
                
                // Toolbar buttons
                document.querySelectorAll('.toolbar-button[data-view]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.toolbar-button[data-view]').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.switchView(e.target.dataset.view);
                    });
                });
                
                // Device preview controls
                document.querySelectorAll('.preview-device').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.preview-device').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.switchDevice(e.target.dataset.device);
                    });
                });
                
                // Export CSS
                document.getElementById('export-css').addEventListener('click', () => {
                    this.exportCSS();
                });
                
                // Reset changes
                document.getElementById('reset-changes').addEventListener('click', () => {
                    this.resetChanges();
                });
            }
            
            renderTokensPanel() {
                const panel = document.getElementById('tokens-panel');
                panel.innerHTML = '';
                
                Object.entries(this.tokens).forEach(([category, categoryData]) => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'token-group';
                    
                    const categoryTitle = document.createElement('div');
                    categoryTitle.className = 'token-label';
                    categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                    categoryDiv.appendChild(categoryTitle);
                    
                    if (typeof categoryData === 'object') {
                        this.renderTokenInputs(categoryData, category, categoryDiv);
                    }
                    
                    panel.appendChild(categoryDiv);
                });
            }
            
            renderTokenInputs(obj, prefix, container) {
                Object.entries(obj).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        const subGroup = document.createElement('div');
                        subGroup.style.marginLeft = '1rem';
                        
                        const subTitle = document.createElement('div');
                        subTitle.className = 'token-label';
                        subTitle.textContent = key;
                        subGroup.appendChild(subTitle);
                        
                        this.renderTokenInputs(value, \`\${prefix}.\${key}\`, subGroup);
                        container.appendChild(subGroup);
                    } else {
                        const input = document.createElement('input');
                        input.className = 'token-input';
                        input.type = 'text';
                        input.value = value;
                        input.placeholder = key;
                        
                        input.addEventListener('change', (e) => {
                            this.updateToken(prefix, key, e.target.value);
                        });
                        
                        container.appendChild(input);
                    }
                });
            }
            
            renderComponentsPanel() {
                const panel = document.getElementById('components-panel');
                panel.innerHTML = '';
                
                Object.entries(this.components).forEach(([componentName, componentData]) => {
                    const item = document.createElement('div');
                    item.className = 'component-item';
                    item.textContent = componentName.charAt(0).toUpperCase() + componentName.slice(1);
                    
                    item.addEventListener('click', () => {
                        document.querySelectorAll('.component-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');
                        this.selectComponent(componentName);
                    });
                    
                    panel.appendChild(item);
                });
            }
            
            selectComponent(componentName) {
                this.selectedComponent = componentName;
                console.log('🧩 Selected component:', componentName);
                // TODO: Show component editor panel
            }
            
            updateToken(category, key, value) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'update-token',
                        category,
                        key,
                        value
                    }));
                }
                
                // Update locally for immediate feedback
                if (this.tokens[category]) {
                    this.tokens[category][key] = value;
                }
            }
            
            changeTheme(themeName) {
                fetch('/api/theme', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme: themeName })
                });
            }
            
            switchView(view) {
                console.log('📋 Switching to view:', view);
                
                switch (view) {
                    case 'design':
                        this.showDesignView();
                        break;
                    case 'code':
                        this.showCodeView();
                        break;
                    case 'preview':
                        this.showPreviewView();
                        break;
                }
            }
            
            switchDevice(device) {
                console.log('📱 Switching to device:', device);
                
                const preview = document.getElementById('preview-frame');
                
                switch (device) {
                    case 'mobile':
                        preview.style.maxWidth = '375px';
                        preview.style.margin = '2rem auto';
                        break;
                    case 'tablet':
                        preview.style.maxWidth = '768px';
                        preview.style.margin = '2rem auto';
                        break;
                    case 'desktop':
                        preview.style.maxWidth = 'none';
                        preview.style.margin = '2rem';
                        break;
                }
            }
            
            loadPreview() {
                const preview = document.getElementById('preview-frame');
                preview.innerHTML = \`
                    <iframe src="http://localhost:3000" 
                           style="width: 100%; height: 100%; border: none; border-radius: 8px;">
                    </iframe>
                \`;
            }
            
            updatePreview() {
                const preview = document.querySelector('#preview-frame iframe');
                if (preview) {
                    preview.contentWindow.location.reload();
                }
            }
            
            showDesignView() {
                this.loadPreview();
            }
            
            showCodeView() {
                const preview = document.getElementById('preview-frame');
                preview.innerHTML = \`
                    <div style="padding: 2rem; background: #1a1a1a; height: 100%; font-family: monospace;">
                        <h3 style="color: #00ff88; margin-bottom: 1rem;">Generated CSS</h3>
                        <textarea style="width: 100%; height: 80%; background: #0f0f0f; color: #fff; border: 1px solid #333; padding: 1rem; font-family: monospace;" 
                                 readonly id="css-output"></textarea>
                    </div>
                \`;
                
                fetch('/generated-tokens.css')
                    .then(response => response.text())
                    .then(css => {
                        document.getElementById('css-output').value = css;
                    });
            }
            
            showPreviewView() {
                this.loadPreview();
            }
            
            exportCSS() {
                // Download generated CSS files
                const link = document.createElement('a');
                link.href = '/generated-tokens.css';
                link.download = 'design-tokens.css';
                link.click();
                
                setTimeout(() => {
                    const link2 = document.createElement('a');
                    link2.href = '/generated-components.css';
                    link2.download = 'components.css';
                    link2.click();
                }, 100);
                
                console.log('📥 CSS exported');
            }
            
            resetChanges() {
                if (confirm('Reset all design changes? This cannot be undone.')) {
                    location.reload();
                }
            }
        }
        
        // Initialize editor
        const editor = new DesignSystemEditor();
        
        console.log('🎨 Design System Editor loaded');
    </script>
</body>
</html>
        `;
    }

    generateComponentLibrary() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧩 Component Library</title>
    <link rel="stylesheet" href="/generated-tokens.css">
    <link rel="stylesheet" href="/generated-components.css">
    <style>
        body {
            font-family: var(--font-system);
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0;
            padding: 2rem;
        }
        
        .library-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .library-title {
            color: var(--primary-500);
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        .component-section {
            margin-bottom: 3rem;
        }
        
        .section-title {
            color: var(--primary-500);
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-subtle);
            padding-bottom: 0.5rem;
        }
        
        .component-showcase {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .showcase-item {
            background: var(--surface-card);
            border: 1px solid var(--border-subtle);
            border-radius: 0.75rem;
            padding: 1.5rem;
        }
        
        .showcase-label {
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin-bottom: 1rem;
        }
        
        .showcase-demo {
            margin-bottom: 1rem;
        }
    </style>
</head>
<body data-theme="${this.currentTheme}">
    <div class="library-header">
        <h1 class="library-title">🧩 Component Library</h1>
        <p>Professional Intelligence Platform Design System</p>
    </div>

    <div class="component-section">
        <h2 class="section-title">🔘 Buttons</h2>
        <div class="component-showcase">
            <div class="showcase-item">
                <div class="showcase-label">Primary Button</div>
                <div class="showcase-demo">
                    <button class="button button--primary">Get Started</button>
                </div>
            </div>
            
            <div class="showcase-item">
                <div class="showcase-label">Secondary Button</div>
                <div class="showcase-demo">
                    <button class="button button--secondary">Learn More</button>
                </div>
            </div>
            
            <div class="showcase-item">
                <div class="showcase-label">Ghost Button</div>
                <div class="showcase-demo">
                    <button class="button button--ghost">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <div class="component-section">
        <h2 class="section-title">🃏 Cards</h2>
        <div class="component-showcase">
            <div class="showcase-item">
                <div class="showcase-label">Event Card</div>
                <div class="showcase-demo">
                    <div class="eventCard eventCard--curated">
                        <h3>Sample Event</h3>
                        <p>📅 Aug 25, 2025 • ⏰ 18:00 • 📍 Cologne Convention Center</p>
                    </div>
                </div>
            </div>
            
            <div class="showcase-item">
                <div class="showcase-label">UGC Event Card</div>
                <div class="showcase-demo">
                    <div class="eventCard eventCard--ugc">
                        <h3>Community Meetup</h3>
                        <p>📅 Aug 26, 2025 • ⏰ 20:00 • 📍 Gaming Lounge</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="component-section">
        <h2 class="section-title">📝 Inputs</h2>
        <div class="component-showcase">
            <div class="showcase-item">
                <div class="showcase-label">Text Input</div>
                <div class="showcase-demo">
                    <input class="input" type="text" placeholder="Search events...">
                </div>
            </div>
        </div>
    </div>

    <script>
        console.log('🧩 Component Library loaded');
        
        // Theme switcher for preview
        const themes = ['professional-dark', 'professional-light', 'gaming'];
        let currentTheme = 0;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' || e.key === 'T') {
                currentTheme = (currentTheme + 1) % themes.length;
                document.body.setAttribute('data-theme', themes[currentTheme]);
                console.log('🎨 Switched to theme:', themes[currentTheme]);
            }
        });
        
        console.log('💡 Press "T" to cycle through themes');
    </script>
</body>
</html>
        `;
    }

    broadcast(message) {
        const payload = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }

    shutdown() {
        console.log('🛑 Shutting down Design System Editor...');
        
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ Design System Editor shut down');
        process.exit(0);
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
            case '-p':
                options.port = parseInt(args[++i]);
                break;
            case '--public':
                options.publicDir = args[++i];
                break;
            case '--help':
            case '-h':
                console.log(`
🎨 Design System Visual Editor

Usage: node design-system-editor.js [options]

Options:
  -p, --port <number>     Editor port (default: 3001)
  --public <path>         Public directory (default: ./public)
  -h, --help             Show this help message

Features:
  🎨 Live visual editing with real-time preview
  🧩 Component library generation
  📐 Design token management
  🎯 Theme switching
  💾 CSS export functionality

Examples:
  node design-system-editor.js
  node design-system-editor.js --port 4000
                `);
                process.exit(0);
        }
    }
    
    const editor = new DesignSystemEditor(options);
    editor.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => editor.shutdown());
    process.on('SIGTERM', () => editor.shutdown());
}

module.exports = DesignSystemEditor;