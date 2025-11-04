"use strict";
/**
 * Chapters Routes - FacGame
 *
 * Routes pour la gestion des chapitres :
 * - Détails d'un chapitre
 * - CRUD admin
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaptersRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const progress_service_1 = require("../services/progress.service");
const prisma = new client_1.PrismaClient();
exports.chaptersRouter = (0, express_1.Router)();
// ============================================
// VALIDATION SCHEMAS
// ============================================
const createChapterSchema = zod_1.z.object({
    subjectId: zod_1.z.string(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    pdfUrl: zod_1.z.string().url().optional(),
    orderIndex: zod_1.z.number().int().nonnegative().optional()
});
const updateChapterSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().optional(),
    pdfUrl: zod_1.z.string().url().optional().nullable(),
    orderIndex: zod_1.z.number().int().nonnegative().optional()
});
// ============================================
// STUDENT ROUTES
// ============================================
/**
 * GET /api/chapters/:id
 * Détails d'un chapitre avec questions et progression
 */
exports.chaptersRouter.get('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const chapter = await prisma.chapter.findUnique({
            where: { id },
            include: {
                subject: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                questions: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        orderIndex: true
                    }
                }
            }
        });
        if (!chapter) {
            return res.status(404).json({
                error: { code: 'CHAPTER_NOT_FOUND', message: 'Chapter not found' }
            });
        }
        // Récupérer la progression
        const progress = await (0, progress_service_1.getChapterProgress)(userId, id);
        return res.json({
            chapter: {
                id: chapter.id,
                title: chapter.title,
                description: chapter.description,
                pdfUrl: chapter.pdfUrl,
                orderIndex: chapter.orderIndex,
                subject: chapter.subject,
                questionsCount: chapter.questions.length,
                progress
            }
        });
    }
    catch (error) {
        console.error('[chapters/:id] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
// ============================================
// ADMIN ROUTES
// ============================================
/**
 * GET /api/chapters/subject/:subjectId
 * Liste tous les chapitres d'une matière (admin uniquement)
 * Pour le dashboard admin de gestion des QCM
 */
exports.chaptersRouter.get('/subject/:subjectId', auth_1.requireAuth, async (req, res) => {
    try {
        const { subjectId } = req.params;
        // Vérifier que l'utilisateur est admin
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Admin access required' }
            });
        }
        // Récupérer tous les chapitres de cette matière
        const chapters = await prisma.chapter.findMany({
            where: { subjectId },
            orderBy: { orderIndex: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                orderIndex: true,
                pdfUrl: true
            }
        });
        console.log(`[chapters/subject] Found ${chapters.length} chapters for subject ${subjectId}`);
        return res.json({ chapters });
    }
    catch (error) {
        console.error('[chapters/subject] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * POST /api/chapters
 * Créer un nouveau chapitre (admin uniquement)
 */
exports.chaptersRouter.post('/', auth_1.requireAuth, async (req, res) => {
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
        const data = createChapterSchema.parse(req.body);
        // Si orderIndex n'est pas fourni, le mettre à la fin
        let orderIndex = data.orderIndex;
        if (orderIndex === undefined) {
            const lastChapter = await prisma.chapter.findFirst({
                where: { subjectId: data.subjectId },
                orderBy: { orderIndex: 'desc' }
            });
            orderIndex = lastChapter ? lastChapter.orderIndex + 1 : 0;
        }
        const chapter = await prisma.chapter.create({
            data: {
                subjectId: data.subjectId,
                title: data.title,
                description: data.description,
                pdfUrl: data.pdfUrl,
                orderIndex
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        return res.status(201).json({ chapter });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
            });
        }
        console.error('[chapters/create] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * PUT /api/chapters/:id
 * Mettre à jour un chapitre (admin uniquement)
 */
exports.chaptersRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
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
        const data = updateChapterSchema.parse(req.body);
        const chapter = await prisma.chapter.update({
            where: { id },
            data,
            include: {
                subject: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        return res.json({ chapter });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
            });
        }
        console.error('[chapters/update] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * DELETE /api/chapters/:id
 * Supprimer un chapitre (admin uniquement)
 */
exports.chaptersRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
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
        // Supprimer le chapitre (cascade delete des questions)
        await prisma.chapter.delete({
            where: { id }
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('[chapters/delete] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
//# sourceMappingURL=chapters.js.map