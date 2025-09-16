/**
 * Icon Service
 * Handles icon retrieval, processing, and optimization
 */

import fs from 'fs/promises';
import path from 'path';
// import sharp from 'sharp'; // Will be used for image processing
import { CacheService } from './cache-service';

export interface Icon {
  name: string;
  category: string;
  format: string;
  size?: number;
  data?: Buffer;
  url?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface IconRequest {
  name: string;
  format?: 'svg' | 'png' | 'webp' | 'jpeg';
  size?: number;
  category?: string;
  optimize?: boolean;
}

export class IconService {
  private iconsPath: string;
  private iconRegistry: Map<string, Icon>;

  constructor(private cacheService: CacheService) {
    this.iconsPath = path.join(__dirname, '../../assets');
    this.iconRegistry = new Map();
    this.loadIconRegistry();
  }

  /**
   * Load all available icons into registry
   */
  private async loadIconRegistry() {
    try {
      // Load default icon set
      this.registerDefaultIcons();

      // Scan assets directory for custom icons
      const categories = ['svg', 'png', 'webp'];
      for (const category of categories) {
        const categoryPath = path.join(this.iconsPath, category);
        try {
          const files = await fs.readdir(categoryPath);
          for (const file of files) {
            const name = path.basename(file, path.extname(file));
            this.iconRegistry.set(`${name}-${category}`, {
              name,
              category: 'custom',
              format: category,
              url: `/static/${category}/${file}`
            });
          }
        } catch (err) {
          // Directory might not exist yet
          console.log(`Creating ${category} directory...`);
          await fs.mkdir(categoryPath, { recursive: true });
        }
      }
    } catch (error) {
      console.error('Error loading icon registry:', error);
    }
  }

  /**
   * Register default icon set
   */
  private registerDefaultIcons() {
    // Professional conference icons
    const defaultIcons = [
      // UI Icons
      { name: 'arrow-right', category: 'ui', format: 'svg' },
      { name: 'arrow-left', category: 'ui', format: 'svg' },
      { name: 'chevron-down', category: 'ui', format: 'svg' },
      { name: 'menu', category: 'ui', format: 'svg' },
      { name: 'close', category: 'ui', format: 'svg' },
      { name: 'search', category: 'ui', format: 'svg' },
      { name: 'filter', category: 'ui', format: 'svg' },
      { name: 'settings', category: 'ui', format: 'svg' },

      // Business Icons
      { name: 'conference', category: 'business', format: 'svg' },
      { name: 'networking', category: 'business', format: 'svg' },
      { name: 'presentation', category: 'business', format: 'svg' },
      { name: 'meeting', category: 'business', format: 'svg' },
      { name: 'calendar', category: 'business', format: 'svg' },
      { name: 'badge', category: 'business', format: 'svg' },
      { name: 'handshake', category: 'business', format: 'svg' },

      // Tech Icons
      { name: 'code', category: 'tech', format: 'svg' },
      { name: 'database', category: 'tech', format: 'svg' },
      { name: 'cloud', category: 'tech', format: 'svg' },
      { name: 'api', category: 'tech', format: 'svg' },
      { name: 'git', category: 'tech', format: 'svg' },
      { name: 'docker', category: 'tech', format: 'svg' },

      // Social Icons
      { name: 'linkedin', category: 'social', format: 'svg' },
      { name: 'twitter', category: 'social', format: 'svg' },
      { name: 'github', category: 'social', format: 'svg' },
      { name: 'facebook', category: 'social', format: 'svg' },
      { name: 'instagram', category: 'social', format: 'svg' },

      // Emoji Icons
      { name: 'smile', category: 'emoji', format: 'svg' },
      { name: 'star', category: 'emoji', format: 'svg' },
      { name: 'heart', category: 'emoji', format: 'svg' },
      { name: 'thumbs-up', category: 'emoji', format: 'svg' },
      { name: 'fire', category: 'emoji', format: 'svg' },
      { name: 'rocket', category: 'emoji', format: 'svg' }
    ];

    for (const icon of defaultIcons) {
      this.iconRegistry.set(icon.name, icon);
    }
  }

  /**
   * Get icon by request parameters
   */
  async getIcon(request: IconRequest): Promise<Icon | null> {
    const cacheKey = `${request.name}-${request.format}-${request.size}`;

    // Check cache first
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached as Icon;
    }

    // Find icon in registry
    let icon = this.iconRegistry.get(request.name);
    if (!icon) {
      // Try with format suffix
      icon = this.iconRegistry.get(`${request.name}-${request.format || 'svg'}`);
    }

    if (!icon) {
      return null;
    }

    // Process icon if needed
    if (request.format && request.format !== icon.format) {
      icon = await this.convertFormat(icon, request.format);
    }

    if (request.size) {
      icon = await this.resizeIcon(icon, request.size);
    }

    if (request.optimize) {
      icon = await this.optimizeIcon(icon);
    }

    // Cache the processed icon
    this.cacheService.set(cacheKey, icon);

    return icon;
  }

  /**
   * Convert icon to different format
   */
  private async convertFormat(icon: Icon, format: string): Promise<Icon> {
    // For now, return a placeholder
    // In production, use sharp to convert
    return {
      ...icon,
      format,
      data: Buffer.from(this.generateSVGIcon(icon.name))
    };
  }

  /**
   * Resize icon
   */
  private async resizeIcon(icon: Icon, size: number): Promise<Icon> {
    // For now, return icon with size metadata
    return {
      ...icon,
      size,
      metadata: {
        width: size,
        height: size,
        format: icon.format,
        size: 1024 // Placeholder size in bytes
      }
    };
  }

  /**
   * Optimize icon for delivery
   */
  private async optimizeIcon(icon: Icon): Promise<Icon> {
    // Apply optimization based on format
    return icon;
  }

  /**
   * Generate a simple SVG icon as placeholder
   */
  private generateSVGIcon(name: string): string {
    const icons: Record<string, string> = {
      'arrow-right': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
      'menu': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
      'search': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
      'settings': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
      'conference': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      'default': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>'
    };

    return icons[name] || icons['default'];
  }

  /**
   * Get all available icons
   */
  getAllIcons(): Icon[] {
    return Array.from(this.iconRegistry.values());
  }

  /**
   * Get icons by category
   */
  getIconsByCategory(category: string): Icon[] {
    return this.getAllIcons().filter(icon => icon.category === category);
  }

  /**
   * Get total number of icons
   */
  getTotalIcons(): number {
    return this.iconRegistry.size;
  }
}