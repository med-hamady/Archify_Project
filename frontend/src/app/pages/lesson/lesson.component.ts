import { Component, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen bg-black text-white" 
         (contextmenu)="$event.preventDefault()"
         (selectstart)="$event.preventDefault()"
         (dragstart)="$event.preventDefault()">
      
      <!-- Security Watermark Overlay -->
      <div class="fixed inset-0 pointer-events-none z-50">
        <div class="absolute top-4 left-4 text-white/20 text-xs font-mono">
          {{ userWatermark() }} - {{ timestamp() }}
        </div>
        <div class="absolute top-4 right-4 text-white/20 text-xs font-mono">
          {{ userWatermark() }} - {{ timestamp() }}
        </div>
        <div class="absolute bottom-4 left-4 text-white/20 text-xs font-mono">
          {{ userWatermark() }} - {{ timestamp() }}
        </div>
        <div class="absolute bottom-4 right-4 text-white/20 text-xs font-mono">
          {{ userWatermark() }} - {{ timestamp() }}
        </div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/10 text-lg font-mono">
          {{ userWatermark() }}
        </div>
      </div>

      <!-- Header -->
      <div class="bg-gray-900 border-b border-gray-700 px-4 py-3">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <a routerLink="/course/1" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <h1 class="text-lg font-semibold">Introduction et concepts de base</h1>
          </div>
          <div class="flex items-center gap-3">
            <button class="text-gray-400 hover:text-white transition-colors" (click)="toggleFullscreen()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
              </svg>
            </button>
            <button class="text-gray-400 hover:text-white transition-colors" (click)="toggleSettings()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Video Player Area -->
      <div class="relative">
        <div class="aspect-video bg-black relative overflow-hidden">
          <!-- Video placeholder with watermark -->
          <div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
            <!-- Additional security watermarks -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute top-1/4 left-1/4 text-white/15 text-sm font-mono transform -rotate-45">
                {{ userWatermark() }}
              </div>
              <div class="absolute top-3/4 right-1/4 text-white/15 text-sm font-mono transform rotate-45">
                {{ userWatermark() }}
              </div>
            </div>
            
            <!-- Play button -->
            <button class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm"
                    (click)="playVideo()">
              <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Video Controls -->
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div class="flex items-center gap-4">
            <button class="text-white hover:text-gray-300 transition-colors" (click)="togglePlay()">
              <svg *ngIf="!isPlaying" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg *ngIf="isPlaying" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            <div class="flex-1 bg-gray-600 rounded-full h-1">
              <div class="bg-white h-1 rounded-full" [style.width.%]="progress()"></div>
            </div>
            <span class="text-sm text-gray-300">{{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}</span>
            <button class="text-white hover:text-gray-300 transition-colors" (click)="toggleMute()">
              <svg *ngIf="!isMuted" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
              </svg>
              <svg *ngIf="isMuted" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Lesson Content -->
      <div class="bg-gray-900 px-4 py-6">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Main Content -->
            <div class="lg:col-span-2">
              <h2 class="text-xl font-semibold mb-4">Description de la leçon</h2>
              <p class="text-gray-300 leading-relaxed mb-6">
                Cette leçon introduit les concepts fondamentaux nécessaires pour comprendre les bases de l'algorithmique. 
                Nous couvrirons les structures de données essentielles et les algorithmes de base.
              </p>

              <!-- PDF Viewer (Protected) -->
              <div class="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 class="text-lg font-semibold mb-3">Notes de cours</h3>
                <div class="aspect-[4/3] bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <!-- PDF Watermark -->
                  <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute top-2 left-2 text-gray-500/30 text-xs font-mono">
                      {{ userWatermark() }}
                    </div>
                    <div class="absolute top-2 right-2 text-gray-500/30 text-xs font-mono">
                      {{ userWatermark() }}
                    </div>
                    <div class="absolute bottom-2 left-2 text-gray-500/30 text-xs font-mono">
                      {{ userWatermark() }}
                    </div>
                    <div class="absolute bottom-2 right-2 text-gray-500/30 text-xs font-mono">
                      {{ userWatermark() }}
                    </div>
                  </div>
                  <div class="text-center">
                    <svg class="w-12 h-12 text-gray-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <p class="text-gray-400">PDF protégé - Cliquez pour ouvrir</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              <!-- Lesson Info -->
              <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-3">Informations</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Durée</span>
                    <span class="text-white">45 minutes</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Type</span>
                    <span class="text-white">Vidéo + PDF</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Difficulté</span>
                    <span class="text-white">Débutant</span>
                  </div>
                </div>
              </div>

              <!-- Navigation -->
              <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-3">Navigation</h3>
                <div class="space-y-2">
                  <a routerLink="/lesson/1" class="block p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors">
                    ← Leçon précédente
                  </a>
                  <a routerLink="/lesson/3" class="block p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors">
                    Leçon suivante →
                  </a>
                  <a routerLink="/course/1" class="block p-2 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors text-center">
                    Retour au cours
                  </a>
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
  userWatermark = signal<string>('');
  timestamp = signal<string>('');
  isPlaying = signal<boolean>(false);
  isMuted = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(1800); // 30 minutes in seconds
  progress = signal<number>(0);

  private intervalId?: number;

  ngOnInit() {
    // Generate user watermark
    this.userWatermark.set(`USER_${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    this.updateTimestamp();
    
    // Update timestamp every second
    this.intervalId = window.setInterval(() => {
      this.updateTimestamp();
    }, 1000);

    // Disable right-click, text selection, and drag
    document.addEventListener('contextmenu', this.preventContextMenu);
    document.addEventListener('selectstart', this.preventSelection);
    document.addEventListener('dragstart', this.preventDrag);
    
    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    document.addEventListener('keydown', this.preventDevTools);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    document.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('selectstart', this.preventSelection);
    document.removeEventListener('dragstart', this.preventDrag);
    document.removeEventListener('keydown', this.preventDevTools);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    // Prevent page refresh/close during video playback
    if (this.isPlaying()) {
      event.preventDefault();
      event.returnValue = 'Êtes-vous sûr de vouloir quitter ? Votre progression sera perdue.';
    }
  }

  private updateTimestamp() {
    const now = new Date();
    this.timestamp.set(now.toISOString().slice(0, 19).replace('T', ' '));
  }

  private preventContextMenu = (e: Event) => {
    e.preventDefault();
  };

  private preventSelection = (e: Event) => {
    e.preventDefault();
  };

  private preventDrag = (e: Event) => {
    e.preventDefault();
  };

  private preventDevTools = (e: KeyboardEvent) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, etc.
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'a') ||
        (e.ctrlKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'v') ||
        (e.ctrlKey && e.key === 'x')) {
      e.preventDefault();
    }
  };

  playVideo() {
    this.isPlaying.set(true);
    // In real implementation, start video playback
  }

  togglePlay() {
    this.isPlaying.set(!this.isPlaying());
  }

  toggleMute() {
    this.isMuted.set(!this.isMuted());
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  toggleSettings() {
    // In real implementation, show video settings
    console.log('Settings clicked');
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}