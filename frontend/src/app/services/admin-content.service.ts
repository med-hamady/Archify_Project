import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubjectWithStats {
  id: string;
  title: string;
  description: string | null;
  semester: string;
  totalQCM: number;
  chaptersCount: number;
  questionsCount: number;
}

export interface ChapterWithStats {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  pdfUrl: string | null;
  questionsCount: number;
  subchaptersCount: number;
  subchapters: {
    id: string;
    title: string;
    questionsCount: number;
  }[];
}

export interface Question {
  id: string;
  questionText: string;
  options: {
    text: string;
    isCorrect: boolean;
    justification?: string;
  }[];
  explanation: string | null;
  orderIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminContentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/content`;

  // ==================== SUBJECTS ====================

  getSubjects(): Observable<{ success: boolean; subjects: SubjectWithStats[] }> {
    return this.http.get<{ success: boolean; subjects: SubjectWithStats[] }>(`${this.apiUrl}/subjects`);
  }

  updateSubject(id: string, data: { title?: string; description?: string; totalQCM?: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/subjects/${id}`, data);
  }

  deleteSubject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subjects/${id}`);
  }

  // ==================== CHAPTERS ====================

  getChapters(subjectId: string): Observable<{ success: boolean; chapters: ChapterWithStats[] }> {
    return this.http.get<{ success: boolean; chapters: ChapterWithStats[] }>(`${this.apiUrl}/subjects/${subjectId}/chapters`);
  }

  createChapter(subjectId: string, data: { title: string; description?: string; orderIndex?: number; pdfUrl?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/subjects/${subjectId}/chapters`, data);
  }

  updateChapter(id: string, data: { title?: string; description?: string; orderIndex?: number; pdfUrl?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/chapters/${id}`, data);
  }

  deleteChapter(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chapters/${id}`);
  }

  // ==================== QUESTIONS ====================

  getQuestions(chapterId: string): Observable<{ success: boolean; questions: Question[] }> {
    return this.http.get<{ success: boolean; questions: Question[] }>(`${this.apiUrl}/chapters/${chapterId}/questions`);
  }

  createQuestion(chapterId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/chapters/${chapterId}/questions`, data);
  }

  updateQuestion(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/questions/${id}`, data);
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${id}`);
  }

  // ==================== SUBCHAPTERS ====================

  updateSubchapter(id: string, data: { title?: string; description?: string; orderIndex?: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/subchapters/${id}`, data);
  }

  deleteSubchapter(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subchapters/${id}`);
  }
}
