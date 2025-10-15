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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("./modules/auth");
const courses_1 = require("./modules/courses");
const lessons_1 = require("./modules/lessons");
const subscriptions_1 = require("./modules/subscriptions");
const users_1 = require("./modules/users");
const admin_1 = require("./modules/admin");
const comments_1 = require("./modules/comments");
const video_upload_1 = require("./modules/video-upload");
const manual_payments_1 = require("./modules/manual-payments");
const subscription_access_1 = require("./middleware/subscription-access");
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
            mediaSrc: ["'self'", "data:", "blob:", "http://localhost:3000", "http://localhost:4200"],
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
// Override CORS for uploads to be more permissive
app.use('/uploads', (0, cors_1.default)({
    origin: 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'HEAD', 'OPTIONS'],
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
// Custom route handler for video files with proper CORS and subscription check
app.get('/uploads/videos/:filename', auth_1.optionalAuth, subscription_access_1.checkVideoFileAccess, (req, res) => {
    const filename = req.params.filename;
    const filePath = path_1.default.join(__dirname, '../uploads/videos', filename);
    console.log('🎬 Video request:', filename);
    console.log('🎬 Origin header:', req.headers.origin);
    console.log('🎬 Referer header:', req.headers.referer);
    // IMPORTANT: Remove all CSP headers for video files
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
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
    if (!fs_1.default.existsSync(filePath)) {
        console.log('❌ File not found:', filePath);
        return res.status(404).json({ error: 'File not found' });
    }
    console.log('✅ Sending video file:', filePath);
    // Send the file
    res.sendFile(filePath);
});
// Serve payment screenshots (accessible by admin and payment owner only)
app.get('/uploads/payment-screenshots/:filename', auth_1.optionalAuth, (req, res) => {
    const filename = req.params.filename;
    const filePath = path_1.default.join(__dirname, '../uploads/payment-screenshots', filename);
    console.log('📸 ===== PAYMENT SCREENSHOT REQUEST =====');
    console.log('📸 Filename:', filename);
    console.log('📸 User ID:', req.userId);
    console.log('📸 User Role:', req.userRole);
    console.log('📸 Cookies:', req.cookies);
    console.log('📸 Authorization header:', req.headers.authorization);
    // Set CORS headers for screenshots
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    // Check if file exists
    if (!fs_1.default.existsSync(filePath)) {
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
    res.sendFile(path_1.default.join(__dirname, '../../test-video-direct.html'));
});
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
// Test CORS endpoint
app.get('/test-cors', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).json({ message: 'CORS test successful' });
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
app.use('/api/manual-payments', generalLimiter, manual_payments_1.manualPaymentsRouter);
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info({ port }, 'Backend listening');
});
//# sourceMappingURL=index.js.map