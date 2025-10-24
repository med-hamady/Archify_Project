import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'LEGENDE';
  chapterId: string;
  chapterTitle: string;
  position: number;
  totalQuestions: number;
}

export interface QuizAnswerResponse {
  success: boolean;
  result: {
    correct: boolean;
    correctAnswer: number;
    explanation?: string;
    xpEarned: number;
    totalXP: number;
    levelInfo: {
      current: string;
      next: string;
      progressPercent: number;
      xpForNext: number;
    };
    levelUp?: {
      oldLevel: string;
      newLevel: string;
    };
    consecutiveBonus?: {
      count: number;
      bonusXP: number;
    };
    newBadges?: Array<{
      name: string;
      description: string;
      iconUrl?: string;
    }>;
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
   * Répondre à une question
   */
  answerQuestion(questionId: string, selectedAnswer: number): Observable<QuizAnswerResponse> {
    return this.http.post<QuizAnswerResponse>(`${this.baseUrl}/answer`, {
      questionId,
      selectedAnswer
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
