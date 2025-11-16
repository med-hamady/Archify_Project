import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SubjectsService, Subject } from '../../services/subjects.service';
import { environment } from '../../../environments/environment';

interface CoursePdf {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  pdfUrl: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

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
  private http = inject(HttpClient);

  subjectId: string = '';
  subject: Subject | null = null;
  coursePdfs: CoursePdf[] = [];
  loading = true;
  loadingPdfs = false;

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

        // Load course PDFs
        this.loadCoursePdfs();
      },
      error: (err) => {
        console.error('Error loading subject:', err);
        this.loading = false;
      }
    });
  }

  loadCoursePdfs() {
    this.loadingPdfs = true;

    this.http.get<any>(`${environment.apiUrl}/course-pdfs/subject/${this.subjectId}`).subscribe({
      next: (res) => {
        this.coursePdfs = res.coursePdfs || [];
        this.loadingPdfs = false;
      },
      error: (err) => {
        console.error('Error loading course PDFs:', err);
        this.loadingPdfs = false;
      }
    });
  }

  getPdfUrl(pdfUrl: string): string {
    if (pdfUrl.startsWith('http')) {
      return pdfUrl;
    }
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${pdfUrl}`;
  }

  openPdf(pdf: CoursePdf) {
    const fullUrl = this.getPdfUrl(pdf.pdfUrl);
    const encodedUrl = encodeURIComponent(fullUrl);

    this.router.navigate(['/pdf-viewer', encodedUrl], {
      queryParams: {
        title: pdf.title,
        subjectId: this.subjectId
      }
    });
  }

  goBack() {
    this.router.navigate(['/subject-options', this.subjectId]);
  }
}
