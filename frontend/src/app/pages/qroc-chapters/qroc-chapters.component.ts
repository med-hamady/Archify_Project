import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { QrocService, QrocCategory } from '../../services/qroc.service';
import { SubjectsService, Subject } from '../../services/subjects.service';

@Component({
  selector: 'app-qroc-chapters',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './qroc-chapters.component.html',
  styleUrls: ['./qroc-chapters.component.css']
})
export class QrocChaptersComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private qrocService = inject(QrocService);
  private subjectsService = inject(SubjectsService);

  subjectId: string = '';
  subject: Subject | null = null;
  categories: QrocCategory[] = [];
  totalCount: number = 0;
  loading: boolean = true;
  error: string | null = null;

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';
    if (this.subjectId) {
      this.loadData();
    } else {
      this.error = 'Identifiant de matière manquant';
      this.loading = false;
    }
  }

  loadData() {
    this.loading = true;
    this.error = null;

    // Load subject info
    this.subjectsService.getAllSubjects().subscribe({
      next: (res) => {
        this.subject = res.subjects.find(s => s.id === this.subjectId) || null;
      },
      error: (err) => {
        console.error('Error loading subject:', err);
      }
    });

    // Load categories
    this.qrocService.getCategories(this.subjectId).subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Erreur lors du chargement des chapitres';
        this.loading = false;
      }
    });
  }

  selectCategory(category: QrocCategory) {
    this.router.navigate(['/qroc', this.subjectId], {
      queryParams: { category: category.name }
    });
  }

  viewAllQrocs() {
    this.router.navigate(['/qroc', this.subjectId]);
  }

  goBack() {
    this.router.navigate(['/subject-options', this.subjectId]);
  }
}
