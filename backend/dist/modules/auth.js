"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.requireAuth = requireAuth;
exports.requireActiveSubscription = requireActiveSubscription;
exports.requireQuizAccess = requireQuizAccess;
exports.requireAdmin = requireAdmin;
exports.requireSuperAdmin = requireSuperAdmin;
exports.requireLevelAdmin = requireLevelAdmin;
exports.getSemesterFilter = getSemesterFilter;
exports.canAccessSemester = canAccessSemester;
exports.optionalAuth = optionalAuth;
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
const ACCESS_TOKEN_TTL_SEC = parseInt(process.env.ACCESS_TOKEN_TTL_SEC || '604800'); // 7 days
const REFRESH_TOKEN_TTL_SEC = parseInt(process.env.REFRESH_TOKEN_TTL_SEC || '2592000'); // 30 days
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
    // Extract active subscription data if available
    let subscriptionData = null;
    if (user.subscriptions && user.subscriptions.length > 0) {
        const activeSub = user.subscriptions[0]; // First active subscription
        subscriptionData = {
            type: activeSub.plan?.type || activeSub.type,
            isActive: activeSub.status === 'ACTIVE',
            expiresAt: activeSub.expiresAt,
        };
    }
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        semester: user.semester,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        subscription: subscriptionData,
        profile: {
            avatar: user.avatarUrl ?? undefined,
            department: undefined,
            year: user.semester ?? undefined,
        },
        firstName: user.name?.split(' ')[0] || user.name,
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
    };
}
// Auth middleware - vérifie uniquement le JWT token (pas de session unique)
// Les 2 appareils autorisés peuvent se connecter simultanément
function requireAuth(req, res, next) {
    const cookieToken = req.cookies?.access_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.split(' ')[1];
    const token = cookieToken || headerToken || '';
    console.log('[requireAuth]', req.url, {
        hasCookieToken: !!cookieToken,
        hasAuthHeader: !!authHeader,
        hasHeaderToken: !!headerToken,
        tokenSource: cookieToken ? 'cookie' : headerToken ? 'header' : 'none',
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    if (!token) {
        console.log('[requireAuth] No token found, returning 401');
        return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No token' } });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.sub;
        req.userRole = decoded.role;
        console.log('[requireAuth] Token verified:', { userId: decoded.sub, role: decoded.role });
        return next();
    }
    catch (_e) {
        console.log('[requireAuth] Token verification failed:', _e.message);
        return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    }
}
// Subscription check middleware - must be used after requireAuth
async function requireActiveSubscription(req, res, next) {
    try {
        const { checkUserSubscription } = await Promise.resolve().then(() => __importStar(require('../services/subscription.service')));
        const subscriptionResult = await checkUserSubscription(req.userId);
        if (!subscriptionResult.hasActiveSubscription) {
            console.log('[requireActiveSubscription] No active subscription for user:', req.userId);
            return res.status(403).json({
                error: {
                    code: 'NO_SUBSCRIPTION',
                    message: subscriptionResult.message || 'Abonnement requis pour accéder à ce contenu'
                }
            });
        }
        // Stocker les infos d'abonnement dans la requête pour utilisation ultérieure
        req.subscription = subscriptionResult;
        console.log('[requireActiveSubscription] Active subscription found:', {
            userId: req.userId,
            type: subscriptionResult.subscriptionType,
            expiresAt: subscriptionResult.expiresAt
        });
        return next();
    }
    catch (error) {
        console.error('[requireActiveSubscription] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la vérification de l\'abonnement' }
        });
    }
}
// Quiz access check middleware - must be used after requireAuth
async function requireQuizAccess(req, res, next) {
    try {
        const { checkUserSubscription } = await Promise.resolve().then(() => __importStar(require('../services/subscription.service')));
        const subscriptionResult = await checkUserSubscription(req.userId);
        // Si l'utilisateur a un abonnement actif, autoriser l'accès
        if (subscriptionResult.canAccessQuiz) {
            req.subscription = subscriptionResult;
            req.hasFreeAccess = false;
            console.log('[requireQuizAccess] Quiz access granted (subscription) for user:', req.userId);
            return next();
        }
        // Si pas d'abonnement, vérifier les QCM gratuits
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { freeQcmUsed: true, semester: true }
        });
        if (!user) {
            return res.status(404).json({
                error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
            });
        }
        // Déterminer la limite de QCM gratuits selon le niveau
        const freeQcmLimit = user.semester === 'DCEM1' ? 30 : 10; // DCEM1: 30, PCEM1/PCEM2: 10
        // Si l'utilisateur a déjà utilisé ses QCM gratuits, rediriger vers l'abonnement
        if (user.freeQcmUsed >= freeQcmLimit) {
            console.log('[requireQuizAccess] Free QCM limit reached for user:', req.userId);
            return res.status(403).json({
                error: {
                    code: 'FREE_LIMIT_REACHED',
                    message: `Vous avez utilisé vos ${freeQcmLimit} QCM gratuits. Veuillez souscrire à un abonnement pour continuer.`,
                    freeQcmUsed: user.freeQcmUsed,
                    freeQcmLimit: freeQcmLimit,
                    needsSubscription: true
                }
            });
        }
        // Autoriser l'accès avec un QCM gratuit
        req.subscription = subscriptionResult;
        req.hasFreeAccess = true;
        req.freeQcmUsed = user.freeQcmUsed;
        req.freeQcmLimit = freeQcmLimit;
        console.log(`[requireQuizAccess] Free QCM access granted for user: ${req.userId} (${user.freeQcmUsed}/${freeQcmLimit} used)`);
        return next();
    }
    catch (error) {
        console.error('[requireQuizAccess] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la vérification de l\'accès quiz' }
        });
    }
}
// Admin check middleware - must be used after requireAuth
function requireAdmin(req, res, next) {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        console.log('[requireAdmin] Access denied for role:', req.userRole);
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Admin access required' }
        });
    }
    console.log('[requireAdmin] Admin access granted:', req.userRole);
    return next();
}
// SUPERADMIN only middleware - must be used after requireAuth
function requireSuperAdmin(req, res, next) {
    if (req.userRole !== 'SUPERADMIN') {
        console.log('[requireSuperAdmin] Access denied for role:', req.userRole);
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Superadmin access required' }
        });
    }
    console.log('[requireSuperAdmin] Superadmin access granted');
    return next();
}
// Level Admin middleware - checks admin role and loads assigned semesters
// Must be used after requireAuth
async function requireLevelAdmin(req, res, next) {
    // First check basic admin access
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        console.log('[requireLevelAdmin] Access denied for role:', req.userRole);
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Admin access required' }
        });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                role: true,
                assignedSemesters: true
            }
        });
        if (!user) {
            return res.status(403).json({
                error: { code: 'USER_NOT_FOUND', message: 'User not found' }
            });
        }
        // SUPERADMIN has full access (no semester restrictions)
        req.isSuperAdmin = user.role === 'SUPERADMIN';
        req.assignedSemesters = user.assignedSemesters || [];
        // If regular ADMIN with no assigned semesters, deny access
        if (!req.isSuperAdmin && req.assignedSemesters.length === 0) {
            console.log('[requireLevelAdmin] No semesters assigned to admin:', req.userId);
            return res.status(403).json({
                error: { code: 'NO_SEMESTERS_ASSIGNED', message: 'Aucun niveau assigné à cet admin' }
            });
        }
        console.log('[requireLevelAdmin] Access granted:', {
            userId: req.userId,
            isSuperAdmin: req.isSuperAdmin,
            assignedSemesters: req.assignedSemesters
        });
        return next();
    }
    catch (error) {
        console.error('[requireLevelAdmin] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
}
// Helper function to get semester filter for queries
// Returns empty object for SUPERADMIN (no filter), or semester filter for Level Admin
function getSemesterFilter(req) {
    if (req.isSuperAdmin) {
        return {}; // No filter for superadmin - full access
    }
    return {
        semester: { in: req.assignedSemesters }
    };
}
// Helper to check if a specific semester is accessible by the admin
function canAccessSemester(req, semester) {
    if (req.isSuperAdmin)
        return true;
    return req.assignedSemesters.includes(semester);
}
// Optional auth middleware - does not block if no token
function optionalAuth(req, res, next) {
    const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
    if (!token) {
        req.userId = null;
        req.userRole = null;
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.sub;
        req.userRole = decoded.role;
        return next();
    }
    catch (_e) {
        req.userId = null;
        req.userRole = null;
        return next();
    }
}
// Schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(1),
    semester: zod_1.z.enum(['PCEM1', 'PCEM2', 'PCEP2', 'DCEM1']),
    deviceId: zod_1.z.string().min(1), // ID de l'appareil pour lier le compte
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    deviceId: zod_1.z.string().min(1), // ID de l'appareil pour vérifier l'autorisation
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
        let user = await prisma.user.create({
            data: {
                email: body.email,
                passwordHash,
                name: body.name,
                semester: body.semester,
                authorizedDevices: [body.deviceId], // Premier appareil autorisé
            },
        });
        // Fetch user with subscription data
        user = await prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true }
                }
            }
        });
        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        const refreshToken = signRefreshToken({ sub: user.id });
        setAuthCookies(res, accessToken, refreshToken);
        console.log('[Auth] Registration successful:', {
            userId: user.id,
            email: user.email,
            deviceId: body.deviceId,
            authorizedDevices: [body.deviceId]
        });
        // Envoyer une notification à l'admin pour le nouvel utilisateur
        email_service_1.emailService.sendAdminNotificationNewUser(user.name, user.email, user.semester).catch(err => {
            console.error('Failed to send admin notification:', err);
            // Don't fail the registration if email fails
        });
        return res.status(201).json({
            user: getUserPublic(user),
            accessToken,
            refreshToken
        });
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
        const user = await prisma.user.findUnique({
            where: { email: body.email },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true }
                }
            }
        });
        if (!user)
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
        const ok = await bcryptjs_1.default.compare(body.password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
        // Vérifier si l'appareil est dans la liste des appareils autorisés
        const authorizedDevices = user.authorizedDevices || [];
        const isAuthorizedDevice = authorizedDevices.includes(body.deviceId);
        console.log('[Auth] Device authorization check:', {
            userId: user.id,
            email: user.email,
            currentDeviceId: body.deviceId,
            authorizedDevices: authorizedDevices,
            authorizedDevicesCount: authorizedDevices.length,
            isAuthorizedDevice: isAuthorizedDevice,
            deviceIdType: typeof body.deviceId
        });
        if (!isAuthorizedDevice) {
            // L'appareil n'est pas autorisé
            // Limite de 4 machines pour les admins, 2 pour les étudiants
            const maxDevices = user.role === 'ADMIN' ? 4 : 2;
            if (authorizedDevices.length >= maxDevices) {
                // Maximum d'appareils déjà enregistrés
                console.log('[Auth] ❌ Login denied - Max devices reached:', {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    maxDevices,
                    authorizedDevices,
                    attemptedDevice: body.deviceId
                });
                return res.status(403).json({
                    error: {
                        code: 'MAX_DEVICES_REACHED',
                        message: user.role === 'ADMIN'
                            ? 'Nombre maximum d\'appareils atteint (4 max pour admin). Contactez le support pour changer d\'appareil.'
                            : 'Nombre maximum d\'appareils atteint (2 max: PC et téléphone). Contactez le support pour changer d\'appareil.'
                    }
                });
            }
            // Ajouter ce nouvel appareil (2e appareil)
            console.log('[Auth] ➕ Adding new device to authorized list...');
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    authorizedDevices: {
                        push: body.deviceId
                    }
                }
            });
            console.log('[Auth] ✅ New device authorized:', {
                userId: user.id,
                deviceId: body.deviceId,
                totalDevices: authorizedDevices.length + 1
            });
        }
        else {
            console.log('[Auth] ✅ Device already authorized - allowing login');
        }
        // Generate new tokens
        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        const refreshToken = signRefreshToken({ sub: user.id });
        setAuthCookies(res, accessToken, refreshToken);
        console.log('[Auth] Login successful - concurrent sessions allowed:', {
            userId: user.id,
            email: user.email,
            role: user.role,
            deviceId: body.deviceId,
            authorizedDevices: isAuthorizedDevice ? authorizedDevices : [...authorizedDevices, body.deviceId]
        });
        return res.json({
            user: getUserPublic(user),
            accessToken,
            refreshToken
        });
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
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true }
                }
            }
        });
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
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true }
                }
            }
        });
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
// GET /debug/devices - Endpoint de diagnostic pour voir les appareils autorisés
exports.authRouter.get('/debug/devices', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                authorizedDevices: true,
                activeDeviceId: true,
                activeToken: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
            userId: user.id,
            email: user.email,
            authorizedDevices: user.authorizedDevices || [],
            authorizedDevicesCount: (user.authorizedDevices || []).length,
            activeDeviceId: user.activeDeviceId,
            hasActiveToken: !!user.activeToken
        });
    }
    catch (err) {
        console.error('[Auth] Debug devices error:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
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
/**
 * GET /api/auth/free-qcm-status
 * Obtenir le statut des QCM gratuits pour l'utilisateur connecté
 */
exports.authRouter.get('/free-qcm-status', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        // Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                freeQcmUsed: true,
                semester: true,
                subscriptions: {
                    where: {
                        status: 'ACTIVE'
                    },
                    select: {
                        id: true,
                        status: true,
                        plan: {
                            select: {
                                name: true,
                                type: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
            });
        }
        const hasActiveSubscription = user.subscriptions.length > 0;
        const freeQcmUsed = user.freeQcmUsed || 0;
        // Déterminer la limite selon le niveau
        const freeQcmLimit = user.semester === 'DCEM1' ? 30 : 10; // DCEM1: 30, PCEM1/PCEM2: 10
        const freeQcmRemaining = Math.max(0, freeQcmLimit - freeQcmUsed);
        return res.json({
            hasActiveSubscription,
            freeQcm: {
                used: freeQcmUsed,
                remaining: freeQcmRemaining,
                total: freeQcmLimit,
                limitReached: freeQcmUsed >= freeQcmLimit
            },
            canAccessQuiz: hasActiveSubscription || freeQcmUsed < freeQcmLimit,
            activeSubscription: hasActiveSubscription ? user.subscriptions[0] : null
        });
    }
    catch (error) {
        console.error('[free-qcm-status] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération du statut' }
        });
    }
});
//# sourceMappingURL=auth.js.map