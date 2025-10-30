import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Intercepteur HTTP pour gérer les erreurs d'authentification
 * - Détecte les sessions expirées (code SESSION_EXPIRED)
 * - Déconnecte automatiquement l'utilisateur
 * - Redirige vers la page de connexion
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Vérifier si c'est une erreur de session expirée
      if (error.status === 401 && error.error?.error?.code === 'SESSION_EXPIRED') {
        console.warn('[AuthInterceptor] Session expirée détectée:', error.error.error.message);

        // Nettoyer le localStorage
        localStorage.removeItem('archify_user');
        localStorage.removeItem('archify_access_token');
        localStorage.removeItem('archify_refresh_token');

        // Afficher un message à l'utilisateur
        alert(error.error.error.message || 'Votre session a expiré. Vous vous êtes connecté depuis un autre appareil.');

        // Rediriger vers la page de connexion
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
