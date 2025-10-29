"use strict";
/**
 * Subjects Routes - FacGame
 *
 * Routes pour la gestion des matières (Anatomie, Histologie, Physiologie) :
 * - Liste des matières avec progression
 * - Détails d'une matière
 * - CRUD admin
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const progress_service_1 = require("../services/progress.service");
const prisma = new client_1.PrismaClient();
exports.subjectsRouter = (0, express_1.Router)();
// Helper function to check if exam is unlocked (update4: 50% completion)
async function isExamUnlocked(userId, subjectId) {
    // Count total questions in subject
    const totalQuestions = await prisma.question.count({
        where: {
            chapter: {
                subjectId
            }
        }
    });
    if (totalQuestions === 0)
        return false;
    // Count completed questions (answered correctly at least once)
    const completedQuestions = await prisma.quizAttempt.findMany({
        where: {
            userId,
            question: {
                chapter: {
                    subjectId
                }
            },
            isCorrect: true
        },
        select: {
            questionId: true
        },
        distinct: ['questionId']
    });
    const progressPercent = Math.round((completedQuestions.length / totalQuestions) * 100);
    return progressPercent >= 50;
}
// ============================================
// VALIDATION SCHEMAS
// ============================================
const createSubjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    semester: zod_1.z.string(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    totalQCM: zod_1.z.number().int().positive().default(600)
});
const updateSubjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().optional(),
    semester: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    totalQCM: zod_1.z.number().int().positive().optional()
});
// ============================================
// STUDENT ROUTES
// ============================================
/**
 * GET /api/subjects
 * Liste toutes les matières avec la progression de l'utilisateur
 */
exports.subjectsRouter.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        // Récupérer le niveau de l'utilisateur (PCEM1 ou PCEM2)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { semester: true, email: true }
        });
        if (!user) {
            return res.status(404).json({
                error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
            });
        }
        console.log(`[subjects/] User ${user.email} with semester: "${user.semester}"`);
        // Récupérer uniquement les matières du niveau de l'utilisateur
        const subjects = await prisma.subject.findMany({
            where: {
                semester: user.semester // Filtre par PCEM1 ou PCEM2
            },
            orderBy: { title: 'asc' },
            include: {
                chapters: {
                    select: {
                        id: true
                    }
                }
            }
        });
        console.log(`[subjects/] Found ${subjects.length} subjects for semester "${user.semester}"`);
        if (subjects.length > 0) {
            console.log(`[subjects/] Subjects: ${subjects.map(s => `${s.title} (${s.semester})`).join(', ')}`);
        }
        // Récupérer la progression de l'utilisateur
        const progressData = await (0, progress_service_1.getUserSubjectsProgress)(userId);
        // Mapper les données avec calcul dynamique de examUnlocked
        const subjectsWithProgress = await Promise.all(subjects.map(async (subject) => {
            const progress = progressData.find(p => p.subjectId === subject.id);
            const examUnlocked = await isExamUnlocked(userId, subject.id);
            return {
                id: subject.id,
                title: subject.title,
                description: subject.description,
                semester: subject.semester,
                tags: subject.tags,
                totalQuestions: subject.totalQCM,
                totalChapters: subject.chapters.length,
                progressPercent: progress ? progress.progressPercent : 0,
                examUnlocked,
                chapters: subject.chapters
            };
        }));
        return res.json({ subjects: subjectsWithProgress });
    }
    catch (error) {
        console.error('[subjects/] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * GET /api/subjects/:id
 * Détails d'une matière avec chapitres et progression
 */
exports.subjectsRouter.get('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const subject = await prisma.subject.findUnique({
            where: { id },
            include: {
                chapters: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        questions: {
                            select: {
                                id: true,
                                difficulty: true
                            }
                        },
                        chapterProgresses: {
                            where: { userId },
                            select: {
                                questionsAnswered: true,
                                questionsCorrect: true,
                                progressPercent: true,
                                challengeUnlocked: true,
                                examUnlocked: true
                            }
                        }
                    }
                }
            }
        });
        if (!subject) {
            return res.status(404).json({
                error: { code: 'SUBJECT_NOT_FOUND', message: 'Subject not found' }
            });
        }
        // Récupérer la progression globale
        const subjectProgress = await (0, progress_service_1.getSubjectProgress)(userId, id);
        // Mapper les chapitres avec leur progression
        const chaptersWithProgress = subject.chapters.map(chapter => {
            const progress = chapter.chapterProgresses[0];
            return {
                id: chapter.id,
                title: chapter.title,
                position: chapter.orderIndex,
                questionsCount: chapter.questions.length,
                progressPercent: progress ? progress.progressPercent : 0,
                challengeUnlocked: progress ? progress.challengeUnlocked : false
            };
        });
        // Calculer dynamiquement si l'examen est débloqué (update4)
        const examUnlocked = await isExamUnlocked(userId, subject.id);
        return res.json({
            success: true,
            subject: {
                id: subject.id,
                title: subject.title,
                description: subject.description,
                semester: subject.semester,
                tags: subject.tags,
                totalQuestions: subject.totalQCM,
                totalChapters: subject.chapters.length,
                progressPercent: subjectProgress ? subjectProgress.progressPercent : 0,
                examUnlocked,
                chapters: chaptersWithProgress
            }
        });
    }
    catch (error) {
        console.error('[subjects/:id] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
// ============================================
// ADMIN ROUTES
// ============================================
/**
 * POST /api/subjects
 * Créer une nouvelle matière (admin uniquement)
 */
exports.subjectsRouter.post('/', auth_1.requireAuth, async (req, res) => {
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
        const data = createSubjectSchema.parse(req.body);
        const subject = await prisma.subject.create({
            data: {
                title: data.title,
                description: data.description,
                semester: data.semester,
                tags: data.tags || [],
                totalQCM: data.totalQCM
            }
        });
        return res.status(201).json({ subject });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
            });
        }
        console.error('[subjects/create] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * PUT /api/subjects/:id
 * Mettre à jour une matière (admin uniquement)
 */
exports.subjectsRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        const data = updateSubjectSchema.parse(req.body);
        const subject = await prisma.subject.update({
            where: { id },
            data
        });
        return res.json({ subject });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
            });
        }
        console.error('[subjects/update] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * DELETE /api/subjects/:id
 * Supprimer une matière (admin uniquement)
 */
exports.subjectsRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        await prisma.subject.delete({
            where: { id }
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('[subjects/delete] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
//# sourceMappingURL=subjects.js.map