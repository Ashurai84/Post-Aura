import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import backendRoutes from './routes';
import { connectDB } from './config/db';
import { securityHeaders } from './middleware/securityHeaders';
import { sanitizeResponse } from './middleware/sanitizeResponse';
import { globalRateLimiter, adminRateLimiter } from './middleware/rateLimiter';

dotenv.config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ SECURITY: Define allowed CORS origins
const ALLOWED_ORIGINS = [
  "http://localhost:3000", 
  "http://localhost:5173", 
  "http://localhost:5174",
  "http://localhost:5175",
  "https://postaura.dev",
  "https://post-aura-frontend.netlify.app",
  "https://post-aura-admin.netlify.app"
];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[SECURITY] Blocked CORS request from origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// ✅ SECURITY: Remove server fingerprint
app.disable('x-powered-by');

// ✅ SECURITY: Payload size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ SECURITY: Apply security headers to all responses
app.use(securityHeaders);

// ✅ SECURITY: Sanitize all responses (remove sensitive fields)
app.use(sanitizeResponse);

// ✅ SECURITY: Rate limiting
app.use(globalRateLimiter.middleware());

// ✅ SECURITY: Stricter rate limits for admin endpoints
app.use('/api/admin', adminRateLimiter.middleware());

// ✅ SECURITY: Log suspicious activity
app.use((req, res, next) => {
  if (req.path.includes('/admin')) {
    console.log(`[AUDIT] ${req.method} ${req.path} from ${req.ip} | User-Agent: ${req.get('user-agent')}`);
  }
  next();
});

app.use("/api", backendRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ✅ SECURITY: 404 handler (don't leak route info)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ✅ SECURITY: Error handler (don't leak stack traces in production)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  
  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[PostAura] Backend running on http://localhost:${PORT}`);
    console.log(`[SECURITY] ✅ Security headers applied`);
    console.log(`[SECURITY] ✅ Response sanitization active`);
    console.log(`[SECURITY] ✅ Rate limiting enabled (${ALLOWED_ORIGINS.length} CORS origins)`);
    console.log(`[SECURITY] ✅ Admin endpoints protected with stricter rate limits`);
  });
}).catch((err) => {
  console.error('[PostAura] Failed to start server:', err);
  process.exit(1);
});
