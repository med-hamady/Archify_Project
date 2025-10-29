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
import { getUserBadges, getUserBadgeStats } from '../services/badge.service';
import { getUserGlobalStats, getUserSubjectsProgress } from '../services/progress.service';

const prisma = new PrismaClient();
export const profileRouter = Router();

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/profile/:userId
 * Profil public d'un utilisateur spécifique
 */
profileRouter.get('/:userId', requireAuth, async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        semester: true,
        xpTotal: true,
        level: true,
        consecutiveGoodAnswers: true,
        legendQuestionsCompleted: true,
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
        name: user.name,
        semester: user.semester,
        createdAt: user.createdAt,
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
          correctAnswers: globalStats.totalQuestionsCorrect,
          averageAccuracy: globalStats.averageSuccessRate,
          subjectsStarted: globalStats.totalSubjectsStarted,
          chaptersCompleted: globalStats.totalChaptersCompleted
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

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

    const badges = await getUserBadges(userId);

    return res.json({
      badges: badges.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        requirement: badge.requirement
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
        challengeUnlocked: sp.challengeUnlockedGlobal
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
            difficulty: true,
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

    // Stats par difficulté
    const difficultyCounts = {
      FACILE: 0,
      MOYEN: 0,
      DIFFICILE: 0,
      LEGENDE: 0
    };

    allAttempts.forEach(attempt => {
      const diff = attempt.question.difficulty;
      difficultyCounts[diff]++;
    });

    // Compter les challenges et examens (pour l'instant 0, à implémenter plus tard)
    const challengesCompleted = 0;
    const examsCompleted = 0;
    const examsPassed = 0;

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
        perfectScores,
        difficultyCounts
      }
    });

  } catch (error) {
    console.error('[profile/stats/detailed] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});
