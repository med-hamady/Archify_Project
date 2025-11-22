import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

const prisma = new PrismaClient();

export const adminContentRouter = express.Router();

// Middleware to check admin role
async function requireAdmin(req: any, res: any, next: any) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

// ==================== SUBJECTS ====================

/**
 * GET /api/admin/content/subjects
 * Liste toutes les matières avec leurs stats
 */
adminContentRouter.get('/subjects', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: { select: { chapters: true } },
        chapters: {
          include: {
            _count: { select: { questions: true } }
          }
        }
      },
      orderBy: [{ semester: 'asc' }, { title: 'asc' }]
    });

    const subjectsWithStats = subjects.map(subject => ({
      id: subject.id,
      title: subject.title,
      description: subject.description,
      semester: subject.semester,
      totalQCM: subject.totalQCM,
      chaptersCount: subject._count.chapters,
      questionsCount: subject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0)
    }));

    return res.json({ success: true, subjects: subjectsWithStats });
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch subjects', details: error.message }
    });
  }
});

/**
 * PUT /api/admin/content/subjects/:id
 * Modifier une matière
 */
adminContentRouter.put('/subjects/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, totalQCM } = req.body;

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(totalQCM !== undefined && { totalQCM })
      }
    });

    console.log(`✅ Subject "${updated.title}" updated by admin ${req.user.email}`);

    return res.json({ success: true, subject: updated });
  } catch (error: any) {
    console.error('Error updating subject:', error);
    return res.status(500).json({
      error: { code: 'UPDATE_ERROR', message: 'Failed to update subject', details: error.message }
    });
  }
});

/**
 * DELETE /api/admin/content/subjects/:id
 * Supprimer une matière (et tous ses chapitres/questions)
 */
adminContentRouter.delete('/subjects/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Récupérer la matière et ses stats avant suppression
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        chapters: {
          include: { _count: { select: { questions: true } } }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Subject not found' }
      });
    }

    const chaptersCount = subject.chapters.length;
    const questionsCount = subject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);

    // Supprimer les questions de tous les chapitres
    for (const chapter of subject.chapters) {
      await prisma.question.deleteMany({ where: { chapterId: chapter.id } });
    }

    // Supprimer tous les chapitres
    await prisma.chapter.deleteMany({ where: { subjectId: id } });

    // Supprimer la matière
    await prisma.subject.delete({ where: { id } });

    console.log(`🗑️ Subject "${subject.title}" deleted by admin ${req.user.email} (${chaptersCount} chapters, ${questionsCount} questions)`);

    return res.json({
      success: true,
      message: `Subject "${subject.title}" deleted successfully`,
      deleted: { chaptersCount, questionsCount }
    });
  } catch (error: any) {
    console.error('Error deleting subject:', error);
    return res.status(500).json({
      error: { code: 'DELETE_ERROR', message: 'Failed to delete subject', details: error.message }
    });
  }
});

// ==================== CHAPTERS ====================

/**
 * GET /api/admin/content/subjects/:subjectId/chapters
 * Liste les chapitres d'une matière
 */
adminContentRouter.get('/subjects/:subjectId/chapters', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { subjectId } = req.params;

    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      include: {
        _count: { select: { questions: true } },
        subchapters: {
          include: { _count: { select: { questions: true } } }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    const chaptersWithStats = chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      orderIndex: ch.orderIndex,
      pdfUrl: ch.pdfUrl,
      questionsCount: ch._count.questions,
      subchaptersCount: ch.subchapters.length,
      subchapters: ch.subchapters.map(sub => ({
        id: sub.id,
        title: sub.title,
        questionsCount: sub._count.questions
      }))
    }));

    return res.json({ success: true, chapters: chaptersWithStats });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return res.status(500).json({
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch chapters', details: error.message }
    });
  }
});

/**
 * PUT /api/admin/content/chapters/:id
 * Modifier un chapitre
 */
adminContentRouter.put('/chapters/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, orderIndex, pdfUrl } = req.body;

    const updated = await prisma.chapter.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(pdfUrl !== undefined && { pdfUrl })
      }
    });

    console.log(`✅ Chapter "${updated.title}" updated by admin ${req.user.email}`);

    return res.json({ success: true, chapter: updated });
  } catch (error: any) {
    console.error('Error updating chapter:', error);
    return res.status(500).json({
      error: { code: 'UPDATE_ERROR', message: 'Failed to update chapter', details: error.message }
    });
  }
});

/**
 * DELETE /api/admin/content/chapters/:id
 * Supprimer un chapitre (et toutes ses questions/sous-chapitres)
 */
adminContentRouter.delete('/chapters/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        _count: { select: { questions: true } },
        subchapters: {
          include: { _count: { select: { questions: true } } }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Chapter not found' }
      });
    }

    const questionsCount = chapter._count.questions;
    const subchaptersCount = chapter.subchapters.length;
    const subchapterQuestionsCount = chapter.subchapters.reduce((sum, sub) => sum + sub._count.questions, 0);

    // Supprimer les questions des sous-chapitres
    for (const sub of chapter.subchapters) {
      await prisma.question.deleteMany({ where: { subchapterId: sub.id } });
    }

    // Supprimer les sous-chapitres
    await prisma.subchapter.deleteMany({ where: { chapterId: id } });

    // Supprimer les questions du chapitre
    await prisma.question.deleteMany({ where: { chapterId: id } });

    // Supprimer le chapitre
    await prisma.chapter.delete({ where: { id } });

    console.log(`🗑️ Chapter "${chapter.title}" deleted by admin ${req.user.email}`);

    return res.json({
      success: true,
      message: `Chapter "${chapter.title}" deleted successfully`,
      deleted: { questionsCount, subchaptersCount, subchapterQuestionsCount }
    });
  } catch (error: any) {
    console.error('Error deleting chapter:', error);
    return res.status(500).json({
      error: { code: 'DELETE_ERROR', message: 'Failed to delete chapter', details: error.message }
    });
  }
});

/**
 * POST /api/admin/content/subjects/:subjectId/chapters
 * Créer un nouveau chapitre
 */
adminContentRouter.post('/subjects/:subjectId/chapters', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    const { title, description, orderIndex, pdfUrl } = req.body;

    if (!title) {
      return res.status(400).json({
        error: { code: 'INVALID_DATA', message: 'Title is required' }
      });
    }

    // Trouver le prochain orderIndex si non fourni
    let newOrderIndex = orderIndex;
    if (newOrderIndex === undefined) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { subjectId },
        orderBy: { orderIndex: 'desc' }
      });
      newOrderIndex = lastChapter ? lastChapter.orderIndex + 1 : 0;
    }

    const chapter = await prisma.chapter.create({
      data: {
        title,
        description: description || null,
        orderIndex: newOrderIndex,
        pdfUrl: pdfUrl || null,
        subjectId
      }
    });

    console.log(`✨ Chapter "${chapter.title}" created by admin ${req.user.email}`);

    return res.json({ success: true, chapter });
  } catch (error: any) {
    console.error('Error creating chapter:', error);
    return res.status(500).json({
      error: { code: 'CREATE_ERROR', message: 'Failed to create chapter', details: error.message }
    });
  }
});

// ==================== QUESTIONS ====================

/**
 * GET /api/admin/content/chapters/:chapterId/questions
 * Liste les questions d'un chapitre
 */
adminContentRouter.get('/chapters/:chapterId/questions', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { chapterId } = req.params;

    const questions = await prisma.question.findMany({
      where: { chapterId },
      orderBy: { orderIndex: 'asc' }
    });

    return res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch questions', details: error.message }
    });
  }
});

/**
 * PUT /api/admin/content/questions/:id
 * Modifier une question
 */
adminContentRouter.put('/questions/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { questionText, options, explanation, orderIndex } = req.body;

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(questionText && { questionText }),
        ...(options && { options }),
        ...(explanation !== undefined && { explanation }),
        ...(orderIndex !== undefined && { orderIndex })
      }
    });

    console.log(`✅ Question updated by admin ${req.user.email}`);

    return res.json({ success: true, question: updated });
  } catch (error: any) {
    console.error('Error updating question:', error);
    return res.status(500).json({
      error: { code: 'UPDATE_ERROR', message: 'Failed to update question', details: error.message }
    });
  }
});

/**
 * DELETE /api/admin/content/questions/:id
 * Supprimer une question
 */
adminContentRouter.delete('/questions/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({ where: { id } });

    if (!question) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    await prisma.question.delete({ where: { id } });

    console.log(`🗑️ Question deleted by admin ${req.user.email}`);

    return res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return res.status(500).json({
      error: { code: 'DELETE_ERROR', message: 'Failed to delete question', details: error.message }
    });
  }
});

/**
 * POST /api/admin/content/chapters/:chapterId/questions
 * Créer une nouvelle question
 */
adminContentRouter.post('/chapters/:chapterId/questions', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { chapterId } = req.params;
    const { questionText, options, explanation, orderIndex } = req.body;

    if (!questionText || !options || !Array.isArray(options)) {
      return res.status(400).json({
        error: { code: 'INVALID_DATA', message: 'questionText and options array are required' }
      });
    }

    // Trouver le prochain orderIndex si non fourni
    let newOrderIndex = orderIndex;
    if (newOrderIndex === undefined) {
      const lastQuestion = await prisma.question.findFirst({
        where: { chapterId },
        orderBy: { orderIndex: 'desc' }
      });
      newOrderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;
    }

    const question = await prisma.question.create({
      data: {
        questionText,
        options,
        explanation: explanation || null,
        orderIndex: newOrderIndex,
        chapterId
      }
    });

    console.log(`✨ Question created by admin ${req.user.email}`);

    return res.json({ success: true, question });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return res.status(500).json({
      error: { code: 'CREATE_ERROR', message: 'Failed to create question', details: error.message }
    });
  }
});

// ==================== SUBCHAPTERS ====================

/**
 * PUT /api/admin/content/subchapters/:id
 * Modifier un sous-chapitre
 */
adminContentRouter.put('/subchapters/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, orderIndex } = req.body;

    const updated = await prisma.subchapter.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex })
      }
    });

    console.log(`✅ Subchapter "${updated.title}" updated by admin ${req.user.email}`);

    return res.json({ success: true, subchapter: updated });
  } catch (error: any) {
    console.error('Error updating subchapter:', error);
    return res.status(500).json({
      error: { code: 'UPDATE_ERROR', message: 'Failed to update subchapter', details: error.message }
    });
  }
});

/**
 * DELETE /api/admin/content/subchapters/:id
 * Supprimer un sous-chapitre
 */
adminContentRouter.delete('/subchapters/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const subchapter = await prisma.subchapter.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } }
    });

    if (!subchapter) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Subchapter not found' }
      });
    }

    const questionsCount = subchapter._count.questions;

    // Supprimer les questions du sous-chapitre
    await prisma.question.deleteMany({ where: { subchapterId: id } });

    // Supprimer le sous-chapitre
    await prisma.subchapter.delete({ where: { id } });

    console.log(`🗑️ Subchapter "${subchapter.title}" deleted by admin ${req.user.email}`);

    return res.json({
      success: true,
      message: `Subchapter "${subchapter.title}" deleted successfully`,
      deleted: { questionsCount }
    });
  } catch (error: any) {
    console.error('Error deleting subchapter:', error);
    return res.status(500).json({
      error: { code: 'DELETE_ERROR', message: 'Failed to delete subchapter', details: error.message }
    });
  }
});
