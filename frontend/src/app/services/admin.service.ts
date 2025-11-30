import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;

  /**
   * Donner ou retirer des XP à un utilisateur
   */
  giveXp(userId: string, xpAmount: number, reason?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/xp/give`, {
      userId,
      xpAmount,
      reason
    });
  }

  /**
   * Obtenir l'historique des modifications XP
   */
  getXpHistory(limit: number = 50): Observable<{ success: boolean; history: any[] }> {
    return this.http.get<any>(`${this.baseUrl}/xp/history?limit=${limit}`);
  }

  /**
   * Obtenir tous les utilisateurs avec leurs stats XP
   */
  getUsers(): Observable<{ users: any[] }> {
    return this.http.get<any>(`${environment.apiUrl}/users`);
  }
}
