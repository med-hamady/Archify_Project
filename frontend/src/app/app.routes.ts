import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { subscriptionGuard } from './core/guards/subscription.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'catalog',
    loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'course/:id',
    loadComponent: () => import('./pages/course/course.component').then(m => m.CourseComponent)
  },
  {
    path: 'lesson/:id',
    loadComponent: () => import('./pages/lesson/lesson.component').then(m => m.LessonComponent),
    canActivate: [authGuard, subscriptionGuard]
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/password-reset/password-reset.component').then(m => m.PasswordResetComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'admin-init',
    loadComponent: () => import('./pages/admin-init/admin-init.component').then(m => m.AdminInitComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subscription',
    loadComponent: () => import('./pages/subscription/subscription.component').then(m => m.SubscriptionComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-enhanced.component').then(m => m.AdminEnhancedComponent),
    canActivate: [authGuard, roleGuard(['admin', 'superadmin'])]
  },
  {
    path: 'admin/upload',
    loadComponent: () => import('./pages/admin/video-upload/video-upload.component').then(m => m.VideoUploadComponent),
    canActivate: [authGuard, roleGuard(['admin', 'superadmin'])]
  },
      {
        path: 'admin/lessons',
        loadComponent: () => import('./pages/lesson-management/lesson-management.component').then(m => m.LessonManagementComponent),
        canActivate: [authGuard, roleGuard(['admin', 'superadmin'])]
      },
      {
        path: 'admin/lesson/:lessonId/video',
        loadComponent: () => import('./pages/lesson-video-upload/lesson-video-upload.component').then(m => m.LessonVideoUploadComponent),
        canActivate: [authGuard, roleGuard(['admin', 'superadmin'])]
      },
  { path: '**', redirectTo: '' }
];
