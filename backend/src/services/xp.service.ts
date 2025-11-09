/**
 * XP Service - FacGame
 *
 * Gère le calcul de l'expérience (XP) selon l'algorithme défini dans le cahier des charges :
 * - XP de base selon la difficulté
 * - Multiplicateur selon le numéro de tentative
 * - Facteur de progression dans le chapitre
 * - Bonus temporaires
 */

// ============================================
// CONSTANTES
// ============================================

/**
 * XP de base selon la difficulté de la question
 * Note: La difficulté n'est plus stockée en base de données
 */
export const BASE_XP = {
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
export const ATTEMPT_XP: Record<number, number> = {
  1: 10,
  2: 3
};

/**
 * Bonus consécutifs
 */
export const CONSECUTIVE_BONUSES = {
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
export const SPECIAL_BONUSES = {
  CHALLENGE_100_PERCENT: 200,
  LEVEL_UP_BRONZE: 0, // Pas de XP, juste badge
  LEVEL_UP_ARGENT: 0,
  LEVEL_UP_OR: 0,
  PERFECT_CHAPTER: 100
};

// ============================================
// TYPES
// ============================================

export type AnswerState = 'correct' | 'incorrect' | 'partial';

export interface QuestionOption {
  id?: string;
  text: string;
  isCorrect: AnswerState | boolean; // Support both new and old format
  justification: string | null;
}

export interface CalculateXPParams {
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'LEGENDE';
  attemptNumber: number;
  positionInChapter: number;
  totalQuestionsInChapter: number;
  hasActiveBonus?: boolean;
}

export interface XPResult {
  xpEarned: number;
  baseXP: number;
  multiplier: number;
  progressionFactor: number;
  bonusApplied: boolean;
}

export interface QuestionEvaluationResult {
  isCorrect: boolean;          // La question entière est-elle correcte?
  score: number;                // Score de la question
  maxScore: number;             // Score maximum possible
  percentage: number;           // Pourcentage
  xpEarned: number;             // XP gagnée
  details: {
    correctSelected: number;     // Nb de ✅ sélectionnées
    correctMissed: number;       // Nb de ✅ ratées
    incorrectSelected: number;   // Nb de ❌ sélectionnées
    partialSelected: number;     // Nb de ⚠️ sélectionnées
  };
}

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
export function calculateXP(params: CalculateXPParams): XPResult {
  const {
    difficulty,
    attemptNumber,
    positionInChapter,
    totalQuestionsInChapter,
    hasActiveBonus = false
  } = params;

  // 1. XP directe selon le numéro de tentative
  const xpEarned = ATTEMPT_XP[attemptNumber] || 0;

  // Pour compatibilité avec l'ancienne structure
  const baseXP = BASE_XP[difficulty]; // Garde la référence mais n'est plus utilisée

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
export function checkConsecutiveBonus(consecutiveCount: number): {
  type: 'STREAK_5' | 'STREAK_10' | null;
  xpBonus: number;
  message?: string;
  bonusPercent?: number;
  duration?: number;
} {
  if (consecutiveCount === CONSECUTIVE_BONUSES.STREAK_10.count) {
    return {
      type: 'STREAK_10',
      xpBonus: CONSECUTIVE_BONUSES.STREAK_10.xpBonus,
      message: '🔥 Série de 10 ! Bonus +50 XP !'
    };
  }

  if (consecutiveCount === CONSECUTIVE_BONUSES.STREAK_5.count) {
    return {
      type: 'STREAK_5',
      xpBonus: CONSECUTIVE_BONUSES.STREAK_5.xpBonus,
      bonusPercent: CONSECUTIVE_BONUSES.STREAK_5.bonusPercent,
      duration: CONSECUTIVE_BONUSES.STREAK_5.duration,
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
export function calculateChallengeBonus(scorePercent: number): number {
  if (scorePercent === 100) {
    return SPECIAL_BONUSES.CHALLENGE_100_PERCENT;
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
export function calculatePerfectChapterBonus(
  correctAnswers: number,
  totalQuestions: number,
  allFirstAttempt: boolean
): number {
  if (correctAnswers === totalQuestions && allFirstAttempt) {
    return SPECIAL_BONUSES.PERFECT_CHAPTER;
  }
  return 0;
}

/**
 * Normalise isCorrect en AnswerState (support ancien format boolean)
 */
export function normalizeAnswerState(isCorrect: AnswerState | boolean): AnswerState {
  if (typeof isCorrect === 'boolean') {
    return isCorrect ? 'correct' : 'incorrect';
  }
  return isCorrect;
}

/**
 * Évalue une réponse à une question avec support des options partielles
 *
 * Règles:
 * - Options ✅ (correct): comptent dans le score, doivent être toutes sélectionnées pour XP
 * - Options ❌ (incorrect): pénalité si sélectionnées
 * - Options ⚠️ (partial): N'AFFECTENT PAS le score ni le XP
 *
 * XP gagné si et seulement si:
 * - Toutes les options ✅ sont sélectionnées
 * - Aucune option ❌ n'est sélectionnée
 * - Les options ⚠️ n'ont aucun impact
 */
export function evaluateQuestionWithXP(
  questionOptions: QuestionOption[],
  userSelections: string[],
  attemptNumber: number,
  positionInChapter: number = 0,
  totalQuestionsInChapter: number = 1
): QuestionEvaluationResult {

  let score = 0;
  let maxScore = 0;
  let correctSelected = 0;
  let correctMissed = 0;
  let incorrectSelected = 0;
  let partialSelected = 0;

  // 1. Calculer le score de la question
  questionOptions.forEach(option => {
    const isSelected = option.id ? userSelections.includes(option.id) : false;
    const answerState = normalizeAnswerState(option.isCorrect);

    switch (answerState) {
      case 'correct':
        maxScore += 1;
        if (isSelected) {
          score += 1;
          correctSelected++;
        } else {
          score -= 0.25;
          correctMissed++;
        }
        break;

      case 'partial':
        // ⚠️ Ne compte ni dans maxScore ni dans score
        if (isSelected) {
          partialSelected++;
        }
        break;

      case 'incorrect':
        // Ne compte pas dans maxScore
        if (isSelected) {
          score -= 0.25;
          incorrectSelected++;
        }
        break;
    }
  });

  // Le score ne peut pas être négatif
  score = Math.max(0, score);

  // 2. Déterminer si la question est CORRECTE pour le XP
  const totalCorrectOptions = questionOptions.filter(
    o => normalizeAnswerState(o.isCorrect) === 'correct'
  ).length;

  const isQuestionCorrect = (
    correctSelected === totalCorrectOptions &&  // Toutes les ✅ sélectionnées
    incorrectSelected === 0                      // Aucune ❌ sélectionnée
  );
  // Les ⚠️ n'affectent pas isQuestionCorrect

  // 3. Calculer le XP selon le système existant
  let xpEarned = 0;
  if (isQuestionCorrect) {
    const xpResult = calculateXP({
      difficulty: 'MOYEN',
      attemptNumber,
      positionInChapter,
      totalQuestionsInChapter
    });
    xpEarned = xpResult.xpEarned;
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    isCorrect: isQuestionCorrect,
    score,
    maxScore,
    percentage,
    xpEarned,
    details: {
      correctSelected,
      correctMissed,
      incorrectSelected,
      partialSelected
    }
  };
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Retourne un résumé textuel du calcul XP pour le debug
 */
export function getXPCalculationSummary(result: XPResult): string {
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
export function validateXPParams(params: CalculateXPParams): { valid: boolean; error?: string } {
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
export function getXPExamples() {
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
