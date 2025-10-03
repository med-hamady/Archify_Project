import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="p-6 max-w-5xl mx-auto">
      <h2 class="text-2xl font-semibold text-blue-900">Tableau de bord</h2>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="border rounded p-4">Continuer — (placeholder)</div>
        <div class="border rounded p-4">Recommandés — (placeholder)</div>
        <div class="border rounded p-4">Abonnement — (placeholder)</div>
      </div>
    </div>
  `
})
export class DashboardComponent {}
