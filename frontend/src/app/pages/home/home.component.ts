import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 class="text-3xl md:text-5xl font-semibold text-blue-900">Archify — Apprendre, Réviser, Réussir</h1>
      <p class="mt-4 text-gray-700 max-w-xl">Accédez à des cours, vidéos, notes PDF et archives d’examens. Parcourez le catalogue et commencez avec les leçons les plus utiles.</p>
      <div class="mt-8 flex gap-4">
        <a routerLink="/catalog" class="px-4 py-2 bg-blue-900 text-white rounded">Découvrir le catalogue</a>
        <a routerLink="/dashboard" class="px-4 py-2 bg-gray-200 text-gray-900 rounded">Aller au tableau de bord</a>
      </div>
    </div>
  `
})
export class HomeComponent {}
