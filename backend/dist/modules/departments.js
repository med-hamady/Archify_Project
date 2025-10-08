"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.departmentsRouter = (0, express_1.Router)();
// Schemas
const departmentCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100)
});
const departmentUpdateSchema = departmentCreateSchema.partial();
// GET /departments - Get all departments
exports.departmentsRouter.get('/', async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: {
                        courses: true,
                        users: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(departments.map(dept => ({
            id: dept.id,
            name: dept.name,
            courseCount: dept._count.courses,
            userCount: dept._count.users
        })));
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /departments/:id - Get department details
exports.departmentsRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                courses: {
                    select: {
                        id: true,
                        title: true,
                        semester: true,
                        isPremium: true,
                        views: true,
                        createdAt: true,
                        _count: {
                            select: { lessons: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        semester: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        courses: true,
                        users: true
                    }
                }
            }
        });
        if (!department) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Department not found' } });
        }
        res.json({
            id: department.id,
            name: department.name,
            courseCount: department._count.courses,
            userCount: department._count.users,
            courses: department.courses.map((course) => ({
                id: course.id,
                title: course.title,
                semester: course.semester,
                isPremium: course.isPremium,
                views: course.views,
                lessonCount: course._count.lessons,
                createdAt: course.createdAt
            })),
            users: department.users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                semester: user.semester,
                createdAt: user.createdAt
            }))
        });
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /departments - Create department (admin only)
exports.departmentsRouter.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin' && req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        const body = departmentCreateSchema.parse(req.body);
        // Check if department with same name already exists
        const existingDept = await prisma.department.findUnique({
            where: { name: body.name }
        });
        if (existingDept) {
            return res.status(409).json({
                error: {
                    code: 'DEPARTMENT_EXISTS',
                    message: 'Department with this name already exists'
                }
            });
        }
        const department = await prisma.department.create({
            data: body,
            include: {
                _count: {
                    select: {
                        courses: true,
                        users: true
                    }
                }
            }
        });
        res.status(201).json({
            id: department.id,
            name: department.name,
            courseCount: department._count.courses,
            userCount: department._count.users
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /departments/:id - Update department (admin only)
exports.departmentsRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin' && req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        const { id } = req.params;
        const body = departmentUpdateSchema.parse(req.body);
        // Check if department exists
        const existingDept = await prisma.department.findUnique({ where: { id } });
        if (!existingDept) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Department not found' } });
        }
        // Check if new name conflicts with existing department
        if (body.name && body.name !== existingDept.name) {
            const nameConflict = await prisma.department.findUnique({
                where: { name: body.name }
            });
            if (nameConflict) {
                return res.status(409).json({
                    error: {
                        code: 'DEPARTMENT_EXISTS',
                        message: 'Department with this name already exists'
                    }
                });
            }
        }
        const department = await prisma.department.update({
            where: { id },
            data: body,
            include: {
                _count: {
                    select: {
                        courses: true,
                        users: true
                    }
                }
            }
        });
        res.json({
            id: department.id,
            name: department.name,
            courseCount: department._count.courses,
            userCount: department._count.users
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /departments/:id - Delete department (admin only)
exports.departmentsRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin' && req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        }
        const { id } = req.params;
        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        courses: true,
                        users: true
                    }
                }
            }
        });
        if (!department) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Department not found' } });
        }
        // Check if department has courses or users
        if (department._count.courses > 0 || department._count.users > 0) {
            return res.status(400).json({
                error: {
                    code: 'DEPARTMENT_IN_USE',
                    message: 'Cannot delete department with courses or users'
                }
            });
        }
        await prisma.department.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=departments.js.map