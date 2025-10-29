"use strict";
/**
 * Badge Service - FacGame
 *
 * Gère l'attribution automatique des badges selon les accomplissements :
 * - Badges de niveau
 * - Badges de performance (séries, challenges, etc.)
 * - Vérification des conditions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndAwardBadges = checkAndAwardBadges;
exports.awardChallengePerfectBadge = awardChallengePerfectBadge;
exports.awardFirstExamPassedBadge = awardFirstExamPassedBadge;
exports.awardPerfectChapterBadge = awardPerfectChapterBadge;
exports.getUserBadges = getUserBadges;
exports.getUserBadgeCount = getUserBadgeCount;
exports.getAllBadges = getAllBadges;
exports.userHasBadge = userHasBadge;
exports.getLatestBadge = getLatestBadge;
exports.getUserBadgeStats = getUserBadgeStats;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
async function checkAndAwardBadges(userId, stats) {
    const newBadges = [];
    const messages = [];
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
async function awardChallengePerfectBadge(userId) {
    const badge = await getBadgeByRequirement('CHALLENGE_100_PERCENT');
    if (!badge)
        return null;
    // Vérifier si déjà obtenu
    const existing = await prisma.userBadge.findUnique({
        where: {
            userId_badgeId: {
                userId,
                badgeId: badge.id
            }
        }
    });
    if (existing)
        return null;
    await awardBadge(userId, badge.id);
    return badge;
}
/**
 * Attribue un badge pour le premier examen réussi
 *
 * @param userId - ID de l'utilisateur
 * @returns Badge attribué ou null
 */
async function awardFirstExamPassedBadge(userId) {
    const badge = await getBadgeByRequirement('FIRST_EXAM_PASSED');
    if (!badge)
        return null;
    // Vérifier si déjà obtenu
    const existing = await prisma.userBadge.findUnique({
        where: {
            userId_badgeId: {
                userId,
                badgeId: badge.id
            }
        }
    });
    if (existing)
        return null;
    await awardBadge(userId, badge.id);
    return badge;
}
/**
 * Attribue un badge pour un chapitre parfait (100% en 1ère tentative)
 *
 * @param userId - ID de l'utilisateur
 * @returns Badge attribué ou null
 */
async function awardPerfectChapterBadge(userId) {
    const badge = await getBadgeByRequirement('PERFECT_CHAPTER');
    if (!badge)
        return null;
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
async function checkLevelBadge(level, existingBadgeIds) {
    const requirementMap = {
        BOIS: null,
        BRONZE: 'REACH_BRONZE',
        ARGENT: 'REACH_ARGENT',
        OR: 'REACH_OR',
        PLATINUM: 'REACH_PLATINUM',
        DIAMANT: 'REACH_DIAMANT',
        MONDIAL: 'REACH_MONDIAL'
    };
    const requirement = requirementMap[level];
    if (!requirement)
        return null;
    const badge = await getBadgeByRequirement(requirement);
    if (!badge || existingBadgeIds.has(badge.id))
        return null;
    return badge;
}
/**
 * Récupère un badge par son requirement
 */
async function getBadgeByRequirement(requirement) {
    return await prisma.badge.findFirst({
        where: { requirement }
    });
}
/**
 * Attribue un badge à un utilisateur
 */
async function awardBadge(userId, badgeId) {
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
async function getUserBadges(userId) {
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
async function getUserBadgeCount(userId) {
    return await prisma.userBadge.count({
        where: { userId }
    });
}
/**
 * Récupère tous les badges disponibles dans le système
 */
async function getAllBadges() {
    return await prisma.badge.findMany({
        orderBy: { name: 'asc' }
    });
}
/**
 * Vérifie si un utilisateur possède un badge spécifique
 */
async function userHasBadge(userId, badgeId) {
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
async function getLatestBadge(userId) {
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
async function getUserBadgeStats(userId) {
    const badges = await getUserBadges(userId);
    const byCategory = {
        level: 0,
        performance: 0,
        achievement: 0
    };
    badges.forEach(badge => {
        if (badge.requirement.startsWith('REACH_')) {
            byCategory.level++;
        }
        else if (badge.requirement.startsWith('STREAK_')) {
            byCategory.performance++;
        }
        else {
            byCategory.achievement++;
        }
    });
    return {
        total: badges.length,
        byCategory,
        latestBadge: await getLatestBadge(userId)
    };
}
//# sourceMappingURL=badge.service.js.map