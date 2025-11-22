import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { QrocService, Qroc } from '../../services/qroc.service';
import { SubjectsService, Subject } from '../../services/subjects.service';

@Component({
  selector: 'app-qroc',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './qroc.component.html',
  styleUrls: ['./qroc.component.css']
})
export class QrocComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private qrocService = inject(QrocService);
  private subjectsService = inject(SubjectsService);

  subjectId: string = '';
  subject: Subject | null = null;
  qrocs: Qroc[] = [];
  currentIndex: number = 0;
  isFlipped: boolean = false;
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

    // Load QROCs
    this.qrocService.getQrocsBySubject(this.subjectId).subscribe({
      next: (res) => {
        this.qrocs = res.qrocs;
        this.loading = false;
        if (this.qrocs.length === 0) {
          this.error = null; // No error, just no QROCs available
        }
      },
      error: (err) => {
        console.error('Error loading QROCs:', err);
        this.error = 'Erreur lors du chargement des QROCs';
        this.loading = false;
      }
    });
  }

  get currentQroc(): Qroc | null {
    return this.qrocs[this.currentIndex] || null;
  }

  get progress(): number {
    if (this.qrocs.length === 0) return 0;
    return ((this.currentIndex + 1) / this.qrocs.length) * 100;
  }

  flipCard() {
    this.isFlipped = !this.isFlipped;
  }

  nextCard() {
    if (this.currentIndex < this.qrocs.length - 1) {
      this.currentIndex++;
      this.isFlipped = false;
    }
  }

  previousCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.isFlipped = false;
    }
  }

  goToCard(index: number) {
    if (index >= 0 && index < this.qrocs.length) {
      this.currentIndex = index;
      this.isFlipped = false;
    }
  }

  shuffleCards() {
    // Fisher-Yates shuffle algorithm
    for (let i = this.qrocs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.qrocs[i], this.qrocs[j]] = [this.qrocs[j], this.qrocs[i]];
    }
    this.currentIndex = 0;
    this.isFlipped = false;
  }

  resetCards() {
    this.currentIndex = 0;
    this.isFlipped = false;
  }

  goBack() {
    this.router.navigate(['/subject-options', this.subjectId]);
  }
}
