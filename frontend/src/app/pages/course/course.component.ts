import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseSummary, MOCK_COURSES } from '../../shared/mock-data';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'pdf' | 'quiz';
  premium: boolean;
  completed: boolean;
}

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
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
                  {{ course()?.premium ? 'Premium' : 'Gratuit' }}
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors">
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
                      <p class="text-xs text-gray-500">{{ lesson.duration }}</p>
                    </div>
                    <div class="flex items-center gap-2 ml-2">
                      <span *ngIf="lesson.premium" class="text-xs text-orange-600">🔒</span>
                      <span *ngIf="lesson.completed" class="text-xs text-green-600">✓</span>
                      <span class="text-xs text-gray-400">
                        {{ lesson.type === 'video' ? '🎥' : lesson.type === 'pdf' ? '📄' : '❓' }}
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
            Ce cours couvre les concepts fondamentaux de l'algorithmique et de la programmation. 
            Vous apprendrez les structures de données de base, les algorithmes de tri et de recherche, 
            ainsi que les techniques d'optimisation. Le cours est conçu pour les étudiants débutants 
            et inclut de nombreux exercices pratiques.
          </p>
        </div>
      </div>
    </div>
  `
})
export class CourseComponent implements OnInit, OnDestroy {
  private route = signal<string>('');
  userEmail = signal<string>('user@example.com');
  currentTime = signal<string>('');
  private timeInterval: any;

  course = signal<CourseSummary | undefined>(undefined);
  selectedLesson = signal<Lesson | undefined>(undefined);

  lessons = signal<Lesson[]>([
    { id: '1', title: 'Introduction aux algorithmes', duration: '15:30', type: 'video', premium: true, completed: false },
    { id: '2', title: 'Variables et types de données', duration: '12:45', type: 'video', premium: true, completed: true },
    { id: '3', title: 'Structures de contrôle', duration: '18:20', type: 'video', premium: true, completed: false },
    { id: '4', title: 'Exercices pratiques', duration: '25:00', type: 'quiz', premium: true, completed: false },
    { id: '5', title: 'Notes de cours (PDF)', duration: '5 pages', type: 'pdf', premium: false, completed: true }
  ]);

  totalDuration = computed(() => {
    const total = this.lessons().reduce((acc, lesson) => {
      if (lesson.type === 'video') {
        const [minutes, seconds] = lesson.duration.split(':').map(Number);
        return acc + minutes * 60 + seconds;
      }
      return acc;
    }, 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  });

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const courseId = params['id'];
      const course = MOCK_COURSES.find(c => c.id === courseId);
      this.course.set(course);
      
      if (!course) {
        this.router.navigate(['/catalog']);
        return;
      }
    });

    // Update time for watermark
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    // Prevent right-click and other security measures
    this.setupContentProtection();
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
    // Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
      }
    });

    // Disable text selection on video area
    document.addEventListener('selectstart', (e) => {
      if ((e.target as HTMLElement).closest('.bg-black')) {
        e.preventDefault();
      }
    });

    // Disable drag and drop
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  selectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
    // Navigate to lesson detail
    this.router.navigate(['/lesson', lesson.id]);
  }

  trackByLessonId(index: number, lesson: Lesson): string {
    return lesson.id;
  }
}