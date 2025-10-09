import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule],
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
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p class="text-lg font-medium text-gray-900 mb-2">Video uploaded successfully!</p>
            <div class="text-sm text-gray-500 space-y-1">
              <p><strong>File:</strong> {{ uploadedVideo()?.filename }}</p>
              <p><strong>Size:</strong> {{ formatFileSize(uploadedVideo()?.videoSize || 0) }}</p>
              <p><strong>Type:</strong> {{ uploadedVideo()?.videoType }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="playVideo()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Play Video
            </button>
            <button (click)="removeVideo()" 
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Remove
            </button>
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

}
