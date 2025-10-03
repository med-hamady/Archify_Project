import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="bg-white">
      <div class="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 class="text-3xl md:text-5xl font-semibold text-blue-900">Apprendre mieux. Réviser plus vite.</h1>
        <p class="mt-4 text-gray-700 max-w-2xl mx-auto">
          Accédez à des cours, vidéos, notes PDF et archives d’examens rassemblés au même endroit.
        </p>
        <div class="mt-8 max-w-2xl mx-auto flex items-stretch gap-2">
          <input type="text" placeholder="Rechercher un cours, une matière, un professeur…" class="flex-1 p-3 border rounded" />
          <a routerLink="/catalog" class="px-4 py-3 bg-blue-900 text-white rounded">Rechercher</a>
        </div>
        <div class="mt-6 text-sm text-gray-500">Suggestions: Analyse, Algorithme, Logique, Examens…</div>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <a routerLink="/catalog" class="px-4 py-2 bg-orange-500 text-white rounded">Découvrir les cours</a>
          <a routerLink="/subscription" class="px-4 py-2 bg-gray-200 text-gray-900 rounded">Voir les abonnements</a>
        </div>
      </div>
    </section>

    <section class="bg-gray-50">
      <div class="max-w-6xl mx-auto px-4 py-12">
        <h2 class="text-xl font-semibold text-blue-900">Populaires</h2>
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a routerLink="/course/1" class="border rounded overflow-hidden shadow-sm hover:shadow p-4">
            <div class="aspect-video bg-gray-100"></div>
            <div class="mt-3">
              <div class="font-medium">Cours d’introduction — Exemple</div>
              <div class="text-sm text-gray-500">Prof. Exemple • Premium</div>
            </div>
          </a>
          <a routerLink="/course/2" class="border rounded overflow-hidden shadow-sm hover:shadow p-4">
            <div class="aspect-video bg-gray-100"></div>
            <div class="mt-3">
              <div class="font-medium">Approfondissement — Exemple</div>
              <div class="text-sm text-gray-500">Prof. Exemple • Premium</div>
            </div>
          </a>
          <a routerLink="/course/3" class="border rounded overflow-hidden shadow-sm hover:shadow p-4">
            <div class="aspect-video bg-gray-100"></div>
            <div class="mt-3">
              <div class="font-medium">Révisions examens — Exemple</div>
              <div class="text-sm text-gray-500">Prof. Exemple • Premium</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent {}
