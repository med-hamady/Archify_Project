"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.requireAuth = requireAuth;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_service_1 = require("../services/email.service");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
exports.authRouter = (0, express_1.Router)();
// Helpers
const ACCESS_TOKEN_TTL_SEC = parseInt(process.env.ACCESS_TOKEN_TTL_SEC || '900'); // 15m
const REFRESH_TOKEN_TTL_SEC = parseInt(process.env.REFRESH_TOKEN_TTL_SEC || '1209600'); // 14d
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'changeme-refresh';
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SEC });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SEC });
}
function setAuthCookies(res, accessToken, refreshToken) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: ACCESS_TOKEN_TTL_SEC * 1000,
        path: '/',
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TTL_SEC * 1000,
        path: '/',
    });
}
function clearAuthCookies(res) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
}
function getUserPublic(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        semester: user.semester,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        subscription: {
            type: 'free',
            isActive: false,
            expiresAt: null,
        },
        profile: {
            avatar: user.avatarUrl ?? undefined,
            department: undefined,
            year: user.semester ?? undefined,
        },
        firstName: user.name?.split(' ')[0] || user.name,
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
    };
}
// Auth middleware
function requireAuth(req, res, next) {
    const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
    if (!token)
        return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No token' } });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.sub;
        req.userRole = decoded.role;
        return next();
    }
    catch (_e) {
        return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    }
}
// Schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(1),
    semester: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
// POST /register
exports.authRouter.post('/register', async (req, res) => {
    try {
        const body = registerSchema.parse(req.body);
        const existing = await prisma.user.findUnique({ where: { email: body.email } });
        if (existing) {
            return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email already in use' } });
        }
        const passwordHash = await bcryptjs_1.default.hash(body.password, 10);
        const user = await prisma.user.create({
            data: {
                email: body.email,
                passwordHash,
                name: body.name,
                semester: body.semester ?? 'S1',
            },
        });
        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        const refreshToken = signRefreshToken({ sub: user.id });
        setAuthCookies(res, accessToken, refreshToken);
        return res.status(201).json({ user: getUserPublic(user) });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /login
exports.authRouter.post('/login', async (req, res) => {
    try {
        const body = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email: body.email } });
        if (!user)
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
        const ok = await bcryptjs_1.default.compare(body.password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
        // Update last login time (removed lastLoginAt field)
        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        const refreshToken = signRefreshToken({ sub: user.id });
        setAuthCookies(res, accessToken, refreshToken);
        return res.json({ user: getUserPublic(user) });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /refresh
exports.authRouter.post('/refresh', async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (!token)
        return res.status(401).json({ error: { code: 'NO_REFRESH', message: 'No refresh token' } });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
        if (!user)
            return res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Invalid refresh' } });
        const newAccess = signAccessToken({ sub: user.id, role: user.role });
        const newRefresh = signRefreshToken({ sub: user.id });
        setAuthCookies(res, newAccess, newRefresh);
        return res.json({ user: getUserPublic(user) });
    }
    catch (e) {
        clearAuthCookies(res);
        return res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Invalid refresh' } });
    }
});
// GET /me - Get current user info
exports.authRouter.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }
        return res.json({ user: getUserPublic(user) });
    }
    catch (err) {
        console.error('Error in /me:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /verify
exports.authRouter.get('/verify', async (req, res) => {
    const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
    if (!token)
        return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No token' } });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
        if (!user)
            return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
        return res.json({ user: getUserPublic(user), valid: true });
    }
    catch (e) {
        return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    }
});
// POST /logout
exports.authRouter.post('/logout', async (_req, res) => {
    clearAuthCookies(res);
    return res.status(204).send();
});
// GET /me (also exported for mounting at /api/me)
exports.authRouter.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user)
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return res.json({ user: getUserPublic(user) });
});
// PUT /profile
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    semester: zod_1.z.string().nullable().optional(),
});
exports.authRouter.put('/profile', requireAuth, async (req, res) => {
    try {
        const body = profileSchema.parse(req.body);
        const updateData = {};
        if (body.name)
            updateData.name = body.name;
        if (body.semester !== undefined)
            updateData.semester = body.semester;
        const user = await prisma.user.update({ where: { id: req.userId }, data: updateData });
        return res.json(getUserPublic(user));
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /forgot-password
const forgotSchema = zod_1.z.object({ email: zod_1.z.string().email() });
exports.authRouter.post('/forgot-password', async (req, res) => {
    try {
        const body = forgotSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email: body.email } });
        // Always respond with 204 to avoid revealing user existence
        if (!user) {
            return res.status(204).send();
        }
        // Generate secure reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        // Save token to database
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt
            }
        });
        // Send email
        try {
            await email_service_1.emailService.sendPasswordResetEmail(user.email, resetToken);
        }
        catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            // Don't reveal email failure to user
        }
        return res.status(204).send();
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /verify-reset-code
const verifyCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().min(6)
});
exports.authRouter.post('/verify-reset-code', async (req, res) => {
    try {
        const body = verifyCodeSchema.parse(req.body);
        // Find the user
        const user = await prisma.user.findUnique({ where: { email: body.email } });
        if (!user) {
            return res.status(400).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }
        // Find valid token for this user
        const tokenRecord = await prisma.passwordResetToken.findFirst({
            where: {
                userId: user.id,
                token: body.code,
                expiresAt: { gt: new Date() }
            }
        });
        if (!tokenRecord) {
            return res.status(400).json({ error: { code: 'INVALID_CODE', message: 'Invalid or expired code' } });
        }
        return res.json({ message: 'Code verified successfully', token: tokenRecord.token });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /reset-password
const resetSchema = zod_1.z.object({ token: zod_1.z.string().min(10), newPassword: zod_1.z.string().min(8) });
exports.authRouter.post('/reset-password', async (req, res) => {
    try {
        const body = resetSchema.parse(req.body);
        // Find valid token
        const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token: body.token },
            include: { user: true }
        });
        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
        }
        // Hash new password
        const passwordHash = await bcryptjs_1.default.hash(body.newPassword, 10);
        // Update user password
        await prisma.user.update({
            where: { id: tokenRecord.userId },
            data: { passwordHash }
        });
        // Delete the used token
        await prisma.passwordResetToken.delete({
            where: { id: tokenRecord.id }
        });
        // Clean up old tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: {
                userId: tokenRecord.userId,
                id: { not: tokenRecord.id },
                expiresAt: { lt: new Date() }
            }
        });
        return res.json({ message: 'Password reset successfully' });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=auth.js.map