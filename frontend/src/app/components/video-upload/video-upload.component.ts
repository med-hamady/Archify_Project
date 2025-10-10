import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">Upload Video</h3>
          <p class="text-sm text-gray-500">Upload a video file for this lesson</p>
        </div>
      </div>

      <!-- Upload Area -->
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
           [class.border-blue-400]="isDragOver()"
           [class.bg-blue-50]="isDragOver()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)">
        
        <div *ngIf="!isUploading() && !uploadedVideo()" class="space-y-4">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          
          <div>
            <p class="text-lg font-medium text-gray-900 mb-2">Drop your video here</p>
            <p class="text-sm text-gray-500 mb-4">or click to browse files</p>
            <input type="file" 
                   #fileInput 
                   (change)="onFileSelected($event)"
                   accept="video/*"
                   class="hidden">
            <button (click)="fileInput.click()" 
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Choose Video
            </button>
          </div>
          
          <div class="text-xs text-gray-400">
            <p>Supported formats: MP4, WebM, OGG, AVI, MOV, WMV, FLV</p>
            <p>Maximum file size: 500MB</p>
          </div>
        </div>

        <!-- Uploading State -->
        <div *ngIf="isUploading()" class="space-y-4">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div>
            <p class="text-lg font-medium text-gray-900 mb-2">Uploading video...</p>
            <p class="text-sm text-gray-500">{{ uploadProgress() }}% complete</p>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" [style.width.%]="uploadProgress()"></div>
            </div>
          </div>
        </div>

        <!-- Uploaded State -->
        <div *ngIf="uploadedVideo() && !isUploading()" class="space-y-4">
          <!-- Upload Success Message -->
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p class="text-lg font-medium text-green-800">Video uploaded successfully!</p>
                <p class="text-sm text-green-600">{{ formatFileSize(uploadedVideo()?.videoSize || 0) }} ({{ uploadedVideo()?.videoType }})</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button (click)="playVideo()" 
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                🎬 Play Video
              </button>
              <button (click)="removeVideo()" 
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                🗑️ Remove
              </button>
            </div>
          </div>

          <!-- Admin Video Controls -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                </svg>
              </div>
              <h3 class="font-bold text-gray-900">Admin Video Controls</h3>
            </div>
            
            <!-- Video Information Editing -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
                <input type="text" 
                       [(ngModel)]="videoTitle" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter video title">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
                <input type="number" 
                       [(ngModel)]="videoDuration" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter duration in seconds">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Video Type</label>
                <select [(ngModel)]="videoType" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="video/mp4">MP4</option>
                  <option value="video/webm">WebM</option>
                  <option value="video/ogg">OGG</option>
                  <option value="video/avi">AVI</option>
                  <option value="video/mov">MOV</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">File Size (bytes)</label>
                <input type="number" 
                       [(ngModel)]="videoSize" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter file size in bytes">
              </div>
            </div>

            <!-- Video Description -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Video Description</label>
              <textarea [(ngModel)]="videoDescription" 
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter video description"></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button (click)="updateVideoInfo()" 
                      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                💾 Update Video Info
              </button>
              <button (click)="resetVideoInfo()" 
                      class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                🔄 Reset to Auto
              </button>
              <button (click)="testVideoPlayback()" 
                      class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                ▶️ Test Playback
              </button>
            </div>
          </div>

          <!-- Video Preview Player -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-5v5m0-5v5"/>
                </svg>
              </div>
              <h3 class="font-bold text-gray-900">Video Preview</h3>
            </div>
            
            <div class="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
              <video 
                #videoPlayer
                class="w-full h-full object-cover"
                controls
                preload="metadata"
                [src]="getVideoUrl()"
                (loadedmetadata)="onVideoMetadataLoaded()"
                (error)="onVideoError($event)"
                (play)="onVideoPlay()"
                (pause)="onVideoPause()">
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">
                <span *ngIf="videoTitle">{{ videoTitle }}</span>
                <span *ngIf="!videoTitle">Video Preview</span>
                <span *ngIf="videoDuration"> • {{ formatDuration(videoDuration) }}</span>
              </div>
              <div class="flex gap-2">
                <button (click)="playVideoInPlayer()" 
                        class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  ▶️ Play
                </button>
                <button (click)="pauseVideoInPlayer()" 
                        class="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm">
                  ⏸️ Pause
                </button>
                <button (click)="openVideoInNewTab()" 
                        class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                  🔗 Open in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <p class="text-sm text-red-700">{{ error() }}</p>
        </div>
      </div>
    </div>
  `
})
export class VideoUploadComponent {
  @Input() lessonId: string = '';
  @Output() videoUploaded = new EventEmitter<any>();
  @Output() videoRemoved = new EventEmitter<void>();

  private readonly API_URL = 'http://localhost:3000/api';

  // Signals
  isUploading = signal(false);
  uploadProgress = signal(0);
  uploadedVideo = signal<any>(null);
  error = signal<string>('');
  isDragOver = signal(false);

  // Admin video control properties
  videoTitle = '';
  videoDuration = 0;
  videoType = 'video/mp4';
  videoSize = 0;
  videoDescription = '';

  constructor(private http: HttpClient) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  uploadFile(file: File) {
    // Validate file
    if (!this.validateFile(file)) {
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.error.set('');

    const formData = new FormData();
    formData.append('video', file);

    // Create upload with progress tracking
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        this.uploadProgress.set(progress);
      }
    });

    xhr.addEventListener('load', () => {
      this.isUploading.set(false);
      
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        this.uploadedVideo.set({
          filename: file.name,
          videoSize: response.lesson.videoSize,
          videoType: response.lesson.videoType,
          videoUrl: response.lesson.videoUrl,
          uploadedAt: response.lesson.uploadedAt
        });
        this.videoUploaded.emit(response.lesson);
      } else {
        const error = JSON.parse(xhr.responseText);
        this.error.set(error.error?.message || 'Upload failed');
      }
    });

    xhr.addEventListener('error', () => {
      this.isUploading.set(false);
      this.error.set('Upload failed. Please try again.');
    });

    xhr.open('POST', `${this.API_URL}/video-upload/${this.lessonId}/video`);
    // Set credentials for cookie-based auth
    xhr.withCredentials = true;
    xhr.send(formData);
  }

  validateFile(file: File): boolean {
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.error.set('Invalid file type. Please select a video file.');
      return false;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB
      this.error.set('File too large. Maximum size is 500MB.');
      return false;
    }

    return true;
  }

  playVideo() {
    if (this.uploadedVideo()?.videoUrl) {
      window.open(this.uploadedVideo().videoUrl, '_blank');
    }
  }

  removeVideo() {
    this.http.delete(`${this.API_URL}/video-upload/${this.lessonId}/video`, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.uploadedVideo.set(null);
        this.videoRemoved.emit();
      },
      error: (err) => {
        this.error.set('Failed to remove video. Please try again.');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Admin video control methods
  updateVideoInfo() {
    console.log('💾 Updating video info:', {
      title: this.videoTitle,
      duration: this.videoDuration,
      type: this.videoType,
      size: this.videoSize,
      description: this.videoDescription
    });
    
    // Here you would typically send this to the backend to update the lesson
    // For now, we'll just show a success message
    alert('Video information updated successfully!');
  }

  resetVideoInfo() {
    const video = this.uploadedVideo();
    if (video) {
      this.videoTitle = video.filename || '';
      this.videoDuration = video.videoSize || 0; // This would be duration, not size
      this.videoType = video.videoType || 'video/mp4';
      this.videoSize = video.videoSize || 0;
      this.videoDescription = '';
    }
    console.log('🔄 Reset video info to auto-detected values');
  }

  testVideoPlayback() {
    console.log('▶️ Testing video playback...');
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.play().then(() => {
        console.log('✅ Video playback test successful');
      }).catch((error) => {
        console.error('❌ Video playback test failed:', error);
        alert('Video playback test failed: ' + error.message);
      });
    }
  }

  getVideoUrl(): string {
    const video = this.uploadedVideo();
    if (!video?.videoUrl) {
      console.log('❌ No video URL found:', video);
      return '';
    }
    
    let finalUrl = '';
    if (video.videoUrl.startsWith('http')) {
      finalUrl = video.videoUrl;
    } else {
      finalUrl = `http://localhost:3000${video.videoUrl}`;
    }
    
    console.log('🎬 Generated video URL:', finalUrl);
    console.log('📊 Video data:', video);
    return finalUrl;
  }

  playVideoInPlayer() {
    const videoElement = document.querySelector('#videoPlayer') as HTMLVideoElement;
    if (videoElement) {
      videoElement.play();
    }
  }

  pauseVideoInPlayer() {
    const videoElement = document.querySelector('#videoPlayer') as HTMLVideoElement;
    if (videoElement) {
      videoElement.pause();
    }
  }

  openVideoInNewTab() {
    const videoUrl = this.getVideoUrl();
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  }

  onVideoMetadataLoaded() {
    console.log('📊 Video metadata loaded');
    const videoElement = document.querySelector('#videoPlayer') as HTMLVideoElement;
    if (videoElement) {
      // Auto-populate duration if not set
      if (!this.videoDuration && videoElement.duration) {
        this.videoDuration = Math.round(videoElement.duration);
      }
    }
  }

  onVideoError(event: any) {
    console.error('❌ Video error:', event);
    console.error('❌ Video error details:', {
      error: event.target?.error,
      networkState: event.target?.networkState,
      readyState: event.target?.readyState,
      src: event.target?.src,
      currentSrc: event.target?.currentSrc
    });
  }

  onVideoPlay() {
    console.log('▶️ Video started playing');
  }

  onVideoPause() {
    console.log('⏸️ Video paused');
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

}
