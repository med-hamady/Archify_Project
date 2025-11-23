/**
 * Profile Routes - FacGame
 *
 * Routes pour le profil utilisateur :
 * - Statistiques complètes
 * - Badges obtenus
 * - Historique de progression
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';
import { getLevelInfo } from '../services/level.service';
import { getUserBadgeStats } from '../services/badge.service';
import { getUserGlobalStats, getUserSubjectsProgress } from '../services/progress.service';

const prisma = new PrismaClient();
export const profileRouter = Router();

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/profile/me
 * Profil complet de l'utilisateur connecté
 */
profileRouter.get('/me', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        semester: true,
        role: true,
        xpTotal: true,
        level: true,
        consecutiveGoodAnswers: true,
        bestStreak: true,
        legendQuestionsCompleted: true,
        lastActivityAt: true,
        createdAt: true,
        profilePicture: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Niveau et progression
    const levelInfo = getLevelInfo(user.xpTotal);

    // Badges
    const badgeStats = await getUserBadgeStats(userId);

    // Statistiques globales
    const globalStats = await getUserGlobalStats(userId);

    return res.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        semester: user.semester,
        role: user.role,
        createdAt: user.createdAt,
        lastActivityAt: user.lastActivityAt,
        profilePicture: user.profilePicture,
        gamification: {
          xpTotal: user.xpTotal,
          level: {
            current: levelInfo.current,
            name: levelInfo.currentName,
            xpMin: levelInfo.xpMin,
            xpMax: levelInfo.xpMax,
            progressPercent: levelInfo.progressPercent,
            xpToNextLevel: levelInfo.xpToNextLevel,
            isMaxLevel: levelInfo.isMaxLevel
          },
          consecutiveStreak: user.consecutiveGoodAnswers,
          bestStreak: user.bestStreak,
          legendQuestionsCompleted: user.legendQuestionsCompleted,
          badges: {
            total: badgeStats.total,
            byCategory: badgeStats.byCategory,
            latest: badgeStats.latestBadge ? {
              id: badgeStats.latestBadge.id,
              name: badgeStats.latestBadge.name,
              description: badgeStats.latestBadge.description
            } : null
          }
        },
        stats: {
          totalQuestionsAnswered: globalStats.totalQuestionsAnswered,
          totalQuestionsCorrect: globalStats.totalQuestionsCorrect,
          totalChaptersCompleted: globalStats.totalChaptersCompleted,
          totalSubjectsStarted: globalStats.totalSubjectsStarted,
          averageSuccessRate: globalStats.averageSuccessRate
        }
      }
    });

  } catch (error) {
    console.error('[profile/me] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/profile/badges
 * Liste complète des badges de l'utilisateur
 */
profileRouter.get('/badges', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    // Récupérer les badges avec earnedAt directement depuis la base
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' }
    });

    // Fonction pour mapper requirement vers category
    const getCategory = (requirement: string): 'LEVEL' | 'ACHIEVEMENT' | 'SPECIAL' => {
      if (requirement.startsWith('REACH_')) {
        return 'LEVEL';
      } else if (
        requirement.startsWith('STREAK_') ||
        requirement.startsWith('CHALLENGE_') ||
        requirement.startsWith('PERFECT_') ||
        requirement === 'FIRST_EXAM_PASSED' ||
        requirement === 'COMPLETE_100_LEGEND_QCM'
      ) {
        return 'ACHIEVEMENT';
      } else {
        // MAJOR_*, CUSTOM, et autres badges spéciaux
        return 'SPECIAL';
      }
    };

    return res.json({
      badges: userBadges.map(ub => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        iconUrl: ub.badge.iconUrl,
        requirement: ub.badge.requirement,
        category: getCategory(ub.badge.requirement),
        earnedAt: ub.earnedAt
      }))
    });

  } catch (error) {
    console.error('[profile/badges] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/profile/activity
 * Activité récente de l'utilisateur
 */
profileRouter.get('/activity', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    // Récupérer les dernières tentatives
    const recentAttempts = await prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        question: {
          include: {
            chapter: {
              include: {
                subject: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const activity = recentAttempts.map(attempt => ({
      id: attempt.id,
      type: 'quiz_attempt',
      questionId: attempt.questionId,
      chapterTitle: attempt.question.chapter.title,
      subjectTitle: attempt.question.chapter.subject.title,
      isCorrect: attempt.isCorrect,
      xpEarned: attempt.xpEarned,
      attemptNumber: attempt.attemptNumber,
      createdAt: attempt.createdAt
    }));

    return res.json({ activity });

  } catch (error) {
    console.error('[profile/activity] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/profile/progress
 * Progression détaillée par matière
 */
profileRouter.get('/progress', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    const subjectsProgress = await getUserSubjectsProgress(userId);

    return res.json({
      progress: subjectsProgress.map(sp => ({
        subjectId: sp.subjectId,
        subjectTitle: sp.subjectTitle,
        totalQCM: sp.totalQCM,
        questionsAnswered: sp.questionsAnswered,
        progressPercent: sp.progressPercent,
        chaptersCompleted: sp.chaptersCompleted,
        chaptersTotal: sp.chaptersTotal,
        challengeUnlocked: sp.challengeUnlockedGlobal,
        pdfCount: sp.pdfCount,
        videoCount: sp.videoCount
      }))
    });

  } catch (error) {
    console.error('[profile/progress] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/profile/stats/detailed
 * Statistiques détaillées par difficulté
 */
profileRouter.get('/stats/detailed', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    // Récupérer toutes les tentatives
    const allAttempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true
          }
        }
      }
    });

    // Calculer les stats globales
    const totalQuestions = allAttempts.length;
    const correctAnswers = allAttempts.filter(a => a.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const successRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalXPEarned = allAttempts.reduce((sum, a) => sum + a.xpEarned, 0);

    // Calculer la moyenne des tentatives
    const questionAttempts = new Map<string, number>();
    allAttempts.forEach(attempt => {
      const qId = attempt.questionId;
      questionAttempts.set(qId, (questionAttempts.get(qId) || 0) + 1);
    });
    const averageAttempts = questionAttempts.size > 0
      ? Array.from(questionAttempts.values()).reduce((sum, count) => sum + count, 0) / questionAttempts.size
      : 0;

    // Compter les questions répondues correctement du premier coup
    const firstAttempts = new Map<string, boolean>();
    allAttempts.forEach(attempt => {
      const qId = attempt.questionId;
      if (!firstAttempts.has(qId)) {
        firstAttempts.set(qId, attempt.isCorrect);
      }
    });
    const perfectScores = Array.from(firstAttempts.values()).filter(v => v).length;

    // Compter les challenges complétés
    const challengesCompleted = await prisma.challengeResult.count({
      where: { userId }
    });

    // Compter les examens complétés et réussis
    const examsCompleted = await prisma.examResult.count({
      where: { userId }
    });

    const examsPassed = await prisma.examResult.count({
      where: {
        userId,
        passed: true
      }
    });

    return res.json({
      success: true,
      stats: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        successRate,
        averageAttempts,
        totalXPEarned,
        challengesCompleted,
        examsCompleted,
        examsPassed,
        perfectScores
      }
    });

  } catch (error) {
    console.error('[profile/stats/detailed] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/profile/subscription
 * Vérifier le statut de l'abonnement de l'utilisateur
 */
profileRouter.get('/subscription', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    // Importer dynamiquement le service de subscription
    const { checkUserSubscription } = await import('../services/subscription.service');
    const subscriptionResult = await checkUserSubscription(userId);

    return res.json({
      success: true,
      subscription: {
        hasActive: subscriptionResult.hasActiveSubscription,
        type: subscriptionResult.subscriptionType,
        canAccessQuiz: subscriptionResult.canAccessQuiz,
        canAccessDocuments: subscriptionResult.canAccessDocuments,
        expiresAt: subscriptionResult.expiresAt,
        message: subscriptionResult.message
      }
    });

  } catch (error) {
    console.error('[profile/subscription] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * PATCH /api/profile/update-name
 * Mettre à jour le nom de l'utilisateur
 */
profileRouter.patch('/update-name', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { name } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: { code: 'INVALID_NAME', message: 'Le nom est requis et doit être une chaîne non vide' }
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        error: { code: 'NAME_TOO_SHORT', message: 'Le nom doit contenir au moins 2 caractères' }
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        error: { code: 'NAME_TOO_LONG', message: 'Le nom ne peut pas dépasser 100 caractères' }
      });
    }

    // Mettre à jour le nom
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log(`[profile/update-name] User ${userId} updated name to: ${updatedUser.name}`);

    return res.json({
      success: true,
      message: 'Nom mis à jour avec succès',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });

  } catch (error) {
    console.error('[profile/update-name] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la mise à jour du nom' }
    });
  }
});
