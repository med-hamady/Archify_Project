import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { VideoUploadComponent } from '../../components/video-upload/video-upload.component';

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'EXAM';
  durationSec: number;
  isPremium: boolean;
  orderIndex: number;
  createdAt: string;
  courseId: string;
  course: {
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
  selector: 'app-lesson-management',
  standalone: true,
  imports: [CommonModule, VideoUploadComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Leçons</h1>
              <p class="text-gray-600 mt-1">Gérez les vidéos et contenu des leçons</p>
            </div>
            <button (click)="goBack()" 
                    class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              ← Retour
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-4 text-gray-600">Chargement des leçons...</p>
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
          <button (click)="loadLessons()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Réessayer
          </button>
        </div>
      </div>

      <!-- Lessons Content -->
      <div *ngIf="lessons().length > 0 && !isLoading()" class="max-w-7xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Lessons List -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-lg border border-gray-200">
              <div class="p-6 border-b border-gray-200">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <h3 class="font-bold text-gray-900">Leçons</h3>
                </div>
                <p class="text-sm text-gray-600">{{ lessons().length }} leçons disponibles</p>
              </div>
              
              <div class="max-h-96 overflow-y-auto">
                <div *ngFor="let lesson of lessons(); trackBy: trackByLessonId" 
                     class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                     [class.bg-blue-50]="selectedLesson()?.id === lesson.id"
                     (click)="selectLesson(lesson)">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ lesson.title }}</p>
                      <p class="text-xs text-gray-500 mt-1">{{ formatDuration(lesson.durationSec) }}</p>
                      <p class="text-xs text-gray-400 mt-1">{{ lesson.course.title || 'N/A' }} - {{ lesson.course.semester || 'N/A' }}</p>
                    </div>
                    <div class="flex items-center gap-2 ml-3">
                      <span *ngIf="lesson.videoUrl" class="text-xs text-green-600 font-medium">🎥</span>
                      <span *ngIf="!lesson.videoUrl" class="text-xs text-gray-400">📹</span>
                      <span class="text-xs text-gray-400">
                        {{ lesson.type === 'VIDEO' ? '🎥' : lesson.type === 'PDF' ? '📄' : '📝' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lesson Management Area -->
          <div class="lg:col-span-2">
            <div *ngIf="selectedLesson()" class="space-y-6">
              
              <!-- Lesson Info -->
              <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-gray-900">{{ selectedLesson()?.title }}</h2>
                    <p class="text-sm text-gray-600">{{ selectedLesson()?.course?.title || 'N/A' }} - {{ selectedLesson()?.course?.semester || 'N/A' }}</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-lg font-bold text-blue-600">{{ formatDuration(selectedLesson()?.durationSec || 0) }}</div>
                    <div class="text-xs text-blue-500">Durée</div>
                  </div>
                  <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-lg font-bold text-green-600">{{ selectedLesson()?.type }}</div>
                    <div class="text-xs text-green-500">Type</div>
                  </div>
                  <div class="text-center p-3 bg-purple-50 rounded-lg">
                    <div class="text-lg font-bold text-purple-600">{{ selectedLesson()?.isPremium ? 'Premium' : 'Gratuit' }}</div>
                    <div class="text-xs text-purple-500">Statut</div>
                  </div>
                  <div class="text-center p-3 bg-orange-50 rounded-lg">
                    <div class="text-lg font-bold text-orange-600">{{ selectedLesson()?.videoUrl ? 'Oui' : 'Non' }}</div>
                    <div class="text-xs text-orange-500">Vidéo</div>
                  </div>
                </div>
              </div>

              <!-- Video Upload Section -->
              <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                  </div>
                  <h3 class="font-bold text-gray-900">Upload Vidéos</h3>
                </div>
                <p class="text-sm text-gray-600 mb-4">Uploadez une vidéo pour cette leçon. Les étudiants abonnés pourront y accéder.</p>
                
                <app-video-upload 
                  [lessonId]="selectedLesson()?.id || ''"
                  (videoUploaded)="onVideoUploaded($event)"
                  (videoRemoved)="onVideoRemoved()">
                </app-video-upload>
              </div>

              <!-- Video Preview Section -->
              <div *ngIf="selectedLesson()?.videoUrl" class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-5v5m0-5v5"/>
                    </svg>
                  </div>
                  <h3 class="font-bold text-gray-900">Aperçu de la Vidéo</h3>
                </div>
                <p class="text-sm text-gray-600 mb-4">Testez la vidéo pour vous assurer qu'elle fonctionne correctement.</p>
                
                <div class="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video 
                    class="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    [src]="getVideoUrl(selectedLesson()?.videoUrl)"
                    #previewVideo>
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <div class="mt-4 flex items-center gap-4">
                  <button (click)="testVideo()" 
                          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    🎬 Tester la Vidéo
                  </button>
                  <button (click)="openVideoInNewTab()" 
                          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    🔗 Ouvrir dans un Nouvel Onglet
                  </button>
                </div>
              </div>

            </div>

            <!-- No Lesson Selected -->
            <div *ngIf="!selectedLesson()" class="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Sélectionnez une Leçon</h3>
              <p class="text-gray-500">Choisissez une leçon dans la liste pour commencer à gérer ses vidéos.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- No Lessons -->
      <div *ngIf="lessons().length === 0 && !isLoading()" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune Leçon Trouvée</h3>
          <p class="text-gray-500 mb-4">Il n'y a actuellement aucune leçon disponible dans la base de données.</p>
          <p class="text-sm text-gray-400 mb-6">Créez d'abord des leçons dans le panneau d'administration principal.</p>
          <div class="flex gap-3 justify-center">
            <button (click)="goBack()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Retour à l'Admin
            </button>
            <button (click)="loadLessons()" 
                    class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LessonManagementComponent implements OnInit {
  private readonly API_URL = 'http://localhost:3000/api';

  lessons = signal<Lesson[]>([]);
  selectedLesson = signal<Lesson | null>(null);
  isLoading = signal(true);
  error = signal<string>('');

  constructor(
    private http: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadLessons();
  }

  loadLessons() {
    this.isLoading.set(true);
    this.error.set('');

    console.log('🔄 Loading lessons from:', `${this.API_URL}/lessons`);
    
    this.http.get<any>(`${this.API_URL}/lessons?isPremium=true`, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('📚 Lessons API response:', response);
        
        // Handle different response formats
        let lessons: Lesson[] = [];
        if (Array.isArray(response)) {
          lessons = response;
        } else if (response && Array.isArray(response.lessons)) {
          lessons = response.lessons;
        } else if (response && response.data && Array.isArray(response.data)) {
          lessons = response.data;
        }
        
        // If no lessons found, show a helpful message
        if (lessons.length === 0) {
          console.log('📭 No lessons found in database');
        }
        
        console.log('📖 Processed lessons:', lessons);
        this.lessons.set(lessons);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading lessons:', err);
        this.error.set(`Erreur lors du chargement des leçons: ${err.message || 'Erreur inconnue'}`);
        this.isLoading.set(false);
      }
    });
  }

  selectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
  }

  onVideoUploaded(videoData: any) {
    console.log('Video uploaded successfully:', videoData);
    // Update the selected lesson with new video data
    const currentLesson = this.selectedLesson();
    if (currentLesson) {
      this.selectedLesson.set({
        ...currentLesson,
        videoUrl: videoData.videoUrl,
        videoSize: videoData.videoSize,
        videoType: videoData.videoType,
        uploadedAt: videoData.uploadedAt
      });
    }
  }

  onVideoRemoved() {
    console.log('Video removed successfully');
    // Update the selected lesson to remove video data
    const currentLesson = this.selectedLesson();
    if (currentLesson) {
      this.selectedLesson.set({
        ...currentLesson,
        videoUrl: undefined,
        videoSize: undefined,
        videoType: undefined,
        uploadedAt: undefined
      });
    }
  }

  testVideo() {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.play().then(() => {
        console.log('✅ Video test play succeeded');
      }).catch((error) => {
        console.error('❌ Video test play failed:', error);
      });
    }
  }

  openVideoInNewTab() {
    const videoUrl = this.getVideoUrl(this.selectedLesson()?.videoUrl);
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  }

  getVideoUrl(videoUrl: string | undefined): string {
    if (!videoUrl) return '';
    if (videoUrl.startsWith('http')) return videoUrl;
    return `http://localhost:3000${videoUrl}`;
  }

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

  trackByLessonId(index: number, lesson: Lesson): string {
    return lesson.id;
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
