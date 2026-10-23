// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * Global rate limiter for general endpoints
 */
exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter specifically for BLE endpoints
 * Prevents spam from malicious clients
 */
exports.bleRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute (1 every 2 seconds)
  message: {
    success: false,
    message: 'Too many BLE requests. Please wait before sending more data.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count requests from same user
  keyGenerator: (req) => {
    return req.user ? req.user.id : ipKeyGenerator(req);
  },
  skip: (req) => {
    // Skip rate limiting for admin users if needed
    return req.user && req.user.isAdmin;
  }
});

/**
 * Stricter rate limiter for session creation
 */
exports.sessionRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 session starts per 5 minutes
  message: {
    success: false,
    message: 'Too many session attempts. Please wait before connecting again.'
  },
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req)
});

