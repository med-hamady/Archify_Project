import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const commentsRouter = Router();

// Schemas
const commentCreateSchema = z.object({
  content: z.string().min(1).max(1000),
});

const commentUpdateSchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  status: z.enum(['visible', 'hidden', 'reported']).optional(),
});

// GET /lessons/:id/comments - Get comments for a lesson
commentsRouter.get('/lessons/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          lessonId: id,
          status: 'VISIBLE'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.comment.count({
        where: {
          lessonId: id,
          status: 'VISIBLE'
        }
      })
    ]);

    res.json({
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        user: comment.user,
        lessonId: comment.lessonId
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /lessons/:id/comments - Create a new comment
commentsRouter.post('/lessons/:id/comments', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = commentCreateSchema.parse(req.body);

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true, title: true }
    });

    if (!lesson) {
      return res.status(404).json({ error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found' } });
    }

    // Check if user has access to comment (basic check - user must be authenticated)
    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        lessonId: id,
        userId: req.userId,
        status: 'VISIBLE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.status(201).json({
      id: comment.id,
      content: comment.content,
      status: comment.status,
      createdAt: comment.createdAt,
      user: comment.user,
      lessonId: comment.lessonId
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error creating comment:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// PUT /comments/:id - Update a comment (Author or Admin only)
commentsRouter.put('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = commentUpdateSchema.parse(req.body);

    // Get the comment to check ownership
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!comment) {
      return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
    }

    // Check if user is the author or an admin
    if (comment.userId !== req.userId && req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Can only edit your own comments' } });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        ...body,
        status: body.status === 'visible' ? 'VISIBLE' : body.status === 'hidden' ? 'HIDDEN' : body.status === 'reported' ? 'REPORTED' : body.status
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.json({
      id: updatedComment.id,
      content: updatedComment.content,
      status: updatedComment.status,
      createdAt: updatedComment.createdAt,
      user: updatedComment.user,
      lessonId: updatedComment.lessonId
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error updating comment:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// DELETE /comments/:id - Delete a comment (Author or Admin only)
commentsRouter.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Get the comment to check ownership
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!comment) {
      return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
    }

    // Check if user is the author or an admin
    if (comment.userId !== req.userId && req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Can only delete your own comments' } });
    }

    await prisma.comment.delete({ where: { id } });

    res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /comments/:id/report - Report a comment (Authenticated users)
commentsRouter.post('/:id/report', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Get the comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!comment) {
      return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
    }

    // Users cannot report their own comments
    if (comment.userId === req.userId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot report your own comment' } });
    }

    // Update comment status to reported
    await prisma.comment.update({
      where: { id },
      data: { status: 'REPORTED' }
    });

    res.json({ message: 'Comment reported successfully' });
  } catch (err: any) {
    console.error('Error reporting comment:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /admin/comments - Get all comments for moderation (Admin only)
commentsRouter.get('/admin/comments', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }

  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          lesson: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    res.json({
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        user: comment.user,
        lesson: comment.lesson,
        course: comment.lesson.course
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Error fetching comments for moderation:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// PUT /admin/comments/:id/moderate - Moderate a comment (Admin only)
commentsRouter.put('/admin/comments/:id/moderate', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }

  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve', 'hide', 'delete'

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
    }

    let updateData: any = {};

    switch (action) {
      case 'approve':
        updateData.status = 'visible';
        break;
      case 'hide':
        updateData.status = 'hidden';
        break;
      case 'delete':
        await prisma.comment.delete({ where: { id } });
        return res.json({ message: 'Comment deleted successfully' });
      default:
        return res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Invalid moderation action' } });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      id: updatedComment.id,
      content: updatedComment.content,
      status: updatedComment.status,
      createdAt: updatedComment.createdAt,
      user: updatedComment.user,
      lessonId: updatedComment.lessonId
    });
  } catch (err: any) {
    console.error('Error moderating comment:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
