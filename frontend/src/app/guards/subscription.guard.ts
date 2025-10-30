import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard pour protéger les routes nécessitant un abonnement actif avec accès quiz
 *
 * NOTE: Ce guard autorise maintenant l'accès même sans abonnement actif
 * car le backend gère les 3 QCM gratuits. Le backend redirigera automatiquement
 * vers /subscription après avoir utilisé les 3 QCM gratuits.
 */
export const subscriptionGuard: CanActivateFn = (route, state) => {
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);

  // Vérifier le statut d'abonnement
  return subscriptionService.checkSubscription().pipe(
    map(response => {
      // Autoriser l'accès dans tous les cas
      // Le backend gérera la limite de 3 QCM gratuits et retournera une erreur
      // qui sera gérée par le composant quiz pour rediriger vers /subscription
      console.log('[SubscriptionGuard] Access granted - backend will handle free QCM limits');
      return true;
    }),
    catchError(error => {
      console.error('[SubscriptionGuard] Error checking subscription:', error);
      // En cas d'erreur de connexion, autoriser quand même l'accès
      // Le backend refusera si nécessaire
      console.log('[SubscriptionGuard] Allowing access despite error - backend will validate');
      return of(true);
    })
  );
};
