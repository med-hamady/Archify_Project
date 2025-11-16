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
  rawPdfUrl: string = '';
  pdfTitle: string = '';
  loading = true;
  isMobile = false;

  ngOnInit() {
    const encodedUrl = this.route.snapshot.paramMap.get('url') || '';
    this.pdfTitle = this.route.snapshot.queryParamMap.get('title') || 'Document PDF';

    // Detect mobile device
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (encodedUrl) {
      // Decode the URL
      const decodedUrl = decodeURIComponent(encodedUrl);
      this.rawPdfUrl = decodedUrl;

      if (this.isMobile) {
        // On mobile, use Google Docs Viewer for better compatibility
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(decodedUrl)}&embedded=true`;
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(googleDocsUrl);
      } else {
        // On desktop, use direct iframe
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(decodedUrl);
      }

      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/cours', this.route.snapshot.queryParamMap.get('subjectId')]);
  }
}
