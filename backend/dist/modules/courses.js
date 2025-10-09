"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coursesRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.coursesRouter = (0, express_1.Router)();
// Schemas
const courseQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: zod_1.z.string().optional(),
    semester: zod_1.z.string().optional(),
    isPremium: zod_1.z.string().optional().transform(val => val === 'true'),
    tags: zod_1.z.string().optional().transform(val => val ? val.split(',') : [])
});
const courseCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    semester: zod_1.z.string().min(1),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isPremium: zod_1.z.boolean().default(true)
});
const courseUpdateSchema = courseCreateSchema.partial();
// Helper to format course data for public view
function getCoursePublic(course) {
    return {
        id: course.id,
        title: course.title,
        description: course.description,
        semester: course.semester,
        tags: course.tags,
        isPremium: course.isPremium,
        views: course.views,
        lessonCount: course.lessons?.length || 0,
        lessons: course.lessons || [],
        createdAt: course.createdAt
    };
}
// GET /courses - List courses with filtering and pagination
exports.coursesRouter.get('/', async (req, res) => {
    try {
        const query = courseQuerySchema.parse(req.query);
        const { page, limit, search, semester, isPremium, tags } = query;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (semester) {
            where.semester = semester;
        }
        if (isPremium !== undefined) {
            where.isPremium = isPremium;
        }
        if (tags.length > 0) {
            where.tags = { hasSome: tags };
        }
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    lessons: { select: { id: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.course.count({ where })
        ]);
        return res.json({
            courses: courses.map(getCoursePublic),
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
        console.error('Error fetching courses:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /courses/:id - Get a single course with lessons
exports.coursesRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
        if (!course) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });
        }
        return res.json(getCoursePublic(course));
    }
    catch (err) {
        console.error('Error fetching course:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /courses/:id/lessons - Get lessons for a specific course
exports.coursesRouter.get('/:id/lessons', async (req, res) => {
    try {
        const { id } = req.params;
        const lessons = await prisma.lesson.findMany({
            where: { courseId: id },
            orderBy: { orderIndex: 'asc' }
        });
        res.json(lessons);
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /courses - Create a new course (Admin only)
exports.coursesRouter.post('/', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin' && req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const body = courseCreateSchema.parse(req.body);
        // Get the first department ID (or create a default one)
        const course = await prisma.course.create({
            data: {
                ...body,
                description: body.description, // Can be undefined now
                tags: body.tags,
                views: 0
            },
        });
        return res.status(201).json(course);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error creating course:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /courses/:id - Update a course (Admin only)
exports.coursesRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin' && req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        const body = courseUpdateSchema.parse(req.body);
        const course = await prisma.course.update({
            where: { id },
            data: body,
        });
        return res.json(course);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error updating course:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /courses/:id - Delete a course (Admin only)
exports.coursesRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin' && req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        const { force } = req.query; // Optional force parameter
        // Check if course exists
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });
        }
        if (force === 'true') {
            // Force delete: remove all related data first
            console.log(`Force deleting course ${course.title} and all related data...`);
            try {
                // Get all lessons for this course first
                const lessons = await prisma.lesson.findMany({
                    where: { courseId: id },
                    select: { id: true }
                });
                const lessonIds = lessons.map(l => l.id);
                console.log(`Found ${lessonIds.length} lessons to delete`);
                if (lessonIds.length > 0) {
                    // Delete comments and progress for these lessons
                    await prisma.comment.deleteMany({ where: { lessonId: { in: lessonIds } } });
                    await prisma.progress.deleteMany({ where: { lessonId: { in: lessonIds } } });
                    // Get all quizzes for these lessons
                    const quizzes = await prisma.quiz.findMany({
                        where: { lessonId: { in: lessonIds } },
                        select: { id: true }
                    });
                    const quizIds = quizzes.map(q => q.id);
                    console.log(`Found ${quizIds.length} quizzes to delete`);
                    if (quizIds.length > 0) {
                        // Get all questions for these quizzes
                        const questions = await prisma.quizQuestion.findMany({
                            where: { quizId: { in: quizIds } },
                            select: { id: true }
                        });
                        const questionIds = questions.map(q => q.id);
                        console.log(`Found ${questionIds.length} questions to delete`);
                        if (questionIds.length > 0) {
                            // Delete quiz answers
                            await prisma.quizAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
                        }
                        // Delete quiz questions
                        await prisma.quizQuestion.deleteMany({ where: { quizId: { in: quizIds } } });
                    }
                    // Delete quizzes
                    await prisma.quiz.deleteMany({ where: { lessonId: { in: lessonIds } } });
                    // Delete lesson assets
                    await prisma.lessonAsset.deleteMany({ where: { lessonId: { in: lessonIds } } });
                }
                // Delete lessons
                await prisma.lesson.deleteMany({ where: { courseId: id } });
                // Finally delete the course
                await prisma.course.delete({ where: { id } });
                console.log(`Successfully deleted course ${course.title} and all related data`);
                return res.json({ message: 'Course and all related data deleted successfully' });
            }
            catch (deleteError) {
                console.error('Error during force delete:', deleteError);
                return res.status(500).json({
                    error: {
                        code: 'DELETE_ERROR',
                        message: 'Error during force delete: ' + deleteError.message
                    }
                });
            }
        }
        else {
            // Regular delete - first delete lessons, then course
            console.log(`Attempting regular delete for course: ${course.title}`);
            // First delete all lessons for this course
            await prisma.lesson.deleteMany({ where: { courseId: id } });
            console.log(`Deleted lessons for course: ${course.title}`);
            // Then delete the course
            await prisma.course.delete({ where: { id } });
            console.log(`Course ${course.title} deleted successfully`);
            return res.status(204).send();
        }
    }
    catch (err) {
        console.error('Error deleting course:', err);
        console.error('Error details:', {
            code: err.code,
            message: err.message,
            meta: err.meta
        });
        // Handle specific Prisma errors
        if (err.code === 'P2003') {
            return res.status(400).json({
                error: {
                    code: 'CONSTRAINT_ERROR',
                    message: 'Cannot delete course due to existing relationships. Use ?force=true to delete all related data.'
                }
            });
        }
        return res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Internal error: ' + err.message
            }
        });
    }
});
//# sourceMappingURL=courses.js.map