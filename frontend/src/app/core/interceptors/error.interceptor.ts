import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        toast.error('Serveur injoignable.');
      } else if (err.status === 401) {
        // Check if this is a refresh endpoint
        if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
          // Don't try to refresh on refresh/login endpoints
          toast.info('Session expirée. Veuillez vous reconnecter.');
          authService.logout();
          router.navigate(['/auth']);
          return throwError(() => err);
        }

        // Try to refresh token automatically
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          console.log('[ErrorInterceptor] Token expired, attempting automatic refresh...');

          return authService.refreshToken().pipe(
            switchMap((response: any) => {
              isRefreshing = false;
              refreshTokenSubject.next(response.accessToken);

              console.log('[ErrorInterceptor] Token refreshed successfully, retrying original request');

              // Retry the original request with new token
              const TOKEN_KEY = 'archify_access_token';
              const newToken = localStorage.getItem(TOKEN_KEY);
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });

              return next(clonedReq);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              console.log('[ErrorInterceptor] Token refresh failed, logging out');
              toast.info('Session expirée. Veuillez vous reconnecter.');
              authService.logout();
              router.navigate(['/auth']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          // Wait for token refresh to complete
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(() => {
              const TOKEN_KEY = 'archify_access_token';
              const newToken = localStorage.getItem(TOKEN_KEY);
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(clonedReq);
            })
          );
        }
      } else if (err.status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer.');
      } else if (err.error?.error?.message) {
        toast.error(err.error.error.message);
      }
      return throwError(() => err);
    })
  );
};
