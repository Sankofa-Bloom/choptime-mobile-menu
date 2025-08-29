/**
 * CACHE MIDDLEWARE
 * In-memory caching for API responses
 */

const cache = new Map();

// Default cache configuration
const DEFAULT_TTL = 300; // 5 minutes in seconds
const MAX_CACHE_SIZE = 100; // Maximum number of cached items

/**
 * Cache middleware factory
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {string} options.key - Custom cache key generator
 * @returns {Function} Express middleware
 */
function cacheMiddleware(options = {}) {
  const ttl = options.ttl || DEFAULT_TTL;

  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = options.key
      ? options.key(req)
      : `${req.originalUrl}:${JSON.stringify(req.query)}`;

    // Check if response is cached
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.json(cached.data);
    }

    // Cache miss - intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          expires: Date.now() + (ttl * 1000),
          statusCode: res.statusCode
        });

        // Clean up expired entries periodically
        if (cache.size > MAX_CACHE_SIZE) {
          cleanupExpired();
        }

        console.log(`Cache stored: ${cacheKey}`);
      }

      // Restore original json method
      res.json = originalJson;
      return res.json(data);
    };

    next();
  };
}

/**
 * Invalidate cache entries by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
async function invalidateCache(pattern) {
  const keysToDelete = [];

  for (const [key] of cache) {
    if (key.includes(pattern.replace('*', ''))) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => {
    cache.delete(key);
    console.log(`Cache invalidated: ${key}`);
  });

  return keysToDelete.length;
}

/**
 * Clear all cache entries
 */
function clearCache() {
  const size = cache.size;
  cache.clear();
  console.log(`Cache cleared: ${size} entries removed`);
  return size;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;

  for (const [key, value] of cache) {
    if (now < value.expires) {
      activeEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    total: cache.size,
    active: activeEntries,
    expired: expiredEntries,
    hitRate: 0, // Would need to track hits/misses for accurate rate
    memoryUsage: JSON.stringify([...cache]).length
  };
}

/**
 * Clean up expired cache entries
 */
function cleanupExpired() {
  const now = Date.now();
  let removed = 0;

  for (const [key, value] of cache) {
    if (now >= value.expires) {
      cache.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`Cache cleanup: ${removed} expired entries removed`);
  }

  return removed;
}

// Periodic cleanup (every 10 minutes)
setInterval(cleanupExpired, 10 * 60 * 1000);

// Export functions
module.exports = {
  cache: cacheMiddleware,
  invalidateCache,
  clearCache,
  getCacheStats,
  cleanupExpired
};