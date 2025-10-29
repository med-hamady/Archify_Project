"use strict";
/**
 * XP Service - FacGame
 *
 * Gère le calcul de l'expérience (XP) selon l'algorithme défini dans le cahier des charges :
 * - XP de base selon la difficulté
 * - Multiplicateur selon le numéro de tentative
 * - Facteur de progression dans le chapitre
 * - Bonus temporaires
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPECIAL_BONUSES = exports.CONSECUTIVE_BONUSES = exports.ATTEMPT_XP = exports.BASE_XP = void 0;
exports.calculateXP = calculateXP;
exports.checkConsecutiveBonus = checkConsecutiveBonus;
exports.calculateChallengeBonus = calculateChallengeBonus;
exports.calculatePerfectChapterBonus = calculatePerfectChapterBonus;
exports.getXPCalculationSummary = getXPCalculationSummary;
exports.validateXPParams = validateXPParams;
exports.getXPExamples = getXPExamples;
// ============================================
// CONSTANTES
// ============================================
/**
 * XP de base selon la difficulté de la question
 */
exports.BASE_XP = {
    FACILE: 5,
    MOYEN: 10,
    DIFFICILE: 20,
    LEGENDE: 30
};
/**
 * XP directe selon le numéro de tentative (nouvelles règles)
 * 1ère tentative correcte: +10 XP
 * 2ème tentative correcte: +3 XP
 * 3ème tentative ou plus: 0 XP
 * Note: Tous les QCM donnent le même XP, indépendamment de la difficulté
 */
exports.ATTEMPT_XP = {
    1: 10,
    2: 3
};
/**
 * Bonus consécutifs
 */
exports.CONSECUTIVE_BONUSES = {
    STREAK_5: {
        count: 5,
        xpBonus: 0,
        bonusPercent: 20, // +20% XP temporaire
        duration: 60 * 60 // 1 heure en secondes
    },
    STREAK_10: {
        count: 10,
        xpBonus: 50,
        bonusPercent: 0,
        duration: 0
    }
};
/**
 * Bonus spéciaux
 */
exports.SPECIAL_BONUSES = {
    CHALLENGE_100_PERCENT: 200,
    LEVEL_UP_BRONZE: 0, // Pas de XP, juste badge
    LEVEL_UP_ARGENT: 0,
    LEVEL_UP_OR: 0,
    PERFECT_CHAPTER: 100
};
// ============================================
// FONCTIONS PRINCIPALES
// ============================================
/**
 * Calcule l'XP gagnée pour une réponse à un QCM (mode Révision/Relax)
 *
 * Nouvelles règles simples :
 * - 1ère tentative correcte = +10 XP
 * - 2ème tentative correcte = +3 XP
 * - 3ème tentative ou plus = 0 XP
 * - Tous les QCM donnent le même XP (pas de différence selon difficulté)
 *
 * @param params - Paramètres de calcul
 * @returns Détails du calcul XP
 */
function calculateXP(params) {
    const { difficulty, attemptNumber, positionInChapter, totalQuestionsInChapter, hasActiveBonus = false } = params;
    // 1. XP directe selon le numéro de tentative
    const xpEarned = exports.ATTEMPT_XP[attemptNumber] || 0;
    // Pour compatibilité avec l'ancienne structure
    const baseXP = exports.BASE_XP[difficulty]; // Garde la référence mais n'est plus utilisée
    return {
        xpEarned,
        baseXP, // Gardé pour compatibilité
        multiplier: attemptNumber <= 2 ? 1 : 0, // Simplifié
        progressionFactor: 1, // Plus utilisé
        bonusApplied: false // Plus de bonus temporaires dans le nouveau système
    };
}
/**
 * Vérifie si un bonus consécutif doit être déclenché
 *
 * @param consecutiveCount - Nombre de bonnes réponses consécutives
 * @returns Bonus déclenché ou null
 */
function checkConsecutiveBonus(consecutiveCount) {
    if (consecutiveCount === exports.CONSECUTIVE_BONUSES.STREAK_10.count) {
        return {
            type: 'STREAK_10',
            xpBonus: exports.CONSECUTIVE_BONUSES.STREAK_10.xpBonus,
            message: '🔥 Série de 10 ! Bonus +50 XP !'
        };
    }
    if (consecutiveCount === exports.CONSECUTIVE_BONUSES.STREAK_5.count) {
        return {
            type: 'STREAK_5',
            xpBonus: exports.CONSECUTIVE_BONUSES.STREAK_5.xpBonus,
            bonusPercent: exports.CONSECUTIVE_BONUSES.STREAK_5.bonusPercent,
            duration: exports.CONSECUTIVE_BONUSES.STREAK_5.duration,
            message: '⚡ Série de 5 ! Bonus +20% XP pendant 1 heure !'
        };
    }
    return {
        type: null,
        xpBonus: 0
    };
}
/**
 * Calcule le bonus XP pour un challenge réussi à 100%
 *
 * @param scorePercent - Score en pourcentage (0-100)
 * @returns Bonus XP
 */
function calculateChallengeBonus(scorePercent) {
    if (scorePercent === 100) {
        return exports.SPECIAL_BONUSES.CHALLENGE_100_PERCENT;
    }
    return 0;
}
/**
 * Calcule le bonus XP pour un chapitre complété parfaitement
 *
 * @param correctAnswers - Nombre de réponses correctes
 * @param totalQuestions - Nombre total de questions
 * @param allFirstAttempt - Toutes les réponses étaient en 1ère tentative
 * @returns Bonus XP
 */
function calculatePerfectChapterBonus(correctAnswers, totalQuestions, allFirstAttempt) {
    if (correctAnswers === totalQuestions && allFirstAttempt) {
        return exports.SPECIAL_BONUSES.PERFECT_CHAPTER;
    }
    return 0;
}
// ============================================
// FONCTIONS UTILITAIRES
// ============================================
/**
 * Retourne un résumé textuel du calcul XP pour le debug
 */
function getXPCalculationSummary(result) {
    return `
XP Calculation:
- Base XP: ${result.baseXP}
- Multiplier (attempt): ×${result.multiplier}
- Progression factor: ×${result.progressionFactor}
- Bonus applied: ${result.bonusApplied ? 'Yes (+20%)' : 'No'}
- Final XP: ${result.xpEarned}
  `.trim();
}
/**
 * Valide les paramètres de calcul XP
 */
function validateXPParams(params) {
    if (params.attemptNumber < 1) {
        return { valid: false, error: 'Attempt number must be >= 1' };
    }
    if (params.positionInChapter < 0 || params.positionInChapter >= params.totalQuestionsInChapter) {
        return {
            valid: false,
            error: 'Position must be between 0 and total questions - 1'
        };
    }
    if (params.totalQuestionsInChapter <= 0) {
        return { valid: false, error: 'Total questions must be > 0' };
    }
    return { valid: true };
}
// ============================================
// EXEMPLES D'UTILISATION (pour tests)
// ============================================
/**
 * Exemple de calcul XP pour différents scénarios
 */
function getXPExamples() {
    const examples = [
        {
            description: 'Question FACILE, 1ère tentative, début du chapitre (0/100)',
            result: calculateXP({
                difficulty: 'FACILE',
                attemptNumber: 1,
                positionInChapter: 0,
                totalQuestionsInChapter: 100
            })
        },
        {
            description: 'Question DIFFICILE, 1ère tentative, milieu du chapitre (50/100)',
            result: calculateXP({
                difficulty: 'DIFFICILE',
                attemptNumber: 1,
                positionInChapter: 50,
                totalQuestionsInChapter: 100
            })
        },
        {
            description: 'Question LEGENDE, 2ème tentative, fin du chapitre (99/100)',
            result: calculateXP({
                difficulty: 'LEGENDE',
                attemptNumber: 2,
                positionInChapter: 99,
                totalQuestionsInChapter: 100
            })
        },
        {
            description: 'Question MOYEN, 1ère tentative, avec bonus actif',
            result: calculateXP({
                difficulty: 'MOYEN',
                attemptNumber: 1,
                positionInChapter: 25,
                totalQuestionsInChapter: 100,
                hasActiveBonus: true
            })
        },
        {
            description: 'Question FACILE, 4ème tentative (pas d\'XP)',
            result: calculateXP({
                difficulty: 'FACILE',
                attemptNumber: 4,
                positionInChapter: 10,
                totalQuestionsInChapter: 100
            })
        }
    ];
    return examples;
}
//# sourceMappingURL=xp.service.js.map