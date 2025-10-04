import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface AdminStat {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: Date;
  status: 'active' | 'inactive' | 'banned';
}

interface RecentCourse {
  id: string;
  title: string;
  professor: string;
  students: number;
  rating: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: Date;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Administration</h1>
              <p class="text-gray-600 mt-1">Gérez votre plateforme d'apprentissage</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {{ authService.getInitials() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div *ngFor="let stat of adminStats()" class="card p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                     [class]="getStatIconClass(stat.changeType)">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="stat.icon"/>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">{{ stat.title }}</p>
                <p class="text-2xl font-semibold text-gray-900">{{ stat.value }}</p>
                <p class="text-sm" [class]="getStatChangeClass(stat.changeType)">
                  {{ stat.change }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Recent Users -->
          <div class="card">
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Utilisateurs récents</h2>
                <a href="#" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Voir tout</a>
              </div>
            </div>
            <div class="p-6">
              <div *ngIf="recentUsers().length === 0" class="text-center py-8">
                <p class="text-gray-500">Aucun utilisateur récent</p>
              </div>
              <div *ngFor="let user of recentUsers()" class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-600">
                      {{ getUserInitials(user.name) }}
                    </span>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
                    <p class="text-sm text-gray-500">{{ user.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [class]="getUserStatusClass(user.status)">
                    {{ user.status }}
                  </span>
                  <span class="text-xs text-gray-500">{{ formatDate(user.lastActive) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Courses -->
          <div class="card">
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Cours récents</h2>
                <a href="#" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Voir tout</a>
              </div>
            </div>
            <div class="p-6">
              <div *ngIf="recentCourses().length === 0" class="text-center py-8">
                <p class="text-gray-500">Aucun cours récent</p>
              </div>
              <div *ngFor="let course of recentCourses()" class="py-3 border-b border-gray-100 last:border-b-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-gray-900 truncate">{{ course.title }}</h3>
                    <p class="text-sm text-gray-500">{{ course.professor }}</p>
                    <div class="flex items-center gap-4 mt-1">
                      <span class="text-xs text-gray-500">{{ course.students }} étudiants</span>
                      <div class="flex items-center">
                        <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span class="text-xs text-gray-500 ml-1">{{ course.rating }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          [class]="getCourseStatusClass(course.status)">
                      {{ course.status }}
                    </span>
                    <span class="text-xs text-gray-500">{{ formatDate(course.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
          <div class="card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Nouveau cours</p>
                  <p class="text-sm text-gray-600">Créer un cours</p>
                </div>
              </button>

              <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Gérer utilisateurs</p>
                  <p class="text-sm text-gray-600">Voir tous les utilisateurs</p>
                </div>
              </button>

              <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Analytics</p>
                  <p class="text-sm text-gray-600">Voir les statistiques</p>
                </div>
              </button>

              <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Paramètres</p>
                  <p class="text-sm text-gray-600">Configuration système</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent {
  adminStats = signal<AdminStat[]>([
    {
      title: 'Utilisateurs actifs',
      value: '1,234',
      change: '+12% ce mois',
      changeType: 'positive',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
    },
    {
      title: 'Cours publiés',
      value: '89',
      change: '+5 cette semaine',
      changeType: 'positive',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    },
    {
      title: 'Revenus mensuels',
      value: '€12,450',
      change: '+8% ce mois',
      changeType: 'positive',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
    },
    {
      title: 'Taux de complétion',
      value: '78%',
      change: '+3% ce mois',
      changeType: 'positive',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ]);

  recentUsers = signal<RecentUser[]>([
    {
      id: '1',
      name: 'Ahmed Benali',
      email: 'ahmed.benali@email.com',
      role: 'Étudiant',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: '2',
      name: 'Fatima Zahra',
      email: 'fatima.zahra@email.com',
      role: 'Professeur',
      lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: '3',
      name: 'Omar Alami',
      email: 'omar.alami@email.com',
      role: 'Étudiant',
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'inactive'
    }
  ]);

  recentCourses = signal<RecentCourse[]>([
    {
      id: '1',
      title: 'Introduction à l\'Algorithmique',
      professor: 'Prof. Jean Dupont',
      students: 156,
      rating: 4.8,
      status: 'published',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Analyse Mathématique Avancée',
      professor: 'Prof. Marie Curie',
      students: 89,
      rating: 4.6,
      status: 'draft',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Logique et Théorie des Ensembles',
      professor: 'Prof. Pierre Fermat',
      students: 203,
      rating: 4.9,
      status: 'published',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ]);

  constructor(public authService: AuthService) {}

  getStatIconClass(changeType: string): string {
    switch (changeType) {
      case 'positive':
        return 'bg-green-100 text-green-600';
      case 'negative':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getStatChangeClass(changeType: string): string {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getUserStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCourseStatusClass(status: string): string {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a quelques minutes';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  }
}