import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { VideoUploadComponent } from '../../components/video-upload/video-upload.component';
import { environment } from '../../../environments/environment';

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'EXAM';
  durationSec: number;
  isPremium: boolean;
  orderIndex: number;
  createdAt: string;
  courseId: string;
  course?: {
    id: string;
    title: string;
    semester: string;
  };
  videoUrl?: string;
  videoSize?: number;
  videoType?: string;
  uploadedAt?: string;
}

@Component({
  selector: 'app-lesson-video-upload',
  standalone: true,
  imports: [CommonModule, VideoUploadComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Loading State -->
      <div *ngIf="isLoading()" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-4 text-gray-600">Chargement de la leçon...</p>
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
          <button (click)="goBack()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Retour à l'Admin
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading() && lesson()" class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button (click)="goBack()" 
                      class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Gestion Vidéo</h1>
                <p class="text-gray-600">{{ lesson()?.title }}</p>
                <p class="text-sm text-gray-500">{{ lesson()?.course?.title }} - {{ lesson()?.course?.semester }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span [class]="lesson()?.type === 'VIDEO' ? 'bg-blue-100 text-blue-800' : lesson()?.type === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'"
                    class="px-3 py-1 rounded-full text-sm font-medium">
                {{ lesson()?.type === 'VIDEO' ? 'Vidéo' : lesson()?.type === 'PDF' ? 'PDF' : 'Examen' }}
              </span>
              <span [class]="lesson()?.isPremium ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'"
                    class="px-3 py-1 rounded-full text-sm font-medium">
                {{ lesson()?.isPremium ? 'Premium' : 'Gratuit' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Video Upload Section -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">Upload et Gestion Vidéo</h2>
              <p class="text-gray-600">Téléchargez et gérez la vidéo pour cette leçon</p>
            </div>
          </div>
          
          <app-video-upload 
            [lessonId]="lesson()?.id || ''"
            (videoUploaded)="onVideoUploaded($event)"
            (videoRemoved)="onVideoRemoved()">
          </app-video-upload>
        </div>

        <!-- Lesson Info -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900">Informations de la Leçon</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <p class="text-gray-900">{{ lesson()?.title }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Durée</label>
              <p class="text-gray-900">{{ formatDuration(lesson()?.durationSec || 0) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <p class="text-gray-900">{{ lesson()?.type === 'VIDEO' ? 'Vidéo' : lesson()?.type === 'PDF' ? 'PDF' : 'Examen' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <p class="text-gray-900">{{ lesson()?.isPremium ? 'Premium' : 'Gratuit' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cours</label>
              <p class="text-gray-900">{{ lesson()?.course?.title || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
              <p class="text-gray-900">{{ lesson()?.course?.semester || 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LessonVideoUploadComponent implements OnInit, OnDestroy {
  private readonly API_URL = environment.apiUrl;

  // Signals
  lesson = signal<Lesson | undefined>(undefined);
  isLoading = signal(false);
  error = signal<string>('');

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const lessonId = params['lessonId'];
      this.loadLesson(lessonId);
    });
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private loadLesson(lessonId: string) {
    this.isLoading.set(true);
    this.error.set('');

    this.http.get<Lesson>(`${this.API_URL}/lessons/${lessonId}`, { withCredentials: true }).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading lesson:', err);
        this.error.set(`Erreur lors du chargement de la leçon: ${err.message || 'Erreur inconnue'}`);
        this.isLoading.set(false);
      }
    });
  }

  onVideoUploaded(updatedLesson: Lesson) {
    console.log('✅ Video uploaded/updated in lesson:', updatedLesson);
    this.lesson.set(updatedLesson);
  }

  onVideoRemoved() {
    console.log('🗑️ Video removed from lesson');
    // Refresh the lesson data
    const lessonId = this.activatedRoute.snapshot.params['lessonId'];
    this.loadLesson(lessonId);
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

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
