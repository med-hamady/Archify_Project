import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 class="text-3xl md:text-5xl font-semibold text-blue-900">Archify — Plateforme IG</h1>
      <p class="mt-4 text-gray-700 max-w-xl">Placeholders UI — intègre prochainement le design fourni. Naviguez vers le catalogue pour voir la structure.</p>
      <div class="mt-8 flex gap-4">
        <a routerLink="/catalog" class="px-4 py-2 bg-blue-900 text-white rounded">Catalogue</a>
        <a routerLink="/dashboard" class="px-4 py-2 bg-gray-200 text-gray-900 rounded">Dashboard</a>
      </div>
    </div>
  `
})
export class HomeComponent {}
