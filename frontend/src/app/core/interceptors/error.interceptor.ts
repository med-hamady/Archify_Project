import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        toast.error('Serveur injoignable.');
      } else if (err.status === 401) {
        toast.info('Veuillez vous connecter.');
        router.navigate(['/auth']);
      } else if (err.status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer.');
      } else if (err.error?.error?.message) {
        toast.error(err.error.error.message);
      }
      return throwError(() => err);
    })
  );
};
