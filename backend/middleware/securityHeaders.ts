import { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 * Adds HTTP security headers to protect against common attacks
 */

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // ✅ Remove server info - don't leak technology stack
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // ✅ Content Security Policy - prevent XSS
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"
  );
  
  // ✅ Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // ✅ Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // ✅ Enable XSS protection in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // ✅ Referrer Policy - limit referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // ✅ Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  
  // ✅ Cross-Origin-Opener-Policy - allow popups to communicate back to the opener
  // This helps fix errors where Firebase Auth popups are blocked by stricter policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  
  // ✅ HSTS - Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
}

export default securityHeaders;
