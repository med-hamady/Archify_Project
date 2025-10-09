import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { VideoUploadComponent } from '../../components/video-upload/video-upload.component';

interface Course {
  id: string;
  title: string;
  description: string;
  semester: string;
  tags: string[];
  isPremium: boolean;
  views: number;
  lessonCount: number;
  lessons: Lesson[];
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'exam';
  durationSec: number;
  isPremium: boolean;
  orderIndex: number;
  createdAt: string;
  // Video upload fields
  videoUrl?: string;
  videoSize?: number;
  videoType?: string;
  uploadedAt?: string;
}

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, VideoUploadComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Loading State -->
      <div *ngIf="isLoading()" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-4 text-gray-600">Chargement du cours...</p>
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

      <!-- Course Content -->
      <div *ngIf="course() && !isLoading()">
        <!-- Course Header -->
        <div class="bg-white border-b">
          <div class="max-w-6xl mx-auto px-4 py-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 class="text-2xl md:text-3xl font-semibold text-gray-900">{{ course()?.title }}</h1>
                <p class="text-gray-600 mt-1">{{ course()?.semester }}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  <span *ngFor="let tag of course()?.tags; trackBy: trackByTag" 
                        class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {{ tag }}
                  </span>
                  <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    {{ course()?.isPremium ? 'Premium' : 'Gratuit' }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                <button *ngIf="lessons().length > 0" 
                        (click)="selectLesson(lessons()[0])"
                        class="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors">
                  Commencer
                </button>
                <button class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Partager
                </button>
              </div>
            </div>
          </div>
        </div>

      <!-- Course Content -->
      <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Video Player Section -->
          <div class="lg:col-span-2">
            <!-- Professional Video Player -->
            <div class="relative mb-8 overflow-hidden rounded-2xl shadow-2xl border border-gray-300 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
              
              <!-- Video Container -->
              <div class="aspect-video relative">
                 <!-- Show actual video if uploaded -->
                 <div *ngIf="selectedLesson()?.videoUrl" class="w-full h-full">
                   <!-- Test with a simple video first -->
                   <video 
                     class="w-full h-full object-cover"
                     controls
                     preload="auto"
                     playsinline
                     webkit-playsinline
                     [src]="getVideoUrl(selectedLesson()?.videoUrl)"
                     (click)="onVideoClick()"
                     (loadstart)="onVideoLoadStart()"
                     (canplay)="onVideoCanPlay()"
                     (error)="onVideoError($event)"
                     (loadedmetadata)="onVideoMetadataLoaded()"
                     (load)="onVideoLoad()"
                     (stalled)="onVideoStalled()"
                     (suspend)="onVideoSuspend()"
                     (canplaythrough)="onVideoCanPlayThrough()"
                     #videoElement>
                     Your browser does not support the video tag.
                   </video>
                   
    <!-- Alternative: Try with a direct URL -->
    <div class="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
      <p class="text-sm font-bold text-yellow-800">Alternative Test:</p>
      <video 
        class="w-64 h-32 border border-gray-300"
        controls
        preload="auto"
        playsinline
        webkit-playsinline
        muted
        [src]="getVideoUrl(selectedLesson()?.videoUrl)"
        (loadstart)="onAltVideoLoadStart()"
        (canplay)="onAltVideoCanPlay()"
        (error)="onAltVideoError($event)"
        #altVideoElement>
        Fallback video
      </video>
      <button (click)="playAltVideo()" class="mt-2 px-2 py-1 bg-yellow-600 text-white rounded text-xs">
        Play Alt Video
      </button>
    </div>
                   
                   <!-- Debug info overlay -->
                   <div class="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs max-w-xs">
                     <p><strong>Debug Info:</strong></p>
                     <p>Video URL: {{ getVideoUrl(selectedLesson()?.videoUrl) }}</p>
                     <p>Lesson ID: {{ selectedLesson()?.id }}</p>
                     <p>Video Size: {{ selectedLesson()?.videoSize | number }} bytes</p>
                     <p>Video Type: {{ selectedLesson()?.videoType }}</p>
                     <p>Uploaded: {{ selectedLesson()?.uploadedAt | date:'short' }}</p>
                     <button (click)="testVideoDirectly()" class="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs">
                       Test Video
                     </button>
                     <button (click)="openVideoInNewTab()" class="mt-1 px-2 py-1 bg-green-600 text-white rounded text-xs">
                       Open Video URL
                     </button>
                     <button (click)="forceReloadVideo()" class="mt-1 px-2 py-1 bg-purple-600 text-white rounded text-xs">
                       Force Reload
                     </button>
                   </div>
              </div>

                <!-- Show placeholder if no video uploaded -->
                <div *ngIf="!selectedLesson()?.videoUrl" 
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
                        {{ selectedLesson()?.title || 'Sélectionnez une leçon' }}
                      </h3>
                      <p class="text-lg opacity-90 mb-4">Contenu premium</p>
                      
                    </div>
              </div>
            </div>

              </div>

              <!-- Video Controls Bar -->
              <div class="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-t border-gray-700">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <!-- Show different controls based on whether video is uploaded -->
                    <div *ngIf="selectedLesson()?.videoUrl" class="flex items-center gap-4">
                      <span class="text-green-400 text-sm font-medium">✅ Vidéo disponible</span>
                      <button (click)="playVideoInNewTab()" class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-5v5m0-5v5"/>
                        </svg>
                        Ouvrir dans un nouvel onglet
                      </button>
                    </div>
                    
                    <!-- Default controls when no video -->
                    <div *ngIf="!selectedLesson()?.videoUrl" class="flex items-center gap-4">
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
          </div>

                </div>
              </div>
            </div>

          </div>

          <!-- Clean Sidebar -->
          <div class="lg:col-span-1">

            <!-- Lessons Section -->
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
                <p class="text-sm text-gray-600">{{ lessons().length }} leçons • {{ totalDuration() }}</p>
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
                    </div>
                    <div class="flex items-center gap-2 ml-3">
                      <span *ngIf="lesson.isPremium" class="text-xs text-orange-600 font-medium">🔒</span>
                      <span class="text-xs text-gray-400">
                        {{ lesson.type === 'video' ? '🎥' : lesson.type === 'pdf' ? '📄' : '📝' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div *ngIf="lessons().length === 0" class="p-6 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <p class="text-sm">Aucune leçon disponible</p>
              </div>
            </div>
          </div>
        </div>

          <!-- Video Upload Section (Testing Mode - Visible to All) -->
          <div *ngIf="selectedLesson()" class="mt-6">
            <app-video-upload 
              [lessonId]="selectedLesson()?.id || ''"
              (videoUploaded)="onVideoUploaded($event)"
              (videoRemoved)="onVideoRemoved()">
            </app-video-upload>
          </div>
        </div>

        <!-- Enhanced Course Description -->
        <div class="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">Description du cours</h3>
                <p class="text-sm text-gray-600">Informations détaillées sur le contenu</p>
              </div>
            </div>
          </div>
          
          <div class="p-8">
            <p class="text-gray-700 leading-relaxed text-lg">
              {{ getCourseDescription() }}
            </p>
            
            <!-- Enhanced Course Stats -->
            <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-200">
              <div class="text-center p-4 bg-blue-50 rounded-xl">
                <div class="text-3xl font-bold text-blue-600 mb-1">{{ course()?.lessonCount || 0 }}</div>
                <div class="text-sm text-blue-500 font-medium">Leçons</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded-xl">
                <div class="text-3xl font-bold text-green-600 mb-1">{{ totalDuration() }}</div>
                <div class="text-sm text-green-500 font-medium">Durée totale</div>
            </div>
              <div class="text-center p-4 bg-purple-50 rounded-xl">
                <div class="text-3xl font-bold text-purple-600 mb-1">{{ course()?.views || 0 }}</div>
                <div class="text-sm text-purple-500 font-medium">Vues</div>
            </div>
              <div class="text-center p-4 bg-orange-50 rounded-xl">
                <div class="text-3xl font-bold text-orange-600 mb-1">{{ course()?.semester }}</div>
                <div class="text-sm text-orange-500 font-medium">Semestre</div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CourseComponent implements OnInit, OnDestroy {
  private readonly API_URL = 'http://localhost:3000/api';
  
  // Signals
  private courseSignal = signal<Course | undefined>(undefined);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string>('');
  private timeInterval: any;

  // Computed properties
  course = computed(() => this.courseSignal());
  isLoading = computed(() => this.isLoadingSignal());
  error = computed(() => this.errorSignal());

  lessons = computed(() => this.course()?.lessons || []);
  selectedLesson = signal<Lesson | undefined>(undefined);

  totalDuration = computed(() => {
    const total = this.lessons().reduce((acc, lesson) => {
      return acc + lesson.durationSec;
    }, 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  });

  constructor(
    private router: Router, 
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const courseId = params['id'];
      this.loadCourse(courseId);
    });


    // Prevent right-click and other security measures
    this.setupContentProtection();
  }

  private loadCourse(courseId: string) {
    this.isLoadingSignal.set(true);
    this.errorSignal.set('');

    this.http.get<Course>(`${this.API_URL}/courses/${courseId}`).subscribe({
      next: (course) => {
        this.courseSignal.set(course);
        this.isLoadingSignal.set(false);
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.errorSignal.set('Erreur lors du chargement du cours');
        this.isLoadingSignal.set(false);
        this.router.navigate(['/catalog']);
      }
    });
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }


  private setupContentProtection() {
    // Temporarily disabled for debugging - re-enable after fixing video issue
    console.log('🔓 Security measures temporarily disabled for debugging');
    
    // TODO: Re-enable security measures after video playback is fixed
    /*
    // Disable right-click silently
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });
    
    // Disable developer tools and shortcuts silently
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 's') ||
          (e.ctrlKey && e.key === 'a') ||
          (e.ctrlKey && e.key === 'c') ||
          (e.ctrlKey && e.key === 'v') ||
          (e.ctrlKey && e.key === 'x')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    }, { capture: true });

    // Disable text selection silently
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    }, { capture: true });

    // Disable drag and drop silently
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    }, { capture: true });
    
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      return false;
    }, { capture: true });
    
    // Disable print screen silently
    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('').catch(() => {});
        e.preventDefault();
        return false;
      }
      return true;
    }, { capture: true });
    */
  }

  selectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
    // For testing: Stay on course page to show video upload
    // this.router.navigate(['/lesson', lesson.id]);
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

  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  trackByTag(index: number, tag: string): string {
    return tag;
  }

  // Video interaction
  onVideoClick() {
    console.log('🎬 Video clicked - Security measures active');
    // Professional video interaction without alerts
  }

  getCourseDescription(): string {
    return this.course()?.description || 'Ce cours vous permettra d\'acquérir des connaissances approfondies dans le domaine de l\'algorithmique et de la programmation.';
  }

  // Admin check
  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN' || this.authService.getUserRole() === 'SUPERADMIN';
  }

  // Video upload handlers
  onVideoUploaded(videoData: any) {
    console.log('Video uploaded successfully:', videoData);
    // Refresh the lesson data to show the new video
    this.loadCourse(this.activatedRoute.snapshot.params['id']);
  }

  onVideoRemoved() {
    console.log('Video removed successfully');
    // Refresh the lesson data
    this.loadCourse(this.activatedRoute.snapshot.params['id']);
  }

  // Get full video URL
  getVideoUrl(videoUrl: string | undefined): string {
    if (!videoUrl) {
      console.log('❌ No video URL provided');
      return '';
    }
    // If it's already a full URL, return as is
    if (videoUrl.startsWith('http')) {
      console.log('✅ Video URL is already complete:', videoUrl);
      return videoUrl;
    }
    // Otherwise, prepend the backend URL
    const fullUrl = `http://localhost:3000${videoUrl}`;
    console.log('🔗 Constructed video URL:', fullUrl);
    return fullUrl;
  }

  // Play video in new tab
  playVideoInNewTab() {
    if (this.selectedLesson()?.videoUrl) {
      const videoUrl = this.getVideoUrl(this.selectedLesson()?.videoUrl);
      window.open(videoUrl, '_blank');
    }
  }

  // Video debugging methods
  onVideoLoadStart() {
    console.log('🎬 Video load started');
  }

  onVideoCanPlay() {
    console.log('✅ Video can play');
    this.enableVideoInteraction();
  }

  onVideoError(event: any) {
    console.error('❌ Video error:', event);
    console.error('Video src:', this.getVideoUrl(this.selectedLesson()?.videoUrl));
  }

  onVideoMetadataLoaded() {
    console.log('📊 Video metadata loaded');
    console.log('Video URL:', this.getVideoUrl(this.selectedLesson()?.videoUrl));
  }

  onVideoLoad() {
    console.log('✅ Video loaded successfully');
  }

  onVideoStalled() {
    console.warn('⚠️ Video loading stalled');
  }

  onVideoSuspend() {
    console.warn('⚠️ Video loading suspended');
  }

  onVideoCanPlayThrough() {
    console.log('🎬 Video can play through - fully loaded');
  }

  // Enable video interaction programmatically
  enableVideoInteraction() {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.controls = true;
      videoElement.muted = false; // Ensure audio is not muted
      videoElement.volume = 0.5; // Set a default volume
      console.log('🎬 Video interaction enabled');
    }
  }

  // Test video directly
  testVideoDirectly() {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      console.log('🎬 Testing video element:');
      console.log('- Video src:', videoElement.src);
      console.log('- Video readyState:', videoElement.readyState);
      console.log('- Video networkState:', videoElement.networkState);
      console.log('- Video paused:', videoElement.paused);
      console.log('- Video muted:', videoElement.muted);
      console.log('- Video controls:', videoElement.controls);
      
      // Test if the video URL is accessible
      const videoUrl = this.getVideoUrl(this.selectedLesson()?.videoUrl);
      console.log('🔗 Testing video URL accessibility:', videoUrl);
      
      // Try to fetch the video URL directly
      fetch(videoUrl, { method: 'HEAD' })
        .then(response => {
          console.log('✅ Video URL is accessible:', response.status, response.statusText);
          console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        })
        .catch(error => {
          console.error('❌ Video URL is not accessible:', error);
        });
    } else {
      console.error('❌ No video element found');
    }
  }

  // Open video URL in new tab for testing
  openVideoInNewTab() {
    const videoUrl = this.getVideoUrl(this.selectedLesson()?.videoUrl);
    console.log('🔗 Opening video URL in new tab:', videoUrl);
    window.open(videoUrl, '_blank');
  }

  // Force reload video element
  forceReloadVideo() {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      console.log('🔄 Force reloading video element...');
      // Just reload, don't auto-play to avoid infinite loops
      videoElement.load();
      console.log('✅ Video element reloaded');
    }
  }

  // Alternative video methods
  onAltVideoLoadStart() {
    console.log('🎬 Alt video load started');
  }

  onAltVideoCanPlay() {
    console.log('✅ Alt video can play');
  }

  onAltVideoError(event: any) {
    console.error('❌ Alt video error:', event);
  }

  playAltVideo() {
    const altVideoElement = document.querySelector('#altVideoElement') as HTMLVideoElement;
    if (altVideoElement) {
      console.log('🎬 Playing alt video...');
      altVideoElement.play().then(() => {
        console.log('✅ Alt video play succeeded');
      }).catch((error) => {
        console.error('❌ Alt video play failed:', error);
      });
    }
  }

}