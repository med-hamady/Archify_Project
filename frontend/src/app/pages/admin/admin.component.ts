import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Department {
  id: string;
  name: string;
  courseCount: number;
  userCount: number;
}

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

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'exam';
  durationSec: number;
  vimeoId?: string;
  youtubeId?: string;
  pdfUrl?: string;
  isPremium: boolean;
  orderIndex: number;
  createdAt: string;
  courseId: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'superadmin';
  department?: string;
  semester?: number;
  createdAt: string;
  lastLoginAt?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Administration</h1>
              <p class="text-sm text-gray-600">Gérez votre plateforme éducative</p>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500">Connecté en tant que {{ getDisplayName() }}</span>
              <button (click)="logout()"
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Navigation Tabs -->
        <div class="mb-8">
          <nav class="flex space-x-8">
            <button *ngFor="let tab of tabs"
                    (click)="activeTab.set(tab.id)"
                    [class]="activeTab() === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                    class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <!-- Departments Management -->
        <div *ngIf="activeTab() === 'departments'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Départements</h2>
            <button (click)="showAddDepartmentModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ajouter un département
            </button>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateurs</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let dept of departments()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ dept.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ dept.courseCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ dept.userCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editDepartment(dept)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteDepartment(dept.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Courses Management -->
        <div *ngIf="activeTab() === 'courses'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Cours</h2>
            <button (click)="showAddCourseModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ajouter un cours
            </button>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professeur</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let course of courses()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ course.title }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ course.professor }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ course.department }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="course.isPremium ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ course.isPremium ? 'Premium' : 'Gratuit' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editCourse(course)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteCourse(course.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Lessons Management -->
        <div *ngIf="activeTab() === 'lessons'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Leçons</h2>
            <button (click)="showAddLessonModal.set(true)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ajouter une leçon
            </button>
          </div>

          <!-- Course Filter -->
          <div class="flex gap-4 items-center">
            <select [(ngModel)]="selectedCourseId" (change)="loadLessons()"
                    class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les cours</option>
              <option *ngFor="let course of courses()" [value]="course.id">{{ course.title }}</option>
            </select>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let lesson of lessons()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ lesson.title }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span [class]="getLessonTypeClass(lesson.type)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ getLessonTypeLabel(lesson.type) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDuration(lesson.durationSec) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ getCourseTitle(lesson.courseId) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editLesson(lesson)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteLesson(lesson.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users Management -->
        <div *ngIf="activeTab() === 'users'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h2>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let user of users()">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getRoleClass(user.role)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.department || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button (click)="editUser(user)"
                            class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
                    <button (click)="deleteUser(user.id)"
                            class="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Statistics -->
        <div *ngIf="activeTab() === 'stats'" class="space-y-6">
          <h2 class="text-xl font-semibold text-gray-900">Statistiques de la Plateforme</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Cours</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalCourses }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalUsers }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Leçons</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().totalLessons }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Abonnements Actifs</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats().activeSubscriptions }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  private readonly API_URL = 'http://localhost:3000/api';

  // Signals
  activeTab = signal('departments');
  departments = signal<Department[]>([]);
  courses = signal<Course[]>([]);
  lessons = signal<Lesson[]>([]);
  users = signal<User[]>([]);
  stats = signal({
    totalCourses: 0,
    totalUsers: 0,
    totalLessons: 0,
    activeSubscriptions: 0
  });

  // Modal states
  showAddDepartmentModal = signal(false);
  showAddCourseModal = signal(false);
  showAddLessonModal = signal(false);

  // Form data
  selectedCourseId = '';
  newDepartmentName = '';
  newCourse = {
    title: '',
    description: '',
    professor: '',
    semester: '',
    isPremium: false,
    departmentId: '',
    tags: ''
  };
  newLesson = {
    title: '',
    type: 'video' as 'video' | 'pdf' | 'exam',
    durationSec: 0,
    vimeoId: '',
    pdfUrl: '',
    isPremium: false,
    orderIndex: 0,
    courseId: ''
  };

  tabs = [
    { id: 'departments', name: 'Départements' },
    { id: 'courses', name: 'Cours' },
    { id: 'lessons', name: 'Leçons' },
    { id: 'users', name: 'Utilisateurs' },
    { id: 'stats', name: 'Statistiques' }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDepartments();
    this.loadCourses();
    this.loadUsers();
    this.loadStats();
  }

  // Load data methods
  loadDepartments() {
    this.http.get<Department[]>(`${this.API_URL}/departments`).subscribe({
      next: (data) => this.departments.set(data),
      error: (error) => console.error('Error loading departments:', error)
    });
  }

  loadCourses() {
    this.http.get<{courses: Course[]}>(`${this.API_URL}/courses`).subscribe({
      next: (data) => this.courses.set(data.courses),
      error: (error) => console.error('Error loading courses:', error)
    });
  }

  loadLessons() {
    const url = this.selectedCourseId
      ? `${this.API_URL}/lessons/course/${this.selectedCourseId}`
      : `${this.API_URL}/lessons`;

    this.http.get<Lesson[]>(url).subscribe({
      next: (data) => this.lessons.set(data),
      error: (error) => console.error('Error loading lessons:', error)
    });
  }

  loadUsers() {
    this.http.get<User[]>(`${this.API_URL}/users`).subscribe({
      next: (data) => this.users.set(data),
      error: (error) => console.error('Error loading users:', error)
    });
  }

  loadStats() {
    // This would typically come from a dedicated stats endpoint
    this.stats.set({
      totalCourses: this.courses().length,
      totalUsers: this.users().length,
      totalLessons: this.lessons().length,
      activeSubscriptions: 0 // Would need to implement
    });
  }

  // CRUD operations
  addDepartment() {
    if (!this.newDepartmentName.trim()) return;

    this.http.post<Department>(`${this.API_URL}/departments`, {
      name: this.newDepartmentName
    }).subscribe({
      next: () => {
        this.loadDepartments();
        this.showAddDepartmentModal.set(false);
        this.newDepartmentName = '';
      },
      error: (error) => console.error('Error adding department:', error)
    });
  }

  editDepartment(dept: Department) {
    // Implement edit department
    console.log('Edit department:', dept);
  }

  deleteDepartment(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      this.http.delete(`${this.API_URL}/departments/${id}`).subscribe({
        next: () => this.loadDepartments(),
        error: (error) => console.error('Error deleting department:', error)
      });
    }
  }

  addCourse() {
    if (!this.newCourse.title || !this.newCourse.professor || !this.newCourse.departmentId) return;

    this.http.post<Course>(`${this.API_URL}/courses`, {
      ...this.newCourse,
      isPremium: this.newCourse.isPremium,
      tags: this.newCourse.tags ? this.newCourse.tags.split(',').map(tag => tag.trim()) : []
    }).subscribe({
      next: () => {
        this.loadCourses();
        this.showAddCourseModal.set(false);
        this.resetCourseForm();
      },
      error: (error) => console.error('Error adding course:', error)
    });
  }

  editCourse(course: Course) {
    // Implement edit course
    console.log('Edit course:', course);
  }

  deleteCourse(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      this.http.delete(`${this.API_URL}/courses/${id}`).subscribe({
        next: () => this.loadCourses(),
        error: (error) => console.error('Error deleting course:', error)
      });
    }
  }

  addLesson() {
    if (!this.newLesson.title || !this.newLesson.courseId) return;

    const lessonData: any = {
      title: this.newLesson.title,
      type: this.newLesson.type,
      durationSec: this.newLesson.durationSec,
      isPremium: this.newLesson.isPremium,
      orderIndex: this.newLesson.orderIndex,
      courseId: this.newLesson.courseId
    };

    if (this.newLesson.type === 'video' && this.newLesson.vimeoId) {
      lessonData.vimeoId = this.newLesson.vimeoId;
    } else if (this.newLesson.type === 'pdf' && this.newLesson.pdfUrl) {
      lessonData.pdfUrl = this.newLesson.pdfUrl;
    }

    this.http.post<Lesson>(`${this.API_URL}/lessons`, lessonData).subscribe({
      next: () => {
        this.loadLessons();
        this.showAddLessonModal.set(false);
        this.resetLessonForm();
      },
      error: (error) => console.error('Error adding lesson:', error)
    });
  }

  editLesson(lesson: Lesson) {
    // Implement edit lesson
    console.log('Edit lesson:', lesson);
  }

  deleteLesson(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) {
      this.http.delete(`${this.API_URL}/lessons/${id}`).subscribe({
        next: () => this.loadLessons(),
        error: (error) => console.error('Error deleting lesson:', error)
      });
    }
  }

  editUser(user: User) {
    // Implement edit user
    console.log('Edit user:', user);
  }

  deleteUser(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.http.delete(`${this.API_URL}/users/${id}`).subscribe({
        next: () => this.loadUsers(),
        error: (error) => console.error('Error deleting user:', error)
      });
    }
  }

  private resetCourseForm() {
    this.newCourse = {
      title: '',
      description: '',
      professor: '',
      semester: '',
      isPremium: false,
      departmentId: '',
      tags: ''
    };
  }

  private resetLessonForm() {
    this.newLesson = {
      title: '',
      type: 'video',
      durationSec: 0,
      vimeoId: '',
      pdfUrl: '',
      isPremium: false,
      orderIndex: 0,
      courseId: ''
    };
  }

  // Helper methods
  getLessonTypeClass(type: string): string {
    const classes = {
      'video': 'bg-blue-100 text-blue-800',
      'pdf': 'bg-red-100 text-red-800',
      'exam': 'bg-green-100 text-green-800'
    };
    return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getLessonTypeLabel(type: string): string {
    const labels = {
      'video': 'Vidéo',
      'pdf': 'PDF',
      'exam': 'Examen'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getRoleClass(role: string): string {
    const classes = {
      'student': 'bg-blue-100 text-blue-800',
      'admin': 'bg-red-100 text-red-800',
      'superadmin': 'bg-purple-100 text-purple-800'
    };
    return classes[role as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getRoleLabel(role: string): string {
    const labels = {
      'student': 'Étudiant',
      'admin': 'Administrateur',
      'superadmin': 'Super Admin'
    };
    return labels[role as keyof typeof labels] || role;
  }

  getCourseTitle(courseId: string): string {
    const course = this.courses().find(c => c.id === courseId);
    return course ? course.title : 'Cours inconnu';
  }

  formatDuration(seconds: number): string {
    if (seconds === 0) return '0 min';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return remainingSeconds > 0 ? `${minutes}min ${remainingSeconds}s` : `${minutes}min`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  getDisplayName(): string {
    const user = this.authService.user();
    return user ? user.name : 'Utilisateur';
  }

  logout() {
    this.authService.logout();
  }
}