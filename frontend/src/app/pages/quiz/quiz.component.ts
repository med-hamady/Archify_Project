import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuizService, QuizQuestion, QuizAnswerResponse } from '../../services/quiz.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  private quizService = inject(QuizService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  chapterId: string | null = null;
  currentQuestion: QuizQuestion | null = null;
  selectedAnswer: number | null = null;
  answered = false;
  showResult = false;
  result: QuizAnswerResponse['result'] | null = null;

  loading = true;
  error: string | null = null;

  // Animations
  showXPAnimation = false;
  showLevelUpAnimation = false;
  showBadgeAnimation = false;

  difficultyConfig = {
    FACILE: { color: '#4CAF50', label: 'Facile', baseXP: 5 },
    MOYEN: { color: '#FF9800', label: 'Moyen', baseXP: 10 },
    DIFFICILE: { color: '#F44336', label: 'Difficile', baseXP: 20 },
    LEGENDE: { color: '#9C27B0', label: 'Légende', baseXP: 30 }
  };

  ngOnInit() {
    this.chapterId = this.route.snapshot.paramMap.get('chapterId');
    if (this.chapterId) {
      this.loadNextQuestion();
    } else {
      this.error = 'ID de chapitre manquant';
      this.loading = false;
    }
  }

  loadNextQuestion() {
    if (!this.chapterId) return;

    this.loading = true;
    this.error = null;
    this.selectedAnswer = null;
    this.answered = false;
    this.showResult = false;
    this.result = null;

    this.quizService.getNextQuestion(this.chapterId).subscribe({
      next: (res) => {
        if (res.question) {
          this.currentQuestion = res.question;
          this.loading = false;
        } else {
          this.error = 'Plus de questions disponibles dans ce chapitre';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading question:', err);
        this.error = err.error?.error?.message || 'Erreur lors du chargement de la question';
        this.loading = false;
      }
    });
  }

  selectAnswer(index: number) {
    if (this.answered) return;
    this.selectedAnswer = index;
  }

  submitAnswer() {
    if (this.selectedAnswer === null || !this.currentQuestion) return;

    this.answered = true;

    this.quizService.answerQuestion(this.currentQuestion.id, this.selectedAnswer).subscribe({
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
        this.error = 'Erreur lors de la soumission de la réponse';
        this.answered = false;
      }
    });
  }

  nextQuestion() {
    this.loadNextQuestion();
  }

  getDifficultyConfig() {
    if (!this.currentQuestion) return null;
    return this.difficultyConfig[this.currentQuestion.difficulty];
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
