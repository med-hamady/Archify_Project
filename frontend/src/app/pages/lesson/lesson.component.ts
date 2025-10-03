import { Component } from '@angular/core';

@Component({
  selector: 'app-lesson',
  standalone: true,
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-semibold text-blue-900">Leçon — Placeholder</h2>
      <div class="mt-4 aspect-video bg-gray-200 relative grid place-items-center">
        <span class="text-gray-600">Player vidéo (Vimeo) — à intégrer</span>
        <div class="absolute inset-0 pointer-events-none flex items-start justify-end p-2 opacity-70">
          <span class="text-xs bg-white/70 px-2 py-1 rounded">Filigrane dynamique — captures interdites</span>
        </div>
      </div>
      <div class="mt-6 h-64 bg-gray-100 grid place-items-center rounded">
        <span class="text-gray-600">Visionneuse PDF — à intégrer</span>
      </div>
      <p class="mt-4 text-sm text-gray-500">PiP/AirPlay désactivés, clic droit et téléchargement masqués (à implémenter).</p>
    </div>
  `
})
export class LessonComponent {}
