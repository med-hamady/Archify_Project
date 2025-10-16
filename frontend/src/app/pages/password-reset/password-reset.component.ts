import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
          {{ getStepTitle() }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ getStepDescription() }}
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <!-- Step 1: Email Input -->
          <form *ngIf="!isResetStep()" (ngSubmit)="sendResetCode()" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div class="mt-1">
                <input id="email" name="email" type="email" [(ngModel)]="email" required
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
            </div>

            <div>
              <button type="submit" [disabled]="isLoading()"
                      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="!isLoading()">Envoyer le code</span>
                <span *ngIf="isLoading()">Envoi en cours...</span>
              </button>
            </div>
          </form>

          <!-- Step 2: Code Verification -->
          <form *ngIf="isResetStep() && !isCodeVerified()" (ngSubmit)="verifyCode()" class="space-y-6">
            <div>
              <label for="code" class="block text-sm font-medium text-gray-700">
                Code de vérification
              </label>
              <div class="mt-1">
                <input id="code" name="code" type="text" [(ngModel)]="resetCode" required
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                       placeholder="Entrez le code reçu par email">
              </div>
            </div>

            <div>
              <button type="submit" [disabled]="isLoading()"
                      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="!isLoading()">Vérifier le code</span>
                <span *ngIf="isLoading()">Vérification en cours...</span>
              </button>
            </div>
          </form>

          <!-- Step 3: Password Reset -->
          <form *ngIf="isResetStep() && isCodeVerified()" (ngSubmit)="resetPassword()" class="space-y-6">
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <div class="mt-1">
                <input id="newPassword" name="newPassword" type="password" [(ngModel)]="newPassword" required
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                       minlength="8">
              </div>
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div class="mt-1">
                <input id="confirmPassword" name="confirmPassword" type="password" [(ngModel)]="confirmPassword" required
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                       minlength="8">
              </div>
            </div>

            <div>
              <button type="submit" [disabled]="isLoading() || newPassword !== confirmPassword"
                      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="!isLoading()">Réinitialiser le mot de passe</span>
                <span *ngIf="isLoading()">Réinitialisation en cours...</span>
              </button>
            </div>
          </form>

          <!-- Success Message -->
          <div *ngIf="successMessage()" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800">{{ successMessage() }}</p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage()" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">{{ errorMessage() }}</p>
              </div>
            </div>
          </div>

          <!-- Back to Login -->
          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <a routerLink="/login" class="px-2 bg-white text-gray-500 hover:text-gray-700">
                  Retour à la connexion
                </a>
              </div>
            </div>
          </div>

          <!-- Alternative: Manual Code Entry -->
          <div *ngIf="!isResetStep()" class="mt-4 text-center">
            <p class="text-sm text-gray-600">
              Vous avez déjà reçu un code ? 
              <button (click)="isResetStep.set(true)" class="text-blue-600 hover:text-blue-800 font-medium">
                Entrer le code manuellement
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PasswordResetComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;

  // Signals
  isLoading = signal(false);
  isResetStep = signal(false);
  isCodeVerified = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Form data
  email = '';
  resetCode = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if token is provided in URL
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.resetCode = params['token'];
        this.isResetStep.set(true);
        this.isCodeVerified.set(true); // Skip code verification if token is in URL
        this.successMessage.set('Code de réinitialisation détecté. Veuillez entrer votre nouveau mot de passe.');
      }
    });
  }

  getStepTitle(): string {
    if (!this.isResetStep()) {
      return 'Mot de passe oublié';
    } else if (!this.isCodeVerified()) {
      return 'Vérification du code';
    } else {
      return 'Réinitialiser le mot de passe';
    }
  }

  getStepDescription(): string {
    if (!this.isResetStep()) {
      return 'Entrez votre email pour recevoir un code de réinitialisation';
    } else if (!this.isCodeVerified()) {
      return 'Entrez le code de vérification reçu par email';
    } else {
      return 'Entrez votre nouveau mot de passe';
    }
  }

  async sendResetCode() {
    if (!this.email) {
      this.errorMessage.set('Veuillez entrer votre adresse email');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.http.post(`${this.API_URL}/auth/forgot-password`, { email: this.email }).toPromise();
      this.successMessage.set('Un code de réinitialisation a été envoyé à votre adresse email');
      this.isResetStep.set(true);
    } catch (error: any) {
      console.error('Error sending reset code:', error);
      this.errorMessage.set('Erreur lors de l\'envoi du code. Veuillez réessayer.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyCode() {
    if (!this.resetCode) {
      this.errorMessage.set('Veuillez entrer le code de vérification');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const response = await this.http.post(`${this.API_URL}/auth/verify-reset-code`, {
        email: this.email,
        code: this.resetCode
      }).toPromise();

      console.log('Code verified:', response);
      this.isCodeVerified.set(true);
      this.successMessage.set('Code vérifié avec succès. Vous pouvez maintenant définir votre nouveau mot de passe.');
    } catch (error: any) {
      console.error('Error verifying code:', error);
      this.errorMessage.set(error.error?.message || 'Code de vérification invalide');
    } finally {
      this.isLoading.set(false);
    }
  }

  async resetPassword() {
    if (!this.resetCode || !this.newPassword || !this.confirmPassword) {
      this.errorMessage.set('Veuillez remplir tous les champs');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage.set('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.http.post(`${this.API_URL}/auth/reset-password`, {
        token: this.resetCode,
        newPassword: this.newPassword
      }).toPromise();

      this.successMessage.set('Mot de passe réinitialisé avec succès ! Redirection vers la connexion...');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      this.errorMessage.set('Code invalide ou expiré. Veuillez demander un nouveau code.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
