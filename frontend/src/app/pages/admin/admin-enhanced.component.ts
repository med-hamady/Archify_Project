import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Department {
  id: string;
  name: string;
  courseCount: number;
  userCount: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  professor: string;
  department: string;
  departmentId: string;
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
  type: 'video' | 'pdf' | 'exam';
  durationSec: number;
  vimeoId?: string;
  youtubeId?: string;
  pdfUrl?: string;
  isPremium: boolean;
  orderIndex: number;
  createdAt: string;
  courseId: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'superadmin';
  department?: string;
  semester?: number;
  createdAt: string;
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
  usersByDepartment: Array<{
    departmentId: string;
    count: number;
  }>;
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
                    (click)="activeTab.set(tab.id)"
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
                    +12% ce mois
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
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4-4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    +8% ce mois
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
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4-4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    +15% ce mois
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
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4-4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    +22% ce mois
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
                  <span class="text-xs text-gray-500">{{ week.week }}</span>
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

        <!-- Subscription Management -->
        <div *ngIf="activeTab() === 'subscriptions'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-900">Gestion des Abonnements</h2>
            <button (click)="showAddPlanModal.set(true)"
                    class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Ajouter un Plan
            </button>
          </div>

          <!-- Subscription Plans -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div *ngFor="let plan of subscriptionPlans" class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div class="text-center">
                <h3 class="text-xl font-bold text-gray-900">{{ plan.name }}</h3>
                <p class="text-3xl font-bold text-blue-600 mt-2">{{ plan.price | currency:'MRU':'symbol':'1.0-0' }}</p>
                <p class="text-gray-500 text-sm">{{ plan.interval }}</p>
                <ul class="mt-4 space-y-2">
                  <li *ngFor="let feature of plan.features" class="text-sm text-gray-600 flex items-center">
                    <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    {{ feature }}
                  </li>
                </ul>
                <button class="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Modifier
                </button>
              </div>
            </div>
          </div>

          <!-- Active Subscriptions Table -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Abonnements Actifs</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de début</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let subscription of subscriptions()" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span class="text-sm font-medium text-gray-700">{{ subscription.user.name.charAt(0) }}</span>
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900">{{ subscription.user.name }}</div>
                          <div class="text-sm text-gray-500">{{ subscription.user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-900">{{ subscription.plan.name }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs font-semibold rounded-full"
                            [class]="subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                        {{ subscription.status | titlecase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ subscription.startDate | date:'dd/MM/yyyy' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button class="text-blue-600 hover:text-blue-900 mr-3">Voir</button>
                      <button class="text-red-600 hover:text-red-900">Suspendre</button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
      <div *ngIf="showAddCourseModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300">
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea [(ngModel)]="newCourse.description" name="description" required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Professeur</label>
              <input type="text" [(ngModel)]="newCourse.professor" name="professor" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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

      <!-- Add User Modal -->
      <div *ngIf="showAddUserModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Ajouter un Utilisateur</h3>
            <button (click)="showAddUserModal.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form (ngSubmit)="createUser()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
              <input type="text" [(ngModel)]="newUser.name" name="name" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                <option value="student">Étudiant</option>
                <option value="admin">Administrateur</option>
              </select>
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
      <div *ngIf="showAddPlanModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300">
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
    </div>
  `
})
export class AdminEnhancedComponent implements OnInit {
  private readonly API_URL = 'http://localhost:3000/api';

  // Signals
  activeTab = signal('overview');
  departments = signal<Department[]>([]);
  courses = signal<Course[]>([]);
  lessons = signal<Lesson[]>([]);
  users = signal<User[]>([]);
  subscriptions = signal<Subscription[]>([]);
  userStats = signal<UserStats | null>(null);
  stats = signal({
    totalCourses: 0,
    totalUsers: 0,
    totalLessons: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    userGrowth: 0,
    courseViews: 0
  });

  // Modal states
  showAddPlanModal = signal(false);
  showAddCourseModal = signal(false);
  showAddUserModal = signal(false);

  // Form data
  newCourse = {
    title: '',
    description: '',
    professor: '',
    departmentId: '',
    semester: 'S1',
    isPremium: false
  };

  newUser = {
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'admin'
  };

  newPlan = {
    name: '',
    price: 0,
    type: 'VIDEOS_ONLY' as 'VIDEOS_ONLY' | 'DOCUMENTS_ONLY' | 'FULL_ACCESS',
    description: ''
  };

  tabs = [
    { id: 'overview', name: 'Vue d\'ensemble' },
    { id: 'subscriptions', name: 'Abonnements' },
    { id: 'content', name: 'Contenu' },
    { id: 'users', name: 'Utilisateurs' },
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
    { week: 'S1', value: 12 },
    { week: 'S2', value: 18 },
    { week: 'S3', value: 25 },
    { week: 'S4', value: 32 },
    { week: 'S5', value: 28 },
    { week: 'S6', value: 35 }
  ];

  recentActivity = [
    { description: 'Nouvel utilisateur inscrit', time: 'Il y a 2 heures', color: 'bg-green-400' },
    { description: 'Nouvelle leçon ajoutée', time: 'Il y a 4 heures', color: 'bg-blue-400' },
    { description: 'Nouvel abonnement activé', time: 'Il y a 6 heures', color: 'bg-purple-400' },
    { description: 'Cours mis à jour', time: 'Il y a 8 heures', color: 'bg-orange-400' }
  ];

  subscriptionPlans = [
    {
      name: 'Vidéos Seulement',
      price: 650,
      interval: '/mois',
      features: ['Accès aux vidéos', 'Solutions complètes', 'Support prioritaire']
    },
    {
      name: 'Documents Seulement',
      price: 500,
      interval: '/mois',
      features: ['Accès aux PDFs', 'Exercices corrigés', 'Archives complètes']
    },
    {
      name: 'Accès Complet',
      price: 1000,
      interval: '/mois',
      features: ['Vidéos + Documents', 'Accès illimité', 'Support 24/7']
    }
  ];

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load departments
    this.http.get<Department[]>(`${this.API_URL}/departments`).subscribe({
      next: (data) => this.departments.set(data),
      error: (error) => console.error('Error loading departments:', error)
    });

    // Load courses
    this.http.get<any>(`${this.API_URL}/courses`).subscribe({
      next: (response) => this.courses.set(response.courses || []),
      error: (error) => console.error('Error loading courses:', error)
    });

    // Load lessons
    this.http.get<Lesson[]>(`${this.API_URL}/lessons`).subscribe({
      next: (data) => this.lessons.set(data),
      error: (error) => console.error('Error loading lessons:', error)
    });

    // Load users
    this.http.get<User[]>(`${this.API_URL}/users`).subscribe({
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
      courseViews: this.courses().reduce((sum, c) => sum + (c.views || 0), 0)
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
    try {
      const response = await this.http.post(`${this.API_URL}/admin/create-user`, this.newUser).toPromise();
      console.log('User created:', response);
      this.showAddUserModal.set(false);
      this.resetUserForm();
      this.loadData(); // Reload data
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  async createPlan() {
    try {
      const planData = {
        ...this.newPlan,
        priceCents: this.newPlan.price * 100,
        interval: 'monthly',
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
      professor: '',
      departmentId: '',
      semester: 'S1',
      isPremium: false
    };
  }

  resetUserForm() {
    this.newUser = {
      name: '',
      email: '',
      password: '',
      role: 'student'
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
}
