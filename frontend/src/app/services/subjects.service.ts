import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Subchapter {
  id: string;
  title: string;
  orderIndex: number;
  questionsCount: number;
}

export interface Chapter {
  id: string;
  title: string;
  position: number;
  questionsCount: number;
  progressPercent: number;
  challengeUnlocked: boolean;
  subchapters?: Subchapter[];
}

export interface Subject {
  id: string;
  title: string;
  semester: string;
  totalChapters: number;
  totalQuestions: number;
  progressPercent: number;
  examUnlocked: boolean;
  chapters?: Chapter[];
}

@Injectable({
  providedIn: 'root'
})
export class SubjectsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/subjects`;

  /**
   * Obtenir toutes les matières
   */
  getAllSubjects(): Observable<{ success: boolean; subjects: Subject[] }> {
    return this.http.get<{ success: boolean; subjects: Subject[] }>(this.baseUrl);
  }

  /**
   * Obtenir une matière avec ses chapitres
   */
  getSubjectWithChapters(subjectId: string): Observable<{ success: boolean; subject: Subject }> {
    return this.http.get<{ success: boolean; subject: Subject }>(`${this.baseUrl}/${subjectId}`);
  }

  /**
   * Obtenir les chapitres d'une matière
   */
  getChapters(subjectId: string): Observable<{ success: boolean; chapters: Chapter[] }> {
    return this.http.get<{ success: boolean; chapters: Chapter[] }>(`${this.baseUrl}/${subjectId}/chapters`);
  }
}
