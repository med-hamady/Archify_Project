"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
exports.adminRouter = (0, express_1.Router)();
// Schemas
const createAdminSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.enum(['ADMIN', 'SUPERADMIN']).default('ADMIN'),
});
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.enum(['STUDENT', 'ADMIN', 'SUPERADMIN']).default('STUDENT'),
    semester: zod_1.z.string().optional(),
});
// POST /api/admin/create-admin - Create admin account (Superadmin only)
exports.adminRouter.post('/create-admin', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only superadmin can create admin accounts' } });
    }
    try {
        const body = createAdminSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: body.email }
        });
        if (existingUser) {
            return res.status(409).json({ error: { code: 'CONFLICT', message: 'User with this email already exists' } });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(body.password, 12);
        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: body.email,
                passwordHash: hashedPassword,
                role: body.role,
                name: `${body.firstName} ${body.lastName}`,
                semester: 'S1'
            }
        });
        return res.status(201).json({
            message: 'Admin account created successfully',
            admin
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error creating admin:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /api/admin/create-user - Create user account (Admin only)
exports.adminRouter.post('/create-user', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN' && req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only admin can create user accounts' } });
    }
    try {
        const body = createUserSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: body.email }
        });
        if (existingUser) {
            return res.status(409).json({ error: { code: 'CONFLICT', message: 'User with this email already exists' } });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(body.password, 12);
        // Create user
        const user = await prisma.user.create({
            data: {
                email: body.email,
                passwordHash: hashedPassword,
                role: body.role,
                name: `${body.firstName} ${body.lastName}`,
                semester: body.semester || 'S1',
            },
        });
        return res.status(201).json({
            message: 'User account created successfully',
            user
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error creating user:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /api/admin/users - Get all users (Admin only)
exports.adminRouter.get('/users', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only admin can view users' } });
    }
    try {
        const users = await prisma.user.findMany({
            include: {
                subscriptions: { where: { status: 'ACTIVE' } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(users);
    }
    catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /api/admin/users/:id - Update user (Admin only)
exports.adminRouter.put('/users/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only admin can update users' } });
    }
    try {
        const { id } = req.params;
        const { firstName, lastName, email, role, semester } = req.body;
        const user = await prisma.user.update({
            where: { id },
            data: {
                name: `${firstName} ${lastName}`,
                email,
                role,
                semester
            },
        });
        return res.json(user);
    }
    catch (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /api/admin/users/:id - Delete user (Admin only)
exports.adminRouter.delete('/users/:id', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only admin can delete users' } });
    }
    try {
        const { id } = req.params;
        const { force } = req.query; // Optional force parameter
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
        }
        // Prevent deletion of superadmin accounts
        if (user.role === 'SUPERADMIN') {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Cannot delete superadmin accounts'
                }
            });
        }
        if (force === 'true') {
            // Force delete: remove all related data first
            console.log(`Force deleting user ${user.name} and all related data...`);
            // Delete in the correct order to avoid foreign key constraints
            await prisma.payment.deleteMany({ where: { userId: id } });
            await prisma.subscription.deleteMany({ where: { userId: id } });
            await prisma.comment.deleteMany({ where: { userId: id } });
            await prisma.progress.deleteMany({ where: { userId: id } });
            await prisma.passwordResetToken.deleteMany({ where: { userId: id } });
            // Finally delete the user
            await prisma.user.delete({ where: { id } });
            return res.json({ message: 'User and all related data deleted successfully' });
        }
        else {
            // Regular delete (will fail if there are constraints)
            await prisma.user.delete({ where: { id } });
            return res.json({ message: 'User deleted successfully' });
        }
    }
    catch (err) {
        console.error('Error deleting user:', err);
        // Handle specific Prisma errors
        if (err.code === 'P2003') {
            return res.status(400).json({
                error: {
                    code: 'CONSTRAINT_ERROR',
                    message: 'Cannot delete user due to existing relationships. Use ?force=true to delete all related data.'
                }
            });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /api/admin/reset - Reset admin initialization (emergency use)
exports.adminRouter.post('/reset', async (req, res) => {
    try {
        const { secret } = req.body;
        // Only allow reset with a secret key (for emergency use)
        if (secret !== 'ARCHIFY_EMERGENCY_RESET_2024') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Invalid reset key' } });
        }
        // Delete all admin users
        await prisma.user.deleteMany({
            where: {
                role: {
                    in: ['ADMIN', 'SUPERADMIN']
                }
            }
        });
        return res.json({ message: 'Admin accounts reset successfully. You can now create a new superadmin.' });
    }
    catch (err) {
        console.error('Error resetting admin accounts:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /api/admin/init - Initialize first superadmin (only if no admin users exist)
exports.adminRouter.post('/init', async (req, res) => {
    try {
        // Check if any admin users exist (not just any users)
        const adminCount = await prisma.user.count({
            where: {
                role: {
                    in: ['ADMIN', 'SUPERADMIN']
                }
            }
        });
        if (adminCount > 0) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Admin accounts already exist' } });
        }
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create superadmin
        const superadmin = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: 'SUPERADMIN',
                name: `${firstName} ${lastName}`,
                semester: 'S1'
            }
        });
        return res.status(201).json({
            message: 'Superadmin created successfully',
            superadmin
        });
    }
    catch (err) {
        console.error('Error initializing superadmin:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=admin.js.map