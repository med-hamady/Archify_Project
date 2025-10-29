import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExamQuestion {
  id: string;
  questionText: string;
  options: string[];
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'LEGENDE';
  chapterId: string;
  chapterTitle: string;
}

export interface ExamStart {
  examId: string;
  subjectId: string;
  subjectName: string;
  questions: ExamQuestion[];
  totalQuestions: number;
  totalAvailableQuestions?: number; // Nombre total de questions disponibles (vues)
  duration?: number; // Durée en minutes
  canStart?: boolean;
  reason?: string;
}

export interface ExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  scoreOutOf20: number;
  grade: string;
  passed: boolean;
  xpEarned: number;
  totalXP: number;
  results: Array<{
    questionId: string;
    correct: boolean;
    correctAnswer: number;
    explanation?: string;
  }>;
  levelUp?: {
    oldLevel: string;
    newLevel: string;
  };
  newBadges?: Array<{
    name: string;
    description: string;
    iconUrl?: string;
  }>;
}

export interface ExamCorrection {
  score: number;
  totalQuestions: number;
  scoreOutOf20: number;
  grade: string;
  passed: boolean;
  chapterBreakdown: Array<{
    chapterId: string;
    chapterTitle: string;
    score: number;
    totalQuestions: number;
    questions: Array<{
      questionId: string;
      questionText: string;
      options: string[];
      userAnswer: number;
      correctAnswer: number;
      isCorrect: boolean;
      explanation?: string;
    }>;
  }>;
}

export interface ExamHistoryEntry {
  id: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  scoreOutOf20: number;
  grade: string;
  passed: boolean;
  xpEarned: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/exam`;

  /**
   * Démarrer un examen
   * @param subjectId - ID de la matière
   * @param questionCount - Nombre de questions souhaitées (10/20/30/40, optionnel)
   * @param duration - Durée en minutes (15-90, optionnel)
   */
  startExam(subjectId: string, questionCount?: number, duration?: number): Observable<{ success: boolean; exam: ExamStart }> {
    return this.http.post<{ success: boolean; exam: ExamStart }>(
      `${this.baseUrl}/${subjectId}/start`,
      { questionCount, duration }
    );
  }

  /**
   * Soumettre les réponses de l'examen
   */
  submitExam(
    subjectId: string,
    examId: string,
    answers: Array<{ questionId: string; selectedAnswers: number[] }>
  ): Observable<{ success: boolean; result: ExamResult }> {
    return this.http.post<{ success: boolean; result: ExamResult }>(
      `${this.baseUrl}/${subjectId}/submit`,
      { examId, answers }
    );
  }

  /**
   * Obtenir la correction détaillée d'un examen
   */
  getExamCorrection(examId: string): Observable<{
    success: boolean;
    correction: ExamCorrection;
  }> {
    return this.http.get<{
      success: boolean;
      correction: ExamCorrection;
    }>(`${this.baseUrl}/correction/${examId}`);
  }

  /**
   * Obtenir l'historique des examens pour une matière
   */
  getExamHistory(subjectId: string): Observable<{
    success: boolean;
    history: ExamHistoryEntry[];
  }> {
    return this.http.get<{
      success: boolean;
      history: ExamHistoryEntry[];
    }>(`${this.baseUrl}/history/${subjectId}`);
  }

  /**
   * Obtenir le classement de l'examen d'une matière
   */
  getExamLeaderboard(subjectId: string, limit?: number): Observable<{
    success: boolean;
    leaderboard: Array<{
      rank: number;
      userId: string;
      name: string;
      scoreOutOf20: number;
      grade: string;
      xpEarned: number;
      completedAt: string;
      isCurrentUser?: boolean;
    }>;
  }> {
    const params: any = {};
    if (limit) params.limit = limit.toString();

    return this.http.get<any>(`${this.baseUrl}/leaderboard/${subjectId}`, { params });
  }
}
