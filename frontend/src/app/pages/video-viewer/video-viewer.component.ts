import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform/browser';

@Component({
  selector: 'app-video-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-viewer.component.html',
  styleUrls: ['./video-viewer.component.css']
})
export class VideoViewerComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  videoEmbedUrl: SafeResourceUrl | null = null;
  videoTitle: string = '';
  loading = true;

  ngOnInit() {
    const youtubeId = this.route.snapshot.paramMap.get('id') || '';
    this.videoTitle = this.route.snapshot.queryParamMap.get('title') || 'Vidéo de cours';

    if (youtubeId) {
      // Create YouTube embed URL
      const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
      this.videoEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/videos', this.route.snapshot.queryParamMap.get('subjectId')]);
  }
}
