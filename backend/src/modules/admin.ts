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
  role: z.enum(['ADMIN', 'SUPERADMIN']).default('ADMIN'),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'ADMIN', 'SUPERADMIN']).default('STUDENT'),
  semester: z.string().optional(),
});

// POST /api/admin/create-admin - Create admin account (Superadmin only)
adminRouter.post('/create-admin', requireAuth, async (req: any, res) => {
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
    const hashedPassword = await bcrypt.hash(body.password, 12);


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
    const hashedPassword = await bcrypt.hash(body.password, 12);


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
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error creating user:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /api/admin/users - Get all users (Admin only)
adminRouter.get('/users', requireAuth, async (req: any, res) => {
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
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// PUT /api/admin/users/:id - Update user (Admin only)
adminRouter.put('/users/:id', requireAuth, async (req: any, res) => {
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
  } catch (err: any) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// DELETE /api/admin/users/:id - Delete user (Admin only)
adminRouter.delete('/users/:id', requireAuth, async (req: any, res) => {
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
    } else {
      // Regular delete (will fail if there are constraints)
      await prisma.user.delete({ where: { id } });
      return res.json({ message: 'User deleted successfully' });
    }
  } catch (err: any) {
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
adminRouter.post('/reset', async (req, res) => {
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
  } catch (err: any) {
    console.error('Error resetting admin accounts:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /api/admin/init - Initialize first superadmin (only if no admin users exist)
adminRouter.post('/init', async (req, res) => {
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
    const hashedPassword = await bcrypt.hash(password, 12);


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
  } catch (err: any) {
    console.error('Error initializing superadmin:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /api/admin/dashboard-stats - Get dashboard statistics (Admin only)
adminRouter.get('/dashboard-stats', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only admin can view dashboard stats' } });
  }

  try {
    // Get total courses count
    const totalCourses = await prisma.course.count();

    // Get total users count (excluding admins)
    const totalUsers = await prisma.user.count({
      where: {
        role: 'STUDENT'
      }
    });

    // Get active subscriptions count
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        endAt: {
          gt: new Date()
        }
      }
    });

    // Get total revenue from completed payments
    const paymentsResult = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED'
      },
      _sum: {
        amountCents: true
      }
    });

    const totalRevenueCents = paymentsResult._sum.amountCents || 0;
    const totalRevenueMRU = totalRevenueCents / 100; // Convert cents to MRU

    // Calculate growth percentages (comparing with last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Courses growth
    const coursesLastMonth = await prisma.course.count({
      where: {
        createdAt: {
          lt: lastMonth
        }
      }
    });
    const coursesGrowth = coursesLastMonth > 0
      ? Math.round(((totalCourses - coursesLastMonth) / coursesLastMonth) * 100)
      : totalCourses > 0 ? 100 : 0;

    // Users growth
    const usersLastMonth = await prisma.user.count({
      where: {
        role: 'STUDENT',
        createdAt: {
          lt: lastMonth
        }
      }
    });
    const usersGrowth = usersLastMonth > 0
      ? Math.round(((totalUsers - usersLastMonth) / usersLastMonth) * 100)
      : totalUsers > 0 ? 100 : 0;

    // Subscriptions growth
    const subscriptionsLastMonth = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        createdAt: {
          lt: lastMonth
        }
      }
    });
    const subscriptionsGrowth = subscriptionsLastMonth > 0
      ? Math.round(((activeSubscriptions - subscriptionsLastMonth) / subscriptionsLastMonth) * 100)
      : activeSubscriptions > 0 ? 100 : 0;

    // Revenue growth
    const revenueLastMonthResult = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          lt: lastMonth
        }
      },
      _sum: {
        amountCents: true
      }
    });
    const revenueLastMonthCents = revenueLastMonthResult._sum.amountCents || 0;
    const revenueGrowth = revenueLastMonthCents > 0
      ? Math.round(((totalRevenueCents - revenueLastMonthCents) / revenueLastMonthCents) * 100)
      : totalRevenueCents > 0 ? 100 : 0;

    // Advanced Analytics Metrics

    // ARPU (Average Revenue Per User)
    const arpu = totalUsers > 0 ? totalRevenueMRU / totalUsers : 0;

    // ARPU Growth
    const usersLastMonthForARPU = usersLastMonth || 1; // Avoid division by zero
    const arpuLastMonth = revenueLastMonthCents > 0 && usersLastMonthForARPU > 0
      ? (revenueLastMonthCents / 100) / usersLastMonthForARPU
      : 0;
    const arpuGrowth = arpuLastMonth > 0
      ? Math.round(((arpu - arpuLastMonth) / arpuLastMonth) * 100)
      : arpu > 0 ? 100 : 0;

    // Retention Rate (active subscriptions / total subscriptions ever created)
    const totalSubscriptionsEver = await prisma.subscription.count();
    const retentionRate = totalSubscriptionsEver > 0
      ? Math.round((activeSubscriptions / totalSubscriptionsEver) * 100 * 10) / 10 // 1 decimal
      : 0;

    // Retention Rate last month
    const activeSubscriptionsLastMonthCount = subscriptionsLastMonth || 1;
    const totalSubscriptionsLastMonth = await prisma.subscription.count({
      where: {
        createdAt: {
          lt: lastMonth
        }
      }
    });
    const retentionRateLastMonth = totalSubscriptionsLastMonth > 0
      ? Math.round((activeSubscriptionsLastMonthCount / totalSubscriptionsLastMonth) * 100 * 10) / 10
      : 0;
    const retentionGrowth = retentionRateLastMonth > 0
      ? Math.round(((retentionRate - retentionRateLastMonth) / retentionRateLastMonth) * 100 * 10) / 10
      : retentionRate > 0 ? 100 : 0;

    // LTV (Lifetime Value) - Simple calculation: Total Revenue / Total Users Ever
    const totalUsersEver = await prisma.user.count({
      where: {
        role: 'STUDENT'
      }
    });
    const ltv = totalUsersEver > 0 ? totalRevenueMRU / totalUsersEver : 0;

    // LTV last month
    const totalUsersEverLastMonth = usersLastMonth || 1;
    const ltvLastMonth = totalUsersEverLastMonth > 0 && revenueLastMonthCents > 0
      ? (revenueLastMonthCents / 100) / totalUsersEverLastMonth
      : 0;
    const ltvGrowth = ltvLastMonth > 0
      ? Math.round(((ltv - ltvLastMonth) / ltvLastMonth) * 100)
      : ltv > 0 ? 100 : 0;

    // Average Engagement Time (sum of all lesson durations viewed / total users)
    // For now, we'll calculate total available content duration
    const totalLessonDuration = await prisma.lesson.aggregate({
      _sum: {
        durationSec: true
      }
    });
    const totalDurationHours = (totalLessonDuration._sum.durationSec || 0) / 3600;
    const avgEngagementHours = totalUsers > 0 ? totalDurationHours / totalUsers : 0;

    // Engagement growth (simplified - based on new lessons added)
    const lessonsLastMonth = await prisma.lesson.count({
      where: {
        createdAt: {
          lt: lastMonth
        }
      }
    });
    const totalLessons = await prisma.lesson.count();
    const engagementGrowth = lessonsLastMonth > 0
      ? Math.round(((totalLessons - lessonsLastMonth) / lessonsLastMonth) * 100)
      : totalLessons > 0 ? 100 : 0;

    // Conversion Funnel
    const totalVisitors = totalUsers; // Simplified: all registered users
    const trialUsers = await prisma.user.count({
      where: {
        role: 'STUDENT',
        subscriptions: {
          none: {}
        }
      }
    });
    const paidUsers = await prisma.user.count({
      where: {
        role: 'STUDENT',
        subscriptions: {
          some: {
            status: 'ACTIVE'
          }
        }
      }
    });

    return res.json({
      totalCourses,
      totalUsers,
      activeSubscriptions,
      totalRevenueMRU,
      growth: {
        courses: coursesGrowth,
        users: usersGrowth,
        subscriptions: subscriptionsGrowth,
        revenue: revenueGrowth
      },
      analytics: {
        arpu: Math.round(arpu * 100) / 100, // 2 decimals
        arpuGrowth,
        retentionRate,
        retentionGrowth,
        ltv: Math.round(ltv * 100) / 100, // 2 decimals
        ltvGrowth,
        avgEngagementHours: Math.round(avgEngagementHours * 10) / 10, // 1 decimal
        engagementGrowth,
        conversionFunnel: {
          visitors: totalVisitors,
          trials: trialUsers,
          paid: paidUsers,
          activeSubscribers: paidUsers
        }
      }
    });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
