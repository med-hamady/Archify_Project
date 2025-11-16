import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SubjectsService, Subject } from '../../services/subjects.service';

@Component({
  selector: 'app-cours',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cours.component.html',
  styleUrls: ['./cours.component.css']
})
export class CoursComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subjectsService = inject(SubjectsService);

  subjectId: string = '';
  subject: Subject | null = null;
  loading = true;

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';
    if (this.subjectId) {
      this.loadSubject();
    }
  }

  loadSubject() {
    this.loading = true;

    this.subjectsService.getAllSubjects().subscribe({
      next: (res) => {
        this.subject = res.subjects.find(s => s.id === this.subjectId) || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subject:', err);
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/subject-options', this.subjectId]);
  }
}
