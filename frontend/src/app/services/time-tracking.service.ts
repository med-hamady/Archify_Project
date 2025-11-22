import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Keys for localStorage persistence
  private readonly SESSION_START_KEY = 'archify_session_start';

  // Observable for elapsed time in seconds
  private elapsedSeconds$ = new BehaviorSubject<number>(0);
  private intervalSubscription: any = null;
  private startTime: number = 0;
  private isTracking = false;

  // Observable for total study time
  private totalStudyTime$ = new BehaviorSubject<number>(0);
  private statsLoaded = false;

  constructor() {
    // Restore session start time from localStorage on page refresh
    this.restoreSessionFromStorage();

    // Listen for app close/tab close events
    this.setupBeforeUnloadListener();
  }

  // Setup listener for when user closes the app/tab
  private setupBeforeUnloadListener(): void {
    // beforeunload - fires when tab/window is being closed
    window.addEventListener('beforeunload', (event) => {
      if (this.isTracking) {
        console.log('[TimeTracking] App closing, saving study time...');
        this.saveTimeOnClose();
      }
    });

    // visibilitychange - detect when tab becomes hidden (optional: for mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.isTracking) {
        // Save current progress when tab is hidden (useful for mobile)
        this.saveProgressToBackend();
      }
    });

    // pagehide - more reliable on mobile Safari
    window.addEventListener('pagehide', (event) => {
      if (this.isTracking) {
        console.log('[TimeTracking] Page hide event, saving study time...');
        this.saveTimeOnClose();
      }
    });
  }

  // Save time synchronously when closing (using sendBeacon for reliability)
  private saveTimeOnClose(): void {
    const elapsed = this.elapsedSeconds$.value;
    const token = localStorage.getItem('archify_access_token');

    if (elapsed > 0 && token) {
      // Use sendBeacon with token in body for reliable delivery even when page is closing
      // The backend has a special endpoint that accepts token in body for beacon requests
      const data = JSON.stringify({
        totalSeconds: elapsed,
        token: token // Include token in body since sendBeacon can't send headers
      });
      const url = `${this.apiUrl}/time-tracking/end-beacon`;

      // Try sendBeacon first (more reliable for page close)
      const beaconSent = navigator.sendBeacon(
        url,
        new Blob([data], { type: 'application/json' })
      );

      if (beaconSent) {
        console.log('[TimeTracking] Beacon sent successfully with', elapsed, 'seconds');
      } else {
        console.log('[TimeTracking] Beacon failed, time will be recovered on next login');
      }
    }

    // Clear localStorage to prevent double-counting on next visit
    localStorage.removeItem(this.SESSION_START_KEY);
  }

  // Save progress to backend (non-blocking, for visibility change)
  private saveProgressToBackend(): void {
    const elapsed = this.elapsedSeconds$.value;
    if (elapsed > 60) { // Only save if more than 1 minute
      this.http.post(`${this.apiUrl}/time-tracking/update`, {
        elapsedSeconds: elapsed
      }).subscribe({
        next: () => console.log('[TimeTracking] Progress saved on visibility change'),
        error: () => {} // Silent fail
      });
    }
  }

  // Restore session from localStorage (called on page refresh)
  private restoreSessionFromStorage(): void {
    const savedStartTime = localStorage.getItem(this.SESSION_START_KEY);
    if (savedStartTime) {
      const startTimeMs = parseInt(savedStartTime, 10);
      if (!isNaN(startTimeMs) && startTimeMs > 0) {
        // Calculate elapsed time since session started
        const elapsedMs = Date.now() - startTimeMs;
        if (elapsedMs > 0 && elapsedMs < 24 * 60 * 60 * 1000) { // Max 24 hours
          console.log('[TimeTracking] Restoring session from localStorage, elapsed:', Math.floor(elapsedMs / 1000), 'seconds');
          this.startTime = startTimeMs;
          this.elapsedSeconds$.next(Math.floor(elapsedMs / 1000));
          this.isTracking = true;
          this.startInterval();

          // Load total study time from backend
          this.loadStats();
          this.statsLoaded = true;
        } else {
          // Session too old, clear it
          localStorage.removeItem(this.SESSION_START_KEY);
        }
      }
    }
  }

  // Start the interval timer (separate from startTracking for restore)
  private startInterval(): void {
    if (this.intervalSubscription) {
      return; // Already running
    }

    this.intervalSubscription = interval(1000).subscribe(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.elapsedSeconds$.next(elapsed);

      // Every 5 minutes, update the backend
      if (elapsed > 0 && elapsed % 300 === 0) {
        this.updateBackend(elapsed);
      }
    });
  }

  // Initialize and load stats
  init(): void {
    if (!this.statsLoaded) {
      this.loadStats();
      this.statsLoaded = true;
    }
  }

  // Start tracking time
  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    // Make sure stats are loaded first
    if (!this.statsLoaded) {
      this.init();
    }

    this.isTracking = true;
    this.startTime = Date.now();
    this.elapsedSeconds$.next(0);

    // Save start time to localStorage for persistence across page refreshes
    localStorage.setItem(this.SESSION_START_KEY, this.startTime.toString());
    console.log('[TimeTracking] Session started, saved to localStorage');

    // Start the interval timer
    this.startInterval();

    // Notify backend that session started
    this.http.post(`${this.apiUrl}/time-tracking/start`, {}).subscribe({
      next: (res: any) => {
        console.log('Study session started:', res);
        // Update total study time from server response
        if (res.totalStudyTimeSeconds !== undefined) {
          this.totalStudyTime$.next(res.totalStudyTimeSeconds);
        }
      },
      error: (err) => {
        console.error('Error starting study session:', err);
      }
    });
  }

  // Stop tracking time
  stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;

    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = null;
    }

    const elapsed = this.elapsedSeconds$.value;

    // Clear localStorage session
    localStorage.removeItem(this.SESSION_START_KEY);
    console.log('[TimeTracking] Session stopped, cleared from localStorage');

    // Send final update to backend
    this.http.post(`${this.apiUrl}/time-tracking/end`, {
      totalSeconds: elapsed
    }).subscribe({
      next: (res: any) => {
        console.log('Study session ended:', res);
        if (res.xpAwarded > 0) {
          console.log(`🎉 You earned ${res.xpAwarded} XP for ${res.completedHours} hour(s) of study!`);
        }
        // Update total study time
        this.totalStudyTime$.next(res.totalStudyTimeSeconds);
      },
      error: (err) => {
        console.error('Error ending study session:', err);
      }
    });

    // Reset elapsed time
    this.elapsedSeconds$.next(0);
    this.startTime = 0;
  }

  // Update backend with current elapsed time
  private updateBackend(elapsedSeconds: number): void {
    this.http.post(`${this.apiUrl}/time-tracking/update`, {
      elapsedSeconds
    }).subscribe({
      next: (res: any) => {
        console.log('Time updated:', res);
        if (res.xpAwarded > 0) {
          console.log(`🎉 You earned ${res.xpAwarded} XP!`);
        }
        this.totalStudyTime$.next(res.totalStudyTimeSeconds);
      },
      error: (err) => {
        console.error('Error updating time:', err);
      }
    });
  }

  // Load study time statistics
  loadStats(): void {
    this.http.get(`${this.apiUrl}/time-tracking/stats`).subscribe({
      next: (res: any) => {
        this.totalStudyTime$.next(res.totalStudyTimeSeconds);
      },
      error: (err) => {
        console.error('Error loading study stats:', err);
      }
    });
  }

  // Get observable for elapsed seconds
  getElapsedSeconds(): Observable<number> {
    return this.elapsedSeconds$.asObservable();
  }

  // Get observable for total study time
  getTotalStudyTime(): Observable<number> {
    return this.totalStudyTime$.asObservable();
  }

  // Get current elapsed seconds value
  getCurrentElapsedSeconds(): number {
    return this.elapsedSeconds$.value;
  }

  // Format seconds to HH:MM:SS
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Check if tracking is active
  isTrackingActive(): boolean {
    return this.isTracking;
  }
}
