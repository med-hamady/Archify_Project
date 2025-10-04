import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const subscriptionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const canAccess = auth.canAccessPremium();
  if (canAccess) return true;
  router.navigate(['/subscription']);
  return false;
};
