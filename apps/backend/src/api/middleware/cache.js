import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120, useClones: false });

function buildCacheKey(key, query) {
  return `${key}:${JSON.stringify(query || {})}`;
}

export function cacheMiddleware(key, ttlSeconds = 300) {
  return (req, res, next) => {
    const cacheKey = buildCacheKey(key, req.query);
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return res.status(200).json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, payload, ttlSeconds);
      }
      return originalJson(payload);
    };

    return next();
  };
}

export function invalidateCacheByPrefix(prefixes = []) {
  if (!Array.isArray(prefixes) || !prefixes.length) return 0;
  const keys = cache.keys();
  const toDelete = keys.filter((key) => prefixes.some((prefix) => key.startsWith(`${prefix}:`)));
  if (!toDelete.length) return 0;
  return cache.del(toDelete);
}

export function invalidateCacheOnSuccess(prefixes = []) {
  return (req, res, next) => {
    res.on('finish', () => {
      const successful = res.statusCode >= 200 && res.statusCode < 300;
      if (successful) {
        invalidateCacheByPrefix(prefixes);
      }
    });
    next();
  };
}
