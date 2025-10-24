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
        createdAt: true
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

    // Stats par difficulté
    const attemptsByDifficulty = await prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            difficulty: true
          }
        }
      }
    });

    const statsByDifficulty = {
      FACILE: { total: 0, correct: 0, avgXP: 0, totalXP: 0 },
      MOYEN: { total: 0, correct: 0, avgXP: 0, totalXP: 0 },
      DIFFICILE: { total: 0, correct: 0, avgXP: 0, totalXP: 0 },
      LEGENDE: { total: 0, correct: 0, avgXP: 0, totalXP: 0 }
    };

    attemptsByDifficulty.forEach(attempt => {
      const diff = attempt.question.difficulty;
      statsByDifficulty[diff].total++;
      if (attempt.isCorrect) {
        statsByDifficulty[diff].correct++;
      }
      statsByDifficulty[diff].totalXP += attempt.xpEarned;
    });

    // Calculer les moyennes
    Object.keys(statsByDifficulty).forEach(key => {
      const stats = statsByDifficulty[key as keyof typeof statsByDifficulty];
      stats.avgXP = stats.total > 0 ? Math.round(stats.totalXP / stats.total) : 0;
    });

    // Stats par tentative
    const attemptsByNumber = await prisma.quizAttempt.groupBy({
      by: ['attemptNumber'],
      where: { userId },
      _count: {
        id: true
      },
      _sum: {
        xpEarned: true
      }
    });

    return res.json({
      statsByDifficulty,
      attemptsByNumber: attemptsByNumber.map(a => ({
        attemptNumber: a.attemptNumber,
        count: a._count.id,
        totalXP: a._sum.xpEarned || 0
      }))
    });

  } catch (error) {
    console.error('[profile/stats/detailed] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});
