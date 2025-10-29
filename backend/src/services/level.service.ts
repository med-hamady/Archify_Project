/**
 * Level Service - FacGame
 *
 * Gère le système de niveaux (Bois → Mondial) :
 * - Calcul du niveau selon l'XP
 * - Détection des level-up
 * - Récompenses par niveau
 * - Progression vers le niveau suivant
 */

import { GameLevel } from '@prisma/client';

// ============================================
// CONSTANTES
// ============================================

/**
 * Seuils d'XP pour chaque niveau (mise à jour update4)
 */
export const LEVEL_THRESHOLDS: Record<GameLevel, { min: number; max: number; name: string }> = {
  BOIS: { min: 0, max: 1200, name: 'Bois' },
  BRONZE: { min: 1201, max: 2600, name: 'Bronze' },
  ARGENT: { min: 2601, max: 4400, name: 'Argent' },
  OR: { min: 4401, max: 6500, name: 'Or' },
  PLATINUM: { min: 6501, max: 8500, name: 'Platinum' },
  DIAMANT: { min: 8501, max: 15000, name: 'Diamant' },
  MONDIAL: { min: 15001, max: Infinity, name: 'Mondial' }
};

/**
 * Ordre des niveaux pour comparaisons
 */
export const LEVEL_ORDER: GameLevel[] = [
  'BOIS',
  'BRONZE',
  'ARGENT',
  'OR',
  'PLATINUM',
  'DIAMANT',
  'MONDIAL'
];

/**
 * Récompenses par niveau
 */
export const LEVEL_REWARDS: Record<GameLevel, string[]> = {
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
  DIAMANT: [
    'Mode révision libre débloqué',
    'Badge Diamant',
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
export const LEVEL_XP_BONUSES: Record<GameLevel, number> = {
  BOIS: 0,
  BRONZE: 2, // +2%
  ARGENT: 5, // +3% (cumulatif = 2+3)
  OR: 8, // +3% (cumulatif = 2+3+3)
  PLATINUM: 13, // +5% (cumulatif = 2+3+3+5)
  DIAMANT: 23, // +10% (cumulatif = 2+3+3+5+10)
  MONDIAL: 23 // Pas de bonus supplémentaire
};

// ============================================
// TYPES
// ============================================

export interface LevelInfo {
  current: GameLevel;
  currentName: string;
  xpCurrent: number;
  xpMin: number;
  xpMax: number;
  xpToNextLevel: number;
  progressPercent: number;
  isMaxLevel: boolean;
}

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel?: GameLevel;
  newLevel?: GameLevel;
  rewards?: string[];
  message?: string;
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Détermine le niveau à partir de l'XP totale
 *
 * @param xp - XP totale de l'utilisateur
 * @returns Niveau correspondant
 */
export function getLevelFromXP(xp: number): GameLevel {
  if (xp <= 1200) return 'BOIS';
  if (xp <= 2600) return 'BRONZE';
  if (xp <= 4400) return 'ARGENT';
  if (xp <= 6500) return 'OR';
  if (xp <= 8500) return 'PLATINUM';
  if (xp <= 15000) return 'DIAMANT';
  return 'MONDIAL';
}

/**
 * Récupère les informations détaillées du niveau actuel
 *
 * @param xp - XP totale de l'utilisateur
 * @returns Informations complètes sur le niveau
 */
export function getLevelInfo(xp: number): LevelInfo {
  const level = getLevelFromXP(xp);
  const threshold = LEVEL_THRESHOLDS[level];

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
export function checkLevelUp(oldXP: number, newXP: number): LevelUpResult {
  const oldLevel = getLevelFromXP(oldXP);
  const newLevel = getLevelFromXP(newXP);

  if (oldLevel !== newLevel) {
    return {
      leveledUp: true,
      oldLevel,
      newLevel,
      rewards: LEVEL_REWARDS[newLevel],
      message: `🎉 Félicitations ! Vous avez atteint le niveau ${LEVEL_THRESHOLDS[newLevel].name} !`
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
export function compareLevels(level1: GameLevel, level2: GameLevel): number {
  const index1 = LEVEL_ORDER.indexOf(level1);
  const index2 = LEVEL_ORDER.indexOf(level2);

  if (index1 < index2) return -1;
  if (index1 > index2) return 1;
  return 0;
}

/**
 * Vérifie si un utilisateur a atteint un niveau minimum requis
 *
 * @param userLevel - Niveau de l'utilisateur
 * @param requiredLevel - Niveau minimum requis
 * @returns true si l'utilisateur a le niveau requis ou supérieur
 */
export function hasRequiredLevel(userLevel: GameLevel, requiredLevel: GameLevel): boolean {
  return compareLevels(userLevel, requiredLevel) >= 0;
}

/**
 * Récupère le bonus XP permanent pour un niveau donné
 *
 * @param level - Niveau de l'utilisateur
 * @returns Bonus en pourcentage (ex: 5 pour +5%)
 */
export function getLevelXPBonus(level: GameLevel): number {
  return LEVEL_XP_BONUSES[level];
}

/**
 * Applique le bonus de niveau à un montant d'XP
 *
 * @param baseXP - XP de base
 * @param level - Niveau de l'utilisateur
 * @returns XP avec bonus de niveau appliqué
 */
export function applyLevelBonus(baseXP: number, level: GameLevel): number {
  const bonus = getLevelXPBonus(level);
  if (bonus === 0) return baseXP;

  const bonusAmount = baseXP * (bonus / 100);
  return Math.round(baseXP + bonusAmount);
}

/**
 * Récupère le niveau suivant
 *
 * @param currentLevel - Niveau actuel
 * @returns Niveau suivant ou null si niveau max
 */
export function getNextLevel(currentLevel: GameLevel): GameLevel | null {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  if (currentIndex === LEVEL_ORDER.length - 1) {
    return null; // Déjà au niveau max
  }
  return LEVEL_ORDER[currentIndex + 1];
}

/**
 * Calcule l'XP nécessaire pour atteindre un niveau spécifique
 *
 * @param targetLevel - Niveau cible
 * @returns XP minimum requise pour ce niveau
 */
export function getXPRequiredForLevel(targetLevel: GameLevel): number {
  return LEVEL_THRESHOLDS[targetLevel].min;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Retourne un résumé textuel des informations de niveau
 */
export function getLevelSummary(levelInfo: LevelInfo): string {
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
export function getAllLevelsInfo(): Array<{
  level: GameLevel;
  name: string;
  xpMin: number;
  xpMax: number;
  rewards: string[];
}> {
  return LEVEL_ORDER.map(level => ({
    level,
    name: LEVEL_THRESHOLDS[level].name,
    xpMin: LEVEL_THRESHOLDS[level].min,
    xpMax: LEVEL_THRESHOLDS[level].max,
    rewards: LEVEL_REWARDS[level]
  }));
}

/**
 * Valide qu'un niveau existe
 */
export function isValidLevel(level: string): level is GameLevel {
  return LEVEL_ORDER.includes(level as GameLevel);
}

// ============================================
// FONCTIONS DE DÉBLOCAGE (selon niveau)
// ============================================

/**
 * Vérifie si le Mode Examen est débloqué (nécessite niveau Argent minimum)
 */
export function canAccessExamMode(userLevel: GameLevel): boolean {
  return hasRequiredLevel(userLevel, 'ARGENT');
}

/**
 * Vérifie si le Mode Challenge global est débloqué (nécessite niveau Or)
 */
export function hasGlobalChallengeUnlock(userLevel: GameLevel): boolean {
  return hasRequiredLevel(userLevel, 'OR');
}

/**
 * Vérifie si l'utilisateur a accès au classement compétitif
 */
export function canAccessCompetitiveLeaderboard(userLevel: GameLevel): boolean {
  return hasRequiredLevel(userLevel, 'OR');
}

/**
 * Vérifie si le mode révision libre est débloqué
 */
export function hasRevisionModeUnlocked(userLevel: GameLevel): boolean {
  return hasRequiredLevel(userLevel, 'DIAMANT');
}
