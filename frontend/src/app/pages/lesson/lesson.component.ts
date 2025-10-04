import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'pdf' | 'quiz';
  premium: boolean;
  completed: boolean;
  description: string;
  content: string;
}

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Lesson Header -->
      <div class="bg-white border-b sticky top-0 z-10">
        <div class="max-w-6xl mx-auto px-4 py-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <a routerLink="/course/1" class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Retour au cours
              </a>
              <div>
                <h1 class="text-lg sm:text-xl font-semibold text-gray-900">{{ lesson()?.title }}</h1>
                <p class="text-sm text-gray-600">{{ lesson()?.duration }} • {{ lesson()?.type === 'video' ? 'Vidéo' : lesson()?.type === 'pdf' ? 'PDF' : 'Quiz' }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                Précédent
              </button>
              <button class="px-3 py-1 bg-blue-900 text-white rounded text-sm hover:bg-blue-800 transition-colors">
                Suivant
              </button>
            </div>
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
                 class="bg-black rounded-lg overflow-hidden aspect-video relative mb-6" 
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

            <!-- PDF Viewer -->
            <div *ngIf="lesson()?.type === 'pdf'" 
                 class="bg-white rounded-lg border aspect-[4/3] flex items-center justify-center mb-6">
              <div class="text-center text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                </svg>
                <p class="text-lg font-medium">PDF Protégé</p>
                <p class="text-sm">Contenu sécurisé - Téléchargement interdit</p>
              </div>
            </div>

            <!-- Quiz Section -->
            <div *ngIf="lesson()?.type === 'quiz'" 
                 class="bg-white rounded-lg border p-6 mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Quiz interactif</h3>
              <p class="text-gray-600 mb-4">Répondez aux questions pour valider vos connaissances.</p>
              <button class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors">
                Commencer le quiz
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
            <div class="bg-white rounded-lg border p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Description de la leçon</h3>
              <p class="text-gray-700 leading-relaxed">{{ lesson()?.description }}</p>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <!-- Progress -->
            <div class="bg-white rounded-lg border p-4 mb-6">
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
            <div class="bg-white rounded-lg border p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Leçons du cours</h3>
              <div class="space-y-2">
                <div *ngFor="let relatedLesson of relatedLessons(); trackBy: trackByLessonId" 
                     class="p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                     [class.bg-blue-50]="relatedLesson.id === lesson()?.id"
                     (click)="navigateToLesson(relatedLesson.id)">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ relatedLesson.title }}</p>
                      <p class="text-xs text-gray-500">{{ relatedLesson.duration }}</p>
                    </div>
                    <div class="flex items-center gap-1 ml-2">
                      <span *ngIf="relatedLesson.premium" class="text-xs text-orange-600">🔒</span>
                      <span *ngIf="relatedLesson.completed" class="text-xs text-green-600">✓</span>
                      <span class="text-xs text-gray-400">
                        {{ relatedLesson.type === 'video' ? '🎥' : relatedLesson.type === 'pdf' ? '📄' : '❓' }}
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
  userEmail = signal<string>('user@example.com');
  currentTime = signal<string>('');
  private timeInterval: any;

  lesson = signal<Lesson | undefined>(undefined);
  currentLessonIndex = signal<number>(0);
  totalLessons = signal<number>(5);

  // Mock data for related lessons
  relatedLessons = signal<Lesson[]>([
    { id: '1', title: 'Introduction aux algorithmes', duration: '15:30', type: 'video', premium: true, completed: false, description: 'Découvrez les bases de l\'algorithmique', content: '' },
    { id: '2', title: 'Variables et types de données', duration: '12:45', type: 'video', premium: true, completed: true, description: 'Apprenez les différents types de variables', content: '' },
    { id: '3', title: 'Structures de contrôle', duration: '18:20', type: 'video', premium: true, completed: false, description: 'Maîtrisez les boucles et conditions', content: '' },
    { id: '4', title: 'Exercices pratiques', duration: '25:00', type: 'quiz', premium: true, completed: false, description: 'Testez vos connaissances', content: '' },
    { id: '5', title: 'Notes de cours (PDF)', duration: '5 pages', type: 'pdf', premium: false, completed: true, description: 'Résumé du cours en PDF', content: '' }
  ]);

  progressPercentage = computed(() => {
    const completed = this.relatedLessons().filter(l => l.completed).length;
    return Math.round((completed / this.totalLessons()) * 100);
  });

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const lessonId = params['id'];
      const lesson = this.relatedLessons().find(l => l.id === lessonId);
      this.lesson.set(lesson);
      
      if (lesson) {
        const index = this.relatedLessons().findIndex(l => l.id === lessonId);
        this.currentLessonIndex.set(index);
      }
    });

    // Update time for watermark
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    // Setup comprehensive content protection
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
    // Disable right-click globally
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Disable developer tools shortcuts
    document.addEventListener('keydown', (e) => {
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
        return;
      }
    });

    // Disable text selection on protected content
    document.addEventListener('selectstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.bg-black') || target.closest('.bg-white.rounded-lg.border')) {
        e.preventDefault();
      }
    });

    // Disable drag and drop
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    // Disable print screen
    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard.writeText('');
      }
    });

    // Disable screenshot on mobile
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Clear sensitive content when tab is hidden
        console.clear();
      }
    });

    // Disable zoom on mobile for better security
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });

    // Disable long press on mobile
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.bg-black') || target.closest('.bg-white.rounded-lg.border')) {
        e.preventDefault();
      }
    });
  }

  navigateToLesson(lessonId: string) {
    this.router.navigate(['/lesson', lessonId]);
  }

  trackByLessonId(index: number, lesson: Lesson): string {
    return lesson.id;
  }
}