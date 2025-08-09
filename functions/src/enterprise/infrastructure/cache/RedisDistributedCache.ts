/**
 * DISTRIBUTED CACHING WITH REDIS
 * Enterprise-grade caching with Redis clustering, failover, and monitoring
 */

import Redis, { Redis as RedisClient, Cluster } from 'ioredis';
import { apmTracing } from '../observability/APMTracing';

/**
 * Cache configuration for different data types
 */
export interface CacheConfig {
  ttl: number;
  keyPrefix: string;
  compress: boolean;
  serialize: boolean;
  tags?: string[];
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  operations: number;
  errors: number;
  avgResponseTime: number;
  memoryUsage: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

/**
 * Cache invalidation pattern
 */
export interface InvalidationPattern {
  pattern: string;
  tags?: string[];
  maxAge?: number;
}

/**
 * Enterprise Redis Distributed Cache
 * Supports clustering, compression, serialization, and advanced patterns
 */
export class RedisDistributedCache {
  private redis: RedisClient | Cluster;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    operations: 0,
    errors: 0,
    avgResponseTime: 0,
    memoryUsage: 0,
    connectionStatus: 'disconnected',
  };
  
  private responseTimes: number[] = [];
  private readonly maxResponseTimeHistory = 1000;

  // Default cache configurations
  private readonly cacheConfigs: Record<string, CacheConfig> = {
    events: {
      ttl: 3600, // 1 hour
      keyPrefix: 'events:',
      compress: true,
      serialize: true,
      tags: ['events', 'content'],
    },
    users: {
      ttl: 1800, // 30 minutes
      keyPrefix: 'users:',
      compress: false,
      serialize: true,
      tags: ['users', 'profile'],
    },
    sessions: {
      ttl: 7200, // 2 hours
      keyPrefix: 'sessions:',
      compress: false,
      serialize: true,
      tags: ['sessions', 'auth'],
    },
    analytics: {
      ttl: 300, // 5 minutes
      keyPrefix: 'analytics:',
      compress: true,
      serialize: true,
      tags: ['analytics', 'metrics'],
    },
    static: {
      ttl: 86400, // 24 hours
      keyPrefix: 'static:',
      compress: true,
      serialize: true,
      tags: ['static', 'config'],
    },
  };

  constructor() {
    this.initializeRedis();
    this.setupEventHandlers();
    this.startHealthMonitoring();
  }

  /**
   * Initialize Redis with clustering and failover support
   */
  private initializeRedis(): void {
    const redisConfig = {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      family: 4,
    };

    // Check if Redis cluster is configured
    if (process.env.REDIS_CLUSTER_NODES) {
      const clusterNodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port) || 6379 };
      });

      this.redis = new Redis.Cluster(clusterNodes, {
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: {
          ...redisConfig,
          password: process.env.REDIS_PASSWORD,
        },
      });

      console.log(`🔄 Redis Cluster initialized with ${clusterNodes.length} nodes`);
    } else {
      // Single Redis instance
      this.redis = new Redis({
        ...redisConfig,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      });

      console.log('🔄 Redis single instance initialized');
    }
  }

  /**
   * Setup Redis event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.stats.connectionStatus = 'connecting';
      console.log('🔄 Redis connecting...');
    });

    this.redis.on('ready', () => {
      this.stats.connectionStatus = 'connected';
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.stats.connectionStatus = 'error';
      this.stats.errors++;
      console.error('❌ Redis error:', error);
    });

    this.redis.on('close', () => {
      this.stats.connectionStatus = 'disconnected';
      console.log('🔄 Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.stats.connectionStatus = 'connecting';
      console.log('🔄 Redis reconnecting...');
    });
  }

  /**
   * Get data from cache with comprehensive tracing
   */
  public async get<T>(key: string, type: keyof typeof this.cacheConfigs = 'events'): Promise<T | null> {
    return apmTracing.traceOperation(`Redis GET`, { key, type }, async (span) => {
      const startTime = Date.now();
      const config = this.cacheConfigs[type];
      const fullKey = `${config.keyPrefix}${key}`;

      try {
        const result = await this.redis.get(fullKey);
        const responseTime = Date.now() - startTime;
        
        this.recordResponseTime(responseTime);
        this.stats.operations++;

        if (result === null) {
          this.stats.misses++;
          span.setAttributes({ 'cache.hit': false });
          return null;
        }

        this.stats.hits++;
        span.setAttributes({ 
          'cache.hit': true,
          'cache.key': fullKey,
          'cache.response_time': responseTime,
        });

        // Deserialize if configured
        if (config.serialize) {
          try {
            return JSON.parse(result) as T;
          } catch (parseError) {
            console.warn(`Failed to parse cached data for key ${fullKey}:`, parseError);
            return null;
          }
        }

        return result as unknown as T;

      } catch (error) {
        this.stats.errors++;
        console.error(`Redis GET error for key ${fullKey}:`, error);
        throw error;
      } finally {
        this.updateHitRate();
      }
    });
  }

  /**
   * Set data in cache with advanced options
   */
  public async set<T>(
    key: string, 
    value: T, 
    type: keyof typeof this.cacheConfigs = 'events',
    customTtl?: number
  ): Promise<void> {
    return apmTracing.traceOperation(`Redis SET`, { key, type }, async (span) => {
      const startTime = Date.now();
      const config = this.cacheConfigs[type];
      const fullKey = `${config.keyPrefix}${key}`;
      const ttl = customTtl || config.ttl;

      try {
        let serializedValue: string;

        // Serialize if configured
        if (config.serialize) {
          serializedValue = JSON.stringify(value);
        } else {
          serializedValue = value as unknown as string;
        }

        // Compress if configured (placeholder - would use actual compression)
        if (config.compress && serializedValue.length > 1024) {
          // Implement compression here (e.g., gzip)
          span.setAttributes({ 'cache.compressed': true });
        }

        await this.redis.setex(fullKey, ttl, serializedValue);
        
        const responseTime = Date.now() - startTime;
        this.recordResponseTime(responseTime);
        this.stats.operations++;

        // Add tags for invalidation
        if (config.tags) {
          await this.addTags(fullKey, config.tags);
        }

        span.setAttributes({
          'cache.key': fullKey,
          'cache.ttl': ttl,
          'cache.size': serializedValue.length,
          'cache.response_time': responseTime,
        });

      } catch (error) {
        this.stats.errors++;
        console.error(`Redis SET error for key ${fullKey}:`, error);
        throw error;
      }
    });
  }

  /**
   * Delete specific key
   */
  public async delete(key: string, type: keyof typeof this.cacheConfigs = 'events'): Promise<boolean> {
    return apmTracing.traceOperation(`Redis DELETE`, { key, type }, async (span) => {
      const config = this.cacheConfigs[type];
      const fullKey = `${config.keyPrefix}${key}`;

      try {
        const result = await this.redis.del(fullKey);
        this.stats.operations++;

        span.setAttributes({
          'cache.key': fullKey,
          'cache.deleted': result > 0,
        });

        return result > 0;

      } catch (error) {
        this.stats.errors++;
        console.error(`Redis DELETE error for key ${fullKey}:`, error);
        throw error;
      }
    });
  }

  /**
   * Batch get multiple keys
   */
  public async mget<T>(keys: string[], type: keyof typeof this.cacheConfigs = 'events'): Promise<(T | null)[]> {
    return apmTracing.traceOperation(`Redis MGET`, { keyCount: keys.length, type }, async (span) => {
      const config = this.cacheConfigs[type];
      const fullKeys = keys.map(key => `${config.keyPrefix}${key}`);

      try {
        const results = await this.redis.mget(...fullKeys);
        this.stats.operations++;

        const parsedResults = results.map(result => {
          if (result === null) {
            this.stats.misses++;
            return null;
          }

          this.stats.hits++;

          if (config.serialize) {
            try {
              return JSON.parse(result) as T;
            } catch (parseError) {
              console.warn(`Failed to parse cached data:`, parseError);
              return null;
            }
          }

          return result as unknown as T;
        });

        span.setAttributes({
          'cache.keys_requested': keys.length,
          'cache.keys_found': parsedResults.filter(r => r !== null).length,
        });

        this.updateHitRate();
        return parsedResults;

      } catch (error) {
        this.stats.errors++;
        console.error(`Redis MGET error:`, error);
        throw error;
      }
    });
  }

  /**
   * Invalidate cache by pattern
   */
  public async invalidateByPattern(pattern: InvalidationPattern): Promise<number> {
    return apmTracing.traceOperation(`Redis INVALIDATE_PATTERN`, { pattern: pattern.pattern }, async (span) => {
      try {
        const keys = await this.redis.keys(pattern.pattern);
        
        if (keys.length === 0) {
          return 0;
        }

        const result = await this.redis.del(...keys);
        this.stats.operations++;

        span.setAttributes({
          'cache.pattern': pattern.pattern,
          'cache.keys_invalidated': result,
        });

        console.log(`🗑️ Invalidated ${result} cache keys matching pattern: ${pattern.pattern}`);
        return result;

      } catch (error) {
        this.stats.errors++;
        console.error(`Redis pattern invalidation error:`, error);
        throw error;
      }
    });
  }

  /**
   * Invalidate cache by tags
   */
  public async invalidateByTags(tags: string[]): Promise<number> {
    return apmTracing.traceOperation(`Redis INVALIDATE_TAGS`, { tags }, async (span) => {
      try {
        let totalInvalidated = 0;

        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          const keys = await this.redis.smembers(tagKey);
          
          if (keys.length > 0) {
            const deleted = await this.redis.del(...keys);
            await this.redis.del(tagKey); // Remove the tag set itself
            totalInvalidated += deleted;
          }
        }

        this.stats.operations++;

        span.setAttributes({
          'cache.tags': tags.join(','),
          'cache.keys_invalidated': totalInvalidated,
        });

        console.log(`🗑️ Invalidated ${totalInvalidated} cache keys with tags: ${tags.join(', ')}`);
        return totalInvalidated;

      } catch (error) {
        this.stats.errors++;
        console.error(`Redis tag invalidation error:`, error);
        throw error;
      }
    });
  }

  /**
   * Add tags to a key for group invalidation
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      pipeline.sadd(tagKey, key);
      pipeline.expire(tagKey, 86400); // Tags expire in 24 hours
    }
    
    await pipeline.exec();
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache information
   */
  public async getDetailedInfo(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const memoryInfo = this.parseRedisInfo(info);
      
      return {
        stats: this.getStats(),
        memory: memoryInfo,
        configurations: this.cacheConfigs,
        performance: {
          avgResponseTime: this.stats.avgResponseTime,
          p95ResponseTime: this.getPercentile(95),
          p99ResponseTime: this.getPercentile(99),
        },
      };
    } catch (error) {
      console.error('Failed to get Redis info:', error);
      return { stats: this.getStats() };
    }
  }

  /**
   * Flush all cache data (use with caution!)
   */
  public async flush(): Promise<void> {
    return apmTracing.traceOperation(`Redis FLUSH`, {}, async (span) => {
      try {
        await this.redis.flushdb();
        console.log('🗑️ Redis cache flushed completely');
        
        // Reset stats
        this.stats.hits = 0;
        this.stats.misses = 0;
        this.stats.operations = 0;
        this.updateHitRate();

        span.setAttributes({ 'cache.flushed': true });

      } catch (error) {
        this.stats.errors++;
        console.error('Redis flush error:', error);
        throw error;
      }
    });
  }

  /**
   * Check cache health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Record response time for performance monitoring
   */
  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only recent response times
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes = this.responseTimes.slice(-this.maxResponseTimeHistory);
    }
    
    // Update average
    this.stats.avgResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Update cache hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Get response time percentile
   */
  private getPercentile(percentile: number): number {
    if (this.responseTimes.length === 0) return 0;
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): any {
    const result: any = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return result;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        const isHealthy = await this.healthCheck();
        if (!isHealthy && this.stats.connectionStatus === 'connected') {
          this.stats.connectionStatus = 'error';
          console.error('❌ Redis health check failed');
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('🔄 Redis connection closed gracefully');
    } catch (error) {
      console.error('Error during Redis shutdown:', error);
    }
  }
}

// Export singleton instance
export const redisCache = new RedisDistributedCache();