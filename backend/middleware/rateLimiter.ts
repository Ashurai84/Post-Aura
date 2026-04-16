import { Request, Response, NextFunction } from 'express';

/**
 * Custom Rate Limiting Middleware
 * Tracks requests per IP address to prevent abuse
 */

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number; // Window in milliseconds
  private maxRequests: number; // Max requests per window
  private skipSuccessfulRequests: boolean;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100, skipSuccessful: boolean = false) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.skipSuccessfulRequests = skipSuccessful;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private getClientIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
           (req.headers['x-real-ip'] as string) ||
           req.socket.remoteAddress ||
           'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(ip => {
      if (this.store[ip].resetTime < now) {
        delete this.store[ip];
      }
    });
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);
      const now = Date.now();

      // Initialize or get existing rate limit data
      if (!this.store[ip]) {
        this.store[ip] = {
          count: 0,
          resetTime: now + this.windowMs,
        };
      }

      const entry = this.store[ip];

      // Reset if window expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + this.windowMs;
      }

      // Add request count
      entry.count++;

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

      // Check if limit exceeded
      if (entry.count > this.maxRequests) {
        console.warn(`[RATE-LIMIT] ${ip} exceeded limit (${entry.count}/${this.maxRequests})`);
        return res.status(429).json({
          error: 'Too many requests, please try again later',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
      }

      next();
    };
  }
}

// Create global rate limiter
export const globalRateLimiter = new RateLimiter(
  15 * 60 * 1000, // 15 minutes
  100 // 100 requests per 15 minutes
);

// Create stricter admin rate limiter
export const adminRateLimiter = new RateLimiter(
  15 * 60 * 1000, // 15 minutes
  30 // 30 requests per 15 minutes (stricter)
);

// Create strict auth rate limiter (login attempts)
export const authRateLimiter = new RateLimiter(
  60 * 60 * 1000, // 1 hour
  5 // 5 attempts per hour
);

export default RateLimiter;
