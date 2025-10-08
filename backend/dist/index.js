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
dotenv_1.default.config();
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true); // allow server-to-server
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info({ port }, 'Backend listening');
});
//# sourceMappingURL=index.js.map