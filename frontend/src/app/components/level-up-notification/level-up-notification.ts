import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-level-up-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level-up-notification.html',
  styleUrl: './level-up-notification.css',
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'scale(0.8)' })),
      state('*', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void => *', [
        animate('600ms cubic-bezier(0.34, 1.56, 0.64, 1)')
      ]),
      transition('* => void', [
        animate('400ms ease-out', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class LevelUpNotification implements OnInit {
  @Input() newLevel: string = 'PLATINE';
  @Input() userName: string = 'Utilisateur';
  @Input() show: boolean = false;

  levelNames: Record<string, string> = {
    'BOIS': 'BOIS',
    'BRONZE': 'BRONZE',
    'ARGENT': 'ARGENT',
    'OR': 'OR',
    'PLATINUM': 'PLATINE',
    'DIAMANT': 'DIAMANT',
    'MONDIAL': 'MONDIAL'
  };

  congratsMessages: Record<string, string> = {
    'BOIS': 'Bon début, continue sur ta lancée',
    'BRONZE': 'Tu progresses bien, continue ainsi',
    'ARGENT': 'Excellent travail, tu es sur la bonne voie',
    'OR': 'Impressionnant, continue à briller',
    'PLATINUM': 'Bien joué, continue à grimper vers le sommet',
    'DIAMANT': 'Exceptionnel, tu atteins des sommets',
    'MONDIAL': 'Légendaire ! Tu es au sommet'
  };

  ngOnInit() {
    if (this.show) {
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.show = false;
      }, 5000);
    }
  }

  getBadgeImage(): string {
    const levelKey = this.newLevel.toUpperCase();
    return `assets/badges/${levelKey}.png`;
  }

  getCongratsMessage(): string {
    return this.congratsMessages[this.newLevel] || 'Félicitations pour ton nouveau niveau';
  }

  getLevelName(): string {
    return this.levelNames[this.newLevel] || this.newLevel;
  }

  close() {
    this.show = false;
  }
}
