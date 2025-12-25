import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireLevelAdmin, getSemesterFilter, canAccessSemester } from './auth';

const prisma = new PrismaClient();

export const adminContentRouter = express.Router();

// Helper pour vérifier l'accès à un subject via son semester
async function checkSubjectAccess(req: any, res: any, subjectId: string): Promise<boolean> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { semester: true }
  });

  if (!subject) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Subject not found' }
    });
    return false;
  }

  if (!canAccessSemester(req, subject.semester)) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Vous n\'avez pas accès à ce niveau' }
    });
    return false;
  }

  return true;
}

// Helper pour vérifier l'accès à un chapter via son subject
async function checkChapterAccess(req: any, res: any, chapterId: string): Promise<boolean> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { subject: { select: { semester: true } } }
  });

  if (!chapter) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Chapter not found' }
    });
    return false;
  }

  if (!canAccessSemester(req, chapter.subject.semester)) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Vous n\'avez pas accès à ce niveau' }
    });
    return false;
  }

  return true;
}

// ==================== SUBJECTS ====================

/**
 * GET /api/admin/content/subjects
 * Liste les matières avec leurs stats (filtrées par niveau pour Level Admin)
 */
adminContentRouter.get('/subjects', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const semesterFilter = getSemesterFilter(req);

    const subjects = await prisma.subject.findMany({
      where: semesterFilter,
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
 * Modifier une matière (vérification d'accès au niveau)
 */
adminContentRouter.put('/subjects/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, totalQCM } = req.body;

    // Vérifier l'accès au niveau de cette matière
    if (!await checkSubjectAccess(req, res, id)) return;

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(totalQCM !== undefined && { totalQCM })
      }
    });

    console.log(`Subject "${updated.title}" updated by admin ${req.userId}`);

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
 * Supprimer une matière (et tous ses chapitres/questions) - vérification d'accès au niveau
 */
adminContentRouter.delete('/subjects/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès au niveau de cette matière
    if (!await checkSubjectAccess(req, res, id)) return;

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

    console.log(`Subject "${subject.title}" deleted by admin ${req.userId} (${chaptersCount} chapters, ${questionsCount} questions)`);

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
 * Liste les chapitres d'une matière (vérification d'accès au niveau)
 */
adminContentRouter.get('/subjects/:subjectId/chapters', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { subjectId } = req.params;

    // Vérifier l'accès au niveau de cette matière
    if (!await checkSubjectAccess(req, res, subjectId)) return;

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
 * Modifier un chapitre (vérification d'accès au niveau)
 */
adminContentRouter.put('/chapters/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, orderIndex, pdfUrl } = req.body;

    // Vérifier l'accès au niveau via le subject parent
    if (!await checkChapterAccess(req, res, id)) return;

    const updated = await prisma.chapter.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(pdfUrl !== undefined && { pdfUrl })
      }
    });

    console.log(`Chapter "${updated.title}" updated by admin ${req.userId}`);

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
 * Supprimer un chapitre (et toutes ses questions/sous-chapitres) - vérification d'accès au niveau
 */
adminContentRouter.delete('/chapters/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès au niveau via le subject parent
    if (!await checkChapterAccess(req, res, id)) return;

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

    console.log(`Chapter "${chapter.title}" deleted by admin ${req.userId}`);

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
 * Créer un nouveau chapitre (vérification d'accès au niveau)
 */
adminContentRouter.post('/subjects/:subjectId/chapters', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    const { title, description, orderIndex, pdfUrl } = req.body;

    // Vérifier l'accès au niveau de cette matière
    if (!await checkSubjectAccess(req, res, subjectId)) return;

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

    console.log(`Chapter "${chapter.title}" created by admin ${req.userId}`);

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
 * Liste les questions d'un chapitre (vérification d'accès au niveau)
 */
adminContentRouter.get('/chapters/:chapterId/questions', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { chapterId } = req.params;

    // Vérifier l'accès au niveau via le chapter
    if (!await checkChapterAccess(req, res, chapterId)) return;

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
 * Modifier une question (vérification d'accès au niveau via chapter)
 */
adminContentRouter.put('/questions/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { questionText, options, explanation, orderIndex } = req.body;

    // Récupérer la question pour vérifier l'accès
    const question = await prisma.question.findUnique({
      where: { id },
      select: { chapterId: true }
    });
    if (!question) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Question not found' } });
    }
    if (!await checkChapterAccess(req, res, question.chapterId)) return;

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(questionText && { questionText }),
        ...(options && { options }),
        ...(explanation !== undefined && { explanation }),
        ...(orderIndex !== undefined && { orderIndex })
      }
    });

    console.log(`Question updated by admin ${req.userId}`);

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
 * Supprimer une question (vérification d'accès au niveau via chapter)
 */
adminContentRouter.delete('/questions/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      select: { id: true, chapterId: true }
    });

    if (!question) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    // Vérifier l'accès au niveau via le chapter
    if (!await checkChapterAccess(req, res, question.chapterId)) return;

    await prisma.question.delete({ where: { id } });

    console.log(`Question deleted by admin ${req.userId}`);

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
 * Créer une nouvelle question (vérification d'accès au niveau via chapter)
 */
adminContentRouter.post('/chapters/:chapterId/questions', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { chapterId } = req.params;
    const { questionText, options, explanation, orderIndex } = req.body;

    // Vérifier l'accès au niveau via le chapter
    if (!await checkChapterAccess(req, res, chapterId)) return;

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

    console.log(`Question created by admin ${req.userId}`);

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
 * Modifier un sous-chapitre (vérification d'accès au niveau via chapter)
 */
adminContentRouter.put('/subchapters/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, orderIndex } = req.body;

    // Récupérer le sous-chapitre pour vérifier l'accès
    const subchapter = await prisma.subchapter.findUnique({
      where: { id },
      select: { chapterId: true }
    });
    if (!subchapter) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Subchapter not found' } });
    }
    if (!await checkChapterAccess(req, res, subchapter.chapterId)) return;

    const updated = await prisma.subchapter.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex })
      }
    });

    console.log(`Subchapter "${updated.title}" updated by admin ${req.userId}`);

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
 * Supprimer un sous-chapitre (vérification d'accès au niveau via chapter)
 */
adminContentRouter.delete('/subchapters/:id', requireAuth, requireLevelAdmin, async (req: any, res) => {
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

    // Vérifier l'accès au niveau via le chapter
    if (!await checkChapterAccess(req, res, subchapter.chapterId)) return;

    const questionsCount = subchapter._count.questions;

    // Supprimer les questions du sous-chapitre
    await prisma.question.deleteMany({ where: { subchapterId: id } });

    // Supprimer le sous-chapitre
    await prisma.subchapter.delete({ where: { id } });

    console.log(`Subchapter "${subchapter.title}" deleted by admin ${req.userId}`);

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
