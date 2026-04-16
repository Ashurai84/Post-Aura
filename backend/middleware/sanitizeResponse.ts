import { Request, Response, NextFunction } from 'express';

/**
 * Response Sanitizer Middleware
 * Automatically removes sensitive fields from ALL API responses
 * Prevents accidental exposure of passwords, API keys, internal IDs, etc.
 */

// Fields that should NEVER be exposed to frontend
const SENSITIVE_FIELDS = new Set([
  // Database fields
  '__v',
  '_id',
  '__proto__',
  'constructor',
  
  // Security fields
  'password',
  'salt',
  'hash',
  'token',
  'refreshToken',
  'accessToken',
  
  // Keys & Secrets
  'apiKey',
  'secretKey',
  'encryptionKey',
  'jwtSecret',
  'googleApiKey',
  'mongoUri',
  'firebaseKey',
  
  // Firebase Admin
  'serviceAccount',
  'firebaseServiceAccount',
  '_firebaseServiceAccount',
  'firebaseAdminKey',
  
  // Internal fields
  'internalId',
  'debugInfo',
  '_debug',
  'stack',
  'stackTrace',
]);

function sanitizeValue(value: any): any {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item));
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    const sanitized: any = {};

    for (const [key, val] of Object.entries(value)) {
      // Skip sensitive fields (case-insensitive check)
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeValue(val);
    }

    return sanitized;
  }

  // Return primitive values as-is
  return value;
}

export function sanitizeResponse(req: Request, res: Response, next: NextFunction): void {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to sanitize before sending
  res.json = function(data: any): Response {
    try {
      // Sanitize the response data
      const sanitized = sanitizeValue(data);

      // Log if sanitization occurred (for debugging)
      if (JSON.stringify(data) !== JSON.stringify(sanitized)) {
        const removed = Object.keys(data).filter(
          key => !Object.keys(sanitized).includes(key)
        );
        if (removed.length > 0) {
          console.log(`[SANITIZE] Removed sensitive fields: ${removed.join(', ')}`);
        }
      }

      return originalJson(sanitized);
    } catch (error) {
      console.error('[SANITIZE] Error sanitizing response:', error);
      // Return original if sanitization fails
      return originalJson(data);
    }
  };

  next();
}

export default sanitizeResponse;
