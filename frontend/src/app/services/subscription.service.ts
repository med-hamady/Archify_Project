import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubscriptionStatus {
  hasActive: boolean;
  type?: 'QUIZ_ONLY' | 'DOCUMENTS_ONLY' | 'FULL_ACCESS';
  canAccessQuiz: boolean;
  canAccessDocuments: boolean;
  expiresAt?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private API_URL = environment.apiUrl;

  // Cache du statut d'abonnement
  private subscriptionStatus$ = new BehaviorSubject<SubscriptionStatus | null>(null);

  /**
   * Vérifie le statut d'abonnement de l'utilisateur
   */
  checkSubscription(): Observable<{ success: boolean; subscription: SubscriptionStatus }> {
    return this.http.get<{ success: boolean; subscription: SubscriptionStatus }>(
      `${this.API_URL}/profile/subscription`
    ).pipe(
      tap(response => {
        this.subscriptionStatus$.next(response.subscription);
      })
    );
  }

  /**
   * Récupère le statut d'abonnement en cache
   */
  getSubscriptionStatus(): SubscriptionStatus | null {
    return this.subscriptionStatus$.value;
  }

  /**
   * Observable du statut d'abonnement
   */
  subscriptionStatus(): Observable<SubscriptionStatus | null> {
    return this.subscriptionStatus$.asObservable();
  }

  /**
   * Vérifie si l'utilisateur peut accéder aux quiz
   */
  canAccessQuiz(): boolean {
    const status = this.subscriptionStatus$.value;
    return status ? status.canAccessQuiz : false;
  }

  /**
   * Vérifie si l'utilisateur peut accéder aux documents
   */
  canAccessDocuments(): boolean {
    const status = this.subscriptionStatus$.value;
    return status ? status.canAccessDocuments : false;
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.subscriptionStatus$.next(null);
  }
}
