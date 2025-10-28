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
const subscriptions_1 = require("./modules/subscriptions");
const users_1 = require("./modules/users");
const manual_payments_1 = require("./modules/manual-payments");
// FacGame routes
const quiz_1 = require("./modules/quiz");
const subjects_1 = require("./modules/subjects");
const chapters_1 = require("./modules/chapters");
const profile_1 = require("./modules/profile");
const profile_picture_1 = require("./modules/profile-picture");
const leaderboard_1 = require("./modules/leaderboard");
const challenge_1 = require("./modules/challenge");
const exam_1 = require("./modules/exam");
const questions_1 = require("./modules/questions");
const admin_import_1 = require("./modules/admin-import");
dotenv_1.default.config();
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200,https://archify-project.vercel.app')
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
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
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
    console.log('📸 Origin:', req.headers.origin);
    // IMPORTANT: Remove all CSP headers for screenshot files (like we do for videos)
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    // Set CORS headers for screenshots - Allow both localhost and production
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        // Fallback to localhost for development
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    }
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
// Manual fix anatomie endpoint (public for emergency fix)
app.post('/api/admin/fix-anatomie', async (_req, res) => {
    try {
        logger.info('🔧 Manual anatomie fix triggered');
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        const { stdout, stderr } = await execAsync('node dist/fix-anatomie-pcem2.js');
        if (stderr && !stderr.includes('warning')) {
            logger.error({ stderr }, 'Erreur lors de la correction anatomie');
            return res.status(500).json({
                status: 'error',
                message: stderr
            });
        }
        logger.info('✅ Anatomie PCEM2 corrigé manuellement avec succès');
        return res.json({
            status: 'success',
            message: 'Anatomie PCEM2 has been fixed',
            output: stdout
        });
    }
    catch (error) {
        logger.error({ error: error.message }, '❌ Erreur lors du fix manuel');
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});
// Clean empty chapters endpoint (public for emergency cleanup)
app.post('/api/admin/clean-empty-chapters', async (_req, res) => {
    try {
        logger.info('🧹 Manual empty chapters cleanup triggered');
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        const { stdout, stderr } = await execAsync('node dist/clean-empty-chapters.js');
        if (stderr && !stderr.includes('warning')) {
            logger.error({ stderr }, 'Erreur lors du nettoyage des chapitres vides');
            return res.status(500).json({
                status: 'error',
                message: stderr
            });
        }
        logger.info('✅ Chapitres vides nettoyés avec succès');
        return res.json({
            status: 'success',
            message: 'Empty chapters have been cleaned',
            output: stdout
        });
    }
    catch (error) {
        logger.error({ error: error.message }, '❌ Erreur lors du nettoyage manuel');
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});
// Test database status endpoint (public for debugging)
app.get('/api/test/db-status', async (_req, res) => {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const [subjectsCount, chaptersCount, questionsCount, usersCount] = await Promise.all([
            prisma.subject.count(),
            prisma.chapter.count(),
            prisma.question.count(),
            prisma.user.count()
        ]);
        await prisma.$disconnect();
        return res.json({
            status: 'ok',
            database: {
                subjects: subjectsCount,
                chapters: chaptersCount,
                questions: questionsCount,
                users: usersCount
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});
// TEMPORARY: Fix all users semester values (public endpoint for emergency fix)
app.post('/api/test/fix-all-users-semester', async (_req, res) => {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        // Get all users first to see their current semester values
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                semester: true
            }
        });
        console.log('=== USERS BEFORE FIX ===');
        allUsers.forEach(u => {
            console.log(`  ${u.email}: semester="${u.semester}"`);
        });
        // Find users without valid semester
        const usersToFix = allUsers.filter(u => u.semester !== 'PCEM1' && u.semester !== 'PCEM2');
        // Update all invalid users to PCEM1
        const result = await prisma.user.updateMany({
            where: {
                semester: { not: { in: ['PCEM1', 'PCEM2'] } }
            },
            data: {
                semester: 'PCEM1'
            }
        });
        await prisma.$disconnect();
        return res.json({
            status: 'ok',
            message: `Fixed ${result.count} users`,
            totalUsers: allUsers.length,
            usersBefore: allUsers.map(u => ({ email: u.email, semester: u.semester })),
            usersFixed: usersToFix.map(u => ({ email: u.email, oldSemester: u.semester, newSemester: 'PCEM1' })),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});
// Routes with appropriate rate limiting
app.use('/api/auth', authLimiter, auth_1.authRouter);
app.use('/api/subscriptions', generalLimiter, subscriptions_1.subscriptionsRouter);
app.use('/api/users', strictLimiter, users_1.usersRouter);
app.use('/api/manual-payments', generalLimiter, manual_payments_1.manualPaymentsRouter);
// FacGame routes
app.use('/api/quiz', generalLimiter, quiz_1.quizRouter);
app.use('/api/subjects', generalLimiter, subjects_1.subjectsRouter);
app.use('/api/chapters', generalLimiter, chapters_1.chaptersRouter);
app.use('/api/profile', generalLimiter, profile_1.profileRouter);
app.use('/api/profile', generalLimiter, profile_picture_1.profilePictureRouter);
app.use('/api/leaderboard', generalLimiter, leaderboard_1.leaderboardRouter);
app.use('/api/challenge', generalLimiter, challenge_1.challengeRouter);
app.use('/api/exam', generalLimiter, exam_1.examRouter);
app.use('/api/questions', strictLimiter, questions_1.questionsRouter); // Admin only
app.use('/api/admin', strictLimiter, admin_import_1.adminImportRouter); // Admin import/db tools
const port = process.env.PORT || 3000;
// Auto-import quizzes si la base de données est vide
async function autoImportQuizzes() {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        // Vérifier si des questions existent déjà
        const questionsCount = await prisma.question.count();
        if (questionsCount === 0) {
            logger.info('🔄 Base de données vide, importation automatique des quiz...');
            // Exécuter le script d'importation
            const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
            const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
            const execAsync = promisify(exec);
            const { stdout, stderr } = await execAsync('node dist/import-quizzes.js');
            if (stderr && !stderr.includes('warning')) {
                logger.error({ stderr }, 'Erreur lors de l\'importation automatique');
            }
            else {
                logger.info('✅ Importation automatique terminée avec succès');
                logger.info({ output: stdout }, 'Résultat de l\'importation');
            }
        }
        else {
            logger.info({ questionsCount }, '✅ Questions déjà présentes dans la base');
        }
        await prisma.$disconnect();
    }
    catch (error) {
        logger.error({ error: error.message }, '❌ Erreur lors de l\'auto-import');
    }
}
// Auto-fix anatomie PCEM2 si nécessaire
async function autoFixAnatomie() {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        // Vérifier si anatomie PCEM2 a le bon nombre de questions
        const anatomieSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Anatomie', mode: 'insensitive' },
                semester: 'PCEM2'
            },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        if (!anatomieSubject) {
            logger.info('✅ Anatomie PCEM2 not found, skipping fix');
            await prisma.$disconnect();
            return;
        }
        const totalQuestions = anatomieSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
        const emptyChapters = anatomieSubject.chapters.filter(ch => ch._count.questions === 0);
        // Import exec/promisify dès maintenant pour pouvoir les utiliser partout
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        // Toujours nettoyer les chapitres vides, même si le nombre de questions est correct
        if (emptyChapters.length > 0) {
            logger.info({ emptyChapters: emptyChapters.length }, '🧹 Chapitres vides détectés, nettoyage en cours...');
            try {
                const cleanResult = await execAsync('node dist/clean-empty-chapters.js');
                logger.info('✅ Chapitres vides nettoyés automatiquement');
                logger.info({ output: cleanResult.stdout }, 'Résultat du nettoyage');
            }
            catch (cleanError) {
                logger.error({ error: cleanError.message }, '❌ Erreur lors du nettoyage automatique');
            }
        }
        // Vérifier et corriger le totalQCM si nécessaire
        if (totalQuestions === 200 && anatomieSubject.totalQCM !== 200) {
            logger.info({ currentTotalQCM: anatomieSubject.totalQCM, actualQuestions: totalQuestions }, '🔧 Correction du totalQCM...');
            await prisma.subject.update({
                where: { id: anatomieSubject.id },
                data: { totalQCM: 200 }
            });
            logger.info('✅ totalQCM corrigé de ' + anatomieSubject.totalQCM + ' → 200');
        }
        // Vérifier si les titres contiennent des annotations à nettoyer
        const hasAnnotations = anatomieSubject.chapters.some(ch => ch.title.includes('(') || ch.title.includes(')'));
        // Si on a déjà 200 questions ET pas d'annotations, pas besoin de corriger
        if (totalQuestions === 200 && !hasAnnotations) {
            logger.info({ totalQuestions }, '✅ Anatomie PCEM2 already has correct number of questions and clean titles');
            await prisma.$disconnect();
            return;
        }
        // Si on a 200 questions mais des annotations, on doit nettoyer
        if (totalQuestions === 200 && hasAnnotations) {
            logger.info('🔧 Anatomie PCEM2 has correct question count but titles need cleaning...');
        }
        else {
            logger.info({ totalQuestions }, '🔄 Anatomie PCEM2 needs fixing (expected 200), running fix script...');
        }
        const { stdout, stderr } = await execAsync('node dist/fix-anatomie-pcem2.js');
        if (stderr && !stderr.includes('warning')) {
            logger.error({ stderr }, 'Erreur lors de la correction anatomie');
        }
        else {
            logger.info('✅ Anatomie PCEM2 corrigé avec succès');
            logger.info({ output: stdout }, 'Résultat de la correction');
            // Après la correction, nettoyer les chapitres vides
            logger.info('🧹 Nettoyage automatique des chapitres vides...');
            try {
                const cleanResult = await execAsync('node dist/clean-empty-chapters.js');
                logger.info('✅ Chapitres vides nettoyés automatiquement');
                logger.info({ output: cleanResult.stdout }, 'Résultat du nettoyage');
            }
            catch (cleanError) {
                logger.error({ error: cleanError.message }, '❌ Erreur lors du nettoyage automatique');
            }
        }
        await prisma.$disconnect();
    }
    catch (error) {
        logger.error({ error: error.message }, '❌ Erreur lors de l\'auto-fix anatomie');
    }
}
// Auto-fix physiologie PCEM1 si nécessaire
async function autoFixPhysiologie() {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        // Vérifier si physiologie PCEM1 a le bon nombre de questions
        const physioSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Physiologie', mode: 'insensitive' },
                semester: 'PCEM1'
            },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        if (!physioSubject) {
            logger.info('✅ Physiologie PCEM1 not found, skipping fix');
            await prisma.$disconnect();
            return;
        }
        const totalQuestions = physioSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
        // Import exec/promisify
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        // Vérifier et corriger le totalQCM si nécessaire
        if (totalQuestions === 150 && physioSubject.totalQCM !== 150) {
            logger.info({ currentTotalQCM: physioSubject.totalQCM, actualQuestions: totalQuestions }, '🔧 Correction du totalQCM Physiologie...');
            await prisma.subject.update({
                where: { id: physioSubject.id },
                data: { totalQCM: 150 }
            });
            logger.info('✅ totalQCM Physiologie corrigé de ' + physioSubject.totalQCM + ' → 150');
        }
        // Vérifier si les titres contiennent des annotations à nettoyer
        const hasAnnotations = physioSubject.chapters.some(ch => ch.title.includes('(') || ch.title.includes(')'));
        // Si on a déjà 150 questions ET pas d'annotations, pas besoin de corriger
        if (totalQuestions === 150 && !hasAnnotations) {
            logger.info({ totalQuestions }, '✅ Physiologie PCEM1 already has correct number of questions and clean titles');
            await prisma.$disconnect();
            return;
        }
        // Si on a 150 questions mais des annotations, on doit nettoyer
        if (totalQuestions === 150 && hasAnnotations) {
            logger.info('🔧 Physiologie PCEM1 has correct question count but titles need cleaning...');
        }
        else {
            logger.info({ totalQuestions }, '🔄 Physiologie PCEM1 needs fixing (expected 150), running fix script...');
        }
        logger.info({ totalQuestions }, '🔄 Physiologie PCEM1 needs fixing (expected 150), running fix script...');
        const { stdout, stderr } = await execAsync('node dist/fix-physiologie-pcem1.js');
        if (stderr && !stderr.includes('warning')) {
            logger.error({ stderr }, 'Erreur lors de la correction physiologie');
        }
        else {
            logger.info('✅ Physiologie PCEM1 corrigé avec succès');
            logger.info({ output: stdout }, 'Résultat de la correction');
        }
        await prisma.$disconnect();
    }
    catch (error) {
        logger.error({ error: error.message }, '❌ Erreur lors de l\'auto-fix physiologie');
    }
}
// Auto-fix anatomie PCEM1 si nécessaire
async function autoFixAnatomiePCEM1() {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        // Vérifier si anatomie PCEM1 a le bon nombre de questions
        const anatomieSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Anatomie', mode: 'insensitive' },
                semester: 'PCEM1'
            },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        if (!anatomieSubject) {
            logger.info('✅ Anatomie PCEM1 not found, skipping fix');
            await prisma.$disconnect();
            return;
        }
        const totalQuestions = anatomieSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
        // Import exec/promisify
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        // Vérifier et corriger le totalQCM si nécessaire
        if (totalQuestions === 200 && anatomieSubject.totalQCM !== 200) {
            logger.info({ currentTotalQCM: anatomieSubject.totalQCM, actualQuestions: totalQuestions }, '🔧 Correction du totalQCM Anatomie PCEM1...');
            await prisma.subject.update({
                where: { id: anatomieSubject.id },
                data: { totalQCM: 200 }
            });
            logger.info('✅ totalQCM Anatomie PCEM1 corrigé de ' + anatomieSubject.totalQCM + ' → 200');
        }
        // Vérifier si les titres contiennent des annotations à nettoyer
        const hasAnnotations = anatomieSubject.chapters.some(ch => ch.title.includes('(') || ch.title.includes(')'));
        // Si on a déjà 200 questions ET pas d'annotations, pas besoin de corriger
        if (totalQuestions === 200 && !hasAnnotations) {
            logger.info({ totalQuestions }, '✅ Anatomie PCEM1 already has correct number of questions and clean titles');
            await prisma.$disconnect();
            return;
        }
        // Si on a 200 questions mais des annotations, on doit nettoyer
        if (totalQuestions === 200 && hasAnnotations) {
            logger.info('🔧 Anatomie PCEM1 has correct question count but titles need cleaning...');
        }
        else {
            logger.info({ totalQuestions }, '🔄 Anatomie PCEM1 needs fixing (expected 200), running fix script...');
        }
        const { stdout, stderr } = await execAsync('node dist/fix-anatomie-pcem1.js');
        if (stderr && !stderr.includes('warning')) {
            logger.error({ stderr }, 'Erreur lors de la correction anatomie PCEM1');
        }
        else {
            logger.info('✅ Anatomie PCEM1 corrigé avec succès');
            logger.info({ output: stdout }, 'Résultat de la correction');
        }
        await prisma.$disconnect();
    }
    catch (error) {
        logger.error({ error: error.message }, '❌ Erreur lors de l\'auto-fix anatomie PCEM1');
    }
}
// Auto-fix physiologie PCEM2 si nécessaire
async function autoFixPhysioPCEM2() {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        // Vérifier si physiologie PCEM2 a le bon nombre de questions
        const physioSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Physiologie', mode: 'insensitive' },
                semester: 'PCEM2'
            },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        if (!physioSubject) {
            logger.info('✅ Physiologie PCEM2 not found, skipping fix');
            await prisma.$disconnect();
            return;
        }
        const totalQuestions = physioSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
        // Import exec/promisify
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        // Vérifier et corriger le totalQCM si nécessaire
        if (totalQuestions === 40 && physioSubject.totalQCM !== 40) {
            logger.info({ currentTotalQCM: physioSubject.totalQCM, actualQuestions: totalQuestions }, '🔧 Correction du totalQCM Physiologie PCEM2...');
            await prisma.subject.update({
                where: { id: physioSubject.id },
                data: { totalQCM: 40 }
            });
            logger.info('✅ totalQCM Physiologie PCEM2 corrigé de ' + physioSubject.totalQCM + ' → 40');
        }
        // Vérifier si les titres contiennent des annotations à nettoyer
        const hasAnnotations = physioSubject.chapters.some(ch => ch.title.includes('(') || ch.title.includes(')'));
        // Si on a déjà 40 questions ET pas d'annotations, pas besoin de corriger
        if (totalQuestions === 40 && !hasAnnotations) {
            logger.info({ totalQuestions }, '✅ Physiologie PCEM2 already has correct number of questions and clean titles');
            await prisma.$disconnect();
            return;
        }
        // Si on a 40 questions mais des annotations, on doit nettoyer
        if (totalQuestions === 40 && hasAnnotations) {
            logger.info('🔧 Physiologie PCEM2 has correct question count but titles need cleaning...');
        }
        else {
            logger.info({ totalQuestions }, '🔄 Physiologie PCEM2 needs fixing (expected 40), running fix script...');
        }
        const { stdout, stderr } = await execAsync('node dist/fix-physiologie-pcem2.js');
        if (stderr && !stderr.includes('warning')) {
            logger.error({ stderr }, 'Erreur lors de la correction physiologie PCEM2');
        }
        else {
            logger.info('✅ Physiologie PCEM2 corrigé avec succès');
            logger.info({ output: stdout }, 'Résultat de la correction');
        }
        await prisma.$disconnect();
    }
    catch (error) {
        logger.error({ error: error.message }, '❌ Erreur lors de l\'auto-fix physiologie PCEM2');
    }
}
app.listen(port, async () => {
    logger.info({ port }, 'Backend listening');
    // Lancer l'auto-import en arrière-plan (ne bloque pas le démarrage)
    autoImportQuizzes().catch(err => {
        logger.error({ error: err.message }, 'Auto-import failed');
    });
    // Lancer l'auto-fix anatomie en arrière-plan
    autoFixAnatomie().catch(err => {
        logger.error({ error: err.message }, 'Auto-fix anatomie failed');
    });
    // Lancer l'auto-fix physiologie en arrière-plan
    autoFixPhysiologie().catch(err => {
        logger.error({ error: err.message }, 'Auto-fix physiologie failed');
    });
    // Lancer l'auto-fix anatomie PCEM1 en arrière-plan
    autoFixAnatomiePCEM1().catch(err => {
        logger.error({ error: err.message }, 'Auto-fix anatomie PCEM1 failed');
    });
    // Lancer l'auto-fix physiologie PCEM2 en arrière-plan
    autoFixPhysioPCEM2().catch(err => {
        logger.error({ error: err.message }, 'Auto-fix physiologie PCEM2 failed');
    });
});
//# sourceMappingURL=index.js.map