import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-semibold text-blue-900">Cours — Titre du cours</h2>
      <ul class="mt-4 space-y-3">
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
    </div>
  `
})
export class CourseComponent {}
