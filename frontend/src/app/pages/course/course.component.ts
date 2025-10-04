import { Component, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseSummary, MOCK_COURSES } from '../../shared/mock-data';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Course Header -->
      <div class="bg-white shadow-sm border-b">
        <div class="max-w-6xl mx-auto px-4 py-6">
          <nav class="text-sm text-gray-500 mb-4">
            <a routerLink="/catalog" class="hover:text-blue-600">Catalogue</a> / 
            <span class="text-gray-900">{{ course()?.title }}</span>
          </nav>
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 class="text-2xl md:text-3xl font-bold text-gray-900">{{ course()?.title }}</h1>
              <p class="text-gray-600 mt-2">{{ course()?.professor }} • {{ course()?.department }}</p>
              <div class="flex flex-wrap gap-2 mt-3">
                <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{{ course()?.semester }}</span>
                <span *ngFor="let tag of course()?.tags" class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{{ tag }}</span>
                <span class="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  {{ course()?.premium ? 'Premium' : 'Gratuit' }}
                </span>
              </div>
            </div>
            <div class="flex gap-3">
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {{ course()?.premium ? 'Accéder au contenu' : 'Commencer' }}
              </button>
              <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Partager
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Course Content -->
      <div class="max-w-6xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2">
            <!-- Video Player Section -->
            <div class="bg-white rounded-lg shadow-sm border mb-6">
              <div class="p-4 border-b">
                <h2 class="text-lg font-semibold text-gray-900">Vidéo de présentation</h2>
              </div>
              <div class="relative">
                <div class="aspect-video bg-black relative overflow-hidden" 
                     [style.background-image]="'url(https://via.placeholder.com/800x450/1f2937/ffffff?text=Video+Player)'"
                     style="background-size: cover; background-position: center;">
                  <!-- Watermark overlay -->
                  <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute top-4 left-4 text-white/30 text-sm font-mono">
                      {{ userWatermark() }}
                    </div>
                    <div class="absolute top-4 right-4 text-white/30 text-sm font-mono">
                      {{ userWatermark() }}
                    </div>
                    <div class="absolute bottom-4 left-4 text-white/30 text-sm font-mono">
                      {{ userWatermark() }}
                    </div>
                    <div class="absolute bottom-4 right-4 text-white/30 text-sm font-mono">
                      {{ userWatermark() }}
                    </div>
                  </div>
                  <!-- Play button overlay -->
                  <div class="absolute inset-0 flex items-center justify-center">
                    <button class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            (click)="playVideo()">
                      <svg class="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course Description -->
            <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Description du cours</h3>
              <p class="text-gray-700 leading-relaxed">
                Ce cours couvre les concepts fondamentaux de {{ course()?.title }}. 
                Vous apprendrez les bases théoriques et pratiques nécessaires pour maîtriser cette matière.
              </p>
            </div>

            <!-- Lessons List -->
            <div class="bg-white rounded-lg shadow-sm border">
              <div class="p-4 border-b">
                <h3 class="text-lg font-semibold text-gray-900">Leçons disponibles</h3>
              </div>
              <div class="divide-y">
                <div *ngFor="let lesson of lessons()" class="p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 class="font-medium text-gray-900">{{ lesson.title }}</h4>
                        <p class="text-sm text-gray-500">{{ lesson.duration }} • {{ lesson.type }}</p>
                      </div>
                    </div>
                    <a [routerLink]="['/lesson', lesson.id]" 
                       class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      Voir
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Course Info Card -->
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Durée totale</span>
                  <span class="font-medium">12 heures</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Leçons</span>
                  <span class="font-medium">{{ lessons().length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Niveau</span>
                  <span class="font-medium">Débutant</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Langue</span>
                  <span class="font-medium">Français</span>
                </div>
              </div>
            </div>

            <!-- PDF Resources -->
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Ressources PDF</h3>
              <div class="space-y-3">
                <div *ngFor="let pdf of pdfResources()" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-900">{{ pdf.name }}</span>
                  </div>
                  <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CourseComponent implements OnInit {
  course = signal<CourseSummary | undefined>(undefined);
  userWatermark = signal<string>('');

  lessons = signal([
    { id: '1', title: 'Introduction et concepts de base', duration: '45 min', type: 'Vidéo' },
    { id: '2', title: 'Exemples pratiques', duration: '30 min', type: 'Vidéo' },
    { id: '3', title: 'Exercices et applications', duration: '60 min', type: 'PDF' },
    { id: '4', title: 'QCM de révision', duration: '20 min', type: 'Quiz' }
  ]);

  pdfResources = signal([
    { name: 'Notes de cours - Chapitre 1.pdf' },
    { name: 'Exercices corrigés.pdf' },
    { name: 'Annales d\'examens.pdf' }
  ]);

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Generate user watermark (in real app, this would come from user data)
    this.userWatermark.set(`USER_${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    
    // Get course ID from route
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      const foundCourse = MOCK_COURSES.find(c => c.id === courseId);
      this.course.set(foundCourse);
    }
  }

  playVideo() {
    // In real implementation, this would open the video player
    console.log('Playing video...');
  }
}