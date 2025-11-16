import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SubjectsService, Subject } from '../../services/subjects.service';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.css']
})
export class SubjectsComponent implements OnInit {
  private subjectsService = inject(SubjectsService);
  private router = inject(Router);

  subjects: Subject[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.loading = true;
    this.error = null;

    this.subjectsService.getAllSubjects().subscribe({
      next: (res) => {
        this.subjects = res.subjects;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        this.error = 'Erreur lors du chargement des matières';
        this.loading = false;
      }
    });
  }

  navigateToChapters(subjectId: string) {
    // Navigate to options page instead of directly to chapters
    this.router.navigate(['/subject-options', subjectId]);
  }

  navigateToExam(subjectId: string, event: Event) {
    console.log('🎯 navigateToExam called with subjectId:', subjectId);
    // Empêcher la propagation pour ne pas déclencher le clic sur la carte
    event.stopPropagation();
    // Navigation vers le mode examen
    console.log('🚀 Navigating to exam...');
    this.router.navigate(['/exam', subjectId]);
  }

  getProgressClass(percent: number): string {
    if (percent === 100) return 'complete';
    if (percent >= 80) return 'high';
    if (percent >= 50) return 'medium';
    if (percent > 0) return 'low';
    return 'none';
  }
}
