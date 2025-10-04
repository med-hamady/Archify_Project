import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside class="md:col-span-1 border rounded p-4 h-fit">
          <h2 class="text-lg font-semibold text-blue-900">Cours — Exemple</h2>
          <p class="text-sm text-gray-600 mt-2">Prof. Exemple</p>
          <div class="text-xs text-gray-500 mt-2">Tags: Analyse, Révisions</div>
          <div class="mt-4"><a routerLink="/subscription" class="px-3 py-1 bg-blue-900 text-white rounded">S’abonner</a></div>
        </aside>
        <section class="md:col-span-3">
          <h3 class="text-base font-medium text-gray-900">Leçons</h3>
          <ul class="mt-3 space-y-3">
            <li class="flex items-center justify-between p-3 border rounded">
              <span>Leçon 1 — Vidéo</span>
              <a routerLink="/lesson/1" class="px-3 py-1 bg-blue-900 text-white rounded">Voir</a>
            </li>
            <li class="flex items-center justify-between p-3 border rounded">
              <span>Leçon 2 — PDF</span>
              <a routerLink="/lesson/2" class="px-3 py-1 bg-blue-900 text-white rounded">Voir</a>
            </li>
            <li class="flex items-center justify-between p-3 border rounded">
              <span>Leçon 3 — Examen</span>
              <a routerLink="/lesson/3" class="px-3 py-1 bg-blue-900 text-white rounded">Voir</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  `
})
export class CourseComponent {}
