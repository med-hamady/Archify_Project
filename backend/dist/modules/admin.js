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
    departmentId: zod_1.z.string().cuid().optional(),
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
        // Get the first department ID
        const firstDept = await prisma.department.findFirst();
        if (!firstDept) {
            return res.status(500).json({ error: { code: 'NO_DEPARTMENT', message: 'No department found' } });
        }
        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: body.email,
                passwordHash: hashedPassword,
                role: body.role,
                name: `${body.firstName} ${body.lastName}`,
                departmentId: firstDept.id,
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
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
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
                departmentId: body.departmentId || (await prisma.department.findFirst())?.id || 'default-dept',
                semester: body.semester || 'S1',
            },
            include: {
                department: { select: { name: true } },
            }
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
// GET /api/admin/init - Initialize first superadmin (only if no users exist)
exports.adminRouter.post('/init', async (req, res) => {
    try {
        // Check if any users exist
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'System already initialized' } });
        }
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Get the first department ID
        const firstDept = await prisma.department.findFirst();
        if (!firstDept) {
            return res.status(500).json({ error: { code: 'NO_DEPARTMENT', message: 'No department found' } });
        }
        // Create superadmin
        const superadmin = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: 'SUPERADMIN',
                name: `${firstName} ${lastName}`,
                departmentId: firstDept.id,
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