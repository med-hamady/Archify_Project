import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'superadmin' | 'STUDENT' | 'ADMIN' | 'SUPERADMIN';
  subscription?: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt: Date | null;
    isActive: boolean;
  };
  profile?: {
    avatar?: string;
    university?: string;
    department?: string;
    year?: number;
  };
  createdAt: Date;
  lastLoginAt?: Date;
}

// Backend user interface (with uppercase roles)
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN' | 'SUPERADMIN';
  subscription?: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt: Date | null;
    isActive: boolean;
  };
  profile?: {
    avatar?: string;
    university?: string;
    department?: string;
    year?: number;
  };
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  university?: string;
  department?: string;
  year?: number;
}

export interface AuthResponse {
  user: BackendUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api'; // Will be updated for production
  private readonly USER_KEY = 'archify_user';

  // Use signals for modern reactive state management
  user = signal<User | null>(null);
  isAuthenticated = computed(() => this.user() !== null);
  isPremium = computed(() => this.user()?.subscription?.type === 'premium' || this.user()?.subscription?.type === 'enterprise');
  isAdmin = computed(() => this.user()?.role === 'admin' || this.user()?.role === 'ADMIN' || this.user()?.role === 'superadmin' || this.user()?.role === 'SUPERADMIN');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
    this.setupSessionPersistence();
  }

  private initializeAuth() {
    const user = this.getStoredUser();
    if (user) {
      this.user.set(user);
      this.verifyToken().subscribe({
        next: (response) => this.updateUser(response.user),
        error: () => this.logout(),
      });
    }
  }

  private setupSessionPersistence() {
    // Set up periodic session refresh
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshSession();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private refreshSession() {
    this.http.post(`${this.API_URL}/auth/refresh`, {}).subscribe({
      next: () => {
        // Session refreshed successfully
        console.log('Session refreshed');
      },
      error: () => {
        // Refresh failed, user needs to login again
        this.logout();
      }
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setAuthData(response);
          // Redirect admins to admin dashboard, others to user dashboard
          const userRole = response.user.role.toLowerCase();
          if (userRole === 'admin' || userRole === 'superadmin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    const payload: any = {
      email: userData.email,
      password: userData.password,
      name: `${userData.firstName} ${userData.lastName}`.trim(),
      // departmentId expects UUID; map when real departments exist
      semester: userData.year ?? undefined
    };
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, payload)
      .pipe(
        tap(response => {
          this.setAuthData(response);
          // Redirect admins to admin dashboard, others to user dashboard
          const userRole = response.user.role.toLowerCase();
          if (userRole === 'admin' || userRole === 'superadmin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Inform backend and clear stored data
    this.http.post<void>(`${this.API_URL}/auth/logout`, {}).subscribe({ next: () => {}, error: () => {} });
    localStorage.removeItem(this.USER_KEY);
    
    // Clear signal
    this.user.set(null);
    
    // Redirect to home
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, {})
      .pipe(
        tap(response => this.setAuthData(response)),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  verifyToken(): Observable<{ user: User; valid: boolean }> {
    return this.http.get<{ user: User; valid: boolean }>(`${this.API_URL}/auth/verify`);
  }

  updateProfile(updates: Partial<User['profile']>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/auth/profile`, updates)
      .pipe(
        tap(user => {
          this.updateUser(user);
        }),
        catchError(error => {
          console.error('Profile update error:', error);
          return throwError(() => error);
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/auth/password`, {
      currentPassword,
      newPassword
    });
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  private setAuthData(response: AuthResponse): void {
    // Keep role as is to support both formats
    const userData = {
      ...response.user,
      role: response.user.role as 'student' | 'admin' | 'superadmin' | 'STUDENT' | 'ADMIN' | 'SUPERADMIN'
    };
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    
    // Update signal
    this.user.set(userData);
  }

  private updateUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  getAuthHeaders(): { [key: string]: string } {
    // Cookies are used for auth; return empty headers by default
    return {};
  }

  // Check if user has access to premium content
  canAccessPremium(): boolean {
    const user = this.user();
    return !!(user?.subscription?.isActive && 
           (user.subscription.type === 'premium' || user.subscription.type === 'enterprise'));
  }

  // Check if user has specific role
  hasRole(role: User['role']): boolean {
    return this.user()?.role === role;
  }

  // Check if subscription is expired
  isSubscriptionExpired(): boolean {
    const user = this.user();
    if (!user?.subscription?.expiresAt) return false;
    return new Date() > new Date(user.subscription.expiresAt);
  }

  // Get user's display name
  getDisplayName(): string {
    const user = this.user();
    if (!user) return '';
    return user.name;
  }

  // Get user's initials for avatar
  getInitials(): string {
    const user = this.user();
    if (!user) return '';
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  }
}
