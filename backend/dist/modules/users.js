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
    semester: zod_1.z.number().int().min(1).max(10).optional(),
});
// Helper to format user data for public view
function getUserPublic(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        semester: user.semester,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
    };
}
// GET /api/users - Get all users (filtered by level for Level Admins)
exports.usersRouter.get('/', auth_1.requireAuth, auth_1.requireLevelAdmin, async (req, res) => {
    try {
        const semesterFilter = (0, auth_1.getSemesterFilter)(req);
        const users = await prisma.user.findMany({
            where: semesterFilter,
            orderBy: { createdAt: 'desc' },
        });
        return res.json(users.map(getUserPublic));
    }
    catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /api/users/:id - Get a single user by ID (filtered by level for Level Admins)
exports.usersRouter.get('/:id', auth_1.requireAuth, auth_1.requireLevelAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                subscriptions: {
                    include: { plan: true },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
        }
        // Vérifier l'accès au niveau de cet utilisateur
        if (!(0, auth_1.canAccessSemester)(req, user.semester)) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Vous n\'avez pas accès à ce niveau' } });
        }
        return res.json(getUserPublic(user));
    }
    catch (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /api/users/:id - Update a user (SUPERADMIN only - can change roles)
exports.usersRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    // Seul le SUPERADMIN peut modifier les utilisateurs (changement de rôle, etc.)
    if (req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Superadmin access required' } });
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
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
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
// DELETE /api/users/:id - Delete a user (SUPERADMIN only)
exports.usersRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    // Seul le SUPERADMIN peut supprimer des utilisateurs
    if (req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Superadmin access required' } });
    }
    try {
        const { id } = req.params;
        // Prevent admin from deleting themselves
        if (id === req.userId) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot delete your own account' } });
        }
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
        }
        // Delete user with cascade handling
        await prisma.user.delete({
            where: { id },
            // This will cascade delete related records
        });
        return res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting user:', err);
        // Handle specific Prisma errors
        if (err.code === 'P2003') {
            return res.status(400).json({
                error: {
                    code: 'CONSTRAINT_ERROR',
                    message: 'Cannot delete user due to existing relationships. Please remove related data first.'
                }
            });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /api/users/stats/overview - Get user statistics (filtered by level for Level Admins)
exports.usersRouter.get('/stats/overview', auth_1.requireAuth, auth_1.requireLevelAdmin, async (req, res) => {
    try {
        const semesterFilter = (0, auth_1.getSemesterFilter)(req);
        const [totalUsers, totalStudents, recentUsers] = await Promise.all([
            prisma.user.count({ where: semesterFilter }),
            prisma.user.count({ where: { role: 'STUDENT', ...semesterFilter } }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    },
                    ...semesterFilter
                }
            })
        ]);
        // Admins seulement visibles pour SUPERADMIN
        const totalAdmins = req.isSuperAdmin
            ? await prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } })
            : 0;
        return res.json({
            totalUsers,
            totalStudents,
            totalAdmins,
            recentUsers,
        });
    }
    catch (err) {
        console.error('Error fetching user stats:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=users.js.map