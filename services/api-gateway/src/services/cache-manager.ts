/**
 * Cache Manager
 * Response caching for improved performance
 */

import NodeCache from 'node-cache';
import { logger } from '../utils/logger';
import { config } from '../config';

export class CacheManager {
  private cache: NodeCache;
  private connected: boolean;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cache.memory.ttl,
      checkperiod: 120,
      maxKeys: config.cache.memory.max,
    });
    this.connected = false;
  }

  /**
   * Connect to cache
   */
  async connect(): Promise<void> {
    try {
      // In production, would connect to Redis
      this.connected = true;
      logger.info('Cache manager connected');
    } catch (error) {
      logger.error('Failed to connect to cache', { error });
      throw error;
    }
  }

  /**
   * Get cached value
   */
  get(key: string): any {
    return this.cache.get(key);
  }

  /**
   * Set cache value
   */
  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || config.cache.memory.ttl);
  }

  /**
   * Delete cache entry
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    return this.cache.getStats();
  }

  /**
   * Generate cache key
   */
  generateKey(service: string, path: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${service}:${path}:${paramStr}`;
  }

  /**
   * Disconnect from cache
   */
  async disconnect(): Promise<void> {
    this.cache.close();
    this.connected = false;
    logger.info('Cache manager disconnected');
  }
}