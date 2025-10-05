import { Component, signal, OnInit } from '@angular/core';
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
  type: 'video' | 'pdf' | 'exam';
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
                {{ isAdmin() ? 'Tableau de bord administrateur' : 'Mon tableau de bord' }}
              </h1>
              <p class="mt-1 text-sm text-gray-600">
                {{ getGreeting() }} • {{ getCurrentDate() }}
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    [class]="getRoleBadgeClass()">
                {{ getRoleLabel() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Admin Dashboard -->
        <div *ngIf="isAdmin()" class="space-y-8">
          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Cours</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ platformStats().totalCourses }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ platformStats().totalUsers }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Leçons</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ platformStats().totalLessons }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Abonnements actifs</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ platformStats().activeSubscriptions }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Platform Management Actions -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Gestion de la plateforme</h2>
              <p class="text-sm text-gray-600 mt-1">Gérez le contenu et les utilisateurs</p>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a routerLink="/admin"
                   class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">Panneau d'administration</h3>
                    <p class="text-sm text-gray-600">Gérer utilisateurs, cours, leçons</p>
                  </div>
                </a>

                <a routerLink="/admin"
                   class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">Téléverser vidéos</h3>
                    <p class="text-sm text-gray-600">Ajouter des leçons vidéo</p>
                  </div>
                </a>

                <a routerLink="/admin"
                   class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">Statistiques</h3>
                    <p class="text-sm text-gray-600">Analyses et rapports</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- Recent Platform Activity -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Activité récente de la plateforme</h2>
              <p class="text-sm text-gray-600 mt-1">Dernières actions des utilisateurs</p>
            </div>
            <div class="p-6">
              <div class="text-center py-8">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-gray-500">Aucune activité récente</p>
                <p class="text-sm text-gray-400 mt-1">L'activité apparaîtra ici une fois que les utilisateurs commenceront à utiliser la plateforme</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Dashboard -->
        <div *ngIf="!isAdmin()" class="space-y-8">
          <!-- Study Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Heures d'étude</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ studyStats().totalHours }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Cours terminés</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ studyStats().coursesCompleted }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Leçons terminées</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ studyStats().lessonsCompleted }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
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

          <!-- Continue Learning -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
              <div class="bg-white rounded-lg shadow">
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
              <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                  <h2 class="text-lg font-semibold text-gray-900">Activité récente</h2>
                  <p class="text-sm text-gray-600 mt-1">Vos dernières actions</p>
                </div>
                <div class="p-6">
                  <div *ngIf="recentActivity().length === 0" class="text-center py-8">
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-gray-500">Aucune activité récente</p>
                    <p class="text-sm text-gray-400 mt-1">Votre activité apparaîtra ici</p>
                  </div>

                  <div *ngFor="let activity of recentActivity()" class="mb-4 last:mb-0">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0">
                        <div [class]="getActivityIconClass(activity.type)">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path *ngIf="activity.type === 'course_started'" d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path *ngIf="activity.type === 'course_started'" d="M19.707 9.293a1 1 0 00-1.414 0l-1.586 1.586a1 1 0 01-1.414 0l-1.586-1.586a1 1 0 000-1.414l1.586-1.586a1 1 0 011.414 0l1.586 1.586a1 1 0 000 1.414z"/>
                            <path *ngIf="activity.type === 'lesson_completed'" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                            <path *ngIf="activity.type === 'quiz_passed'" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                          </svg>
                        </div>
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

  // Admin specific data
  platformStats = signal({
    totalUsers: 0,
    totalCourses: 0,
    totalLessons: 0,
    activeSubscriptions: 0
  });

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  isAdmin(): boolean {
    const user = this.authService.user();
    return user?.role === 'admin' || user?.role === 'superadmin';
  }

  getRoleLabel(): string {
    const user = this.authService.user();
    if (!user) return 'Utilisateur';

    switch (user.role) {
      case 'admin': return 'Administrateur';
      case 'superadmin': return 'Super Administrateur';
      case 'student': return 'Étudiant';
      default: return 'Utilisateur';
    }
  }

  getRoleBadgeClass(): string {
    const user = this.authService.user();
    if (!user) return 'bg-gray-100 text-gray-800';

    switch (user.role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'superadmin': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  private loadDashboardData() {
    const user = this.authService.user();

    if (user?.role === 'admin' || user?.role === 'superadmin') {
      // Admin dashboard data
      this.loadAdminDashboardData();
    } else {
      // Student dashboard data
      this.loadStudentDashboardData();
    }
  }

  private loadAdminDashboardData() {
    // Load platform statistics for admin
    this.platformStats.set({
      totalUsers: 1250,
      totalCourses: 45,
      totalLessons: 320,
      activeSubscriptions: 890
    });

    // Admin doesn't need course progress or study stats
    this.courseProgress.set([]);
    this.recentActivity.set([]);
    this.studyStats.set({
      totalHours: 0,
      coursesCompleted: 0,
      lessonsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0
    });
  }

  private loadStudentDashboardData() {
    // For new users, show empty data
    this.courseProgress.set([]);
    this.recentActivity.set([]);
    this.studyStats.set({
      totalHours: 0,
      coursesCompleted: 0,
      lessonsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0
    });

    // Load real student data when available
    this.loadStudentProgress();
  }

  private loadStudentProgress() {
    // This would load real student progress data from API
    // For now, keeping it empty for new users
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
        return 'w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600';
      case 'lesson_completed':
        return 'w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600';
      case 'quiz_passed':
        return 'w-8 h-8 rounded-full flex items-center justify-center bg-yellow-100 text-yellow-600';
      case 'course_completed':
        return 'w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600';
      default:
        return 'w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600';
    }
  }
}