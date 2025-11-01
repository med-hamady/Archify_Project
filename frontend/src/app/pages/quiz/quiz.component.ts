import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuizService, QuizQuestion, QuizAnswerResponse } from '../../services/quiz.service';
import { ScreenshotProtectionService } from '../../services/screenshot-protection.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit, OnDestroy {
  private quizService = inject(QuizService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private screenshotProtection = inject(ScreenshotProtectionService);
  private authService = inject(AuthService);

  chapterId: string | null = null;
  currentQuestion: QuizQuestion | null = null;
  selectedAnswers: number[] = [];
  answered = false;
  showResult = false;
  result: QuizAnswerResponse['result'] | null = null;

  loading = true;
  error: string | null = null;
  chapterCompleted = false;
  completionMessage: string | null = null;

  // Animations
  showXPAnimation = false;
  showLevelUpAnimation = false;
  showBadgeAnimation = false;

  ngOnInit() {
    // Activer la protection anti-capture d'écran
    this.screenshotProtection.enableProtection();

    // Ajouter le watermark avec l'email de l'utilisateur
    const user = this.authService.user();
    if (user?.email) {
      const watermark = this.screenshotProtection.createWatermark(user.email);
      document.body.appendChild(watermark);
    }

    this.chapterId = this.route.snapshot.paramMap.get('chapterId');
    if (this.chapterId) {
      this.loadNextQuestion();
    } else {
      this.error = 'ID de chapitre manquant';
      this.loading = false;
    }
  }

  ngOnDestroy() {
    // Désactiver la protection quand on quitte la page
    this.screenshotProtection.disableProtection();
    this.screenshotProtection.removeWatermark();
  }

  loadNextQuestion(replay: boolean = false) {
    if (!this.chapterId) return;

    // Sauvegarder l'ID de la question actuelle avant de la réinitialiser
    const currentQuestionId = this.currentQuestion?.id;
    console.log('🔍 [Quiz] Loading next question - Current:', currentQuestionId, 'Replay:', replay);

    this.loading = true;
    this.error = null;
    this.selectedAnswers = [];
    this.answered = false;
    this.showResult = false;
    this.result = null;
    this.chapterCompleted = false;
    this.completionMessage = null;

    this.quizService.getNextQuestion(this.chapterId, replay, currentQuestionId).subscribe({
      next: (res) => {
        if (res.completed) {
          // Chapitre terminé
          this.chapterCompleted = true;
          this.completionMessage = res.message || 'Chapitre terminé! Toutes les questions ont été répondues correctement.';
          this.loading = false;
        } else if (res.question) {
          console.log('✅ [Quiz] Received question:', res.question.id, 'Position:', res.question.position);
          this.currentQuestion = res.question;
          this.loading = false;
        } else {
          this.error = 'Plus de questions disponibles dans ce chapitre';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading question:', err);

        // Vérifier si l'utilisateur a atteint la limite de QCM gratuits
        if (err.error?.error?.code === 'FREE_LIMIT_REACHED') {
          alert('Vous avez utilisé vos 3 QCM gratuits. Vous allez être redirigé vers la page d\'abonnement.');
          this.router.navigate(['/subscription']);
          return;
        }

        this.error = err.error?.error?.message || 'Erreur lors du chargement de la question';
        this.loading = false;
      }
    });
  }

  replayChapter() {
    this.loadNextQuestion(true);
  }

  selectAnswer(index: number) {
    if (this.answered) return;

    // Toggle selection: if already selected, remove it; otherwise add it
    const indexPosition = this.selectedAnswers.indexOf(index);
    if (indexPosition > -1) {
      this.selectedAnswers.splice(indexPosition, 1);
    } else {
      this.selectedAnswers.push(index);
    }
  }

  isSelected(index: number): boolean {
    return this.selectedAnswers.includes(index);
  }

  submitAnswer() {
    // Allow submission even with 0 answers selected (all answers may be false)
    if (!this.currentQuestion) return;

    this.answered = true;

    this.quizService.answerQuestion(this.currentQuestion.id, this.selectedAnswers).subscribe({
      next: (res) => {
        this.result = res.result;
        this.showResult = true;

        // Animations
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
        console.error('Error submitting answer:', err);

        // Vérifier si l'utilisateur a atteint la limite de QCM gratuits
        if (err.error?.error?.code === 'FREE_LIMIT_REACHED') {
          alert('Vous avez utilisé vos 3 QCM gratuits. Vous allez être redirigé vers la page d\'abonnement.');
          this.router.navigate(['/subscription']);
          return;
        }

        this.error = 'Erreur lors de la soumission de la réponse';
        this.answered = false;
      }
    });
  }

  nextQuestion() {
    this.loadNextQuestion();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
