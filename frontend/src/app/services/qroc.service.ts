import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Qroc {
  id: string;
  subjectId: string;
  question: string;
  questionImageUrl?: string;
  answer: string;
  answerImageUrl?: string;
  category?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    title: string;
    semester: string;
  };
}

export interface CreateQrocData {
  subjectId: string;
  question: string;
  questionImageUrl?: string;
  answer: string;
  answerImageUrl?: string;
  category?: string;
  orderIndex?: number;
}

export interface UpdateQrocData {
  question?: string;
  questionImageUrl?: string;
  answer?: string;
  answerImageUrl?: string;
  category?: string;
  orderIndex?: number;
}

export interface QrocCategory {
  name: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class QrocService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/qrocs`;

  // Get all QROCs for a subject (optionally filtered by category)
  getQrocsBySubject(subjectId: string, category?: string): Observable<{ success: boolean; qrocs: Qroc[] }> {
    let url = `${this.apiUrl}/subject/${subjectId}`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    return this.http.get<{ success: boolean; qrocs: Qroc[] }>(url);
  }

  // Get all unique categories (chapters) for a subject
  getCategories(subjectId: string): Observable<{ success: boolean; categories: QrocCategory[]; totalCount: number }> {
    return this.http.get<{ success: boolean; categories: QrocCategory[]; totalCount: number }>(`${this.apiUrl}/subject/${subjectId}/categories`);
  }

  // Get QROC count for a subject
  getQrocCount(subjectId: string): Observable<{ success: boolean; count: number }> {
    return this.http.get<{ success: boolean; count: number }>(`${this.apiUrl}/subject/${subjectId}/count`);
  }

  // Get a specific QROC
  getQroc(id: string): Observable<{ success: boolean; qroc: Qroc }> {
    return this.http.get<{ success: boolean; qroc: Qroc }>(`${this.apiUrl}/${id}`);
  }

  // Create a new QROC (Admin only)
  createQroc(data: CreateQrocData): Observable<{ success: boolean; message: string; qroc: Qroc }> {
    return this.http.post<{ success: boolean; message: string; qroc: Qroc }>(this.apiUrl, data);
  }

  // Update a QROC (Admin only)
  updateQroc(id: string, data: UpdateQrocData): Observable<{ success: boolean; message: string; qroc: Qroc }> {
    return this.http.put<{ success: boolean; message: string; qroc: Qroc }>(`${this.apiUrl}/${id}`, data);
  }

  // Delete a QROC (Admin only)
  deleteQroc(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
