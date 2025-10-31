"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionsRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.questionsRouter = express_1.default.Router();
// ============================================
// SCHÉMAS DE VALIDATION
// ============================================
// Format JSON pour les options: {text: string, isCorrect: boolean, justification?: string}
const optionSchema = zod_1.z.object({
    text: zod_1.z.string(),
    isCorrect: zod_1.z.boolean(),
    justification: zod_1.z.string().optional()
});
const createQuestionSchema = zod_1.z.object({
    chapterId: zod_1.z.string(),
    questionText: zod_1.z.string().min(10, 'La question doit contenir au moins 10 caractères'),
    options: zod_1.z.array(optionSchema).min(2).max(5, 'La question doit avoir entre 2 et 5 options'),
    explanation: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
const updateQuestionSchema = zod_1.z.object({
    questionText: zod_1.z.string().min(10).optional(),
    options: zod_1.z.array(optionSchema).min(2).max(5).optional(),
    explanation: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
// ============================================
// LISTER TOUTES LES QUESTIONS D'UN CHAPITRE
// ============================================
/**
 * GET /api/questions/chapter/:chapterId
 * Liste toutes les questions d'un chapitre (admin uniquement)
 */
exports.questionsRouter.get('/chapter/:chapterId', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { chapterId } = req.params;
        // Vérifier que le chapitre existe
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                subject: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        if (!chapter) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Chapitre non trouvé' }
            });
        }
        // Récupérer toutes les questions
        const questions = await prisma.question.findMany({
            where: { chapterId },
            orderBy: { orderIndex: 'asc' },
            select: {
                id: true,
                questionText: true,
                options: true,
                explanation: true,
                orderIndex: true,
                createdAt: true
            }
        });
        res.json({
            success: true,
            chapter: {
                id: chapter.id,
                title: chapter.title,
                subjectId: chapter.subject.id,
                subjectName: chapter.subject.title
            },
            questions,
            count: questions.length
        });
    }
    catch (err) {
        console.error('Error fetching questions:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération des questions' }
        });
    }
});
// ============================================
// OBTENIR UNE QUESTION SPÉCIFIQUE
// ============================================
/**
 * GET /api/questions/:id
 * Récupère les détails d'une question (admin uniquement)
 */
exports.questionsRouter.get('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const question = await prisma.question.findUnique({
            where: { id },
            include: {
                chapter: {
                    include: {
                        subject: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            }
        });
        if (!question) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Question non trouvée' }
            });
        }
        res.json({
            success: true,
            question: {
                id: question.id,
                questionText: question.questionText,
                options: question.options,
                explanation: question.explanation,
                orderIndex: question.orderIndex,
                chapterId: question.chapterId,
                chapterTitle: question.chapter.title,
                subjectId: question.chapter.subject.id,
                subjectName: question.chapter.subject.title,
                createdAt: question.createdAt
            }
        });
    }
    catch (err) {
        console.error('Error fetching question:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération de la question' }
        });
    }
});
// ============================================
// CRÉER UNE QUESTION
// ============================================
/**
 * POST /api/questions
 * Crée une nouvelle question (admin uniquement)
 */
exports.questionsRouter.post('/', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        // Valider les données
        const validation = createQuestionSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: validation.error.issues
                }
            });
        }
        const data = validation.data;
        // Vérifier que le chapitre existe
        const chapter = await prisma.chapter.findUnique({
            where: { id: data.chapterId }
        });
        if (!chapter) {
            return res.status(404).json({
                error: { code: 'CHAPTER_NOT_FOUND', message: 'Chapitre non trouvé' }
            });
        }
        // Si orderIndex n'est pas fourni, utiliser le prochain index disponible
        let orderIndex = data.orderIndex;
        if (orderIndex === undefined) {
            const lastQuestion = await prisma.question.findFirst({
                where: { chapterId: data.chapterId },
                orderBy: { orderIndex: 'desc' }
            });
            orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;
        }
        // Créer la question
        const question = await prisma.question.create({
            data: {
                chapterId: data.chapterId,
                questionText: data.questionText,
                options: data.options,
                explanation: data.explanation,
                orderIndex
            }
        });
        res.status(201).json({
            success: true,
            message: 'Question créée avec succès',
            question: {
                id: question.id,
                questionText: question.questionText,
                options: question.options,
                explanation: question.explanation,
                orderIndex: question.orderIndex,
                chapterId: question.chapterId
            }
        });
    }
    catch (err) {
        console.error('Error creating question:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la création de la question' }
        });
    }
});
// ============================================
// METTRE À JOUR UNE QUESTION
// ============================================
/**
 * PUT /api/questions/:id
 * Met à jour une question existante (admin uniquement)
 */
exports.questionsRouter.put('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Valider les données
        const validation = updateQuestionSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: validation.error.issues
                }
            });
        }
        const data = validation.data;
        // Vérifier que la question existe
        const existingQuestion = await prisma.question.findUnique({
            where: { id }
        });
        if (!existingQuestion) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Question non trouvée' }
            });
        }
        // Mettre à jour la question
        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: {
                questionText: data.questionText,
                options: data.options,
                explanation: data.explanation,
                orderIndex: data.orderIndex
            }
        });
        res.json({
            success: true,
            message: 'Question mise à jour avec succès',
            question: {
                id: updatedQuestion.id,
                questionText: updatedQuestion.questionText,
                options: updatedQuestion.options,
                explanation: updatedQuestion.explanation,
                orderIndex: updatedQuestion.orderIndex,
                chapterId: updatedQuestion.chapterId
            }
        });
    }
    catch (err) {
        console.error('Error updating question:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la mise à jour de la question' }
        });
    }
});
// ============================================
// SUPPRIMER UNE QUESTION
// ============================================
/**
 * DELETE /api/questions/:id
 * Supprime une question (admin uniquement)
 */
exports.questionsRouter.delete('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier que la question existe
        const question = await prisma.question.findUnique({
            where: { id }
        });
        if (!question) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Question non trouvée' }
            });
        }
        // Supprimer la question (cascade supprime les QuizAttempt associés)
        await prisma.question.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Question supprimée avec succès'
        });
    }
    catch (err) {
        console.error('Error deleting question:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la suppression de la question' }
        });
    }
});
// ============================================
// RÉORGANISER L'ORDRE DES QUESTIONS
// ============================================
const reorderQuestionsSchema = zod_1.z.object({
    questionIds: zod_1.z.array(zod_1.z.string()).min(1, 'Au moins une question doit être fournie')
});
/**
 * POST /api/questions/chapter/:chapterId/reorder
 * Réorganise l'ordre des questions dans un chapitre (admin uniquement)
 */
exports.questionsRouter.post('/chapter/:chapterId/reorder', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { chapterId } = req.params;
        // Valider les données
        const validation = reorderQuestionsSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: validation.error.issues
                }
            });
        }
        const { questionIds } = validation.data;
        // Vérifier que le chapitre existe
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId }
        });
        if (!chapter) {
            return res.status(404).json({
                error: { code: 'CHAPTER_NOT_FOUND', message: 'Chapitre non trouvé' }
            });
        }
        // Vérifier que toutes les questions appartiennent au chapitre
        const questions = await prisma.question.findMany({
            where: {
                id: { in: questionIds },
                chapterId
            }
        });
        if (questions.length !== questionIds.length) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_QUESTIONS',
                    message: 'Certaines questions ne font pas partie de ce chapitre'
                }
            });
        }
        // Mettre à jour l'ordre
        const updates = questionIds.map((questionId, index) => prisma.question.update({
            where: { id: questionId },
            data: { orderIndex: index }
        }));
        await prisma.$transaction(updates);
        res.json({
            success: true,
            message: 'Ordre des questions mis à jour avec succès'
        });
    }
    catch (err) {
        console.error('Error reordering questions:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la réorganisation des questions' }
        });
    }
});
// ============================================
// STATISTIQUES DES QUESTIONS
// ============================================
/**
 * GET /api/questions/:id/stats
 * Récupère les statistiques d'une question (admin uniquement)
 */
exports.questionsRouter.get('/:id/stats', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier que la question existe
        const question = await prisma.question.findUnique({
            where: { id }
        });
        if (!question) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Question non trouvée' }
            });
        }
        // Récupérer toutes les tentatives
        const attempts = await prisma.quizAttempt.findMany({
            where: { questionId: id }
        });
        const totalAttempts = attempts.length;
        const correctAttempts = attempts.filter(a => a.isCorrect).length;
        const successRate = totalAttempts > 0
            ? Math.round((correctAttempts / totalAttempts) * 100)
            : 0;
        // Compter les tentatives par réponse choisie
        const answerDistribution = [0, 1, 2, 3].map(index => {
            const count = attempts.filter(a => a.selectedAnswer === index).length;
            return {
                answer: index,
                count,
                percentage: totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0
            };
        });
        // Nombre d'utilisateurs uniques
        const uniqueUsers = new Set(attempts.map(a => a.userId)).size;
        res.json({
            success: true,
            stats: {
                questionId: id,
                totalAttempts,
                correctAttempts,
                incorrectAttempts: totalAttempts - correctAttempts,
                successRate,
                uniqueUsers,
                answerDistribution
            }
        });
    }
    catch (err) {
        console.error('Error fetching question stats:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération des statistiques' }
        });
    }
});
//# sourceMappingURL=questions.js.map