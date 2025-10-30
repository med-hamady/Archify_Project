import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';

@Component({
  selector: 'app-subscription-required',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-required.component.html',
  styleUrls: ['./subscription-required.component.css']
})
export class SubscriptionRequiredComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptionService = inject(SubscriptionService);

  returnUrl: string = '/dashboard';
  loading = true;

  ngOnInit() {
    // Récupérer l'URL de retour
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Vérifier le statut d'abonnement
    this.subscriptionService.checkSubscription().subscribe({
      next: (response) => {
        this.loading = false;
        // Si l'utilisateur a un abonnement valide, le rediriger
        if (response.subscription.canAccessQuiz) {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToSubscriptions() {
    // TODO: Naviguer vers la page d'abonnements quand elle sera créée
    alert('Page d\'abonnements à venir');
  }
}
