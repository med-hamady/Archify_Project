import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from '../../services/auth.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">
            {{ isLoginMode() ? 'Connexion' : 'Créer un compte' }}
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            {{ isLoginMode() ? 'Accédez à votre compte FacGame' : 'Rejoignez la communauté FacGame' }}
          </p>
        </div>

        <!-- Auth Form -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre@email.com"
                [class.border-red-500]="authForm.get('email')?.invalid && authForm.get('email')?.touched"
              />
              <div *ngIf="authForm.get('email')?.invalid && authForm.get('email')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <span *ngIf="authForm.get('email')?.errors?.['required']">L'email est requis</span>
                <span *ngIf="authForm.get('email')?.errors?.['email']">Format d'email invalide</span>
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  [class.border-red-500]="authForm.get('password')?.invalid && authForm.get('password')?.touched"
                />
                <button
                  type="button"
                  (click)="togglePassword()"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg *ngIf="!showPassword()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg *ngIf="showPassword()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                  </svg>
                </button>
              </div>
              <div *ngIf="authForm.get('password')?.invalid && authForm.get('password')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <span *ngIf="authForm.get('password')?.errors?.['required']">Le mot de passe est requis</span>
                <span *ngIf="authForm.get('password')?.errors?.['minlength']">Minimum 8 caractères</span>
              </div>
            </div>

            <!-- Registration Fields -->
            <div *ngIf="!isLoginMode()" class="space-y-4">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean"
                  [class.border-red-500]="authForm.get('firstName')?.invalid && authForm.get('firstName')?.touched"
                />
                <div *ngIf="authForm.get('firstName')?.invalid && authForm.get('firstName')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  Le nom est requis
                </div>
              </div>

              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dupont"
                  [class.border-red-500]="authForm.get('lastName')?.invalid && authForm.get('lastName')?.touched"
                />
                <div *ngIf="authForm.get('lastName')?.invalid && authForm.get('lastName')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  Le prénom est requis
                </div>
              </div>

              <!-- Semester (PCEM1, PCEM2, or DCEM1) -->
              <div>
                <label for="semester" class="block text-sm font-medium text-gray-700 mb-2">
                  Niveau d'étude
                </label>
                <select
                  id="semester"
                  formControlName="semester"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  [class.border-red-500]="authForm.get('semester')?.invalid && authForm.get('semester')?.touched"
                >
                  <option value="">Sélectionner votre niveau</option>
                  <option value="PCEM1">PCEM1 (Première année)</option>
                  <option value="PCEM2">PCEM2 (Deuxième année)</option>
                  <option value="DCEM1">DCEM1 (Troisième année)</option>
                </select>
                <div *ngIf="authForm.get('semester')?.invalid && authForm.get('semester')?.touched"
                     class="mt-1 text-sm text-red-600">
                  Le niveau d'étude est requis
                </div>
              </div>

            </div>

            <!-- Remember Me / Terms -->
            <div *ngIf="isLoginMode()" class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  formControlName="rememberMe"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="rememberMe" class="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>
              <button type="button"
                       (click)="onForgotPasswordClick()"
                       class="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer z-10 relative inline-block px-2 py-1 -mx-2 -my-1 transition-colors duration-200 hover:bg-blue-50 rounded bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                Mot de passe oublié ?
              </button>
            </div>

            <div *ngIf="!isLoginMode()" class="flex items-center">
              <input
                id="terms"
                type="checkbox"
                formControlName="terms"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                [class.border-red-500]="authForm.get('terms')?.invalid && authForm.get('terms')?.touched"
              />
              <label for="terms" class="ml-2 block text-sm text-gray-700">
                J'accepte les 
                <a routerLink="/terms" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                  conditions d'utilisation
                </a>
                et la 
                <a href="#" class="text-blue-600 hover:text-blue-800 underline">
                  politique de confidentialité
                </a>
              </label>
            </div>
            <div *ngIf="authForm.get('terms')?.invalid && authForm.get('terms')?.touched" 
                 class="text-sm text-red-600">
              Vous devez accepter les conditions d'utilisation
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="authForm.invalid || isLoading()"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg *ngIf="isLoading()" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading() ? 'Traitement...' : (isLoginMode() ? 'Se connecter' : 'Créer mon compte') }}
            </button>

            <!-- Error Message -->
            <div *ngIf="errorMessage()" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <div class="flex">
                <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <div class="ml-3">
                  <p class="text-sm text-red-800">{{ errorMessage() }}</p>
                </div>
              </div>
            </div>
          </form>


          <!-- Toggle Mode -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              {{ isLoginMode() ? "Vous n'avez pas de compte ?" : 'Vous avez déjà un compte ?' }}
              <button
                type="button"
                (click)="toggleMode()"
                class="font-medium text-blue-600 hover:text-blue-800"
              >
                {{ isLoginMode() ? 'Créer un compte' : 'Se connecter' }}
              </button>
            </p>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="text-center">
          <p class="text-xs text-gray-500">
            🔒 Vos données sont protégées et chiffrées
          </p>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent implements OnInit {
  private isLoginModeSignal = signal<boolean>(true);
  private showPasswordSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(false);
  private errorMessageSignal = signal<string>('');

  authForm: FormGroup;

  isLoginMode = computed(() => this.isLoginModeSignal());
  showPassword = computed(() => this.showPasswordSignal());
  isLoading = computed(() => this.isLoadingSignal());
  errorMessage = computed(() => this.errorMessageSignal());

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private deviceService: DeviceService
  ) {
    this.authForm = this.createForm();
  }

  ngOnInit(): void {
    // Check the current route to determine if we're in login or register mode
    const currentUrl = this.router.url;
    if (currentUrl.includes('/register')) {
      this.isLoginModeSignal.set(false);
      this.authForm = this.createForm();
    } else {
      this.isLoginModeSignal.set(true);
      this.authForm = this.createForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', this.isLoginMode() ? [] : [Validators.required]],
      lastName: ['', this.isLoginMode() ? [] : [Validators.required]],
      semester: ['', this.isLoginMode() ? [] : [Validators.required]],
      rememberMe: [false],
      terms: [false, this.isLoginMode() ? [] : [Validators.requiredTrue]]
    });
  }

  toggleMode(): void {
    this.isLoginModeSignal.set(!this.isLoginMode());
    this.errorMessageSignal.set('');
    this.authForm = this.createForm();
  }

  onForgotPasswordClick(): void {
    console.log('🔗 Forgot password button clicked - navigating to password reset page');
    console.log('🔗 Current router URL:', this.router.url);
    console.log('🔗 Navigating to /forgot-password');
    
    try {
      this.router.navigate(['/forgot-password']);
      console.log('✅ Navigation successful');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  }

  togglePassword(): void {
    this.showPasswordSignal.set(!this.showPassword());
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set('');

    const formValue = this.authForm.value;

    if (this.isLoginMode()) {
      const loginData: LoginRequest = {
        email: formValue.email,
        password: formValue.password,
        deviceId: this.deviceService.getDeviceId(),
        rememberMe: formValue.rememberMe
      };

      this.authService.login(loginData).subscribe({
        next: () => {
          this.isLoadingSignal.set(false);
          // Navigation handled by auth service
        },
        error: (error) => {
          this.isLoadingSignal.set(false);
          this.errorMessageSignal.set(this.getErrorMessage(error));
        }
      });
    } else {
      const registerData: RegisterRequest = {
        email: formValue.email,
        password: formValue.password,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        semester: formValue.semester,
        deviceId: this.deviceService.getDeviceId()
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.isLoadingSignal.set(false);
          // Navigation handled by auth service
        },
        error: (error) => {
          this.isLoadingSignal.set(false);
          this.errorMessageSignal.set(this.getErrorMessage(error));
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.authForm.controls).forEach(key => {
      const control = this.authForm.get(key);
      control?.markAsTouched();
    });
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.status === 401) {
      return 'Email ou mot de passe incorrect';
    }
    if (error.status === 409) {
      return 'Un compte avec cet email existe déjà';
    }
    if (error.status === 0) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}