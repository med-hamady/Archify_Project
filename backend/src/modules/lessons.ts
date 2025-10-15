import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const lessonsRouter = Router();


// Schemas
const lessonQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  courseId: z.string().optional(),
  type: z.enum(['VIDEO', 'PDF', 'EXAM']).optional(),
  isPremium: z.string().optional().transform(val => val === 'true')
});

const lessonCreateSchema = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1), // Changed from uuid() to min(1) to accept CUIDs
  type: z.enum(['VIDEO', 'PDF', 'EXAM']),
  durationSec: z.number().int().min(0).default(0),
  vimeoId: z.string().optional(),
  youtubeId: z.string().optional(),
  pdfUrl: z.string().optional(), // Removed .url() validation to allow empty strings
  // Video upload fields
  videoUrl: z.string().optional(),
  videoSize: z.number().int().min(0).optional(),
  videoType: z.string().optional(),
  uploadedAt: z.date().optional(),
  isPremium: z.boolean().default(true), // ✅ Premium by default
  requiresVideoSubscription: z.boolean().default(false),
  requiresDocumentSubscription: z.boolean().default(false),
  orderIndex: z.number().int().min(0).default(0)
});

const lessonUpdateSchema = lessonCreateSchema.partial();

// Helper to format lesson data for public view
function getLessonPublic(lesson: any) {
  return {
    id: lesson.id,
    title: lesson.title,
    courseId: lesson.courseId,
    type: lesson.type,
    durationSec: lesson.durationSec,
    vimeoId: lesson.vimeoId,
    youtubeId: lesson.youtubeId,
    pdfUrl: lesson.pdfUrl,
    // Video upload fields
    videoUrl: lesson.videoUrl,
    videoSize: lesson.videoSize,
    videoType: lesson.videoType,
    uploadedAt: lesson.uploadedAt,
    isPremium: lesson.isPremium,
    requiresVideoSubscription: lesson.requiresVideoSubscription,
    requiresDocumentSubscription: lesson.requiresDocumentSubscription,
    orderIndex: lesson.orderIndex,
    createdAt: lesson.createdAt,
    lessonAssets: lesson.lessonAssets || []
  };
}

// GET /lessons - List lessons with filtering and pagination
lessonsRouter.get('/', async (req, res) => {
  try {
    const query = lessonQuerySchema.parse(req.query);
    const { page, limit, courseId, type, isPremium } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (type) {
      where.type = type;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          lessonAssets: true,
          course: { select: { title: true } }
        },
        orderBy: [
          { courseId: 'asc' },
          { orderIndex: 'asc' },
          { createdAt: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.lesson.count({ where })
    ]);

    const response = {
      lessons: lessons.map(getLessonPublic),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return res.json(response);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error fetching lessons:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /lessons/:id - Get a single lesson with assets
lessonsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        lessonAssets: true,
        course: {
          select: {
            id: true,
            title: true,
          }
        },
        comments: {
          where: { status: 'VISIBLE' },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }

    // ALL VIDEO LESSONS REQUIRE SUBSCRIPTION (except for admins)
    if (lesson.type === 'VIDEO') {
      // Try to get user from token (optional authentication)
      const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
      let hasAccess = false;
      let isAdmin = false;

      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
          const decoded: any = jwt.verify(token, JWT_SECRET);

          // Check if user is admin (bypass subscription check)
          const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            include: {
              subscriptions: {
                where: {
                  status: 'ACTIVE',
                  endAt: { gt: new Date() }
                },
                include: { plan: true }
              }
            }
          });

          if (user) {
            // Admin bypass - admins can access all content
            if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
              isAdmin = true;
              hasAccess = true;
            } else if (user.subscriptions.length > 0) {
              // Check if user has PREMIUM subscription
              const subscription = user.subscriptions[0];
              if (subscription.plan.type === 'PREMIUM') {
                hasAccess = true;
              }
            }
          }
        } catch (error) {
          // Token invalid, no access
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'Video content requires an active subscription'
          },
          lesson: {
            id: lesson.id,
            title: lesson.title,
            isPremium: true,
            requiresSubscription: true,
            type: lesson.type
          }
        });
      }
    } else if (lesson.isPremium && (lesson.type === 'PDF' || lesson.type === 'EXAM')) {
      // Documents only require subscription if marked as premium
      const token = req.cookies?.access_token || (req.headers.authorization?.split(' ')[1] ?? '');
      let hasAccess = false;

      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
          const decoded: any = jwt.verify(token, JWT_SECRET);

          const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            include: {
              subscriptions: {
                where: {
                  status: 'ACTIVE',
                  endAt: { gt: new Date() }
                },
                include: { plan: true }
              }
            }
          });

          if (user) {
            if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
              hasAccess = true;
            } else if (user.subscriptions.length > 0) {
              const subscription = user.subscriptions[0];
              if (subscription.plan.type === 'PREMIUM') {
                hasAccess = true;
              }
            }
          }
        } catch (error) {
          // Token invalid, no access
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'Premium document content requires an active subscription'
          },
          lesson: {
            id: lesson.id,
            title: lesson.title,
            isPremium: true,
            requiresSubscription: true,
            type: lesson.type
          }
        });
      }
    }

    return res.json(getLessonPublic(lesson));
  } catch (err: any) {
    console.error('Error fetching lesson:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /lessons/:id/assets - Get lesson assets
lessonsRouter.get('/:id/assets', async (req, res) => {
  try {
    const { id } = req.params;

    const assets = await prisma.lessonAsset.findMany({
      where: { lessonId: id },
      orderBy: { title: 'asc' }
    });

    res.json(assets);
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /lessons - Create a new lesson (Admin only)
lessonsRouter.post('/', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
  }

  try {
    const body = lessonCreateSchema.parse(req.body);

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      select: { id: true }
    });

    if (!course) {
      return res.status(404).json({ error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } });
    }

    const lesson = await prisma.lesson.create({
      data: body,
      include: {
        lessonAssets: true,
        course: { select: { title: true } }
      }
    });

    return res.status(201).json(lesson);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error creating lesson:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// PUT /lessons/:id - Update a lesson (Admin only)
lessonsRouter.put('/:id', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
  }

  try {
    const { id } = req.params;
    const body = lessonUpdateSchema.parse(req.body);

    const lesson = await prisma.lesson.update({
      where: { id },
      data: body,
      include: {
        lessonAssets: true,
        course: { select: { title: true } }
      }
    });

    return res.json(lesson);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error updating lesson:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// DELETE /lessons/:id - Delete a lesson (Admin only)
lessonsRouter.delete('/:id', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
  }

  try {
    const { id } = req.params;

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!lesson) {
      return res.status(404).json({ error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found' } });
    }

    // Delete related data first (in correct order to avoid foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete lesson assets
      await tx.lessonAsset.deleteMany({
        where: { lessonId: id }
      });

      // Delete comments
      await tx.comment.deleteMany({
        where: { lessonId: id }
      });

      // Delete progress records
      await tx.progress.deleteMany({
        where: { lessonId: id }
      });

      // Delete quiz answers first (due to foreign key constraints)
      await tx.quizAnswer.deleteMany({
        where: { 
          questionId: {
            in: await tx.quizQuestion.findMany({
              where: { quiz: { lessonId: id } },
              select: { id: true }
            }).then(questions => questions.map(q => q.id))
          }
        }
      });

      // Delete quiz questions
      await tx.quizQuestion.deleteMany({
        where: { quiz: { lessonId: id } }
      });

      // Delete quizzes
      await tx.quiz.deleteMany({
        where: { lessonId: id }
      });

      // Finally delete the lesson
      await tx.lesson.delete({
        where: { id }
      });
    });

    return res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting lesson:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /lessons/:id/view - Track lesson view (Authenticated users with subscription)
lessonsRouter.post('/:id/view', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found' } });
    }

    // Check if user has active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE',
        endAt: { gt: new Date() }
      },
      include: { plan: true }
    });

    if (!activeSubscription) {
      return res.status(403).json({ 
        error: { 
          code: 'SUBSCRIPTION_REQUIRED', 
          message: 'Active subscription required to view lesson content' 
        } 
      });
    }

    // Check if lesson is premium (only premium lessons count views)
    if (!lesson.isPremium) {
      return res.status(400).json({ 
        error: { 
          code: 'NOT_PREMIUM_LESSON', 
          message: 'View tracking only applies to premium lessons' 
        } 
      });
    }

    // Check if user has already viewed this lesson (prevent duplicate views)
    const existingView = await prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: id
        }
      }
    });

    if (existingView) {
      // User has already viewed this lesson, don't increment view count
      return res.json({ 
        message: 'View already tracked', 
        viewCount: lesson.views 
      });
    }

    // Increment lesson view count and create progress record
    await prisma.$transaction(async (tx) => {
      // Increment lesson view count
      await tx.lesson.update({
        where: { id },
        data: { views: { increment: 1 } }
      });

      // Create progress record
      await tx.progress.create({
        data: {
          userId: userId,
          lessonId: id,
          status: 'VIEWED'
        }
      });
    });

    return res.json({ 
      message: 'View tracked successfully', 
      viewCount: lesson.views + 1 
    });

  } catch (err: any) {
    console.error('Error tracking lesson view:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /lessons/:id/progress - Update lesson progress (Authenticated users)
lessonsRouter.post('/:id/progress', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['viewed', 'in_progress'].includes(status)) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Invalid status' } });
    }

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true, isPremium: true }
    });

    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }

    // Check if user has access to premium content
    if (lesson.isPremium) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { subscriptions: { where: { status: 'ACTIVE' } } }
      });

      if (!user || user.subscriptions.length === 0) {
        return res.status(403).json({ error: { code: 'PREMIUM_REQUIRED', message: 'Premium subscription required' } });
      }
    }

    // Update or create progress record
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId: req.userId,
        lessonId: id
      }
    });

    let progress;
    if (existingProgress) {
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: { status: status as any }
      });
    } else {
      progress = await prisma.progress.create({
        data: {
          userId: req.userId,
          lessonId: id,
          status: status as any
        }
      });
    }

    return res.json(progress);
  } catch (err: any) {
    console.error('Error updating progress:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
