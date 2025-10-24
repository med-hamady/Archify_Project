import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SubjectsService, Subject, Chapter } from '../../services/subjects.service';

@Component({
  selector: 'app-chapters',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chapters.component.html',
  styleUrls: ['./chapters.component.css']
})
export class ChaptersComponent implements OnInit {
  private subjectsService = inject(SubjectsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  subjectId: string = '';
  subject: Subject | null = null;
  chapters: Chapter[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';
    if (this.subjectId) {
      this.loadSubjectAndChapters();
    } else {
      this.error = 'Identifiant de matière manquant';
      this.loading = false;
    }
  }

  loadSubjectAndChapters() {
    this.loading = true;
    this.error = null;

    this.subjectsService.getSubjectWithChapters(this.subjectId).subscribe({
      next: (res) => {
        this.subject = res.subject;
        this.chapters = res.subject.chapters || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subject and chapters:', err);
        this.error = 'Erreur lors du chargement des chapitres';
        this.loading = false;
      }
    });
  }

  navigateToQuiz(chapterId: string) {
    this.router.navigate(['/quiz', chapterId]);
  }

  navigateToChallenge(chapterId: string) {
    this.router.navigate(['/challenge', chapterId]);
  }

  navigateToSubjects() {
    this.router.navigate(['/subjects']);
  }

  getProgressClass(percent: number): string {
    if (percent === 100) return 'complete';
    if (percent >= 80) return 'high';
    if (percent >= 50) return 'medium';
    if (percent > 0) return 'low';
    return 'none';
  }
}
