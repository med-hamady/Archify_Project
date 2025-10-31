import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
export class ExamComponent implements OnInit, OnDestroy {
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
  questionCountOptions: number[] = [];
  selectedDuration: number = 60; // Par défaut 60 minutes
  durationOptions: number[] = [15, 30, 45, 60, 90];

  // Timer state
  timeRemaining: number = 0; // En secondes
  timerInterval: any = null;
  timerWarning: boolean = false; // Afficher en rouge si < 5 minutes

  // Results state
  result: ExamResult | null = null;
  examResultId: string | null = null; // ID du résultat d'examen pour la correction
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
        this.calculateQuestionCountOptions();
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

  calculateQuestionCountOptions() {
    if (!this.exam) return;

    const totalQuestions = this.exam.totalQuestions;
    console.log('🔢 [Exam] Total questions disponibles:', totalQuestions);

    // Si >= 100 questions disponibles, offrir des choix de 20 à 100
    if (totalQuestions >= 100) {
      this.questionCountOptions = [20, 40, 60, 80, 100];
      console.log('✅ [Exam] Options pour >= 100:', this.questionCountOptions);
    } else {
      // Si < 100, garder les choix de 10 à 40
      this.questionCountOptions = [10, 20, 30, 40].filter(count => count <= totalQuestions);
      console.log('✅ [Exam] Options pour < 100:', this.questionCountOptions);
    }
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

    // Démarrer le minuteur
    this.timeRemaining = this.selectedDuration * 60; // Convertir minutes en secondes
    this.startTimer();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      // Warning si moins de 5 minutes
      this.timerWarning = this.timeRemaining <= 300; // 5 minutes = 300 secondes

      // Auto-submit si le temps est écoulé
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.submitExam();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getTimerDisplay(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.stopTimer();
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

    // Arrêter le timer
    this.stopTimer();

    this.loading = true;
    const formattedAnswers = this.answers.map(a => ({
      questionId: a.questionId,
      selectedAnswers: a.selectedAnswers
    }));

    console.log('📤 Submitting exam:', {
      subjectId: this.subjectId,
      examId: this.exam.examId,
      answerCount: formattedAnswers.length,
      answers: formattedAnswers
    });

    this.examService.submitExam(this.subjectId, this.exam.examId, formattedAnswers).subscribe({
      next: (res) => {
        this.result = res.result;
        this.examResultId = res.result.examResultId; // Sauvegarder l'ID du résultat pour la correction
        this.currentState = 'results';
        this.loading = false;

        console.log('✅ Exam submitted successfully. Result ID:', this.examResultId);

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
        console.error('❌ Error submitting exam:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message,
          url: err.url
        });
        this.error = err.error?.error?.message || err.error?.message || err.message || 'Erreur lors de la soumission de l\'examen';
        this.loading = false;
      }
    });
  }

  viewCorrection() {
    if (!this.examResultId) {
      console.error('❌ No exam result ID available for correction');
      this.error = 'ID du résultat d\'examen introuvable';
      return;
    }
    this.loading = true;

    console.log('📖 Loading correction for exam result:', this.examResultId);

    this.examService.getExamCorrection(this.examResultId).subscribe({
      next: (res) => {
        console.log('✅ Correction received:', res);
        console.log('Correction data:', {
          scoreOutOf20: res.correction.scoreOutOf20,
          score: res.correction.score,
          totalQuestions: res.correction.totalQuestions,
          chapterBreakdown: res.correction.chapterBreakdown
        });
        this.correction = res.correction;
        this.currentState = 'correction';
        this.selectedChapterIndex = 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading correction:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.error?.error?.message || err.message
        });
        this.error = err.error?.error?.message || 'Erreur lors du chargement de la correction';
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
