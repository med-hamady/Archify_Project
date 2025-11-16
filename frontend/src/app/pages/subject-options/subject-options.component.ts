import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SubjectsService, Subject } from '../../services/subjects.service';

@Component({
  selector: 'app-subject-options',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subject-options.component.html',
  styleUrls: ['./subject-options.component.css']
})
export class SubjectOptionsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subjectsService = inject(SubjectsService);

  subjectId: string = '';
  subject: Subject | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';
    if (this.subjectId) {
      this.loadSubject();
    }
  }

  loadSubject() {
    this.loading = true;
    this.error = null;

    this.subjectsService.getAllSubjects().subscribe({
      next: (res) => {
        this.subject = res.subjects.find(s => s.id === this.subjectId) || null;
        this.loading = false;

        if (!this.subject) {
          this.error = 'Matière non trouvée';
        }
      },
      error: (err) => {
        console.error('Error loading subject:', err);
        this.error = 'Erreur lors du chargement de la matière';
        this.loading = false;
      }
    });
  }

  navigateToQuiz() {
    this.router.navigate(['/chapters', this.subjectId]);
  }

  navigateToCours() {
    this.router.navigate(['/cours', this.subjectId]);
  }

  navigateToVideos() {
    this.router.navigate(['/videos', this.subjectId]);
  }

  goBack() {
    this.router.navigate(['/subjects']);
  }
}
