import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
export const adminRouter = Router();

// Schemas
const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'superadmin']).default('admin'),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['student', 'admin', 'superadmin']).default('student'),
  departmentId: z.string().cuid().optional(),
  semester: z.number().int().min(1).max(10).optional(),
});

// POST /api/admin/create-admin - Create admin account (Superadmin only)
adminRouter.post('/create-admin', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'superadmin') {
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
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hashedPassword,
        role: body.role,
        name: `${body.firstName} ${body.lastName}`,
      }
    });

    return res.status(201).json({
      message: 'Admin account created successfully',
      admin
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error creating admin:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /api/admin/create-user - Create user account (Admin only)
adminRouter.post('/create-user', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
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
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hashedPassword,
        role: body.role,
        name: `${body.firstName} ${body.lastName}`,
        departmentId: body.departmentId,
        semester: body.semester,
      },
      include: {
        department: { select: { name: true } },
      }
    });

    return res.status(201).json({
      message: 'User account created successfully',
      user
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error creating user:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /api/admin/init - Initialize first superadmin (only if no users exist)
adminRouter.post('/init', async (req, res) => {
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
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create superadmin
    const superadmin = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'superadmin',
        name: `${firstName} ${lastName}`,
      }
    });

    return res.status(201).json({
      message: 'Superadmin created successfully',
      superadmin
    });
  } catch (err: any) {
    console.error('Error initializing superadmin:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
