import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-init',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">Initialisation du Système</h2>
          <p class="mt-2 text-sm text-gray-600">
            Créez le premier compte administrateur
          </p>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- First Name -->
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                [(ngModel)]="formData.firstName"
                name="firstName"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre prénom"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                [(ngModel)]="formData.lastName"
                name="lastName"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nom"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                [(ngModel)]="formData.email"
                name="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@archify.ma"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                [(ngModel)]="formData.password"
                name="password"
                required
                minlength="8"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mot de passe sécurisé"
              />
            </div>

            <!-- Error Message -->
            <div *ngIf="error()" class="text-red-600 text-sm text-center">
              {{ error() }}
            </div>

            <!-- Success Message -->
            <div *ngIf="success()" class="text-green-600 text-sm text-center">
              {{ success() }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="!isLoading()">Créer le Super Admin</span>
              <span *ngIf="isLoading()">Création en cours...</span>
            </button>
          </form>
        </div>

        <!-- Info -->
        <div class="text-center">
          <p class="text-xs text-gray-500">
            🔒 Ce compte aura tous les privilèges d'administration
          </p>
        </div>
      </div>
    </div>
  `
})
export class AdminInitComponent {
  private readonly API_URL = 'http://localhost:3000/api';

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  isLoading = signal(false);
  error = signal('');
  success = signal('');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email || !this.formData.password) {
      this.error.set('Veuillez remplir tous les champs');
      return;
    }

    if (this.formData.password.length < 8) {
      this.error.set('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.success.set('');

    this.http.post(`${this.API_URL}/admin/init`, this.formData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.success.set('Super admin créé avec succès ! Redirection...');
        
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.error?.message) {
          this.error.set(error.error.message);
        } else {
          this.error.set('Erreur lors de la création du super admin');
        }
      }
    });
  }
}
