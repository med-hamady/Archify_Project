"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.lessonsRouter = (0, express_1.Router)();
// Schemas
const lessonQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 10),
    courseId: zod_1.z.string().optional(),
    type: zod_1.z.enum(['video', 'pdf', 'exam']).optional(),
    isPremium: zod_1.z.string().optional().transform(val => val === 'true')
});
const lessonCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    courseId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['video', 'pdf', 'exam']),
    durationSec: zod_1.z.number().int().min(0).default(0),
    vimeoId: zod_1.z.string().optional(),
    youtubeId: zod_1.z.string().optional(),
    pdfUrl: zod_1.z.string().url().optional(),
    isPremium: zod_1.z.boolean().default(false),
    orderIndex: zod_1.z.number().int().min(0).default(0)
});
const lessonUpdateSchema = lessonCreateSchema.partial();
// Helper to format lesson data for public view
function getLessonPublic(lesson) {
    return {
        id: lesson.id,
        title: lesson.title,
        courseId: lesson.courseId,
        type: lesson.type,
        durationSec: lesson.durationSec,
        vimeoId: lesson.vimeoId,
        youtubeId: lesson.youtubeId,
        pdfUrl: lesson.pdfUrl,
        isPremium: lesson.isPremium,
        orderIndex: lesson.orderIndex,
        createdAt: lesson.createdAt,
        lessonAssets: lesson.lessonAssets || []
    };
}
// GET /lessons - List lessons with filtering and pagination
exports.lessonsRouter.get('/', async (req, res) => {
    try {
        const query = lessonQuerySchema.parse(req.query);
        const { page, limit, courseId, type, isPremium } = query;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
        if (courseId) {
            where.courseId = courseId;
        }
        if (type) {
            where.type = type;
        }
        if (isPremium !== undefined) {
            where.isPremium = isPremium;
        }
        const [lessons, total] = await Promise.all([
            prisma.lesson.findMany({
                where,
                include: {
                    lessonAssets: true,
                    course: { select: { title: true, department: { select: { name: true } } } }
                },
                orderBy: [
                    { courseId: 'asc' },
                    { orderIndex: 'asc' },
                    { createdAt: 'asc' }
                ],
                skip,
                take: limit
            }),
            prisma.lesson.count({ where })
        ]);
        return res.json({
            lessons: lessons.map(getLessonPublic),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error fetching lessons:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /lessons/:id - Get a single lesson with assets
exports.lessonsRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await prisma.lesson.findUnique({
            where: { id },
            include: {
                lessonAssets: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        department: { select: { name: true } }
                    }
                },
                comments: {
                    where: { status: 'visible' },
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!lesson) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
        }
        return res.json(getLessonPublic(lesson));
    }
    catch (err) {
        console.error('Error fetching lesson:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /lessons/:id/assets - Get lesson assets
exports.lessonsRouter.get('/:id/assets', async (req, res) => {
    try {
        const { id } = req.params;
        const assets = await prisma.lessonAsset.findMany({
            where: { lessonId: id },
            orderBy: { title: 'asc' }
        });
        res.json(assets);
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /lessons - Create a new lesson (Admin only)
exports.lessonsRouter.post('/', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const body = lessonCreateSchema.parse(req.body);
        // Verify course exists
        const course = await prisma.course.findUnique({
            where: { id: body.courseId },
            select: { id: true }
        });
        if (!course) {
            return res.status(404).json({ error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } });
        }
        const lesson = await prisma.lesson.create({
            data: body,
            include: {
                lessonAssets: true,
                course: { select: { title: true } }
            }
        });
        return res.status(201).json(lesson);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error creating lesson:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /lessons/:id - Update a lesson (Admin only)
exports.lessonsRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        const body = lessonUpdateSchema.parse(req.body);
        const lesson = await prisma.lesson.update({
            where: { id },
            data: body,
            include: {
                lessonAssets: true,
                course: { select: { title: true } }
            }
        });
        return res.json(lesson);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error updating lesson:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /lessons/:id - Delete a lesson (Admin only)
exports.lessonsRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        await prisma.lesson.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting lesson:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /lessons/:id/progress - Update lesson progress (Authenticated users)
exports.lessonsRouter.post('/:id/progress', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['viewed', 'in_progress'].includes(status)) {
            return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Invalid status' } });
        }
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id },
            select: { id: true, isPremium: true }
        });
        if (!lesson) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
        }
        // Check if user has access to premium content
        if (lesson.isPremium) {
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                include: { subscriptions: { where: { status: 'active' } } }
            });
            if (!user || user.subscriptions.length === 0) {
                return res.status(403).json({ error: { code: 'PREMIUM_REQUIRED', message: 'Premium subscription required' } });
            }
        }
        // Update or create progress record
        const existingProgress = await prisma.progress.findFirst({
            where: {
                userId: req.userId,
                lessonId: id
            }
        });
        let progress;
        if (existingProgress) {
            progress = await prisma.progress.update({
                where: { id: existingProgress.id },
                data: { status: status }
            });
        }
        else {
            progress = await prisma.progress.create({
                data: {
                    userId: req.userId,
                    lessonId: id,
                    status: status
                }
            });
        }
        return res.json(progress);
    }
    catch (err) {
        console.error('Error updating progress:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=lessons.js.map