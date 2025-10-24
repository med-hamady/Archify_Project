import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { subscriptionGuard } from './core/guards/subscription.guard';

export const routes: Routes = [
  // Redirect root to FacGame dashboard
  {
    path: '',
    redirectTo: 'facgame-dashboard',
    pathMatch: 'full'
  },
  // Auth routes
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent)
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
    path: 'forgot-password',
    loadComponent: () => import('./pages/password-reset/password-reset.component').then(m => m.PasswordResetComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'admin-init',
    loadComponent: () => import('./pages/admin-init/admin-init.component').then(m => m.AdminInitComponent)
  },
  // Redirect old Archify routes to FacGame
  {
    path: 'dashboard',
    redirectTo: 'facgame-dashboard',
    pathMatch: 'full'
  },
  {
    path: 'catalog',
    redirectTo: 'subjects',
    pathMatch: 'full'
  },
  {
    path: 'course/:id',
    redirectTo: 'subjects',
    pathMatch: 'full'
  },
  {
    path: 'lesson/:id',
    redirectTo: 'subjects',
    pathMatch: 'full'
  },
  // FacGame Routes
  {
    path: 'facgame-dashboard',
    loadComponent: () => import('./pages/facgame-dashboard/facgame-dashboard.component').then(m => m.FacgameDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subjects',
    loadComponent: () => import('./pages/subjects/subjects.component').then(m => m.SubjectsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chapters/:subjectId',
    loadComponent: () => import('./pages/chapters/chapters.component').then(m => m.ChaptersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'quiz/:chapterId',
    loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent),
    canActivate: [authGuard]
  },
  {
    path: 'challenge/:chapterId',
    loadComponent: () => import('./pages/challenge/challenge.component').then(m => m.ChallengeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'exam',
    loadComponent: () => import('./pages/exam/exam.component').then(m => m.ExamComponent),
    canActivate: [authGuard]
  },
  {
    path: 'exam/:subjectId',
    loadComponent: () => import('./pages/exam/exam.component').then(m => m.ExamComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./pages/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subscription',
    loadComponent: () => import('./pages/subscription/subscription.component').then(m => m.SubscriptionComponent)
  },
  {
    path: 'payment/submit',
    loadComponent: () => import('./pages/payment/payment-form.component').then(m => m.PaymentFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-payments',
    loadComponent: () => import('./pages/payment/my-payments.component').then(m => m.MyPaymentsComponent),
    canActivate: [authGuard]
  },
  // Admin routes
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-enhanced.component').then(m => m.AdminEnhancedComponent),
    canActivate: [authGuard, roleGuard(['admin', 'superadmin'])]
  },
  {
    path: 'admin/payments',
    loadComponent: () => import('./pages/admin/admin-payments.component').then(m => m.AdminPaymentsComponent),
    canActivate: [authGuard, roleGuard(['admin', 'superadmin'])]
  },
  { path: '**', redirectTo: '' }
];
