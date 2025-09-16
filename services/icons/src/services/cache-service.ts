/**
 * Cache Service for Icon Delivery
 * LRU cache implementation for optimal performance
 */

import { LRUCache } from 'lru-cache';
import { config } from '../config';

export class CacheService {
  private cache: LRUCache<string, any>;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    evictions: number;
  };

  constructor() {
    this.cache = new LRUCache({
      max: config.cacheMaxSize,
      ttl: config.cacheTTL * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      dispose: () => {
        this.stats.evictions++;
      }
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  /**
   * Get item from cache
   */
  get(key: string): any | null {
    if (!config.cacheEnabled) {
      return null;
    }

    const value = this.cache.get(key);
    if (value) {
      this.stats.hits++;
      return value;
    } else {
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set item in cache
   */
  set(key: string, value: any, ttl?: number): void {
    if (!config.cacheEnabled) {
      return;
    }

    this.cache.set(key, value, {
      ttl: ttl ? ttl * 1000 : undefined
    });
    this.stats.sets++;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    sets: number;
    evictions: number;
    hitRate: number;
  } {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      size: this.cache.size,
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Get cache info
   */
  getInfo(): {
    maxSize: number;
    currentSize: number;
    ttl: number;
    enabled: boolean;
  } {
    return {
      maxSize: config.cacheMaxSize,
      currentSize: this.cache.size,
      ttl: config.cacheTTL,
      enabled: config.cacheEnabled
    };
  }
}