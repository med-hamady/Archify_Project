import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { authRouter } from './modules/auth';
import { coursesRouter } from './modules/courses';
import { lessonsRouter } from './modules/lessons';
import { subscriptionsRouter } from './modules/subscriptions';
import { usersRouter } from './modules/users';
import { adminRouter } from './modules/admin';
import { commentsRouter } from './modules/comments';

dotenv.config();

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
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

// Routes with appropriate rate limiting
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/courses', generalLimiter, coursesRouter);
app.use('/api/lessons', generalLimiter, lessonsRouter);
app.use('/api/subscriptions', generalLimiter, subscriptionsRouter);
app.use('/api/users', strictLimiter, usersRouter);
app.use('/api/admin', strictLimiter, adminRouter);
app.use('/api/comments', generalLimiter, commentsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info({ port }, 'Backend listening');
});
