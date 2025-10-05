import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <!-- Hero Section -->
      <div class="relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div class="text-center">
            <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              <span class="text-blue-900">Archify</span> — 
              <span class="text-gray-700">Votre plateforme d'apprentissage</span>
            </h1>
            <p class="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Accédez à des cours, vidéos, notes PDF et archives d'examens pour réussir vos études. 
              Contenu protégé et sécurisé pour votre réussite académique.
            </p>
            <div class="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <a routerLink="/catalog" 
                 class="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-blue-900 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-lg">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Explorer les cours
              </a>
              <a routerLink="/dashboard" 
                 class="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-white text-gray-900 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-300">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Mon tableau de bord
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Section -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div class="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 text-center">Recherchez vos cours</h2>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input type="text" 
                     placeholder="Rechercher par matière, professeur, semestre..." 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base">
            </div>
            <button class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm sm:text-base shadow-md">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Rechercher
            </button>
          </div>
        </div>
      </div>

      <!-- Featured Courses Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div class="text-center mb-8 sm:mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Contenu mis en avant</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">Découvrez nos cours les plus populaires et commencez votre apprentissage dès aujourd'hui</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div *ngFor="let course of featuredCourses()" class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
            <div class="aspect-video bg-gradient-to-br {{ getCardGradient(course.color) }} flex items-center justify-center">
              <svg class="w-16 h-16 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
            </div>
            <div class="p-6">
              <div class="flex items-center justify-between mb-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {{ getTypeClass(course.type) }}">
                  {{ course.type }}
                </span>
                <span class="text-sm text-gray-500">{{ course.lessons }} leçons</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {{ course.title }}
              </h3>
              <p class="text-gray-600 text-sm mb-4">{{ course.professor }}</p>
              <p class="text-gray-700 text-sm leading-relaxed mb-4">
                {{ course.description }}
              </p>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">{{ course.semester }} • {{ course.department }}</span>
                <a [routerLink]="'/course/' + course.id" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Voir le cours →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="bg-white py-12 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Pourquoi choisir Archify ?</h2>
            <p class="text-gray-600 max-w-2xl mx-auto">Une plateforme sécurisée et moderne pour votre réussite académique</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Contenu Protégé</h3>
              <p class="text-gray-600 text-sm">Vidéos et documents sécurisés contre la copie et l'enregistrement</p>
            </div>
            
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Mobile First</h3>
              <p class="text-gray-600 text-sm">Interface optimisée pour tous les appareils mobiles et tablettes</p>
            </div>
            
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Accès Rapide</h3>
              <p class="text-gray-600 text-sm">Chargement ultra-rapide et navigation fluide</p>
            </div>
            
            <div class="text-center">
              <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Qualité Garantie</h3>
              <p class="text-gray-600 text-sm">Contenu vérifié par des professeurs experts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  // Dynamic statistics
  stats = signal({
    students: 1250,
    courses: 45,
    lessons: 320,
    professors: 28
  });

  // Featured courses
  featuredCourses = signal([
    {
      id: '1',
      title: 'Introduction à l\'Algorithmique',
      professor: 'Prof. Jean Dupont',
      lessons: 15,
      type: 'Premium',
      semester: 'S1',
      department: 'Informatique',
      description: 'Découvrez les bases de l\'algorithmique et de la programmation avec des exemples pratiques.',
      color: 'blue'
    },
    {
      id: '2',
      title: 'Analyse Mathématique',
      professor: 'Prof. Marie Curie',
      lessons: 12,
      type: 'Gratuit',
      semester: 'S1',
      department: 'Mathématiques',
      description: 'Maîtrisez les concepts fondamentaux de l\'analyse mathématique et des fonctions.',
      color: 'green'
    },
    {
      id: '3',
      title: 'Logique et Théorie des Ensembles',
      professor: 'Prof. Pierre Fermat',
      lessons: 18,
      type: 'Premium',
      semester: 'S2',
      department: 'Mathématiques',
      description: 'Explorez la logique mathématique et les fondements de la théorie des ensembles.',
      color: 'purple'
    }
  ]);

  ngOnInit() {
    // Simulate loading data
    this.animateStats();
  }

  private animateStats() {
    // Simple animation for stats
    setTimeout(() => {
      this.stats.set({
        students: 2500,
        courses: 85,
        lessons: 650,
        professors: 45
      });
    }, 1000);
  }

  getTypeClass(type: string): string {
    return type === 'Premium' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  }

  getCardGradient(color: string): string {
    const gradients = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return gradients[color as keyof typeof gradients] || 'from-gray-500 to-gray-600';
  }
}