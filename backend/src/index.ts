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

import { authRouter } from './modules/auth';
import { coursesRouter } from './modules/courses';
import { lessonsRouter } from './modules/lessons';
import { subscriptionsRouter } from './modules/subscriptions';
import { usersRouter } from './modules/users';
import { adminRouter } from './modules/admin';
import { commentsRouter } from './modules/comments';
import { videoUploadRouter } from './modules/video-upload';

dotenv.config();

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
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
      mediaSrc: ["'self'", "data:", "blob:"],
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

// Custom route handler for video files with proper CORS
app.get('/uploads/videos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/videos', filename);
  
  console.log('🎬 Video request:', filename);
  console.log('🎬 Origin header:', req.headers.origin);
  console.log('🎬 Referer header:', req.headers.referer);
  
  // Set CORS headers - Allow all origins for video files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  
  // Set video-specific headers
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  console.log('🎬 CORS headers set with wildcard origin');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    return res.status(404).json({ error: 'File not found' });
  }
  
  console.log('✅ Sending video file:', filePath);
  // Send the file
  res.sendFile(filePath);
});

// Serve other static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve test HTML files
app.use('/test-video.html', express.static('test-video.html'));
app.use('/test-cors.html', express.static('test-cors.html'));
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
app.use('/api/courses', generalLimiter, coursesRouter);
app.use('/api/lessons', generalLimiter, lessonsRouter);
app.use('/api/subscriptions', generalLimiter, subscriptionsRouter);
app.use('/api/users', strictLimiter, usersRouter);
app.use('/api/admin', strictLimiter, adminRouter);
app.use('/api/comments', generalLimiter, commentsRouter);
app.use('/api/video-upload', generalLimiter, videoUploadRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info({ port }, 'Backend listening');
});
