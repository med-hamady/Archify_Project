import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProfileService, UserProfile, SubjectProgress } from '../../services/profile.service';

@Component({
  selector: 'app-facgame-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './facgame-dashboard.component.html',
  styleUrls: ['./facgame-dashboard.component.css']
})
export class FacgameDashboardComponent implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);

  profile: UserProfile | null = null;
  progress: SubjectProgress[] = [];
  loading = true;
  error: string | null = null;

  // Niveau config
  levelConfig = {
    BOIS: { color: '#8B4513', icon: '🪵', label: 'Bois' },
    BRONZE: { color: '#CD7F32', icon: '🥉', label: 'Bronze' },
    ARGENT: { color: '#C0C0C0', icon: '🥈', label: 'Argent' },
    OR: { color: '#FFD700', icon: '🥇', label: 'Or' },
    PLATINUM: { color: '#E5E4E2', icon: '💎', label: 'Platinum' },
    LEGENDAIRE: { color: '#9C27B0', icon: '👑', label: 'Légendaire' },
    MONDIAL: { color: '#FF6B6B', icon: '🌍', label: 'Mondial' }
  };

  // Seuils XP
  levelThresholds = {
    BOIS: { min: 0, max: 800 },
    BRONZE: { min: 801, max: 1600 },
    ARGENT: { min: 1601, max: 2800 },
    OR: { min: 2801, max: 4000 },
    PLATINUM: { min: 4001, max: 5500 },
    LEGENDAIRE: { min: 5501, max: 9000 },
    MONDIAL: { min: 9001, max: 999999 }
  };

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = null;

    // Charger le profil
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.profile = res.profile;
        this.loadProgress();
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  loadProgress() {
    this.profileService.getProgress().subscribe({
      next: (res) => {
        this.progress = res.progress;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading progress:', err);
        this.loading = false;
      }
    });
  }

  getLevelInfo() {
    if (!this.profile) return null;
    const level = this.profile.level;
    const thresholds = this.levelThresholds[level];
    const currentXP = this.profile.xpTotal;

    const xpInLevel = currentXP - thresholds.min;
    const xpNeeded = thresholds.max - thresholds.min;
    const progressPercent = Math.min((xpInLevel / xpNeeded) * 100, 100);

    return {
      ...this.levelConfig[level],
      currentXP,
      xpInLevel,
      xpNeeded,
      progressPercent,
      nextLevel: this.getNextLevel(level)
    };
  }

  getNextLevel(current: string): string {
    const levels = ['BOIS', 'BRONZE', 'ARGENT', 'OR', 'PLATINUM', 'LEGENDAIRE', 'MONDIAL'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : 'MAX';
  }

  navigateToSubject(subjectId: string) {
    this.router.navigate(['/chapters', subjectId]);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  navigateToLeaderboard() {
    this.router.navigate(['/leaderboard']);
  }
}
