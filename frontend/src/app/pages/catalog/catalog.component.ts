import { Component, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Course {
  id: string;
  title: string;
  description: string;
  professor: string;
  department: string;
  departmentId: string;
  semester: string;
  tags: string[];
  isPremium: boolean;
  views: number;
  lessonCount: number;
  createdAt: string;
}

interface CourseResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface Department {
  id: string;
  name: string;
  courseCount: number;
  userCount: number;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold text-gray-900">Catalogue des cours</h1>
            <div class="text-sm text-gray-500" *ngIf="courses().length > 0">
              {{ pagination().total }} cours disponibles
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- Search -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch()"
                placeholder="Titre, professeur, matière..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
      </div>

            <!-- Semester -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
              <select 
                [(ngModel)]="selectedSemester"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
                <option value="S4">S4</option>
                <option value="S5">S5</option>
                <option value="S6">S6</option>
        </select>
            </div>

            <!-- Department -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Département</label>
              <select 
                [(ngModel)]="selectedDepartment"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option *ngFor="let dept of departments()" [value]="dept.id">{{ dept.name }}</option>
        </select>
            </div>

            <!-- Premium Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select 
                [(ngModel)]="premiumFilter"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="false">Gratuits</option>
                <option value="true">Premium</option>
        </select>
            </div>
          </div>
      </div>

        <!-- Loading State -->
        <div *ngIf="isLoading()" class="mt-8 text-center">
          <div class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement des cours...
          </div>
        </div>

        <!-- Courses Grid -->
        <div *ngIf="!isLoading()" class="mt-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let course of courses()" 
                 [routerLink]="['/course', course.id]" 
                 class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group cursor-pointer">
              
              <!-- Course Thumbnail -->
              <div class="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative">
                <svg class="w-16 h-16 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                </svg>
                <span *ngIf="course.isPremium" 
                      class="absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Premium
                </span>
                <span class="absolute top-3 right-3 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  {{ course.lessonCount }} leçons
                </span>
              </div>

              <!-- Course Info -->
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {{ course.title }}
                </h3>
                <p class="text-gray-600 text-sm mb-3">{{ course.professor }}</p>
                <p class="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2">
                  {{ course.description }}
                </p>
                
                <!-- Tags -->
                <div class="flex flex-wrap gap-2 mb-4">
                  <span *ngFor="let tag of course.tags.slice(0, 3)" 
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ tag }}
                  </span>
      </div>

                <!-- Course Meta -->
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <span>{{ course.semester }} • {{ course.department }}</span>
                  <span>{{ course.views }} vues</span>
                </div>
          </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="courses().length === 0 && !isLoading()" class="mt-16 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 10-8 8 7.962 7.962 0 01-2.291-6z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun cours trouvé</h3>
            <p class="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>

          <!-- Pagination -->
          <div *ngIf="pagination().pages > 1" class="mt-8 flex items-center justify-center">
            <nav class="flex items-center space-x-2">
              <button 
                (click)="goToPage(pagination().page - 1)"
                [disabled]="pagination().page <= 1"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Précédent
              </button>
              
              <span class="px-3 py-2 text-sm text-gray-700">
                Page {{ pagination().page }} sur {{ pagination().pages }}
              </span>
              
              <button 
                (click)="goToPage(pagination().page + 1)"
                [disabled]="pagination().page >= pagination().pages"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Suivant
              </button>
            </nav>
          </div>
      </div>
      </div>
    </div>
  `
})
export class CatalogComponent implements OnInit {
  private readonly API_URL = 'http://localhost:3000/api';

  // Signals
  private coursesSignal = signal<Course[]>([]);
  private departmentsSignal = signal<Department[]>([]);
  private paginationSignal = signal({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  private isLoadingSignal = signal(false);

  // Form properties
  searchQuery = '';
  selectedSemester = '';
  selectedDepartment = '';
  premiumFilter = '';
  private searchTimeout: any;

  // Computed properties
  courses = computed(() => this.coursesSignal());
  departments = computed(() => this.departmentsSignal());
  pagination = computed(() => this.paginationSignal());
  isLoading = computed(() => this.isLoadingSignal());

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDepartments();
    this.loadCourses();
  }

  private loadDepartments() {
    this.http.get<Department[]>(`${this.API_URL}/departments`).subscribe({
      next: (departments) => this.departmentsSignal.set(departments),
      error: (error) => console.error('Error loading departments:', error)
    });
  }

  private loadCourses() {
    this.isLoadingSignal.set(true);
    
    const params = new URLSearchParams();
    params.set('page', this.pagination().page.toString());
    params.set('limit', this.pagination().limit.toString());
    
    if (this.searchQuery) params.set('search', this.searchQuery);
    if (this.selectedSemester) params.set('semester', this.selectedSemester);
    if (this.selectedDepartment) params.set('department', this.selectedDepartment);
    if (this.premiumFilter) params.set('isPremium', this.premiumFilter);

    this.http.get<CourseResponse>(`${this.API_URL}/courses?${params.toString()}`).subscribe({
      next: (response) => {
        this.coursesSignal.set(response.courses);
        this.paginationSignal.set(response.pagination);
        this.isLoadingSignal.set(false);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.isLoadingSignal.set(false);
      }
    });
  }

  onSearch() {
    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.paginationSignal.update(p => ({ ...p, page: 1 }));
      this.loadCourses();
    }, 500);
  }

  onFilterChange() {
    this.paginationSignal.update(p => ({ ...p, page: 1 }));
    this.loadCourses();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination().pages) {
      this.paginationSignal.update(p => ({ ...p, page }));
      this.loadCourses();
    }
  }
}
