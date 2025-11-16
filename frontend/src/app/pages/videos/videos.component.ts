import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SubjectsService, Subject } from '../../services/subjects.service';
import { environment } from '../../../environments/environment';

interface CourseVideo {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl?: string;
  duration?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subjectsService = inject(SubjectsService);
  private http = inject(HttpClient);

  subjectId: string = '';
  subject: Subject | null = null;
  courseVideos: CourseVideo[] = [];
  loading = true;
  loadingVideos = false;

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

        // Load course videos
        this.loadCourseVideos();
      },
      error: (err) => {
        console.error('Error loading subject:', err);
        this.loading = false;
      }
    });
  }

  loadCourseVideos() {
    this.loadingVideos = true;

    this.http.get<any>(`${environment.apiUrl}/course-videos/subject/${this.subjectId}`).subscribe({
      next: (res) => {
        this.courseVideos = res.courseVideos || [];
        this.loadingVideos = false;
      },
      error: (err) => {
        console.error('Error loading course videos:', err);
        this.loadingVideos = false;
      }
    });
  }

  openVideo(video: CourseVideo) {
    // Navigate to video viewer with video ID
    this.router.navigate(['/video-viewer', video.youtubeId], {
      queryParams: {
        title: video.title,
        subjectId: this.subjectId
      }
    });
  }

  goBack() {
    this.router.navigate(['/subject-options', this.subjectId]);
  }
}
