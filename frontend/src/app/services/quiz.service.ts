import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QuestionOption, BaseQuestion } from '../models/question.model';

// Alias pour compatibilité
export type QuizOption = QuestionOption;

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];  // Nouveau format JSON
  chapterId?: string;
  chapterTitle?: string;
  subchapterId?: string;
  subchapterTitle?: string;
  position?: number;
  totalQuestions?: number;
  orderIndex?: number;
  isReplay?: boolean;  // Indique si c'est un rejeu (question déjà réussie)
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
   * @param chapterId ID du chapitre
   * @param replay Si true, recommence le chapitre depuis le début
   * @param currentQuestionId ID de la question actuelle (pour obtenir la suivante)
   * @param subchapterId ID du sous-chapitre (optionnel, pour filtrer les questions)
   */
  getNextQuestion(chapterId: string, replay: boolean = false, currentQuestionId?: string, subchapterId?: string): Observable<{ success: boolean; question: QuizQuestion; completed?: boolean; message?: string }> {
    let params = new HttpParams();
    if (replay) {
      params = params.set('replay', 'true');
    }
    if (currentQuestionId) {
      params = params.set('currentQuestionId', currentQuestionId);
    }
    if (subchapterId) {
      params = params.set('subchapterId', subchapterId);
    }

    return this.http.get<{ success: boolean; question: QuizQuestion; completed?: boolean; message?: string }>(
      `${this.baseUrl}/chapter/${chapterId}/next`,
      { params }
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
      answered: boolean;
      correct: boolean;
    }>;
  }> {
    return this.http.get<any>(`${this.baseUrl}/chapter/${chapterId}/questions`);
  }
}
