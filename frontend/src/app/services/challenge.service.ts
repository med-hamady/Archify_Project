import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChallengeQuestion {
  id: string;
  questionText: string;
  options: Array<{ text: string }>;
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'LEGENDE';
}

export interface ChallengeStart {
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
  questions: ChallengeQuestion[];
  totalQuestions: number;
}

export interface ChallengeResult {
  score: number;
  questionsTotal: number;
  questionsCorrect: number;
  xpEarned: number;
  xpBonus: number;
  totalXP: number;
  levelInfo: any;
  detailedResults: Array<{
    questionId: string;
    questionText: string;
    correct: boolean;
    xpEarned: number;
    options: Array<{
      text: string;
      isCorrect: boolean;
      justification?: string;
      wasSelected: boolean;
    }>;
    explanation?: string;
  }>;
  levelUp?: {
    oldLevel: string;
    newLevel: string;
  } | null;
  newBadges?: Array<{
    name: string;
    description: string;
    iconUrl?: string;
  }> | null;
}

export interface ChallengeHistoryEntry {
  id: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  isPerfect: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/challenge`;

  /**
   * Démarrer un challenge
   */
  startChallenge(chapterId: string): Observable<{ success: boolean; challenge: ChallengeStart }> {
    return this.http.post<{ success: boolean; challenge: ChallengeStart }>(
      `${this.baseUrl}/${chapterId}/start`,
      {}
    );
  }

  /**
   * Soumettre les réponses du challenge
   */
  submitChallenge(
    chapterId: string,
    answers: Array<{ questionId: string; selectedAnswers: number[] }>
  ): Observable<{ success: boolean; result: ChallengeResult }> {
    return this.http.post<{ success: boolean; result: ChallengeResult }>(
      `${this.baseUrl}/${chapterId}/submit`,
      { answers }
    );
  }

  /**
   * Obtenir l'historique des challenges pour un chapitre
   */
  getChallengeHistory(chapterId: string): Observable<{
    success: boolean;
    history: ChallengeHistoryEntry[];
  }> {
    return this.http.get<{
      success: boolean;
      history: ChallengeHistoryEntry[];
    }>(`${this.baseUrl}/history/${chapterId}`);
  }

  /**
   * Obtenir le classement du challenge d'un chapitre
   */
  getChallengeLeaderboard(chapterId: string, limit?: number): Observable<{
    success: boolean;
    leaderboard: Array<{
      rank: number;
      userId: string;
      name: string;
      score: number;
      totalQuestions: number;
      xpEarned: number;
      completedAt: string;
      isCurrentUser?: boolean;
    }>;
  }> {
    const params: any = {};
    if (limit) params.limit = limit.toString();

    return this.http.get<any>(`${this.baseUrl}/leaderboard/${chapterId}`, { params });
  }
}
