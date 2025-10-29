import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ChallengeService, ChallengeStart, ChallengeResult } from '../../services/challenge.service';

@Component({
  selector: 'app-challenge',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.css']
})
export class ChallengeComponent implements OnInit {
  private challengeService = inject(ChallengeService);
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

  // Results state
  result: ChallengeResult | null = null;
  showXPAnimation = false;
  showLevelUpAnimation = false;
  showBadgeAnimation = false;

  ngOnInit() {
    this.chapterId = this.route.snapshot.paramMap.get('chapterId') || '';
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

    this.challengeService.startChallenge(this.chapterId).subscribe({
      next: (res) => {
        this.challenge = res.challenge;
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
    // Navigate back to chapters page
    this.router.navigate(['/chapters', this.chapterId]);
  }
}
