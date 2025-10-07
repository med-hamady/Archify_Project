"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.usersRouter = (0, express_1.Router)();
// Schemas
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['student', 'admin', 'superadmin']).optional(),
    departmentId: zod_1.z.string().cuid().optional(),
    semester: zod_1.z.number().int().min(1).max(10).optional(),
});
// Helper to format user data for public view
function getUserPublic(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department?.name,
        departmentId: user.departmentId,
        semester: user.semester,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
    };
}
// GET /api/users - Get all users (Admin only)
exports.usersRouter.get('/', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const users = await prisma.user.findMany({
            include: {
                department: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(users.map(getUserPublic));
    }
    catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /api/users/:id - Get a single user by ID (Admin only)
exports.usersRouter.get('/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                department: { select: { name: true } },
                subscriptions: {
                    include: { plan: true },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
        }
        return res.json(getUserPublic(user));
    }
    catch (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /api/users/:id - Update a user (Admin only)
exports.usersRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        const body = updateUserSchema.parse(req.body);
        // Prepare update data
        const updateData = {
            name: body.name,
            email: body.email,
            role: body.role,
            semester: body.semester,
        };
        // Handle department connection separately
        if (body.departmentId) {
            updateData.department = { connect: { id: body.departmentId } };
        }
        else if (body.departmentId === null) {
            updateData.department = { disconnect: true };
        }
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                department: { select: { name: true } },
            },
        });
        return res.json(getUserPublic(user));
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error updating user:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /api/users/:id - Delete a user (Admin only)
exports.usersRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const { id } = req.params;
        // Prevent admin from deleting themselves
        if (id === req.userId) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot delete your own account' } });
        }
        await prisma.user.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /api/users/stats - Get user statistics (Admin only)
exports.usersRouter.get('/stats/overview', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
    try {
        const [totalUsers, totalStudents, totalAdmins, recentUsers, usersByDepartment] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            }),
            prisma.user.groupBy({
                by: ['departmentId'],
                _count: { id: true }
            })
        ]);
        return res.json({
            totalUsers,
            totalStudents,
            totalAdmins,
            recentUsers,
            usersByDepartment: usersByDepartment.map(item => ({
                departmentId: item.departmentId,
                count: item._count?.id || 0
            }))
        });
    }
    catch (err) {
        console.error('Error fetching user stats:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=users.js.map