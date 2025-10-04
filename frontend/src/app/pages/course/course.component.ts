import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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
}

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule],
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
                <p class="text-gray-600 mt-1">{{ course()?.professor }} • {{ course()?.semester }}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  <span *ngFor="let tag of course()?.tags" 
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
            <div class="bg-black rounded-lg overflow-hidden aspect-video relative card" 
                 [style.background]="'linear-gradient(45deg, #1f2937 25%, transparent 25%), linear-gradient(-45deg, #1f2937 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f2937 75%), linear-gradient(-45deg, transparent 75%, #1f2937 75%)'"
                 [style.backgroundSize]="'20px 20px'"
                 [style.backgroundPosition]="'0 0, 0 10px, 10px -10px, -10px 0px'">
              
              <!-- Content Protection Overlay -->
              <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div class="text-center text-white">
                  <div class="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v6l4 2 4-2V5l-4-2-4 2z"/>
                    </svg>
                  </div>
                  <p class="text-lg font-medium">Vidéo protégée</p>
                  <p class="text-sm opacity-75">Connectez-vous pour accéder au contenu</p>
                </div>
              </div>

              <!-- Dynamic Watermark -->
              <div class="absolute top-4 right-4 text-white text-xs opacity-50 pointer-events-none select-none">
                Archify - {{ userEmail() }} - {{ currentTime() }}
              </div>

              <!-- Security Notice -->
              <div class="absolute bottom-4 left-4 text-white text-xs opacity-75">
                ⚠️ Enregistrement interdit - Contenu protégé
              </div>
            </div>

            <!-- Video Controls -->
            <div class="mt-4 flex flex-wrap gap-2">
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                📱 Plein écran
              </button>
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                🔊 Volume
              </button>
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                ⚙️ Paramètres
              </button>
            </div>
          </div>

          <!-- Lessons Sidebar -->
          <div class="lg:col-span-1">
            <div class="card">
              <div class="p-4 border-b">
                <h3 class="font-semibold text-gray-900">Leçons</h3>
                <p class="text-sm text-gray-600">{{ lessons().length }} leçons • {{ totalDuration() }}</p>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <div *ngFor="let lesson of lessons(); trackBy: trackByLessonId" 
                     class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                     [class.bg-blue-50]="selectedLesson()?.id === lesson.id"
                     (click)="selectLesson(lesson)">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ lesson.title }}</p>
                      <p class="text-xs text-gray-500">{{ formatDuration(lesson.durationSec) }}</p>
                    </div>
                    <div class="flex items-center gap-2 ml-2">
                      <span *ngIf="lesson.isPremium" class="text-xs text-orange-600">🔒</span>
                      <span class="text-xs text-gray-400">
                        {{ lesson.type === 'video' ? '🎥' : lesson.type === 'pdf' ? '📄' : '📝' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Course Description -->
        <div class="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Description du cours</h3>
          <p class="text-gray-700 leading-relaxed">
            {{ course()?.description }}
          </p>
          
          <!-- Course Stats -->
          <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ course()?.lessonCount }}</div>
              <div class="text-sm text-gray-500">Leçons</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ totalDuration() }}</div>
              <div class="text-sm text-gray-500">Durée totale</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ course()?.views }}</div>
              <div class="text-sm text-gray-500">Vues</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">{{ course()?.semester }}</div>
              <div class="text-sm text-gray-500">Semestre</div>
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
  userEmail = signal<string>('');
  currentTime = signal<string>('');
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

    // Set user email for watermark
    const user = this.authService.user();
    if (user) {
      this.userEmail.set(user.email);
    }

    // Update time for watermark
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

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

  private updateTime() {
    this.currentTime.set(new Date().toLocaleTimeString('fr-FR'));
  }

  private setupContentProtection() {
    // Invisible protection - no visible indicators to users
    
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
  }

  selectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
    // Navigate to lesson detail
    this.router.navigate(['/lesson', lesson.id]);
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