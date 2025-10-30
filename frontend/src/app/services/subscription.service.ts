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

export interface AdminDashboardStats {
  users: {
    total: number;
    students: number;
    admins: number;
    recent: number;
  };
  subscriptions: {
    active: number;
    expired: number;
  };
  payments: {
    pending: number;
    completed: number;
    failed: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
}

export interface UserSubscriptionInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription?: {
    id: string;
    status: string;
    type: string;
    startAt: string;
    endAt: string;
    planName: string;
  };
  canAccessQuiz: boolean;
  canAccessDocuments: boolean;
}

export interface PaymentInfo {
  id: string;
  userId: string;
  planId: string;
  status: string;
  amountCents: number;
  currency: string;
  receiptScreenshot: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
    type: string;
  };
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

  // ==================== ADMIN METHODS ====================

  /**
   * Récupère les statistiques du dashboard admin
   */
  getAdminDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.API_URL}/admin/dashboard-stats`);
  }

  /**
   * Récupère la liste des utilisateurs avec leurs abonnements
   */
  getUsersSubscriptions(): Observable<UserSubscriptionInfo[]> {
    return this.http.get<UserSubscriptionInfo[]>(`${this.API_URL}/admin/users-subscriptions`);
  }

  /**
   * Récupère la liste des paiements
   */
  getPayments(status?: string, limit: number = 50): Observable<PaymentInfo[]> {
    const params: any = { limit };
    if (status) {
      params.status = status;
    }
    return this.http.get<PaymentInfo[]>(`${this.API_URL}/admin/payments`, { params });
  }

  /**
   * Active un abonnement pour un utilisateur
   */
  activateSubscription(userId: string, planId: string, durationMonths: number): Observable<any> {
    return this.http.post(`${this.API_URL}/admin/subscription/activate`, {
      userId,
      planId,
      durationMonths
    });
  }

  /**
   * Prolonge un abonnement existant
   */
  extendSubscription(subscriptionId: string, additionalMonths: number): Observable<any> {
    return this.http.post(`${this.API_URL}/admin/subscription/extend`, {
      subscriptionId,
      additionalMonths
    });
  }

  /**
   * Désactive un abonnement
   */
  deactivateSubscription(subscriptionId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/admin/subscription/deactivate`, {
      subscriptionId
    });
  }

  /**
   * Valide ou rejette un paiement
   */
  validatePayment(paymentId: string, status: 'COMPLETED' | 'FAILED', adminNotes?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/admin/payment/validate`, {
      paymentId,
      status,
      adminNotes
    });
  }
}
