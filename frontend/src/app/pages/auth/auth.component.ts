import { Component } from '@angular/core';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <div class="min-h-screen grid place-items-center p-6">
      <div class="w-full max-w-md border rounded p-6 shadow">
        <h2 class="text-xl font-semibold text-blue-900">Connexion / Inscription</h2>
        <p class="text-sm text-gray-600 mt-2">Formulaires à intégrer.</p>
      </div>
    </div>
  `
})
export class AuthComponent {}
