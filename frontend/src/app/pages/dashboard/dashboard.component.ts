import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface CourseProgress {
  id: string;
  title: string;
  professor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: Date;
  thumbnail: string;
  type: 'video' | 'pdf' | 'quiz';
}

interface RecentActivity {
  id: string;
  type: 'course_started' | 'lesson_completed' | 'quiz_passed' | 'course_completed';
  title: string;
  timestamp: Date;
  courseId: string;
}

interface StudyStats {
  totalHours: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
                Bonjour, {{ authService.getDisplayName() }} 👋
              </h1>
              <p class="mt-1 text-sm text-gray-600">
                {{ getGreeting() }} • {{ getCurrentDate() }}
              </p>
            </div>
            <div class="mt-4 sm:mt-0 flex items-center gap-4">
              <!-- Subscription Status -->
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class]="authService.isPremium() ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'">
                  {{ authService.isPremium() ? 'Premium' : 'Gratuit' }}
                </span>
                <button *ngIf="!authService.isPremium()" 
                        routerLink="/subscription"
                        class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Passer à Premium
                </button>
              </div>
              
              <!-- User Avatar -->
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {{ authService.getInitials() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="card p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Temps d'étude</p>
                <p class="text-2xl font-semibold text-gray-900">{{ studyStats().totalHours }}h</p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Cours terminés</p>
                <p class="text-2xl font-semibold text-gray-900">{{ studyStats().coursesCompleted }}</p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Leçons terminées</p>
                <p class="text-2xl font-semibold text-gray-900">{{ studyStats().lessonsCompleted }}</p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Série actuelle</p>
                <p class="text-2xl font-semibold text-gray-900">{{ studyStats().currentStreak }} jours</p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Continue Learning -->
          <div class="lg:col-span-2">
            <div class="card">
              <div class="p-6 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Continuer l'apprentissage</h2>
                <p class="text-sm text-gray-600 mt-1">Reprenez où vous vous êtes arrêté</p>
              </div>
              <div class="p-6">
                <div *ngIf="courseProgress().length === 0" class="text-center py-8">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <p class="text-gray-500 mb-4">Aucun cours en cours</p>
                  <a routerLink="/catalog" class="inline-flex items-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
                    Découvrir les cours
                  </a>
                </div>
                
                <div *ngFor="let course of courseProgress()" class="mb-6 last:mb-0">
                  <div class="flex items-start gap-4">
                    <div class="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-lg font-medium text-gray-900 mb-1">{{ course.title }}</h3>
                      <p class="text-sm text-gray-600 mb-2">{{ course.professor }}</p>
                      <div class="flex items-center gap-4 text-sm text-gray-500">
                        <span>{{ course.completedLessons }}/{{ course.totalLessons }} leçons</span>
                        <span>Dernière fois: {{ formatDate(course.lastAccessed) }}</span>
                      </div>
                      <div class="mt-3">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-blue-600 h-2 rounded-full" [style.width.%]="course.progress"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">{{ course.progress }}% complété</p>
                      </div>
                      <div class="mt-3">
                        <a [routerLink]="['/course', course.id]" 
                           class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                          Continuer le cours
                          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="lg:col-span-1">
            <div class="card">
              <div class="p-6 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Activité récente</h2>
              </div>
              <div class="p-6">
                <div *ngIf="recentActivity().length === 0" class="text-center py-4">
                  <p class="text-gray-500 text-sm">Aucune activité récente</p>
                </div>
                
                <div *ngFor="let activity of recentActivity()" class="flex items-start gap-3 mb-4 last:mb-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                       [class]="getActivityIconClass(activity.type)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path *ngIf="activity.type === 'course_started'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      <path *ngIf="activity.type === 'lesson_completed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      <path *ngIf="activity.type === 'quiz_passed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      <path *ngIf="activity.type === 'course_completed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">{{ activity.title }}</p>
                    <p class="text-xs text-gray-500">{{ formatDate(activity.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
          <div class="card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a routerLink="/catalog" 
                 class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Explorer les cours</p>
                  <p class="text-sm text-gray-600">Découvrir de nouveaux contenus</p>
                </div>
              </a>

              <a routerLink="/subscription" 
                 class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Abonnement</p>
                  <p class="text-sm text-gray-600">Gérer votre abonnement</p>
                </div>
              </a>

              <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Mes notes</p>
                  <p class="text-sm text-gray-600">Consulter vos notes</p>
                </div>
              </button>

              <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Paramètres</p>
                  <p class="text-sm text-gray-600">Personnaliser votre compte</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  courseProgress = signal<CourseProgress[]>([]);
  recentActivity = signal<RecentActivity[]>([]);
  studyStats = signal<StudyStats>({
    totalHours: 0,
    coursesCompleted: 0,
    lessonsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0
  });

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Mock data - in real app, this would come from API
    this.courseProgress.set([
      {
        id: '1',
        title: 'Introduction à l\'Algorithmique',
        professor: 'Prof. Jean Dupont',
        progress: 65,
        totalLessons: 15,
        completedLessons: 10,
        lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        thumbnail: '',
        type: 'video'
      },
      {
        id: '2',
        title: 'Analyse Mathématique',
        professor: 'Prof. Marie Curie',
        progress: 30,
        totalLessons: 12,
        completedLessons: 4,
        lastAccessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        thumbnail: '',
        type: 'video'
      }
    ]);

    this.recentActivity.set([
      {
        id: '1',
        type: 'lesson_completed',
        title: 'Leçon 5: Structures de contrôle terminée',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        courseId: '1'
      },
      {
        id: '2',
        type: 'quiz_passed',
        title: 'Quiz: Variables et types de données réussi',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        courseId: '1'
      },
      {
        id: '3',
        type: 'course_started',
        title: 'Nouveau cours: Analyse Mathématique',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        courseId: '2'
      }
    ]);

    this.studyStats.set({
      totalHours: 24,
      coursesCompleted: 2,
      lessonsCompleted: 18,
      currentStreak: 5,
      longestStreak: 12
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a quelques minutes';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'course_started':
        return 'bg-blue-100 text-blue-600';
      case 'lesson_completed':
        return 'bg-green-100 text-green-600';
      case 'quiz_passed':
        return 'bg-purple-100 text-purple-600';
      case 'course_completed':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
}