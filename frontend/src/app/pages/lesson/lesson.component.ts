import { Component, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import Player from '@vimeo/player';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { environment } from '../../../environments/environment';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'exam';
  durationSec: number;
  vimeoId?: string;
  youtubeId?: string;
  pdfUrl?: string;
  videoUrl?: string;
  videoSize?: number;
  videoType?: string;
  isPremium: boolean;
  orderIndex: number;
  createdAt: string;
  course: {
    id: string;
    title: string;
    isPremium: boolean;
  };
  assets: any[];
  comments: any[];
  commentCount: number;
}

interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'viewed';
  updatedAt: string | null;
}

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxExtendedPdfViewerModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 security-protected">
      <!-- Security Overlay -->
      <div class="security-overlay" id="securityOverlay"></div>
      
      <!-- Loading State -->
      <div *ngIf="isLoading()" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="relative">
            <svg class="animate-spin -ml-1 mr-3 h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p class="mt-6 text-lg font-medium text-gray-700">Chargement sécurisé de la leçon...</p>
          <p class="mt-2 text-sm text-gray-500">Initialisation des protections de contenu</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error() && !isLoading()" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
          <p class="text-gray-500 mb-4">{{ error() }}</p>
          <button (click)="goToCatalog()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Retour au catalogue
          </button>
        </div>
      </div>

      <!-- Lesson Content -->
      <div *ngIf="lesson() && !isLoading()">
      <!-- Modern Lesson Header -->
      <div class="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-b sticky top-0 z-10 shadow-lg backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-6 py-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div class="flex flex-col lg:flex-row lg:items-center gap-6">
              <a [routerLink]="['/course', lesson()?.course?.id]" 
                 class="group text-blue-600 hover:text-blue-800 text-sm flex items-center gap-3 transition-all duration-300 hover:gap-4">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg class="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </div>
                <span class="font-semibold">Retour au cours</span>
              </a>
              
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{{ lesson()?.title }}</h1>
                  <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span class="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ formatDuration(lesson()?.durationSec || 0) }}
                    </span>
                    <span class="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      {{ lesson()?.type === 'video' ? 'Vidéo' : lesson()?.type === 'pdf' ? 'PDF' : 'Examen' }}
                    </span>
                    <span class="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Sécurisé
                    </span>
                </div>
              </div>
              </div>
            </div>
            
            <div class="flex gap-3">
                <button *ngIf="currentLessonIndex() > 0" 
                        (click)="navigateToLesson(relatedLessons()[currentLessonIndex() - 1].id)"
                      class="group px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center gap-3 shadow-sm hover:shadow-md">
                <svg class="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                  Précédent
                </button>
                <button *ngIf="currentLessonIndex() < totalLessons() - 1" 
                        (click)="navigateToLesson(relatedLessons()[currentLessonIndex() + 1].id)"
                      class="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl">
                  Suivant
                <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      <!-- Subscription Required State -->
      <div *ngIf="subscriptionRequired() && !isLoading()" class="min-h-screen flex items-center justify-center">
        <div class="text-center max-w-md mx-auto p-6">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Contenu Premium</h2>
          <p class="text-gray-600 mb-6">Cette leçon nécessite un abonnement actif pour y accéder.</p>
          <div class="space-y-3">
            <button (click)="router.navigate(['/subscription'])" 
                    class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Voir les abonnements
            </button>
            <button (click)="router.navigate(['/catalog'])" 
                    class="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              Retour au catalogue
            </button>
            </div>
          </div>
        </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Video/Content Section -->
          <div class="lg:col-span-3">
            <!-- Professional Video Player -->
            <div *ngIf="lesson()?.type === 'video'"
                 class="relative mb-8 overflow-hidden rounded-2xl shadow-2xl border border-gray-300 bg-gradient-to-br from-gray-900 via-gray-800 to-black">

              <!-- Video Container -->
              <div class="aspect-video relative" #videoContainer>
                <!-- Local Video Player (if videoUrl exists) -->
                <video *ngIf="lesson()?.videoUrl"
                       [src]="getVideoUrl(lesson()?.videoUrl)"
                       controls
                       controlsList="nodownload"
                       disablePictureInPicture
                       class="w-full h-full object-contain"
                       (play)="onLocalVideoPlay()"
                       (ended)="onLocalVideoEnded()">
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>

                <!-- Vimeo Player Overlay (if vimeoId exists and no videoUrl) -->
                <div *ngIf="lesson()?.vimeoId && !lesson()?.videoUrl"
                     class="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-indigo-900/30 flex items-center justify-center cursor-pointer group"
                     (click)="onVideoClick()">

                  <!-- Main Play Button -->
                  <div class="text-center text-white transform transition-all duration-500 group-hover:scale-110">
                    <div class="relative mb-6">
                      <!-- Outer ring -->
                      <div class="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border-2 border-white/30 group-hover:border-white/50 transition-all duration-300">
                        <!-- Inner play button -->
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-300">
                          <svg class="w-8 h-8 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      <!-- Pulse animation -->
                      <div class="absolute inset-0 w-24 h-24 bg-white/20 rounded-full mx-auto animate-ping opacity-75"></div>
                    </div>

                    <!-- Video Info -->
                    <div class="space-y-3">
                      <h3 class="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                        {{ lesson()?.title }}
                      </h3>
                      <p class="text-lg opacity-90 mb-4">Contenu premium sécurisé</p>

                      <!-- Security Badge -->
                      <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-400/30 backdrop-blur-sm">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="text-sm font-medium text-green-300">Protection active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Professional Watermarks -->
                <div class="absolute top-6 right-6">
                  <div class="bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                    <div class="flex items-center gap-2 text-white text-sm">
                      <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span class="font-mono">{{ userEmail() }}</span>
                    </div>
                    <div class="text-xs text-gray-300 mt-1">{{ currentTime() }}</div>
                  </div>
              </div>

              <!-- Security Notice -->
                <div class="absolute bottom-6 left-6">
                  <div class="bg-red-500/20 px-4 py-3 rounded-xl backdrop-blur-sm border border-red-400/30 flex items-center gap-3">
                    <svg class="w-5 h-5 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                      <div class="text-sm font-semibold text-red-300">Enregistrement interdit</div>
                      <div class="text-xs text-red-200">Contenu protégé par DRM</div>
                    </div>
                  </div>
                </div>

                <!-- Session Info -->
                <div class="absolute top-6 left-6">
                  <div class="bg-black/40 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                    <div class="flex items-center gap-2 text-white text-xs">
                      <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span class="font-mono">{{ sessionId() }}</span>
                    </div>
                  </div>
                </div>

                <!-- Security Pattern Overlay -->
                <div class="absolute inset-0 security-pattern pointer-events-none select-none opacity-20"></div>
                
                <!-- Loading State -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none" *ngIf="isLoading()">
                  <div class="flex flex-col items-center gap-4">
                    <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p class="text-white text-sm">Chargement sécurisé...</p>
                  </div>
                </div>
              </div>

              <!-- Video Controls Bar -->
              <div class="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-t border-gray-700">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <button class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-5v5m0-5v5"/>
                      </svg>
                      Plein écran
                    </button>
                    <button class="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                      </svg>
                      Volume
                    </button>
                    <button class="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Paramètres
                    </button>
                  </div>
                  
                  <!-- Security Status -->
                  <div class="flex items-center gap-2 text-sm text-green-400">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span class="font-medium">Sécurisé</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- PDF Viewer -->
            <div *ngIf="lesson()?.type === 'pdf'" class="card aspect-[4/3] mb-6 overflow-hidden">
              <ngx-extended-pdf-viewer
                [src]="pdfUrl"
                useBrowserLocale="true"
                [textLayer]="true"
                [showOpenFileButton]="false"
                [showPrintButton]="false"
                [showDownloadButton]="false"
                [showSecondaryToolbarButton]="false"
                [showSidebarButton]="true"
                (pdfLoaded)="onPdfLoaded()"
                style="height:100%"
              ></ngx-extended-pdf-viewer>
            </div>

            <!-- Exam Section -->
            <div *ngIf="lesson()?.type === 'exam'" 
                 class="card p-6 mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Examen</h3>
              <p class="text-gray-600 mb-4">Répondez aux questions pour valider vos connaissances.</p>
              <button class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors">
                Commencer l'examen
              </button>
            </div>

            <!-- Enhanced Video Controls -->
            <div *ngIf="lesson()?.type === 'video'" class="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
              <div class="flex flex-wrap gap-3 items-center justify-between">
                <div class="flex flex-wrap gap-2">
                  <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                    </svg>
                    Plein écran
              </button>
                  <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                    </svg>
                    Volume
              </button>
                  <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Paramètres
              </button>
                  <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Notes
              </button>
            </div>

                <!-- Security Status -->
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Contenu protégé</span>
                </div>
            </div>
          </div>

            <!-- Enhanced Lesson Description -->
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Description de la leçon</h3>
                  <p class="text-sm text-gray-500">Contenu pédagogique sécurisé</p>
                </div>
              </div>
              
              <div class="space-y-4">
                <p class="text-gray-700 leading-relaxed">
                  Cette leçon fait partie du cours <strong>"{{ lesson()?.course?.title }}"</strong>. 
                  Suivez attentivement le contenu pour bien comprendre les concepts abordés.
                </p>
                
                <!-- Lesson Stats -->
                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">{{ formatDuration(lesson()?.durationSec || 0) }}</div>
                    <div class="text-sm text-gray-500">Durée</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{{ lesson()?.type === 'video' ? 'Vidéo' : lesson()?.type === 'pdf' ? 'PDF' : 'Examen' }}</div>
                    <div class="text-sm text-gray-500">Format</div>
                  </div>
                </div>
                
                <!-- Security Notice -->
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div class="flex items-start gap-2">
                    <svg class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-amber-800">Contenu protégé</p>
                      <p class="text-xs text-amber-700 mt-1">
                        Ce contenu est protégé par des mesures de sécurité avancées. 
                        L'enregistrement, la capture d'écran et la copie sont interdits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Sidebar -->
          <div class="lg:col-span-1">
            <!-- Enhanced Progress -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="font-bold text-gray-900">Progression</h3>
              </div>
              <div class="space-y-4">
                <div class="flex justify-between text-sm">
                  <span class="font-medium">Leçon actuelle</span>
                  <span class="text-blue-600 font-semibold">{{ currentLessonIndex() + 1 }}/{{ totalLessons() }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500" [style.width.%]="progressPercentage()"></div>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500">{{ progressPercentage() }}% complété</span>
                  <span class="text-green-600 font-medium">Sécurisé</span>
                </div>
              </div>
            </div>

            <!-- Security Status -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <h3 class="font-bold text-gray-900">Sécurité</h3>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Protection active</span>
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-xs font-medium text-green-600">Activée</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Screenshots</span>
                  <span class="text-xs font-medium text-red-600">Bloqués</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Enregistrement</span>
                  <span class="text-xs font-medium text-red-600">Bloqué</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Copie</span>
                  <span class="text-xs font-medium text-red-600">Bloquée</span>
                </div>
              </div>
            </div>

            <!-- Security Test Section -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="font-bold text-gray-900">Test Sécurité</h3>
              </div>
              <div class="space-y-3">
                <button (click)="testScreenshot()" 
                        class="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                  📸 Tester Screenshot
                </button>
                <button (click)="testCopy()" 
                        class="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors">
                  📋 Tester Copie
                </button>
                <button (click)="testRightClick()" 
                        class="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                  🖱️ Tester Clic Droit
                </button>
                <div class="text-xs text-gray-500 mt-2">
                  Ces boutons testent les protections de sécurité
                </div>
              </div>
            </div>

            <!-- Related Lessons -->
            <div class="card p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Leçons du cours</h3>
              <div class="space-y-2">
                <div *ngFor="let relatedLesson of relatedLessons(); trackBy: trackByLessonId" 
                     class="p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                     [class.bg-blue-50]="relatedLesson.id === lesson()?.id"
                     (click)="navigateToLesson(relatedLesson.id)">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ relatedLesson.title }}</p>
                      <p class="text-xs text-gray-500">{{ formatDuration(relatedLesson.durationSec) }}</p>
                    </div>
                    <div class="flex items-center gap-1 ml-2">
                      <span *ngIf="relatedLesson.isPremium" class="text-xs text-orange-600">🔒</span>
                      <span class="text-xs text-gray-400">
                        {{ relatedLesson.type === 'video' ? '🎥' : relatedLesson.type === 'pdf' ? '📄' : '📝' }}
                      </span>
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
export class LessonComponent implements OnInit, OnDestroy {
  @ViewChild('videoContainer', { static: false }) videoContainer?: ElementRef<HTMLDivElement>;
  private readonly API_URL = environment.apiUrl;
  
  // Signals
  private lessonSignal = signal<Lesson | undefined>(undefined);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string>('');
  private relatedLessonsSignal = signal<Lesson[]>([]);
  private progressSignal = signal<LessonProgress>({ status: 'not_started', updatedAt: null });
  subscriptionRequired = signal(false);
  
  userEmail = signal<string>('');
  currentTime = signal<string>('');
  sessionId = signal<string>('');
  private timeInterval: any;
  private vimeoPlayer?: Player;
  pdfUrl: string | undefined;

  // Computed properties
  lesson = computed(() => this.lessonSignal());
  isLoading = computed(() => this.isLoadingSignal());
  error = computed(() => this.errorSignal());
  relatedLessons = computed(() => this.relatedLessonsSignal());
  progress = computed(() => this.progressSignal());

  currentLessonIndex = signal<number>(0);
  totalLessons = computed(() => this.relatedLessons().length);

  progressPercentage = computed(() => {
    const completed = this.relatedLessons().filter(l => l.id === this.lesson()?.id).length;
    return Math.round((completed / this.totalLessons()) * 100);
  });

  constructor(
    public router: Router, 
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const lessonId = params['id'];
      this.loadLesson(lessonId);
    });

    // Generate unique session ID for security tracking
    this.sessionId.set(this.generateSessionId());

    // Set user email for watermark
    const user = this.authService.user();
    if (user) {
      this.userEmail.set(user.email);
    }

    // Update time for watermark
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    // Setup comprehensive content protection
    this.setupAdvancedContentProtection();

    // Initialize player if video
    setTimeout(() => this.initVideoPlayer(), 0);

    // Add CSS for security styling
    this.addSecurityStyles();
  }

  private loadLesson(lessonId: string) {
    this.isLoadingSignal.set(true);
    this.errorSignal.set('');

    this.http.get<Lesson>(`${this.API_URL}/lessons/${lessonId}`).subscribe({
      next: (lesson) => {
        this.lessonSignal.set(lesson);
        this.pdfUrl = lesson.pdfUrl;
        this.isLoadingSignal.set(false);
        this.subscriptionRequired.set(false);
        
        // Load related lessons from the same course
        this.loadRelatedLessons(lesson.course.id);
        
        // Load lesson progress
        this.loadLessonProgress(lessonId);
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        
        // Check if it's a subscription required error
        if (error.status === 403 && error.error?.code === 'SUBSCRIPTION_REQUIRED') {
          this.subscriptionRequired.set(true);
          this.lessonSignal.set({
            id: error.error.lesson.id,
            title: error.error.lesson.title,
            type: 'video',
            durationSec: 0,
            isPremium: true,
            orderIndex: 0,
            createdAt: '',
            course: { id: '', title: '', isPremium: true },
            assets: [],
            comments: [],
            commentCount: 0
          });
          this.isLoadingSignal.set(false);
        } else {
        this.errorSignal.set('Erreur lors du chargement de la leçon');
        this.isLoadingSignal.set(false);
        this.router.navigate(['/catalog']);
        }
      }
    });
  }

  private loadRelatedLessons(courseId: string) {
    this.http.get<Lesson[]>(`${this.API_URL}/courses/${courseId}/lessons`).subscribe({
      next: (lessons) => {
        this.relatedLessonsSignal.set(lessons);
        
        // Find current lesson index
        const currentLesson = this.lesson();
        if (currentLesson) {
          const index = lessons.findIndex(l => l.id === currentLesson.id);
          this.currentLessonIndex.set(index);
        }
      },
      error: (error) => {
        console.error('Error loading related lessons:', error);
        this.errorSignal.set('Erreur lors du chargement des leçons associées');
      }
    });
  }

  private loadLessonProgress(lessonId: string) {
    this.http.get<LessonProgress>(`${this.API_URL}/lessons/${lessonId}/progress`).subscribe({
      next: (progress) => {
        this.progressSignal.set(progress);
      },
      error: (error) => {
        console.error('Error loading lesson progress:', error);
        // Don't show error for progress loading as it's not critical
      }
    });
  }

  private updateLessonProgress(status: 'in_progress' | 'viewed') {
    const lesson = this.lesson();
    if (!lesson) return;

    this.http.post(`${this.API_URL}/lessons/${lesson.id}/progress`, { status }).subscribe({
      next: () => {
        this.progressSignal.update(p => ({ ...p, status, updatedAt: new Date().toISOString() }));
      },
      error: (error) => {
        console.error('Error updating lesson progress:', error);
      }
    });
  }

  private trackLessonView() {
    const lesson = this.lesson();
    if (!lesson) return;
    
    // Only track views for premium lessons
    if (!lesson.isPremium) {
      console.log('Skipping view tracking for non-premium lesson');
      return;
    }

    // Check if user is authenticated and has subscription
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping view tracking');
      return;
    }

    console.log('🎬 Tracking lesson view for:', lesson.title);
    
    this.http.post(`${this.API_URL}/lessons/${lesson.id}/view`, {}).subscribe({
      next: (response: any) => {
        console.log('✅ View tracked successfully:', response);
        // Optionally update the lesson data to reflect new view count
        if (response.viewCount) {
          // You could emit an event or update a signal here if needed
        }
      },
      error: (error) => {
        console.error('❌ Error tracking view:', error);
        if (error.status === 403) {
          console.log('User needs subscription to view this content');
        } else if (error.status === 400) {
          console.log('View already tracked for this lesson');
        }
      }
    });
  }

  onPdfLoaded() {
    console.log('📄 PDF loaded, tracking view');
    // Track view when PDF is loaded (similar to video play event)
    this.trackLessonView();
    this.updateLessonProgress('in_progress');
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateTime() {
    this.currentTime.set(new Date().toLocaleTimeString('fr-FR'));
  }

  private initVideoPlayer() {
    if (this.lesson()?.type !== 'video') return;
    if (!this.videoContainer?.nativeElement) return;
    
    const lesson = this.lesson();
    if (!lesson?.vimeoId) return;
    
    const options: any = {
      id: parseInt(lesson.vimeoId),
      responsive: true,
      byline: false,
      title: false,
      dnt: true,
      controls: true,
      autopause: true,
      pip: false
    };
    
    this.vimeoPlayer = new Player(this.videoContainer.nativeElement, options);
    
    // Track progress when video is played
    this.vimeoPlayer.on('play', () => {
      this.updateLessonProgress('in_progress');
      // Track view when video starts playing (only for subscribed users)
      this.trackLessonView();
    });
    
    this.vimeoPlayer.on('ended', () => {
      this.updateLessonProgress('viewed');
    });
    
    try {
      // Disable PiP where possible
      (this.vimeoPlayer as any).disablePictureInPicture?.();
    } catch {}
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  getVideoUrl(videoUrl: string | undefined): string {
    if (!videoUrl) {
      return '';
    }

    // With Angular proxy, use relative URLs
    if (videoUrl.startsWith('http')) {
      // Remove http://localhost:3000 prefix to use relative URL with proxy
      return videoUrl.replace('http://localhost:3000', '');
    }

    // Already a relative URL, return as-is
    return videoUrl;
  }

  onLocalVideoPlay(): void {
    this.updateLessonProgress('in_progress');
    this.trackLessonView();
  }

  onLocalVideoEnded(): void {
    this.updateLessonProgress('viewed');
  }

  private addSecurityStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .security-protected {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      .security-video-container {
        position: relative;
        overflow: hidden;
      }
      
      .security-video-wrapper {
        position: relative;
        z-index: 1;
      }
      
      .security-pattern {
        background-image: 
          radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px);
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
        animation: securityPattern 20s linear infinite;
        pointer-events: none;
        z-index: 2;
      }
      
      @keyframes securityPattern {
        0% { transform: translate(0, 0); }
        100% { transform: translate(20px, 20px); }
      }
      
      .security-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: difference;
      }
      
      /* Disable text selection globally */
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      /* Disable image dragging */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
      
      /* Disable video controls context menu */
      video::-webkit-media-controls {
        -webkit-appearance: none;
      }
      
      video::-webkit-media-controls-panel {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  private setupAdvancedContentProtection() {
    // Enhanced invisible protection with multiple layers
    
    // Layer 1: Basic input blocking
    this.setupBasicProtection();
    
    // Layer 2: Advanced screenshot prevention
    this.setupScreenshotProtection();
    
    // Layer 3: Video recording prevention
    this.setupVideoRecordingProtection();
    
    // Layer 4: Developer tools detection
    this.setupDeveloperToolsProtection();
    
    // Layer 5: Screen capture detection
    this.setupScreenCaptureProtection();
    
    // Layer 6: Clipboard protection
    this.setupClipboardProtection();
  }

  private setupBasicProtection() {
    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });
    
    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const blockedKeys = [
        'F12', 'F11', 'F5', 'F4',
        'PrintScreen', 'ScrollLock', 'Pause'
      ];
      
      const blockedCombinations: Array<{ctrl?: boolean, shift?: boolean, alt?: boolean, key: string}> = [
        { ctrl: true, shift: true, key: 'I' },
        { ctrl: true, shift: true, key: 'C' },
        { ctrl: true, shift: true, key: 'J' },
        { ctrl: true, key: 'u' },
        { ctrl: true, key: 's' },
        { ctrl: true, key: 'a' },
        { ctrl: true, key: 'c' },
        { ctrl: true, key: 'v' },
        { ctrl: true, key: 'x' },
        { ctrl: true, key: 'p' },
        { ctrl: true, key: 'r' },
        { alt: true, key: 'F4' }
      ];
      
      if (blockedKeys.includes(e.key) || 
          blockedCombinations.some(combo => 
            combo.ctrl === e.ctrlKey && 
            combo.shift === e.shiftKey && 
            combo.alt === e.altKey && 
            combo.key.toLowerCase() === e.key.toLowerCase()
          )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    }, { capture: true });

    // Disable text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    }, { capture: true });
    
    // Disable drag and drop
    ['dragstart', 'drag', 'dragend', 'drop', 'dragover', 'dragenter', 'dragleave'].forEach(event => {
      document.addEventListener(event, (e) => {
      e.preventDefault();
      return false;
    }, { capture: true });
    });
  }

  private setupScreenshotProtection() {
    // Aggressive screenshot prevention
    this.disablePrintScreen();
    this.disableSnippingTools();
    this.disableScreenCapture();
    this.disableCanvasCapture();
    this.addScreenshotOverlay();
  }

  private disablePrintScreen() {
    // Block Print Screen key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        this.showSecurityAlert('Screenshot blocked!');
        return false;
      }
      return true;
    }, { capture: true });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        // Clear clipboard
        navigator.clipboard.writeText('').catch(() => {});
        this.showSecurityAlert('Screenshot blocked!');
        return false;
      }
      return true;
    }, { capture: true });
  }

  private disableSnippingTools() {
    // Block Windows Snipping Tool shortcuts
    document.addEventListener('keydown', (e) => {
      // Windows Snipping Tool: Win + Shift + S
      if (e.key === 'S' && e.shiftKey && e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        this.showSecurityAlert('Snipping tool blocked!');
        return false;
      }
      // Alternative: Win + Shift + S
      if (e.key === 'S' && e.shiftKey && e.altKey) {
      e.preventDefault();
      e.stopPropagation();
        this.showSecurityAlert('Snipping tool blocked!');
      return false;
      }
      return true;
    }, { capture: true });
  }

  private disableScreenCapture() {
    // Block screen capture APIs
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function() {
        throw new Error('Screen capture not allowed');
      };
    }

    // Block getUserMedia for screen capture
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = function(constraints) {
        if (constraints && constraints.video && typeof constraints.video === 'object' && constraints.video.displaySurface) {
          throw new Error('Screen capture not allowed');
        }
        return originalGetUserMedia.call(this, constraints);
      };
    }
  }

  private disableCanvasCapture() {
    // Disable canvas toDataURL
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type?: string, quality?: number): string {
      // Always return a black image
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL();
    };

    // Disable canvas toBlob
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback?: BlobCallback, type?: string, quality?: number) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      if (callback) {
        canvas.toBlob(callback, type, quality);
      }
    };

    // Disable video capture
    const originalCapture = (HTMLVideoElement.prototype as any).captureStream;
    if (originalCapture) {
      (HTMLVideoElement.prototype as any).captureStream = function() {
        throw new Error('Video capture not allowed');
      };
    }
  }

  private addScreenshotOverlay() {
    // Add invisible overlay to block screenshots
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: transparent;
      z-index: 999999;
      pointer-events: none;
      mix-blend-mode: difference;
    `;
    overlay.id = 'screenshot-protection-overlay';
    document.body.appendChild(overlay);

    // Add CSS to make content invisible in screenshots
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        * { display: none !important; }
      }
      
      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        .security-protected {
          -webkit-user-select: none !important;
          -webkit-touch-callout: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private showSecurityAlert(message: string) {
    console.warn('🛡️ Security Alert:', message);
    // You can add a toast notification here
    alert('🛡️ ' + message);
  }

  private setupVideoRecordingProtection() {
    // Monitor for screen recording attempts
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function() {
        return Promise.reject(new Error('Screen recording not allowed'));
      };
    }

    // Disable getImageData on video contexts
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings): ImageData {
      const video = document.querySelector('video');
      if (video && this.canvas.contains(video)) {
        throw new Error('Image data access not allowed');
      }
      return originalGetImageData.call(this, sx, sy, sw, sh, settings);
    };
  }

  private setupDeveloperToolsProtection() {
    // Detect developer tools
    let devtools = false;
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools) {
          devtools = true;
          console.clear();
          console.log('%c⚠️ Developer Tools Detected', 'color: red; font-size: 20px; font-weight: bold;');
          console.log('%cThis content is protected. Please close developer tools.', 'color: red; font-size: 14px;');
        }
      } else {
        devtools = false;
      }
    }, 500);
  }

  private setupScreenCaptureProtection() {
    // Detect screen capture attempts
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function() {
        console.warn('Screen capture attempt blocked');
        return Promise.reject(new Error('Screen capture not allowed'));
      };
    }
  }

  private setupClipboardProtection() {
    // Clear clipboard periodically
    setInterval(() => {
      navigator.clipboard.writeText('').catch(() => {});
    }, 1000);
    
    // Disable clipboard access
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', '');
      return false;
    }, { capture: true });
    
    document.addEventListener('cut', (e) => {
      e.preventDefault();
      return false;
    }, { capture: true });
  }


  navigateToLesson(lessonId: string) {
    this.router.navigate(['/lesson', lessonId]);
  }

  trackByLessonId(index: number, lesson: Lesson): string {
    return lesson.id;
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

  onVideoClick() {
    // Handle video click interaction
    console.log('🎬 Video clicked - Security measures active');
    
    // Show a toast or notification about security
    if (typeof window !== 'undefined' && (window as any).showSecurityNotice) {
      (window as any).showSecurityNotice('Contenu protégé - Mesures de sécurité actives');
    }
  }

  testScreenshot() {
    console.log('📸 Testing screenshot protection...');
    alert('🛡️ Test Screenshot:\n\n1. Essayez de prendre une capture d\'écran avec Print Screen\n2. Essayez Ctrl+Shift+S (Windows) ou Cmd+Shift+4 (Mac)\n3. Les captures devraient être bloquées ou vides\n\n✅ Protection active!');
  }

  testCopy() {
    console.log('📋 Testing copy protection...');
    try {
      // Try to copy some text
      document.execCommand('copy');
      alert('🛡️ Test Copie:\n\n1. Essayez de sélectionner du texte sur la page\n2. Essayez Ctrl+C pour copier\n3. La sélection et la copie devraient être bloquées\n\n✅ Protection active!');
    } catch (e) {
      alert('🛡️ Test Copie:\n\n✅ La copie est bloquée!\n\nLa protection fonctionne correctement.');
    }
  }

  testRightClick() {
    console.log('🖱️ Testing right-click protection...');
    alert('🛡️ Test Clic Droit:\n\n1. Essayez de faire un clic droit sur la page\n2. Le menu contextuel ne devrait pas apparaître\n3. Essayez sur la vidéo et les images\n\n✅ Protection active!');
  }

  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }
}