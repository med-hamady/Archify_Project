import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface SubscriptionPlan {
  id: string;
  name: string;
  interval: 'monthly' | 'yearly';
  priceCents: number;
  price: string;
  currency: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  logo: string;
  enabled: boolean;
}

export interface CheckoutRequest {
  planId: string;
  provider: 'bankily' | 'masrivi' | 'sedad';
  couponCode?: string;
}

export interface CheckoutResponse {
  approvalUrl?: string;
  intentId?: string;
  qrCode?: string;
  instructions?: string;
  expiresAt: string;
}

export interface PaymentStatus {
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  provider: string;
  providerRef: string;
  amount: number;
  currency: string;
  completedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Get available subscription plans
  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<{plans: SubscriptionPlan[]}>(`${this.API_URL}/subscriptions/plans`)
      .pipe(
        map(response => response.plans),
        catchError(error => this.handleError(error))
      );
  }

  // Get available payment providers
  getPaymentProviders(): Observable<PaymentProvider[]> {
    return this.http.get<{providers: PaymentProvider[]}>(`${this.API_URL}/payments/providers`)
      .pipe(
        map(response => response.providers),
        catchError(error => this.handleError(error))
      );
  }

  // Initiate checkout process
  initiateCheckout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.API_URL}/subscriptions/checkout`, request)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  // Handle payment webhook (called by backend)
  handleWebhook(provider: string, webhookData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/subscriptions/webhook`, {
      provider,
      data: webhookData
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Get payment status
  getPaymentStatus(providerRef: string): Observable<PaymentStatus> {
    return this.http.get<PaymentStatus>(`${this.API_URL}/subscriptions/payments/status/${providerRef}`)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  // Cancel subscription
  cancelSubscription(): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.API_URL}/subscriptions/cancel`, {})
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  // Get subscription history
  getSubscriptionHistory(page: number = 1, limit: number = 10): Observable<{
    subscriptions: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  }> {
    return this.http.get<{
      subscriptions: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }>(`${this.API_URL}/subscriptions/history?page=${page}&limit=${limit}`)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  // Validate coupon code
  validateCoupon(couponCode: string, planId: string): Observable<{
    valid: boolean;
    discount?: number;
    message?: string;
  }> {
    return this.http.post<{
      valid: boolean;
      discount?: number;
      message?: string;
    }>(`${this.API_URL}/coupons/validate`, { couponCode, planId })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  // Bankily specific payment integration
  initiateBankilyPayment(planId: string, amount: number): Observable<CheckoutResponse> {
    return this.initiateCheckout({
      planId,
      provider: 'bankily'
    });
  }

  // Masrivi specific payment integration
  initiateMasriviPayment(planId: string, amount: number): Observable<CheckoutResponse> {
    return this.initiateCheckout({
      planId,
      provider: 'masrivi'
    });
  }

  // Sedad specific payment integration
  initiateSedadPayment(planId: string, amount: number): Observable<CheckoutResponse> {
    return this.initiateCheckout({
      planId,
      provider: 'sedad'
    });
  }

  // Handle Bankily webhook
  handleBankilyWebhook(webhookData: any): Observable<any> {
    return this.handleWebhook('bankily', webhookData);
  }

  // Handle Masrivi webhook
  handleMasriviWebhook(webhookData: any): Observable<any> {
    return this.handleWebhook('masrivi', webhookData);
  }

  // Handle Sedad webhook
  handleSedadWebhook(webhookData: any): Observable<any> {
    return this.handleWebhook('sedad', webhookData);
  }

  private handleError(error: any): Observable<never> {
    console.error('Payment service error:', error);

    if (error.error?.message) {
      return throwError(() => new Error(error.error.message));
    }

    if (error.status === 0) {
      return throwError(() => new Error('Impossible de se connecter au serveur de paiement'));
    }

    if (error.status === 400) {
      return throwError(() => new Error('Données de paiement invalides'));
    }

    if (error.status === 401) {
      return throwError(() => new Error('Authentification requise'));
    }

    if (error.status === 403) {
      return throwError(() => new Error('Accès non autorisé'));
    }

    if (error.status === 404) {
      return throwError(() => new Error('Plan d\'abonnement non trouvé'));
    }

    return throwError(() => new Error('Erreur lors du traitement du paiement'));
  }
}
