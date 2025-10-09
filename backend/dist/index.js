"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./modules/auth");
const courses_1 = require("./modules/courses");
const lessons_1 = require("./modules/lessons");
const subscriptions_1 = require("./modules/subscriptions");
const users_1 = require("./modules/users");
const admin_1 = require("./modules/admin");
const comments_1 = require("./modules/comments");
const video_upload_1 = require("./modules/video-upload");
dotenv_1.default.config();
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true); // allow server-to-server
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Handle CORS preflight for video files
app.options('/uploads/:filename', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    res.status(200).end();
});
// Serve static files from uploads directory with proper headers for video streaming
app.use('/uploads', express_1.default.static('uploads', {
    setHeaders: (res, path) => {
        // Set CORS headers for all static files
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
        // Set specific headers for video files
        if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.ogg') || path.endsWith('.avi') || path.endsWith('.mov')) {
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            // CRITICAL: Prevent download, allow inline playback
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    }
}));
app.use((0, pino_http_1.default)({ logger }));
// Rate limiting configurations
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
const strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});
app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Routes with appropriate rate limiting
app.use('/api/auth', authLimiter, auth_1.authRouter);
app.use('/api/courses', generalLimiter, courses_1.coursesRouter);
app.use('/api/lessons', generalLimiter, lessons_1.lessonsRouter);
app.use('/api/subscriptions', generalLimiter, subscriptions_1.subscriptionsRouter);
app.use('/api/users', strictLimiter, users_1.usersRouter);
app.use('/api/admin', strictLimiter, admin_1.adminRouter);
app.use('/api/comments', generalLimiter, comments_1.commentsRouter);
app.use('/api/video-upload', generalLimiter, video_upload_1.videoUploadRouter);
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info({ port }, 'Backend listening');
});
//# sourceMappingURL=index.js.map