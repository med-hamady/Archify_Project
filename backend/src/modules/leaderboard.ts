/**
 * Leaderboard Routes - FacGame
 *
 * Routes pour le classement global et par matière :
 * - Classement global (Top 100)
 * - Classement par semestre
 * - Classement par matière
 * - Position de l'utilisateur
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const leaderboardRouter = Router();

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/leaderboard/global
 * Classement global (Top 100 par XP)
 */
leaderboardRouter.get('/global', requireAuth, async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    // Récupérer le top utilisateurs
    const topUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT' // Seulement les étudiants
      },
      orderBy: {
        xpTotal: 'desc'
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        xpTotal: true,
        level: true,
        semester: true,
        consecutiveGoodAnswers: true,
        legendQuestionsCompleted: true
      }
    });

    // Ajouter le rang
    const leaderboard = topUsers.map((user, index) => ({
      rank: offset + index + 1,
      userId: user.id,
      name: user.name,
      xpTotal: user.xpTotal,
      level: user.level,
      semester: user.semester,
      consecutiveGoodAnswers: user.consecutiveGoodAnswers,
      legendQuestionsCompleted: user.legendQuestionsCompleted,
      isCurrentUser: user.id === req.userId
    }));

    // Position de l'utilisateur actuel
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        xpTotal: true,
        level: true,
        semester: true
      }
    });

    let userRank = null;
    if (currentUser) {
      const usersAbove = await prisma.user.count({
        where: {
          role: 'STUDENT',
          xpTotal: {
            gt: currentUser.xpTotal
          }
        }
      });
      userRank = usersAbove + 1;
    }

    return res.json({
      leaderboard,
      currentUser: currentUser ? {
        rank: userRank,
        userId: currentUser.id,
        name: currentUser.name,
        xpTotal: currentUser.xpTotal,
        level: currentUser.level,
        semester: currentUser.semester
      } : null
    });

  } catch (error) {
    console.error('[leaderboard/global] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/leaderboard/semester
 * Classement de la classe de l'utilisateur actuel (son semestre)
 */
leaderboardRouter.get('/semester', requireAuth, async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    // Récupérer le semestre de l'utilisateur actuel
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { semester: true, xpTotal: true }
    });

    if (!currentUser || !currentUser.semester) {
      return res.status(400).json({
        error: { code: 'NO_SEMESTER', message: 'User has no semester assigned' }
      });
    }

    const topUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        semester: currentUser.semester
      },
      orderBy: {
        xpTotal: 'desc'
      },
      take: limit,
      select: {
        id: true,
        name: true,
        xpTotal: true,
        level: true,
        semester: true,
        consecutiveGoodAnswers: true,
        legendQuestionsCompleted: true
      }
    });

    // Calculer le rang de l'utilisateur actuel dans sa classe
    let currentUserRank = null;
    const usersAboveInClass = await prisma.user.count({
      where: {
        role: 'STUDENT',
        semester: currentUser.semester,
        xpTotal: {
          gt: currentUser.xpTotal
        }
      }
    });
    currentUserRank = usersAboveInClass + 1;

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      xpTotal: user.xpTotal,
      level: user.level,
      semester: user.semester,
      consecutiveGoodAnswers: user.consecutiveGoodAnswers,
      legendQuestionsCompleted: user.legendQuestionsCompleted,
      isCurrentUser: user.id === req.userId
    }));

    return res.json({
      leaderboard,
      semester: currentUser.semester,
      currentUserRank
    });

  } catch (error) {
    console.error('[leaderboard/semester] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/leaderboard/semester/:semester
 * Classement par semestre spécifique (admin)
 */
leaderboardRouter.get('/semester/:semester', requireAuth, async (req: any, res: any) => {
  try {
    const { semester } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const topUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        semester
      },
      orderBy: {
        xpTotal: 'desc'
      },
      take: limit,
      select: {
        id: true,
        name: true,
        xpTotal: true,
        level: true,
        semester: true,
        consecutiveGoodAnswers: true,
        legendQuestionsCompleted: true
      }
    });

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      xpTotal: user.xpTotal,
      level: user.level,
      semester: user.semester,
      consecutiveGoodAnswers: user.consecutiveGoodAnswers,
      legendQuestionsCompleted: user.legendQuestionsCompleted,
      isCurrentUser: user.id === req.userId
    }));

    return res.json({ leaderboard, semester });

  } catch (error) {
    console.error('[leaderboard/semester/:semester] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/leaderboard/subject/:subjectId
 * Classement par matière (par progression)
 */
leaderboardRouter.get('/subject/:subjectId', requireAuth, async (req: any, res: any) => {
  try {
    const { subjectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    // Récupérer la matière
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { title: true }
    });

    if (!subject) {
      return res.status(404).json({
        error: { code: 'SUBJECT_NOT_FOUND', message: 'Subject not found' }
      });
    }

    // Récupérer les progressions triées
    const topProgress = await prisma.subjectProgress.findMany({
      where: { subjectId },
      orderBy: {
        progressPercent: 'desc'
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            level: true,
            semester: true
          }
        }
      }
    });

    const leaderboard = topProgress.map((progress, index) => ({
      rank: index + 1,
      userId: progress.user.id,
      name: progress.user.name,
      level: progress.user.level,
      semester: progress.user.semester,
      progressPercent: Math.round(progress.progressPercent * 100) / 100,
      questionsAnswered: progress.totalQuestionsAnswered
    }));

    return res.json({
      leaderboard,
      subject: {
        id: subjectId,
        title: subject.title
      }
    });

  } catch (error) {
    console.error('[leaderboard/subject] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/leaderboard/my-rank
 * Position de l'utilisateur dans le classement global
 */
leaderboardRouter.get('/my-rank', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        xpTotal: true,
        level: true,
        semester: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Compter les utilisateurs avec plus d'XP
    const usersAbove = await prisma.user.count({
      where: {
        role: 'STUDENT',
        xpTotal: {
          gt: user.xpTotal
        }
      }
    });

    const rank = usersAbove + 1;

    // Total d'utilisateurs
    const totalUsers = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Percentile
    const percentile = Math.round((1 - rank / totalUsers) * 100);

    return res.json({
      rank,
      totalUsers,
      percentile,
      user: {
        id: user.id,
        name: user.name,
        xpTotal: user.xpTotal,
        level: user.level,
        semester: user.semester
      }
    });

  } catch (error) {
    console.error('[leaderboard/my-rank] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/leaderboard/top-by-level
 * Top 10 de chaque niveau
 */
leaderboardRouter.get('/top-by-level', requireAuth, async (req: any, res: any) => {
  try {
    const levels = ['BOIS', 'BRONZE', 'ARGENT', 'OR', 'PLATINUM', 'LEGENDAIRE', 'MONDIAL'];
    const topByLevel: Record<string, any[]> = {};

    for (const level of levels) {
      const topUsers = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          level: level as any
        },
        orderBy: {
          xpTotal: 'desc'
        },
        take: 10,
        select: {
          id: true,
          name: true,
          xpTotal: true,
          semester: true
        }
      });

      topByLevel[level] = topUsers.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        name: user.name,
        xpTotal: user.xpTotal,
        semester: user.semester
      }));
    }

    return res.json({ topByLevel });

  } catch (error) {
    console.error('[leaderboard/top-by-level] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});
