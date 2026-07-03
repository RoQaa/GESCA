/**
 * @module cache.config
 * @description No-op cache service stub.
 *
 * ARCHITECTURE NOTE (Option B — Redis skipped for now):
 * The CacheService interface is fully defined. All methods are functional stubs
 * that return sensible defaults (null for get, void for set/del).
 *
 * When you are ready to enable Redis:
 *  1. Install ioredis: npm install ioredis @types/ioredis
 *  2. Replace this file with the real Redis implementation (interface stays identical)
 *  3. Update .env with REDIS_URL
 *  4. Zero changes required in services, controllers, or repositories.
 *
 * This pattern is the Strategy design pattern applied to caching.
 */

import { log } from './logger.config';

// ─── Cache interface (contract) ───────────────────────────────────────────────

export interface ICacheService {
  /** Get a cached value by key. Returns null if not found or cache is disabled. */
  get<T>(key: string): Promise<T | null>;

  /** Store a value with optional TTL in seconds. */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /** Delete a specific cache key. */
  del(key: string): Promise<void>;

  /** Delete all keys matching a pattern (e.g., "employees:*") */
  delByPattern(pattern: string): Promise<void>;

  /** Check if a key exists in the cache. */
  exists(key: string): Promise<boolean>;

  /** Clear the entire cache. Use with caution. */
  flush(): Promise<void>;

  /** Check if the cache backend is healthy. */
  ping(): Promise<boolean>;
}

// ─── No-op implementation ─────────────────────────────────────────────────────

class NoCacheService implements ICacheService {
  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T>(_key: string, _value: T, _ttlSeconds?: number): Promise<void> {
    // No-op
  }

  async del(_key: string): Promise<void> {
    // No-op
  }

  async delByPattern(_pattern: string): Promise<void> {
    // No-op
  }

  async exists(_key: string): Promise<boolean> {
    return false;
  }

  async flush(): Promise<void> {
    // No-op
  }

  async ping(): Promise<boolean> {
    return true; // Always healthy (no backend to fail)
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const cache: ICacheService = new NoCacheService();

log.info('Cache service initialized [mode: no-op stub — Redis not configured]', {
  module: 'cache',
});
