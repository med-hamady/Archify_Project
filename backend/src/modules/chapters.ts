/**
 * Chapters Routes - FacGame
 *
 * Routes pour la gestion des chapitres :
 * - Détails d'un chapitre
 * - CRUD admin
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';
import { getChapterProgress } from '../services/progress.service';

const prisma = new PrismaClient();
export const chaptersRouter = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createChapterSchema = z.object({
  subjectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  pdfUrl: z.string().url().optional(),
  orderIndex: z.number().int().nonnegative().optional()
});

const updateChapterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  pdfUrl: z.string().url().optional().nullable(),
  orderIndex: z.number().int().nonnegative().optional()
});

// ============================================
// STUDENT ROUTES
// ============================================

/**
 * GET /api/chapters/:id
 * Détails d'un chapitre avec questions et progression
 */
chaptersRouter.get('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            title: true
          }
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            orderIndex: true
          }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({
        error: { code: 'CHAPTER_NOT_FOUND', message: 'Chapter not found' }
      });
    }

    // Récupérer la progression
    const progress = await getChapterProgress(userId, id);

    return res.json({
      chapter: {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        pdfUrl: chapter.pdfUrl,
        orderIndex: chapter.orderIndex,
        subject: chapter.subject,
        questionsCount: chapter.questions.length,
        progress
      }
    });

  } catch (error) {
    console.error('[chapters/:id] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * POST /api/chapters
 * Créer un nouveau chapitre (admin uniquement)
 */
chaptersRouter.post('/', requireAuth, async (req: any, res: any) => {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const data = createChapterSchema.parse(req.body);

    // Si orderIndex n'est pas fourni, le mettre à la fin
    let orderIndex = data.orderIndex;
    if (orderIndex === undefined) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { subjectId: data.subjectId },
        orderBy: { orderIndex: 'desc' }
      });
      orderIndex = lastChapter ? lastChapter.orderIndex + 1 : 0;
    }

    const chapter = await prisma.chapter.create({
      data: {
        subjectId: data.subjectId,
        title: data.title,
        description: data.description,
        pdfUrl: data.pdfUrl,
        orderIndex
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.status(201).json({ chapter });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
      });
    }
    console.error('[chapters/create] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * PUT /api/chapters/:id
 * Mettre à jour un chapitre (admin uniquement)
 */
chaptersRouter.put('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const data = updateChapterSchema.parse(req.body);

    const chapter = await prisma.chapter.update({
      where: { id },
      data,
      include: {
        subject: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.json({ chapter });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
      });
    }
    console.error('[chapters/update] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * DELETE /api/chapters/:id
 * Supprimer un chapitre (admin uniquement)
 */
chaptersRouter.delete('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    // Supprimer le chapitre (cascade delete des questions)
    await prisma.chapter.delete({
      where: { id }
    });

    return res.status(204).send();

  } catch (error) {
    console.error('[chapters/delete] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});
