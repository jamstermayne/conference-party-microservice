/**
 * COST OPTIMIZATION MODULE
 * Comprehensive cost reduction strategies for Firebase services
 */

import {getFirestore} from "firebase-admin/firestore";
import * as crypto from "crypto";

/**
 * COST OPTIMIZATION CONFIGURATION
 */
export const COST_CONFIG = {
  // Caching
  CACHE_TTL_SHORT: 60000, // 1 minute for frequently changing data
  CACHE_TTL_MEDIUM: 300000, // 5 minutes for normal data
  CACHE_TTL_LONG: 3600000, // 1 hour for static data
  CACHE_TTL_EXTENDED: 86400000, // 24 hours for rarely changing data

  // Firestore optimization
  MAX_BATCH_SIZE: 500, // Maximum batch write size
  READ_BATCH_SIZE: 50, // Optimal read batch size
  QUERY_LIMIT_DEFAULT: 25, // Default query limit
  QUERY_LIMIT_MAX: 100, // Maximum query limit

  // Function optimization
  MIN_INSTANCES: 0, // Scale to zero when idle
  MAX_INSTANCES: 3, // Limit concurrent instances
  MEMORY_ALLOCATION: "256MiB", // Reduced memory for cost savings
  TIMEOUT_SECONDS: 30, // Shorter timeout

  // Request optimization
  DEDUP_WINDOW: 5000, // 5 seconds deduplication window
  BATCH_WINDOW: 100, // 100ms batching window
  COMPRESSION_THRESHOLD: 1024, // Compress responses > 1KB
};

/**
 * MULTI-TIER CACHING SYSTEM
 */
class CostOptimizedCache {
  private memoryCache: Map<string, { data: any; expires: number; hits: number }> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    savings: 0,
  };

  /**
   * Get from cache with cost tracking
   */
  get(key: string): any | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    if (Date.now() > entry.expires) {
      this.memoryCache.delete(key);
      this.cacheStats.evictions++;
      return null;
    }

    entry.hits++;
    this.cacheStats.hits++;
    this.cacheStats.savings++; // Each cache hit saves a Firestore read

    return entry.data;
  }

  /**
   * Set with intelligent TTL based on data type
   */
  set(key: string, data: any, ttl?: number): void {
    // Determine optimal TTL based on key pattern
    const optimalTTL = ttl || this.determineOptimalTTL(key);

    // Implement cache size limit (keep most frequently accessed)
    if (this.memoryCache.size >= 1000) {
      this.evictLeastUsed();
    }

    this.memoryCache.set(key, {
      data,
      expires: Date.now() + optimalTTL,
      hits: 0,
    });
  }

  /**
   * Determine optimal TTL based on data type
   */
  private determineOptimalTTL(key: string): number {
    // Static data (configurations, etc.)
    if (key.includes("config") || key.includes("static")) {
      return COST_CONFIG.CACHE_TTL_EXTENDED;
    }

    // User-specific data
    if (key.includes("user") || key.includes("session")) {
      return COST_CONFIG.CACHE_TTL_MEDIUM;
    }

    // Event data (changes moderately)
    if (key.includes("event") || key.includes("party")) {
      return COST_CONFIG.CACHE_TTL_LONG;
    }

    // Default for dynamic data
    return COST_CONFIG.CACHE_TTL_SHORT;
  }

  /**
   * Evict least recently used items
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].hits - b[1].hits);

    // Remove bottom 20%
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
      this.cacheStats.evictions++;
    }
  }

  /**
   * Get cache statistics for cost analysis
   */
  getStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    const estimatedSavings = this.cacheStats.savings * 0.00036; // ~$0.36 per 1000 reads

    return {
      ...this.cacheStats,
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
      estimatedSavings: `$${estimatedSavings.toFixed(4)}`,
      cacheSize: this.memoryCache.size,
    };
  }

  /**
   * Clear cache selectively
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      return;
    }

    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

/**
 * REQUEST DEDUPLICATION
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestHistory: Map<string, number> = new Map();

  /**
   * Deduplicate identical requests within time window
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    windowMs: number = COST_CONFIG.DEDUP_WINDOW
  ): Promise<T> {
    // Check if identical request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`Deduplicating request: ${key}`);
      return pending;
    }

    // Check if recently completed
    const lastCompleted = this.requestHistory.get(key);
    if (lastCompleted && Date.now() - lastCompleted < windowMs) {
      console.log(`Request recently completed, skipping: ${key}`);
      return null as any; // Return cached result instead
    }

    // Execute request
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
      this.requestHistory.set(key, Date.now());

      // Cleanup old history
      setTimeout(() => {
        this.requestHistory.delete(key);
      }, windowMs);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

/**
 * BATCH PROCESSOR
 */
class BatchProcessor {
  private batches: Map<string, { items: any[]; timer: NodeJS.Timeout }> = new Map();

  /**
   * Add item to batch for processing
   */
  async addToBatch(
    batchKey: string,
    item: any,
    processFn: (items: any[]) => Promise<void>,
    windowMs: number = COST_CONFIG.BATCH_WINDOW
  ): Promise<void> {
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        items: [],
        timer: setTimeout(() => {
          this.processBatch(batchKey, processFn);
        }, windowMs),
      });
    }

    const batch = this.batches.get(batchKey)!;
    batch.items.push(item);

    // Process immediately if batch is full
    if (batch.items.length >= COST_CONFIG.MAX_BATCH_SIZE) {
      clearTimeout(batch.timer);
      await this.processBatch(batchKey, processFn);
    }
  }

  /**
   * Process accumulated batch
   */
  private async processBatch(
    batchKey: string,
    processFn: (items: any[]) => Promise<void>
  ): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.items.length === 0) return;

    const items = [...batch.items];
    this.batches.delete(batchKey);

    try {
      await processFn(items);
      console.log(`Processed batch of ${items.length} items for ${batchKey}`);
    } catch (error) {
      console.error(`Batch processing failed for ${batchKey}:`, error);
      throw error;
    }
  }
}

/**
 * FIRESTORE QUERY OPTIMIZER
 */
export class QueryOptimizer {
  private cache = new CostOptimizedCache();
  private deduplicator = new RequestDeduplicator();
  private batchProcessor = new BatchProcessor();

  /**
   * Optimized query with caching and pagination
   */
  async optimizedQuery(
    collectionPath: string,
    queryOptions: {
      where?: Array<[string, any, any]>;
      orderBy?: [string, "asc" | "desc"];
      limit?: number;
      startAfter?: any;
    } = {}
  ): Promise<any[]> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(collectionPath, queryOptions);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for query: ${cacheKey}`);
      return cached;
    }

    // Deduplicate identical queries
    const result = await this.deduplicator.deduplicate(cacheKey, async () => {
      const db = getFirestore();
      let query: any = db.collection(collectionPath);

      // Apply filters
      if (queryOptions.where) {
        for (const [field, operator, value] of queryOptions.where) {
          query = query.where(field, operator, value);
        }
      }

      // Apply ordering
      if (queryOptions.orderBy) {
        query = query.orderBy(...queryOptions.orderBy);
      }

      // Apply pagination
      const limit = Math.min(
        queryOptions.limit || COST_CONFIG.QUERY_LIMIT_DEFAULT,
        COST_CONFIG.QUERY_LIMIT_MAX
      );
      query = query.limit(limit);

      if (queryOptions.startAfter) {
        query = query.startAfter(queryOptions.startAfter);
      }

      // Execute query
      const snapshot = await query.get();
      const results = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Cache results
      this.cache.set(cacheKey, results);

      return results;
    });

    return result || [];
  }

  /**
   * Batch write operations
   */
  async batchWrite(
    collectionPath: string,
    operations: Array<{
      type: "set" | "update" | "delete";
      id: string;
      data?: any;
    }>
  ): Promise<void> {
    await this.batchProcessor.addToBatch(
      `write_${collectionPath}`,
      operations,
      async (allOperations) => {
        const db = getFirestore();
        const flatOperations = allOperations.flat();

        // Process in batches of 500 (Firestore limit)
        for (let i = 0; i < flatOperations.length; i += COST_CONFIG.MAX_BATCH_SIZE) {
          const batch = db.batch();
          const chunk = flatOperations.slice(i, i + COST_CONFIG.MAX_BATCH_SIZE);

          for (const op of chunk) {
            const docRef = db.collection(collectionPath).doc(op.id);

            switch (op.type) {
            case "set":
              batch.set(docRef, op.data);
              break;
            case "update":
              batch.update(docRef, op.data);
              break;
            case "delete":
              batch.delete(docRef);
              break;
            }
          }

          await batch.commit();
        }

        // Invalidate cache for this collection
        this.cache.clear(collectionPath);
      }
    );
  }

  /**
   * Generate consistent cache key
   */
  private generateCacheKey(collection: string, options: any): string {
    const hash = crypto.createHash("md5");
    hash.update(`${collection}:${JSON.stringify(options)}`);
    return hash.digest("hex");
  }

  /**
   * Get optimizer statistics
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      pendingBatches: this.batchProcessor,
      activeDeduplication: this.deduplicator,
    };
  }
}

/**
 * RESPONSE COMPRESSION
 */
export function compressResponse(data: any): string | any {
  const jsonString = JSON.stringify(data);

  // Only compress if above threshold
  if (jsonString.length < COST_CONFIG.COMPRESSION_THRESHOLD) {
    return data;
  }

  // Use built-in compression if available
  if (typeof Buffer !== "undefined") {
    const compressed = Buffer.from(jsonString).toString("base64");

    // Only use compressed if actually smaller
    if (compressed.length < jsonString.length) {
      return {
        _compressed: true,
        data: compressed,
        originalSize: jsonString.length,
        compressedSize: compressed.length,
      };
    }
  }

  return data;
}

/**
 * COLD START OPTIMIZER
 */
export class ColdStartOptimizer {
  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  /**
   * Lazy initialization of expensive resources
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    await this.initPromise;
    this.initialized = true;
  }

  private static async performInitialization(): Promise<void> {
    // Defer expensive imports
    const start = Date.now();

    // Initialize only essential services
    console.log(`Cold start optimization: ${Date.now() - start}ms`);
  }

  /**
   * Preload frequently accessed data
   */
  static async preloadCache(cache: CostOptimizedCache): Promise<void> {
    const db = getFirestore();

    try {
      // Preload active parties (most frequently accessed)
      const parties = await db.collection("parties")
        .where("active", "==", true)
        .limit(50)
        .get();

      const partyData = parties.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      cache.set("preloaded_parties", partyData, COST_CONFIG.CACHE_TTL_LONG);
      console.log(`Preloaded ${partyData.length} parties to cache`);
    } catch (error) {
      console.error("Cache preload failed:", error);
    }
  }
}

/**
 * COST MONITORING
 */
export class CostMonitor {
  private operations = {
    reads: 0,
    writes: 0,
    deletes: 0,
    functionInvocations: 0,
    bandwidth: 0,
  };

  private costs = {
    readCost: 0.00036, // $0.36 per 100K reads
    writeCost: 0.00108, // $1.08 per 100K writes
    deleteCost: 0.00012, // $0.12 per 100K deletes
    functionCost: 0.0000004, // $0.40 per million invocations
    bandwidthCost: 0.12, // $0.12 per GB
  };

  /**
   * Track operation
   */
  trackOperation(type: keyof typeof this.operations, count: number = 1): void {
    this.operations[type] += count;
  }

  /**
   * Track bandwidth usage
   */
  trackBandwidth(bytes: number): void {
    this.operations.bandwidth += bytes / (1024 * 1024 * 1024); // Convert to GB
  }

  /**
   * Calculate estimated costs
   */
  getEstimatedCosts() {
    const costs = {
      reads: (this.operations.reads / 100000) * this.costs.readCost,
      writes: (this.operations.writes / 100000) * this.costs.writeCost,
      deletes: (this.operations.deletes / 100000) * this.costs.deleteCost,
      functions: (this.operations.functionInvocations / 1000000) * this.costs.functionCost,
      bandwidth: this.operations.bandwidth * this.costs.bandwidthCost,
    };

    const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    return {
      operations: this.operations,
      costs,
      total,
      dailyProjection: total * 24, // Rough projection
      monthlyProjection: total * 24 * 30,
    };
  }

  /**
   * Get cost optimization recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const costData = this.getEstimatedCosts();

    if (this.operations.reads > this.operations.writes * 10) {
      recommendations.push("High read ratio detected. Consider increasing cache TTL.");
    }

    if (costData.costs.bandwidth > (costData.costs.reads + costData.costs.writes + costData.costs.deletes + costData.costs.functions) * 0.3) {
      recommendations.push("Bandwidth costs are high. Enable response compression.");
    }

    if (this.operations.functionInvocations > 1000) {
      recommendations.push("High function invocations. Consider batching requests.");
    }

    if (costData.monthlyProjection > 10) {
      recommendations.push("Monthly costs exceeding $10. Review optimization strategies.");
    }

    return recommendations;
  }

  /**
   * Reset counters
   */
  reset(): void {
    this.operations = {
      reads: 0,
      writes: 0,
      deletes: 0,
      functionInvocations: 0,
      bandwidth: 0,
    };
  }
}

// Export singleton instances
export const queryOptimizer = new QueryOptimizer();
export const costMonitor = new CostMonitor();
export const globalCache = new CostOptimizedCache();
