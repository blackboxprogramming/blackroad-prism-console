const Redis = require('ioredis');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const { getConfig } = require('../config');
const { writeAudit } = require('../logger');
const { increment } = require('../metrics');

let limiter;
let redisClient;

function createLimiter() {
  const config = getConfig();
  if (config.redisUrl) {
    redisClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 0
    });
    limiter = new RateLimiterRedis({
      storeClient: redisClient,
      points: config.rateLimit.points,
      duration: config.rateLimit.duration,
      keyPrefix: 'autopal_rl'
    });
  } else {
    limiter = new RateLimiterMemory({
      points: config.rateLimit.points,
      duration: config.rateLimit.duration,
      keyPrefix: 'autopal_rl'
    });
  }
}

function getLimiter() {
  if (!limiter) {
    createLimiter();
  }
  return limiter;
}

async function rateLimitGuard(req, res, next) {
  const limiterInstance = getLimiter();
  const key = req.headers['authorization'] || req.ip;
  try {
    await limiterInstance.consume(key);
    next();
  } catch (error) {
    increment('rate_limit.rejected');
    writeAudit({
      action: 'rate_limited',
      path: req.originalUrl,
      method: req.method,
      key,
      trace_id: req.traceId
    });
    res.set('Retry-After', String(error.msBeforeNext / 1000));
    res.status(429).json({ message: 'Too many requests' });
  }
}

module.exports = {
  rateLimitGuard
};
