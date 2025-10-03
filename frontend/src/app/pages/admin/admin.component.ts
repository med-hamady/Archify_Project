import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <h2 class="text-2xl font-semibold text-blue-900">Admin — Squelette</h2>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="border rounded p-4">Contenus (CRUD) — placeholder</div>
        <div class="border rounded p-4">Uploads — placeholder</div>
        <div class="border rounded p-4">Analytics — placeholder</div>
      </div>
    </div>
  `
})
export class AdminComponent {}
