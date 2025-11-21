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

  // Observable for elapsed time in seconds
  private elapsedSeconds$ = new BehaviorSubject<number>(0);
  private intervalSubscription: any = null;
  private startTime: number = 0;
  private isTracking = false;

  // Observable for total study time
  private totalStudyTime$ = new BehaviorSubject<number>(0);

  constructor() {
    // Load initial study time stats
    this.loadStats();
  }

  // Start tracking time
  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.startTime = Date.now();
    this.elapsedSeconds$.next(0);

    // Update elapsed time every second
    this.intervalSubscription = interval(1000).subscribe(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.elapsedSeconds$.next(elapsed);

      // Every 5 minutes, update the backend
      if (elapsed > 0 && elapsed % 300 === 0) {
        this.updateBackend(elapsed);
      }
    });

    // Notify backend that session started
    this.http.post(`${this.apiUrl}/time-tracking/start`, {}).subscribe({
      next: (res: any) => {
        console.log('Study session started:', res);
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
