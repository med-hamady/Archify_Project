import { Component, Input, Output, EventEmitter, signal, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl">
      <!-- Video Container -->
      <div class="aspect-video relative">
        <video 
          #videoElement
          class="w-full h-full object-cover"
          [src]="videoUrl"
          [poster]="posterUrl"
          [controls]="showControls"
          [autoplay]="autoplay"
          [muted]="muted"
          [loop]="loop"
          [preload]="preload"
          playsinline
          webkit-playsinline
          (loadstart)="onLoadStart()"
          (loadedmetadata)="onLoadedMetadata()"
          (loadeddata)="onLoadedData()"
          (canplay)="onCanPlay()"
          (play)="onPlay()"
          (pause)="onPause()"
          (ended)="onEnded()"
          (error)="onError($event)"
          (timeupdate)="onTimeUpdate()"
          (volumechange)="onVolumeChange()">
          Your browser does not support the video tag.
        </video>

        <!-- Loading Overlay -->
        <div *ngIf="isLoading()" 
             class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div class="text-center text-white">
            <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm">Loading video...</p>
          </div>
        </div>

        <!-- Error Overlay -->
        <div *ngIf="hasError()" 
             class="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div class="text-center text-white p-6">
            <svg class="h-12 w-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <h3 class="text-lg font-semibold mb-2">Video Error</h3>
            <p class="text-sm text-gray-300 mb-4">{{ errorMessage() }}</p>
            <button (click)="retry()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Try Again
            </button>
          </div>
        </div>

        <!-- Custom Controls Overlay (when not using native controls) -->
        <div *ngIf="!showControls && !isLoading() && !hasError()" 
             class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-20">
          <button (click)="togglePlay()" 
                  class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all">
            <svg *ngIf="isPaused()" class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg *ngIf="!isPaused()" class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Video Info Bar -->
      <div *ngIf="showInfo" class="bg-gray-900 text-white p-3 text-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <span *ngIf="videoTitle" class="font-medium">{{ videoTitle }}</span>
            <span class="text-gray-400">{{ formatDuration(currentTime()) }} / {{ formatDuration(duration()) }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <button (click)="toggleMute()" class="p-1 hover:bg-gray-700 rounded">
              <svg *ngIf="isMuted()" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
              <svg *ngIf="!isMuted()" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <button (click)="toggleFullscreen()" class="p-1 hover:bg-gray-700 rounded">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VideoPlayerComponent implements OnDestroy {
  @Input() videoUrl = '';
  @Input() posterUrl = '';
  @Input() videoTitle = '';
  @Input() showControls = true;
  @Input() showInfo = true;
  @Input() autoplay = false;
  @Input() muted = false;
  @Input() loop = false;
  @Input() preload: 'none' | 'metadata' | 'auto' = 'metadata';

  @Output() play = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() ended = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();
  @Output() timeUpdate = new EventEmitter<number>();
  @Output() volumeChange = new EventEmitter<number>();

  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;

  // Signals for internal state
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  isPaused = signal<boolean>(true);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  isMuted = signal<boolean>(false);

  private updateInterval?: number;

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  // Video control methods
  togglePlay() {
    const video = this.videoElementRef?.nativeElement;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  toggleMute() {
    const video = this.videoElementRef?.nativeElement;
    if (!video) return;

    video.muted = !video.muted;
    this.isMuted.set(video.muted);
  }

  toggleFullscreen() {
    const video = this.videoElementRef?.nativeElement;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  }

  retry() {
    this.hasError.set(false);
    this.errorMessage.set('');
    this.isLoading.set(true);
    
    const video = this.videoElementRef?.nativeElement;
    if (video) {
      video.load();
    }
  }

  // Event handlers
  onLoadStart() {
    this.isLoading.set(true);
    this.hasError.set(false);
  }

  onLoadedMetadata() {
    const video = this.videoElementRef?.nativeElement;
    if (video) {
      this.duration.set(video.duration);
    }
  }

  onLoadedData() {
    this.isLoading.set(false);
  }

  onCanPlay() {
    this.isLoading.set(false);
  }

  onPlay() {
    this.isPaused.set(false);
    this.play.emit();
  }

  onPause() {
    this.isPaused.set(true);
    this.pause.emit();
  }

  onEnded() {
    this.isPaused.set(true);
    this.ended.emit();
  }

  onError(event: any) {
    this.isLoading.set(false);
    this.hasError.set(true);
    
    const error = event.target?.error;
    let message = 'An error occurred while loading the video.';
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          message = 'Video loading was aborted.';
          break;
        case error.MEDIA_ERR_NETWORK:
          message = 'Network error occurred while loading the video.';
          break;
        case error.MEDIA_ERR_DECODE:
          message = 'Video format is not supported.';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'Video source is not supported.';
          break;
      }
    }
    
    this.errorMessage.set(message);
    this.error.emit(message);
  }

  onTimeUpdate() {
    const video = this.videoElementRef?.nativeElement;
    if (video) {
      this.currentTime.set(video.currentTime);
      this.timeUpdate.emit(video.currentTime);
    }
  }

  onVolumeChange() {
    const video = this.videoElementRef?.nativeElement;
    if (video) {
      this.isMuted.set(video.muted);
      this.volumeChange.emit(video.volume);
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}
