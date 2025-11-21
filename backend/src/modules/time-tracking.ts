import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/time-tracking/start - Start a study session
router.post('/start', requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        sessionStartTime: new Date(),
        lastXpRewardTime: new Date() // Initialize on session start
      },
      select: {
        id: true,
        sessionStartTime: true,
        totalStudyTimeSeconds: true
      }
    });

    res.json({
      success: true,
      sessionStartTime: user.sessionStartTime,
      totalStudyTimeSeconds: user.totalStudyTimeSeconds
    });
  } catch (error: any) {
    console.error('Error starting study session:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage de la session'
    });
  }
});

// POST /api/time-tracking/update - Update study time and award XP if needed
router.post('/update', requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { elapsedSeconds } = req.body;

    if (typeof elapsedSeconds !== 'number' || elapsedSeconds < 0) {
      return res.status(400).json({
        success: false,
        error: 'Temps écoulé invalide'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xpTotal: true,
        totalStudyTimeSeconds: true,
        sessionStartTime: true,
        lastXpRewardTime: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Calculate XP to award (60 XP per hour = 1 XP per minute)
    const hoursStudied = Math.floor(elapsedSeconds / 3600);
    const xpToAward = hoursStudied * 60;

    // Calculate previous hours to avoid duplicate rewards
    const previousHours = Math.floor((user.totalStudyTimeSeconds || 0) / 3600);
    const newHours = hoursStudied - previousHours;
    const actualXpToAward = Math.max(0, newHours * 60);

    // Update user with new study time and XP
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalStudyTimeSeconds: {
          increment: elapsedSeconds
        },
        ...(actualXpToAward > 0 && {
          xpTotal: {
            increment: actualXpToAward
          },
          lastXpRewardTime: new Date()
        })
      },
      select: {
        id: true,
        xpTotal: true,
        totalStudyTimeSeconds: true,
        level: true
      }
    });

    res.json({
      success: true,
      totalStudyTimeSeconds: updatedUser.totalStudyTimeSeconds,
      xpAwarded: actualXpToAward,
      xpTotal: updatedUser.xpTotal,
      level: updatedUser.level
    });
  } catch (error: any) {
    console.error('Error updating study time:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du temps d\'étude'
    });
  }
});

// POST /api/time-tracking/end - End study session
router.post('/end', requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { totalSeconds } = req.body;

    if (typeof totalSeconds !== 'number' || totalSeconds < 0) {
      return res.status(400).json({
        success: false,
        error: 'Temps total invalide'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalStudyTimeSeconds: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Calculate total hours
    const previousTotalSeconds = user.totalStudyTimeSeconds || 0;
    const newTotalSeconds = previousTotalSeconds + totalSeconds;

    const previousHours = Math.floor(previousTotalSeconds / 3600);
    const newHours = Math.floor(newTotalSeconds / 3600);
    const completedHours = newHours - previousHours;
    const xpToAward = completedHours * 60;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalStudyTimeSeconds: newTotalSeconds,
        sessionStartTime: null,
        ...(xpToAward > 0 && {
          xpTotal: {
            increment: xpToAward
          },
          lastXpRewardTime: new Date()
        })
      },
      select: {
        id: true,
        xpTotal: true,
        totalStudyTimeSeconds: true,
        level: true
      }
    });

    res.json({
      success: true,
      totalStudyTimeSeconds: updatedUser.totalStudyTimeSeconds,
      xpAwarded: xpToAward,
      xpTotal: updatedUser.xpTotal,
      level: updatedUser.level,
      completedHours
    });
  } catch (error: any) {
    console.error('Error ending study session:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la fin de la session'
    });
  }
});

// GET /api/time-tracking/stats - Get study time statistics
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalStudyTimeSeconds: true,
        sessionStartTime: true,
        lastXpRewardTime: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const totalHours = Math.floor((user.totalStudyTimeSeconds || 0) / 3600);
    const totalMinutes = Math.floor(((user.totalStudyTimeSeconds || 0) % 3600) / 60);
    const totalSeconds = (user.totalStudyTimeSeconds || 0) % 60;

    res.json({
      success: true,
      totalStudyTimeSeconds: user.totalStudyTimeSeconds || 0,
      formattedTime: {
        hours: totalHours,
        minutes: totalMinutes,
        seconds: totalSeconds
      },
      sessionStartTime: user.sessionStartTime,
      lastXpRewardTime: user.lastXpRewardTime,
      isSessionActive: !!user.sessionStartTime
    });
  } catch (error: any) {
    console.error('Error fetching study time stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router;
