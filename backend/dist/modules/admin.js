"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.adminRouter = (0, express_1.Router)();
// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    next();
};
// GET /api/admin/stats - Get platform statistics
exports.adminRouter.get('/stats', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const [totalUsers, totalCourses, totalLessons, totalDepartments, activeUsers, premiumUsers] = await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.lesson.count(),
            prisma.department.count(),
            prisma.user.count({
                where: {
                    lastLoginAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            }),
            prisma.user.count({
                where: {
                    subscriptions: {
                        some: {
                            status: 'active',
                            endAt: { gt: new Date() }
                        }
                    }
                }
            })
        ]);
        res.json({
            totalUsers,
            totalCourses,
            totalLessons,
            totalDepartments,
            activeUsers,
            premiumUsers,
            freeUsers: totalUsers - premiumUsers
        });
    }
    catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /api/admin/users - Get all users with pagination
exports.adminRouter.get('/users', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                include: {
                    department: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count()
        ]);
        res.json({
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department?.name || 'Non assigné',
                semester: user.semester,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt
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
        console.error('Error fetching users:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /api/admin/users/:id - Update user
exports.adminRouter.put('/users/:id', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = zod_1.z.object({
            name: zod_1.z.string().min(1).optional(),
            email: zod_1.z.string().email().optional(),
            role: zod_1.z.enum(['student', 'admin', 'superadmin']).optional(),
            departmentId: zod_1.z.string().optional(),
            semester: zod_1.z.number().int().min(1).max(10).optional()
        }).parse(req.body);
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                department: { select: { name: true } }
            }
        });
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department?.name || 'Non assigné',
            semester: user.semester,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error updating user:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /api/admin/users/:id - Delete user
exports.adminRouter.delete('/users/:id', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Don't allow deleting superadmin users
        const user = await prisma.user.findUnique({ where: { id } });
        if (user?.role === 'superadmin') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Cannot delete superadmin user' } });
        }
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /api/admin/lessons - Get all lessons with pagination
exports.adminRouter.get('/lessons', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [lessons, total] = await Promise.all([
            prisma.lesson.findMany({
                skip,
                take: limit,
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.lesson.count()
        ]);
        res.json({
            lessons: lessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                durationSec: lesson.durationSec,
                vimeoId: lesson.vimeoId,
                youtubeId: lesson.youtubeId,
                pdfUrl: lesson.pdfUrl,
                isPremium: lesson.isPremium,
                orderIndex: lesson.orderIndex,
                courseId: lesson.courseId,
                courseTitle: lesson.course.title,
                createdAt: lesson.createdAt
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
        console.error('Error fetching lessons:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /api/admin/lessons/:id - Update lesson
exports.adminRouter.put('/lessons/:id', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = zod_1.z.object({
            title: zod_1.z.string().min(1).optional(),
            type: zod_1.z.enum(['video', 'pdf', 'exam']).optional(),
            durationSec: zod_1.z.number().int().min(0).optional(),
            vimeoId: zod_1.z.string().optional().nullable(),
            youtubeId: zod_1.z.string().optional().nullable(),
            pdfUrl: zod_1.z.string().url().optional().nullable(),
            isPremium: zod_1.z.boolean().optional(),
            orderIndex: zod_1.z.number().int().min(0).optional()
        }).parse(req.body);
        const lesson = await prisma.lesson.update({
            where: { id },
            data: updateData,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        res.json({
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
            durationSec: lesson.durationSec,
            vimeoId: lesson.vimeoId,
            youtubeId: lesson.youtubeId,
            pdfUrl: lesson.pdfUrl,
            isPremium: lesson.isPremium,
            orderIndex: lesson.orderIndex,
            courseId: lesson.courseId,
            courseTitle: lesson.course.title,
            createdAt: lesson.createdAt
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error updating lesson:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /api/admin/lessons/:id - Delete lesson
exports.adminRouter.delete('/lessons/:id', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.lesson.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting lesson:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /api/admin/courses/:id - Update course
exports.adminRouter.put('/courses/:id', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = zod_1.z.object({
            title: zod_1.z.string().min(1).optional(),
            description: zod_1.z.string().min(1).optional(),
            professor: zod_1.z.string().min(1).optional(),
            departmentId: zod_1.z.string().optional(),
            semester: zod_1.z.string().min(1).optional(),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            isPremium: zod_1.z.boolean().optional()
        }).parse(req.body);
        const course = await prisma.course.update({
            where: { id },
            data: {
                ...updateData,
                ...(updateData.departmentId && { department: { connect: { id: updateData.departmentId } } })
            },
            include: {
                department: { select: { name: true } },
                lessons: { select: { id: true } }
            }
        });
        res.json({
            id: course.id,
            title: course.title,
            description: course.description,
            professor: course.professor,
            department: course.department.name,
            departmentId: course.departmentId,
            semester: course.semester,
            tags: course.tags,
            isPremium: course.isPremium,
            views: course.views,
            lessonCount: course.lessons.length,
            createdAt: course.createdAt
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error updating course:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /api/admin/courses/:id - Delete course
exports.adminRouter.delete('/courses/:id', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.course.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /api/admin/departments/:id - Delete department
exports.adminRouter.delete('/departments/:id', auth_1.requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if department has courses or users
        const [courseCount, userCount] = await Promise.all([
            prisma.course.count({ where: { departmentId: id } }),
            prisma.user.count({ where: { departmentId: id } })
        ]);
        if (courseCount > 0 || userCount > 0) {
            return res.status(400).json({
                error: {
                    code: 'DEPARTMENT_IN_USE',
                    message: 'Cannot delete department with existing courses or users'
                }
            });
        }
        await prisma.department.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting department:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=admin.js.map