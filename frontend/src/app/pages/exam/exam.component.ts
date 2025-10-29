import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ExamService, ExamStart, ExamResult, ExamCorrection } from '../../services/exam.service';
import { LevelUpNotification } from '../../components/level-up-notification/level-up-notification';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, RouterModule, LevelUpNotification],
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css']
})
export class ExamComponent implements OnInit {
  private examService = inject(ExamService);
  private authService = inject(AuthService);
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
  answers: Array<{ questionId: string; selectedAnswers: number[] }> = [];

  // Exam options
  selectedQuestionCount: number = 20; // Par défaut 20 questions
  questionCountOptions: number[] = [10, 20, 30, 40];
  selectedDuration: number = 60; // Par défaut 60 minutes
  durationOptions: number[] = [15, 30, 45, 60, 90];

  // Results state
  result: ExamResult | null = null;
  showXPAnimation = false;
  showLevelUpAnimation = false;
  showBadgeAnimation = false;

  // Level up notification state
  showLevelUpNotification = false;
  levelUpNewLevel: string = '';
  userName: string = '';

  // Correction state
  correction: ExamCorrection | null = null;
  selectedChapterIndex = 0;

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId') || '';

    // Get user name
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || 'Utilisateur';

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

    this.examService.startExam(this.subjectId, this.selectedQuestionCount, this.selectedDuration).subscribe({
      next: (res) => {
        this.exam = res.exam;
        this.initializeAnswers();
        this.currentState = 'start';
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
      selectedAnswers: []
    }));
  }

  startPlaying() {
    this.currentState = 'playing';
    this.currentQuestionIndex = 0;
  }

  toggleAnswer(answerIndex: number) {
    if (!this.exam) return;
    const currentAnswers = this.answers[this.currentQuestionIndex].selectedAnswers;
    const indexPosition = currentAnswers.indexOf(answerIndex);

    if (indexPosition > -1) {
      // Déjà sélectionné, on le retire
      currentAnswers.splice(indexPosition, 1);
    } else {
      // Pas encore sélectionné, on l'ajoute
      currentAnswers.push(answerIndex);
    }
  }

  isAnswerSelected(answerIndex: number): boolean {
    return this.answers[this.currentQuestionIndex]?.selectedAnswers.includes(answerIndex) || false;
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
    // Pas besoin de vérifier, on peut soumettre même avec des réponses vides
    return true;
  }

  submitExam() {
    if (!this.exam) return;

    this.loading = true;
    const formattedAnswers = this.answers.map(a => ({
      questionId: a.questionId,
      selectedAnswers: a.selectedAnswers
    }));

    this.examService.submitExam(this.subjectId, this.exam.examId, formattedAnswers).subscribe({
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

          // Show beautiful level-up notification
          this.levelUpNewLevel = res.result.levelUp.newLevel;
          this.showLevelUpNotification = true;
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
    return this.answers.filter(a => a.selectedAnswers.length > 0).length;
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
