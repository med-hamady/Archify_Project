import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PaymentService, SubscriptionPlan, PaymentProvider, CheckoutRequest, CheckoutResponse } from '../../services/payment.service';

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
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="text-center">
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choisissez votre abonnement
            </h1>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">
              Accédez à tous nos contenus premium et transformez votre expérience d'apprentissage
            </p>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Subscription Info -->
        <div class="flex justify-center mb-12">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
            <div class="text-center">
              <h2 class="text-xl font-semibold text-blue-900 mb-2">Abonnement Annuel</h2>
              <p class="text-blue-700">Accès complet à tous les cours et leçons pour une année entière</p>
            </div>
          </div>
        </div>

        <!-- Subscription Plans -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <!-- Free Plan -->
          <div class="card p-8 relative">
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Gratuit</h3>
              <p class="text-gray-600 mb-6">Parfait pour commencer</p>
              <div class="mb-6">
                <span class="text-4xl font-bold text-gray-900">0</span>
                <span class="text-gray-600">/mois</span>
              </div>
              <button 
                [class]="subscriptionPlans()[0].buttonClass"
                [disabled]="subscriptionPlans()[0].isCurrent"
              >
                {{ subscriptionPlans()[0].buttonText }}
              </button>
            </div>
            <div class="mt-8">
              <ul class="space-y-4">
                <li *ngFor="let feature of subscriptionPlans()[0].features" class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-gray-600">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Premium Plan -->
          <div class="card shadow-lg border-2 border-primary p-8 relative">
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Le plus populaire
              </span>
            </div>
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Premium</h3>
              <p class="text-gray-600 mb-6">Pour les étudiants sérieux</p>
              <div class="mb-6">
                <span class="text-4xl font-bold text-gray-900">650</span>
                <span class="text-gray-600">/an</span>
                <div class="text-sm text-green-600 font-medium mt-1">
                  Accès à tous les cours et leçons
                </div>
              </div>
              <button 
                [class]="subscriptionPlans()[1].buttonClass"
                [disabled]="subscriptionPlans()[1].isCurrent"
              >
                {{ subscriptionPlans()[1].buttonText }}
              </button>
            </div>
            <div class="mt-8">
              <ul class="space-y-4">
                <li *ngFor="let feature of subscriptionPlans()[1].features" class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-gray-600">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Enterprise Plan -->
          <div class="card p-8 relative">
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Entreprise</h3>
              <p class="text-gray-600 mb-6">Pour les institutions</p>
              <div class="mb-6">
                <span class="text-4xl font-bold text-gray-900">Sur mesure</span>
              </div>
              <button 
                [class]="subscriptionPlans()[2].buttonClass"
                [disabled]="subscriptionPlans()[2].isCurrent"
              >
                {{ subscriptionPlans()[2].buttonText }}
              </button>
            </div>
            <div class="mt-8">
              <ul class="space-y-4">
                <li *ngFor="let feature of subscriptionPlans()[2].features" class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-gray-600">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 class="text-2xl font-semibold text-gray-900 mb-6 text-center">Méthodes de paiement acceptées</h2>

          <!-- Payment Provider Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">Sélectionnez votre méthode de paiement</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button *ngFor="let provider of paymentProviders()"
                      (click)="setPaymentProvider(provider.id)"
                      [class]="selectedProvider() === provider.id
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'"
                      class="flex items-center gap-3 p-4 border rounded-lg transition-colors"
                      [disabled]="!provider.enabled">
                <div class="w-8 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                     [style.background-color]="getProviderColor(provider.id)">
                  {{ getProviderCode(provider.id) }}
                </div>
                <span class="text-sm text-gray-700">{{ provider.name }}</span>
              </button>
            </div>
          </div>

          <!-- Coupon Code Section -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">Code de réduction (optionnel)</label>
            <div class="flex gap-3">
              <input type="text"
                     [(ngModel)]="couponCode"
                     placeholder="Entrez votre code de réduction"
                     class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <button (click)="applyCoupon()"
                      class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Appliquer
              </button>
            </div>
          </div>

          <!-- Available Payment Methods -->
          <div class="flex flex-wrap justify-center items-center gap-8">
            <div class="flex items-center gap-2">
              <div class="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span class="text-white font-bold text-sm">Bankily</span>
              </div>
              <span class="text-sm text-gray-600">Bankily</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                <span class="text-white font-bold text-sm">Masrivi</span>
              </div>
              <span class="text-sm text-gray-600">Masrivi</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-12 h-8 bg-orange-600 rounded flex items-center justify-center">
                <span class="text-white font-bold text-sm">Sedad</span>
              </div>
              <span class="text-sm text-gray-600">Sedad</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                <span class="text-white font-bold text-sm">VISA</span>
              </div>
              <span class="text-sm text-gray-600">Visa</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-12 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span class="text-white font-bold text-sm">MC</span>
              </div>
              <span class="text-sm text-gray-600">Mastercard</span>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-8 text-center">Questions fréquentes</h2>
          <div class="max-w-3xl mx-auto space-y-6">
            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Puis-je annuler mon abonnement à tout moment ?</h3>
              <p class="text-gray-600">Oui, vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Aucun frais d'annulation ne vous sera facturé.</p>
            </div>
            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Mes données sont-elles sécurisées ?</h3>
              <p class="text-gray-600">Absolument. Nous utilisons un chiffrement de niveau bancaire et ne partageons jamais vos données personnelles avec des tiers.</p>
            </div>
            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Puis-je changer de plan à tout moment ?</h3>
              <p class="text-gray-600">Oui, vous pouvez passer d'un plan à l'autre à tout moment. Les changements prennent effet immédiatement.</p>
            </div>
            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Y a-t-il une garantie de remboursement ?</h3>
              <p class="text-gray-600">Nous offrons une garantie de remboursement de 30 jours si vous n'êtes pas satisfait de notre service.</p>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Comment puis-je contacter le support ?</h3>
              <p class="text-gray-600">Notre équipe de support est disponible 24/7 par email à support@archify.com ou via le chat en direct sur la plateforme.</p>
            </div>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="text-center mt-12">
          <div class="inline-flex items-center gap-2 text-sm text-gray-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
            </svg>
            Paiements sécurisés et chiffrés • SSL 256-bit
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionComponent {

  subscriptionPlans = computed<SubscriptionPlanUI[]>(() => {
    const currentUser = this.authService.user();
    const isPremium = this.authService.isPremium();

    return [
      {
        id: 'free',
        name: 'Gratuit',
        description: 'Parfait pour commencer',
        price: 0,
        currency: 'MRU',
        period: 'yearly',
        features: [
          'Accès aux cours gratuits',
          'Vidéos de base',
          'Notes PDF limitées',
          'Support communautaire',
          '1 cours simultané'
        ],
        isPopular: false,
        isCurrent: !isPremium,
        buttonText: isPremium ? 'Plan actuel' : 'Commencer gratuitement',
        buttonClass: isPremium
          ? 'w-full px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed'
          : 'w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors'
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Accès complet à tous les cours',
        price: 650,
        currency: 'MRU',
        period: 'yearly',
        features: [
          'Accès à TOUS les cours',
          'Toutes les leçons premium',
          'Vidéos HD illimitées',
          'Toutes les notes PDF',
          'Support prioritaire',
          'Téléchargements offline',
          'Certificats de fin de cours',
          'Accès aux examens d\'archive',
          'Accès pour 1 an complet'
        ],
        isPopular: true,
        isCurrent: isPremium,
        buttonText: isPremium ? 'Plan actuel' : '650 MRU/an',
        buttonClass: isPremium
          ? 'w-full px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed'
          : 'w-full px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors'
      },
      {
        id: 'enterprise',
        name: 'Entreprise',
        description: 'Pour les institutions',
        price: 0,
        currency: 'MRU',
        period: 'yearly',
        features: [
          'Tout du plan Premium',
          'Gestion multi-utilisateurs',
          'Analytics avancées',
          'Support dédié',
          'Intégration API',
          'Formation personnalisée',
          'Contrats sur mesure',
          'SLA garanti'
        ],
        isPopular: false,
        isCurrent: false,
        buttonText: 'Nous contacter',
        buttonClass: 'w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors'
      }
    ];
  });

  // Payment related signals
  availablePlans = signal<SubscriptionPlan[]>([]);
  paymentProviders = signal<PaymentProvider[]>([]);
  isLoadingPlans = signal(false);
  checkoutInProgress = signal(false);
  selectedProvider = signal<string>('bankily');
  couponCode = signal<string>('');

  constructor(
    private authService: AuthService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPlans();
    this.loadPaymentProviders();
  }


  selectPlan(planId: string): void {
    if (planId === 'free') {
      this.handleFreePlan();
    } else if (planId === 'premium') {
      this.initiatePayment('premium');
    } else if (planId === 'enterprise') {
      this.contactEnterprise();
    }
  }

  private handleFreePlan(): void {
    // Free plan is automatically available, just show success message
    alert('Vous utilisez maintenant le plan gratuit. Vous pouvez accéder aux cours gratuits immédiatement.');
  }

  private initiatePayment(planId: string): void {
    if (this.checkoutInProgress()) return;

    this.checkoutInProgress.set(true);

    // Find the plan by ID (in real app, this would be from availablePlans signal)
    const plan = this.availablePlans().find(p => p.id === planId);
    if (!plan) {
      alert('Plan non trouvé');
      this.checkoutInProgress.set(false);
      return;
    }

    const checkoutRequest: CheckoutRequest = {
      planId: plan.id,
      provider: this.selectedProvider() as 'bankily' | 'masrivi' | 'sedad'
    };

    if (this.couponCode().trim()) {
      checkoutRequest.couponCode = this.couponCode().trim();
    }

    this.paymentService.initiateCheckout(checkoutRequest).subscribe({
      next: (response) => {
        this.handleCheckoutResponse(response, plan);
        this.checkoutInProgress.set(false);
      },
      error: (error) => {
        console.error('Checkout error:', error);
        alert('Erreur lors de l\'initialisation du paiement: ' + error.message);
        this.checkoutInProgress.set(false);
      }
    });
  }

  private handleCheckoutResponse(response: CheckoutResponse, plan: SubscriptionPlan): void {
    if (response.approvalUrl) {
      // Redirect to payment gateway
      window.location.href = response.approvalUrl;
    } else if (response.qrCode) {
      // Show QR code for mobile payments
      this.showQRCode(response.qrCode, plan);
    } else if (response.intentId) {
      // Handle intent-based payments
      this.handleIntentPayment(response.intentId, plan);
    } else {
      alert('Configuration de paiement reçue. Veuillez suivre les instructions à l\'écran.');
    }
  }

  private showQRCode(qrCode: string, plan: SubscriptionPlan): void {
    // In a real app, this would show a modal with QR code
    alert(`QR Code généré pour le paiement de ${plan.price} ${plan.currency}. Montant: ${plan.name} plan`);
    // Implementation would show QR code modal
  }

  private handleIntentPayment(intentId: string, plan: SubscriptionPlan): void {
    // Handle payment intents (like mobile money)
    alert(`Demande de paiement créée: ${intentId}. Vérifiez votre téléphone pour confirmer le paiement de ${plan.price} ${plan.currency}`);
  }

  private contactEnterprise(): void {
    // In a real app, this would open contact form or redirect to sales page
    this.router.navigate(['/contact-enterprise']);
  }

  private loadPlans(): void {
    this.isLoadingPlans.set(true);
    this.paymentService.getPlans().subscribe({
      next: (plans) => {
        this.availablePlans.set(plans);
        this.isLoadingPlans.set(false);
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.isLoadingPlans.set(false);
      }
    });
  }

  private loadPaymentProviders(): void {
    this.paymentService.getPaymentProviders().subscribe({
      next: (providers) => {
        this.paymentProviders.set(providers);
      },
      error: (error) => {
        console.error('Error loading payment providers:', error);
      }
    });
  }

  setPaymentProvider(providerId: string): void {
    this.selectedProvider.set(providerId);
  }

  applyCoupon(): void {
    if (!this.couponCode().trim()) {
      alert('Veuillez entrer un code de réduction');
      return;
    }

    // Validate coupon (in real app, this would check against backend)
    this.paymentService.validateCoupon(this.couponCode(), 'premium').subscribe({
      next: (result) => {
        if (result.valid) {
          alert(`Code de réduction appliqué! Réduction de ${result.discount}%`);
        } else {
          alert(result.message || 'Code de réduction invalide');
        }
      },
      error: (error) => {
        console.error('Coupon validation error:', error);
        alert('Erreur lors de la validation du code de réduction');
      }
    });
  }

  // Helper methods for payment provider styling
  getProviderColor(providerId: string): string {
    const colors = {
      'bankily': '#2563EB', // blue-600
      'masrivi': '#059669', // emerald-600
      'sedad': '#EA580C',   // orange-600
      'visa': '#1F2937',    // gray-800
      'mastercard': '#1D4ED8' // blue-700
    };
    return colors[providerId as keyof typeof colors] || '#6B7280';
  }

  getProviderCode(providerId: string): string {
    const codes = {
      'bankily': 'BK',
      'masrivi': 'MV',
      'sedad': 'SD',
      'visa': 'VS',
      'mastercard': 'MC'
    };
    return codes[providerId as keyof typeof codes] || '??';
  }
}