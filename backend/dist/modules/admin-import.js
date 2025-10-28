"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminImportRouter = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const prisma = new client_1.PrismaClient();
exports.adminImportRouter = express_1.default.Router();
/**
 * POST /api/admin/import-quizzes
 * Importe les quiz depuis les fichiers (admin uniquement)
 * ATTENTION: Cette route doit être désactivée en production
 */
exports.adminImportRouter.post('/import-quizzes', auth_1.requireAuth, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        // Exécuter le script d'importation
        console.log('🚀 Starting quiz import...');
        const { stdout, stderr } = await execAsync('node dist/import-quizzes.js');
        if (stderr) {
            console.error('Import stderr:', stderr);
        }
        console.log('Import stdout:', stdout);
        return res.json({
            success: true,
            message: 'Quiz import completed',
            output: stdout
        });
    }
    catch (error) {
        console.error('Error importing quizzes:', error);
        return res.status(500).json({
            error: {
                code: 'IMPORT_ERROR',
                message: 'Failed to import quizzes',
                details: error.message
            }
        });
    }
});
/**
 * POST /api/admin/db-push
 * Applique le schéma Prisma à la base de données (admin uniquement)
 * ATTENTION: Cette route doit être désactivée en production
 */
exports.adminImportRouter.post('/db-push', auth_1.requireAuth, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        // Exécuter prisma db push
        console.log('🔧 Applying Prisma schema...');
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate');
        if (stderr && !stderr.includes('warnings')) {
            console.error('DB push stderr:', stderr);
        }
        console.log('DB push stdout:', stdout);
        return res.json({
            success: true,
            message: 'Database schema updated',
            output: stdout
        });
    }
    catch (error) {
        console.error('Error pushing database schema:', error);
        return res.status(500).json({
            error: {
                code: 'DB_PUSH_ERROR',
                message: 'Failed to push database schema',
                details: error.message
            }
        });
    }
});
/**
 * GET /api/admin/db-status
 * Vérifie le statut de la base de données
 */
exports.adminImportRouter.get('/db-status', auth_1.requireAuth, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        // Compter les sujets, chapitres et questions
        const [subjectsCount, chaptersCount, questionsCount] = await Promise.all([
            prisma.subject.count(),
            prisma.chapter.count(),
            prisma.question.count()
        ]);
        return res.json({
            success: true,
            database: {
                subjects: subjectsCount,
                chapters: chaptersCount,
                questions: questionsCount
            }
        });
    }
    catch (error) {
        console.error('Error checking database status:', error);
        return res.status(500).json({
            error: {
                code: 'DB_STATUS_ERROR',
                message: 'Failed to check database status',
                details: error.message
            }
        });
    }
});
/**
 * POST /api/admin/import-qcm-anatomie
 * Importe les chapitres 1-12 QCM d'Anatomie PCEM2 (admin uniquement)
 */
exports.adminImportRouter.post('/import-qcm-anatomie', auth_1.requireAuth, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        // Exécuter le script d'importation QCM
        console.log('🚀 Starting QCM chapters import (1-12)...');
        const { stdout, stderr } = await execAsync('node dist/fix-anatomie-pcem2-qcm-manual.js');
        if (stderr && !stderr.includes('warning')) {
            console.error('Import stderr:', stderr);
        }
        console.log('Import stdout:', stdout);
        return res.json({
            success: true,
            message: 'QCM chapters import completed',
            output: stdout
        });
    }
    catch (error) {
        console.error('Error importing QCM chapters:', error);
        return res.status(500).json({
            error: {
                code: 'IMPORT_ERROR',
                message: 'Failed to import QCM chapters',
                details: error.message
            }
        });
    }
});
/**
 * POST /api/admin/fix-users-semester
 * Corrige les utilisateurs sans semester PCEM1/PCEM2 (admin uniquement)
 */
exports.adminImportRouter.post('/fix-users-semester', auth_1.requireAuth, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        // Trouver tous les utilisateurs
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                semester: true
            }
        });
        // Compter ceux qui n'ont pas PCEM1 ou PCEM2
        const usersToFix = allUsers.filter(u => u.semester !== 'PCEM1' && u.semester !== 'PCEM2');
        console.log(`[fix-users-semester] Total users: ${allUsers.length}`);
        console.log(`[fix-users-semester] Users to fix: ${usersToFix.length}`);
        usersToFix.forEach(u => {
            console.log(`  - ${u.email}: semester="${u.semester}"`);
        });
        // Mettre à jour tous vers PCEM1 par défaut
        const result = await prisma.user.updateMany({
            where: {
                semester: { not: { in: ['PCEM1', 'PCEM2'] } }
            },
            data: {
                semester: 'PCEM1'
            }
        });
        console.log(`[fix-users-semester] Updated ${result.count} users to PCEM1`);
        return res.json({
            success: true,
            message: `Fixed ${result.count} users`,
            usersFixed: usersToFix.map(u => ({ email: u.email, oldSemester: u.semester }))
        });
    }
    catch (error) {
        console.error('Error fixing users semester:', error);
        return res.status(500).json({
            error: {
                code: 'FIX_USERS_ERROR',
                message: 'Failed to fix users semester',
                details: error.message
            }
        });
    }
});
//# sourceMappingURL=admin-import.js.map