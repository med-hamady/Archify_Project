import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  type: string;
  interval: string;
  priceCents: number;
  currency: string;
  features: string[];
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-container">
      <div class="payment-card">
        <div class="payment-header">
          <button (click)="goBack()" class="back-button">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Retour
          </button>
          <h1>Paiement de l'abonnement</h1>
        </div>

        @if (selectedPlan()) {
          <div class="plan-summary">
            <h3>{{ selectedPlan()!.name }}</h3>
            <p class="price">{{ selectedPlan()!.priceCents / 100 }} {{ selectedPlan()!.currency }}</p>
            <p class="interval">{{ selectedPlan()!.interval }}</p>
          </div>
        }

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }

        @if (success()) {
          <div class="success-message">
            <h3>Paiement soumis avec succès!</h3>
            <p>Votre paiement a été enregistré et est en attente de validation par un administrateur.</p>
            <p>Vous recevrez une notification par email une fois validé.</p>
            <button (click)="viewPaymentStatus()" class="btn-primary">
              Voir le statut de mon paiement
            </button>
          </div>
        } @else {
          <form (ngSubmit)="submitPayment()" class="payment-form">
            <div class="form-group">
              <label for="provider">Méthode de paiement *</label>
              <select
                id="provider"
                [(ngModel)]="paymentData.provider"
                name="provider"
                required
                [disabled]="isLoading()">
                <option value="">Sélectionnez une méthode</option>
                <option value="BANKILY">Bankily</option>
                <option value="MASRIVI">Masrivi</option>
                <option value="SEDAD">Sedad</option>
              </select>
            </div>

            <div class="form-group">
              <label for="phoneNumber">Numéro de téléphone *</label>
              <input
                type="tel"
                id="phoneNumber"
                [(ngModel)]="paymentData.phoneNumber"
                name="phoneNumber"
                placeholder="Ex: 22123456"
                required
                minlength="8"
                [disabled]="isLoading()">
              <small>Le numéro utilisé pour le paiement</small>
            </div>

            <div class="form-group">
              <label for="providerRef">Numéro de transaction *</label>
              <input
                type="text"
                id="providerRef"
                [(ngModel)]="paymentData.providerRef"
                name="providerRef"
                placeholder="Ex: TXN123456789"
                required
                [disabled]="isLoading()">
              <small>Le numéro de transaction fourni par votre opérateur</small>
            </div>

            <div class="form-group">
              <label for="screenshot">Capture d'écran du paiement *</label>
              <div class="file-input-wrapper">
                <input
                  type="file"
                  id="screenshot"
                  (change)="onFileSelected($event)"
                  accept="image/*"
                  required
                  [disabled]="isLoading()">
                @if (selectedFile()) {
                  <div class="file-selected">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    {{ selectedFile()!.name }}
                  </div>
                }
              </div>
              <small>Format accepté: JPG, PNG, GIF, WEBP (max 5MB)</small>
            </div>

            <div class="instructions">
              <h4>Instructions:</h4>
              <ol>
                <li>Effectuez le paiement via {{ paymentData.provider || 'votre méthode choisie' }}</li>
                <li>Prenez une capture d'écran de la confirmation</li>
                <li>Notez le numéro de transaction</li>
                <li>Remplissez ce formulaire avec les informations</li>
                <li>Un administrateur validera votre paiement sous 24h</li>
              </ol>
            </div>

            <button
              type="submit"
              class="btn-submit"
              [disabled]="isLoading() || !isFormValid()">
              @if (isLoading()) {
                <span class="spinner"></span>
                Soumission en cours...
              } @else {
                Soumettre le paiement
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .payment-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .payment-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 600px;
      width: 100%;
      padding: 2rem;
    }

    .payment-header {
      margin-bottom: 2rem;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #667eea;
      font-size: 1rem;
      cursor: pointer;
      margin-bottom: 1rem;
      padding: 0.5rem;
      border-radius: 6px;
      transition: background 0.3s;
    }

    .back-button:hover {
      background: #f3f4f6;
    }

    .payment-header h1 {
      font-size: 1.8rem;
      color: #1f2937;
      margin: 0;
    }

    .plan-summary {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      text-align: center;
    }

    .plan-summary h3 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
      font-size: 1.3rem;
    }

    .price {
      font-size: 2rem;
      font-weight: bold;
      color: #667eea;
      margin: 0.5rem 0;
    }

    .interval {
      color: #6b7280;
      margin: 0;
    }

    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
    }

    .form-group input,
    .form-group select {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-group input:disabled,
    .form-group select:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
    }

    .form-group small {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .file-input-wrapper {
      position: relative;
    }

    .file-input-wrapper input[type="file"] {
      width: 100%;
      padding: 0.75rem;
      border: 2px dashed #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
    }

    .file-input-wrapper input[type="file"]::-webkit-file-upload-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      margin-right: 1rem;
    }

    .file-selected {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #059669;
      font-weight: 500;
      margin-top: 0.5rem;
    }

    .instructions {
      background: #eff6ff;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .instructions h4 {
      margin: 0 0 1rem 0;
      color: #1e40af;
    }

    .instructions ol {
      margin: 0;
      padding-left: 1.5rem;
      color: #1e40af;
    }

    .instructions li {
      margin-bottom: 0.5rem;
    }

    .btn-submit {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
      margin-bottom: 1.5rem;
    }

    .success-message {
      background: #f0fdf4;
      padding: 2rem;
      border-radius: 8px;
      border-left: 4px solid #10b981;
      text-align: center;
    }

    .success-message h3 {
      color: #065f46;
      margin: 0 0 1rem 0;
    }

    .success-message p {
      color: #047857;
      margin: 0.5rem 0;
    }

    .btn-primary {
      background: #10b981;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1.5rem;
      transition: background 0.3s;
    }

    .btn-primary:hover {
      background: #059669;
    }

    @media (max-width: 640px) {
      .payment-container {
        padding: 1rem;
      }

      .payment-card {
        padding: 1.5rem;
      }

      .payment-header h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class PaymentFormComponent implements OnInit {
  private API_URL = environment.apiUrl;

  selectedPlan = signal<SubscriptionPlan | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  selectedFile = signal<File | null>(null);

  paymentData = {
    provider: '',
    phoneNumber: '',
    providerRef: '',
    planId: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Get planId from route params
    const planId = this.route.snapshot.queryParams['planId'];
    if (!planId) {
      this.error.set('Plan non spécifié');
      return;
    }

    this.paymentData.planId = planId;
    this.loadPlanDetails(planId);
  }

  loadPlanDetails(planId: string) {
    this.http.get<{ plans: SubscriptionPlan[] }>(`${this.API_URL}/subscriptions/plans`)
      .subscribe({
        next: (response) => {
          const plan = response.plans.find(p => p.id === planId);
          if (plan) {
            this.selectedPlan.set(plan);
          } else {
            this.error.set('Plan non trouvé');
          }
        },
        error: (err) => {
          console.error('Error loading plan:', err);
          this.error.set('Erreur lors du chargement du plan');
        }
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('La taille du fichier ne doit pas dépasser 5MB');
        input.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.error.set('Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WEBP');
        input.value = '';
        return;
      }

      this.selectedFile.set(file);
      this.error.set(null);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.paymentData.provider &&
      this.paymentData.phoneNumber &&
      this.paymentData.phoneNumber.length >= 8 &&
      this.paymentData.providerRef &&
      this.selectedFile() &&
      this.selectedPlan()
    );
  }

  submitPayment() {
    if (!this.isFormValid()) {
      this.error.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('planId', this.paymentData.planId);
    formData.append('provider', this.paymentData.provider);
    formData.append('phoneNumber', this.paymentData.phoneNumber);
    formData.append('providerRef', this.paymentData.providerRef);
    formData.append('amountCents', String(this.selectedPlan()!.priceCents));
    formData.append('screenshot', this.selectedFile()!);

    this.http.post(`${this.API_URL}/manual-payments`, formData).subscribe({
      next: (response) => {
        console.log('Payment submitted:', response);
        this.isLoading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        console.error('Payment submission error:', err);
        this.isLoading.set(false);

        if (err.error?.error?.message) {
          this.error.set(err.error.error.message);
        } else {
          this.error.set('Erreur lors de la soumission du paiement. Veuillez réessayer.');
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/subscription']);
  }

  viewPaymentStatus() {
    this.router.navigate(['/my-payments']);
  }
}
