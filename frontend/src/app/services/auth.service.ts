import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'admin' | 'professor';
  subscription: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt: Date | null;
    isActive: boolean;
  };
  profile: {
    avatar?: string;
    university?: string;
    department?: string;
    year?: number;
  };
  createdAt: Date;
  lastLoginAt: Date;
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
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api'; // Will be updated for production
  private readonly TOKEN_KEY = 'archify_access_token';
  private readonly REFRESH_TOKEN_KEY = 'archify_refresh_token';
  private readonly USER_KEY = 'archify_user';

  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  // Public signals for reactive components
  user = signal<User | null>(null);
  isAuthenticated = computed(() => this.user() !== null);
  isPremium = computed(() => this.user()?.subscription?.type === 'premium' || this.user()?.subscription?.type === 'enterprise');
  isAdmin = computed(() => this.user()?.role === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.userSubject.next(user);
      this.user.set(user);
      
      // Verify token is still valid
      this.verifyToken().subscribe({
        next: (response) => {
          this.updateUser(response.user);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setAuthData(response);
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          this.setAuthData(response);
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Clear stored data
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Clear signals
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    this.user.set(null);
    
    // Redirect to home
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.setAuthData(response);
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  verifyToken(): Observable<{ user: User; valid: boolean }> {
    const token = this.getStoredToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http.get<{ user: User; valid: boolean }>(`${this.API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
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
    // Store tokens
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    // Update signals
    this.tokenSubject.next(response.accessToken);
    this.userSubject.next(response.user);
    this.user.set(response.user);
  }

  private updateUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
    this.user.set(user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
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
    return `${user.firstName} ${user.lastName}`;
  }

  // Get user's initials for avatar
  getInitials(): string {
    const user = this.user();
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
}
