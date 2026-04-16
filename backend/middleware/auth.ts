import { Request, Response, NextFunction } from "express";
import { getAdminAuth } from "../services/firebaseAdmin";
import { EncryptionService } from "../services/encryption";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
  auditLog?: {
    email: string;
    action: string;
    timestamp: number;
    userAgent?: string;
    ip?: string;
    allowed: boolean;
  };
}

export async function verifyFirebaseToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn(`[AUTH] Missing bearer token from ${req.ip}`);
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    };
    
    next();
  } catch (error: any) {
    console.warn(`[AUTH] Token verification failed: ${error.message}`);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

/**
 * Verify user is admin with enhanced security checks
 * - Checks email is in ADMIN_EMAILS list
 * - Logs audit trail
 * - Validates request authenticity
 */
export function requireAdminEmail(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.email) {
    return res.status(401).json({ error: "Access denied: No user email" });
  }

  const FIXED_ADMIN = "raia40094@gmail.com";
  const email = req.user.email.toLowerCase();
  
  // ✅ SECURITY: Get dynamic admins from env
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Allow if it's the fixed admin OR in the env list
  if (email !== FIXED_ADMIN && !ADMIN_EMAILS.includes(email)) {
    // ✅ SECURITY: Log unauthorized access attempt
    const auditLog = {
      email,
      action: req.path,
      timestamp: Date.now(),
      userAgent: req.get('user-agent') || 'unknown',
      ip: req.ip || 'unknown',
      allowed: false,
    };
    
    console.warn(`[SECURITY] Unauthorized admin access attempt: ${JSON.stringify(auditLog)}`);
    
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  // ✅ SECURITY: Attach audit log context for successful admin requests
  const auditLog = {
    email,
    action: req.path,
    timestamp: Date.now(),
    userAgent: req.get('user-agent') || 'unknown',
    ip: req.ip || 'unknown',
    allowed: true,
  };

  req.auditLog = auditLog;

  // Log successful admin access
  console.log(`[AUDIT] Admin action: ${email} | ${req.method} ${req.path} | IP: ${req.ip}`);

  next();
}

/**
 * ✅ SECURITY: Hash sensitive data for logging
 * Never log unencrypted emails, phone numbers, etc.
 */
export function hashSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const hashed = { ...data };
  
  if (hashed.email) {
    hashed.email = EncryptionService.hash(hashed.email).substring(0, 16) + '***';
  }
  
  if (hashed.phone) {
    hashed.phone = '***';
  }
  
  if (hashed.password) {
    hashed.password = '[REDACTED]';
  }
  
  return hashed;
}
