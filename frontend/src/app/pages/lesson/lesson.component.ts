import { Component, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import Player from '@vimeo/player';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

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
    <div class="min-h-screen bg-gray-50">
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
          <button (click)="goToCatalog()" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Retour au catalogue
          </button>
        </div>
      </div>

      <!-- Lesson Content -->
      <div *ngIf="lesson() && !isLoading()">
        <!-- Lesson Header -->
        <div class="bg-white border-b sticky top-0 z-10">
          <div class="max-w-6xl mx-auto px-4 py-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <a [routerLink]="['/course', lesson()?.course?.id]" class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Retour au cours
                </a>
                <div>
                  <h1 class="text-lg sm:text-xl font-semibold text-gray-900">{{ lesson()?.title }}</h1>
                  <p class="text-sm text-gray-600">{{ formatDuration(lesson()?.durationSec || 0) }} • {{ lesson()?.type === 'video' ? 'Vidéo' : lesson()?.type === 'pdf' ? 'PDF' : 'Examen' }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button *ngIf="currentLessonIndex() > 0" 
                        (click)="navigateToLesson(relatedLessons()[currentLessonIndex() - 1].id)"
                        class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                  Précédent
                </button>
                <button *ngIf="currentLessonIndex() < totalLessons() - 1" 
                        (click)="navigateToLesson(relatedLessons()[currentLessonIndex() + 1].id)"
                        class="px-3 py-1 bg-blue-900 text-white rounded text-sm hover:bg-blue-800 transition-colors">
                  Suivant
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
      <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Video/Content Section -->
          <div class="lg:col-span-3">
            <!-- Video Player -->
            <div *ngIf="lesson()?.type === 'video'" 
                 class="bg-black rounded-lg overflow-hidden aspect-video relative mb-6 card" 
                 [style.background]="'linear-gradient(45deg, #1f2937 25%, transparent 25%), linear-gradient(-45deg, #1f2937 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f2937 75%), linear-gradient(-45deg, transparent 75%, #1f2937 75%)'"
                 [style.backgroundSize]="'20px 20px'"
                 [style.backgroundPosition]="'0 0, 0 10px, 10px -10px, -10px 0px'">
              <div class="absolute inset-0" #videoContainer></div>

              <!-- Dynamic Watermark -->
              <div class="absolute top-4 right-4 text-white text-xs opacity-50 pointer-events-none select-none">
                Archify - {{ userEmail() }} - {{ currentTime() }}
              </div>

              <!-- Security Notice -->
              <div class="absolute bottom-4 left-4 text-white text-xs opacity-75">
                ⚠️ Enregistrement interdit - Contenu protégé
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

            <!-- Video Controls -->
            <div *ngIf="lesson()?.type === 'video'" class="flex flex-wrap gap-2 mb-6">
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                📱 Plein écran
              </button>
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                🔊 Volume
              </button>
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                ⚙️ Paramètres
              </button>
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                📝 Notes
              </button>
            </div>

            <!-- Lesson Description -->
            <div class="card p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Description de la leçon</h3>
              <p class="text-gray-700 leading-relaxed">Cette leçon fait partie du cours "{{ lesson()?.course?.title }}". Suivez attentivement le contenu pour bien comprendre les concepts abordés.</p>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <!-- Progress -->
            <div class="card p-4 mb-6">
              <h3 class="font-semibold text-gray-900 mb-3">Progression</h3>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span>Leçon actuelle</span>
                  <span>{{ currentLessonIndex() + 1 }}/{{ totalLessons() }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" [style.width.%]="progressPercentage()"></div>
                </div>
                <p class="text-xs text-gray-500">{{ progressPercentage() }}% complété</p>
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
  private readonly API_URL = 'http://localhost:3000/api';
  
  // Signals
  private lessonSignal = signal<Lesson | undefined>(undefined);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string>('');
  private relatedLessonsSignal = signal<Lesson[]>([]);
  private progressSignal = signal<LessonProgress>({ status: 'not_started', updatedAt: null });
  subscriptionRequired = signal(false);
  
  userEmail = signal<string>('');
  currentTime = signal<string>('');
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

    // Set user email for watermark
    const user = this.authService.user();
    if (user) {
      this.userEmail.set(user.email);
    }

    // Update time for watermark
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    // Setup invisible content protection
    this.setupInvisibleContentProtection();

    // Initialize player if video
    setTimeout(() => this.initVideoPlayer(), 0);
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

  private setupInvisibleContentProtection() {
    // Invisible protection - no visible indicators to users
    
    // Disable right-click silently
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });
    
    // Disable developer tools and shortcuts silently
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+Shift+C, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
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
        // Clear clipboard silently
        navigator.clipboard.writeText('').catch(() => {});
        e.preventDefault();
        return false;
      }
      return true;
    }, { capture: true });

    // Disable mobile gestures silently
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    }, { passive: false, capture: true });

    document.addEventListener('touchend', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    }, { passive: false, capture: true });

    // Disable pinch zoom silently
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });
    
    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });
    
    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    // Disable video recording attempts
    this.disableVideoRecording();
    
    // Disable screenshot attempts
    this.disableScreenshots();
  }

  private disableVideoRecording() {
    // Monitor for screen recording attempts
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function() {
        return Promise.reject(new Error('Screen recording not allowed'));
      };
    }

    // Disable canvas toDataURL for video elements
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type?: string, quality?: number) {
      const video = document.querySelector('video');
      if (video && this.contains(video)) {
        throw new Error('Canvas export not allowed');
      }
      return originalToDataURL.call(this, type, quality);
    };
  }

  private disableScreenshots() {
    // Disable common screenshot methods
    const originalCapture = (HTMLVideoElement.prototype as any).captureStream;
    if (originalCapture) {
      (HTMLVideoElement.prototype as any).captureStream = function() {
        throw new Error('Video capture not allowed');
      };
    }

    // Disable getImageData on video contexts
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings) {
      const video = document.querySelector('video');
      if (video && this.canvas.contains(video)) {
        throw new Error('Image data access not allowed');
      }
      return originalGetImageData.call(this, sx, sy, sw, sh, settings);
    };
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

  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }
}