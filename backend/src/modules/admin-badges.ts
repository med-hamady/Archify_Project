/**
 * Admin Badge Management Routes
 *
 * Routes pour la gestion des badges par les admins
 * - Voir tous les badges
 * - Voir les majors de chaque classe
 * - Attribuer/Retirer des badges aux utilisateurs
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from './auth';
import { z } from 'zod';

const prisma = new PrismaClient();
export const adminBadgesRouter = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const assignBadgeSchema = z.object({
  userId: z.string(),
  badgeRequirement: z.enum([
    'MAJOR_PCEM1',
    'MAJOR_PCEM2',
    'MAJOR_DCEM1'
  ] as const)
});

const revokeBadgeSchema = z.object({
  userId: z.string(),
  badgeRequirement: z.enum([
    'MAJOR_PCEM1',
    'MAJOR_PCEM2',
    'MAJOR_DCEM1'
  ] as const)
});

// ============================================
// LISTE DES BADGES DISPONIBLES
// ============================================

/**
 * GET /api/admin/badges
 * Liste tous les badges du système
 */
adminBadgesRouter.get('/badges', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { userBadges: true }
        }
      }
    });

    res.json({
      success: true,
      badges: badges.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        iconUrl: b.iconUrl,
        requirement: b.requirement,
        usersCount: b._count.userBadges
      }))
    });
  } catch (error: any) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des badges'
    });
  }
});

// ============================================
// MAJORS PAR CLASSE (LEADERBOARD)
// ============================================

/**
 * GET /api/admin/badges/majors
 * Récupère les top 3 étudiants de chaque classe (PCEM1, PCEM2, DCEM1)
 */
adminBadgesRouter.get('/badges/majors', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const semesters = ['PCEM1', 'PCEM2', 'DCEM1'];
    const majorsBySemester: Record<string, any[]> = {};

    for (const semester of semesters) {
      const topStudents = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          semester: semester
        },
        orderBy: {
          xpTotal: 'desc'
        },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          xpTotal: true,
          level: true,
          profilePicture: true,
          userBadges: {
            include: {
              badge: true
            }
          }
        }
      });

      majorsBySemester[semester] = topStudents.map((student, index) => ({
        rank: index + 1,
        id: student.id,
        name: student.name,
        email: student.email,
        xpTotal: student.xpTotal,
        level: student.level,
        profilePicture: student.profilePicture,
        hasMajorBadge: student.userBadges.some((ub: any) =>
          ub.badge.requirement === `MAJOR_${semester}`
        ),
        badges: student.userBadges.map((ub: any) => ({
          id: ub.badge.id,
          name: ub.badge.name,
          requirement: ub.badge.requirement
        }))
      }));
    }

    res.json({
      success: true,
      majorsBySemester
    });
  } catch (error: any) {
    console.error('Error fetching majors:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des majors'
    });
  }
});

// ============================================
// ATTRIBUER UN BADGE MAJOR
// ============================================

/**
 * POST /api/admin/badges/assign
 * Attribue un badge major à un utilisateur
 */
adminBadgesRouter.post('/badges/assign', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const validation = assignBadgeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.issues
      });
    }

    const { userId, badgeRequirement } = validation.data;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, semester: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Trouver ou créer le badge
    let badge = await prisma.badge.findFirst({
      where: { requirement: badgeRequirement as any }
    });

    if (!badge) {
      // Créer le badge s'il n'existe pas
      const badgeInfo = getMajorBadgeInfo(badgeRequirement);
      badge = await prisma.badge.create({
        data: {
          name: badgeInfo.name,
          description: badgeInfo.description,
          iconUrl: badgeInfo.iconUrl,
          requirement: badgeRequirement as any
        }
      });
    }

    // Vérifier si l'utilisateur a déjà ce badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: userId,
          badgeId: badge.id
        }
      }
    });

    if (existingUserBadge) {
      return res.status(400).json({
        success: false,
        error: 'L\'utilisateur possède déjà ce badge'
      });
    }

    // Attribuer le badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId: userId,
        badgeId: badge.id
      },
      include: {
        badge: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`🏆 Badge "${badge.name}" attribué à ${user.name} par admin ${req.userId}`);

    res.json({
      success: true,
      message: `Badge "${badge.name}" attribué à ${user.name}`,
      userBadge: {
        id: userBadge.id,
        earnedAt: userBadge.earnedAt,
        badge: {
          id: userBadge.badge.id,
          name: userBadge.badge.name,
          description: userBadge.badge.description,
          requirement: userBadge.badge.requirement
        },
        user: {
          name: userBadge.user.name,
          email: userBadge.user.email
        }
      }
    });
  } catch (error: any) {
    console.error('Error assigning badge:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'attribution du badge'
    });
  }
});

// ============================================
// RETIRER UN BADGE MAJOR
// ============================================

/**
 * POST /api/admin/badges/revoke
 * Retire un badge major d'un utilisateur
 */
adminBadgesRouter.post('/badges/revoke', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const validation = revokeBadgeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.issues
      });
    }

    const { userId, badgeRequirement } = validation.data;

    // Trouver le badge
    const badge = await prisma.badge.findFirst({
      where: { requirement: badgeRequirement as any }
    });

    if (!badge) {
      return res.status(404).json({
        success: false,
        error: 'Badge non trouvé'
      });
    }

    // Vérifier si l'utilisateur a ce badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: userId,
          badgeId: badge.id
        }
      },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!userBadge) {
      return res.status(404).json({
        success: false,
        error: 'L\'utilisateur ne possède pas ce badge'
      });
    }

    // Retirer le badge
    await prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId: userId,
          badgeId: badge.id
        }
      }
    });

    console.log(`🏆 Badge "${badge.name}" retiré de ${userBadge.user.name} par admin ${req.userId}`);

    res.json({
      success: true,
      message: `Badge "${badge.name}" retiré de ${userBadge.user.name}`
    });
  } catch (error: any) {
    console.error('Error revoking badge:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du retrait du badge'
    });
  }
});

// ============================================
// UTILISATEURS AVEC BADGES MAJORS
// ============================================

/**
 * GET /api/admin/badges/major-holders
 * Liste tous les utilisateurs qui ont un badge major
 */
adminBadgesRouter.get('/badges/major-holders', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const majorBadges = await prisma.badge.findMany({
      where: {
        requirement: {
          in: ['MAJOR_PCEM1', 'MAJOR_PCEM2', 'MAJOR_DCEM1'] as any[]
        }
      },
      include: {
        userBadges: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                semester: true,
                xpTotal: true,
                level: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    const holders = majorBadges.flatMap(badge =>
      badge.userBadges.map((ub: any) => ({
        badgeId: badge.id,
        badgeName: badge.name,
        badgeRequirement: badge.requirement,
        earnedAt: ub.earnedAt,
        user: ub.user
      }))
    );

    res.json({
      success: true,
      holders
    });
  } catch (error: any) {
    console.error('Error fetching major holders:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détenteurs de badges'
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMajorBadgeInfo(requirement: string): { name: string; description: string; iconUrl: string } {
  const badgeInfoMap: Record<string, { name: string; description: string; iconUrl: string }> = {
    'MAJOR_PCEM1': {
      name: 'Major de Promo PCEM1',
      description: 'Premier de la promotion PCEM1',
      iconUrl: '/images/badges/major-pcem1.png'
    },
    'MAJOR_PCEM2': {
      name: 'Major de Promo PCEM2',
      description: 'Premier de la promotion PCEM2',
      iconUrl: '/images/badges/major-pcem2.png'
    },
    'MAJOR_DCEM1': {
      name: 'Major de Promo DCEM1',
      description: 'Premier de la promotion DCEM1',
      iconUrl: '/images/badges/major-dcem1.png'
    }
  };

  return badgeInfoMap[requirement] || {
    name: requirement,
    description: 'Badge spécial',
    iconUrl: '/images/badges/default.png'
  };
}

export default adminBadgesRouter;
