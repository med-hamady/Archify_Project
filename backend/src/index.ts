import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { authRouter, optionalAuth } from './modules/auth';
import { subscriptionsRouter } from './modules/subscriptions';
import { usersRouter } from './modules/users';
import { manualPaymentsRouter } from './modules/manual-payments';

// FacGame routes
import { quizRouter } from './modules/quiz';
import { subjectsRouter } from './modules/subjects';
import { chaptersRouter } from './modules/chapters';
import { profileRouter } from './modules/profile';
import { leaderboardRouter } from './modules/leaderboard';
import { challengeRouter } from './modules/challenge';
import { examRouter } from './modules/exam';
import { questionsRouter } from './modules/questions';

dotenv.config();

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200,https://archify-project.vercel.app')
  .split(',')
  .map((o) => o.trim());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      mediaSrc: ["'self'", "data:", "blob:", "http://localhost:3000", "http://localhost:4200"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
  })
);

// Override CORS for uploads to be more permissive
app.use('/uploads', cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));
app.use(express.json());
app.use(cookieParser());

// Handle CORS preflight for video files
app.options('/uploads/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.status(200).end();
});

// Additional CORS handler for all uploads routes - using middleware approach
app.use('/uploads', (req, res, next) => {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    res.status(200).end();
    return;
  }
  next();
});

// DISABLED - Old Archify video route (no longer needed for FacGame)
// Custom route handler for video files with proper CORS and subscription check
// app.get('/uploads/videos/:filename', optionalAuth, checkVideoFileAccess, (req, res) => {
//   ... (commented out)
// });

// Handle CORS preflight for payment screenshots
app.options('/uploads/payment-screenshots/:filename', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Serve payment screenshots (accessible by admin and payment owner only)
app.get('/uploads/payment-screenshots/:filename', optionalAuth, (req: any, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/payment-screenshots', filename);

  console.log('📸 ===== PAYMENT SCREENSHOT REQUEST =====');
  console.log('📸 Filename:', filename);
  console.log('📸 User ID:', req.userId);
  console.log('📸 User Role:', req.userRole);
  console.log('📸 Cookies:', req.cookies);
  console.log('📸 Authorization header:', req.headers.authorization);
  console.log('📸 Origin:', req.headers.origin);

  // IMPORTANT: Remove all CSP headers for screenshot files (like we do for videos)
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');

  // Set CORS headers for screenshots - Allow both localhost and production
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to localhost for development
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('❌ Screenshot not found:', filePath);
    return res.status(404).json({ error: 'File not found' });
  }

  console.log('✅ File exists at:', filePath);

  // Allow admins to access all screenshots
  if (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN') {
    console.log('✅ Admin access granted - sending file');
    return res.sendFile(filePath);
  }

  // For non-admins, we could check if they own the payment (future enhancement)
  // For now, allow authenticated users to see screenshots
  if (req.userId) {
    console.log('✅ Authenticated user access granted - sending file');
    return res.sendFile(filePath);
  }

  console.log('❌ Access denied - not authenticated');
  return res.status(403).json({ error: 'Access denied' });
});

// IMPORTANT: DO NOT serve uploads directory statically as it bypasses subscription checks
// Videos are served via the protected route above: /uploads/videos/:filename
// Other uploads (payment screenshots) should not be publicly accessible
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve test HTML files from root directory
app.get('/test-video-direct.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../test-video-direct.html'));
});
app.use(pinoHttp({ logger }));

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Test CORS endpoint
app.get('/test-cors', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).json({ message: 'CORS test successful' });
});

// Routes with appropriate rate limiting
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/subscriptions', generalLimiter, subscriptionsRouter);
app.use('/api/users', strictLimiter, usersRouter);
app.use('/api/manual-payments', generalLimiter, manualPaymentsRouter);

// FacGame routes
app.use('/api/quiz', generalLimiter, quizRouter);
app.use('/api/subjects', generalLimiter, subjectsRouter);
app.use('/api/chapters', generalLimiter, chaptersRouter);
app.use('/api/profile', generalLimiter, profileRouter);
app.use('/api/leaderboard', generalLimiter, leaderboardRouter);
app.use('/api/challenge', generalLimiter, challengeRouter);
app.use('/api/exam', generalLimiter, examRouter);
app.use('/api/questions', strictLimiter, questionsRouter); // Admin only

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info({ port }, 'Backend listening');
});
