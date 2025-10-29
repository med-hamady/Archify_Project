import express from 'express';
import { z } from 'zod';
import { PrismaClient, QuestionDifficulty, GameLevel } from '@prisma/client';
import { requireAuth } from './auth';
import { BASE_XP } from '../services/xp.service';
import { getLevelInfo, checkLevelUp } from '../services/level.service';
import { checkAndAwardBadges } from '../services/badge.service';

const prisma = new PrismaClient();

export const examRouter = express.Router();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Vérifie si l'utilisateur peut accéder au mode Examen
 * Conditions: 50% des QCM de la matière complétés (update4)
 */
async function canAccessExamMode(userId: string, subjectId: string): Promise<{
  canAccess: boolean;
  progressPercent: number;
  totalQuestions: number;
  completedQuestions: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    return { canAccess: false, progressPercent: 0, totalQuestions: 0, completedQuestions: 0 };
  }

  // Compter le nombre total de questions dans la matière
  const totalQuestions = await prisma.question.count({
    where: {
      chapter: {
        subjectId
      }
    }
  });

  if (totalQuestions === 0) {
    return { canAccess: false, progressPercent: 0, totalQuestions: 0, completedQuestions: 0 };
  }

  // Compter combien de questions ont été répondues correctement au moins une fois en mode révision
  const correctAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      question: {
        chapter: {
          subjectId
        }
      },
      isCorrect: true
    },
    select: {
      questionId: true
    },
    distinct: ['questionId']
  });

  const completedQuestions = correctAttempts.length;

  const progressPercent = Math.round((completedQuestions / totalQuestions) * 100);

  // Nécessite 50% de complétion
  return {
    canAccess: progressPercent >= 50,
    progressPercent,
    totalQuestions,
    completedQuestions
  };
}

function getGrade(score: number): string {
  if (score >= 18) return 'A+';
  if (score >= 16) return 'A';
  if (score >= 14) return 'B+';
  if (score >= 12) return 'B';
  if (score >= 10) return 'C';
  return 'F';
}

// ============================================
// DÉMARRER UN EXAMEN
// ============================================

/**
 * POST /api/exam/:subjectId/start
 * Démarre un examen pour une matière
 * Conditions: 50% des QCM complétés (update4)
 * Body: { questionCount?: number, duration?: number } - nombre de questions (10/20/30/40) et durée en minutes (15-90)
 */
examRouter.post('/:subjectId/start', requireAuth, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    const { questionCount, duration } = req.body; // Options d'examen
    const userId = req.userId;

    // Vérifier que la matière existe
    const subject: any = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        chapters: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Matière non trouvée' }
      });
    }

    // Compter le total de questions
    const totalQuestions = subject.chapters.reduce(
      (sum: number, chapter: any) => sum + chapter.questions.length,
      0
    );

    if (totalQuestions === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_QUESTIONS',
          message: 'Cette matière ne contient pas de questions'
        }
      });
    }

    // Vérifier les conditions d'accès à l'Examen
    const accessCheck = await canAccessExamMode(userId, subjectId);

    if (!accessCheck.canAccess) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: `Examen non accessible. Vous devez compléter 50% des QCM de la matière en mode Révision (actuellement ${accessCheck.progressPercent}% - ${accessCheck.completedQuestions}/${accessCheck.totalQuestions} QCM complétés).`
        }
      });
    }

    // Pas de cooldown selon update4 (liberté totale d'essai)

    // Récupérer les questions déjà vues en mode Révision (update4)
    const seenQuestionIds = await prisma.quizAttempt.findMany({
      where: {
        userId,
        question: {
          chapter: {
            subjectId
          }
        },
        isCorrect: true // Questions vues et répondues correctement
      },
      select: {
        questionId: true
      },
      distinct: ['questionId']
    });

    const seenIds = seenQuestionIds.map((sq: any) => sq.questionId);

    if (seenIds.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_SEEN_QUESTIONS',
          message: 'Vous devez d\'abord répondre correctement à des questions en mode Révision avant de passer l\'examen.'
        }
      });
    }

    // Filtrer pour ne garder que les questions déjà vues
    const seenQuestions = subject.chapters.flatMap((chapter: any) =>
      chapter.questions
        .filter((q: any) => seenIds.includes(q.id))
        .map((q: any) => {
          const options = q.options as any[];
          return {
            id: q.id,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            questionText: q.questionText,
            options: options.map((opt: any) => opt.text), // Envoyer seulement le texte
            difficulty: q.difficulty
          };
        })
    );

    // Déterminer le nombre de questions pour l'examen
    const validQuestionCounts = [10, 20, 30, 40];
    let examQuestionCount = seenQuestions.length; // Par défaut, toutes les questions vues

    if (questionCount && validQuestionCounts.includes(questionCount)) {
      examQuestionCount = Math.min(questionCount, seenQuestions.length);
    }

    // Sélection aléatoire des questions
    const shuffled = [...seenQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, examQuestionCount);

    // Créer un enregistrement d'examen (sera mis à jour lors de la soumission)
    const exam = await prisma.examResult.create({
      data: {
        userId,
        subjectId,
        score: 0, // Sera mis à jour lors de la soumission
        passed: false,
        questionsCorrect: 0,
        questionsTotal: selectedQuestions.length,
        timeSpentSec: 0, // Sera mis à jour lors de la soumission
        completedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      exam: {
        examId: exam.id,
        subjectId: subject.id,
        subjectName: subject.title,
        totalAvailableQuestions: seenQuestions.length,
        totalQuestions: selectedQuestions.length,
        duration: duration || 90, // Durée en minutes (par défaut 90 min)
        totalChapters: subject.chapters.length,
        questions: selectedQuestions
      }
    });

  } catch (err: any) {
    console.error('Error starting exam:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors du démarrage de l\'examen' }
    });
  }
});

// ============================================
// SOUMETTRE RÉPONSES EXAMEN
// ============================================

const submitExamSchema = z.object({
  examId: z.string().optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedAnswers: z.array(z.number().int().min(0).max(4)) // Tableau de 0-4 pour les options A-E (peut être vide)
  })),
  timeSpentSec: z.number().int().min(0).optional()
});

/**
 * POST /api/exam/:subjectId/submit
 * Soumet les réponses d'un examen et calcule le résultat
 */
examRouter.post('/:subjectId/submit', requireAuth, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.userId;

    // Valider les données
    const validation = submitExamSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Données invalides',
          details: validation.error.issues
        }
      });
    }

    const { answers, timeSpentSec } = validation.data;

    // Récupérer la matière avec toutes les questions
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        chapters: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Matière non trouvée' }
      });
    }

    // Créer une map des questions
    const questionsMap = new Map();
    for (const chapter of subject.chapters) {
      for (const question of chapter.questions) {
        questionsMap.set(question.id, question);
      }
    }

    // Calculer le score
    let questionsCorrect = 0;
    let totalXPEarned = 0;
    const detailedResults = [];

    for (const answer of answers) {
      const question: any = questionsMap.get(answer.questionId);
      if (!question) continue;

      // Vérifier la réponse avec le nouveau format JSON (réponses multiples)
      const options = question.options as any[];
      if (!Array.isArray(options)) {
        detailedResults.push({
          questionId: question.id,
          questionText: question.questionText,
          correct: false,
          xpEarned: 0,
          difficulty: question.difficulty,
          error: 'Invalid options format'
        });
        continue;
      }

      // Vérifier si les index sont valides
      const invalidIndexes = answer.selectedAnswers.some((idx: number) => idx >= options.length);
      if (invalidIndexes) {
        detailedResults.push({
          questionId: question.id,
          questionText: question.questionText,
          correct: false,
          xpEarned: 0,
          difficulty: question.difficulty,
          error: 'Invalid answer index'
        });
        continue;
      }

      // Trouver les indices des bonnes réponses
      const correctIndexes = options
        .map((opt: any, idx: number) => opt.isCorrect ? idx : -1)
        .filter((idx: number) => idx !== -1)
        .sort();

      // Trier les réponses sélectionnées pour la comparaison
      const selectedSorted = [...answer.selectedAnswers].sort();

      // Vérifier si les tableaux sont identiques
      const isCorrect = correctIndexes.length === selectedSorted.length &&
        correctIndexes.every((val: number, idx: number) => val === selectedSorted[idx]);

      // Préparer les options avec feedback
      const optionsWithFeedback = options.map((opt: any, index: number) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        justification: !opt.isCorrect ? opt.justification : undefined,
        wasSelected: answer.selectedAnswers.includes(index)
      }));

      if (isCorrect) {
        questionsCorrect++;

        detailedResults.push({
          questionId: question.id,
          questionText: question.questionText,
          correct: true,
          xpEarned: 4, // 4 XP par bonne réponse (update4)
          difficulty: question.difficulty,
          options: optionsWithFeedback,
          explanation: question.explanation
        });
      } else {
        detailedResults.push({
          questionId: question.id,
          questionText: question.questionText,
          correct: false,
          xpEarned: 0,
          difficulty: question.difficulty,
          options: optionsWithFeedback,
          explanation: question.explanation
        });
      }
    }

    // XP brute = 4 × (nombre de bonnes réponses) (update4)
    const baseXP = questionsCorrect * 4;

    // Compter le nombre de fois où cet examen a déjà été complété pour cette matière
    const previousCompletions = await prisma.examResult.count({
      where: {
        userId,
        subjectId
      }
    });

    // Appliquer la pénalité de replay : ×(1/2)^k où k = nombre de runs déjà crédités
    const replayPenalty = Math.pow(0.5, previousCompletions);
    totalXPEarned = Math.round(baseXP * replayPenalty);

    const totalQuestions = answers.length; // Nombre de questions dans cet examen spécifique
    const scorePercent = (questionsCorrect / totalQuestions) * 100;
    const scoreSur20 = (scorePercent / 100) * 20;
    const passed = scoreSur20 >= 10;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
      });
    }

    const oldXP = user.xpTotal;
    const newXP = oldXP + totalXPEarned;

    // Créer le résultat de l'examen avec les résultats détaillés
    await prisma.examResult.create({
      data: {
        userId,
        subjectId,
        questionsTotal: totalQuestions,
        questionsCorrect,
        timeSpentSec: timeSpentSec || 0,
        score: scoreSur20,
        passed,
        detailedResults: detailedResults // Stocker les résultats détaillés pour la correction
      }
    });

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xpTotal: newXP,
        level: getLevelInfo(newXP).current
      }
    });

    // Vérifier level-up
    const levelUpResult = checkLevelUp(oldXP, newXP);

    // Vérifier nouveaux badges
    const badgeResult = await checkAndAwardBadges(userId, {
      consecutiveGoodAnswers: updatedUser.consecutiveGoodAnswers,
      legendQuestionsCompleted: updatedUser.legendQuestionsCompleted,
      level: updatedUser.level
    });

    res.json({
      success: true,
      result: {
        score: scoreSur20,
        scoreOutOf20: scoreSur20, // Alias pour compatibilité frontend
        scorePercent,
        passed,
        grade: getGrade(scoreSur20),
        questionsCorrect,
        questionsTotal: totalQuestions,
        xpEarned: totalXPEarned,
        totalXP: newXP,
        levelInfo: getLevelInfo(newXP),
        levelUp: levelUpResult.leveledUp ? {
          oldLevel: levelUpResult.oldLevel,
          newLevel: levelUpResult.newLevel
        } : null,
        newBadges: badgeResult.badges.length > 0 ? badgeResult.badges : null,
        detailedResults
      }
    });

  } catch (err: any) {
    console.error('Error submitting exam:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la soumission de l\'examen' }
    });
  }
});

// ============================================
// CORRECTION DÉTAILLÉE EXAMEN
// ============================================

/**
 * GET /api/exam/:examId/correction
 * Récupère la correction détaillée d'un examen
 */
examRouter.get('/:examId/correction', requireAuth, async (req: any, res) => {
  try {
    const { examId } = req.params;
    const userId = req.userId;

    const exam: any = await prisma.examResult.findUnique({
      where: { id: examId },
      include: {
        subject: {
          include: {
            chapters: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Examen non trouvé' }
      });
    }

    if (exam.userId !== userId) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Cet examen ne vous appartient pas' }
      });
    }

    // Vérifier si l'examen a des résultats détaillés stockés
    if (!exam.detailedResults) {
      console.log('⚠️ No detailedResults for exam:', examId);
      return res.status(404).json({
        error: { code: 'NO_DETAILS', message: 'Aucune correction disponible pour cet examen' }
      });
    }

    const detailedResults = exam.detailedResults as any[];
    console.log('📊 Found detailedResults:', detailedResults.length, 'questions');

    // Organiser par chapitre
    const chapterMap = new Map();

    for (const result of detailedResults) {
      // Trouver le chapitre de cette question
      const question = exam.subject.chapters
        .flatMap((ch: any) => ch.questions)
        .find((q: any) => q.id === result.questionId);

      if (!question) continue;

      const chapterId = question.chapterId;
      const chapter = exam.subject.chapters.find((ch: any) => ch.id === chapterId);

      if (!chapterMap.has(chapterId)) {
        chapterMap.set(chapterId, {
          chapterId,
          chapterTitle: chapter.title,
          questions: []
        });
      }

      // Extraire les indices des bonnes réponses et réponses sélectionnées
      const correctIndexes: number[] = [];
      const selectedIndexes: number[] = [];

      result.options.forEach((opt: any, idx: number) => {
        if (opt.isCorrect) correctIndexes.push(idx);
        if (opt.wasSelected) selectedIndexes.push(idx);
      });

      chapterMap.get(chapterId).questions.push({
        questionId: result.questionId,
        questionText: result.questionText,
        options: result.options.map((opt: any) => opt.text), // Juste le texte pour le frontend
        userAnswer: selectedIndexes.length === 1 ? selectedIndexes[0] : null, // Pour compatibilité avec template actuel
        correctAnswer: correctIndexes.length === 1 ? correctIndexes[0] : null, // Pour compatibilité avec template actuel
        isCorrect: result.correct,
        explanation: result.explanation
      });
    }

    const correctionByChapter = Array.from(chapterMap.values()).map((chapter: any) => {
      const correctCount = chapter.questions.filter((q: any) => q.isCorrect).length;

      return {
        ...chapter,
        score: correctCount,
        totalQuestions: chapter.questions.length
      };
    });

    const correctionData = {
      examId: exam.id,
      subjectName: exam.subject.name,
      score: exam.questionsCorrect, // Nombre de bonnes réponses
      scoreOutOf20: exam.score, // Score sur 20
      totalQuestions: exam.questionsTotal,
      passed: exam.passed,
      grade: getGrade(exam.score),
      questionsCorrect: exam.questionsCorrect,
      questionsTotal: exam.questionsTotal,
      completedAt: exam.completedAt,
      chapterBreakdown: correctionByChapter // Renommé de chapters à chapterBreakdown
    };

    console.log('✅ Sending correction:', {
      scoreOutOf20: correctionData.scoreOutOf20,
      score: correctionData.score,
      totalQuestions: correctionData.totalQuestions,
      chaptersCount: correctionData.chapterBreakdown.length
    });

    res.json({
      success: true,
      correction: correctionData
    });

  } catch (err: any) {
    console.error('Error fetching exam correction:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération de la correction' }
    });
  }
});

// ============================================
// HISTORIQUE EXAMENS
// ============================================

/**
 * GET /api/exam/history/:subjectId
 * Récupère l'historique des examens pour une matière
 */
examRouter.get('/history/:subjectId', requireAuth, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.userId;

    const exams = await prisma.examResult.findMany({
      where: {
        userId,
        subjectId
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        score: true,
        passed: true,
        questionsCorrect: true,
        questionsTotal: true,
        timeSpentSec: true,
        completedAt: true
      }
    });

    // Calculer statistiques
    const bestScore = exams.length > 0
      ? Math.max(...exams.map((e: any) => e.score))
      : 0;

    const averageScore = exams.length > 0
      ? Math.round((exams.reduce((sum: number, e: any) => sum + e.score, 0) / exams.length) * 10) / 10
      : 0;

    const passedCount = exams.filter((e: any) => e.passed).length;

    const examsWithGrades = exams.map((exam: any) => ({
      ...exam,
      grade: getGrade(exam.score)
    }));

    res.json({
      success: true,
      exams: examsWithGrades,
      stats: {
        totalExams: exams.length,
        passedExams: passedCount,
        failedExams: exams.length - passedCount,
        bestScore,
        bestGrade: getGrade(bestScore),
        averageScore
      }
    });

  } catch (err: any) {
    console.error('Error fetching exam history:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération de l\'historique' }
    });
  }
});

// ============================================
// LEADERBOARD EXAMEN
// ============================================

/**
 * GET /api/exam/leaderboard/:subjectId
 * Récupère le classement pour une matière spécifique
 */
examRouter.get('/leaderboard/:subjectId', requireAuth, async (req: any, res) => {
  try {
    const { subjectId } = req.params;

    // Récupérer les meilleurs scores
    const topScores = await prisma.examResult.findMany({
      where: { subjectId, passed: true },
      orderBy: [
        { score: 'desc' },
        { timeSpentSec: 'asc' }
      ],
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      }
    });

    // Grouper par utilisateur (garder le meilleur score)
    const userBestScores = new Map();
    for (const result of topScores) {
      if (!userBestScores.has(result.userId)) {
        userBestScores.set(result.userId, {
          userId: result.user.id,
          userName: result.user.name,
          userLevel: result.user.level,
          score: result.score,
          grade: getGrade(result.score),
          timeSpentSec: result.timeSpentSec,
          completedAt: result.completedAt
        });
      }
    }

    const leaderboard = Array.from(userBestScores.values()).slice(0, 10);

    res.json({
      success: true,
      leaderboard
    });

  } catch (err: any) {
    console.error('Error fetching exam leaderboard:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération du classement' }
    });
  }
});
