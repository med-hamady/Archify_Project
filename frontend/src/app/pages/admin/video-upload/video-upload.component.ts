import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Upload de Vidéos</h2>
        
        <!-- Upload Form -->
        <form (ngSubmit)="uploadVideo()" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Video File -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Fichier Vidéo
              </label>
              <input type="file" 
                     (change)="onFileSelected($event)"
                     accept="video/*"
                     class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
              <p class="text-xs text-gray-500 mt-1">Formats supportés: MP4, AVI, MOV, WMV</p>
            </div>

            <!-- Course Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cours
              </label>
              <select [(ngModel)]="selectedCourseId" name="courseId" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option value="">Sélectionner un cours</option>
                <option *ngFor="let course of courses()" [value]="course.id">
                  {{ course.title }}
                </option>
              </select>
            </div>
          </div>

          <!-- Video Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Titre de la leçon
              </label>
              <input type="text" [(ngModel)]="lessonTitle" name="lessonTitle" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                     placeholder="Ex: Introduction aux algorithmes">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Type de leçon
              </label>
              <select [(ngModel)]="lessonType" name="lessonType" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option value="VIDEO">Vidéo</option>
                <option value="PDF">PDF</option>
                <option value="EXAM">Examen</option>
              </select>
            </div>
          </div>

          <!-- Premium Settings -->
          <div class="flex items-center space-x-4">
            <input type="checkbox" [(ngModel)]="isPremium" name="isPremium" id="isPremium"
                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2">
            <label for="isPremium" class="text-sm font-medium text-gray-700">
              Leçon Premium (nécessite un abonnement)
            </label>
          </div>

          <!-- Upload Progress -->
          <div *ngIf="uploadProgress()" class="space-y-2">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Progression</span>
              <span>{{ uploadProgress()?.percentage }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                   [style.width.%]="uploadProgress()?.percentage"></div>
            </div>
            <p class="text-xs text-gray-500">
              {{ formatBytes(uploadProgress()?.loaded || 0) }} / {{ formatBytes(uploadProgress()?.total || 0) }}
            </p>
          </div>

          <!-- Upload Button -->
          <div class="flex justify-end space-x-4">
            <button type="button" (click)="cancelUpload()" 
                    *ngIf="isUploading()"
                    class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" 
                    [disabled]="!selectedFile || !selectedCourseId || !lessonTitle || isUploading()"
                    class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="!isUploading()">Uploader la vidéo</span>
              <span *ngIf="isUploading()">Upload en cours...</span>
            </button>
          </div>
        </form>

        <!-- Success Message -->
        <div *ngIf="successMessage()" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">{{ successMessage() }}</p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage()" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">{{ errorMessage() }}</p>
            </div>
          </div>
        </div>

        <!-- Uploaded Videos List -->
        <div *ngIf="uploadedVideos().length > 0" class="mt-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Vidéos uploadées récemment</h3>
          <div class="space-y-3">
            <div *ngFor="let video of uploadedVideos()" 
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ video.title }}</p>
                  <p class="text-xs text-gray-500">{{ video.courseTitle }} • {{ formatBytes(video.size) }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {{ video.isPremium ? 'Premium' : 'Gratuit' }}
                </span>
                <span class="text-xs text-gray-500">{{ video.uploadDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VideoUploadComponent {
  private readonly API_URL = 'http://localhost:3000/api';

  // Signals
  courses = signal<any[]>([]);
  selectedFile: File | null = null;
  selectedCourseId = '';
  lessonTitle = '';
  lessonType = 'VIDEO';
  isPremium = false;
  isUploading = signal(false);
  uploadProgress = signal<UploadProgress | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  uploadedVideos = signal<any[]>([]);

  constructor(private http: HttpClient) {
    this.loadCourses();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.errorMessage.set('');
    }
  }

  async uploadVideo() {
    if (!this.selectedFile || !this.selectedCourseId || !this.lessonTitle) {
      this.errorMessage.set('Veuillez remplir tous les champs requis');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const formData = new FormData();
      formData.append('video', this.selectedFile);
      formData.append('courseId', this.selectedCourseId);
      formData.append('title', this.lessonTitle);
      formData.append('type', this.lessonType);
      formData.append('isPremium', this.isPremium.toString());

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          this.uploadProgress.set(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          this.successMessage.set('Vidéo uploadée avec succès !');
          this.resetForm();
          this.loadUploadedVideos();
        } else {
          const error = JSON.parse(xhr.responseText);
          this.errorMessage.set(error.error?.message || 'Erreur lors de l\'upload');
        }
        this.isUploading.set(false);
        this.uploadProgress.set(null);
      });

      xhr.addEventListener('error', () => {
        this.errorMessage.set('Erreur de connexion lors de l\'upload');
        this.isUploading.set(false);
        this.uploadProgress.set(null);
      });

      xhr.open('POST', `${this.API_URL}/admin/upload-video`);
      xhr.send(formData);

    } catch (error: any) {
      console.error('Upload error:', error);
      this.errorMessage.set('Erreur lors de l\'upload de la vidéo');
      this.isUploading.set(false);
    }
  }

  cancelUpload() {
    this.isUploading.set(false);
    this.uploadProgress.set(null);
    this.errorMessage.set('Upload annulé');
  }

  resetForm() {
    this.selectedFile = null;
    this.selectedCourseId = '';
    this.lessonTitle = '';
    this.lessonType = 'VIDEO';
    this.isPremium = false;
  }

  loadCourses() {
    this.http.get<any>(`${this.API_URL}/courses`).subscribe({
      next: (response) => this.courses.set(response.courses || []),
      error: (error) => console.error('Error loading courses:', error)
    });
  }

  loadUploadedVideos() {
    // This would load recently uploaded videos
    // Implementation depends on your backend endpoint
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
