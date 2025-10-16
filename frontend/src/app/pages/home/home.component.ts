import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <!-- Hero Section -->
      <div class="relative overflow-hidden">
        <!-- Animated Background -->
        <div class="absolute inset-0">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
          <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e0e7ff%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30 animate-pulse"></div>
        </div>
        
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div class="text-center">
            <!-- ISCAE Badge -->
            <div class="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold mb-8 shadow-lg border border-blue-200/50 hover:scale-105 transition-all duration-300">
              <svg class="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Spécialement conçu pour les étudiants ISCAE
            </div>
            
            <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-tight mb-8">
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-pulse">Archify</span>
              <br>
              <span class="text-gray-800 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Solutions d'Archives</span>
            </h1>
            
            <p class="mt-8 text-xl sm:text-2xl md:text-3xl text-gray-600 max-w-5xl mx-auto leading-relaxed font-medium mb-4">
              La plateforme de référence pour les étudiants en 
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold">Informatique de Gestion</span> 
              à l'ISCAE
            </p>
            
            <p class="text-lg sm:text-xl text-gray-500 max-w-4xl mx-auto leading-relaxed mb-12">
              Accédez aux solutions vidéo et documents de tous les examens d'archives avec des explications détaillées et professionnelles
            </p>
            
            <!-- Key Benefits -->
            <div class="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto mb-16">
              <div class="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-lg font-bold text-gray-800">Vidéos HD</span>
                <span class="text-sm text-gray-600 text-center">Solutions vidéo en haute définition</span>
              </div>
              <div class="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12V6H4v10h12z"/>
                  </svg>
                </div>
                <span class="text-lg font-bold text-gray-800">Solutions PDF</span>
                <span class="text-sm text-gray-600 text-center">Documents détaillés et téléchargeables</span>
              </div>
              <div class="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-lg font-bold text-gray-800">Archives Complètes</span>
                <span class="text-sm text-gray-600 text-center">Tous les examens des années précédentes</span>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a routerLink="/subscription" 
                 class="group inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xl font-bold rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105">
                <svg class="w-7 h-7 mr-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Commencer maintenant
                <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </a>
              <a routerLink="/catalog" 
                 class="group inline-flex items-center justify-center px-10 py-5 bg-white/80 backdrop-blur-sm text-gray-900 text-xl font-bold rounded-2xl hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-gray-200 hover:border-gray-300 transform hover:-translate-y-1 hover:scale-105">
                <svg class="w-7 h-7 mr-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Voir les cours
                <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
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

      <!-- Pricing Section -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 sm:py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">Choisissez votre plan d'accès</h2>
            <p class="text-xl text-blue-100 max-w-3xl mx-auto">Des solutions adaptées à vos besoins d'étude</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <!-- Videos Only Plan -->
            <div class="bg-white rounded-2xl shadow-2xl p-8 relative transform hover:scale-105 transition-all duration-300">
              <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Vidéos Seulement</h3>
                <p class="text-gray-600 mb-6">Accès à toutes les vidéos de solutions</p>
                <div class="mb-6">
                  <span class="text-5xl font-bold text-gray-900">650</span>
                  <span class="text-gray-600 text-lg"> MRU/an</span>
                </div>
                <ul class="text-left space-y-3 mb-8">
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Vidéos HD illimitées</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Téléchargements offline</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Support prioritaire</span>
                  </li>
                </ul>
                <a routerLink="/subscription" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block">
                  Choisir ce plan
                </a>
              </div>
            </div>

            <!-- Documents Only Plan -->
            <div class="bg-white rounded-2xl shadow-2xl p-8 relative transform hover:scale-105 transition-all duration-300">
              <div class="text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Documents Seulement</h3>
                <p class="text-gray-600 mb-6">Accès à tous les documents PDF</p>
                <div class="mb-6">
                  <span class="text-5xl font-bold text-gray-900">500</span>
                  <span class="text-gray-600 text-lg"> MRU/an</span>
                </div>
                <ul class="text-left space-y-3 mb-8">
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Solutions écrites détaillées</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Archives d'examens complets</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Téléchargements illimités</span>
                  </li>
                </ul>
                <a routerLink="/subscription" class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block">
                  Choisir ce plan
                </a>
              </div>
            </div>

            <!-- Full Access Plan -->
            <div class="bg-white rounded-2xl shadow-2xl p-8 relative transform hover:scale-105 transition-all duration-300 border-2 border-purple-200">
              <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span class="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Recommandé
                </span>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Accès Complet</h3>
                <p class="text-gray-600 mb-6">Vidéos + Documents + Plus</p>
                <div class="mb-6">
                  <span class="text-5xl font-bold text-gray-900">1000</span>
                  <span class="text-gray-600 text-lg"> MRU/an</span>
                </div>
                <ul class="text-left space-y-3 mb-8">
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Tout du plan Vidéos</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Tout du plan Documents</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Support premium 24/7</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-gray-700">Certificats de fin de cours</span>
                  </li>
                </ul>
                <a routerLink="/subscription" class="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-block">
                  Choisir ce plan
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Courses Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div class="text-center mb-8 sm:mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Matières disponibles</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">Solutions d'archives pour les matières les plus importantes d'Informatique de Gestion</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <!-- Loading state -->
          <div *ngIf="loading()" class="col-span-full text-center py-8">
            <div class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Chargement des cours...
            </div>
          </div>
          
          <!-- No courses state -->
          <div *ngIf="!loading() && featuredCourses().length === 0" class="col-span-full text-center py-8">
            <div class="text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              <p class="text-lg font-medium">Aucun cours disponible</p>
              <p class="text-sm">Les cours seront bientôt disponibles</p>
            </div>
          </div>
          
          <!-- Course cards -->
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
                <span class="text-sm font-medium text-gray-900">{{ course.semester }}</span>
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
  private readonly API_URL = environment.apiUrl;

  // Dynamic statistics
  stats = signal({
    students: 1250,
    courses: 45,
    lessons: 320,
    professors: 28
  });

  // Featured courses - now loaded from database
  featuredCourses = signal<any[]>([]);
  loading = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    console.log('🏠 Home component initialized');
    console.log('🌐 API URL:', this.API_URL);
    
    // Test API connection first
    this.testApiConnection();
    
    // Load real courses from database
    this.loadFeaturedCourses();
    this.animateStats();
  }

  private testApiConnection() {
    console.log('🧪 Testing API connection...');
    this.http.get(`${this.API_URL.replace('/api', '')}/healthz`).subscribe({
      next: (response) => {
        console.log('✅ API connection test successful:', response);
      },
      error: (error) => {
        console.error('❌ API connection test failed:', error);
      }
    });
  }

  private loadFeaturedCourses() {
    console.log('🔄 Loading featured courses from:', `${this.API_URL}/courses?isPremium=true&limit=4`);
    this.loading.set(true);
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.error('⏰ Request timeout after 10 seconds');
      this.loading.set(false);
      this.featuredCourses.set([]);
    }, 10000);
    
    this.http.get<any>(`${this.API_URL}/courses?isPremium=true&limit=4`)
      .subscribe({
        next: (response) => {
          clearTimeout(timeoutId);
          console.log('✅ Courses API response:', response);
          const courses = response.courses || response;
          console.log('📚 Courses data:', courses);
          
          // Transform courses to match the expected format
          const transformedCourses = courses.map((course: any, index: number) => ({
            id: course.id,
            title: course.title,
            professor: 'Solutions d\'Archives',
            lessons: course.lessonCount || 0,
            type: 'Premium',
            semester: course.semester,
            department: 'IG',
            description: course.description || 'Solutions complètes des examens d\'archives avec explications détaillées.',
            color: this.getColorByIndex(index)
          }));
          
          console.log('🎨 Transformed courses:', transformedCourses);
          this.featuredCourses.set(transformedCourses);
          this.loading.set(false);
        },
        error: (error) => {
          clearTimeout(timeoutId);
          console.error('❌ Error loading courses:', error);
          console.error('❌ Error details:', error.message);
          console.error('❌ Error status:', error.status);
          console.error('❌ Full error object:', error);
          this.loading.set(false);
          // Fallback to empty array if API fails
          this.featuredCourses.set([]);
        }
      });
  }

  private getColorByIndex(index: number): string {
    const colors = ['blue', 'green', 'purple', 'orange'];
    return colors[index % colors.length];
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
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return gradients[color as keyof typeof gradients] || 'from-gray-500 to-gray-600';
  }
}