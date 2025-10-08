import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PaymentService, SubscriptionPlan, CheckoutRequest, CheckoutResponse } from '../../services/payment.service';

interface SubscriptionPlanUI {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  isPopular: boolean;
  isCurrent: boolean;
  buttonText: string;
  buttonClass: string;
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold mb-6 shadow-lg">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Plans d'abonnement
          </div>
          <h1 class="text-5xl sm:text-6xl font-black text-gray-900 mb-6">
            Choisissez votre 
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">plan parfait</span>
            </h1>
          <p class="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Accédez à tous nos contenus premium avec nos plans d'abonnement flexibles et adaptés à vos besoins
          </p>
        </div>

        <!-- Loading State -->
        <div *ngIf="plansLoading()" class="flex justify-center items-center py-16">
          <div class="text-center">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-gray-600">Chargement des plans d'abonnement...</p>
          </div>
        </div>

        <!-- Subscription Plans -->
        <div *ngIf="!plansLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div *ngFor="let plan of subscriptionPlans()" 
               class="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
               [class.border-blue-500]="plan.isPopular"
               [class.border-gray-200]="!plan.isPopular"
               [class.ring-4]="plan.isPopular"
               [class.ring-blue-500/20]="plan.isPopular">
            
            <!-- Popular Badge -->
            <div *ngIf="plan.isPopular" 
                 class="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
              <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg animate-pulse">
                ⭐ Le plus populaire
            </div>
          </div>

            <!-- Plan Header -->
            <div class="text-center mb-8">
              <div class="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg"
                   [class.bg-gradient-to-br]="true"
                   [class.from-blue-500]="plan.id === 'videos-only'"
                   [class.to-cyan-500]="plan.id === 'videos-only'"
                   [class.from-green-500]="plan.id === 'documents-only'"
                   [class.to-emerald-500]="plan.id === 'documents-only'"
                   [class.from-purple-500]="plan.id === 'full-access'"
                   [class.to-pink-500]="plan.id === 'full-access'"
                   [class.from-gray-500]="plan.id === 'free'"
                   [class.to-gray-600]="plan.id === 'free'">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="plan.id === 'videos-only'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  <path *ngIf="plan.id === 'documents-only'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  <path *ngIf="plan.id === 'full-access'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  <path *ngIf="plan.id === 'free'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ plan.name }}</h3>
              <p class="text-gray-600 mb-6 text-sm leading-relaxed">{{ plan.description }}</p>
              <div class="flex items-baseline justify-center mb-2">
                <span class="text-6xl font-black text-gray-900">{{ plan.price }}</span>
                <span class="text-2xl text-gray-500 ml-2 font-semibold">{{ plan.currency }}</span>
                </div>
              <span class="text-gray-500 text-sm font-medium">/{{ plan.period === 'yearly' ? 'an' : 'mois' }}</span>
          </div>

            <!-- Features -->
            <ul class="space-y-4 mb-8">
              <li *ngFor="let feature of plan.features" 
                  class="flex items-start group-hover:translate-x-2 transition-transform duration-300">
                <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                  <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-gray-700 font-medium">{{ feature }}</span>
                </li>
              </ul>

            <!-- CTA Button -->
            <button (click)="selectPlan(plan.id)" 
                    [class]="plan.buttonClass + ' group-hover:scale-105 transition-all duration-300'"
                    [disabled]="plan.isCurrent">
              <span class="flex items-center justify-center">
                {{ plan.buttonText }}
                <svg *ngIf="!plan.isCurrent" class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </span>
              </button>
            </div>
          </div>

        <!-- Payment Methods -->
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-16 border border-gray-200/50">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Méthodes de paiement sécurisées</h2>
            <p class="text-gray-600 text-lg">Paiement 100% sécurisé avec les meilleures solutions de paiement du Maroc</p>
            </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="group text-center p-8 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-gray-100">
                <img src="images/payments/bankily-logo.png" alt="Bankily" class="w-16 h-16 object-contain" />
          </div>
              <h3 class="text-xl font-bold text-gray-900 mb-3">Bankily</h3>
              <p class="text-gray-600">Paiement sécurisé via Bankily avec protection maximale</p>
              </div>
            <div class="group text-center p-8 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-gray-100">
                <img src="images/payments/masrivi-logo.png" alt="Masrivi" class="w-16 h-16 object-contain" />
            </div>
              <h3 class="text-xl font-bold text-gray-900 mb-3">Masrivi</h3>
              <p class="text-gray-600">Paiement mobile instantané avec Masrivi</p>
              </div>
            <div class="group text-center p-8 border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-gray-100">
                <img src="images/payments/sedad-logo.png" alt="Sedad" class="w-16 h-16 object-contain" />
            </div>
              <h3 class="text-xl font-bold text-gray-900 mb-3">Sedad</h3>
              <p class="text-gray-600">Paiement électronique rapide et fiable</p>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200/50">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Questions fréquentes</h2>
            <p class="text-gray-600 text-lg">Tout ce que vous devez savoir sur nos abonnements</p>
            </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-6">
              <div class="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50/50 rounded-r-2xl">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Puis-je changer de plan à tout moment ?</h3>
                <p class="text-gray-600">Oui, vous pouvez changer de plan à tout moment depuis votre tableau de bord sans frais supplémentaires.</p>
            </div>
              <div class="border-l-4 border-green-500 pl-6 py-4 bg-green-50/50 rounded-r-2xl">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Y a-t-il des frais d'annulation ?</h3>
                <p class="text-gray-600">Non, vous pouvez annuler votre abonnement à tout moment sans frais ni engagement.</p>
            </div>
          </div>
            <div class="space-y-6">
              <div class="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50/50 rounded-r-2xl">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Les prix incluent-ils les taxes ?</h3>
                <p class="text-gray-600">Oui, tous les prix affichés incluent les taxes applicables au Maroc.</p>
        </div>
              <div class="border-l-4 border-orange-500 pl-6 py-4 bg-orange-50/50 rounded-r-2xl">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Comment contacter le support ?</h3>
                <p class="text-gray-600">Vous pouvez nous contacter via email à support@archify.ma ou via le chat en ligne 24/7.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionComponent implements OnInit {
  private readonly API_URL = 'http://localhost:3000/api';
  selectedPlan = signal<string | null>(null);
  selectedProvider = signal<'bankily' | 'masrivi' | 'sedad'>('bankily');
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private paymentService: PaymentService,
    private router: Router,
    private http: HttpClient
  ) {}

  subscriptionPlans = signal<SubscriptionPlanUI[]>([]);
  plansLoading = signal(false);

  ngOnInit() {
    this.loadSubscriptionPlans();
  }

  private loadSubscriptionPlans() {
    this.plansLoading.set(true);
    this.http.get<any>(`${this.API_URL}/subscriptions/plans`).subscribe({
      next: (response) => {
        const plans = response.plans || response;
        const currentUser = this.authService.user();
        const isPremium = this.authService.isPremium();

        const uiPlans: SubscriptionPlanUI[] = plans.map((plan: any, index: number) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description || `Accès ${plan.name.toLowerCase()}`,
          price: plan.priceCents / 100,
          currency: plan.currency,
          period: plan.interval,
          features: plan.features || [
            `Accès ${plan.name.toLowerCase()}`,
            'Contenu premium',
            'Support par email',
            'Accès pour 1 an complet'
          ],
          isPopular: index === 0, // Make first plan popular
          isCurrent: false, // Will be set based on user subscription
          buttonText: `${plan.priceCents / 100} ${plan.currency}/an`,
          buttonClass: index === 0 
            ? 'w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold'
            : index === 1
            ? 'w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold'
            : 'w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold'
        }));

        this.subscriptionPlans.set(uiPlans);
        this.plansLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading subscription plans:', error);
        this.plansLoading.set(false);
      }
    });
  }

  selectPlan(planId: string) {
    this.selectedPlan.set(planId);
    this.error.set(null);
  }

  async proceedToPayment() {
    if (!this.selectedPlan()) {
      this.error.set('Veuillez sélectionner un plan');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const request: CheckoutRequest = {
        planId: this.selectedPlan()!,
        provider: this.selectedProvider()
      };

      const response = await this.paymentService.initiateCheckout(request).toPromise();
      
      if (response?.approvalUrl) {
      window.location.href = response.approvalUrl;
      } else if (response?.qrCode) {
        // Handle QR code payment
        this.error.set('Paiement par QR code non implémenté dans cette version');
    } else {
        this.error.set('Erreur lors de la création du paiement');
      }
    } catch (err) {
      this.error.set('Erreur de connexion. Veuillez réessayer.');
      console.error('Payment error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }
}