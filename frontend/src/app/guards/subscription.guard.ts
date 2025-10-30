import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard pour protéger les routes nécessitant un abonnement actif avec accès quiz
 */
export const subscriptionGuard: CanActivateFn = (route, state) => {
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);

  // Vérifier le statut d'abonnement
  return subscriptionService.checkSubscription().pipe(
    map(response => {
      if (response.subscription.canAccessQuiz) {
        console.log('[SubscriptionGuard] Access granted - user has quiz access');
        return true;
      } else {
        console.log('[SubscriptionGuard] Access denied - no quiz access');
        // Rediriger vers la page d'abonnement requis
        router.navigate(['/subscription-required'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    }),
    catchError(error => {
      console.error('[SubscriptionGuard] Error checking subscription:', error);
      // En cas d'erreur, rediriger vers la page d'abonnement
      router.navigate(['/subscription-required'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};
