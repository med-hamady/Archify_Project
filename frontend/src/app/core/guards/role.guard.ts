import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const roleGuard = (roles: Array<'student' | 'admin' | 'superadmin' | 'STUDENT' | 'ADMIN' | 'SUPERADMIN'>): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();

    console.log('[RoleGuard] Checking access:', { user, roles, userRole: user?.role });

    if (!user) {
      console.log('[RoleGuard] No user found, redirecting to login');
      router.navigate(['/login']);
      return false;
    }

    const userRoleLower = user.role.toLowerCase();
    const hasAccess = roles.includes(user.role as any) || roles.map(r => r.toLowerCase()).includes(userRoleLower);

    console.log('[RoleGuard] Access check result:', { userRole: user.role, userRoleLower, allowedRoles: roles, hasAccess });

    if (hasAccess) {
      return true;
    }

    console.log('[RoleGuard] Access denied, redirecting to home');
    router.navigate(['/']);
    return false;
  };
};
