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
 * POST /api/admin/reimport-anatomie-pcem2-complete
 * Réimporte TOUS les chapitres Anatomie PCEM2 (22 chapitres, 370 questions)
 */
exports.adminImportRouter.post('/reimport-anatomie-pcem2-complete', auth_1.requireAuth, async (req, res) => {
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
        // Exécuter le script de réimportation complète
        console.log('🚀 Starting complete Anatomie PCEM2 reimport (22 chapters, 370 questions)...');
        const { stdout, stderr } = await execAsync('node dist/fix-anatomie-complete-final.js');
        if (stderr && !stderr.includes('warning')) {
            console.error('Reimport stderr:', stderr);
        }
        console.log('Reimport stdout:', stdout);
        return res.json({
            success: true,
            message: 'Complete Anatomie PCEM2 reimport completed',
            output: stdout
        });
    }
    catch (error) {
        console.error('Error reimporting Anatomie PCEM2:', error);
        return res.status(500).json({
            error: {
                code: 'REIMPORT_ERROR',
                message: 'Failed to reimport Anatomie PCEM2',
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
/**
 * POST /api/admin/create-subject
 * Crée une matière simple (sans chapitres ni questions)
 */
exports.adminImportRouter.post('/create-subject', auth_1.requireAuth, async (req, res) => {
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
        const { title, description, semester, totalQCM } = req.body;
        // Validation
        if (!title || !semester) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_DATA',
                    message: 'Title and semester are required'
                }
            });
        }
        console.log(`🚀 Creating subject "${title}" for ${semester}...`);
        // Créer la matière
        const createdSubject = await prisma.subject.create({
            data: {
                title,
                description: description || '',
                semester,
                totalQCM: totalQCM || 600
            }
        });
        console.log(`✅ Subject created with ID: ${createdSubject.id}`);
        return res.json({
            success: true,
            message: 'Subject created successfully',
            data: {
                subject: createdSubject
            }
        });
    }
    catch (error) {
        console.error('Error creating subject:', error);
        return res.status(500).json({
            error: {
                code: 'CREATE_ERROR',
                message: 'Failed to create subject',
                details: error.message
            }
        });
    }
});
/**
 * POST /api/admin/create-subject-complete
 * Crée une matière complète avec ses chapitres et questions en une seule fois
 * Body format:
 * {
 *   subject: { title, description, semester, totalQCM },
 *   chapters: [
 *     {
 *       title, description, orderIndex, pdfUrl?,
 *       questions: [
 *         { questionText, options: [{text, isCorrect, justification?}], explanation?, orderIndex }
 *       ]
 *     }
 *   ]
 * }
 */
exports.adminImportRouter.post('/create-subject-complete', auth_1.requireAuth, async (req, res) => {
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
        const { subject, chapters } = req.body;
        // Validation basique
        if (!subject || !subject.title || !subject.semester) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_DATA',
                    message: 'Subject title and semester are required'
                }
            });
        }
        if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_DATA',
                    message: 'At least one chapter is required'
                }
            });
        }
        console.log(`🚀 Creating subject "${subject.title}" with ${chapters.length} chapters...`);
        // Créer la matière
        const createdSubject = await prisma.subject.create({
            data: {
                title: subject.title,
                description: subject.description || '',
                semester: subject.semester,
                totalQCM: subject.totalQCM || 600
            }
        });
        console.log(`✅ Subject created with ID: ${createdSubject.id}`);
        let totalQuestionsCreated = 0;
        // Créer les chapitres et leurs questions
        for (const chapter of chapters) {
            if (!chapter.title) {
                console.warn('⚠️ Skipping chapter without title');
                continue;
            }
            const createdChapter = await prisma.chapter.create({
                data: {
                    title: chapter.title,
                    description: chapter.description || '',
                    orderIndex: chapter.orderIndex || 0,
                    pdfUrl: chapter.pdfUrl || null,
                    subjectId: createdSubject.id
                }
            });
            console.log(`  ✅ Chapter "${chapter.title}" created with ID: ${createdChapter.id}`);
            // Créer les questions pour ce chapitre
            if (chapter.questions && Array.isArray(chapter.questions)) {
                for (const question of chapter.questions) {
                    if (!question.questionText || !question.options) {
                        console.warn('    ⚠️ Skipping invalid question');
                        continue;
                    }
                    await prisma.question.create({
                        data: {
                            questionText: question.questionText,
                            options: question.options,
                            explanation: question.explanation || null,
                            orderIndex: question.orderIndex || 0,
                            chapterId: createdChapter.id
                        }
                    });
                    totalQuestionsCreated++;
                }
                console.log(`    ✅ Created ${chapter.questions.length} questions for chapter "${chapter.title}"`);
            }
        }
        console.log(`🎉 Import completed! Subject: 1, Chapters: ${chapters.length}, Questions: ${totalQuestionsCreated}`);
        return res.json({
            success: true,
            message: 'Subject, chapters, and questions created successfully',
            data: {
                subject: createdSubject,
                chaptersCount: chapters.length,
                questionsCount: totalQuestionsCreated
            }
        });
    }
    catch (error) {
        console.error('Error creating complete subject:', error);
        return res.status(500).json({
            error: {
                code: 'CREATE_ERROR',
                message: 'Failed to create subject with chapters and questions',
                details: error.message
            }
        });
    }
});
//# sourceMappingURL=admin-import.js.map