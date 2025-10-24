/**
 * Modèles partagés pour les questions FacGame
 * Format JSON avec justifications pour les réponses fausses
 */

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;  // undefined avant réponse, boolean après
  justification?: string;  // pour les réponses fausses
  wasSelected?: boolean;  // true si l'utilisateur a sélectionné cette option
}

export type QuestionDifficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'LEGENDE';

export interface BaseQuestion {
  id: string;
  questionText: string;
  options: QuestionOption[];
  difficulty: QuestionDifficulty;
  explanation?: string;
}
