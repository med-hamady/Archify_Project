import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'superadmin' | 'STUDENT' | 'ADMIN' | 'SUPERADMIN';
  subscription?: {
    type: 'PREMIUM';
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
    type: 'PREMIUM';
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
  semester: 'PCEM1' | 'PCEM2';
}

export interface AuthResponse {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly USER_KEY = 'archify_user';
  private readonly TOKEN_KEY = 'archify_access_token';
  private readonly REFRESH_TOKEN_KEY = 'archify_refresh_token';

  // Use signals for modern reactive state management
  user = signal<User | null>(null);
  isAuthenticated = computed(() => this.user() !== null);
  isPremium = computed(() => this.user()?.subscription?.isActive === true);
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
    const token = localStorage.getItem(this.TOKEN_KEY);

    console.log('[AuthService] Initializing auth:', { hasUser: !!user, hasToken: !!token });

    if (user && token) {
      this.user.set(user);
      console.log('[AuthService] Verifying token...');
      this.verifyToken().subscribe({
        next: (response) => {
          console.log('[AuthService] Token verified successfully');
          this.updateUser(response.user);
        },
        error: (err) => {
          console.error('[AuthService] Token verification failed:', err.status, err.message);
          console.log('[AuthService] Clearing invalid session');
          this.logout();
        },
      });
    } else if (user && !token) {
      // User data exists but no token (old session) - clear it
      console.log('[AuthService] Found user without token, clearing old session');
      localStorage.removeItem(this.USER_KEY);
      this.user.set(null);
    }
  }

  private setupSessionPersistence() {
    // Set up periodic session refresh every 6 days (before 7 day expiry)
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshSession();
      }
    }, 6 * 24 * 60 * 60 * 1000); // Every 6 days

    // Also refresh on window focus after being away
    window.addEventListener('focus', () => {
      if (this.isAuthenticated()) {
        this.verifyToken().subscribe({
          next: () => {
            console.log('[AuthService] Session verified on window focus');
          },
          error: () => {
            console.log('[AuthService] Session invalid, attempting refresh');
            this.refreshSession();
          }
        });
      }
    });

    // Refresh on activity after long idle periods
    let lastActivity = Date.now();
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    activityEvents.forEach(event => {
      window.addEventListener(event, () => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;

        // If more than 1 hour since last activity, verify token
        if (timeSinceLastActivity > 60 * 60 * 1000 && this.isAuthenticated()) {
          this.verifyToken().subscribe({
            error: () => {
              console.log('[AuthService] Session expired after inactivity, refreshing');
              this.refreshSession();
            }
          });
        }
        lastActivity = now;
      }, { passive: true });
    });
  }

  private refreshSession() {
    this.http.post(`${this.API_URL}/auth/refresh`, {}).subscribe({
      next: (response: any) => {
        // Session refreshed successfully
        console.log('[AuthService] Session refreshed successfully');
        if (response.user) {
          this.updateUser(response.user);
        }
      },
      error: (err) => {
        console.error('[AuthService] Session refresh failed:', err);
        // Don't logout immediately, the error interceptor will handle it
      }
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('[AuthService] Login successful:', {
            user: response.user.email,
            role: response.user.role,
            hasAccessToken: !!response.accessToken,
            hasRefreshToken: !!response.refreshToken
          });
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
          console.error('[AuthService] Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    const payload: any = {
      email: userData.email,
      password: userData.password,
      name: `${userData.firstName} ${userData.lastName}`.trim(),
      semester: userData.semester
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
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);

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

    // Store user data
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));

    // Store JWT tokens
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);

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
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  }

  // Check if user has access to premium content
  canAccessPremium(): boolean {
    const user = this.user();
    if (!user?.subscription) return false;
    return user.subscription.isActive === true;
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

  // Get user's role
  getUserRole(): string {
    const user = this.user();
    return user?.role || '';
  }
}
