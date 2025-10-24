import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ExamService, ExamStart, ExamResult, ExamCorrection } from '../../services/exam.service';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css']
})
export class ExamComponent implements OnInit {
  private examService = inject(ExamService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  subjectId: string = '';
  exam: ExamStart | null = null;

  // States
  loading = true;
  error: string | null = null;
  currentState: 'start' | 'playing' | 'results' | 'correction' = 'start';

  // Playing state
  currentQuestionIndex = 0;
  answers: Array<{ questionId: string; selectedAnswer: number | null }> = [];

  // Results state
  result: ExamResult | null = null;
  showXPAnimation = false;
  showLevelUpAnimation = false;
  showBadgeAnimation = false;

  // Correction state
  correction: ExamCorrection | null = null;
  selectedChapterIndex = 0;

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';
    if (this.subjectId) {
      this.loadExam();
    } else {
      this.error = 'Identifiant de matière manquant';
      this.loading = false;
    }
  }

  loadExam() {
    this.loading = true;
    this.error = null;

    this.examService.startExam(this.subjectId).subscribe({
      next: (res) => {
        if (res.exam.canStart) {
          this.exam = res.exam;
          this.initializeAnswers();
          this.currentState = 'start';
        } else {
          this.error = res.exam.reason || 'Vous ne pouvez pas démarrer cet examen';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading exam:', err);
        this.error = err.error?.error?.message || 'Erreur lors du chargement de l\'examen';
        this.loading = false;
      }
    });
  }

  initializeAnswers() {
    if (!this.exam) return;
    this.answers = this.exam.questions.map(q => ({
      questionId: q.id,
      selectedAnswer: null
    }));
  }

  startPlaying() {
    this.currentState = 'playing';
    this.currentQuestionIndex = 0;
  }

  selectAnswer(answerIndex: number) {
    if (!this.exam) return;
    this.answers[this.currentQuestionIndex].selectedAnswer = answerIndex;
  }

  nextQuestion() {
    if (!this.exam) return;
    if (this.currentQuestionIndex < this.exam.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  goToQuestion(index: number) {
    this.currentQuestionIndex = index;
  }

  canSubmit(): boolean {
    return this.answers.every(a => a.selectedAnswer !== null);
  }

  submitExam() {
    if (!this.exam || !this.canSubmit()) return;

    this.loading = true;
    const formattedAnswers = this.answers.map(a => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer as number
    }));

    this.examService.submitExam(this.exam.examId, formattedAnswers).subscribe({
      next: (res) => {
        this.result = res.result;
        this.currentState = 'results';
        this.loading = false;

        // Trigger animations
        if (res.result.xpEarned > 0) {
          this.showXPAnimation = true;
          setTimeout(() => this.showXPAnimation = false, 2000);
        }
        if (res.result.levelUp) {
          this.showLevelUpAnimation = true;
          setTimeout(() => this.showLevelUpAnimation = false, 3000);
        }
        if (res.result.newBadges && res.result.newBadges.length > 0) {
          this.showBadgeAnimation = true;
          setTimeout(() => this.showBadgeAnimation = false, 3000);
        }
      },
      error: (err) => {
        console.error('Error submitting exam:', err);
        this.error = err.error?.error?.message || 'Erreur lors de la soumission de l\'examen';
        this.loading = false;
      }
    });
  }

  viewCorrection() {
    if (!this.exam) return;
    this.loading = true;

    this.examService.getExamCorrection(this.exam.examId).subscribe({
      next: (res) => {
        this.correction = res.correction;
        this.currentState = 'correction';
        this.selectedChapterIndex = 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading correction:', err);
        this.error = 'Erreur lors du chargement de la correction';
        this.loading = false;
      }
    });
  }

  getAnsweredCount(): number {
    return this.answers.filter(a => a.selectedAnswer !== null).length;
  }

  getCurrentQuestion() {
    if (!this.exam) return null;
    return this.exam.questions[this.currentQuestionIndex];
  }

  getCurrentAnswer() {
    return this.answers[this.currentQuestionIndex];
  }

  getDifficultyClass(difficulty: string): string {
    const map: any = {
      'FACILE': 'easy',
      'MOYEN': 'medium',
      'DIFFICILE': 'hard',
      'LEGENDE': 'legend'
    };
    return map[difficulty] || 'medium';
  }

  getDifficultyLabel(difficulty: string): string {
    const map: any = {
      'FACILE': 'Facile',
      'MOYEN': 'Moyen',
      'DIFFICILE': 'Difficile',
      'LEGENDE': 'Légende'
    };
    return map[difficulty] || difficulty;
  }

  getGradeClass(grade: string): string {
    if (grade.startsWith('A')) return 'grade-a';
    if (grade.startsWith('B')) return 'grade-b';
    if (grade.startsWith('C')) return 'grade-c';
    if (grade.startsWith('D')) return 'grade-d';
    return 'grade-f';
  }

  selectChapter(index: number) {
    this.selectedChapterIndex = index;
  }

  getSelectedChapter() {
    if (!this.correction) return null;
    return this.correction.chapterBreakdown[this.selectedChapterIndex];
  }

  restartExam() {
    this.loadExam();
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
