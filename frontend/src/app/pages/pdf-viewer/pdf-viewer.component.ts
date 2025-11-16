import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PdfViewerComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  pdfUrl: SafeResourceUrl | null = null;
  pdfTitle: string = '';
  loading = true;

  ngOnInit() {
    const encodedUrl = this.route.snapshot.paramMap.get('url') || '';
    this.pdfTitle = this.route.snapshot.queryParamMap.get('title') || 'Document PDF';

    if (encodedUrl) {
      // Decode the URL
      const decodedUrl = decodeURIComponent(encodedUrl);

      // Sanitize the URL for iframe
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(decodedUrl);
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/cours', this.route.snapshot.queryParamMap.get('subjectId')]);
  }
}
