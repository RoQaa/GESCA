/**
 * Global XSS Sanitization Middleware
 * Replaces xss-clean which is broken on modern Node.js
 * Recursively escapes HTML special chars in req.body & req.params
 */

const escapeString = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = escapeString(value[key]);
    }
    return sanitized;
  }
  if (Array.isArray(value)) {
    return value.map(escapeString);
  }
  return value;
};

const sanitizeRequest = (req, res, next) => {
  // Sanitize req.body
  if (req.body) req.body = escapeString(req.body);

  // Sanitize req.params
  if (req.params) req.params = escapeString(req.params);

  // req.query is read-only in modern Node.js - expose a sanitized copy
  if (req.query) {
    req.sanitizedQuery = escapeString({ ...req.query });
  }

  next();
};

module.exports = sanitizeRequest;
