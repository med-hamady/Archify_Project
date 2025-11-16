import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService } from '../../services/subscription.service';
import { environment } from '../../../environments/environment';


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

      <!-- QCM Management Section -->
      <div *ngIf="activeTab() === 'qcm'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Gestion des QCM</h2>
            <p class="text-gray-600 mt-1">Modifiez les questions, options et justifications</p>
          </div>
        </div>

        <!-- Selection Interface -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Level/Semester Selection -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Niveau</label>
            <select [(ngModel)]="selectedQcmSemester"
                    (change)="onQcmSemesterChange()"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option value="">Sélectionner un niveau</option>
              <option value="PCEM1">PCEM1</option>
              <option value="PCEM2">PCEM2</option>
              <option value="DCEM1">DCEM1</option>
              <option value="DCEM2">DCEM2</option>
              <option value="DCEM3">DCEM3</option>
              <option value="DCEM4">DCEM4</option>
            </select>
          </div>

          <!-- Subject Selection -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Matière</label>
            <select [(ngModel)]="selectedQcmSubject"
                    (change)="onQcmSubjectChange()"
                    [disabled]="!selectedQcmSemester"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">Sélectionner une matière</option>
              <option *ngFor="let subject of qcmSubjects()" [value]="subject.id">
                {{ subject.title }}
              </option>
            </select>
          </div>

          <!-- Chapter Selection -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Chapitre</label>
            <select [(ngModel)]="selectedQcmChapter"
                    (change)="onQcmChapterChange()"
                    [disabled]="!selectedQcmSubject"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">Sélectionner un chapitre</option>
              <option *ngFor="let chapter of qcmChapters()" [value]="chapter.id">
                {{ chapter.title }}
              </option>
            </select>
          </div>

          <!-- Question Selection -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Question</label>
            <select [(ngModel)]="selectedQcmQuestion"
                    (change)="onQcmQuestionChange()"
                    [disabled]="!selectedQcmChapter"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">Sélectionner une question</option>
              <option *ngFor="let question of qcmQuestions()" [value]="question.id">
                Question {{ question.orderIndex + 1 }}
              </option>
            </select>
          </div>
        </div>

        <!-- Question Edit Form -->
        <div *ngIf="selectedQcmQuestionData()" class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg mr-3">
              Question {{ (selectedQcmQuestionData()?.orderIndex || 0) + 1 }}
            </span>
            <span class="text-gray-700">Édition</span>
          </h3>

          <!-- Question Text -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Texte de la question</label>
            <textarea [(ngModel)]="qcmFormData.questionText"
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Entrez le texte de la question"></textarea>
          </div>

          <!-- Options -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-4">Options</label>
            <div class="space-y-4">
              <div *ngFor="let option of qcmFormData.options; let i = index" class="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-all bg-gradient-to-r from-white to-gray-50">
                <div class="flex items-start gap-4">
                  <!-- Option Letter -->
                  <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                    {{ String.fromCharCode(65 + i) }}
                  </div>

                  <div class="flex-1 space-y-3">
                    <!-- Option Text -->
                    <input type="text"
                           [(ngModel)]="option.text"
                           class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                           placeholder="Texte de l'option">

                    <!-- Is Correct Checkbox -->
                    <label class="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox"
                             [(ngModel)]="option.isCorrect"
                             class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer">
                      <span class="text-sm font-semibold" [class.text-green-600]="option.isCorrect" [class.text-gray-700]="!option.isCorrect">
                        {{ option.isCorrect ? '✓ Option correcte' : 'Option incorrecte' }}
                      </span>
                    </label>

                    <!-- Justification -->
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-2">Justification (optionnel)</label>
                      <input type="text"
                             [(ngModel)]="option.justification"
                             class="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                             placeholder="Justification pour cette option">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Explanation -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Explication générale (optionnel)</label>
            <textarea [(ngModel)]="qcmFormData.explanation"
                      rows="2"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Explication générale de la question"></textarea>
          </div>

          <!-- Image Upload -->
          <div class="mb-8">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Image (optionnel)</label>

            <!-- Current Image -->
            <div *ngIf="getQuestionImageUrl() && !questionImageFile()" class="mb-4">
              <p class="text-xs text-gray-600 mb-2">Image actuelle :</p>
              <div class="relative inline-block">
                <img [src]="getQuestionImageUrl()"
                     alt="Question image"
                     class="max-w-xs max-h-48 rounded-xl border-2 border-gray-200 shadow-lg">
                <button (click)="removeQuestionImage()"
                        type="button"
                        class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-all shadow-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- File Input -->
            <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-all bg-gradient-to-br from-gray-50 to-white">
              <input type="file"
                     #questionImageInput
                     accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                     (change)="onQuestionImageSelected($event)"
                     class="hidden">

              <div *ngIf="!questionImageFile()" class="text-center">
                <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <button type="button"
                        (click)="questionImageInput.click()"
                        class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
                  Choisir une image
                </button>
                <p class="text-xs text-gray-500 mt-3">JPEG, PNG, GIF ou WebP (max 10MB)</p>
              </div>

              <div *ngIf="questionImageFile()" class="flex items-center gap-4">
                <img [src]="questionImagePreview()"
                     alt="Preview"
                     class="w-32 h-32 object-cover rounded-xl border-2 border-blue-400 shadow-lg">
                <div class="flex-1">
                  <p class="font-semibold text-gray-900">{{ questionImageFile()?.name }}</p>
                  <p class="text-sm text-gray-500">{{ formatFileSize(questionImageFile()?.size) }}</p>
                  <button type="button"
                          (click)="cancelQuestionImageUpload()"
                          class="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold">
                    Supprimer
                  </button>
                </div>
              </div>

              <!-- Upload Progress -->
              <div *ngIf="uploadingQuestionImage()" class="mt-4">
                <div class="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Upload en cours...</span>
                  <span>{{ questionImageUploadProgress() }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                       [style.width.%]="questionImageUploadProgress()"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4">
            <button (click)="saveQcmQuestion()"
                    [disabled]="qcmSaving()"
                    class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ qcmSaving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
            <button (click)="cancelQcmEdit()"
                    [disabled]="qcmSaving()"
                    class="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Annuler
            </button>
          </div>

          <!-- Success/Error Messages -->
          <div *ngIf="qcmSuccessMessage()" class="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <p class="text-sm font-semibold text-green-800">{{ qcmSuccessMessage() }}</p>
          </div>
          <div *ngIf="qcmErrorMessage()" class="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <p class="text-sm font-semibold text-red-800">{{ qcmErrorMessage() }}</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!selectedQcmQuestionData()" class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-16 text-center">
          <div class="max-w-md mx-auto">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Aucune question sélectionnée</h3>
            <p class="text-gray-600">Sélectionnez un niveau, une matière, un chapitre et une question pour commencer l'édition.</p>
          </div>
        </div>
      </div>

      <!-- Course PDFs Management Section -->
      <div *ngIf="activeTab() === 'course-pdfs'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Gestion des Cours PDF</h2>
            <p class="text-gray-600 mt-1">Uploadez et gérez les fichiers PDF de cours par matière</p>
          </div>
        </div>

        <!-- Upload Form -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Ajouter un nouveau cours PDF</h3>

          <div class="space-y-6">
            <!-- Subject Selection -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Matière *</label>
              <select [(ngModel)]="selectedPdfSubject"
                      (change)="loadCoursePdfs()"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option value="">Sélectionner une matière</option>
                <option *ngFor="let subject of qcmSubjects()" [value]="subject.id">
                  {{ subject.title }}
                </option>
              </select>
            </div>

            <!-- PDF Title -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Titre du document *</label>
              <input type="text"
                     [(ngModel)]="newPdfTitle"
                     placeholder="Ex: Cours complet d'Anatomie"
                     class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            </div>

            <!-- PDF Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Description (optionnel)</label>
              <textarea [(ngModel)]="newPdfDescription"
                        rows="3"
                        placeholder="Description du document..."
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"></textarea>
            </div>

            <!-- Order Index -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Ordre d'affichage</label>
              <input type="number"
                     [(ngModel)]="newPdfOrderIndex"
                     min="0"
                     placeholder="0"
                     class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            </div>

            <!-- PDF File Upload -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Fichier PDF *</label>
              <input type="file"
                     #pdfFileInput
                     (change)="onPdfFileSelected($event)"
                     accept=".pdf"
                     class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400 cursor-pointer">
              <p class="mt-2 text-sm text-gray-500">Maximum 50 MB. Format PDF uniquement.</p>
              <p *ngIf="selectedPdfFile" class="mt-2 text-sm text-green-600">✓ Fichier sélectionné: {{ selectedPdfFile.name }}</p>
            </div>

            <!-- Upload Button -->
            <div class="flex gap-4">
              <button (click)="uploadCoursePdf()"
                      [disabled]="uploadingPdf || !selectedPdfSubject || !newPdfTitle || !selectedPdfFile"
                      class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="!uploadingPdf">📤 Uploader le PDF</span>
                <span *ngIf="uploadingPdf">⏳ Upload en cours...</span>
              </button>

              <button (click)="resetPdfForm()"
                      type="button"
                      class="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-300">
                Réinitialiser
              </button>
            </div>

            <!-- Success/Error Messages -->
            <div *ngIf="pdfUploadSuccess" class="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p class="text-green-800">✅ PDF uploadé avec succès!</p>
            </div>
            <div *ngIf="pdfUploadError" class="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p class="text-red-800">❌ {{ pdfUploadError }}</p>
            </div>
          </div>
        </div>

        <!-- List of PDFs -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Cours PDF existants</h3>

          <div *ngIf="!selectedPdfSubject" class="text-center py-12 text-gray-500">
            <p>Sélectionnez une matière pour voir les cours PDF</p>
          </div>

          <div *ngIf="selectedPdfSubject && loadingCoursePdfs" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">Chargement...</p>
          </div>

          <div *ngIf="selectedPdfSubject && !loadingCoursePdfs && coursePdfs().length === 0" class="text-center py-12 text-gray-500">
            <p>Aucun cours PDF pour cette matière</p>
          </div>

          <div *ngIf="selectedPdfSubject && !loadingCoursePdfs && coursePdfs().length > 0" class="space-y-4">
            <div *ngFor="let pdf of coursePdfs()"
                 class="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900">{{ pdf.title }}</h4>
                <p *ngIf="pdf.description" class="text-sm text-gray-600 mt-1">{{ pdf.description }}</p>
                <p class="text-xs text-gray-400 mt-2">Ordre: {{ pdf.orderIndex }}</p>
              </div>
              <div class="flex gap-2">
                <a [href]="getPdfUrl(pdf.pdfUrl)"
                   target="_blank"
                   class="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all">
                  📄 Voir
                </a>
                <button (click)="deleteCoursePdf(pdf.id)"
                        class="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Content Section -->
      <div *ngIf="activeTab() === 'add-content'" class="space-y-8">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Ajouter du Contenu</h2>
            <p class="text-gray-600 mt-1">Ajoutez des matières, chapitres et quiz à la plateforme</p>
          </div>
        </div>

        <!-- Sub-tabs -->
        <div class="flex space-x-4 bg-white/60 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200/50">
          <button (click)="addContentSubTab = 'subject'"
                  [class]="addContentSubTab === 'subject' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'"
                  class="flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300">
            📚 Ajouter une Matière
          </button>
          <button (click)="addContentSubTab = 'chapter'"
                  [class]="addContentSubTab === 'chapter' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'"
                  class="flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300">
            📖 Ajouter un Chapitre
          </button>
          <button (click)="addContentSubTab = 'quiz'"
                  [class]="addContentSubTab === 'quiz' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'"
                  class="flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300">
            ❓ Ajouter un Quiz
          </button>
        </div>

        <!-- Add Subject Form -->
        <div *ngIf="addContentSubTab === 'subject'" class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg mr-3">
              📚
            </span>
            <span class="text-gray-700">Nouvelle Matière</span>
          </h3>

          <div class="space-y-6">
            <!-- Niveau -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Niveau *</label>
              <select [(ngModel)]="newSubjectForm.semester"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                <option value="">Sélectionner un niveau</option>
                <option value="PCEM1">PCEM1</option>
                <option value="PCEM2">PCEM2</option>
                <option value="DCEM1">DCEM1</option>
                <option value="DCEM2">DCEM2</option>
                <option value="DCEM3">DCEM3</option>
                <option value="DCEM4">DCEM4</option>
              </select>
            </div>

            <!-- Titre -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Titre de la matière *</label>
              <input type="text"
                     [(ngModel)]="newSubjectForm.title"
                     class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                     placeholder="Ex: Anatomie, Physiologie, Parasitologie...">
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Description</label>
              <textarea [(ngModel)]="newSubjectForm.description"
                        rows="3"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Description de la matière"></textarea>
            </div>

            <!-- Tags -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Tags (séparés par des virgules)</label>
              <input type="text"
                     [(ngModel)]="newSubjectForm.tagsInput"
                     class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                     placeholder="Ex: anatomie, système nerveux, histologie">
              <p class="text-xs text-gray-500 mt-2">Séparez les tags par des virgules</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 pt-4">
              <button (click)="createSubject()"
                      [disabled]="addContentSaving()"
                      class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ addContentSaving() ? 'Création...' : 'Créer la matière' }}
              </button>
              <button (click)="resetSubjectForm()"
                      [disabled]="addContentSaving()"
                      class="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Réinitialiser
              </button>
            </div>

            <!-- Success/Error Messages -->
            <div *ngIf="addContentSuccessMessage()" class="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <p class="text-sm font-semibold text-green-800">{{ addContentSuccessMessage() }}</p>
            </div>
            <div *ngIf="addContentErrorMessage()" class="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <p class="text-sm font-semibold text-red-800">{{ addContentErrorMessage() }}</p>
            </div>
          </div>
        </div>

        <!-- Add Chapter Form -->
        <div *ngIf="addContentSubTab === 'chapter'" class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg mr-3">
              📖
            </span>
            <span class="text-gray-700">Nouveau Chapitre</span>
          </h3>

          <div class="space-y-6">
            <!-- Subject Selection -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">Niveau *</label>
                <select [(ngModel)]="newChapterForm.selectedSemester"
                        (change)="onAddChapterSemesterChange()"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option value="">Sélectionner un niveau</option>
                  <option value="PCEM1">PCEM1</option>
                  <option value="PCEM2">PCEM2</option>
                  <option value="DCEM1">DCEM1</option>
                  <option value="DCEM2">DCEM2</option>
                  <option value="DCEM3">DCEM3</option>
                  <option value="DCEM4">DCEM4</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">Matière *</label>
                <select [(ngModel)]="newChapterForm.subjectId"
                        [disabled]="!newChapterForm.selectedSemester"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">Sélectionner une matière</option>
                  <option *ngFor="let subject of addChapterSubjects()" [value]="subject.id">
                    {{ subject.title }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Titre -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Titre du chapitre *</label>
              <input type="text"
                     [(ngModel)]="newChapterForm.title"
                     class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     placeholder="Ex: Chapitre 1 - Introduction">
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Description</label>
              <textarea [(ngModel)]="newChapterForm.description"
                        rows="3"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Description du chapitre"></textarea>
            </div>

            <!-- PDF URL -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">URL du PDF (optionnel)</label>
              <input type="text"
                     [(ngModel)]="newChapterForm.pdfUrl"
                     class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     placeholder="https://example.com/chapter.pdf">
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 pt-4">
              <button (click)="createChapter()"
                      [disabled]="addContentSaving()"
                      class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ addContentSaving() ? 'Création...' : 'Créer le chapitre' }}
              </button>
              <button (click)="resetChapterForm()"
                      [disabled]="addContentSaving()"
                      class="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Réinitialiser
              </button>
            </div>

            <!-- Success/Error Messages -->
            <div *ngIf="addContentSuccessMessage()" class="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <p class="text-sm font-semibold text-green-800">{{ addContentSuccessMessage() }}</p>
            </div>
            <div *ngIf="addContentErrorMessage()" class="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <p class="text-sm font-semibold text-red-800">{{ addContentErrorMessage() }}</p>
            </div>
          </div>
        </div>

        <!-- Add Quiz Form -->
        <div *ngIf="addContentSubTab === 'quiz'" class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg mr-3">
              ❓
            </span>
            <span class="text-gray-700">Nouveau Quiz</span>
          </h3>

          <div class="space-y-6">
            <!-- Chapter Selection -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">Niveau *</label>
                <select [(ngModel)]="newQuizForm.selectedSemester"
                        (change)="onAddQuizSemesterChange()"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all">
                  <option value="">Sélectionner un niveau</option>
                  <option value="PCEM1">PCEM1</option>
                  <option value="PCEM2">PCEM2</option>
                  <option value="DCEM1">DCEM1</option>
                  <option value="DCEM2">DCEM2</option>
                  <option value="DCEM3">DCEM3</option>
                  <option value="DCEM4">DCEM4</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">Matière *</label>
                <select [(ngModel)]="newQuizForm.selectedSubjectId"
                        (change)="onAddQuizSubjectChange()"
                        [disabled]="!newQuizForm.selectedSemester"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">Sélectionner une matière</option>
                  <option *ngFor="let subject of addQuizSubjects()" [value]="subject.id">
                    {{ subject.title }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">Chapitre *</label>
                <select [(ngModel)]="newQuizForm.chapterId"
                        [disabled]="!newQuizForm.selectedSubjectId"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">Sélectionner un chapitre</option>
                  <option *ngFor="let chapter of addQuizChapters()" [value]="chapter.id">
                    {{ chapter.title }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Question Text -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Texte de la question *</label>
              <textarea [(ngModel)]="newQuizForm.questionText"
                        rows="3"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Entrez le texte de la question"></textarea>
            </div>

            <!-- Options -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-4">Options *</label>
              <div class="space-y-4">
                <div *ngFor="let option of newQuizForm.options; let i = index" class="border-2 border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-all bg-gradient-to-r from-white to-gray-50">
                  <div class="flex items-start gap-4">
                    <!-- Option Letter -->
                    <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                      {{ String.fromCharCode(65 + i) }}
                    </div>

                    <div class="flex-1 space-y-3">
                      <!-- Option Text -->
                      <input type="text"
                             [(ngModel)]="option.text"
                             class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                             placeholder="Texte de l'option">

                      <!-- Answer State (3 states) -->
                      <div class="space-y-2">
                        <label class="block text-xs font-semibold text-gray-600 mb-2">État de la réponse *</label>
                        <div class="flex flex-col gap-2">
                          <label class="flex items-center gap-3 cursor-pointer hover:bg-green-50 p-2 rounded-lg transition-colors">
                            <input type="radio"
                                   [name]="'answer-state-' + i"
                                   [value]="'correct'"
                                   [(ngModel)]="option.answerState"
                                   class="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer">
                            <span class="text-sm font-semibold text-green-700">✅ Correcte</span>
                          </label>

                          <label class="flex items-center gap-3 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-colors">
                            <input type="radio"
                                   [name]="'answer-state-' + i"
                                   [value]="'partial'"
                                   [(ngModel)]="option.answerState"
                                   class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer">
                            <span class="text-sm font-semibold text-orange-700">⚠️ Nuancée / Débattue</span>
                          </label>

                          <label class="flex items-center gap-3 cursor-pointer hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <input type="radio"
                                   [name]="'answer-state-' + i"
                                   [value]="'incorrect'"
                                   [(ngModel)]="option.answerState"
                                   class="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer">
                            <span class="text-sm font-semibold text-red-700">❌ Incorrecte</span>
                          </label>
                        </div>
                      </div>

                      <!-- Justification -->
                      <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-2">Justification (optionnel)</label>
                        <input type="text"
                               [(ngModel)]="option.justification"
                               class="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                               placeholder="Justification pour cette option">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Explanation -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Explication générale (optionnel)</label>
              <textarea [(ngModel)]="newQuizForm.explanation"
                        rows="2"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Explication générale de la question"></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 pt-4">
              <button (click)="createQuiz()"
                      [disabled]="addContentSaving()"
                      class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ addContentSaving() ? 'Création...' : 'Créer le quiz' }}
              </button>
              <button (click)="resetQuizForm()"
                      [disabled]="addContentSaving()"
                      class="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Réinitialiser
              </button>
            </div>

            <!-- Success/Error Messages -->
            <div *ngIf="addContentSuccessMessage()" class="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <p class="text-sm font-semibold text-green-800">{{ addContentSuccessMessage() }}</p>
            </div>
            <div *ngIf="addContentErrorMessage()" class="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <p class="text-sm font-semibold text-red-800">{{ addContentErrorMessage() }}</p>
            </div>
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

        <!-- Sub-tabs for Subscription Management -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-4 mb-6">
          <div class="flex space-x-2">
            <button (click)="subscriptionSubTab.set('plans')"
                    [class]="subscriptionSubTab() === 'plans' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-6 py-2 rounded-lg font-medium text-sm transition-all">
              Plans d'Abonnement
            </button>
            <button (click)="subscriptionSubTab.set('users')"
                    [class]="subscriptionSubTab() === 'users' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-6 py-2 rounded-lg font-medium text-sm transition-all">
              Utilisateurs
            </button>
            <button (click)="subscriptionSubTab.set('payments')"
                    [class]="subscriptionSubTab() === 'payments' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-6 py-2 rounded-lg font-medium text-sm transition-all">
              Paiements
            </button>
            <button (click)="subscriptionSubTab.set('stats')"
                    [class]="subscriptionSubTab() === 'stats' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-6 py-2 rounded-lg font-medium text-sm transition-all">
              Statistiques
            </button>
          </div>
        </div>

        <!-- Statistics Sub-tab -->
        <div *ngIf="subscriptionSubTab() === 'stats' && adminStats()" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-600">Total Utilisateurs</h4>
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ adminStats().users.total }}</p>
              <p class="text-sm text-gray-500 mt-1">{{ adminStats().users.students }} étudiants, {{ adminStats().users.admins }} admins</p>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-600">Abonnements Actifs</h4>
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ adminStats().subscriptions.active }}</p>
              <p class="text-sm text-gray-500 mt-1">{{ adminStats().subscriptions.expired }} expirés</p>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-600">Paiements en Attente</h4>
                <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ adminStats().payments.pending }}</p>
              <p class="text-sm text-gray-500 mt-1">{{ adminStats().payments.completed }} complétés</p>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-600">Revenu Total</h4>
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <p class="text-3xl font-bold text-gray-900">{{ (adminStats().revenue.total / 100).toFixed(0) }} MRU</p>
              <p class="text-sm text-gray-500 mt-1">{{ (adminStats().revenue.monthly / 100).toFixed(0) }} MRU ce mois</p>
            </div>
          </div>
        </div>

        <!-- Subscription Plans Sub-tab -->
        <div *ngIf="subscriptionSubTab() === 'plans'" class="space-y-6">
          <div *ngIf="subscriptionPlans().length === 0" class="text-center py-8">
            <div class="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Chargement des plans d'abonnement...
            </div>
          </div>

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
            </div>
          </div>
        </div>

        <!-- Users with Subscriptions Sub-tab -->
        <div *ngIf="subscriptionSubTab() === 'users'" class="space-y-6">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Utilisateurs et Leurs Abonnements</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let user of usersWithSubscriptions()" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span *ngIf="user.subscription"
                            [class]="user.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                            class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                        {{ user.subscription.status }}
                      </span>
                      <span *ngIf="!user.subscription" class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Aucun
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ user.subscription?.planName || '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ user.subscription ? (user.subscription.endAt | date:'dd/MM/yyyy') : '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button *ngIf="!user.subscription && subscriptionPlans().length > 0"
                              (click)="activateUserSubscription(user.id, subscriptionPlans()[0].id, 12)"
                              class="text-green-600 hover:text-green-900">
                        Activer
                      </button>
                      <button *ngIf="user.subscription"
                              (click)="extendUserSubscription(user.subscription.id, 1)"
                              class="text-blue-600 hover:text-blue-900">
                        Prolonger
                      </button>
                      <button *ngIf="user.subscription"
                              (click)="deactivateUserSubscription(user.subscription.id)"
                              class="text-red-600 hover:text-red-900">
                        Désactiver
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Payments Sub-tab -->
        <div *ngIf="subscriptionSubTab() === 'payments'" class="space-y-6">
          <!-- Payment Filters -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-4">
            <div class="flex space-x-2">
              <button (click)="filterPayments('PENDING')"
                      [class]="selectedPaymentStatus() === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                      class="px-4 py-2 rounded-lg font-medium text-sm transition-all">
                En Attente
              </button>
              <button (click)="filterPayments('COMPLETED')"
                      [class]="selectedPaymentStatus() === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                      class="px-4 py-2 rounded-lg font-medium text-sm transition-all">
                Complétés
              </button>
              <button (click)="filterPayments('FAILED')"
                      [class]="selectedPaymentStatus() === 'FAILED' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                      class="px-4 py-2 rounded-lg font-medium text-sm transition-all">
                Échoués
              </button>
            </div>
          </div>

          <!-- Payments Table -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Paiements ({{ selectedPaymentStatus() }})</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reçu</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let payment of payments()" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ payment.user.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ payment.plan.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ (payment.amountCents / 100).toFixed(0) }} {{ payment.currency }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ payment.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <a *ngIf="payment.receiptScreenshot"
                         [href]="payment.receiptScreenshot"
                         target="_blank"
                         class="text-blue-600 hover:text-blue-900">
                        Voir
                      </a>
                      <span *ngIf="!payment.receiptScreenshot" class="text-gray-400">-</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button *ngIf="payment.status === 'PENDING'"
                              (click)="validatePaymentAction(payment.id, 'COMPLETED')"
                              class="text-green-600 hover:text-green-900">
                        Valider
                      </button>
                      <button *ngIf="payment.status === 'PENDING'"
                              (click)="validatePaymentAction(payment.id, 'FAILED')"
                              class="text-red-600 hover:text-red-900">
                        Rejeter
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
  readonly API_URL = environment.apiUrl;

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

  // Admin subscription management data
  adminStats = signal<any>(null);
  usersWithSubscriptions = signal<any[]>([]);
  payments = signal<any[]>([]);
  selectedPaymentStatus = signal<string>('PENDING');
  subscriptionSubTab = signal<string>('plans'); // 'plans', 'users', 'payments'

  // Modal states
  showAddPlanModal = signal(false);
  showAddCourseModal = signal(false);
  showAddUserModal = signal(false);
  showAddLessonModal = signal(false);
  showEditCourseModal = signal(false);
  showEditLessonModal = signal(false);
  showEditUserModal = signal(false);
  showEditPlanModal = signal(false);

  // QCM Management
  qcmSubjects = signal<any[]>([]);
  qcmAllSubjects = signal<any[]>([]); // All subjects before filtering
  qcmChapters = signal<any[]>([]);
  qcmQuestions = signal<any[]>([]);
  selectedQcmQuestionData = signal<any>(null);
  selectedQcmSemester = '';
  selectedQcmSubject = '';
  selectedQcmChapter = '';
  selectedQcmQuestion = '';
  qcmSaving = signal(false);
  qcmSuccessMessage = signal('');
  qcmErrorMessage = signal('');
  qcmFormData = {
    questionText: '',
    options: [] as Array<{text: string, isCorrect: boolean, justification: string | null}>,
    explanation: '',
    imageUrl: null as string | null
  };
  String = String; // Make String available in template

  // Image upload signals
  questionImageFile = signal<File | null>(null);
  questionImagePreview = signal<string | null>(null);
  uploadingQuestionImage = signal(false);
  questionImageUploadProgress = signal(0);

  // Course PDF Management
  selectedPdfSubject = '';
  newPdfTitle = '';
  newPdfDescription = '';
  newPdfOrderIndex = 0;
  selectedPdfFile: File | null = null;
  uploadingPdf = false;
  pdfUploadSuccess = false;
  pdfUploadError = '';
  loadingCoursePdfs = false;
  coursePdfs = signal<any[]>([]);

  // Add Content Management
  addContentSubTab = 'subject'; // 'subject', 'chapter', 'quiz'
  addContentSaving = signal(false);
  addContentSuccessMessage = signal('');
  addContentErrorMessage = signal('');

  // Add Subject Form
  newSubjectForm = {
    semester: '',
    title: '',
    description: '',
    tagsInput: ''
  };

  // Add Chapter Form
  newChapterForm = {
    selectedSemester: '',
    subjectId: '',
    title: '',
    description: '',
    pdfUrl: ''
  };
  addChapterSubjects = signal<any[]>([]);
  addChapterAllSubjects = signal<any[]>([]);

  // Add Quiz Form
  newQuizForm = {
    selectedSemester: '',
    selectedSubjectId: '',
    chapterId: '',
    questionText: '',
    options: [
      { text: '', answerState: 'incorrect', justification: '' },
      { text: '', answerState: 'incorrect', justification: '' },
      { text: '', answerState: 'incorrect', justification: '' },
      { text: '', answerState: 'incorrect', justification: '' },
      { text: '', answerState: 'incorrect', justification: '' }
    ],
    explanation: ''
  };
  addQuizSubjects = signal<any[]>([]);
  addQuizAllSubjects = signal<any[]>([]);
  addQuizChapters = signal<any[]>([]);

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


  // Navigation tabs
  tabs = [
    { id: 'overview', name: 'Vue d\'ensemble' },
    { id: 'courses', name: 'Cours' },
    { id: 'lessons', name: 'Leçons' },
    { id: 'qcm', name: 'Gestion des QCM' },
    { id: 'course-pdfs', name: 'Gestion PDF' },
    { id: 'add-content', name: 'Ajouter Contenu' },
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
    public authService: AuthService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadQcmSubjects();
    this.loadAllSubjects(); // Load subjects for add content forms

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
          totalUsers: data.users?.total || 0,
          totalLessons: 0,
          activeSubscriptions: data.subscriptions?.active || 0,
          totalRevenue: data.revenue?.total || 0,
          monthlyRevenue: data.revenue?.monthly || 0,
          userGrowth: 0,
          courseViews: 0,
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
    console.log('🔍 Loading users from:', `${this.API_URL}/users`);
    this.http.get<User[]>(`${this.API_URL}/users`).subscribe({
      next: (data) => {
        console.log('✅ Users loaded:', data);
        this.users.set(data);
      },
      error: (error) => {
        console.error('❌ Error loading users:', error);
        console.error('Error details:', error.error);
      }
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

    // Load subscription management data when subscriptions tab is activated
    if (tabId === 'subscriptions') {
      console.log('💳 Subscriptions tab activated - loading admin data...');
      this.loadAdminSubscriptionData();
    }
  }

  // Load admin subscription management data
  loadAdminSubscriptionData() {
    // Load dashboard stats
    this.subscriptionService.getAdminDashboardStats().subscribe({
      next: (stats) => {
        console.log('📊 Admin stats loaded:', stats);
        this.adminStats.set(stats);
      },
      error: (err) => console.error('Error loading admin stats:', err)
    });

    // Load users with subscriptions
    this.subscriptionService.getUsersSubscriptions().subscribe({
      next: (users) => {
        console.log('👥 Users with subscriptions loaded:', users);
        this.usersWithSubscriptions.set(users);
      },
      error: (err) => console.error('Error loading users:', err)
    });

    // Load payments
    this.loadPayments();
  }

  loadPayments(status?: string) {
    const paymentStatus = status || this.selectedPaymentStatus();
    this.subscriptionService.getPayments(paymentStatus).subscribe({
      next: (payments) => {
        console.log('💰 Payments loaded:', payments);
        this.payments.set(payments);
      },
      error: (err) => console.error('Error loading payments:', err)
    });
  }

  // Change payment filter
  filterPayments(status: string) {
    this.selectedPaymentStatus.set(status);
    this.loadPayments(status);
  }

  // Admin actions
  activateUserSubscription(userId: string, planId: string, months: number) {
    if (!confirm(`Activer un abonnement de ${months} mois pour cet utilisateur?`)) {
      return;
    }

    this.subscriptionService.activateSubscription(userId, planId, months).subscribe({
      next: () => {
        alert('Abonnement activé avec succès!');
        this.loadAdminSubscriptionData();
      },
      error: (err) => {
        console.error('Error activating subscription:', err);
        alert('Erreur lors de l\'activation de l\'abonnement');
      }
    });
  }

  extendUserSubscription(subscriptionId: string, months: number) {
    if (!confirm(`Prolonger cet abonnement de ${months} mois?`)) {
      return;
    }

    this.subscriptionService.extendSubscription(subscriptionId, months).subscribe({
      next: () => {
        alert('Abonnement prolongé avec succès!');
        this.loadAdminSubscriptionData();
      },
      error: (err) => {
        console.error('Error extending subscription:', err);
        alert('Erreur lors de la prolongation de l\'abonnement');
      }
    });
  }

  deactivateUserSubscription(subscriptionId: string) {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet abonnement?')) {
      return;
    }

    this.subscriptionService.deactivateSubscription(subscriptionId).subscribe({
      next: () => {
        alert('Abonnement désactivé avec succès!');
        this.loadAdminSubscriptionData();
      },
      error: (err) => {
        console.error('Error deactivating subscription:', err);
        alert('Erreur lors de la désactivation de l\'abonnement');
      }
    });
  }

  validatePaymentAction(paymentId: string, status: 'COMPLETED' | 'FAILED', notes?: string) {
    const action = status === 'COMPLETED' ? 'valider' : 'rejeter';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ce paiement?`)) {
      return;
    }

    this.subscriptionService.validatePayment(paymentId, status, notes).subscribe({
      next: () => {
        alert(`Paiement ${status === 'COMPLETED' ? 'validé' : 'rejeté'} avec succès!`);
        this.loadAdminSubscriptionData();
      },
      error: (err) => {
        console.error('Error validating payment:', err);
        alert('Erreur lors de la validation du paiement');
      }
    });
  }

  // ============================================
  // QCM MANAGEMENT METHODS
  // ============================================

  loadQcmSubjects() {
    this.http.get<any>(`${this.API_URL}/subjects/admin/all`).subscribe({
      next: (data) => {
        console.log('📚 All subjects loaded:', data.subjects);
        this.qcmAllSubjects.set(data.subjects || []);
        // Don't filter yet, wait for semester selection
        this.qcmSubjects.set([]);
      },
      error: (error) => console.error('Error loading QCM subjects:', error)
    });
  }

  onQcmSemesterChange() {
    this.selectedQcmSubject = '';
    this.selectedQcmChapter = '';
    this.selectedQcmQuestion = '';
    this.qcmChapters.set([]);
    this.qcmQuestions.set([]);
    this.selectedQcmQuestionData.set(null);
    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');

    if (!this.selectedQcmSemester) {
      this.qcmSubjects.set([]);
      return;
    }

    console.log('🔍 Selected semester:', this.selectedQcmSemester);
    console.log('📚 All subjects:', this.qcmAllSubjects());

    // Filter subjects by semester
    const filteredSubjects = this.qcmAllSubjects().filter(
      subject => {
        console.log('Checking subject:', subject.title, 'semester:', subject.semester);
        return subject.semester === this.selectedQcmSemester;
      }
    );

    console.log('✅ Filtered subjects:', filteredSubjects);
    this.qcmSubjects.set(filteredSubjects);
  }

  onQcmSubjectChange() {
    this.selectedQcmChapter = '';
    this.selectedQcmQuestion = '';
    this.qcmChapters.set([]);
    this.qcmQuestions.set([]);
    this.selectedQcmQuestionData.set(null);
    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');

    if (!this.selectedQcmSubject) return;

    // Load chapters for selected subject
    this.http.get<any>(`${this.API_URL}/chapters/subject/${this.selectedQcmSubject}`).subscribe({
      next: (data) => {
        this.qcmChapters.set(data.chapters || []);
      },
      error: (error) => console.error('Error loading chapters:', error)
    });
  }

  onQcmChapterChange() {
    this.selectedQcmQuestion = '';
    this.qcmQuestions.set([]);
    this.selectedQcmQuestionData.set(null);
    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');

    if (!this.selectedQcmChapter) return;

    // Load questions for selected chapter
    this.http.get<any>(`${this.API_URL}/questions/chapter/${this.selectedQcmChapter}`).subscribe({
      next: (data) => {
        this.qcmQuestions.set(data.questions || []);
      },
      error: (error) => console.error('Error loading questions:', error)
    });
  }

  onQcmQuestionChange() {
    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');

    if (!this.selectedQcmQuestion) {
      this.selectedQcmQuestionData.set(null);
      return;
    }

    // Load selected question details
    this.http.get<any>(`${this.API_URL}/questions/${this.selectedQcmQuestion}`).subscribe({
      next: (data) => {
        this.selectedQcmQuestionData.set(data.question);
        // Populate form data
        this.qcmFormData.questionText = data.question.questionText;
        this.qcmFormData.options = JSON.parse(JSON.stringify(data.question.options)); // Deep copy
        this.qcmFormData.explanation = data.question.explanation || '';
        this.qcmFormData.imageUrl = data.question.imageUrl || null;

        // Reset image upload state
        this.questionImageFile.set(null);
        this.questionImagePreview.set(null);
        this.uploadingQuestionImage.set(false);
        this.questionImageUploadProgress.set(0);
      },
      error: (error) => {
        console.error('Error loading question details:', error);
        this.qcmErrorMessage.set('Erreur lors du chargement de la question');
      }
    });
  }

  async saveQcmQuestion() {
    if (!this.selectedQcmQuestion) return;

    this.qcmSaving.set(true);
    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');

    try {
      // Upload image first if there's a new file selected
      if (this.questionImageFile()) {
        await this.uploadQuestionImage();
      }

      const updateData = {
        questionText: this.qcmFormData.questionText,
        options: this.qcmFormData.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          justification: opt.justification || null
        })),
        explanation: this.qcmFormData.explanation || null,
        imageUrl: this.qcmFormData.imageUrl
      };

      this.http.put<any>(`${this.API_URL}/questions/${this.selectedQcmQuestion}`, updateData).subscribe({
        next: (data) => {
          this.qcmSaving.set(false);
          this.qcmSuccessMessage.set('Question mise à jour avec succès!');

          // Refresh question data
          this.selectedQcmQuestionData.set(data.question);

          // Reset image upload state
          this.questionImageFile.set(null);
          this.questionImagePreview.set(null);

          // Clear success message after 5 seconds
          setTimeout(() => {
            this.qcmSuccessMessage.set('');
          }, 5000);
        },
        error: (error) => {
          this.qcmSaving.set(false);
          console.error('Error saving question:', error);
          this.qcmErrorMessage.set(error.error?.error?.message || 'Erreur lors de la sauvegarde de la question');

          // Clear error message after 8 seconds
          setTimeout(() => {
            this.qcmErrorMessage.set('');
          }, 8000);
        }
      });
    } catch (error: any) {
      this.qcmSaving.set(false);
      console.error('Error in saveQcmQuestion:', error);
      this.qcmErrorMessage.set(error.message || 'Erreur lors de la sauvegarde');
      setTimeout(() => {
        this.qcmErrorMessage.set('');
      }, 8000);
    }
  }

  cancelQcmEdit() {
    if (!this.selectedQcmQuestionData()) return;

    // Reset form to original data
    const questionData = this.selectedQcmQuestionData();
    this.qcmFormData.questionText = questionData.questionText;
    this.qcmFormData.options = JSON.parse(JSON.stringify(questionData.options));
    this.qcmFormData.explanation = questionData.explanation || '';
    this.qcmFormData.imageUrl = questionData.imageUrl || null;

    // Reset image upload state
    this.questionImageFile.set(null);
    this.questionImagePreview.set(null);
    this.uploadingQuestionImage.set(false);
    this.questionImageUploadProgress.set(0);

    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');
  }

  // ============================================
  // IMAGE UPLOAD METHODS
  // ============================================

  onQuestionImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (include both image/jpeg and image/jpg)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.qcmErrorMessage.set('Format d\'image invalide. Utilisez JPEG, PNG, GIF ou WebP.');
      setTimeout(() => this.qcmErrorMessage.set(''), 5000);
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.qcmErrorMessage.set('L\'image est trop volumineuse. Taille maximale: 10MB.');
      setTimeout(() => this.qcmErrorMessage.set(''), 5000);
      return;
    }

    // Set file and create preview
    this.questionImageFile.set(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.questionImagePreview.set(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  async uploadQuestionImage(): Promise<void> {
    const file = this.questionImageFile();
    if (!file || !this.selectedQcmQuestion) {
      return;
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);

      this.uploadingQuestionImage.set(true);
      this.questionImageUploadProgress.set(0);

      // Simulate progress (since we can't get real progress easily with HttpClient)
      const progressInterval = setInterval(() => {
        const current = this.questionImageUploadProgress();
        if (current < 90) {
          this.questionImageUploadProgress.set(current + 10);
        }
      }, 100);

      this.http.post<any>(`${this.API_URL}/questions/${this.selectedQcmQuestion}/upload-image`, formData).subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          this.questionImageUploadProgress.set(100);
          this.uploadingQuestionImage.set(false);

          // Update form data with new image URL
          this.qcmFormData.imageUrl = response.imageUrl;

          // Clear file input
          this.questionImageFile.set(null);
          this.questionImagePreview.set(null);

          resolve();
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.uploadingQuestionImage.set(false);
          this.questionImageUploadProgress.set(0);
          console.error('Error uploading image:', error);
          reject(new Error('Erreur lors de l\'upload de l\'image'));
        }
      });
    });
  }

  removeQuestionImage() {
    this.qcmFormData.imageUrl = null;
    this.questionImageFile.set(null);
    this.questionImagePreview.set(null);
  }

  cancelQuestionImageUpload() {
    this.questionImageFile.set(null);
    this.questionImagePreview.set(null);
    this.uploadingQuestionImage.set(false);
    this.questionImageUploadProgress.set(0);
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getQuestionImageUrl(): string | null {
    if (!this.qcmFormData.imageUrl) {
      console.log('🖼️ No imageUrl in qcmFormData');
      return null;
    }

    console.log('🖼️ qcmFormData.imageUrl:', this.qcmFormData.imageUrl);

    // Si l'URL est déjà complète (commence par http), la retourner telle quelle
    if (this.qcmFormData.imageUrl.startsWith('http')) {
      console.log('🖼️ Using absolute URL:', this.qcmFormData.imageUrl);
      return this.qcmFormData.imageUrl;
    }

    // Sinon, préfixer avec l'URL de l'API
    const fullUrl = `${this.API_URL.replace('/api', '')}${this.qcmFormData.imageUrl}`;
    console.log('🖼️ Constructed URL:', fullUrl);
    console.log('🖼️ API_URL:', this.API_URL);
    return fullUrl;
  }

  // ============================================
  // ADD CONTENT METHODS
  // ============================================

  loadAllSubjects() {
    this.http.get<any>(`${this.API_URL}/subjects/admin/all`).subscribe({
      next: (data) => {
        console.log('📚 All subjects loaded for add content:', data.subjects);
        this.addChapterAllSubjects.set(data.subjects || []);
        this.addQuizAllSubjects.set(data.subjects || []);
      },
      error: (error) => console.error('Error loading subjects for add content:', error)
    });
  }

  // CREATE SUBJECT
  createSubject() {
    if (!this.newSubjectForm.semester || !this.newSubjectForm.title) {
      this.addContentErrorMessage.set('Veuillez remplir tous les champs requis (Niveau et Titre)');
      setTimeout(() => this.addContentErrorMessage.set(''), 5000);
      return;
    }

    this.addContentSaving.set(true);
    this.addContentSuccessMessage.set('');
    this.addContentErrorMessage.set('');

    const tags = this.newSubjectForm.tagsInput
      ? this.newSubjectForm.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const subjectData = {
      semester: this.newSubjectForm.semester,
      title: this.newSubjectForm.title,
      description: this.newSubjectForm.description || '',
      tags: tags
    };

    this.http.post<any>(`${this.API_URL}/subjects`, subjectData).subscribe({
      next: (data) => {
        this.addContentSaving.set(false);
        this.addContentSuccessMessage.set(`Matière "${data.subject.title}" créée avec succès!`);
        this.resetSubjectForm();
        this.loadAllSubjects(); // Reload subjects
        setTimeout(() => this.addContentSuccessMessage.set(''), 5000);
      },
      error: (error) => {
        this.addContentSaving.set(false);
        console.error('Error creating subject:', error);
        this.addContentErrorMessage.set(error.error?.error?.message || 'Erreur lors de la création de la matière');
        setTimeout(() => this.addContentErrorMessage.set(''), 8000);
      }
    });
  }

  resetSubjectForm() {
    this.newSubjectForm = {
      semester: '',
      title: '',
      description: '',
      tagsInput: ''
    };
  }

  // CREATE CHAPTER
  onAddChapterSemesterChange() {
    this.newChapterForm.subjectId = '';

    if (!this.newChapterForm.selectedSemester) {
      this.addChapterSubjects.set([]);
      return;
    }

    const filteredSubjects = this.addChapterAllSubjects().filter(
      subject => subject.semester === this.newChapterForm.selectedSemester
    );
    this.addChapterSubjects.set(filteredSubjects);
  }

  createChapter() {
    if (!this.newChapterForm.subjectId || !this.newChapterForm.title) {
      this.addContentErrorMessage.set('Veuillez remplir tous les champs requis (Niveau, Matière et Titre)');
      setTimeout(() => this.addContentErrorMessage.set(''), 5000);
      return;
    }

    this.addContentSaving.set(true);
    this.addContentSuccessMessage.set('');
    this.addContentErrorMessage.set('');

    const chapterData = {
      subjectId: this.newChapterForm.subjectId,
      title: this.newChapterForm.title,
      description: this.newChapterForm.description || '',
      pdfUrl: this.newChapterForm.pdfUrl || null
    };

    this.http.post<any>(`${this.API_URL}/chapters`, chapterData).subscribe({
      next: (data) => {
        this.addContentSaving.set(false);
        this.addContentSuccessMessage.set(`Chapitre "${data.chapter.title}" créé avec succès!`);
        this.resetChapterForm();
        setTimeout(() => this.addContentSuccessMessage.set(''), 5000);
      },
      error: (error) => {
        this.addContentSaving.set(false);
        console.error('Error creating chapter:', error);
        this.addContentErrorMessage.set(error.error?.error?.message || 'Erreur lors de la création du chapitre');
        setTimeout(() => this.addContentErrorMessage.set(''), 8000);
      }
    });
  }

  resetChapterForm() {
    this.newChapterForm = {
      selectedSemester: '',
      subjectId: '',
      title: '',
      description: '',
      pdfUrl: ''
    };
    this.addChapterSubjects.set([]);
  }

  // CREATE QUIZ
  onAddQuizSemesterChange() {
    this.newQuizForm.selectedSubjectId = '';
    this.newQuizForm.chapterId = '';
    this.addQuizChapters.set([]);

    if (!this.newQuizForm.selectedSemester) {
      this.addQuizSubjects.set([]);
      return;
    }

    const filteredSubjects = this.addQuizAllSubjects().filter(
      subject => subject.semester === this.newQuizForm.selectedSemester
    );
    this.addQuizSubjects.set(filteredSubjects);
  }

  onAddQuizSubjectChange() {
    this.newQuizForm.chapterId = '';

    if (!this.newQuizForm.selectedSubjectId) {
      this.addQuizChapters.set([]);
      return;
    }

    this.http.get<any>(`${this.API_URL}/chapters/subject/${this.newQuizForm.selectedSubjectId}`).subscribe({
      next: (data) => {
        this.addQuizChapters.set(data.chapters || []);
      },
      error: (error) => console.error('Error loading chapters for quiz:', error)
    });
  }

  createQuiz() {
    if (!this.newQuizForm.chapterId || !this.newQuizForm.questionText) {
      this.addContentErrorMessage.set('Veuillez remplir tous les champs requis (Niveau, Matière, Chapitre et Question)');
      setTimeout(() => this.addContentErrorMessage.set(''), 5000);
      return;
    }

    // Validate at least one option has text
    const hasValidOptions = this.newQuizForm.options.some(opt => opt.text.trim().length > 0);
    if (!hasValidOptions) {
      this.addContentErrorMessage.set('Veuillez remplir au moins une option');
      setTimeout(() => this.addContentErrorMessage.set(''), 5000);
      return;
    }

    // Validate at least one correct answer
    const hasCorrectAnswer = this.newQuizForm.options.some(opt => opt.answerState === 'correct' && opt.text.trim().length > 0);
    if (!hasCorrectAnswer) {
      this.addContentErrorMessage.set('Veuillez marquer au moins une option comme correcte');
      setTimeout(() => this.addContentErrorMessage.set(''), 5000);
      return;
    }

    this.addContentSaving.set(true);
    this.addContentSuccessMessage.set('');
    this.addContentErrorMessage.set('');

    // Filter out empty options and convert to backend format
    const validOptions = this.newQuizForm.options
      .filter(opt => opt.text.trim().length > 0)
      .map(opt => ({
        text: opt.text.trim(),
        isCorrect: opt.answerState,  // Send as 'correct' | 'incorrect' | 'partial'
        justification: opt.justification.trim() || null
      }));

    const quizData = {
      chapterId: this.newQuizForm.chapterId,
      questionText: this.newQuizForm.questionText,
      options: validOptions,
      explanation: this.newQuizForm.explanation || null
    };

    this.http.post<any>(`${this.API_URL}/questions`, quizData).subscribe({
      next: (data) => {
        this.addContentSaving.set(false);
        this.addContentSuccessMessage.set('Question créée avec succès!');
        this.resetQuizForm();
        setTimeout(() => this.addContentSuccessMessage.set(''), 5000);
      },
      error: (error) => {
        this.addContentSaving.set(false);
        console.error('Error creating quiz:', error);
        this.addContentErrorMessage.set(error.error?.error?.message || 'Erreur lors de la création de la question');
        setTimeout(() => this.addContentErrorMessage.set(''), 8000);
      }
    });
  }

  resetQuizForm() {
    this.newQuizForm = {
      selectedSemester: '',
      selectedSubjectId: '',
      chapterId: '',
      questionText: '',
      options: [
        { text: '', answerState: 'incorrect', justification: '' },
        { text: '', answerState: 'incorrect', justification: '' },
        { text: '', answerState: 'incorrect', justification: '' },
        { text: '', answerState: 'incorrect', justification: '' },
        { text: '', answerState: 'incorrect', justification: '' }
      ],
      explanation: ''
    };
    this.addQuizSubjects.set([]);
    this.addQuizChapters.set([]);
  }

  // ============================================
  // COURSE PDF MANAGEMENT METHODS
  // ============================================

  loadCoursePdfs() {
    if (!this.selectedPdfSubject) {
      this.coursePdfs.set([]);
      return;
    }

    this.loadingCoursePdfs = true;
    this.http.get<any>(`${this.API_URL}/course-pdfs/subject/${this.selectedPdfSubject}`)
      .subscribe({
        next: (res) => {
          this.coursePdfs.set(res.coursePdfs || []);
          this.loadingCoursePdfs = false;
        },
        error: (err) => {
          console.error('Error loading course PDFs:', err);
          this.loadingCoursePdfs = false;
          this.pdfUploadError = 'Erreur lors du chargement des cours PDF';
        }
      });
  }

  onPdfFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPdfFile = input.files[0];

      // Validate file size (50MB max)
      if (this.selectedPdfFile.size > 50 * 1024 * 1024) {
        this.pdfUploadError = 'Le fichier dépasse la taille maximale de 50 MB';
        this.selectedPdfFile = null;
        input.value = '';
        return;
      }

      // Validate file type
      if (this.selectedPdfFile.type !== 'application/pdf') {
        this.pdfUploadError = 'Seuls les fichiers PDF sont acceptés';
        this.selectedPdfFile = null;
        input.value = '';
        return;
      }

      this.pdfUploadError = '';
    }
  }

  uploadCoursePdf() {
    if (!this.selectedPdfSubject || !this.newPdfTitle || !this.selectedPdfFile) {
      this.pdfUploadError = 'Veuillez remplir tous les champs requis';
      return;
    }

    this.uploadingPdf = true;
    this.pdfUploadSuccess = false;
    this.pdfUploadError = '';

    const formData = new FormData();
    formData.append('pdf', this.selectedPdfFile);
    formData.append('subjectId', this.selectedPdfSubject);
    formData.append('title', this.newPdfTitle);
    if (this.newPdfDescription) {
      formData.append('description', this.newPdfDescription);
    }
    formData.append('orderIndex', this.newPdfOrderIndex.toString());

    this.http.post<any>(`${this.API_URL}/course-pdfs`, formData)
      .subscribe({
        next: (res) => {
          this.uploadingPdf = false;
          this.pdfUploadSuccess = true;
          this.pdfUploadError = '';

          // Reload the list
          this.loadCoursePdfs();

          // Reset form after 2 seconds
          setTimeout(() => {
            this.resetPdfForm();
          }, 2000);
        },
        error: (err) => {
          console.error('Error uploading PDF:', err);
          this.uploadingPdf = false;
          this.pdfUploadSuccess = false;
          this.pdfUploadError = err.error?.error || 'Erreur lors de l\'upload du PDF';
        }
      });
  }

  resetPdfForm() {
    this.newPdfTitle = '';
    this.newPdfDescription = '';
    this.newPdfOrderIndex = 0;
    this.selectedPdfFile = null;
    this.pdfUploadSuccess = false;
    this.pdfUploadError = '';

    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getPdfUrl(pdfUrl: string): string {
    if (pdfUrl.startsWith('http')) {
      return pdfUrl;
    }
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${pdfUrl}`;
  }

  deleteCoursePdf(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours PDF ?')) {
      return;
    }

    this.http.delete<any>(`${this.API_URL}/course-pdfs/${id}`)
      .subscribe({
        next: (res) => {
          // Reload the list
          this.loadCoursePdfs();
        },
        error: (err) => {
          console.error('Error deleting PDF:', err);
          alert('Erreur lors de la suppression du PDF');
        }
      });
  }

}
