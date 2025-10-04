import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const lessonsRouter = Router();

// Schemas
const lessonCreateSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(1),
  type: z.enum(['video', 'pdf', 'exam']),
  durationSec: z.number().int().min(0).default(0),
  vimeoId: z.string().optional(),
  youtubeId: z.string().optional(),
  pdfUrl: z.string().url().optional(),
  isPremium: z.boolean().default(false),
  orderIndex: z.number().int().min(0).default(0)
});

const lessonUpdateSchema = lessonCreateSchema.partial().omit({ courseId: true });

const commentCreateSchema = z.object({
  content: z.string().min(1).max(1000)
});

// GET /lessons/:id - Get lesson details
lessonsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPremium: true,
            department: {
              select: { name: true }
            }
          }
        },
        lessonAssets: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          where: { status: 'visible' },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { comments: true }
        }
      }
    });
    
    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }
    
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
      createdAt: lesson.createdAt,
      course: lesson.course,
      assets: lesson.lessonAssets,
      comments: lesson.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          avatar: comment.user.avatarUrl
        }
      })),
      commentCount: lesson._count.comments
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /lessons - Create lesson (admin only)
lessonsRouter.post('/', requireAuth, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    
    const body = lessonCreateSchema.parse(req.body);
    
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: body.courseId }
    });
    
    if (!course) {
      return res.status(400).json({ error: { code: 'INVALID_COURSE', message: 'Course not found' } });
    }
    
    const lesson = await prisma.lesson.create({
      data: body,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPremium: true,
            department: {
              select: { name: true }
            }
          }
        },
        lessonAssets: true
      }
    });
    
    res.status(201).json({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      durationSec: lesson.durationSec,
      vimeoId: lesson.vimeoId,
      youtubeId: lesson.youtubeId,
      pdfUrl: lesson.pdfUrl,
      isPremium: lesson.isPremium,
      orderIndex: lesson.orderIndex,
      createdAt: lesson.createdAt,
      course: lesson.course,
      assets: lesson.lessonAssets
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// PUT /lessons/:id - Update lesson (admin only)
lessonsRouter.put('/:id', requireAuth, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    
    const { id } = req.params;
    const body = lessonUpdateSchema.parse(req.body);
    
    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({ where: { id } });
    if (!existingLesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }
    
    const lesson = await prisma.lesson.update({
      where: { id },
      data: body,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPremium: true,
            department: {
              select: { name: true }
            }
          }
        },
        lessonAssets: true
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
      createdAt: lesson.createdAt,
      course: lesson.course,
      assets: lesson.lessonAssets
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// DELETE /lessons/:id - Delete lesson (admin only)
lessonsRouter.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    
    const { id } = req.params;
    
    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }
    
    await prisma.lesson.delete({ where: { id } });
    
    res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /lessons/:id/comments - Add comment to lesson
lessonsRouter.post('/:id/comments', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = commentCreateSchema.parse(req.body);
    
    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }
    
    const comment = await prisma.comment.create({
      data: {
        lessonId: id,
        userId: req.userId,
        content: body.content
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
    
    res.status(201).json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: comment.user.avatarUrl
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /lessons/:id/comments - Get lesson comments
lessonsRouter.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          lessonId: id,
          status: 'visible'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.comment.count({
        where: { 
          lessonId: id,
          status: 'visible'
        }
      })
    ]);
    
    res.json({
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          avatar: comment.user.avatarUrl
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /lessons/:id/progress - Update lesson progress
lessonsRouter.post('/:id/progress', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'viewed' or 'in_progress'
    
    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }
    
    // Check if progress already exists
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId: req.userId,
        lessonId: id
      }
    });

    let progress;
    if (existingProgress) {
      // Update existing progress
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          status: status || 'in_progress'
        }
      });
    } else {
      // Create new progress
      progress = await prisma.progress.create({
        data: {
          userId: req.userId,
          lessonId: id,
          status: status || 'in_progress'
        }
      });
    }
    
    res.json({
      id: progress.id,
      status: progress.status,
      updatedAt: progress.updatedAt
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /lessons/:id/progress - Get lesson progress
lessonsRouter.get('/:id/progress', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const progress = await prisma.progress.findFirst({
      where: {
        userId: req.userId,
        lessonId: id
      }
    });
    
    res.json({
      status: progress?.status || 'not_started',
      updatedAt: progress?.updatedAt || null
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
