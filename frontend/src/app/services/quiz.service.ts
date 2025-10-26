import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QuestionOption, BaseQuestion } from '../models/question.model';

// Alias pour compatibilité
export type QuizOption = QuestionOption;

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];  // Nouveau format JSON
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'LEGENDE';
  chapterId?: string;
  chapterTitle?: string;
  position?: number;
  totalQuestions?: number;
  orderIndex?: number;
}

export interface QuizAnswerResponse {
  success: boolean;
  result: {
    correct: boolean;
    selectedAnswers: number[];  // Array of selected answer indices
    options: QuizOption[];  // Options avec feedback (isCorrect, justification, wasSelected)
    explanation?: string;
    attemptNumber?: number;
    xpEarned: number;
    totalXP: number;
    levelInfo: {
      current: number;
      name: string;
      progress: number;
      xpToNext: number;
    };
    levelUp?: {
      newLevel: number;
      oldLevel?: number;
      rewards?: any;
      message?: string;
    } | null;
    consecutiveBonus?: {
      type: string;
      xpBonus: number;
      message: string;
    } | null;
    newBadges?: Array<{
      id: string;
      name: string;
      description: string;
    }> | null;
  };
}

export interface QuizHistory {
  questionId: string;
  attempts: Array<{
    selectedAnswer: number;
    isCorrect: boolean;
    attemptNumber: number;
    xpEarned: number;
    createdAt: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/quiz`;

  /**
   * Obtenir la prochaine question d'un chapitre
   */
  getNextQuestion(chapterId: string): Observable<{ success: boolean; question: QuizQuestion }> {
    return this.http.get<{ success: boolean; question: QuizQuestion }>(
      `${this.baseUrl}/chapter/${chapterId}/next`
    );
  }

  /**
   * Répondre à une question (avec plusieurs réponses possibles)
   */
  answerQuestion(questionId: string, selectedAnswers: number[]): Observable<QuizAnswerResponse> {
    return this.http.post<QuizAnswerResponse>(`${this.baseUrl}/answer`, {
      questionId,
      selectedAnswers
    });
  }

  /**
   * Obtenir l'historique des tentatives pour une question
   */
  getQuestionHistory(questionId: string): Observable<{ success: boolean; history: QuizHistory }> {
    return this.http.get<{ success: boolean; history: QuizHistory }>(
      `${this.baseUrl}/history/${questionId}`
    );
  }

  /**
   * Obtenir toutes les questions d'un chapitre (pour aperçu)
   */
  getChapterQuestions(chapterId: string): Observable<{
    success: boolean;
    questions: Array<{
      id: string;
      questionText: string;
      difficulty: string;
      answered: boolean;
      correct: boolean;
    }>;
  }> {
    return this.http.get<any>(`${this.baseUrl}/chapter/${chapterId}/questions`);
  }
}
