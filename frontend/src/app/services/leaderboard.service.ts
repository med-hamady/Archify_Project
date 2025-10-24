import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  semester: string;
  xpTotal: number;
  level: 'BOIS' | 'BRONZE' | 'ARGENT' | 'OR' | 'PLATINUM' | 'LEGENDAIRE' | 'MONDIAL';
  consecutiveGoodAnswers: number;
  legendQuestionsCompleted: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardFilters {
  scope?: 'global' | 'semester';
  timeframe?: 'all-time' | 'monthly' | 'weekly';
  subjectId?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/leaderboard`;

  /**
   * Obtenir le classement général ou par filtres
   */
  getLeaderboard(filters?: LeaderboardFilters): Observable<{
    success: boolean;
    leaderboard: LeaderboardEntry[];
  }> {
    let url = `${this.baseUrl}/global`;
    const params: any = {};

    if (filters) {
      if (filters.scope === 'semester') {
        url = `${this.baseUrl}/semester`;
      }
      if (filters.timeframe) {
        params.timeframe = filters.timeframe;
      }
      if (filters.subjectId) {
        params.subjectId = filters.subjectId;
      }
      if (filters.limit) {
        params.limit = filters.limit.toString();
      }
    }

    return this.http.get<{
      success: boolean;
      leaderboard: LeaderboardEntry[];
    }>(url, { params });
  }

  /**
   * Obtenir le classement par matière
   */
  getSubjectLeaderboard(subjectId: string, limit?: number): Observable<{
    success: boolean;
    leaderboard: LeaderboardEntry[];
  }> {
    const params: any = {};
    if (limit) params.limit = limit.toString();

    return this.http.get<{
      success: boolean;
      leaderboard: LeaderboardEntry[];
    }>(`${this.baseUrl}/subject/${subjectId}`, { params });
  }

  /**
   * Obtenir la position de l'utilisateur actuel
   */
  getMyRank(): Observable<{
    success: boolean;
    rank: number;
    totalUsers: number;
    percentile: number;
  }> {
    return this.http.get<{
      success: boolean;
      rank: number;
      totalUsers: number;
      percentile: number;
    }>(`${this.baseUrl}/my-rank`);
  }
}
