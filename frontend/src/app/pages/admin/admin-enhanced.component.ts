import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


interface Course {
  id: string;
  title: string;
  description: string;
  semester: string;
  tags: string[];
  isPremium: boolean;
  views: number;
  lessonCount: number;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'EXAM';
  durationSec: number;
  vimeoId?: string;
  youtubeId?: string;
  pdfUrl?: string;
  isPremium: boolean;
  requiresVideoSubscription?: boolean;
  requiresDocumentSubscription?: boolean;
  orderIndex: number;
  createdAt: string;
  courseId: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'superadmin' | 'STUDENT' | 'ADMIN' | 'SUPERADMIN';
  semester?: number;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  type: 'VIDEOS_ONLY' | 'DOCUMENTS_ONLY' | 'FULL_ACCESS';
  features: string;
  isActive: boolean;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'expired';
  startDate: string;
  endDate: string;
  user: User;
  plan: {
    name: string;
    priceCents: number;
    type: string;
  };
}

interface UserStats {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  recentUsers: number;
}

@Component({
  selector: 'app-admin-enhanced',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Enhanced Navigation Tabs -->
        <div class="mb-8">
          <nav class="flex space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200/50">
            <button *ngFor="let tab of tabs"
                    (click)="onTabClick(tab.id)"
                    [class]="activeTab() === tab.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'"
                    class="whitespace-nowrap py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105">
              {{ tab.name }}
            </button>
          </nav>
        </div>


        <!-- Overview Dashboard -->
        <div *ngIf="activeTab() === 'overview'" class="space-y-8">
          <!-- Welcome Section -->
          <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold mb-2">Bienvenue dans votre tableau de bord</h2>
                <p class="text-blue-100 text-lg">Gérez efficacement votre plateforme Archify</p>
              </div>
              <div class="text-right">
                <p class="text-blue-100">{{ getCurrentDate() }}</p>
                <p class="text-2xl font-bold">{{ getCurrentTime() }}</p>
              </div>
            </div>
          </div>

          <!-- Key Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Courses -->
            <div class="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-blue-200/50 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                 (click)="activeTab.set('content')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-600 mb-1">Total Cours</p>
                  <p class="text-4xl font-bold text-blue-900">{{ stats().totalCourses }}</p>
                  <p class="text-xs text-blue-500 mt-2 flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    {{ stats().coursesGrowth >= 0 ? '+' : '' }}{{ stats().coursesGrowth }}% ce mois
                  </p>
                </div>
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Total Users -->
            <div class="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-green-200/50 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                 (click)="activeTab.set('users')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-green-600 mb-1">Total Utilisateurs</p>
                  <p class="text-4xl font-bold text-green-900">{{ stats().totalUsers }}</p>
                  <p class="text-xs text-green-500 mt-2 flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    {{ stats().usersGrowth >= 0 ? '+' : '' }}{{ stats().usersGrowth }}% ce mois
                  </p>
                </div>
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Active Subscriptions -->
            <div class="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200/50 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                 (click)="activeTab.set('subscriptions')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-purple-600 mb-1">Abonnements Actifs</p>
                  <p class="text-4xl font-bold text-purple-900">{{ stats().activeSubscriptions }}</p>
                  <p class="text-xs text-purple-500 mt-2 flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    {{ stats().subscriptionsGrowth >= 0 ? '+' : '' }}{{ stats().subscriptionsGrowth }}% ce mois
                  </p>
                </div>
                <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Total Revenue -->
            <div class="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-orange-200/50 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                 (click)="activeTab.set('analytics')">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-orange-600 mb-1">Revenus Totaux</p>
                  <p class="text-4xl font-bold text-orange-900">{{ stats().totalRevenue | currency:'MRU':'symbol':'1.0-0' }}</p>
                  <p class="text-xs text-orange-500 mt-2 flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    {{ stats().revenueGrowth >= 0 ? '+' : '' }}{{ stats().revenueGrowth }}% ce mois
                  </p>
                </div>
                <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">Actions Rapides</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button (click)="showAddCourseModal.set(true)" 
                      class="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">Ajouter un Cours</h4>
                <p class="text-sm text-gray-600">Créer un nouveau cours avec leçons</p>
              </button>

              <button (click)="showAddUserModal.set(true)"
                      class="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">Ajouter un Utilisateur</h4>
                <p class="text-sm text-gray-600">Créer un compte utilisateur</p>
              </button>

              <button (click)="showAddPlanModal.set(true)"
                      class="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">Gérer les Plans</h4>
                <p class="text-sm text-gray-600">Modifier les abonnements</p>
              </button>

              <button (click)="goToPaymentsManagement()"
                      class="group p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">Gérer les Paiements</h4>
                <p class="text-sm text-gray-600">Valider les paiements manuels</p>
              </button>

              <button (click)="activeTab.set('analytics')"
                      class="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">Voir les Statistiques</h4>
                <p class="text-sm text-gray-600">Analyses détaillées</p>
              </button>
            </div>
          </div>

          <!-- Charts and Analytics -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Revenue Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Revenus par Mois</h3>
              <div class="h-64 flex items-end space-x-2">
                <div *ngFor="let month of revenueData" class="flex-1 flex flex-col items-center">
                  <div class="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg mb-2" 
                       [style.height.px]="month.value * 2">
                  </div>
                  <span class="text-xs text-gray-500">{{ month.month }}</span>
                  <span class="text-xs font-medium text-gray-700">{{ month.value }}K</span>
                </div>
              </div>
            </div>

            <!-- User Growth Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Croissance des Utilisateurs</h3>
              <div class="h-64 flex items-end space-x-2">
                <div *ngFor="let week of userGrowthData" class="flex-1 flex flex-col items-center">
                  <div class="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg mb-2" 
                       [style.height.px]="week.value * 3">
                  </div>
                  <span class="text-xs text-gray-500">{{ week.month }}</span>
                  <span class="text-xs font-medium text-gray-700">{{ week.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-6">Activité Récente</h3>
            <div class="space-y-4">
              <div *ngFor="let activity of recentActivity" class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded-full mr-3" [class]="activity.color"></div>
                  <span class="text-sm text-gray-700">{{ activity.description }}</span>
                </div>
                <span class="text-xs text-gray-500">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>


        <!-- Content Management -->
        <div *ngIf="activeTab() === 'content'" class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-900">Gestion du Contenu</h2>
          
          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button class="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 text-left">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Ajouter un Cours</h3>
              <p class="text-gray-600 text-sm mt-2">Créer un nouveau cours avec leçons et exercices</p>
            </button>

            <button class="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 text-left">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Upload Vidéo</h3>
              <p class="text-gray-600 text-sm mt-2">Télécharger et organiser des vidéos de solutions</p>
            </button>

            <button class="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 text-left">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Gérer les PDFs</h3>
              <p class="text-gray-600 text-sm mt-2">Organiser les documents et exercices</p>
            </button>
          </div>
        </div>
      </div>

      <!-- Add Course Modal -->
      <div *ngIf="showAddCourseModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 my-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Ajouter un Cours</h3>
            <button (click)="showAddCourseModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="createCourse()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Titre du cours</label>
              <input type="text" [(ngModel)]="newCourse.title" name="title" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
              <textarea [(ngModel)]="newCourse.description" name="description"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3"></textarea>
            </div>
            
            <!-- Premium Notice -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm font-medium text-blue-800">
                  Ce cours sera créé en tant que contenu Premium (nécessite un abonnement)
                </span>
              </div>
            </div>
            <div class="flex space-x-3 pt-4">
              <button type="button" (click)="showAddCourseModal.set(false)" 
                      class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button type="submit" 
                      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Créer le Cours
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Course Modal -->
      <div *ngIf="showEditCourseModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 my-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Modifier le Cours</h3>
            <button (click)="showEditCourseModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="updateCourse()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Titre du cours</label>
              <input type="text" [(ngModel)]="editCourse.title" name="title" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
              <textarea [(ngModel)]="editCourse.description" name="description"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3"></textarea>
            </div>
            
            <div class="flex space-x-3 pt-4">
              <button type="button" (click)="showEditCourseModal.set(false)" 
                      class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button type="submit" 
                      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Modifier le Cours
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add User Modal -->
      <div *ngIf="showAddUserModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 my-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Ajouter un Utilisateur</h3>
            <button (click)="showAddUserModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="createUser()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input type="text" [(ngModel)]="newUser.firstName" name="firstName" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input type="text" [(ngModel)]="newUser.lastName" name="lastName" required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" [(ngModel)]="newUser.email" name="email" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input type="password" [(ngModel)]="newUser.password" name="password" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
              <select [(ngModel)]="newUser.role" name="role" required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="STUDENT">Étudiant</option>
                <option value="ADMIN">Administrateur</option>
                <option value="SUPERADMIN">Super Administrateur</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
              <input type="text" [(ngModel)]="newUser.semester" name="semester" placeholder="S1, S2, etc."
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div class="flex space-x-3 pt-4">
              <button type="button" (click)="showAddUserModal.set(false)" 
                      class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button type="submit" 
                      class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Créer l'Utilisateur
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Plan Modal -->
      <div *ngIf="showAddPlanModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 my-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Ajouter un Plan</h3>
            <button (click)="showAddPlanModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="createPlan()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom du plan</label>
              <input type="text" [(ngModel)]="newPlan.name" name="name" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Prix (MRU)</label>
              <input type="number" [(ngModel)]="newPlan.price" name="price" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select [(ngModel)]="newPlan.type" name="type" required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="VIDEOS_ONLY">Vidéos Seulement</option>
                <option value="DOCUMENTS_ONLY">Documents Seulement</option>
                <option value="FULL_ACCESS">Accès Complet</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea [(ngModel)]="newPlan.description" name="description" required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3"></textarea>
            </div>
            <div class="flex space-x-3 pt-4">
              <button type="button" (click)="showAddPlanModal.set(false)" 
                      class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button type="submit" 
                      class="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Créer le Plan
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Courses Management Section -->
      <div *ngIf="activeTab() === 'courses'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Gestion des Cours</h2>
              <p class="text-gray-600 mt-1">Créez et gérez tous les cours de la plateforme</p>
            </div>
            <button (click)="showAddCourseModal.set(true)" 
                    class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Nouveau Cours
            </button>
          </div>
        </div>

        <!-- Courses List -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leçons</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vues</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let course of courses()" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ course.title }}</div>
                        <div class="text-sm text-gray-500">{{ course.semester }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ course.lessonCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ course.views }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="bg-yellow-100 text-yellow-800 inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      Premium
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button (click)="editCourseItem(course)" 
                              class="text-blue-600 hover:text-blue-900 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button (click)="deleteCourse(course.id)" 
                              class="text-red-600 hover:text-red-900 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Lessons Management Section -->
      <div *ngIf="activeTab() === 'lessons'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Gestion des Leçons</h2>
              <p class="text-gray-600 mt-1">Créez et gérez toutes les leçons ({{ lessons().length }} leçons)</p>
            </div>
            <button (click)="showAddLessonModal.set(true)" 
                    class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Nouvelle Leçon
            </button>
          </div>
        </div>

        <!-- Lessons List -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leçon</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngIf="lessons().length === 0" class="text-center py-8">
                  <td colspan="6" class="text-gray-500">
                    Aucune leçon trouvée
                  </td>
                </tr>
                <tr *ngFor="let lesson of lessons(); trackBy: trackByLessonId" 
                    class="hover:bg-gray-50 transition-colors cursor-pointer"
                    (click)="goToLessonVideoUpload(lesson.id)">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ lesson.title }}</div>
                        <div class="text-sm text-gray-500">Ordre: {{ lesson.orderIndex }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="lesson.type === 'VIDEO' ? 'bg-blue-100 text-blue-800' : lesson.type === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'" 
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      {{ lesson.type }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDuration(lesson.durationSec) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ getCourseTitle(lesson.courseId) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="bg-yellow-100 text-yellow-800 inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      Premium
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button (click)="editLessonItem(lesson)" 
                              class="text-blue-600 hover:text-blue-900 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button (click)="deleteLesson(lesson.id)" 
                              class="text-red-600 hover:text-red-900 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Users Management Section -->
      <div *ngIf="activeTab() === 'users'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
              <p class="text-gray-600 mt-1">Gérez tous les utilisateurs de la plateforme</p>
            </div>
            <button (click)="showAddUserModal.set(true)" 
                    class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Nouvel Utilisateur
            </button>
          </div>
        </div>

        <!-- Users List -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscription</th>
                  <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let user of users()" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <span class="text-white font-bold text-sm">{{ user.name.charAt(0) }}</span>
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                        <div class="text-sm text-gray-500">{{ user.semester || 'N/A' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.email }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="(user.role === 'admin' || user.role === 'superadmin' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'" 
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      {{ user.role | titlecase }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.createdAt | date:'short' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button (click)="editUserItem(user)" 
                              class="text-blue-600 hover:text-blue-900 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button (click)="deleteUser(user.id)" 
                              class="text-red-600 hover:text-red-900 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Subscriptions Management Section -->
      <div *ngIf="activeTab() === 'subscriptions'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Gestion des Abonnements</h2>
              <p class="text-gray-600 mt-1">Gérez les plans d'abonnement et les souscriptions</p>
            </div>
            <button (click)="showAddPlanModal.set(true)" 
                    class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Ajouter un Plan
            </button>
          </div>
        </div>

        <!-- Debug Info -->
        <div class="mb-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">Debug: {{ subscriptionPlans().length }} plans loaded</p>
          <p class="text-sm text-blue-600">API URL: {{ API_URL }}/subscriptions/plans</p>
        </div>

        <!-- Loading State -->
        <div *ngIf="subscriptionPlans().length === 0" class="text-center py-8">
          <div class="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement des plans d'abonnement...
          </div>
        </div>

        <!-- Subscription Plans Grid -->
        <div *ngIf="subscriptionPlans().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let plan of subscriptionPlans()" 
               class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <div class="flex space-x-2">
                <button (click)="editPlanItem(plan)" 
                        class="text-blue-600 hover:text-blue-900 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="deletePlan(plan.id)" 
                        class="text-red-600 hover:text-red-900 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ plan.name || 'No Name' }}</h3>
            <div class="text-2xl font-bold text-gray-900 mb-2">{{ plan.priceCents ? (plan.priceCents / 100) : 'No Price' }} {{ plan.currency || 'No Currency' }}</div>
            <div class="text-sm text-gray-600 mb-4">{{ plan.description || 'No Description' }}</div>
            <div class="flex justify-between text-sm text-gray-600">
              <span>yearly</span>
              <span class="text-green-600">Actif</span>
            </div>
            <!-- Debug Info -->
            <div class="mt-2 p-2 bg-gray-100 rounded text-xs">
              <div>ID: {{ plan.id }}</div>
              <div>Name: {{ plan.name }}</div>
              <div>Price: {{ plan.priceCents }}</div>
              <div>Currency: {{ plan.currency }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Lesson Modal -->
      <div *ngIf="showAddLessonModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 transform transition-all duration-300 my-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Nouvelle Leçon</h3>
            <button (click)="showAddLessonModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="createLesson()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Titre de la leçon</label>
                <input type="text" [(ngModel)]="newLesson.title" name="title"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select [(ngModel)]="newLesson.type" name="type"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="VIDEO">Vidéo</option>
                  <option value="PDF">PDF</option>
                  <option value="EXAM">Examen</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Cours</label>
                <select [(ngModel)]="newLesson.courseId" name="courseId"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Sélectionner un cours</option>
                  <option *ngFor="let course of courses()" [value]="course.id">{{ course.title }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Durée (secondes)</label>
                <input type="number" [(ngModel)]="newLesson.durationSec" name="durationSec"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              </div>
            </div>
            
            <!-- Premium Notice -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm font-medium text-green-800">
                  Cette leçon sera créée en tant que contenu Premium (nécessite un abonnement)
                </span>
              </div>
            </div>
            <div class="flex space-x-3 pt-4">
              <button type="button" (click)="showAddLessonModal.set(false)" 
                      class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button type="submit" (click)="onSubmitClick()"
                      class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Créer la Leçon
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div *ngIf="showEditUserModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 my-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Modifier l'Utilisateur</h3>
            <button (click)="showEditUserModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="updateUser()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input type="text" [(ngModel)]="editUser.firstName" name="firstName" required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input type="text" [(ngModel)]="editUser.lastName" name="lastName" required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" [(ngModel)]="editUser.email" name="email" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
              <select [(ngModel)]="editUser.role" name="role" required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="STUDENT">Étudiant</option>
                <option value="ADMIN">Administrateur</option>
                <option value="SUPERADMIN">Super Administrateur</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
              <input type="text" [(ngModel)]="editUser.semester" name="semester" placeholder="S1, S2, etc."
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div class="flex space-x-3 pt-4">
              <button type="button" (click)="showEditUserModal.set(false)" 
                      class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button type="submit" 
                      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Analytics Section -->
      <div *ngIf="activeTab() === 'analytics'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Analytiques</h2>
              <p class="text-gray-600 mt-1">Statistiques détaillées et analyses de performance</p>
            </div>
            <div class="flex space-x-3">
              <button class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Exporter
              </button>
              <button (click)="loadData()" class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <!-- Advanced Business Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-600 mb-1">ARPU (Revenu par Utilisateur)</p>
                <p class="text-3xl font-bold text-blue-900">{{ analytics().arpu | currency:'MRU':'symbol':'1.0-2' }}</p>
                <p class="text-xs text-blue-500 mt-2">{{ analytics().arpuGrowth >= 0 ? '+' : '' }}{{ analytics().arpuGrowth }}% ce mois</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-600 mb-1">Taux de Rétention</p>
                <p class="text-3xl font-bold text-green-900">{{ analytics().retentionRate }}%</p>
                <p class="text-xs text-green-500 mt-2">{{ analytics().retentionGrowth >= 0 ? '+' : '' }}{{ analytics().retentionGrowth }}% ce mois</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-purple-600 mb-1">LTV (Valeur Vie Client)</p>
                <p class="text-3xl font-bold text-purple-900">{{ analytics().ltv | currency:'MRU':'symbol':'1.0-2' }}</p>
                <p class="text-xs text-purple-500 mt-2">{{ analytics().ltvGrowth >= 0 ? '+' : '' }}{{ analytics().ltvGrowth }}% ce mois</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-orange-600 mb-1">Engagement Moyen</p>
                <p class="text-3xl font-bold text-orange-900">{{ analytics().avgEngagementHours | number:'1.0-1' }}h</p>
                <p class="text-xs text-orange-500 mt-2">{{ analytics().engagementGrowth >= 0 ? '+' : '' }}{{ analytics().engagementGrowth }}% ce mois</p>
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Advanced Analytics Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Conversion Funnel -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Entonnoir de Conversion</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <span class="text-sm text-gray-700">Visiteurs</span>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold text-gray-900">{{ analytics().conversionFunnel.visitors }}</span>
                  <span class="text-xs text-gray-500 ml-2">100%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-sm font-medium text-green-600">2</span>
                  </div>
                  <span class="text-sm text-gray-700">Inscriptions</span>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold text-gray-900">{{ analytics().conversionFunnel.visitors }}</span>
                  <span class="text-xs text-gray-500 ml-2">{{ analytics().conversionFunnel.visitors > 0 ? (100).toFixed(1) : '0' }}%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-sm font-medium text-purple-600">3</span>
                  </div>
                  <span class="text-sm text-gray-700">Abonnements</span>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold text-gray-900">{{ analytics().conversionFunnel.paid }}</span>
                  <span class="text-xs text-gray-500 ml-2">{{ analytics().conversionFunnel.visitors > 0 ? ((analytics().conversionFunnel.paid / analytics().conversionFunnel.visitors) * 100).toFixed(1) : '0' }}%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-sm font-medium text-orange-600">4</span>
                  </div>
                  <span class="text-sm text-gray-700">Clients Actifs</span>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold text-gray-900">{{ analytics().conversionFunnel.activeSubscribers }}</span>
                  <span class="text-xs text-gray-500 ml-2">{{ analytics().conversionFunnel.visitors > 0 ? ((analytics().conversionFunnel.activeSubscribers / analytics().conversionFunnel.visitors) * 100).toFixed(1) : '0' }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cohort Analysis -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Analyse de Cohort</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Cohort Jan 2025</span>
                <div class="flex space-x-2">
                  <div class="w-6 h-6 bg-green-500 rounded text-xs text-white flex items-center justify-center">100%</div>
                  <div class="w-6 h-6 bg-green-400 rounded text-xs text-white flex items-center justify-center">87%</div>
                  <div class="w-6 h-6 bg-green-300 rounded text-xs text-white flex items-center justify-center">72%</div>
                  <div class="w-6 h-6 bg-yellow-300 rounded text-xs text-white flex items-center justify-center">58%</div>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Cohort Fév 2025</span>
                <div class="flex space-x-2">
                  <div class="w-6 h-6 bg-green-500 rounded text-xs text-white flex items-center justify-center">100%</div>
                  <div class="w-6 h-6 bg-green-400 rounded text-xs text-white flex items-center justify-center">91%</div>
                  <div class="w-6 h-6 bg-green-300 rounded text-xs text-white flex items-center justify-center">78%</div>
                  <div class="w-6 h-6 bg-green-200 rounded text-xs text-white flex items-center justify-center">65%</div>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Cohort Mar 2025</span>
                <div class="flex space-x-2">
                  <div class="w-6 h-6 bg-green-500 rounded text-xs text-white flex items-center justify-center">100%</div>
                  <div class="w-6 h-6 bg-green-400 rounded text-xs text-white flex items-center justify-center">89%</div>
                  <div class="w-6 h-6 bg-green-300 rounded text-xs text-white flex items-center justify-center">75%</div>
                  <div class="w-6 h-6 bg-green-200 rounded text-xs text-white flex items-center justify-center">62%</div>
                </div>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                <span class="mr-4">Mois 1</span>
                <span class="mr-4">Mois 2</span>
                <span class="mr-4">Mois 3</span>
                <span>Mois 4</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Business Intelligence Analytics -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Revenue Analysis -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Analyse des Revenus</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">MRR (Revenus Récurrents Mensuels)</span>
                <span class="text-sm font-medium text-green-600">15,420 MRU</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">ARR (Revenus Récurrents Annuels)</span>
                <span class="text-sm font-medium text-blue-600">185,040 MRU</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Taux de Croissance MoM</span>
                <span class="text-sm font-medium text-purple-600">+12.3%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Prédiction 6 mois</span>
                <span class="text-sm font-medium text-orange-600">245,000 MRU</span>
              </div>
            </div>
          </div>

          <!-- Customer Segmentation -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Segmentation Client</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span class="text-sm text-gray-600">Clients Premium</span>
                </div>
                <span class="text-sm font-medium text-gray-900">45 (23%)</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span class="text-sm text-gray-600">Clients Standard</span>
                </div>
                <span class="text-sm font-medium text-gray-900">78 (40%)</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span class="text-sm text-gray-600">Clients Basiques</span>
                </div>
                <span class="text-sm font-medium text-gray-900">72 (37%)</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span class="text-sm text-gray-600">À Risque de Churn</span>
                </div>
                <span class="text-sm font-medium text-red-600">12 (6%)</span>
              </div>
            </div>
          </div>

          <!-- Performance KPIs -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">KPIs de Performance</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">NPS Score</span>
                <span class="text-sm font-medium text-green-600">+42</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">CSAT Score</span>
                <span class="text-sm font-medium text-blue-600">4.7/5</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Temps de Résolution</span>
                <span class="text-sm font-medium text-purple-600">2.3h</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Satisfaction Support</span>
                <span class="text-sm font-medium text-orange-600">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Plan Modal -->
      <div *ngIf="showEditPlanModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 my-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Modifier le Plan</h3>
            <button (click)="showEditPlanModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="updatePlan()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom du plan</label>
              <input type="text" [(ngModel)]="editPlan.name" name="name" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Prix (MRU)</label>
              <input type="number" [(ngModel)]="editPlanPrice" name="editPlanPrice" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select [(ngModel)]="editPlan.type" name="type" required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="VIDEOS_ONLY">Vidéos Seulement</option>
                <option value="DOCUMENTS_ONLY">Documents Seulement</option>
                <option value="FULL_ACCESS">Accès Complet</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea [(ngModel)]="editPlan.description" name="description" required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3"></textarea>
            </div>
            <div class="flex space-x-3 pt-4">
              <button type="button" (click)="showEditPlanModal.set(false)" 
                      class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button type="submit" 
                      class="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class AdminEnhancedComponent implements OnInit, OnDestroy {
  readonly API_URL = 'http://localhost:3000/api';

  // Signals
  activeTab = signal('overview');
  courses = signal<Course[]>([]);
  lessons = signal<Lesson[]>([]);
  users = signal<User[]>([]);
  subscriptions = signal<Subscription[]>([]);
  subscriptionPlans = signal<SubscriptionPlan[]>([]);
  userStats = signal<UserStats | null>(null);
  stats = signal({
    totalCourses: 0,
    totalUsers: 0,
    totalLessons: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    userGrowth: 0,
    courseViews: 0,
    coursesGrowth: 0,
    usersGrowth: 0,
    subscriptionsGrowth: 0,
    revenueGrowth: 0
  });

  analytics = signal({
    arpu: 0,
    arpuGrowth: 0,
    retentionRate: 0,
    retentionGrowth: 0,
    ltv: 0,
    ltvGrowth: 0,
    avgEngagementHours: 0,
    engagementGrowth: 0,
    conversionFunnel: {
      visitors: 0,
      trials: 0,
      paid: 0,
      activeSubscribers: 0
    }
  });

  // Modal states
  showAddPlanModal = signal(false);
  showAddCourseModal = signal(false);
  showAddUserModal = signal(false);
  showAddLessonModal = signal(false);
  showEditCourseModal = signal(false);
  showEditLessonModal = signal(false);
  showEditUserModal = signal(false);
  showEditPlanModal = signal(false);

  // Form data
  newCourse = {
    title: '',
    description: '',
    semester: 'S1',
    isPremium: true
  };

  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'ADMIN' | 'SUPERADMIN',
    semester: ''
  };

  newPlan = {
    name: '',
    price: 0,
    type: 'VIDEOS_ONLY' as 'VIDEOS_ONLY' | 'DOCUMENTS_ONLY' | 'FULL_ACCESS',
    description: ''
  };

  newLesson = {
    title: '',
    type: 'VIDEO' as 'VIDEO' | 'PDF' | 'EXAM',
    courseId: '',
    durationSec: 0,
    vimeoId: '',
    youtubeId: '',
    pdfUrl: '',
    isPremium: true, // ✅ Premium by default
    requiresVideoSubscription: false,
    requiresDocumentSubscription: false,
    orderIndex: 0
  };

  // Edit form data
  editCourse = {
    id: '',
    title: '',
    description: '',
    semester: 'S1',
    isPremium: false
  };

  editUser = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'STUDENT' as 'STUDENT' | 'ADMIN' | 'SUPERADMIN',
    semester: ''
  };

  editPlan = {
    id: '',
    name: '',
    description: '',
    priceCents: 0,
    currency: 'MRU',
    type: 'VIDEOS_ONLY' as 'VIDEOS_ONLY' | 'DOCUMENTS_ONLY' | 'FULL_ACCESS',
    features: '',
    isActive: true
  };
  editPlanPrice = 0; // Price in MRU for display

  editLesson = {
    id: '',
    title: '',
    type: 'VIDEO' as 'VIDEO' | 'PDF' | 'EXAM',
    courseId: '',
    durationSec: 0,
    vimeoId: '',
    youtubeId: '',
    pdfUrl: '',
    isPremium: false,
    requiresVideoSubscription: false,
    requiresDocumentSubscription: false,
    orderIndex: 0
  };


  tabs = [
    { id: 'overview', name: 'Vue d\'ensemble' },
    { id: 'courses', name: 'Cours' },
    { id: 'lessons', name: 'Leçons' },
    { id: 'users', name: 'Utilisateurs' },
    { id: 'subscriptions', name: 'Abonnements' },
    { id: 'analytics', name: 'Analytiques' }
  ];

  // Mock data for charts
  revenueData = [
    { month: 'Jan', value: 45 },
    { month: 'Fév', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Avr', value: 61 },
    { month: 'Mai', value: 55 },
    { month: 'Juin', value: 67 }
  ];

  userGrowthData = [
    { month: 'Jan', value: 12 },
    { month: 'Fév', value: 18 },
    { month: 'Mar', value: 25 },
    { month: 'Avr', value: 32 },
    { month: 'Mai', value: 28 },
    { month: 'Juin', value: 35 }
  ];

  recentActivity = [
    { description: 'Nouvel utilisateur inscrit', time: 'Il y a 2 heures', color: 'bg-green-400' },
    { description: 'Nouvelle leçon ajoutée', time: 'Il y a 4 heures', color: 'bg-blue-400' },
    { description: 'Nouvel abonnement activé', time: 'Il y a 6 heures', color: 'bg-purple-400' },
    { description: 'Cours mis à jour', time: 'Il y a 8 heures', color: 'bg-orange-400' }
  ];


  constructor(
    private http: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
    
    // Check for URL hash to set active tab
    const hash = window.location.hash.substring(1);
    if (hash && this.tabs.some(tab => tab.id === hash)) {
      this.activeTab.set(hash);
    }
  }

  ngOnDestroy() {
    // Clean up any timeouts or intervals if needed
  }


  loadData() {
    // Load dashboard statistics from new API endpoint
    this.http.get<any>(`${this.API_URL}/admin/dashboard-stats`).subscribe({
      next: (data) => {
        console.log('📊 Dashboard stats loaded:', data);
        this.stats.set({
          totalCourses: data.totalCourses || 0,
          totalUsers: data.totalUsers || 0,
          totalLessons: 0, // Not needed in new endpoint
          activeSubscriptions: data.activeSubscriptions || 0,
          totalRevenue: data.totalRevenueMRU || 0,
          monthlyRevenue: 0, // Not needed yet
          userGrowth: 0, // Not needed yet
          courseViews: 0, // Not needed yet
          coursesGrowth: data.growth?.courses || 0,
          usersGrowth: data.growth?.users || 0,
          subscriptionsGrowth: data.growth?.subscriptions || 0,
          revenueGrowth: data.growth?.revenue || 0
        });

        // Load analytics data
        if (data.analytics) {
          console.log('📈 Analytics data loaded:', data.analytics);
          this.analytics.set({
            arpu: data.analytics.arpu || 0,
            arpuGrowth: data.analytics.arpuGrowth || 0,
            retentionRate: data.analytics.retentionRate || 0,
            retentionGrowth: data.analytics.retentionGrowth || 0,
            ltv: data.analytics.ltv || 0,
            ltvGrowth: data.analytics.ltvGrowth || 0,
            avgEngagementHours: data.analytics.avgEngagementHours || 0,
            engagementGrowth: data.analytics.engagementGrowth || 0,
            conversionFunnel: {
              visitors: data.analytics.conversionFunnel?.visitors || 0,
              trials: data.analytics.conversionFunnel?.trials || 0,
              paid: data.analytics.conversionFunnel?.paid || 0,
              activeSubscribers: data.analytics.conversionFunnel?.activeSubscribers || 0
            }
          });
        }
      },
      error: (error) => console.error('❌ Error loading dashboard stats:', error)
    });

    // Load courses (admin needs to see all courses, not just premium)
    this.http.get<any>(`${this.API_URL}/courses?isPremium=true`).subscribe({
      next: (response) => this.courses.set(response.courses || []),
      error: (error) => console.error('Error loading courses:', error)
    });

    // Load lessons (admin needs to see all lessons, not just premium)
    this.http.get<any>(`${this.API_URL}/lessons?isPremium=true`).subscribe({
      next: (response) => {
        console.log('📥 Lessons response:', response);
        this.lessons.set(response.lessons || []);
        console.log('📥 Lessons loaded:', this.lessons().length);
      },
      error: (error) => console.error('Error loading lessons:', error)
    });

    // Load users
    this.http.get<User[]>(`${this.API_URL}/admin/users`).subscribe({
      next: (data) => this.users.set(data),
      error: (error) => console.error('Error loading users:', error)
    });

    // Load user statistics
    this.http.get<any>(`${this.API_URL}/users/stats/overview`).subscribe({
      next: (data) => {
        this.userStats.set(data);
        console.log('User stats loaded:', data);
      },
      error: (error) => console.error('Error loading user stats:', error)
    });

    // Load subscriptions
    this.http.get<Subscription[]>(`${this.API_URL}/subscriptions`).subscribe({
      next: (data) => this.subscriptions.set(data),
      error: (error) => console.error('Error loading subscriptions:', error)
    });

    // Load subscription plans
    this.http.get<any>(`${this.API_URL}/subscriptions/plans`).subscribe({
      next: (response) => {
        console.log('📋 Subscription plans response:', response);
        const plans = response.plans || response;
        console.log('📋 Plans to set:', plans);
        console.log('📋 Plans count:', plans?.length || 0);
        this.subscriptionPlans.set(plans || []);
      },
      error: (error) => {
        console.error('❌ Error loading subscription plans:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        this.subscriptionPlans.set([]);
      }
    });


    // Update stats
    this.updateStats();
  }

  updateStats() {
    const userStatsData = this.userStats();
    const currentStats = {
      totalCourses: this.courses().length,
      totalUsers: userStatsData?.totalUsers || this.users().length,
      totalLessons: this.lessons().length,
      activeSubscriptions: this.subscriptions().filter(s => s.status === 'active').length,
      totalRevenue: this.subscriptions().reduce((sum, s) => sum + (s.plan.priceCents / 100), 0),
      monthlyRevenue: 0,
      userGrowth: userStatsData?.recentUsers || 0,
      courseViews: this.courses().reduce((sum, c) => sum + (c.views || 0), 0),
      coursesGrowth: 0,
      usersGrowth: 0,
      subscriptionsGrowth: 0,
      revenueGrowth: 0
    };
    this.stats.set(currentStats);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToPaymentsManagement(): void {
    this.router.navigate(['/admin/payments']);
  }

  // Form submission methods
  async createCourse() {
    try {
      const response = await this.http.post(`${this.API_URL}/courses`, this.newCourse).toPromise();
      console.log('Course created:', response);
      this.showAddCourseModal.set(false);
      this.resetCourseForm();
      this.loadData(); // Reload data
    } catch (error) {
      console.error('Error creating course:', error);
    }
  }

  async createUser() {
    console.log('Creating user with data:', this.newUser);
    console.log('Current user:', this.authService.user());
    console.log('API URL:', this.API_URL);
    
    try {
      const userData = {
        firstName: this.newUser.firstName,
        lastName: this.newUser.lastName,
        email: this.newUser.email,
        password: this.newUser.password,
        role: this.newUser.role,
        semester: this.newUser.semester
      };
      console.log('Sending user data:', userData);
      const response = await this.http.post(`${this.API_URL}/admin/create-user`, userData).toPromise();
      console.log('User created:', response);
      this.showAddUserModal.set(false);
      this.resetUserForm();
      this.loadData(); // Reload data
    } catch (error: any) {
      console.error('Error creating user:', error);
      console.error('Full error object:', error);
      alert('Erreur lors de la création de l\'utilisateur: ' + (error.error?.message || error.message || 'Erreur inconnue'));
    }
  }

  async createPlan() {
    try {
      const planData = {
        ...this.newPlan,
        priceCents: this.newPlan.price * 100,
        interval: 'yearly', // ✅ Fixed: Backend only accepts 'yearly'
        currency: 'MRU',
        features: []
      };
      const response = await this.http.post(`${this.API_URL}/subscriptions/plans`, planData).toPromise();
      console.log('Plan created:', response);
      this.showAddPlanModal.set(false);
      this.resetPlanForm();
      this.loadData(); // Reload data
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  }

  // Reset form methods
  resetCourseForm() {
    this.newCourse = {
      title: '',
      description: '',
      semester: 'S1',
      isPremium: true
    };
  }

  resetUserForm() {
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'STUDENT',
      semester: ''
    };
  }

  resetPlanForm() {
    this.newPlan = {
      name: '',
      price: 0,
      type: 'VIDEOS_ONLY',
      description: ''
    };
  }

  // Helper methods
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  getCourseTitle(courseId: string): string {
    const course = this.courses().find(c => c.id === courseId);
    return course ? course.title : 'Cours inconnu';
  }

  // CRUD Operations for Courses
  editCourseItem(course: Course) {
    this.editCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      semester: course.semester,
      isPremium: course.isPremium
    };
    this.showEditCourseModal.set(true);
  }

  async updateCourse() {
    try {
      const response = await this.http.put(`${this.API_URL}/courses/${this.editCourse.id}`, this.editCourse).toPromise();
      console.log('Course updated:', response);
      this.showEditCourseModal.set(false);
      this.resetEditCourseForm();
      this.loadData();
    } catch (error) {
      console.error('Error updating course:', error);
    }
  }

  async deleteCourse(courseId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await this.http.delete(`${this.API_URL}/courses/${courseId}`).toPromise();
        console.log('Course deleted');
        this.loadData();
      } catch (error: any) {
        console.error('Error deleting course:', error);
        
        // Handle specific error cases
        if (error.error?.error?.code === 'CONSTRAINT_ERROR') {
          const forceDelete = confirm(
            'Ce cours a des données associées (leçons, commentaires, etc.).\n\n' +
            'Voulez-vous forcer la suppression en supprimant toutes les données associées ?\n\n' +
            '⚠️ ATTENTION: Cette action est irréversible !'
          );
          
          if (forceDelete) {
            try {
              await this.http.delete(`${this.API_URL}/courses/${courseId}?force=true`).toPromise();
              console.log('Course force deleted');
              this.loadData();
            } catch (forceError: any) {
              console.error('Error force deleting course:', forceError);
              alert('Erreur lors de la suppression forcée. Veuillez réessayer.');
            }
          }
        } else if (error.error?.error?.code === 'NOT_FOUND') {
          alert('Cours non trouvé.');
        } else {
          alert('Erreur lors de la suppression du cours: ' + (error.error?.message || error.message || 'Erreur inconnue'));
        }
      }
    }
  }

  // Helper method for debugging
  onSubmitClick() {
    console.log('Submit button clicked');
  }

  trackByLessonId(index: number, lesson: Lesson): string {
    return lesson.id;
  }

  // CRUD Operations for Lessons
  async createLesson() {
    // Check if required fields are filled
    if (!this.newLesson.title) {
      alert('Veuillez saisir un titre pour la leçon');
      return;
    }
    if (!this.newLesson.courseId) {
      alert('Veuillez sélectionner un cours');
      return;
    }
    if (!this.newLesson.type) {
      alert('Veuillez sélectionner un type de leçon');
      return;
    }
    
    try {
      // Clean up the data before sending
      const lessonData = {
        title: this.newLesson.title,
        courseId: this.newLesson.courseId,
        type: this.newLesson.type,
        durationSec: this.newLesson.durationSec || 0,
        vimeoId: this.newLesson.vimeoId || undefined,
        youtubeId: this.newLesson.youtubeId || undefined,
        pdfUrl: this.newLesson.pdfUrl || undefined,
        isPremium: this.newLesson.isPremium || false,
        requiresVideoSubscription: this.newLesson.requiresVideoSubscription || false,
        requiresDocumentSubscription: this.newLesson.requiresDocumentSubscription || false,
        orderIndex: this.newLesson.orderIndex || 0
      };
      
      const response = await this.http.post(`${this.API_URL}/lessons`, lessonData).toPromise();
      
      // Close modal and reset form
      this.showAddLessonModal.set(false);
      this.resetLessonForm();
      
      // Reload data
      this.loadData();
      
      // Show success message
      alert('Leçon créée avec succès!');
      
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      alert('Erreur lors de la création de la leçon: ' + (error.error?.message || error.message || 'Erreur inconnue'));
    }
  }


  editUserItem(user: User) {
    const nameParts = user.name.split(' ');
    this.editUser = { 
      id: user.id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user.email,
      role: user.role.toUpperCase() as 'STUDENT' | 'ADMIN' | 'SUPERADMIN',
      semester: user.semester?.toString() || ''
    };
    this.showEditUserModal.set(true);
  }

  async updateUser() {
    try {
      const userData = {
        firstName: this.editUser.firstName,
        lastName: this.editUser.lastName,
        email: this.editUser.email,
        role: this.editUser.role,
        semester: this.editUser.semester
      };
      const response = await this.http.put(`${this.API_URL}/admin/users/${this.editUser.id}`, userData).toPromise();
      console.log('User updated:', response);
      this.showEditUserModal.set(false);
      this.resetEditUserForm();
      this.loadData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  async deleteUser(userId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await this.http.delete(`${this.API_URL}/admin/users/${userId}`).toPromise();
        console.log('User deleted');
        this.loadData();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        
        // Handle specific error cases
        if (error.error?.error?.code === 'CONSTRAINT_ERROR') {
          const forceDelete = confirm(
            'Cet utilisateur a des données associées (abonnements, commentaires, etc.).\n\n' +
            'Voulez-vous forcer la suppression en supprimant toutes les données associées ?\n\n' +
            '⚠️ ATTENTION: Cette action est irréversible !'
          );
          
          if (forceDelete) {
            try {
              await this.http.delete(`${this.API_URL}/admin/users/${userId}?force=true`).toPromise();
              console.log('User force deleted');
      this.loadData();
            } catch (forceError: any) {
              console.error('Error force deleting user:', forceError);
              alert('Erreur lors de la suppression forcée. Veuillez réessayer.');
            }
          }
        } else if (error.error?.error?.code === 'NOT_FOUND') {
          alert('Utilisateur non trouvé.');
        } else if (error.error?.error?.code === 'BAD_REQUEST') {
          alert('Impossible de supprimer ce type de compte.');
        } else {
          alert('Erreur lors de la suppression. Veuillez réessayer.');
        }
      }
    }
  }


  editPlanItem(plan: SubscriptionPlan) {
    this.editPlan = { ...plan };
    this.editPlanPrice = plan.priceCents / 100; // Convert cents to MRU for display
    this.showEditPlanModal.set(true);
  }

  async updatePlan() {
    try {
      // Convert MRU price back to cents before sending to backend
      const planData = {
        ...this.editPlan,
        priceCents: this.editPlanPrice * 100
      };
      
      const response = await this.http.put(`${this.API_URL}/subscriptions/plans/${this.editPlan.id}`, planData).toPromise();
      console.log('Plan updated:', response);
      this.showEditPlanModal.set(false);
      this.resetEditPlanForm();
      this.loadData();
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  }

  async deletePlan(planId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      try {
        console.log('🗑️ Attempting to delete plan:', planId);
        await this.http.delete(`${this.API_URL}/subscriptions/plans/${planId}`).toPromise();
        console.log('✅ Plan deleted successfully');
        this.loadData();
      } catch (error: any) {
        console.error('❌ Error deleting plan:', error);
        console.error('❌ Error details:', error.error);
        console.error('❌ Error status:', error.status);
        
        // Show user-friendly error message
        if (error.status === 400 && error.error?.code === 'PLAN_IN_USE') {
          alert('Impossible de supprimer ce plan car il a des abonnements actifs. Veuillez d\'abord annuler tous les abonnements.');
        } else if (error.status === 404) {
          alert('Plan non trouvé.');
        } else if (error.status === 403) {
          alert('Erreur: Vous n\'avez pas les permissions pour supprimer ce plan.');
        } else {
          alert('Erreur serveur lors de la suppression du plan. Veuillez réessayer.');
        }
      }
    }
  }

  editLessonItem(lesson: Lesson) {
    this.editLesson = { 
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      courseId: lesson.courseId,
      durationSec: lesson.durationSec,
      vimeoId: lesson.vimeoId || '',
      youtubeId: lesson.youtubeId || '',
      pdfUrl: lesson.pdfUrl || '',
      isPremium: lesson.isPremium,
      requiresVideoSubscription: lesson.requiresVideoSubscription || false,
      requiresDocumentSubscription: lesson.requiresDocumentSubscription || false,
      orderIndex: lesson.orderIndex
    };
    this.showEditLessonModal.set(true);
  }

  async updateLesson() {
    try {
      const response = await this.http.put(`${this.API_URL}/lessons/${this.editLesson.id}`, this.editLesson).toPromise();
      console.log('Lesson updated:', response);
      this.showEditLessonModal.set(false);
      this.resetEditLessonForm();
      this.loadData();
    } catch (error) {
      console.error('Error updating lesson:', error);
    }
  }

  async deleteLesson(lessonId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) {
      try {
        console.log('🗑️ Attempting to delete lesson:', lessonId);
        console.log('🔐 User role:', this.authService.user()?.role);
        console.log('🔐 Is authenticated:', this.authService.isAuthenticated());
        
        await this.http.delete(`${this.API_URL}/lessons/${lessonId}`).toPromise();
        console.log('✅ Lesson deleted successfully');
        this.loadData();
      } catch (error: any) {
        console.error('❌ Error deleting lesson:', error);
        console.error('❌ Error details:', error.error);
        console.error('❌ Error status:', error.status);
        
        // Show user-friendly error message
        if (error.status === 403) {
          alert('Erreur: Vous n\'avez pas les permissions pour supprimer cette leçon.');
        } else if (error.status === 401) {
          alert('Erreur: Vous devez être connecté pour supprimer une leçon.');
        } else {
          alert('Erreur serveur lors de la suppression de la leçon. Veuillez réessayer.');
        }
      }
    }
  }


  // Reset form methods
  resetLessonForm() {
    this.newLesson = {
      title: '',
      type: 'VIDEO',
      courseId: '',
      durationSec: 0,
      vimeoId: '',
      youtubeId: '',
      pdfUrl: '',
      isPremium: true, // ✅ Premium by default
      requiresVideoSubscription: false,
      requiresDocumentSubscription: false,
      orderIndex: 0
    };
  }


  resetEditCourseForm() {
    this.editCourse = {
      id: '',
      title: '',
      description: '',
      semester: 'S1',
      isPremium: true // ✅ Premium by default
    };
  }

  resetEditLessonForm() {
    this.editLesson = {
      id: '',
      title: '',
      type: 'VIDEO',
      courseId: '',
      durationSec: 0,
      vimeoId: '',
      youtubeId: '',
      pdfUrl: '',
      isPremium: true, // ✅ Premium by default
      requiresVideoSubscription: false,
      requiresDocumentSubscription: false,
      orderIndex: 0
    };
  }

  resetEditUserForm() {
    this.editUser = {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      role: 'STUDENT',
      semester: ''
    };
  }

  resetEditPlanForm() {
    this.editPlan = {
      id: '',
      name: '',
      description: '',
      priceCents: 0,
      currency: 'MRU',
      type: 'VIDEOS_ONLY',
      features: '',
      isActive: true
    };
    this.editPlanPrice = 0;
  }


      // Navigate to lesson video upload
      goToLessonVideoUpload(lessonId: string) {
        this.router.navigate(['/admin/lesson', lessonId, 'video']);
      }

  // Handle tab clicks with data refresh for analytics
  onTabClick(tabId: string) {
    this.activeTab.set(tabId);
    
    // Refresh data when analytics tab is activated
    if (tabId === 'analytics') {
      console.log('📊 Analytics tab activated - refreshing data...');
      this.loadData();
    }
  }

}
