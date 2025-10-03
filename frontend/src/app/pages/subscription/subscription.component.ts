import { Component } from '@angular/core';

@Component({
  selector: 'app-subscription',
  standalone: true,
  template: `
    <div class="min-h-screen grid place-items-center p-6">
      <div class="w-full max-w-xl border rounded p-6 shadow">
        <h2 class="text-xl font-semibold text-blue-900">Abonnement</h2>
        <p class="text-sm text-gray-600 mt-2">Plans mensuel/annuel — intégration Bankily/Masrivi/Sedad à venir.</p>
      </div>
    </div>
  `
})
export class SubscriptionComponent {}
