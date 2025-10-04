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
            where.departmentId = department;
        }
        if (semester) {
            where.semester = semester;
        }
        if (typeof isPremium === 'boolean') {
            where.isPremium = isPremium;
        }
        if (tags.length > 0) {
            where.tags = { hasSome: tags };
        }
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    department: true,
                    lessons: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            durationSec: true,
                            isPremium: true,
                            orderIndex: true
                        },
                        orderBy: { orderIndex: 'asc' }
                    },
                    _count: {
                        select: { lessons: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.course.count({ where })
        ]);
        res.json({
            courses: courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                semester: course.semester,
                professor: course.professor,
                department: course.department.name,
                departmentId: course.departmentId,
                tags: course.tags,
                isPremium: course.isPremium,
                views: course.views,
                lessonCount: course._count.lessons,
                lessons: course.lessons,
                createdAt: course.createdAt
            })),
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
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /courses/:id - Get course details
exports.coursesRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                department: true,
                lessons: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        durationSec: true,
                        isPremium: true,
                        orderIndex: true,
                        createdAt: true
                    },
                    orderBy: { orderIndex: 'asc' }
                },
                _count: {
                    select: { lessons: true }
                }
            }
        });
        if (!course) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });
        }
        // Increment view count
        await prisma.course.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
        res.json({
            id: course.id,
            title: course.title,
            description: course.description,
            semester: course.semester,
            professor: course.professor,
            department: course.department.name,
            departmentId: course.departmentId,
            tags: course.tags,
            isPremium: course.isPremium,
            views: course.views + 1, // Include the increment
            lessonCount: course._count.lessons,
            lessons: course.lessons,
            createdAt: course.createdAt
        });
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /courses - Create course (admin only)
exports.coursesRouter.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        const body = courseCreateSchema.parse(req.body);
        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: body.departmentId }
        });
        if (!department) {
            return res.status(400).json({ error: { code: 'INVALID_DEPARTMENT', message: 'Department not found' } });
        }
        const course = await prisma.course.create({
            data: body,
            include: {
                department: true,
                lessons: true,
                _count: {
                    select: { lessons: true }
                }
            }
        });
        res.status(201).json({
            id: course.id,
            title: course.title,
            description: course.description,
            semester: course.semester,
            professor: course.professor,
            department: course.department.name,
            departmentId: course.departmentId,
            tags: course.tags,
            isPremium: course.isPremium,
            views: course.views,
            lessonCount: course._count.lessons,
            lessons: course.lessons,
            createdAt: course.createdAt
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /courses/:id - Update course (admin only)
exports.coursesRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        const { id } = req.params;
        const body = courseUpdateSchema.parse(req.body);
        // Check if course exists
        const existingCourse = await prisma.course.findUnique({ where: { id } });
        if (!existingCourse) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });
        }
        // Verify department exists if provided
        if (body.departmentId) {
            const department = await prisma.department.findUnique({
                where: { id: body.departmentId }
            });
            if (!department) {
                return res.status(400).json({ error: { code: 'INVALID_DEPARTMENT', message: 'Department not found' } });
            }
        }
        const course = await prisma.course.update({
            where: { id },
            data: body,
            include: {
                department: true,
                lessons: true,
                _count: {
                    select: { lessons: true }
                }
            }
        });
        res.json({
            id: course.id,
            title: course.title,
            description: course.description,
            semester: course.semester,
            professor: course.professor,
            department: course.department.name,
            departmentId: course.departmentId,
            tags: course.tags,
            isPremium: course.isPremium,
            views: course.views,
            lessonCount: course._count.lessons,
            lessons: course.lessons,
            createdAt: course.createdAt
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /courses/:id - Delete course (admin only)
exports.coursesRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        const { id } = req.params;
        // Check if course exists
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });
        }
        await prisma.course.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /courses/:id/lessons - Get lessons for a course
exports.coursesRouter.get('/:id/lessons', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if course exists
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });
        }
        const lessons = await prisma.lesson.findMany({
            where: { courseId: id },
            select: {
                id: true,
                title: true,
                type: true,
                durationSec: true,
                isPremium: true,
                orderIndex: true,
                createdAt: true,
                _count: {
                    select: { comments: true }
                }
            },
            orderBy: { orderIndex: 'asc' }
        });
        res.json(lessons);
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=courses.js.map