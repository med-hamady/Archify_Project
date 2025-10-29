/**
 * Badge Service - FacGame
 *
 * Gère l'attribution automatique des badges selon les accomplissements :
 * - Badges de niveau
 * - Badges de performance (séries, challenges, etc.)
 * - Vérification des conditions
 */

import { PrismaClient, Badge, BadgeRequirement, GameLevel } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface BadgeCheckResult {
  awarded: boolean;
  badges: Badge[];
  messages: string[];
}

export interface UserBadgeStats {
  consecutiveGoodAnswers: number;
  legendQuestionsCompleted: number;
  level: GameLevel;
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Vérifie et attribue les badges mérités après une action
 *
 * @param userId - ID de l'utilisateur
 * @param stats - Statistiques actuelles de l'utilisateur
 * @returns Badges nouvellement obtenus
 */
export async function checkAndAwardBadges(
  userId: string,
  stats: UserBadgeStats
): Promise<BadgeCheckResult> {
  const newBadges: Badge[] = [];
  const messages: string[] = [];

  // Récupérer les badges déjà obtenus
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true }
  });

  const existingBadgeIds = new Set(existingBadges.map(ub => ub.badgeId));

  // Vérifier badge de niveau
  const levelBadge = await checkLevelBadge(stats.level, existingBadgeIds);
  if (levelBadge) {
    await awardBadge(userId, levelBadge.id);
    newBadges.push(levelBadge);
    messages.push(`🏆 Badge "${levelBadge.name}" débloqué !`);
  }

  // Vérifier badge série de 5
  if (stats.consecutiveGoodAnswers === 5) {
    const streakBadge = await getBadgeByRequirement('STREAK_5_CORRECT');
    if (streakBadge && !existingBadgeIds.has(streakBadge.id)) {
      await awardBadge(userId, streakBadge.id);
      newBadges.push(streakBadge);
      messages.push(`🔥 Badge "${streakBadge.name}" débloqué !`);
    }
  }

  // Vérifier badge série de 10
  if (stats.consecutiveGoodAnswers === 10) {
    const streakBadge = await getBadgeByRequirement('STREAK_10_CORRECT');
    if (streakBadge && !existingBadgeIds.has(streakBadge.id)) {
      await awardBadge(userId, streakBadge.id);
      newBadges.push(streakBadge);
      messages.push(`🔥🔥 Badge "${streakBadge.name}" débloqué !`);
    }
  }

  // Vérifier badge Maître des Légendes (100 questions légendaires)
  if (stats.legendQuestionsCompleted >= 100) {
    const legendBadge = await getBadgeByRequirement('COMPLETE_100_LEGEND_QCM');
    if (legendBadge && !existingBadgeIds.has(legendBadge.id)) {
      await awardBadge(userId, legendBadge.id);
      newBadges.push(legendBadge);
      messages.push(`⭐ Badge "${legendBadge.name}" débloqué !`);
    }
  }

  return {
    awarded: newBadges.length > 0,
    badges: newBadges,
    messages
  };
}

/**
 * Attribue un badge pour un challenge parfait (100%)
 *
 * @param userId - ID de l'utilisateur
 * @returns Badge attribué ou null
 */
export async function awardChallengePerfectBadge(userId: string): Promise<Badge | null> {
  const badge = await getBadgeByRequirement('CHALLENGE_100_PERCENT');
  if (!badge) return null;

  // Vérifier si déjà obtenu
  const existing = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id
      }
    }
  });

  if (existing) return null;

  await awardBadge(userId, badge.id);
  return badge;
}

/**
 * Attribue un badge pour le premier examen réussi
 *
 * @param userId - ID de l'utilisateur
 * @returns Badge attribué ou null
 */
export async function awardFirstExamPassedBadge(userId: string): Promise<Badge | null> {
  const badge = await getBadgeByRequirement('FIRST_EXAM_PASSED');
  if (!badge) return null;

  // Vérifier si déjà obtenu
  const existing = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id
      }
    }
  });

  if (existing) return null;

  await awardBadge(userId, badge.id);
  return badge;
}

/**
 * Attribue un badge pour un chapitre parfait (100% en 1ère tentative)
 *
 * @param userId - ID de l'utilisateur
 * @returns Badge attribué ou null
 */
export async function awardPerfectChapterBadge(userId: string): Promise<Badge | null> {
  const badge = await getBadgeByRequirement('PERFECT_CHAPTER');
  if (!badge) return null;

  // Ce badge peut être obtenu plusieurs fois (pas de vérification d'unicité)
  await awardBadge(userId, badge.id);
  return badge;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifie si un badge de niveau doit être attribué
 */
async function checkLevelBadge(
  level: GameLevel,
  existingBadgeIds: Set<string>
): Promise<Badge | null> {
  const requirementMap: Record<GameLevel, BadgeRequirement | null> = {
    BOIS: null,
    BRONZE: 'REACH_BRONZE',
    ARGENT: 'REACH_ARGENT',
    OR: 'REACH_OR',
    PLATINUM: 'REACH_PLATINUM',
    DIAMANT: 'REACH_DIAMANT',
    MONDIAL: 'REACH_MONDIAL'
  };

  const requirement = requirementMap[level];
  if (!requirement) return null;

  const badge = await getBadgeByRequirement(requirement);
  if (!badge || existingBadgeIds.has(badge.id)) return null;

  return badge;
}

/**
 * Récupère un badge par son requirement
 */
async function getBadgeByRequirement(requirement: BadgeRequirement): Promise<Badge | null> {
  return await prisma.badge.findFirst({
    where: { requirement }
  });
}

/**
 * Attribue un badge à un utilisateur
 */
async function awardBadge(userId: string, badgeId: string): Promise<void> {
  await prisma.userBadge.create({
    data: {
      userId,
      badgeId
    }
  });
}

/**
 * Récupère tous les badges d'un utilisateur
 */
export async function getUserBadges(userId: string): Promise<Badge[]> {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' }
  });

  return userBadges.map(ub => ub.badge);
}

/**
 * Récupère le nombre de badges obtenus par un utilisateur
 */
export async function getUserBadgeCount(userId: string): Promise<number> {
  return await prisma.userBadge.count({
    where: { userId }
  });
}

/**
 * Récupère tous les badges disponibles dans le système
 */
export async function getAllBadges(): Promise<Badge[]> {
  return await prisma.badge.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Vérifie si un utilisateur possède un badge spécifique
 */
export async function userHasBadge(userId: string, badgeId: string): Promise<boolean> {
  const userBadge = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId
      }
    }
  });

  return userBadge !== null;
}

/**
 * Récupère le dernier badge obtenu par un utilisateur
 */
export async function getLatestBadge(userId: string): Promise<Badge | null> {
  const latest = await prisma.userBadge.findFirst({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' }
  });

  return latest?.badge || null;
}

/**
 * Récupère les statistiques de badges d'un utilisateur
 */
export async function getUserBadgeStats(userId: string): Promise<{
  total: number;
  byCategory: Record<string, number>;
  latestBadge: Badge | null;
}> {
  const badges = await getUserBadges(userId);
  const byCategory: Record<string, number> = {
    level: 0,
    performance: 0,
    achievement: 0
  };

  badges.forEach(badge => {
    if (badge.requirement.startsWith('REACH_')) {
      byCategory.level++;
    } else if (badge.requirement.startsWith('STREAK_')) {
      byCategory.performance++;
    } else {
      byCategory.achievement++;
    }
  });

  return {
    total: badges.length,
    byCategory,
    latestBadge: await getLatestBadge(userId)
  };
}
