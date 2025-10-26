/**
 * Subjects Routes - FacGame
 *
 * Routes pour la gestion des matières (Anatomie, Histologie, Physiologie) :
 * - Liste des matières avec progression
 * - Détails d'une matière
 * - CRUD admin
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';
import { getUserSubjectsProgress, getSubjectProgress } from '../services/progress.service';

const prisma = new PrismaClient();
export const subjectsRouter = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createSubjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  semester: z.string(),
  tags: z.array(z.string()).optional(),
  totalQCM: z.number().int().positive().default(600)
});

const updateSubjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  semester: z.string().optional(),
  tags: z.array(z.string()).optional(),
  totalQCM: z.number().int().positive().optional()
});

// ============================================
// STUDENT ROUTES
// ============================================

/**
 * GET /api/subjects
 * Liste toutes les matières avec la progression de l'utilisateur
 */
subjectsRouter.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    // Récupérer le niveau de l'utilisateur (PCEM1 ou PCEM2)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { semester: true, email: true }
    });

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
      });
    }

    console.log(`[subjects/] User ${user.email} with semester: "${user.semester}"`);

    // Récupérer uniquement les matières du niveau de l'utilisateur
    const subjects = await prisma.subject.findMany({
      where: {
        semester: user.semester // Filtre par PCEM1 ou PCEM2
      },
      orderBy: { title: 'asc' },
      include: {
        chapters: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`[subjects/] Found ${subjects.length} subjects for semester "${user.semester}"`);
    if (subjects.length > 0) {
      console.log(`[subjects/] Subjects: ${subjects.map(s => `${s.title} (${s.semester})`).join(', ')}`);
    }

    // Récupérer la progression de l'utilisateur
    const progressData = await getUserSubjectsProgress(userId);

    // Mapper les données
    const subjectsWithProgress = subjects.map(subject => {
      const progress = progressData.find(p => p.subjectId === subject.id);

      return {
        id: subject.id,
        title: subject.title,
        description: subject.description,
        semester: subject.semester,
        tags: subject.tags,
        totalQCM: subject.totalQCM,
        chaptersCount: subject.chapters.length,
        progress: progress ? {
          questionsAnswered: progress.questionsAnswered,
          progressPercent: progress.progressPercent,
          chaptersCompleted: progress.chaptersCompleted,
          chaptersTotal: progress.chaptersTotal,
          challengeUnlocked: progress.challengeUnlockedGlobal
        } : {
          questionsAnswered: 0,
          progressPercent: 0,
          chaptersCompleted: 0,
          chaptersTotal: subject.chapters.length,
          challengeUnlocked: false
        }
      };
    });

    return res.json({ subjects: subjectsWithProgress });

  } catch (error) {
    console.error('[subjects/] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/subjects/:id
 * Détails d'une matière avec chapitres et progression
 */
subjectsRouter.get('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              select: {
                id: true,
                difficulty: true
              }
            },
            chapterProgresses: {
              where: { userId },
              select: {
                questionsAnswered: true,
                questionsCorrect: true,
                progressPercent: true,
                challengeUnlocked: true,
                examUnlocked: true
              }
            }
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        error: { code: 'SUBJECT_NOT_FOUND', message: 'Subject not found' }
      });
    }

    // Récupérer la progression globale
    const subjectProgress = await getSubjectProgress(userId, id);

    // Mapper les chapitres avec leur progression
    const chaptersWithProgress = subject.chapters.map(chapter => {
      const progress = chapter.chapterProgresses[0];

      return {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        orderIndex: chapter.orderIndex,
        pdfUrl: chapter.pdfUrl,
        questionsCount: chapter.questions.length,
        progress: progress ? {
          questionsAnswered: progress.questionsAnswered,
          questionsCorrect: progress.questionsCorrect,
          progressPercent: progress.progressPercent,
          challengeUnlocked: progress.challengeUnlocked,
          examUnlocked: progress.examUnlocked
        } : {
          questionsAnswered: 0,
          questionsCorrect: 0,
          progressPercent: 0,
          challengeUnlocked: false,
          examUnlocked: false
        }
      };
    });

    return res.json({
      subject: {
        id: subject.id,
        title: subject.title,
        description: subject.description,
        semester: subject.semester,
        tags: subject.tags,
        totalQCM: subject.totalQCM,
        createdAt: subject.createdAt,
        chapters: chaptersWithProgress,
        progress: subjectProgress ? {
          questionsAnswered: subjectProgress.questionsAnswered,
          progressPercent: subjectProgress.progressPercent,
          chaptersCompleted: subjectProgress.chaptersCompleted,
          chaptersTotal: subjectProgress.chaptersTotal,
          challengeUnlocked: subjectProgress.challengeUnlockedGlobal
        } : null
      }
    });

  } catch (error) {
    console.error('[subjects/:id] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * POST /api/subjects
 * Créer une nouvelle matière (admin uniquement)
 */
subjectsRouter.post('/', requireAuth, async (req: any, res: any) => {
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

    const data = createSubjectSchema.parse(req.body);

    const subject = await prisma.subject.create({
      data: {
        title: data.title,
        description: data.description,
        semester: data.semester,
        tags: data.tags || [],
        totalQCM: data.totalQCM
      }
    });

    return res.status(201).json({ subject });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
      });
    }
    console.error('[subjects/create] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * PUT /api/subjects/:id
 * Mettre à jour une matière (admin uniquement)
 */
subjectsRouter.put('/:id', requireAuth, async (req: any, res: any) => {
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

    const data = updateSubjectSchema.parse(req.body);

    const subject = await prisma.subject.update({
      where: { id },
      data
    });

    return res.json({ subject });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
      });
    }
    console.error('[subjects/update] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * DELETE /api/subjects/:id
 * Supprimer une matière (admin uniquement)
 */
subjectsRouter.delete('/:id', requireAuth, async (req: any, res: any) => {
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

    await prisma.subject.delete({
      where: { id }
    });

    return res.status(204).send();

  } catch (error) {
    console.error('[subjects/delete] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});
