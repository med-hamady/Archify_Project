import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <h2 class="text-2xl font-semibold text-blue-900">Catalogue</h2>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select class="p-2 border rounded"><option>Semestre</option><option>S1</option><option>S2</option></select>
        <select class="p-2 border rounded"><option>Département</option><option>Département A</option></select>
        <select class="p-2 border rounded"><option>Matière</option><option>Analyse</option><option>Algorithme</option><option>Logique</option></select>
        <select class="p-2 border rounded"><option>Tri</option><option>Populaires</option><option>Récents</option><option>Examens</option></select>
      </div>
      <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a routerLink="/course/1" class="border rounded overflow-hidden shadow-sm hover:shadow p-4">
          <div class="aspect-video bg-gray-100"></div>
          <div class="mt-3">
            <div class="font-medium">Introduction — Exemple</div>
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
  `
})
export class CatalogComponent {}
