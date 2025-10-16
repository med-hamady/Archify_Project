import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('[AuthGuard] Checking authentication:', { user: auth.user(), isAuthenticated: auth.isAuthenticated() });

  const isAuthed = !!auth.user();
  if (isAuthed) {
    console.log('[AuthGuard] User authenticated, allowing access');
    return true;
  }

  console.log('[AuthGuard] User not authenticated, redirecting to login');
  router.navigate(['/login']);
  return false;
};
