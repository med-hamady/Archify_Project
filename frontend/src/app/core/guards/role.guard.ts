import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const roleGuard = (roles: Array<'student' | 'admin' | 'superadmin'>): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();
    if (user && roles.includes(user.role.toLowerCase() as 'student' | 'admin' | 'superadmin')) {
      return true;
    }
    router.navigate(['/']);
    return false;
  };
};
