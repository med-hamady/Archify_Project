import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ChallengeService, ChallengeStart, ChallengeResult } from '../../services/challenge.service';
import { LevelUpNotification } from '../../components/level-up-notification/level-up-notification';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-challenge',
  standalone: true,
  imports: [CommonModule, RouterModule, LevelUpNotification],
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.css']
})
export class ChallengeComponent implements OnInit, OnDestroy {
  private challengeService = inject(ChallengeService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  chapterId: string = '';
  challenge: ChallengeStart | null = null;

  // States
  loading = true;
  error: string | null = null;
  currentState: 'start' | 'playing' | 'results' = 'start';

  // Playing state
  currentQuestionIndex = 0;
  answers: Array<{ questionId: string; selectedAnswers: number[] }> = [];

  // Timer state
  selectedMinutes: number = 10; // Default 10 minutes
  timeOptions: number[] = [5, 10, 15, 20, 30, 45, 60]; // Available time options
  timeRemainingSeconds: number = 0;
  timerInterval: any = null;
  timerDisplay: string = '';

  // Question count selection
  selectedQuestionCount: number | null = null; // null = toutes les questions
  availableQuestionCounts: number[] = [];

  // Results state
  result: ChallengeResult | null = null;
  showXPAnimation = false;
  showLevelUpAnimation = false;
  showBadgeAnimation = false;

  // Level up notification state
  showLevelUpNotification = false;
  levelUpNewLevel: string = '';
  userName: string = '';

  ngOnInit() {
    this.chapterId = this.route.snapshot.paramMap.get('chapterId') || '';

    // Get user name
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || 'Utilisateur';

    if (this.chapterId) {
      this.loadChallenge();
    } else {
      this.error = 'Identifiant de chapitre manquant';
      this.loading = false;
    }
  }

  loadChallenge() {
    this.loading = true;
    this.error = null;

    this.challengeService.startChallenge(this.chapterId, this.selectedQuestionCount || undefined).subscribe({
      next: (res) => {
        this.challenge = res.challenge;

        // Générer les options de nombre de questions basées sur le total disponible
        const total = res.challenge.totalQuestionsInChapter || res.challenge.totalQuestions;
        this.availableQuestionCounts = [];
        for (let i = 5; i <= total; i += 5) {
          this.availableQuestionCounts.push(i);
        }
        if (!this.availableQuestionCounts.includes(total)) {
          this.availableQuestionCounts.push(total);
        }

        this.initializeAnswers();
        this.currentState = 'start';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading challenge:', err);
        this.error = err.error?.error?.message || 'Erreur lors du chargement du challenge';
        this.loading = false;
      }
    });
  }

  initializeAnswers() {
    if (!this.challenge) return;
    this.answers = this.challenge.questions.map(q => ({
      questionId: q.id,
      selectedAnswers: []
    }));
  }

  startPlaying() {
    this.currentState = 'playing';
    this.currentQuestionIndex = 0;
    this.startTimer();
  }

  startTimer() {
    // Initialize timer with selected minutes
    this.timeRemainingSeconds = this.selectedMinutes * 60;
    this.updateTimerDisplay();

    // Clear any existing interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Start countdown
    this.timerInterval = setInterval(() => {
      this.timeRemainingSeconds--;
      this.updateTimerDisplay();

      if (this.timeRemainingSeconds <= 0) {
        this.stopTimer();
        this.autoSubmitChallenge();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemainingSeconds / 60);
    const seconds = this.timeRemainingSeconds % 60;
    this.timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  autoSubmitChallenge() {
    // Auto-submit when timer reaches zero
    if (this.currentState === 'playing') {
      this.submitChallenge();
    }
  }

  ngOnDestroy() {
    // Clean up timer when component is destroyed
    this.stopTimer();
  }

  toggleAnswer(answerIndex: number) {
    if (!this.challenge) return;
    const currentAnswers = this.answers[this.currentQuestionIndex].selectedAnswers;
    const index = currentAnswers.indexOf(answerIndex);

    if (index > -1) {
      // Décocher - retirer de la liste
      currentAnswers.splice(index, 1);
    } else {
      // Cocher - ajouter à la liste
      currentAnswers.push(answerIndex);
    }
  }

  isAnswerSelected(answerIndex: number): boolean {
    return this.answers[this.currentQuestionIndex].selectedAnswers.includes(answerIndex);
  }

  nextQuestion() {
    if (!this.challenge) return;
    if (this.currentQuestionIndex < this.challenge.questions.length - 1) {
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
    // On peut soumettre même sans réponses (si toutes les options sont fausses)
    return true;
  }

  submitChallenge() {
    if (!this.challenge || !this.canSubmit()) return;

    // Stop the timer
    this.stopTimer();

    this.loading = true;
    const formattedAnswers = this.answers.map(a => ({
      questionId: a.questionId,
      selectedAnswers: a.selectedAnswers
    }));

    this.challengeService.submitChallenge(this.chapterId, formattedAnswers).subscribe({
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
        console.error('Error submitting challenge:', err);
        this.error = err.error?.error?.message || 'Erreur lors de la soumission du challenge';
        this.loading = false;
      }
    });
  }

  getAnsweredCount(): number {
    return this.answers.filter(a => a.selectedAnswers.length > 0).length;
  }

  getCurrentQuestion() {
    if (!this.challenge) return null;
    return this.challenge.questions[this.currentQuestionIndex];
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

  getQuestionResult(questionId: string) {
    if (!this.result) return null;
    return this.result.detailedResults.find(r => r.questionId === questionId);
  }

  restartChallenge() {
    this.loadChallenge();
  }

  backToChapters() {
    // Navigate back to chapter detail page (quiz page)
    this.router.navigate(['/quiz', this.chapterId]);
  }
}
