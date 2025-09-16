/**
 * Icon Routes
 * API endpoints for icon retrieval and management
 */

import { Router, Request, Response } from 'express';
import { IconService } from '../services/icon-service';

export function iconRouter(iconService: IconService): Router {
  const router = Router();

  /**
   * List all available icons
   */
  router.get('/', (_req: Request, res: Response) => {
    const icons = iconService.getAllIcons();
    res.json({
      total: icons.length,
      icons: icons.map(icon => ({
        name: icon.name,
        category: icon.category,
        format: icon.format,
        url: `/api/v1/icons/${icon.name}`
      }))
    });
  });

  /**
   * Get icons by category
   */
  router.get('/category/:category', (req: Request, res: Response): void => {
    const { category } = req.params;
    const icons = iconService.getIconsByCategory(category);

    if (icons.length === 0) {
      res.status(404).json({
        error: 'Category not found',
        message: `No icons found in category: ${category}`
      });
      return;
    }

    res.json({
      category,
      total: icons.length,
      icons: icons.map(icon => ({
        name: icon.name,
        format: icon.format,
        url: `/api/v1/icons/${icon.name}`
      }))
    });
  });

  /**
   * Get specific icon
   */
  router.get('/:name', async (req: Request, res: Response): Promise<void> => {
    const { name } = req.params;
    const { format = 'svg', size = '64', optimize = 'true' } = req.query;

    try {
      const icon = await iconService.getIcon({
        name,
        format: format as any,
        size: parseInt(size as string),
        optimize: optimize === 'true'
      });

      if (!icon) {
        res.status(404).json({
          error: 'Icon not found',
          message: `Icon "${name}" does not exist`
        });
        return;
      }

      // Set appropriate content type
      const contentTypes: Record<string, string> = {
        svg: 'image/svg+xml',
        png: 'image/png',
        webp: 'image/webp',
        jpeg: 'image/jpeg'
      };

      res.setHeader('Content-Type', contentTypes[icon.format] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

      // If we have raw data, send it
      if (icon.data) {
        res.send(icon.data);
      } else {
        // Otherwise, return metadata with URL
        res.json({
          name: icon.name,
          category: icon.category,
          format: icon.format,
          size: icon.size,
          url: icon.url || `/static/${icon.format}/${icon.name}.${icon.format}`,
          metadata: icon.metadata
        });
      }
    } catch (error) {
      console.error('Error fetching icon:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process icon request'
      });
    }
  });

  /**
   * Batch icon retrieval
   */
  router.post('/batch', async (req: Request, res: Response): Promise<void> => {
    const { icons = [] } = req.body;

    if (!Array.isArray(icons) || icons.length === 0) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide an array of icon names'
      });
      return;
    }

    if (icons.length > 50) {
      res.status(400).json({
        error: 'Too many icons',
        message: 'Maximum 50 icons per batch request'
      });
      return;
    }

    const results = await Promise.all(
      icons.map(async (iconRequest: any) => {
        try {
          const icon = await iconService.getIcon(iconRequest);
          return {
            ...iconRequest,
            success: true,
            data: icon ? {
              name: icon.name,
              category: icon.category,
              format: icon.format,
              url: `/api/v1/icons/${icon.name}`
            } : null
          };
        } catch (error) {
          return {
            ...iconRequest,
            success: false,
            error: 'Failed to fetch icon'
          };
        }
      })
    );

    res.json({
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  });

  /**
   * Search icons
   */
  router.get('/search/:query', (req: Request, res: Response) => {
    const { query } = req.params;
    const allIcons = iconService.getAllIcons();

    const matches = allIcons.filter(icon =>
      icon.name.toLowerCase().includes(query.toLowerCase()) ||
      icon.category.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      query,
      total: matches.length,
      icons: matches.map(icon => ({
        name: icon.name,
        category: icon.category,
        format: icon.format,
        url: `/api/v1/icons/${icon.name}`
      }))
    });
  });

  return router;
}