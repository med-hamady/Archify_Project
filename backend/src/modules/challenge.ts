import express from 'express';
import { z } from 'zod';
import { PrismaClient, QuestionDifficulty } from '@prisma/client';
import { requireAuth } from './auth';
import { BASE_XP } from '../services/xp.service';
import { getLevelInfo, checkLevelUp, hasGlobalChallengeUnlock } from '../services/level.service';
import { checkAndAwardBadges } from '../services/badge.service';

const prisma = new PrismaClient();

export const challengeRouter = express.Router();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Vérifie si l'utilisateur peut accéder au mode Challenge
 * Conditions: Toujours accessible (0% progression)
 */
async function canAccessChallengeMode(userId: string, chapterId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true }
  });

  if (!user) return false;

  // Challenge toujours accessible
  return true;
}

// ============================================
// DÉMARRER UN CHALLENGE
// ============================================

/**
 * POST /api/challenge/:chapterId/start
 * Démarre un challenge pour un chapitre
 * Conditions: 50% progression dans le chapitre OU niveau OR minimum
 */
challengeRouter.post('/:chapterId/start', requireAuth, async (req: any, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.userId;

    // Vérifier que le chapitre existe
    const chapter: any = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        subject: {
          select: { title: true }
        },
        questions: true
      }
    });

    if (!chapter) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Chapitre non trouvé' }
      });
    }

    // Vérifier les conditions d'accès au Challenge
    const canAccess = await canAccessChallengeMode(userId, chapterId);

    if (!canAccess) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Challenge non accessible'
        }
      });
    }

    // Pas de cooldown - on peut refaire le challenge quand on veut

    // Préparer les questions avec options sanitisées (sans révéler les réponses)
    const sanitizedQuestions = chapter.questions.map((q: any) => {
      const options = q.options as any[];
      return {
        id: q.id,
        questionText: q.questionText,
        options: options.map((opt: any) => ({
          text: opt.text
          // Ne pas inclure isCorrect ni justification avant la soumission
        })),
        difficulty: q.difficulty
      };
    });

    res.status(200).json({
      success: true,
      challenge: {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        subjectName: chapter.subject.title,
        totalQuestions: chapter.questions.length,
        questions: sanitizedQuestions
      }
    });

  } catch (err: any) {
    console.error('Error starting challenge:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors du démarrage du challenge' }
    });
  }
});

// ============================================
// SOUMETTRE RÉPONSES CHALLENGE
// ============================================

const submitChallengeSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedAnswers: z.array(z.number().int().min(0).max(4)) // Tableau de 0-4 pour les options A-E
  })),
  timeSpentSec: z.number().int().min(0).optional()
});

/**
 * POST /api/challenge/:chapterId/submit
 * Soumet les réponses d'un challenge et calcule le résultat
 */
challengeRouter.post('/:chapterId/submit', requireAuth, async (req: any, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.userId;

    // Valider les données
    const validation = submitChallengeSchema.safeParse(req.body);
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

    // Récupérer le chapitre avec questions
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        questions: true
      }
    });

    if (!chapter) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Chapitre non trouvé' }
      });
    }

    // Créer une map des questions
    const questionsMap = new Map(
      chapter.questions.map((q: any) => [q.id, q])
    );

    // Calculer le score
    let questionsCorrect = 0;
    let totalXPEarned = 0;
    const detailedResults = [];

    for (const answer of answers) {
      const question: any = questionsMap.get(answer.questionId);
      if (!question) continue;

      // Vérifier la réponse avec le nouveau format JSON
      const options = question.options as any[];
      if (!Array.isArray(options)) {
        detailedResults.push({
          questionId: question.id,
          correct: false,
          xpEarned: 0,
          error: 'Invalid options format'
        });
        continue;
      }

      // Vérifier si les index sont valides
      const invalidIndexes = answer.selectedAnswers.some(idx => idx >= options.length);
      if (invalidIndexes) {
        detailedResults.push({
          questionId: question.id,
          correct: false,
          xpEarned: 0,
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

      // Préparer les options avec feedback pour les résultats détaillés
      const optionsWithFeedback = options.map((opt: any, index: number) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        justification: !opt.isCorrect ? opt.justification : undefined,
        wasSelected: answer.selectedAnswers.includes(index)
      }));

      if (isCorrect) {
        questionsCorrect++;

        // XP avec bonus Challenge (×1.5)
        const baseXP = BASE_XP[question.difficulty as QuestionDifficulty];
        const challengeXP = Math.round(baseXP * 1.5);
        totalXPEarned += challengeXP;

        detailedResults.push({
          questionId: question.id,
          questionText: question.questionText,
          correct: true,
          xpEarned: challengeXP,
          options: optionsWithFeedback,
          explanation: question.explanation
        });
      } else {
        detailedResults.push({
          questionId: question.id,
          questionText: question.questionText,
          correct: false,
          xpEarned: 0,
          options: optionsWithFeedback,
          explanation: question.explanation
        });
      }
    }

    const score = (questionsCorrect / chapter.questions.length) * 100;

    // Bonus XP si score parfait
    let xpBonus = 0;
    if (score === 100) {
      xpBonus = 100;
      totalXPEarned += xpBonus;
    }

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

    // Créer le résultat du challenge
    await prisma.challengeResult.create({
      data: {
        userId,
        chapterId,
        questionsTotal: chapter.questions.length,
        questionsCorrect,
        timeSpentSec: timeSpentSec || 0,
        score,
        xpBonus
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
        score,
        questionsCorrect,
        questionsTotal: chapter.questions.length,
        xpEarned: totalXPEarned,
        xpBonus,
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
    console.error('Error submitting challenge:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la soumission du challenge' }
    });
  }
});

// ============================================
// HISTORIQUE CHALLENGES
// ============================================

/**
 * GET /api/challenge/history/:chapterId
 * Récupère l'historique des challenges pour un chapitre
 */
challengeRouter.get('/history/:chapterId', requireAuth, async (req: any, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.userId;

    const challenges = await prisma.challengeResult.findMany({
      where: {
        userId,
        chapterId
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        score: true,
        questionsCorrect: true,
        questionsTotal: true,
        xpBonus: true,
        timeSpentSec: true,
        completedAt: true
      }
    });

    // Calculer statistiques
    const bestScore = challenges.length > 0
      ? Math.max(...challenges.map((c: any) => c.score))
      : 0;

    const averageScore = challenges.length > 0
      ? Math.round(challenges.reduce((sum: number, c: any) => sum + c.score, 0) / challenges.length)
      : 0;

    res.json({
      success: true,
      challenges,
      stats: {
        totalChallenges: challenges.length,
        bestScore,
        averageScore
      }
    });

  } catch (err: any) {
    console.error('Error fetching challenge history:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération de l\'historique' }
    });
  }
});

// ============================================
// LEADERBOARD CHALLENGE
// ============================================

/**
 * GET /api/challenge/leaderboard/:chapterId
 * Récupère le classement pour un chapitre spécifique
 */
challengeRouter.get('/leaderboard/:chapterId', requireAuth, async (req: any, res) => {
  try {
    const { chapterId } = req.params;

    // Récupérer les meilleurs scores
    const topScores = await prisma.challengeResult.findMany({
      where: { chapterId },
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
    console.error('Error fetching challenge leaderboard:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération du classement' }
    });
  }
});
