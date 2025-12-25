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

  /**
   * Obtenir tous les utilisateurs avec leurs appareils
   */
  getUsersWithDevices(): Observable<{ success: boolean; users: any[] }> {
    return this.http.get<any>(`${this.baseUrl}/devices/users`);
  }

  /**
   * Supprimer un appareil spécifique d'un utilisateur
   */
  removeDevice(userId: string, deviceId: string, reason?: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/devices/remove`, {
      body: { userId, deviceId, reason }
    });
  }

  /**
   * Supprimer tous les appareils d'un utilisateur (réinitialisation)
   */
  removeAllDevices(userId: string, reason?: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/devices/remove-all`, {
      body: { userId, reason }
    });
  }

  // ============================================
  // GESTION DES ADMINS DE NIVEAU (SUPERADMIN ONLY)
  // ============================================

  /**
   * Obtenir la liste des admins avec leurs niveaux assignés
   */
  getAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admins`);
  }

  /**
   * Assigner des niveaux à un admin (SUPERADMIN only)
   */
  assignSemesters(userId: string, semesters: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/semesters`, { semesters });
  }
}
