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
    department: zod_1.z.string().optional(),
    semester: zod_1.z.string().optional(),
    isPremium: zod_1.z.string().optional().transform(val => val === 'true'),
    tags: zod_1.z.string().optional().transform(val => val ? val.split(',') : [])
});
const courseCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    semester: zod_1.z.string().min(1),
    professor: zod_1.z.string().min(1),
    departmentId: zod_1.z.string().uuid(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isPremium: zod_1.z.boolean().default(false)
});
const courseUpdateSchema = courseCreateSchema.partial();
// Helper to format course data for public view
function getCoursePublic(course) {
    return {
        id: course.id,
        title: course.title,
        description: course.description,
        semester: course.semester,
        professor: course.professor,
        department: course.department?.name,
        departmentId: course.departmentId,
        tags: course.tags,
        isPremium: course.isPremium,
        views: course.views,
        lessonCount: course.lessons?.length || 0,
        createdAt: course.createdAt
    };
}
// GET /courses - List courses with filtering and pagination
exports.coursesRouter.get('/', async (req, res) => {
    try {
        const query = courseQuerySchema.parse(req.query);
        const { page, limit, search, department, semester, isPremium, tags } = query;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { professor: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (department) {
            where.department = { name: { contains: department, mode: 'insensitive' } };
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
                    department: { select: { name: true } },
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
                department: { select: { name: true } },
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
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const body = courseCreateSchema.parse(req.body);
        const course = await prisma.course.create({
            data: {
                ...body,
                tags: body.tags,
                views: 0
            },
            include: {
                department: { select: { name: true } }
            }
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
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        const body = courseUpdateSchema.parse(req.body);
        const course = await prisma.course.update({
            where: { id },
            data: body,
            include: {
                department: { select: { name: true } }
            }
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
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        await prisma.course.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting course:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=courses.js.map