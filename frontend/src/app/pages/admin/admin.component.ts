import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AdminContentService, SubjectWithStats, ChapterWithStats, Question } from '../../services/admin-content.service';
import { environment } from '../../../environments/environment';
// Force Vercel rebuild - 2025-11-05

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
  role: 'student' | 'admin' | 'superadmin' | 'STUDENT' | 'ADMIN' | 'SUPERADMIN';
  department?: string;
  semester?: number;
  createdAt: string;
  lastLoginAt?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Administration</h1>
              <p class="text-sm text-gray-600">Gérez votre plateforme éducative</p>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500">Connecté en tant que {{ getDisplayName() }}</span>
              <button (click)="logout()"
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Navigation Tabs -->
        <div class="mb-8">
          <nav class="flex space-x-8">
            <button *ngFor="let tab of tabs"
                    (click)="activeTab.set(tab.id)"
                    [class]="activeTab() === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                    class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <!-- Overview Dashboard -->
        <div *ngIf="activeTab() === 'overview'" class="space-y-6">
          <h2 class="text-xl font-semibold text-gray-900">Vue d'ensemble de la plateforme</h2>
          
          <!-- Key Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Courses -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-600">Total Cours</p>
                  <p class="text-3xl font-bold text-blue-900">{{ stats().totalCourses }}</p>
                  <p class="text-xs text-blue-500 mt-1">+12% ce mois</p>
                </div>
                <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
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
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalUsers }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
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
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalLessons }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Abonnements Actifs</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().activeSubscriptions }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Activité récente</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <div class="flex items-center">
                  <div class="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span class="text-sm text-gray-600">Nouvel utilisateur inscrit</span>
                </div>
                <span class="text-xs text-gray-500">Il y a 2 heures</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <div class="flex items-center">
                  <div class="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span class="text-sm text-gray-600">Nouvelle leçon ajoutée</span>
                </div>
                <span class="text-xs text-gray-500">Il y a 4 heures</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center">
                  <div class="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span class="text-sm text-gray-600">Nouvel abonnement activé</span>
                </div>
                <span class="text-xs text-gray-500">Il y a 6 heures</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Badges Management -->
        <div *ngIf="activeTab() === 'badges'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Badges</h2>
            <button (click)="loadBadgesData()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Rafraichir
            </button>
          </div>

          <!-- Loading -->
          <div *ngIf="badgesLoading()" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Chargement...</p>
          </div>

          <!-- Message -->
          <div *ngIf="badgeMessage()"
               [class]="badgeMessage()?.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'"
               class="border px-4 py-3 rounded relative">
            {{ badgeMessage()?.text }}
          </div>

          <!-- Section 1: Create Badge -->
          <div *ngIf="!badgesLoading()" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Creer un Badge</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Image Upload -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Image du Badge</label>
                <div class="flex items-center gap-4">
                  <div class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                    <img *ngIf="newBadgeImagePreview()" [src]="newBadgeImagePreview()" class="w-full h-full object-cover" />
                    <span *ngIf="!newBadgeImagePreview()" class="text-gray-400 text-3xl">+</span>
                  </div>
                  <div>
                    <input type="file" accept="image/*" (change)="onBadgeImageSelected($event)" class="hidden" #badgeImageInput />
                    <button (click)="badgeImageInput.click()"
                            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                      Choisir une image
                    </button>
                    <p class="text-xs text-gray-500 mt-1">PNG, JPG (max 5MB)</p>
                  </div>
                </div>
              </div>
              <!-- Badge Info -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nom du Badge</label>
                  <input type="text" [(ngModel)]="newBadgeName"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         placeholder="Ex: Major de Promo" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" [(ngModel)]="newBadgeDescription"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         placeholder="Ex: Premier de la promotion" />
                </div>
                <button (click)="createBadge()"
                        [disabled]="!newBadgeName || !newBadgeDescription || badgeCreating()"
                        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {{ badgeCreating() ? 'Creation...' : 'Creer le Badge' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Section 2: Existing Badges -->
          <div *ngIf="!badgesLoading()" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Badges Existants</h3>
            <div *ngIf="allBadges().length === 0" class="text-gray-500 text-center py-4">
              Aucun badge cree pour le moment
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div *ngFor="let badge of allBadges()"
                   class="relative p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <button (click)="deleteBadge(badge.id, badge.name)"
                        class="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full hover:bg-red-200 flex items-center justify-center text-xs">
                  X
                </button>
                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                    <img *ngIf="badge.iconUrl" [src]="badge.iconUrl" class="w-full h-full object-cover" />
                    <span *ngIf="!badge.iconUrl" class="text-2xl">🏆</span>
                  </div>
                  <p class="font-medium text-gray-900 text-center text-sm">{{ badge.name }}</p>
                  <p class="text-xs text-gray-500 text-center">{{ badge.description }}</p>
                  <p class="text-xs text-blue-600 mt-1">{{ badge.usersCount }} utilisateur(s)</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Top 3 by Semester -->
          <div *ngIf="!badgesLoading()" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Top 3 par Niveau - Attribution de Badges</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- PCEM1 -->
              <div class="border border-blue-200 rounded-lg p-4">
                <h4 class="text-md font-semibold text-blue-600 mb-3 flex items-center">
                  <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  PCEM1 - Top 3
                </h4>
                <div class="space-y-3">
                  <div *ngFor="let student of majorsBySemester()?.['PCEM1'] || []; let i = index"
                       class="flex items-center justify-between p-3 rounded-lg"
                       [class]="i === 0 ? 'bg-yellow-50 border border-yellow-200' : i === 1 ? 'bg-gray-100' : 'bg-orange-50'">
                    <div class="flex items-center">
                      <span class="text-xl mr-2">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉' }}</span>
                      <img *ngIf="student.profilePicture" [src]="student.profilePicture" class="w-8 h-8 rounded-full mr-2 object-cover" />
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ student.name }}</p>
                        <p class="text-xs text-gray-500">{{ student.xpTotal }} XP</p>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <select [(ngModel)]="selectedBadgeForStudent[student.id]"
                              class="text-xs px-2 py-1 border border-gray-300 rounded">
                        <option value="">Choisir badge</option>
                        <option *ngFor="let badge of allBadges()" [value]="badge.id">{{ badge.name }}</option>
                      </select>
                      <button *ngIf="selectedBadgeForStudent[student.id]"
                              (click)="assignBadge(student.id, selectedBadgeForStudent[student.id])"
                              class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                        Attribuer
                      </button>
                    </div>
                  </div>
                  <p *ngIf="!majorsBySemester()?.['PCEM1']?.length" class="text-gray-500 text-center py-2 text-sm">
                    Aucun etudiant PCEM1
                  </p>
                </div>
              </div>

              <!-- PCEM2 -->
              <div class="border border-green-200 rounded-lg p-4">
                <h4 class="text-md font-semibold text-green-600 mb-3 flex items-center">
                  <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  PCEM2 - Top 3
                </h4>
                <div class="space-y-3">
                  <div *ngFor="let student of majorsBySemester()?.['PCEM2'] || []; let i = index"
                       class="flex items-center justify-between p-3 rounded-lg"
                       [class]="i === 0 ? 'bg-yellow-50 border border-yellow-200' : i === 1 ? 'bg-gray-100' : 'bg-orange-50'">
                    <div class="flex items-center">
                      <span class="text-xl mr-2">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉' }}</span>
                      <img *ngIf="student.profilePicture" [src]="student.profilePicture" class="w-8 h-8 rounded-full mr-2 object-cover" />
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ student.name }}</p>
                        <p class="text-xs text-gray-500">{{ student.xpTotal }} XP</p>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <select [(ngModel)]="selectedBadgeForStudent[student.id]"
                              class="text-xs px-2 py-1 border border-gray-300 rounded">
                        <option value="">Choisir badge</option>
                        <option *ngFor="let badge of allBadges()" [value]="badge.id">{{ badge.name }}</option>
                      </select>
                      <button *ngIf="selectedBadgeForStudent[student.id]"
                              (click)="assignBadge(student.id, selectedBadgeForStudent[student.id])"
                              class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                        Attribuer
                      </button>
                    </div>
                  </div>
                  <p *ngIf="!majorsBySemester()?.['PCEM2']?.length" class="text-gray-500 text-center py-2 text-sm">
                    Aucun etudiant PCEM2
                  </p>
                </div>
              </div>

              <!-- DCEM1 -->
              <div class="border border-purple-200 rounded-lg p-4">
                <h4 class="text-md font-semibold text-purple-600 mb-3 flex items-center">
                  <span class="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  DCEM1 - Top 3
                </h4>
                <div class="space-y-3">
                  <div *ngFor="let student of majorsBySemester()?.['DCEM1'] || []; let i = index"
                       class="flex items-center justify-between p-3 rounded-lg"
                       [class]="i === 0 ? 'bg-yellow-50 border border-yellow-200' : i === 1 ? 'bg-gray-100' : 'bg-orange-50'">
                    <div class="flex items-center">
                      <span class="text-xl mr-2">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉' }}</span>
                      <img *ngIf="student.profilePicture" [src]="student.profilePicture" class="w-8 h-8 rounded-full mr-2 object-cover" />
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ student.name }}</p>
                        <p class="text-xs text-gray-500">{{ student.xpTotal }} XP</p>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <select [(ngModel)]="selectedBadgeForStudent[student.id]"
                              class="text-xs px-2 py-1 border border-gray-300 rounded">
                        <option value="">Choisir badge</option>
                        <option *ngFor="let badge of allBadges()" [value]="badge.id">{{ badge.name }}</option>
                      </select>
                      <button *ngIf="selectedBadgeForStudent[student.id]"
                              (click)="assignBadge(student.id, selectedBadgeForStudent[student.id])"
                              class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                        Attribuer
                      </button>
                    </div>
                  </div>
                  <p *ngIf="!majorsBySemester()?.['DCEM1']?.length" class="text-gray-500 text-center py-2 text-sm">
                    Aucun etudiant DCEM1
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Current Badge Holders -->
          <div *ngIf="!badgesLoading()" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Detenteurs de Badges</h3>
            <div *ngIf="badgeHolders().length === 0" class="text-gray-500 text-center py-4">
              Aucun badge attribue pour le moment
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let holder of badgeHolders()"
                   class="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mr-3">
                    <img *ngIf="holder.badgeIconUrl" [src]="holder.badgeIconUrl" class="w-full h-full object-cover" />
                    <span *ngIf="!holder.badgeIconUrl" class="text-xl">🏆</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">{{ holder.user.name }}</p>
                    <p class="text-xs text-gray-500">{{ holder.badgeName }}</p>
                  </div>
                </div>
                <button (click)="revokeBadge(holder.user.id, holder.badgeId)"
                        class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscription Management -->
        <div *ngIf="activeTab() === 'subscriptions'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Abonnements</h2>
            <button (click)="showAddPlanModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ajouter un plan
            </button>
          </div>

          <!-- Subscription Plans -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Vidéos Seulement</h3>
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Actif</span>
              </div>
              <div class="mb-4">
                <span class="text-3xl font-bold text-gray-900">650</span>
                <span class="text-gray-600"> MRU/an</span>
              </div>
              <p class="text-sm text-gray-600 mb-4">Accès à toutes les vidéos de solutions d'examens</p>
              <div class="flex space-x-2">
                <button class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Modifier
                </button>
                <button class="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  Désactiver
                </button>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Documents Seulement</h3>
                <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Actif</span>
              </div>
              <div class="mb-4">
                <span class="text-3xl font-bold text-gray-900">500</span>
                <span class="text-gray-600"> MRU/an</span>
              </div>
              <p class="text-sm text-gray-600 mb-4">Accès à tous les documents PDF et solutions écrites</p>
              <div class="flex space-x-2">
                <button class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Modifier
                </button>
                <button class="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  Désactiver
                </button>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Accès Complet</h3>
                <span class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Actif</span>
              </div>
              <div class="mb-4">
                <span class="text-3xl font-bold text-gray-900">1000</span>
                <span class="text-gray-600"> MRU/an</span>
              </div>
              <p class="text-sm text-gray-600 mb-4">Accès à toutes les vidéos ET documents</p>
              <div class="flex space-x-2">
                <button class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Modifier
                </button>
                <button class="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  Désactiver
                </button>
              </div>
            </div>
          </div>

          <!-- Active Subscriptions -->
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Abonnements actifs</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Début</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Étudiant Test</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Vidéos Seulement</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Actif
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">01/01/2024</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">01/01/2025</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button class="text-blue-600 hover:text-blue-900 mr-3">Voir</button>
                      <button class="text-red-600 hover:text-red-900">Annuler</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- QCM Management -->
        <div *ngIf="activeTab() === 'qcm'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des QCM</h2>
            <button (click)="showAddSubjectModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Ajouter une matière
            </button>
          </div>

          <!-- Selection Interface -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Subject Selection -->
            <div class="bg-white rounded-lg shadow p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Matière</label>
              <select [(ngModel)]="selectedQcmSubject"
                      (change)="onQcmSubjectChange()"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Sélectionner une matière</option>
                <option *ngFor="let subject of qcmSubjects()" [value]="subject.id">
                  {{ subject.title }} - {{ subject.semester }}
                </option>
              </select>
            </div>

            <!-- Chapter Selection -->
            <div class="bg-white rounded-lg shadow p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Chapitre</label>
              <select [(ngModel)]="selectedQcmChapter"
                      (change)="onQcmChapterChange()"
                      [disabled]="!selectedQcmSubject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100">
                <option value="">Sélectionner un chapitre</option>
                <option *ngFor="let chapter of qcmChapters()" [value]="chapter.id">
                  {{ chapter.title }}
                </option>
              </select>
            </div>

            <!-- Question Selection -->
            <div class="bg-white rounded-lg shadow p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <select [(ngModel)]="selectedQcmQuestion"
                      (change)="onQcmQuestionChange()"
                      [disabled]="!selectedQcmChapter"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100">
                <option value="">Sélectionner une question</option>
                <option *ngFor="let question of qcmQuestions()" [value]="question.id">
                  Question {{ question.orderIndex + 1 }}
                </option>
              </select>
            </div>
          </div>

          <!-- Question Edit Form -->
          <div *ngIf="selectedQcmQuestionData()" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Éditer la Question {{ (selectedQcmQuestionData()?.orderIndex || 0) + 1 }}</h3>

            <!-- Question Text -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Texte de la question</label>
              <textarea [(ngModel)]="qcmFormData.questionText"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Entrez le texte de la question"></textarea>
            </div>

            <!-- Options -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Options</label>
              <div class="space-y-4">
                <div *ngFor="let option of qcmFormData.options; let i = index" class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start gap-4">
                    <!-- Option Letter -->
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold">
                      {{ String.fromCharCode(65 + i) }}
                    </div>

                    <div class="flex-1 space-y-3">
                      <!-- Option Text -->
                      <input type="text"
                             [(ngModel)]="option.text"
                             class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             placeholder="Texte de l'option">

                      <!-- Is Correct Checkbox -->
                      <label class="flex items-center gap-2">
                        <input type="checkbox"
                               [(ngModel)]="option.isCorrect"
                               class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                        <span class="text-sm text-gray-700">Option correcte</span>
                      </label>

                      <!-- Justification -->
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Justification (optionnel)</label>
                        <input type="text"
                               [(ngModel)]="option.justification"
                               class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="Justification pour cette option">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Explanation -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Explication générale (optionnel)</label>
              <textarea [(ngModel)]="qcmFormData.explanation"
                        rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Explication générale de la question"></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button (click)="saveQcmQuestion()"
                      [disabled]="qcmSaving()"
                      class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                {{ qcmSaving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
              <button (click)="cancelQcmEdit()"
                      [disabled]="qcmSaving()"
                      class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100">
                Annuler
              </button>
            </div>

            <!-- Success/Error Messages -->
            <div *ngIf="qcmSuccessMessage()" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-800">✓ {{ qcmSuccessMessage() }}</p>
            </div>
            <div *ngIf="qcmErrorMessage()" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-800">✗ {{ qcmErrorMessage() }}</p>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!selectedQcmQuestionData()" class="bg-white rounded-lg shadow p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Aucune question sélectionnée</h3>
            <p class="mt-1 text-sm text-gray-500">Sélectionnez une matière, un chapitre et une question pour commencer l'édition.</p>
          </div>
        </div>

        <!-- Import Subject Complete -->
        <div *ngIf="activeTab() === 'import-subject'" class="space-y-6">
          <h2 class="text-xl font-semibold text-gray-900">Importer une Matière Complète</h2>

          <!-- Instructions -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-medium text-blue-900 mb-3">📚 Instructions d'import</h3>
            <p class="text-sm text-blue-800 mb-3">
              Utilisez cette interface pour importer une matière complète avec tous ses chapitres et questions en une seule fois.
            </p>
            <p class="text-sm text-blue-800 mb-2"><strong>Format JSON requis :</strong></p>
            <ul class="list-disc list-inside text-sm text-blue-700 space-y-1 ml-4">
              <li><strong>subject</strong> : Informations sur la matière (title, description, semester, totalQCM)</li>
              <li><strong>chapters</strong> : Tableau de chapitres avec leurs questions</li>
              <li><strong>questions</strong> : Chaque chapitre contient un tableau de questions avec options</li>
            </ul>
          </div>

          <!-- Example JSON -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Exemple de format JSON</h3>
              <button (click)="importSubjectJson = getExampleJson()"
                      class="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                Copier l'exemple
              </button>
            </div>
            <pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs text-gray-800 border border-gray-200">{{ getExampleJson() }}</pre>
          </div>

          <!-- JSON Input Form -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Entrez vos données JSON</h3>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Données JSON de la matière complète
              </label>
              <textarea [(ngModel)]="importSubjectJson"
                        rows="15"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder='{"subject": {...}, "chapters": [...]}'></textarea>
              <p class="text-xs text-gray-500 mt-2">
                Assurez-vous que le JSON est valide avant d'importer
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button (click)="importSubjectComplete()"
                      [disabled]="importSubjectLoading()"
                      class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium">
                {{ importSubjectLoading() ? 'Importation en cours...' : 'Importer la Matière' }}
              </button>
              <button (click)="importSubjectJson = ''"
                      [disabled]="importSubjectLoading()"
                      class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100">
                Effacer
              </button>
            </div>

            <!-- Success Message -->
            <div *ngIf="importSubjectSuccess()" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm text-green-800">{{ importSubjectSuccess() }}</p>
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="importSubjectError()" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm text-red-800">{{ importSubjectError() }}</p>
              </div>
            </div>
          </div>

          <!-- Tips -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 class="text-lg font-medium text-yellow-900 mb-3">💡 Conseils</h3>
            <ul class="list-disc list-inside text-sm text-yellow-800 space-y-2 ml-4">
              <li>Vérifiez que toutes les questions ont au moins une option correcte (isCorrect: true)</li>
              <li>Les justifications sont optionnelles mais recommandées pour enrichir l'apprentissage</li>
              <li>Le champ "semester" doit être "PCEM1", "PCEM2" ou "DCEM1"</li>
              <li>L'orderIndex détermine l'ordre d'affichage des chapitres et questions</li>
              <li>Le totalQCM est optionnel (valeur par défaut : 600)</li>
            </ul>
          </div>
        </div>

        <!-- Departments Management -->
        <div *ngIf="activeTab() === 'departments'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Départements</h2>
            <button (click)="showAddDepartmentModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ajouter un département
            </button>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateurs</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let dept of departments()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ dept.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ dept.courseCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ dept.userCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editDepartment(dept)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteDepartment(dept.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Courses Management -->
        <div *ngIf="activeTab() === 'courses'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Cours</h2>
            <button (click)="showAddCourseModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ajouter un cours
            </button>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professeur</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let course of courses()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ course.title }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ course.professor }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ course.department }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="course.isPremium ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ course.isPremium ? 'Premium' : 'Gratuit' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editCourse(course)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteCourse(course.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Lessons Management -->
        <div *ngIf="activeTab() === 'lessons'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Leçons</h2>
            <button (click)="showAddLessonModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ajouter une leçon
            </button>
          </div>

          <!-- Course Filter -->
          <div class="flex gap-4 items-center">
            <select [(ngModel)]="selectedCourseId" (change)="loadLessons()"
                    class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les cours</option>
              <option *ngFor="let course of courses()" [value]="course.id">{{ course.title }}</option>
            </select>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let lesson of lessons()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ lesson.title }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span [class]="getLessonTypeClass(lesson.type)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ getLessonTypeLabel(lesson.type) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDuration(lesson.durationSec) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ getCourseTitle(lesson.courseId) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editLesson(lesson)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteLesson(lesson.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users Management -->
        <div *ngIf="activeTab() === 'users'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h2>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let user of users()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getRoleClass(user.role)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.department || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editUser(user)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteUser(user.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Statistics -->
        <div *ngIf="activeTab() === 'stats'" class="space-y-6">
          <h2 class="text-xl font-semibold text-gray-900">Statistiques de la Plateforme</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
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
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalCourses }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
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
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalUsers }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
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
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalLessons }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Abonnements Actifs</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().activeSubscriptions }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Content Management Tab -->
        <div *ngIf="activeTab() === 'content-management'" class="space-y-6">
          <!-- Message -->
          <div *ngIf="contentMessage()"
               [class]="contentMessage()?.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'"
               class="p-4 border rounded-lg">
            {{ contentMessage()?.text }}
          </div>

          <!-- Loading -->
          <div *ngIf="contentLoading()" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- Breadcrumb Navigation -->
          <div class="flex items-center gap-2 text-sm">
            <button (click)="backToSubjects()"
                    [class]="!selectedContentSubject() ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-600'"
                    class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
              Matières
            </button>
            <span *ngIf="selectedContentSubject()" class="text-gray-400">/</span>
            <button *ngIf="selectedContentSubject()" (click)="backToChapters()"
                    [class]="!selectedContentChapter() ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-600'">
              {{ selectedContentSubject()?.title }}
            </button>
            <span *ngIf="selectedContentChapter()" class="text-gray-400">/</span>
            <span *ngIf="selectedContentChapter()" class="text-blue-600 font-semibold">
              {{ selectedContentChapter()?.title }}
            </span>
          </div>

          <!-- Subjects List -->
          <div *ngIf="!selectedContentSubject()" class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Matières</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let subject of contentSubjects()"
                   class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex-1 cursor-pointer" (click)="selectContentSubject(subject)">
                    <h3 class="font-semibold text-gray-900">{{ subject.title }}</h3>
                    <p class="text-sm text-gray-500">{{ subject.semester }}</p>
                  </div>
                  <div class="flex gap-1">
                    <button (click)="openEditSubject(subject)"
                            class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Modifier">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="deleteContentSubject(subject)"
                            class="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="flex gap-4 text-xs text-gray-500">
                  <span>{{ subject.chaptersCount }} chapitres</span>
                  <span>{{ subject.questionsCount }} questions</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chapters List -->
          <div *ngIf="selectedContentSubject() && !selectedContentChapter()" class="space-y-4">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-gray-900">Chapitres de {{ selectedContentSubject()?.title }}</h2>
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr *ngFor="let chapter of contentChapters(); let i = index" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-500">{{ i + 1 }}</td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                        (click)="selectContentChapter(chapter)">
                      {{ chapter.title }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ chapter.questionsCount }}</td>
                    <td class="px-4 py-3 text-sm">
                      <div class="flex gap-2">
                        <button (click)="selectContentChapter(chapter)"
                                class="text-blue-600 hover:text-blue-800" title="Voir questions">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        <button (click)="openEditChapter(chapter)"
                                class="text-green-600 hover:text-green-800" title="Modifier">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button (click)="deleteContentChapter(chapter)"
                                class="text-red-600 hover:text-red-800" title="Supprimer">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <!-- Questions List -->
          <div *ngIf="selectedContentChapter()" class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">Questions de {{ selectedContentChapter()?.title }}</h2>
            <div class="space-y-3">
              <div *ngFor="let question of contentQuestions(); let i = index"
                   class="bg-white rounded-lg shadow p-4">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">Q{{ i + 1 }}. {{ question.questionText }}</p>
                    <div class="mt-2 space-y-1">
                      <div *ngFor="let opt of question.options; let j = index"
                           class="text-sm flex items-center gap-2"
                           [class]="opt.isCorrect ? 'text-green-700' : 'text-gray-600'">
                        <span class="font-medium">{{ String.fromCharCode(65 + j) }}.</span>
                        <span>{{ opt.text }}</span>
                        <span *ngIf="opt.isCorrect" class="text-green-600">&#10003;</span>
                      </div>
                    </div>
                  </div>
                  <button (click)="deleteContentQuestion(question)"
                          class="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div *ngIf="contentQuestions().length === 0" class="text-center py-8 text-gray-500">
                Aucune question dans ce chapitre
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Subject Modal -->
        <div *ngIf="editSubjectModal()" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="text-lg font-semibold mb-4">Modifier la Matière</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input type="text" [(ngModel)]="editSubjectData.title"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea [(ngModel)]="editSubjectData.description" rows="2"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Total QCM</label>
                <input type="number" [(ngModel)]="editSubjectData.totalQCM"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="editSubjectModal.set(false)"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Annuler
              </button>
              <button (click)="saveEditSubject()"
                      [disabled]="contentLoading()"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Chapter Modal -->
        <div *ngIf="editChapterModal()" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="text-lg font-semibold mb-4">Modifier le Chapitre</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input type="text" [(ngModel)]="editChapterData.title"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea [(ngModel)]="editChapterData.description" rows="2"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                <input type="number" [(ngModel)]="editChapterData.orderIndex"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">URL PDF (optionnel)</label>
                <input type="text" [(ngModel)]="editChapterData.pdfUrl"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="editChapterModal.set(false)"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Annuler
              </button>
              <button (click)="saveEditChapter()"
                      [disabled]="contentLoading()"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                Enregistrer
              </button>
            </div>
          </div>
        </div>

      <!-- Add Subject Modal -->
      <div *ngIf="showAddSubjectModal()" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-semibold text-gray-900">Ajouter une Matière</h3>
              <button (click)="closeAddSubjectModal()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form (submit)="addSubject($event)" class="space-y-4">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la matière <span class="text-red-500">*</span>
                </label>
                <input type="text"
                       [(ngModel)]="newSubject.title"
                       name="title"
                       required
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Ex: Biochimie Médicale">
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea [(ngModel)]="newSubject.description"
                          name="description"
                          rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Description de la matière"></textarea>
              </div>

              <!-- Semester -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Niveau <span class="text-red-500">*</span>
                </label>
                <select [(ngModel)]="newSubject.semester"
                        name="semester"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Sélectionner un niveau</option>
                  <option value="PCEM1">PCEM1</option>
                  <option value="PCEM2">PCEM2</option>
                  <option value="DCEM1">DCEM1</option>
                </select>
              </div>

              <!-- Total QCM -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nombre total de QCM (optionnel)
                </label>
                <input type="number"
                       [(ngModel)]="newSubject.totalQCM"
                       name="totalQCM"
                       min="1"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="600 (par défaut)">
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end gap-3 pt-4">
                <button type="button"
                        (click)="closeAddSubjectModal()"
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Annuler
                </button>
                <button type="submit"
                        [disabled]="addSubjectLoading()"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                  {{ addSubjectLoading() ? 'Création...' : 'Créer la matière' }}
                </button>
              </div>

              <!-- Success/Error Messages -->
              <div *ngIf="addSubjectSuccess()" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-sm text-green-800">✓ {{ addSubjectSuccess() }}</p>
              </div>
              <div *ngIf="addSubjectError()" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-800">✗ {{ addSubjectError() }}</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;

  // Signals
  activeTab = signal('overview');
  departments = signal<Department[]>([]);
  courses = signal<Course[]>([]);
  lessons = signal<Lesson[]>([]);
  users = signal<User[]>([]);
  subscriptions = signal<any[]>([]);
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
  showAddDepartmentModal = signal(false);
  showAddCourseModal = signal(false);
  showAddLessonModal = signal(false);
  showAddPlanModal = signal(false);

  // QCM Management
  qcmSubjects = signal<any[]>([]);
  qcmChapters = signal<any[]>([]);
  qcmQuestions = signal<any[]>([]);
  selectedQcmQuestionData = signal<any>(null);
  selectedQcmSubject = '';
  selectedQcmChapter = '';
  selectedQcmQuestion = '';
  qcmSaving = signal(false);
  qcmSuccessMessage = signal('');
  qcmErrorMessage = signal('');
  qcmFormData = {
    questionText: '',
    options: [] as Array<{text: string, isCorrect: boolean, justification: string | null}>,
    explanation: ''
  };
  String = String; // Make String available in template

  // Import Subject Complete
  importSubjectJson = '';
  importSubjectLoading = signal(false);
  importSubjectSuccess = signal('');
  importSubjectError = signal('');

  // Add Subject Modal
  showAddSubjectModal = signal(false);
  addSubjectLoading = signal(false);
  addSubjectSuccess = signal('');
  addSubjectError = signal('');
  newSubject = {
    title: '',
    description: '',
    semester: '',
    totalQCM: 600
  };

  // Form data
  selectedCourseId = '';
  newDepartmentName = '';
  newCourse = {
    title: '',
    description: '',
    professor: '',
    semester: '',
    isPremium: false,
    departmentId: '',
    tags: ''
  };
  newLesson = {
    title: '',
    type: 'video' as 'video' | 'pdf' | 'exam',
    durationSec: 0,
    vimeoId: '',
    pdfUrl: '',
    isPremium: false,
    orderIndex: 0,
    courseId: ''
  };

  tabs = [
    { id: 'overview', name: 'Vue d\'ensemble' },
    { id: 'content-management', name: 'Gestion du Contenu' },
    { id: 'badges', name: 'Gestion Badges' },
    { id: 'subscriptions', name: 'Abonnements' },
    { id: 'qcm', name: 'Gestion des QCM' },
    { id: 'import-subject', name: 'Importer Matière' },
    { id: 'departments', name: 'Départements' },
    { id: 'courses', name: 'Cours' },
    { id: 'lessons', name: 'Leçons' },
    { id: 'users', name: 'Utilisateurs' },
    { id: 'stats', name: 'Statistiques' }
  ];

  // Content Management
  contentSubjects = signal<SubjectWithStats[]>([]);
  contentChapters = signal<ChapterWithStats[]>([]);
  contentQuestions = signal<Question[]>([]);
  selectedContentSubject = signal<SubjectWithStats | null>(null);
  selectedContentChapter = signal<ChapterWithStats | null>(null);
  contentLoading = signal(false);
  contentMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Badge Management
  majorsBySemester = signal<Record<string, any[]>>({});
  badgeHolders = signal<any[]>([]);
  allBadges = signal<any[]>([]);
  badgesLoading = signal(false);
  badgeCreating = signal(false);
  badgeMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  newBadgeName = '';
  newBadgeDescription = '';
  newBadgeImageData = signal<string | null>(null);
  newBadgeImagePreview = signal<string | null>(null);
  selectedBadgeForStudent: Record<string, string> = {};

  // Edit modals
  editSubjectModal = signal(false);
  editChapterModal = signal(false);
  editSubjectData = { id: '', title: '', description: '', totalQCM: 0 };
  editChapterData = { id: '', title: '', description: '', orderIndex: 0, pdfUrl: '' };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private adminContentService: AdminContentService
  ) {}

  ngOnInit() {
    this.loadDepartments();
    this.loadCourses();
    this.loadUsers();
    this.loadStats();
    this.loadQcmSubjects();
    this.loadContentSubjects();
    this.loadBadgesData();
  }

  // Load data methods
  loadDepartments() {
    this.http.get<Department[]>(`${this.API_URL}/departments`).subscribe({
      next: (data) => this.departments.set(data),
      error: (error) => console.error('Error loading departments:', error)
    });
  }

  loadCourses() {
    this.http.get<{courses: Course[]}>(`${this.API_URL}/courses`).subscribe({
      next: (data) => this.courses.set(data.courses),
      error: (error) => console.error('Error loading courses:', error)
    });
  }

  loadLessons() {
    const url = this.selectedCourseId
      ? `${this.API_URL}/lessons/course/${this.selectedCourseId}`
      : `${this.API_URL}/lessons`;

    this.http.get<Lesson[]>(url).subscribe({
      next: (data) => this.lessons.set(data),
      error: (error) => console.error('Error loading lessons:', error)
    });
  }

  loadUsers() {
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
  }

  loadStats() {
    // This would typically come from a dedicated stats endpoint
    this.stats.set({
      totalCourses: this.courses().length,
      totalUsers: this.users().length,
      totalLessons: this.lessons().length,
      activeSubscriptions: 0, // Would need to implement
      totalRevenue: 0,
      monthlyRevenue: 0,
      userGrowth: 0,
      courseViews: 0
    });
  }

  // CRUD operations
  addDepartment() {
    if (!this.newDepartmentName.trim()) return;

    this.http.post<Department>(`${this.API_URL}/departments`, {
      name: this.newDepartmentName
    }).subscribe({
      next: () => {
        this.loadDepartments();
        this.showAddDepartmentModal.set(false);
        this.newDepartmentName = '';
      },
      error: (error) => console.error('Error adding department:', error)
    });
  }

  editDepartment(dept: Department) {
    // Implement edit department
    console.log('Edit department:', dept);
  }

  deleteDepartment(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      this.http.delete(`${this.API_URL}/departments/${id}`).subscribe({
        next: () => this.loadDepartments(),
        error: (error) => console.error('Error deleting department:', error)
      });
    }
  }

  addCourse() {
    if (!this.newCourse.title || !this.newCourse.professor || !this.newCourse.departmentId) return;

    this.http.post<Course>(`${this.API_URL}/courses`, {
      ...this.newCourse,
      isPremium: this.newCourse.isPremium,
      tags: this.newCourse.tags ? this.newCourse.tags.split(',').map(tag => tag.trim()) : []
    }).subscribe({
      next: () => {
        this.loadCourses();
        this.showAddCourseModal.set(false);
        this.resetCourseForm();
      },
      error: (error) => console.error('Error adding course:', error)
    });
  }

  editCourse(course: Course) {
    // Implement edit course
    console.log('Edit course:', course);
  }

  deleteCourse(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      this.http.delete(`${this.API_URL}/courses/${id}`).subscribe({
        next: () => this.loadCourses(),
        error: (error) => console.error('Error deleting course:', error)
      });
    }
  }

  addLesson() {
    if (!this.newLesson.title || !this.newLesson.courseId) return;

    const lessonData: any = {
      title: this.newLesson.title,
      type: this.newLesson.type,
      durationSec: this.newLesson.durationSec,
      isPremium: this.newLesson.isPremium,
      orderIndex: this.newLesson.orderIndex,
      courseId: this.newLesson.courseId
    };

    if (this.newLesson.type === 'video' && this.newLesson.vimeoId) {
      lessonData.vimeoId = this.newLesson.vimeoId;
    } else if (this.newLesson.type === 'pdf' && this.newLesson.pdfUrl) {
      lessonData.pdfUrl = this.newLesson.pdfUrl;
    }

    this.http.post<Lesson>(`${this.API_URL}/lessons`, lessonData).subscribe({
      next: () => {
        this.loadLessons();
        this.showAddLessonModal.set(false);
        this.resetLessonForm();
      },
      error: (error) => console.error('Error adding lesson:', error)
    });
  }

  editLesson(lesson: Lesson) {
    // Implement edit lesson
    console.log('Edit lesson:', lesson);
  }

  deleteLesson(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) {
      this.http.delete(`${this.API_URL}/lessons/${id}`).subscribe({
        next: () => this.loadLessons(),
        error: (error) => console.error('Error deleting lesson:', error)
      });
    }
  }

  editUser(user: User) {
    // Implement edit user
    console.log('Edit user:', user);
  }

  deleteUser(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.http.delete(`${this.API_URL}/users/${id}`).subscribe({
        next: () => this.loadUsers(),
        error: (error) => console.error('Error deleting user:', error)
      });
    }
  }

  private resetCourseForm() {
    this.newCourse = {
      title: '',
      description: '',
      professor: '',
      semester: '',
      isPremium: false,
      departmentId: '',
      tags: ''
    };
  }

  private resetLessonForm() {
    this.newLesson = {
      title: '',
      type: 'video',
      durationSec: 0,
      vimeoId: '',
      pdfUrl: '',
      isPremium: false,
      orderIndex: 0,
      courseId: ''
    };
  }

  // Helper methods
  getLessonTypeClass(type: string): string {
    const classes = {
      'video': 'bg-blue-100 text-blue-800',
      'pdf': 'bg-red-100 text-red-800',
      'exam': 'bg-green-100 text-green-800'
    };
    return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getLessonTypeLabel(type: string): string {
    const labels = {
      'video': 'Vidéo',
      'pdf': 'PDF',
      'exam': 'Examen'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getRoleClass(role: string): string {
    const classes = {
      'student': 'bg-blue-100 text-blue-800',
      'admin': 'bg-red-100 text-red-800',
      'superadmin': 'bg-purple-100 text-purple-800'
    };
    return classes[role as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getRoleLabel(role: string): string {
    const labels = {
      'student': 'Étudiant',
      'admin': 'Administrateur',
      'superadmin': 'Super Admin'
    };
    return labels[role as keyof typeof labels] || role;
  }

  getCourseTitle(courseId: string): string {
    const course = this.courses().find(c => c.id === courseId);
    return course ? course.title : 'Cours inconnu';
  }

  formatDuration(seconds: number): string {
    if (seconds === 0) return '0 min';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return remainingSeconds > 0 ? `${minutes}min ${remainingSeconds}s` : `${minutes}min`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  getDisplayName(): string {
    const user = this.authService.user();
    return user ? user.name : 'Utilisateur';
  }

  logout() {
    this.authService.logout();
  }

  // ============================================
  // QCM MANAGEMENT METHODS
  // ============================================

  loadQcmSubjects() {
    this.http.get<any>(`${this.API_URL}/subjects`).subscribe({
      next: (data) => {
        this.qcmSubjects.set(data.subjects || []);
      },
      error: (error) => console.error('Error loading QCM subjects:', error)
    });
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
      },
      error: (error) => {
        console.error('Error loading question details:', error);
        this.qcmErrorMessage.set('Erreur lors du chargement de la question');
      }
    });
  }

  saveQcmQuestion() {
    if (!this.selectedQcmQuestion) return;

    this.qcmSaving.set(true);
    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');

    const updateData = {
      questionText: this.qcmFormData.questionText,
      options: this.qcmFormData.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        justification: opt.justification || null
      })),
      explanation: this.qcmFormData.explanation || null
    };

    this.http.put<any>(`${this.API_URL}/questions/${this.selectedQcmQuestion}`, updateData).subscribe({
      next: (data) => {
        this.qcmSaving.set(false);
        this.qcmSuccessMessage.set('Question mise à jour avec succès!');

        // Refresh question data
        this.selectedQcmQuestionData.set(data.question);

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
  }

  cancelQcmEdit() {
    if (!this.selectedQcmQuestionData()) return;

    // Reset form to original data
    const questionData = this.selectedQcmQuestionData();
    this.qcmFormData.questionText = questionData.questionText;
    this.qcmFormData.options = JSON.parse(JSON.stringify(questionData.options));
    this.qcmFormData.explanation = questionData.explanation || '';

    this.qcmSuccessMessage.set('');
    this.qcmErrorMessage.set('');
  }

  // ============================================
  // IMPORT SUBJECT COMPLETE
  // ============================================

  importSubjectComplete() {
    if (!this.importSubjectJson.trim()) {
      this.importSubjectError.set('Veuillez entrer des données JSON valides');
      return;
    }

    this.importSubjectLoading.set(true);
    this.importSubjectSuccess.set('');
    this.importSubjectError.set('');

    try {
      const data = JSON.parse(this.importSubjectJson);

      this.http.post(`${this.API_URL}/admin/create-subject-complete`, data).subscribe({
        next: (response: any) => {
          this.importSubjectLoading.set(false);
          this.importSubjectSuccess.set(
            `Matière créée avec succès ! ${response.data.chaptersCount} chapitres et ${response.data.questionsCount} questions importés.`
          );
          this.importSubjectJson = '';

          // Rafraîchir la liste des matières
          this.loadQcmSubjects();

          // Clear success message after 8 seconds
          setTimeout(() => {
            this.importSubjectSuccess.set('');
          }, 8000);
        },
        error: (error) => {
          this.importSubjectLoading.set(false);
          console.error('Error importing subject:', error);
          this.importSubjectError.set(
            error.error?.error?.message || 'Erreur lors de l\'importation de la matière'
          );

          // Clear error message after 10 seconds
          setTimeout(() => {
            this.importSubjectError.set('');
          }, 10000);
        }
      });
    } catch (error: any) {
      this.importSubjectLoading.set(false);
      this.importSubjectError.set('Format JSON invalide. Veuillez vérifier votre saisie.');

      setTimeout(() => {
        this.importSubjectError.set('');
      }, 10000);
    }
  }

  getExampleJson(): string {
    return JSON.stringify({
      "subject": {
        "title": "Biochimie",
        "description": "Cours de biochimie médicale",
        "semester": "PCEM1",
        "totalQCM": 100
      },
      "chapters": [
        {
          "title": "Chapitre 1 : Glucides",
          "description": "Introduction aux glucides",
          "orderIndex": 0,
          "pdfUrl": null,
          "questions": [
            {
              "questionText": "Qu'est-ce qu'un monosaccharide ?",
              "options": [
                {"text": "Un sucre simple", "isCorrect": true, "justification": "Les monosaccharides sont les sucres les plus simples"},
                {"text": "Un sucre complexe", "isCorrect": false, "justification": "Ce sont les polysaccharides qui sont complexes"},
                {"text": "Un lipide", "isCorrect": false, "justification": "Les lipides sont différents des glucides"}
              ],
              "explanation": "Les monosaccharides sont l'unité de base des glucides",
              "orderIndex": 0
            }
          ]
        }
      ]
    }, null, 2);
  }

  // ============================================
  // ADD SUBJECT MODAL
  // ============================================

  addSubject(event: Event) {
    event.preventDefault();

    if (!this.newSubject.title || !this.newSubject.semester) {
      this.addSubjectError.set('Le titre et le niveau sont obligatoires');
      return;
    }

    this.addSubjectLoading.set(true);
    this.addSubjectSuccess.set('');
    this.addSubjectError.set('');

    this.http.post(`${this.API_URL}/admin/create-subject`, {
      title: this.newSubject.title,
      description: this.newSubject.description || '',
      semester: this.newSubject.semester,
      totalQCM: this.newSubject.totalQCM || 600
    }).subscribe({
      next: (response: any) => {
        this.addSubjectLoading.set(false);
        this.addSubjectSuccess.set('Matière créée avec succès !');

        // Rafraîchir la liste des matières
        this.loadQcmSubjects();

        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
          this.closeAddSubjectModal();
        }, 2000);
      },
      error: (error) => {
        this.addSubjectLoading.set(false);
        console.error('Error creating subject:', error);
        this.addSubjectError.set(
          error.error?.error?.message || 'Erreur lors de la création de la matière'
        );
      }
    });
  }

  closeAddSubjectModal() {
    this.showAddSubjectModal.set(false);
    this.addSubjectSuccess.set('');
    this.addSubjectError.set('');
    this.newSubject = {
      title: '',
      description: '',
      semester: '',
      totalQCM: 600
    };
  }

  // ============================================
  // CONTENT MANAGEMENT METHODS
  // ============================================

  loadContentSubjects() {
    this.contentLoading.set(true);
    this.adminContentService.getSubjects().subscribe({
      next: (data) => {
        this.contentSubjects.set(data.subjects);
        this.contentLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading content subjects:', error);
        this.contentLoading.set(false);
        this.showContentMessage('error', 'Erreur lors du chargement des matières');
      }
    });
  }

  selectContentSubject(subject: SubjectWithStats) {
    this.selectedContentSubject.set(subject);
    this.selectedContentChapter.set(null);
    this.contentChapters.set([]);
    this.contentQuestions.set([]);

    // Load chapters for this subject
    this.adminContentService.getChapters(subject.id).subscribe({
      next: (data) => {
        this.contentChapters.set(data.chapters);
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
        this.showContentMessage('error', 'Erreur lors du chargement des chapitres');
      }
    });
  }

  selectContentChapter(chapter: ChapterWithStats) {
    this.selectedContentChapter.set(chapter);

    // Load questions for this chapter
    this.adminContentService.getQuestions(chapter.id).subscribe({
      next: (data) => {
        this.contentQuestions.set(data.questions);
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.showContentMessage('error', 'Erreur lors du chargement des questions');
      }
    });
  }

  // Edit Subject
  openEditSubject(subject: SubjectWithStats) {
    this.editSubjectData = {
      id: subject.id,
      title: subject.title,
      description: subject.description || '',
      totalQCM: subject.totalQCM
    };
    this.editSubjectModal.set(true);
  }

  saveEditSubject() {
    this.contentLoading.set(true);
    this.adminContentService.updateSubject(this.editSubjectData.id, {
      title: this.editSubjectData.title,
      description: this.editSubjectData.description,
      totalQCM: this.editSubjectData.totalQCM
    }).subscribe({
      next: () => {
        this.contentLoading.set(false);
        this.editSubjectModal.set(false);
        this.showContentMessage('success', 'Matière modifiée avec succès');
        this.loadContentSubjects();
        this.loadQcmSubjects();
      },
      error: (error) => {
        console.error('Error updating subject:', error);
        this.contentLoading.set(false);
        this.showContentMessage('error', 'Erreur lors de la modification');
      }
    });
  }

  // Delete Subject
  deleteContentSubject(subject: SubjectWithStats) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la matière "${subject.title}" ?\n\nCela supprimera également ${subject.chaptersCount} chapitres et ${subject.questionsCount} questions.`)) {
      return;
    }

    this.contentLoading.set(true);
    this.adminContentService.deleteSubject(subject.id).subscribe({
      next: (data) => {
        this.contentLoading.set(false);
        this.showContentMessage('success', `Matière supprimée (${data.deleted.chaptersCount} chapitres, ${data.deleted.questionsCount} questions)`);
        this.selectedContentSubject.set(null);
        this.contentChapters.set([]);
        this.loadContentSubjects();
        this.loadQcmSubjects();
      },
      error: (error) => {
        console.error('Error deleting subject:', error);
        this.contentLoading.set(false);
        this.showContentMessage('error', 'Erreur lors de la suppression');
      }
    });
  }

  // Edit Chapter
  openEditChapter(chapter: ChapterWithStats) {
    this.editChapterData = {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description || '',
      orderIndex: chapter.orderIndex,
      pdfUrl: chapter.pdfUrl || ''
    };
    this.editChapterModal.set(true);
  }

  saveEditChapter() {
    this.contentLoading.set(true);
    this.adminContentService.updateChapter(this.editChapterData.id, {
      title: this.editChapterData.title,
      description: this.editChapterData.description,
      orderIndex: this.editChapterData.orderIndex,
      pdfUrl: this.editChapterData.pdfUrl || undefined
    }).subscribe({
      next: () => {
        this.contentLoading.set(false);
        this.editChapterModal.set(false);
        this.showContentMessage('success', 'Chapitre modifié avec succès');
        if (this.selectedContentSubject()) {
          this.selectContentSubject(this.selectedContentSubject()!);
        }
      },
      error: (error) => {
        console.error('Error updating chapter:', error);
        this.contentLoading.set(false);
        this.showContentMessage('error', 'Erreur lors de la modification');
      }
    });
  }

  // Delete Chapter
  deleteContentChapter(chapter: ChapterWithStats) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${chapter.title}" ?\n\nCela supprimera également ${chapter.questionsCount} questions.`)) {
      return;
    }

    this.contentLoading.set(true);
    this.adminContentService.deleteChapter(chapter.id).subscribe({
      next: (data) => {
        this.contentLoading.set(false);
        this.showContentMessage('success', `Chapitre supprimé (${data.deleted.questionsCount} questions)`);
        this.selectedContentChapter.set(null);
        this.contentQuestions.set([]);
        if (this.selectedContentSubject()) {
          this.selectContentSubject(this.selectedContentSubject()!);
        }
        this.loadContentSubjects();
      },
      error: (error) => {
        console.error('Error deleting chapter:', error);
        this.contentLoading.set(false);
        this.showContentMessage('error', 'Erreur lors de la suppression');
      }
    });
  }

  // Delete Question
  deleteContentQuestion(question: Question) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette question ?`)) {
      return;
    }

    this.adminContentService.deleteQuestion(question.id).subscribe({
      next: () => {
        this.showContentMessage('success', 'Question supprimée');
        if (this.selectedContentChapter()) {
          this.selectContentChapter(this.selectedContentChapter()!);
        }
        this.loadContentSubjects();
      },
      error: (error) => {
        console.error('Error deleting question:', error);
        this.showContentMessage('error', 'Erreur lors de la suppression');
      }
    });
  }

  showContentMessage(type: 'success' | 'error', text: string) {
    this.contentMessage.set({ type, text });
    setTimeout(() => this.contentMessage.set(null), 5000);
  }

  backToSubjects() {
    this.selectedContentSubject.set(null);
    this.selectedContentChapter.set(null);
    this.contentChapters.set([]);
    this.contentQuestions.set([]);
  }

  backToChapters() {
    this.selectedContentChapter.set(null);
    this.contentQuestions.set([]);
  }

  // ============================================
  // BADGE MANAGEMENT METHODS
  // ============================================

  loadBadgesData() {
    this.badgesLoading.set(true);
    this.badgeMessage.set(null);

    // Load all badges
    this.http.get<{ success: boolean; badges: any[] }>(`${this.API_URL}/admin/badges`).subscribe({
      next: (response) => {
        this.allBadges.set(response.badges);
      },
      error: (error) => {
        console.error('Error loading badges:', error);
      }
    });

    // Load majors by semester
    this.http.get<{ success: boolean; majorsBySemester: Record<string, any[]> }>(`${this.API_URL}/admin/badges/majors`).subscribe({
      next: (response) => {
        this.majorsBySemester.set(response.majorsBySemester);
        this.loadBadgeHolders();
      },
      error: (error) => {
        console.error('Error loading majors:', error);
        this.badgeMessage.set({ type: 'error', text: 'Erreur lors du chargement des classements' });
        this.badgesLoading.set(false);
      }
    });
  }

  loadBadgeHolders() {
    this.http.get<{ success: boolean; holders: any[] }>(`${this.API_URL}/admin/badges/holders`).subscribe({
      next: (response) => {
        this.badgeHolders.set(response.holders);
        this.badgesLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading badge holders:', error);
        this.badgesLoading.set(false);
      }
    });
  }

  onBadgeImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.badgeMessage.set({ type: 'error', text: 'L\'image ne doit pas depasser 5MB' });
        setTimeout(() => this.badgeMessage.set(null), 5000);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.badgeMessage.set({ type: 'error', text: 'Veuillez selectionner une image valide' });
        setTimeout(() => this.badgeMessage.set(null), 5000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.newBadgeImagePreview.set(result);
        this.newBadgeImageData.set(result);
      };
      reader.readAsDataURL(file);
    }
  }

  createBadge() {
    if (!this.newBadgeName || !this.newBadgeDescription) {
      this.badgeMessage.set({ type: 'error', text: 'Veuillez remplir tous les champs' });
      setTimeout(() => this.badgeMessage.set(null), 5000);
      return;
    }

    this.badgeCreating.set(true);
    this.badgeMessage.set(null);

    this.http.post<{ success: boolean; message: string; badge: any }>(`${this.API_URL}/admin/badges/create`, {
      name: this.newBadgeName,
      description: this.newBadgeDescription,
      imageData: this.newBadgeImageData()
    }).subscribe({
      next: (response) => {
        this.badgeMessage.set({ type: 'success', text: response.message });
        // Reset form
        this.newBadgeName = '';
        this.newBadgeDescription = '';
        this.newBadgeImageData.set(null);
        this.newBadgeImagePreview.set(null);
        this.badgeCreating.set(false);
        // Refresh badges list
        this.loadBadgesData();
        setTimeout(() => this.badgeMessage.set(null), 5000);
      },
      error: (error) => {
        console.error('Error creating badge:', error);
        this.badgeMessage.set({ type: 'error', text: error.error?.error || 'Erreur lors de la creation du badge' });
        this.badgeCreating.set(false);
        setTimeout(() => this.badgeMessage.set(null), 5000);
      }
    });
  }

  deleteBadge(badgeId: string, badgeName: string) {
    if (!confirm(`Etes-vous sur de vouloir supprimer le badge "${badgeName}" ?`)) {
      return;
    }

    this.badgeMessage.set(null);

    this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/admin/badges/${badgeId}`).subscribe({
      next: (response) => {
        this.badgeMessage.set({ type: 'success', text: response.message });
        this.loadBadgesData(); // Refresh data
        setTimeout(() => this.badgeMessage.set(null), 5000);
      },
      error: (error) => {
        console.error('Error deleting badge:', error);
        this.badgeMessage.set({ type: 'error', text: error.error?.error || 'Erreur lors de la suppression du badge' });
        setTimeout(() => this.badgeMessage.set(null), 5000);
      }
    });
  }

  assignBadge(userId: string, badgeId: string) {
    this.badgeMessage.set(null);

    this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/admin/badges/assign`, {
      userId,
      badgeId
    }).subscribe({
      next: (response) => {
        this.badgeMessage.set({ type: 'success', text: response.message });
        this.selectedBadgeForStudent[userId] = ''; // Reset selection
        this.loadBadgesData(); // Refresh data
        setTimeout(() => this.badgeMessage.set(null), 5000);
      },
      error: (error) => {
        console.error('Error assigning badge:', error);
        this.badgeMessage.set({ type: 'error', text: error.error?.error || 'Erreur lors de l\'attribution du badge' });
        setTimeout(() => this.badgeMessage.set(null), 5000);
      }
    });
  }

  revokeBadge(userId: string, badgeId: string) {
    if (!confirm('Etes-vous sur de vouloir retirer ce badge ?')) {
      return;
    }

    this.badgeMessage.set(null);

    this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/admin/badges/revoke`, {
      userId,
      badgeId
    }).subscribe({
      next: (response) => {
        this.badgeMessage.set({ type: 'success', text: response.message });
        this.loadBadgesData(); // Refresh data
        setTimeout(() => this.badgeMessage.set(null), 5000);
      },
      error: (error) => {
        console.error('Error revoking badge:', error);
        this.badgeMessage.set({ type: 'error', text: error.error?.error || 'Erreur lors du retrait du badge' });
        setTimeout(() => this.badgeMessage.set(null), 5000);
      }
    });
  }
}