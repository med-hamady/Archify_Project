import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface SubscriptionPlan {
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
  imports: [CommonModule],
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
        <!-- Billing Toggle -->
        <div class="flex justify-center mb-12">
          <div class="bg-gray-100 rounded-lg p-1 flex">
            <button
              (click)="setBillingPeriod('monthly')"
              class="px-6 py-2 text-sm font-medium rounded-md transition-colors"
              [class]="billingPeriod() === 'monthly' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'"
            >
              Mensuel
            </button>
            <button
              (click)="setBillingPeriod('yearly')"
              class="px-6 py-2 text-sm font-medium rounded-md transition-colors"
              [class]="billingPeriod() === 'yearly' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'"
            >
              Annuel
              <span class="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                -20%
              </span>
            </button>
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
                <span class="text-4xl font-bold text-gray-900">
                  {{ billingPeriod() === 'monthly' ? '29' : '290' }}
                </span>
                <span class="text-gray-600">
                  /{{ billingPeriod() === 'monthly' ? 'mois' : 'an' }}
                </span>
                <div *ngIf="billingPeriod() === 'yearly'" class="text-sm text-green-600 font-medium mt-1">
                  Économisez 58€ par an
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
  private billingPeriodSignal = signal<'monthly' | 'yearly'>('monthly');

  billingPeriod = computed(() => this.billingPeriodSignal());

  subscriptionPlans = computed<SubscriptionPlan[]>(() => {
    const isMonthly = this.billingPeriod() === 'monthly';
    const currentUser = this.authService.user();
    const isPremium = this.authService.isPremium();

    return [
      {
        id: 'free',
        name: 'Gratuit',
        description: 'Parfait pour commencer',
        price: 0,
        currency: 'EUR',
        period: this.billingPeriod(),
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
        description: 'Pour les étudiants sérieux',
        price: isMonthly ? 29 : 290,
        currency: 'EUR',
        period: this.billingPeriod(),
        features: [
          'Tous les cours premium',
          'Vidéos HD illimitées',
          'Toutes les notes PDF',
          'Support prioritaire',
          'Cours illimités',
          'Téléchargements offline',
          'Certificats de fin de cours',
          'Accès aux examens d\'archive'
        ],
        isPopular: true,
        isCurrent: isPremium,
        buttonText: isPremium ? 'Plan actuel' : (isMonthly ? '29€/mois' : '290€/an'),
        buttonClass: isPremium 
          ? 'w-full px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed'
          : 'w-full px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors'
      },
      {
        id: 'enterprise',
        name: 'Entreprise',
        description: 'Pour les institutions',
        price: 0,
        currency: 'EUR',
        period: this.billingPeriod(),
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

  constructor(private authService: AuthService) {}

  setBillingPeriod(period: 'monthly' | 'yearly'): void {
    this.billingPeriodSignal.set(period);
  }

  selectPlan(planId: string): void {
    if (planId === 'free') {
      // Handle free plan selection
      console.log('Free plan selected');
    } else if (planId === 'premium') {
      // Handle premium plan selection
      this.initiatePayment('premium');
    } else if (planId === 'enterprise') {
      // Handle enterprise plan contact
      this.contactEnterprise();
    }
  }

  private initiatePayment(planId: string): void {
    // In a real app, this would integrate with payment providers
    console.log(`Initiating payment for ${planId} plan`);
    // This would redirect to payment gateway or show payment modal
  }

  private contactEnterprise(): void {
    // In a real app, this would open contact form or redirect to sales page
    console.log('Contacting enterprise sales');
  }
}