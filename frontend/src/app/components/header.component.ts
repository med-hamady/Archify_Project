import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center space-x-4">
            <div class="relative">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Archify</span>
              <p class="text-xs text-gray-500 font-medium">Solutions d'Archives</p>
            </div>
          </a>
          
          <!-- Navigation Links -->
          <nav class="hidden lg:flex items-center space-x-8">
            <a [routerLink]="authService.user()?.role === 'admin' || authService.user()?.role === 'superadmin' ? '/admin' : '/dashboard'" 
               class="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-300 hover:scale-105 relative group">
              Tableau de bord
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a routerLink="/catalog" class="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-300 hover:scale-105 relative group">
              Cours
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a routerLink="/subscription" class="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-300 hover:scale-105 relative group">
              Tarifs
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>
          
          <!-- Auth Buttons / User Profile -->
          <div class="flex items-center space-x-4">
            <!-- Not Authenticated -->
            <div *ngIf="!authService.user()" class="flex items-center space-x-4">
              <a routerLink="/login" 
                 class="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg hover:bg-blue-50">
                Se connecter
              </a>
              <a routerLink="/register" 
                 class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105">
                S'inscrire
              </a>
            </div>
            
            <!-- Authenticated User -->
            <div *ngIf="authService.user()" class="flex items-center space-x-4">
              <!-- Admin Dashboard Link -->
              <a *ngIf="authService.user()?.role === 'admin' || authService.user()?.role === 'superadmin'" 
                 routerLink="/admin" 
                 class="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg hover:bg-blue-50">
                Admin
              </a>
              
              <!-- User Profile Dropdown -->
              <div class="relative" #profileDropdown>
                <button (click)="toggleProfileDropdown()" 
                        class="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-300">
                  <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span class="text-white font-bold text-sm">{{ authService.user()?.name?.charAt(0) }}</span>
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-semibold text-gray-900">{{ authService.user()?.name }}</p>
                    <p class="text-xs text-gray-500">{{ authService.user()?.role | titlecase }}</p>
                  </div>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                
                <!-- Dropdown Menu -->
                <div *ngIf="showProfileDropdown()" 
                     class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <div class="px-4 py-2 border-b border-gray-100">
                    <p class="text-sm font-semibold text-gray-900">{{ authService.user()?.name }}</p>
                    <p class="text-xs text-gray-500">{{ authService.user()?.email }}</p>
                  </div>
                  <a [routerLink]="authService.user()?.role === 'admin' || authService.user()?.role === 'superadmin' ? '/admin' : '/dashboard'" 
                     class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                    </svg>
                    Tableau de bord
                  </a>
                  <a routerLink="/subscription" 
                     class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                    Abonnements
                  </a>
                  <div class="border-t border-gray-100 mt-2 pt-2">
                    <button (click)="logout()" 
                            class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  showProfileDropdown = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleProfileDropdown() {
    this.showProfileDropdown.set(!this.showProfileDropdown());
  }

  logout() {
    this.authService.logout();
    this.showProfileDropdown.set(false);
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showProfileDropdown.set(false);
    }
  }
}
