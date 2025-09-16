/**
 * Theme Generator System
 * ======================
 * Dynamic theme generation for white-label customization
 * 
 * Features:
 * - Real-time theme preview
 * - CSS variable generation
 * - Component styling
 * - Brand asset management
 * - Theme export/import
 */

class ThemeGenerator {
    constructor() {
        this.currentTheme = null;
        this.previewMode = false;
        this.themeHistory = [];
        this.brandAssets = new Map();
        
        this.init();
    }
    
    async init() {
        this.loadDefaultTheme();
        this.setupPreviewSystem();
        this.initializeColorPicker();
    }
    
    /**
     * Generate complete theme package
     */
    async generateTheme(config) {
        const theme = {
            id: this.generateThemeId(),
            name: config.name || 'Custom Theme',
            version: '1.0.0',
            created: new Date().toISOString(),
            
            // Brand identity
            brand: {
                companyName: config.companyName,
                logo: await this.processLogo(config.logo),
                favicon: await this.generateFavicon(config.logo),
                watermark: await this.generateWatermark(config.logo),
                tagline: config.tagline,
                description: config.description
            },
            
            // Color scheme
            colors: await this.generateColorScheme({
                primary: config.colors.primary,
                secondary: config.colors.secondary,
                accent: config.colors.accent,
                mode: config.darkMode ? 'dark' : 'light',
                autoGenerate: config.autoGenerateColors !== false
            }),
            
            // Typography
            typography: await this.generateTypography({
                headingFont: config.fonts?.heading || 'Inter',
                bodyFont: config.fonts?.body || 'Inter',
                monoFont: config.fonts?.mono || 'Fira Code',
                scale: config.fontScale || 1,
                lineHeight: config.lineHeight || 1.5
            }),
            
            // Layout
            layout: {
                containerWidth: config.layout?.containerWidth || '1280px',
                sidebarWidth: config.layout?.sidebarWidth || '280px',
                headerHeight: config.layout?.headerHeight || '64px',
                footerHeight: config.layout?.footerHeight || '48px',
                spacing: this.generateSpacingScale(config.spacingScale || 1)
            },
            
            // Components
            components: await this.generateComponentStyles({
                borderRadius: config.borderRadius || 'medium',
                shadowIntensity: config.shadowIntensity || 'medium',
                animationSpeed: config.animationSpeed || 'normal',
                glassmorphism: config.glassmorphism || false
            }),
            
            // Effects
            effects: {
                blur: config.effects?.blur || false,
                gradients: config.effects?.gradients !== false,
                animations: config.effects?.animations !== false,
                transitions: config.effects?.transitions !== false,
                parallax: config.effects?.parallax || false
            },
            
            // Accessibility
            accessibility: {
                highContrast: config.accessibility?.highContrast || false,
                focusIndicators: config.accessibility?.focusIndicators !== false,
                reducedMotion: config.accessibility?.reducedMotion || false,
                screenReaderOptimized: config.accessibility?.screenReader || false
            }
        };
        
        // Generate CSS
        theme.css = await this.generateCSS(theme);
        
        // Generate preview
        theme.preview = await this.generatePreview(theme);
        
        // Store theme
        this.currentTheme = theme;
        this.themeHistory.push(theme);
        
        return theme;
    }
    
    /**
     * Generate color scheme
     */
    async generateColorScheme(config) {
        const baseColors = {
            primary: config.primary,
            secondary: config.secondary,
            accent: config.accent
        };
        
        // Generate color variations
        const colors = {
            // Primary palette
            primary: {
                50: this.generateTint(baseColors.primary, 95),
                100: this.generateTint(baseColors.primary, 90),
                200: this.generateTint(baseColors.primary, 80),
                300: this.generateTint(baseColors.primary, 70),
                400: this.generateTint(baseColors.primary, 60),
                500: baseColors.primary,
                600: this.generateShade(baseColors.primary, 10),
                700: this.generateShade(baseColors.primary, 20),
                800: this.generateShade(baseColors.primary, 30),
                900: this.generateShade(baseColors.primary, 40)
            },
            
            // Secondary palette
            secondary: {
                50: this.generateTint(baseColors.secondary, 95),
                100: this.generateTint(baseColors.secondary, 90),
                200: this.generateTint(baseColors.secondary, 80),
                300: this.generateTint(baseColors.secondary, 70),
                400: this.generateTint(baseColors.secondary, 60),
                500: baseColors.secondary,
                600: this.generateShade(baseColors.secondary, 10),
                700: this.generateShade(baseColors.secondary, 20),
                800: this.generateShade(baseColors.secondary, 30),
                900: this.generateShade(baseColors.secondary, 40)
            },
            
            // Accent palette
            accent: {
                50: this.generateTint(baseColors.accent, 95),
                100: this.generateTint(baseColors.accent, 90),
                200: this.generateTint(baseColors.accent, 80),
                300: this.generateTint(baseColors.accent, 70),
                400: this.generateTint(baseColors.accent, 60),
                500: baseColors.accent,
                600: this.generateShade(baseColors.accent, 10),
                700: this.generateShade(baseColors.accent, 20),
                800: this.generateShade(baseColors.accent, 30),
                900: this.generateShade(baseColors.accent, 40)
            },
            
            // Neutral palette (auto-generated)
            neutral: config.mode === 'dark' ? {
                50: '#0F172A',
                100: '#1E293B',
                200: '#334155',
                300: '#475569',
                400: '#64748B',
                500: '#94A3B8',
                600: '#CBD5E1',
                700: '#E2E8F0',
                800: '#F1F5F9',
                900: '#F8FAFC'
            } : {
                50: '#F8FAFC',
                100: '#F1F5F9',
                200: '#E2E8F0',
                300: '#CBD5E1',
                400: '#94A3B8',
                500: '#64748B',
                600: '#475569',
                700: '#334155',
                800: '#1E293B',
                900: '#0F172A'
            },
            
            // Semantic colors
            semantic: {
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
                
                successLight: this.generateTint('#10B981', 90),
                warningLight: this.generateTint('#F59E0B', 90),
                errorLight: this.generateTint('#EF4444', 90),
                infoLight: this.generateTint('#3B82F6', 90),
                
                successDark: this.generateShade('#10B981', 20),
                warningDark: this.generateShade('#F59E0B', 20),
                errorDark: this.generateShade('#EF4444', 20),
                infoDark: this.generateShade('#3B82F6', 20)
            },
            
            // UI colors
            ui: {
                background: config.mode === 'dark' ? '#0F172A' : '#FFFFFF',
                surface: config.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                elevated: config.mode === 'dark' ? '#334155' : '#FFFFFF',
                overlay: config.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
                border: config.mode === 'dark' ? '#334155' : '#E2E8F0',
                divider: config.mode === 'dark' ? '#475569' : '#CBD5E1',
                
                textPrimary: config.mode === 'dark' ? '#F1F5F9' : '#0F172A',
                textSecondary: config.mode === 'dark' ? '#CBD5E1' : '#475569',
                textTertiary: config.mode === 'dark' ? '#94A3B8' : '#64748B',
                textDisabled: config.mode === 'dark' ? '#64748B' : '#94A3B8',
                textInverse: config.mode === 'dark' ? '#0F172A' : '#F1F5F9'
            }
        };
        
        // Generate complementary colors if requested
        if (config.autoGenerate) {
            colors.complementary = {
                primary: this.getComplementaryColor(baseColors.primary),
                secondary: this.getComplementaryColor(baseColors.secondary),
                accent: this.getComplementaryColor(baseColors.accent)
            };
            
            colors.triadic = {
                primary: this.getTriadicColors(baseColors.primary),
                secondary: this.getTriadicColors(baseColors.secondary)
            };
            
            colors.analogous = {
                primary: this.getAnalogousColors(baseColors.primary),
                secondary: this.getAnalogousColors(baseColors.secondary)
            };
        }
        
        return colors;
    }
    
    /**
     * Generate typography system
     */
    async generateTypography(config) {
        // Load Google Fonts
        await this.loadGoogleFonts([
            config.headingFont,
            config.bodyFont,
            config.monoFont
        ]);
        
        const baseSize = 16 * config.scale;
        
        return {
            fonts: {
                heading: `'${config.headingFont}', -apple-system, sans-serif`,
                body: `'${config.bodyFont}', -apple-system, sans-serif`,
                mono: `'${config.monoFont}', 'Courier New', monospace`
            },
            
            sizes: {
                xs: `${baseSize * 0.75}px`,
                sm: `${baseSize * 0.875}px`,
                base: `${baseSize}px`,
                lg: `${baseSize * 1.125}px`,
                xl: `${baseSize * 1.25}px`,
                '2xl': `${baseSize * 1.5}px`,
                '3xl': `${baseSize * 1.875}px`,
                '4xl': `${baseSize * 2.25}px`,
                '5xl': `${baseSize * 3}px`,
                '6xl': `${baseSize * 3.75}px`,
                '7xl': `${baseSize * 4.5}px`,
                '8xl': `${baseSize * 6}px`,
                '9xl': `${baseSize * 8}px`
            },
            
            weights: {
                thin: 100,
                extralight: 200,
                light: 300,
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
                extrabold: 800,
                black: 900
            },
            
            lineHeights: {
                none: 1,
                tight: 1.25,
                snug: 1.375,
                normal: config.lineHeight,
                relaxed: 1.625,
                loose: 2
            },
            
            letterSpacing: {
                tighter: '-0.05em',
                tight: '-0.025em',
                normal: '0',
                wide: '0.025em',
                wider: '0.05em',
                widest: '0.1em'
            }
        };
    }
    
    /**
     * Generate component styles
     */
    async generateComponentStyles(config) {
        const radiusScale = {
            none: '0',
            small: '0.25rem',
            medium: '0.5rem',
            large: '0.75rem',
            xlarge: '1rem',
            full: '9999px'
        };
        
        const shadowScale = {
            none: 'none',
            small: '0 1px 3px rgba(0, 0, 0, 0.1)',
            medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
            large: '0 10px 15px rgba(0, 0, 0, 0.1)',
            xlarge: '0 20px 25px rgba(0, 0, 0, 0.1)'
        };
        
        const animationScale = {
            slow: 500,
            normal: 300,
            fast: 150,
            instant: 0
        };
        
        return {
            button: {
                borderRadius: radiusScale[config.borderRadius],
                boxShadow: shadowScale[config.shadowIntensity],
                transition: `all ${animationScale[config.animationSpeed]}ms ease`,
                
                variants: {
                    primary: {
                        background: 'var(--color-primary-500)',
                        color: 'white',
                        hover: {
                            background: 'var(--color-primary-600)',
                            transform: 'translateY(-2px)',
                            boxShadow: shadowScale.large
                        }
                    },
                    secondary: {
                        background: 'var(--color-secondary-500)',
                        color: 'white',
                        hover: {
                            background: 'var(--color-secondary-600)'
                        }
                    },
                    outline: {
                        background: 'transparent',
                        border: '2px solid var(--color-primary-500)',
                        color: 'var(--color-primary-500)',
                        hover: {
                            background: 'var(--color-primary-50)'
                        }
                    },
                    ghost: {
                        background: 'transparent',
                        color: 'var(--color-text-primary)',
                        hover: {
                            background: 'var(--color-neutral-100)'
                        }
                    }
                }
            },
            
            card: {
                borderRadius: radiusScale[config.borderRadius],
                boxShadow: shadowScale[config.shadowIntensity],
                background: config.glassmorphism ? 
                    'rgba(255, 255, 255, 0.1)' : 
                    'var(--color-ui-surface)',
                backdropFilter: config.glassmorphism ? 'blur(10px)' : 'none',
                border: config.glassmorphism ? 
                    '1px solid rgba(255, 255, 255, 0.2)' : 
                    '1px solid var(--color-ui-border)'
            },
            
            input: {
                borderRadius: radiusScale[config.borderRadius],
                border: '1px solid var(--color-ui-border)',
                background: 'var(--color-ui-surface)',
                transition: `all ${animationScale[config.animationSpeed]}ms ease`,
                
                focus: {
                    borderColor: 'var(--color-primary-500)',
                    boxShadow: '0 0 0 3px var(--color-primary-100)',
                    outline: 'none'
                }
            },
            
            modal: {
                borderRadius: radiusScale[config.borderRadius],
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                background: 'var(--color-ui-surface)',
                backdropFilter: config.glassmorphism ? 'blur(20px)' : 'none'
            },
            
            dropdown: {
                borderRadius: radiusScale[config.borderRadius],
                boxShadow: shadowScale.large,
                background: 'var(--color-ui-elevated)',
                border: '1px solid var(--color-ui-border)'
            },
            
            tooltip: {
                borderRadius: radiusScale.small,
                background: 'var(--color-neutral-900)',
                color: 'white',
                fontSize: '0.875rem',
                padding: '0.5rem 0.75rem'
            },
            
            badge: {
                borderRadius: radiusScale.full,
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                fontWeight: 600
            },
            
            progress: {
                height: '8px',
                borderRadius: radiusScale.full,
                background: 'var(--color-neutral-200)',
                fill: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600))'
            },
            
            toggle: {
                width: '48px',
                height: '24px',
                borderRadius: radiusScale.full,
                background: 'var(--color-neutral-300)',
                activeBackground: 'var(--color-primary-500)',
                handle: {
                    size: '20px',
                    background: 'white',
                    transition: `transform ${animationScale[config.animationSpeed]}ms ease`
                }
            }
        };
    }
    
    /**
     * Generate CSS output
     */
    async generateCSS(theme) {
        const css = [];
        
        // CSS Reset
        css.push(this.generateReset());
        
        // Root variables
        css.push(':root {');
        css.push(this.generateCSSVariables(theme));
        css.push('}');
        
        // Dark mode variables
        if (theme.colors.ui.background.includes('dark')) {
            css.push('[data-theme="dark"] {');
            css.push(this.generateDarkModeVariables(theme));
            css.push('}');
        }
        
        // Typography styles
        css.push(this.generateTypographyCSS(theme.typography));
        
        // Component styles
        css.push(this.generateComponentCSS(theme.components));
        
        // Utility classes
        css.push(this.generateUtilityClasses(theme));
        
        // Animations
        if (theme.effects.animations) {
            css.push(this.generateAnimations());
        }
        
        // Media queries
        css.push(this.generateMediaQueries(theme));
        
        return css.join('\n\n');
    }
    
    /**
     * Generate CSS variables
     */
    generateCSSVariables(theme) {
        const variables = [];
        
        // Colors
        Object.entries(theme.colors).forEach(([category, colors]) => {
            if (typeof colors === 'object') {
                Object.entries(colors).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        variables.push(`  --color-${category}-${key}: ${value};`);
                    } else if (typeof value === 'object') {
                        Object.entries(value).forEach(([subKey, subValue]) => {
                            variables.push(`  --color-${category}-${key}-${subKey}: ${subValue};`);
                        });
                    }
                });
            }
        });
        
        // Typography
        variables.push(`  --font-heading: ${theme.typography.fonts.heading};`);
        variables.push(`  --font-body: ${theme.typography.fonts.body};`);
        variables.push(`  --font-mono: ${theme.typography.fonts.mono};`);
        
        Object.entries(theme.typography.sizes).forEach(([key, value]) => {
            variables.push(`  --text-${key}: ${value};`);
        });
        
        // Layout
        Object.entries(theme.layout).forEach(([key, value]) => {
            if (typeof value === 'string') {
                variables.push(`  --layout-${this.kebabCase(key)}: ${value};`);
            }
        });
        
        // Spacing
        if (theme.layout.spacing) {
            Object.entries(theme.layout.spacing).forEach(([key, value]) => {
                variables.push(`  --spacing-${key}: ${value};`);
            });
        }
        
        return variables.join('\n');
    }
    
    /**
     * Live preview system
     */
    async applyPreview(theme) {
        this.previewMode = true;
        
        // Create or update style element
        let styleEl = document.getElementById('theme-preview');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'theme-preview';
            document.head.appendChild(styleEl);
        }
        
        // Apply CSS
        styleEl.textContent = theme.css;
        
        // Apply logo
        if (theme.brand.logo) {
            const logos = document.querySelectorAll('.logo, .brand-logo');
            logos.forEach(logo => {
                if (logo.tagName === 'IMG') {
                    logo.src = theme.brand.logo;
                } else {
                    logo.style.backgroundImage = `url(${theme.brand.logo})`;
                }
            });
        }
        
        // Apply favicon
        if (theme.brand.favicon) {
            const favicon = document.querySelector('link[rel="icon"]');
            if (favicon) {
                favicon.href = theme.brand.favicon;
            }
        }
        
        // Trigger preview event
        window.dispatchEvent(new CustomEvent('themePreview', { detail: theme }));
    }
    
    /**
     * Export theme
     */
    async exportTheme(format = 'json') {
        if (!this.currentTheme) {
            throw new Error('No theme to export');
        }
        
        switch (format) {
            case 'json':
                return JSON.stringify(this.currentTheme, null, 2);
                
            case 'css':
                return this.currentTheme.css;
                
            case 'sass':
                return this.convertToSass(this.currentTheme);
                
            case 'less':
                return this.convertToLess(this.currentTheme);
                
            case 'zip':
                return await this.createThemePackage(this.currentTheme);
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Helper methods
     */
    generateTint(color, amount) {
        const { h, s, l } = this.hexToHSL(color);
        const newL = l + (100 - l) * (amount / 100);
        return this.hslToHex(h, s, newL);
    }
    
    generateShade(color, amount) {
        const { h, s, l } = this.hexToHSL(color);
        const newL = l - l * (amount / 100);
        return this.hslToHex(h, s, newL);
    }
    
    hexToHSL(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return { h: h * 360, s: s * 100, l: l * 100 };
    }
    
    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    kebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    
    generateThemeId() {
        return `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Initialize theme generator
const themeGenerator = new ThemeGenerator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeGenerator;
}