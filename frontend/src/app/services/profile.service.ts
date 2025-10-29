import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  semester: string;
  xpTotal: number;
  level: 'BOIS' | 'BRONZE' | 'ARGENT' | 'OR' | 'PLATINUM' | 'DIAMANT' | 'MONDIAL';
  consecutiveGoodAnswers: number;
  legendQuestionsCompleted: number;
  createdAt: string;
  profilePicture?: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: 'LEVEL' | 'ACHIEVEMENT' | 'SPECIAL';
  earnedAt?: string;
}

export interface Activity {
  id: string;
  type: 'QUIZ' | 'CHALLENGE' | 'EXAM' | 'BADGE' | 'LEVEL_UP';
  description: string;
  xpEarned?: number;
  createdAt: string;
}

export interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  progressPercent: number;
  totalQCM: number;
  answeredQCM: number;
  chaptersCompleted: number;
  chaptersTotal: number;
}

export interface DetailedStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  successRate: number;
  averageAttempts: number;
  totalXPEarned: number;
  challengesCompleted: number;
  examsCompleted: number;
  examsPassed: number;
  perfectScores: number;
  difficultyCounts: {
    FACILE: number;
    MOYEN: number;
    DIFFICILE: number;
    LEGENDE: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/profile`;

  /**
   * Obtenir le profil complet de l'utilisateur connecté
   */
  getProfile(): Observable<{ success: boolean; profile: UserProfile }> {
    return this.http.get<{ success: boolean; profile: UserProfile }>(`${this.baseUrl}/me`);
  }

  /**
   * Obtenir le profil public d'un utilisateur spécifique
   */
  getUserProfile(userId: string): Observable<{ success: boolean; profile: UserProfile }> {
    return this.http.get<{ success: boolean; profile: UserProfile }>(`${this.baseUrl}/${userId}`);
  }

  /**
   * Obtenir les badges de l'utilisateur
   */
  getBadges(): Observable<{ success: boolean; badges: Badge[] }> {
    return this.http.get<{ success: boolean; badges: Badge[] }>(`${this.baseUrl}/badges`);
  }

  /**
   * Obtenir l'activité récente
   */
  getActivity(): Observable<{ success: boolean; activities: Activity[] }> {
    return this.http.get<{ success: boolean; activities: Activity[] }>(`${this.baseUrl}/activity`);
  }

  /**
   * Obtenir la progression par matière
   */
  getProgress(): Observable<{ success: boolean; progress: SubjectProgress[] }> {
    return this.http.get<{ success: boolean; progress: SubjectProgress[] }>(`${this.baseUrl}/progress`);
  }

  /**
   * Obtenir les statistiques détaillées
   */
  getDetailedStats(): Observable<{ success: boolean; stats: DetailedStats }> {
    return this.http.get<{ success: boolean; stats: DetailedStats }>(`${this.baseUrl}/stats/detailed`);
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(imageData: string): Observable<{ success: boolean; profilePicture: string }> {
    return this.http.post<{ success: boolean; profilePicture: string }>(`${this.baseUrl}/picture`, { imageData });
  }

  /**
   * Delete profile picture
   */
  deleteProfilePicture(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/picture`);
  }
}
