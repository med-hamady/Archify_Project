import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface PaymentWithPlan {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  provider: string;
  providerRef: string;
  phoneNumber: string;
  amountCents: number;
  currency: string;
  screenshotUrl?: string;
  adminNotes?: string;
  createdAt: string;
  validatedAt?: string;
  plan: {
    id: string;
    name: string;
    type: string;
  } | null;
}

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payments-container">
      <div class="payments-header">
        <button (click)="goBack()" class="back-button">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Retour
        </button>
        <h1>Mes Paiements</h1>
      </div>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner-large"></div>
          <p>Chargement de vos paiements...</p>
        </div>
      } @else if (error()) {
        <div class="error-card">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3>Erreur</h3>
          <p>{{ error() }}</p>
          <button (click)="loadPayments()" class="btn-retry">Réessayer</button>
        </div>
      } @else if (payments().length === 0) {
        <div class="empty-state">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
          </svg>
          <h3>Aucun paiement</h3>
          <p>Vous n'avez pas encore effectué de paiement</p>
          <button (click)="goToSubscription()" class="btn-primary">
            Souscrire à un abonnement
          </button>
        </div>
      } @else {
        <div class="payments-grid">
          @for (payment of payments(); track payment.id) {
            <div class="payment-card" [class]="'status-' + payment.status.toLowerCase()">
              <div class="payment-status-badge">
                @switch (payment.status) {
                  @case ('PENDING') {
                    <span class="badge badge-pending">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                      </svg>
                      En attente
                    </span>
                  }
                  @case ('COMPLETED') {
                    <span class="badge badge-completed">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                      </svg>
                      Validé
                    </span>
                  }
                  @case ('FAILED') {
                    <span class="badge badge-failed">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                      </svg>
                      Rejeté
                    </span>
                  }
                }
              </div>

              <div class="payment-details">
                <h3>{{ payment.plan?.name || 'Plan inconnu' }}</h3>
                <p class="payment-amount">
                  {{ payment.amountCents / 100 }} {{ payment.currency }}
                </p>

                <div class="payment-info">
                  <div class="info-row">
                    <span class="info-label">Méthode:</span>
                    <span class="info-value">{{ payment.provider }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Transaction:</span>
                    <span class="info-value">{{ payment.providerRef }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Téléphone:</span>
                    <span class="info-value">{{ payment.phoneNumber }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">{{ formatDate(payment.createdAt) }}</span>
                  </div>

                  @if (payment.validatedAt) {
                    <div class="info-row">
                      <span class="info-label">Validé le:</span>
                      <span class="info-value">{{ formatDate(payment.validatedAt) }}</span>
                    </div>
                  }
                </div>

                @if (payment.adminNotes) {
                  <div class="admin-notes">
                    <strong>Note de l'administrateur:</strong>
                    <p>{{ payment.adminNotes }}</p>
                  </div>
                }

                @if (payment.screenshotUrl) {
                  <button (click)="viewScreenshot(payment.screenshotUrl)" class="btn-view-screenshot">
                    Voir la capture d'écran
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (selectedScreenshot()) {
        <div class="screenshot-modal" (click)="closeScreenshot()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button (click)="closeScreenshot()" class="close-button">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <img [src]="getFullScreenshotUrl(selectedScreenshot()!)" alt="Capture d'écran du paiement">
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .payments-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .payments-header {
      max-width: 1200px;
      margin: 0 auto 2rem;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: background 0.3s;
      margin-bottom: 1rem;
    }

    .back-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .payments-header h1 {
      font-size: 2.5rem;
      color: white;
      margin: 0;
    }

    .loading {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
      color: white;
      padding: 4rem 0;
    }

    .spinner-large {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-card,
    .empty-state {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .error-card svg,
    .empty-state svg {
      color: #667eea;
      margin-bottom: 1rem;
    }

    .error-card h3,
    .empty-state h3 {
      font-size: 1.5rem;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .error-card p,
    .empty-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .btn-retry,
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .btn-retry:hover,
    .btn-primary:hover {
      transform: translateY(-2px);
    }

    .payments-grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .payment-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .payment-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .payment-status-badge {
      margin-bottom: 1rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-completed {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .payment-details h3 {
      font-size: 1.3rem;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .payment-amount {
      font-size: 1.8rem;
      font-weight: bold;
      color: #667eea;
      margin: 0 0 1rem 0;
    }

    .payment-info {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #6b7280;
      font-weight: 500;
    }

    .info-value {
      color: #1f2937;
      font-weight: 600;
    }

    .admin-notes {
      background: #eff6ff;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      margin-bottom: 1rem;
    }

    .admin-notes strong {
      color: #1e40af;
      display: block;
      margin-bottom: 0.5rem;
    }

    .admin-notes p {
      color: #1e40af;
      margin: 0;
    }

    .btn-view-screenshot {
      width: 100%;
      background: #f3f4f6;
      color: #374151;
      border: 2px solid #e5e7eb;
      padding: 0.75rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s, border-color 0.3s;
    }

    .btn-view-screenshot:hover {
      background: #e5e7eb;
      border-color: #d1d5db;
    }

    .screenshot-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }

    .modal-content {
      position: relative;
      max-width: 90%;
      max-height: 90%;
    }

    .modal-content img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 8px;
    }

    .close-button {
      position: absolute;
      top: -3rem;
      right: 0;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 768px) {
      .payments-container {
        padding: 1rem;
      }

      .payments-header h1 {
        font-size: 1.8rem;
      }

      .payments-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyPaymentsComponent implements OnInit {
  private API_URL = environment.apiUrl;

  payments = signal<PaymentWithPlan[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  selectedScreenshot = signal<string | null>(null);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ payments: PaymentWithPlan[] }>(`${this.API_URL}/manual-payments/my-payments`)
      .subscribe({
        next: (response) => {
          this.payments.set(response.payments);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading payments:', err);
          this.isLoading.set(false);

          if (err.status === 401) {
            this.error.set('Vous devez être connecté pour voir vos paiements');
            setTimeout(() => this.router.navigate(['/auth/login']), 2000);
          } else {
            this.error.set('Erreur lors du chargement des paiements');
          }
        }
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  viewScreenshot(url: string) {
    this.selectedScreenshot.set(url);
  }

  closeScreenshot() {
    this.selectedScreenshot.set(null);
  }

  getFullScreenshotUrl(url: string): string {
    // If URL is already a full URL (starts with http/https), return it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, construct full URL with API base
    const cleanUrl = url.startsWith('/api') ? url.substring(4) : url;
    return `${this.API_URL.replace('/api', '')}${cleanUrl}`;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  goToSubscription() {
    this.router.navigate(['/subscription']);
  }
}
