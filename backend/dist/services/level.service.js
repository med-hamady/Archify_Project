"use strict";
/**
 * Level Service - FacGame
 *
 * Gère le système de niveaux (Bois → Mondial) :
 * - Calcul du niveau selon l'XP
 * - Détection des level-up
 * - Récompenses par niveau
 * - Progression vers le niveau suivant
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL_XP_BONUSES = exports.LEVEL_REWARDS = exports.LEVEL_ORDER = exports.LEVEL_THRESHOLDS = void 0;
exports.getLevelFromXP = getLevelFromXP;
exports.getLevelInfo = getLevelInfo;
exports.checkLevelUp = checkLevelUp;
exports.compareLevels = compareLevels;
exports.hasRequiredLevel = hasRequiredLevel;
exports.getLevelXPBonus = getLevelXPBonus;
exports.applyLevelBonus = applyLevelBonus;
exports.getNextLevel = getNextLevel;
exports.getXPRequiredForLevel = getXPRequiredForLevel;
exports.getLevelSummary = getLevelSummary;
exports.getAllLevelsInfo = getAllLevelsInfo;
exports.isValidLevel = isValidLevel;
exports.canAccessExamMode = canAccessExamMode;
exports.hasGlobalChallengeUnlock = hasGlobalChallengeUnlock;
exports.canAccessCompetitiveLeaderboard = canAccessCompetitiveLeaderboard;
exports.hasRevisionModeUnlocked = hasRevisionModeUnlocked;
// ============================================
// CONSTANTES
// ============================================
/**
 * Seuils d'XP pour chaque niveau
 */
exports.LEVEL_THRESHOLDS = {
    BOIS: { min: 0, max: 800, name: 'Bois' },
    BRONZE: { min: 801, max: 1600, name: 'Bronze' },
    ARGENT: { min: 1601, max: 2800, name: 'Argent' },
    OR: { min: 2801, max: 4000, name: 'Or' },
    PLATINUM: { min: 4001, max: 5500, name: 'Platinum' },
    LEGENDAIRE: { min: 5501, max: 9000, name: 'Légendaire' },
    MONDIAL: { min: 9001, max: Infinity, name: 'Mondial' }
};
/**
 * Ordre des niveaux pour comparaisons
 */
exports.LEVEL_ORDER = [
    'BOIS',
    'BRONZE',
    'ARGENT',
    'OR',
    'PLATINUM',
    'LEGENDAIRE',
    'MONDIAL'
];
/**
 * Récompenses par niveau
 */
exports.LEVEL_REWARDS = {
    BOIS: [],
    BRONZE: [
        '+2% XP permanent',
        'Badge Bronze',
        'Accès aux statistiques détaillées'
    ],
    ARGENT: [
        'Mode Examen débloqué (si progression ≥ 80%)',
        'Badge Argent',
        '+3% XP permanent (cumulatif)'
    ],
    OR: [
        'Mode Challenge global débloqué',
        '+3% XP permanent (cumulatif)',
        'Badge Or',
        'Accès au classement compétitif'
    ],
    PLATINUM: [
        '+5% XP sur QCM difficiles',
        'Badge Platinum',
        'Titre "Expert"'
    ],
    LEGENDAIRE: [
        'Mode révision libre débloqué',
        'Badge Légendaire',
        'Titre "Maître"',
        '+10% XP permanent (cumulatif)'
    ],
    MONDIAL: [
        'Classement international activé',
        'Titre "Excellence Mondiale"',
        'Badge Mondial',
        'Accès VIP au contenu premium'
    ]
};
/**
 * Bonus XP permanents par niveau
 */
exports.LEVEL_XP_BONUSES = {
    BOIS: 0,
    BRONZE: 2, // +2%
    ARGENT: 5, // +3% (cumulatif = 2+3)
    OR: 8, // +3% (cumulatif = 2+3+3)
    PLATINUM: 13, // +5% (cumulatif = 2+3+3+5)
    LEGENDAIRE: 23, // +10% (cumulatif = 2+3+3+5+10)
    MONDIAL: 23 // Pas de bonus supplémentaire
};
// ============================================
// FONCTIONS PRINCIPALES
// ============================================
/**
 * Détermine le niveau à partir de l'XP totale
 *
 * @param xp - XP totale de l'utilisateur
 * @returns Niveau correspondant
 */
function getLevelFromXP(xp) {
    if (xp <= 800)
        return 'BOIS';
    if (xp <= 1600)
        return 'BRONZE';
    if (xp <= 2800)
        return 'ARGENT';
    if (xp <= 4000)
        return 'OR';
    if (xp <= 5500)
        return 'PLATINUM';
    if (xp <= 9000)
        return 'LEGENDAIRE';
    return 'MONDIAL';
}
/**
 * Récupère les informations détaillées du niveau actuel
 *
 * @param xp - XP totale de l'utilisateur
 * @returns Informations complètes sur le niveau
 */
function getLevelInfo(xp) {
    const level = getLevelFromXP(xp);
    const threshold = exports.LEVEL_THRESHOLDS[level];
    const xpToNextLevel = level === 'MONDIAL'
        ? 0
        : threshold.max - xp + 1;
    const progressPercent = level === 'MONDIAL'
        ? 100
        : Math.round(((xp - threshold.min) / (threshold.max - threshold.min)) * 100);
    return {
        current: level,
        currentName: threshold.name,
        xpCurrent: xp,
        xpMin: threshold.min,
        xpMax: threshold.max,
        xpToNextLevel,
        progressPercent: Math.max(0, Math.min(100, progressPercent)),
        isMaxLevel: level === 'MONDIAL'
    };
}
/**
 * Vérifie si un level-up s'est produit
 *
 * @param oldXP - XP avant l'action
 * @param newXP - XP après l'action
 * @returns Résultat du level-up avec récompenses
 */
function checkLevelUp(oldXP, newXP) {
    const oldLevel = getLevelFromXP(oldXP);
    const newLevel = getLevelFromXP(newXP);
    if (oldLevel !== newLevel) {
        return {
            leveledUp: true,
            oldLevel,
            newLevel,
            rewards: exports.LEVEL_REWARDS[newLevel],
            message: `🎉 Félicitations ! Vous avez atteint le niveau ${exports.LEVEL_THRESHOLDS[newLevel].name} !`
        };
    }
    return { leveledUp: false };
}
/**
 * Compare deux niveaux
 *
 * @param level1 - Premier niveau
 * @param level2 - Deuxième niveau
 * @returns -1 si level1 < level2, 0 si égaux, 1 si level1 > level2
 */
function compareLevels(level1, level2) {
    const index1 = exports.LEVEL_ORDER.indexOf(level1);
    const index2 = exports.LEVEL_ORDER.indexOf(level2);
    if (index1 < index2)
        return -1;
    if (index1 > index2)
        return 1;
    return 0;
}
/**
 * Vérifie si un utilisateur a atteint un niveau minimum requis
 *
 * @param userLevel - Niveau de l'utilisateur
 * @param requiredLevel - Niveau minimum requis
 * @returns true si l'utilisateur a le niveau requis ou supérieur
 */
function hasRequiredLevel(userLevel, requiredLevel) {
    return compareLevels(userLevel, requiredLevel) >= 0;
}
/**
 * Récupère le bonus XP permanent pour un niveau donné
 *
 * @param level - Niveau de l'utilisateur
 * @returns Bonus en pourcentage (ex: 5 pour +5%)
 */
function getLevelXPBonus(level) {
    return exports.LEVEL_XP_BONUSES[level];
}
/**
 * Applique le bonus de niveau à un montant d'XP
 *
 * @param baseXP - XP de base
 * @param level - Niveau de l'utilisateur
 * @returns XP avec bonus de niveau appliqué
 */
function applyLevelBonus(baseXP, level) {
    const bonus = getLevelXPBonus(level);
    if (bonus === 0)
        return baseXP;
    const bonusAmount = baseXP * (bonus / 100);
    return Math.round(baseXP + bonusAmount);
}
/**
 * Récupère le niveau suivant
 *
 * @param currentLevel - Niveau actuel
 * @returns Niveau suivant ou null si niveau max
 */
function getNextLevel(currentLevel) {
    const currentIndex = exports.LEVEL_ORDER.indexOf(currentLevel);
    if (currentIndex === exports.LEVEL_ORDER.length - 1) {
        return null; // Déjà au niveau max
    }
    return exports.LEVEL_ORDER[currentIndex + 1];
}
/**
 * Calcule l'XP nécessaire pour atteindre un niveau spécifique
 *
 * @param targetLevel - Niveau cible
 * @returns XP minimum requise pour ce niveau
 */
function getXPRequiredForLevel(targetLevel) {
    return exports.LEVEL_THRESHOLDS[targetLevel].min;
}
// ============================================
// FONCTIONS UTILITAIRES
// ============================================
/**
 * Retourne un résumé textuel des informations de niveau
 */
function getLevelSummary(levelInfo) {
    if (levelInfo.isMaxLevel) {
        return `
Niveau: ${levelInfo.currentName} (MAX)
XP totale: ${levelInfo.xpCurrent}
Vous avez atteint le niveau maximum !
    `.trim();
    }
    return `
Niveau: ${levelInfo.currentName}
XP actuelle: ${levelInfo.xpCurrent} / ${levelInfo.xpMax}
Progression: ${levelInfo.progressPercent}%
XP jusqu'au prochain niveau: ${levelInfo.xpToNextLevel}
  `.trim();
}
/**
 * Retourne toutes les informations sur tous les niveaux
 */
function getAllLevelsInfo() {
    return exports.LEVEL_ORDER.map(level => ({
        level,
        name: exports.LEVEL_THRESHOLDS[level].name,
        xpMin: exports.LEVEL_THRESHOLDS[level].min,
        xpMax: exports.LEVEL_THRESHOLDS[level].max,
        rewards: exports.LEVEL_REWARDS[level]
    }));
}
/**
 * Valide qu'un niveau existe
 */
function isValidLevel(level) {
    return exports.LEVEL_ORDER.includes(level);
}
// ============================================
// FONCTIONS DE DÉBLOCAGE (selon niveau)
// ============================================
/**
 * Vérifie si le Mode Examen est débloqué (nécessite niveau Argent minimum)
 */
function canAccessExamMode(userLevel) {
    return hasRequiredLevel(userLevel, 'ARGENT');
}
/**
 * Vérifie si le Mode Challenge global est débloqué (nécessite niveau Or)
 */
function hasGlobalChallengeUnlock(userLevel) {
    return hasRequiredLevel(userLevel, 'OR');
}
/**
 * Vérifie si l'utilisateur a accès au classement compétitif
 */
function canAccessCompetitiveLeaderboard(userLevel) {
    return hasRequiredLevel(userLevel, 'OR');
}
/**
 * Vérifie si le mode révision libre est débloqué
 */
function hasRevisionModeUnlocked(userLevel) {
    return hasRequiredLevel(userLevel, 'LEGENDAIRE');
}
//# sourceMappingURL=level.service.js.map