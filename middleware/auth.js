// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Middleware to authenticate requests using a Bearer JWT
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : null;

  // Fallback: check for token cookie (httpOnly cookie set by server)
  if (!token && req.headers && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith('token=')) {
        token = c.substring('token='.length);
        break;
      }
    }
  }

  if (!token) {
    console.warn('authenticateToken: missing token (no Authorization header or token cookie)');
    return res.status(401).json({ success: false, message: 'Missing or invalid token' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      console.warn('authenticateToken: token verification failed', err);
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    // Attach the decoded payload as the authenticated user
    req.user = payload;
    next();
  });
};