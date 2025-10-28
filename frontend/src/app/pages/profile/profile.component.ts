import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ProfileService,
  UserProfile,
  Badge,
  Activity,
  DetailedStats
} from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  profile: UserProfile | null = null;
  badges: Badge[] = [];
  activities: Activity[] = [];
  stats: DetailedStats | null = null;

  loading = true;
  error: string | null = null;
  activeTab: 'badges' | 'activity' | 'stats' = 'badges';

  levelConfig = {
    BOIS: { color: '#8B4513', icon: '🪵', label: 'Bois' },
    BRONZE: { color: '#CD7F32', icon: '🥉', label: 'Bronze' },
    ARGENT: { color: '#C0C0C0', icon: '🥈', label: 'Argent' },
    OR: { color: '#FFD700', icon: '🥇', label: 'Or' },
    PLATINUM: { color: '#E5E4E2', icon: '💎', label: 'Platinum' },
    LEGENDAIRE: { color: '#9C27B0', icon: '👑', label: 'Légendaire' },
    MONDIAL: { color: '#FF6B6B', icon: '🌍', label: 'Mondial' }
  };

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
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.error = null;

    this.profileService.getProfile().subscribe({
      next: (res: any) => {
        // Adapter la structure backend à l'interface frontend
        this.profile = {
          id: res.profile.id,
          name: res.profile.name,
          email: res.profile.email,
          semester: res.profile.semester,
          xpTotal: res.profile.gamification.xpTotal,
          level: res.profile.gamification.level.current,
          consecutiveGoodAnswers: res.profile.gamification.consecutiveStreak,
          legendQuestionsCompleted: res.profile.gamification.legendQuestionsCompleted,
          createdAt: res.profile.createdAt
        };
        this.loadBadges();
        this.loadActivity();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  loadBadges() {
    this.profileService.getBadges().subscribe({
      next: (res) => {
        this.badges = res.badges;
      },
      error: (err) => console.error('Error loading badges:', err)
    });
  }

  loadActivity() {
    this.profileService.getActivity().subscribe({
      next: (res) => {
        this.activities = res.activities;
      },
      error: (err) => console.error('Error loading activity:', err)
    });
  }

  loadStats() {
    this.profileService.getDetailedStats().subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: 'badges' | 'activity' | 'stats') {
    this.activeTab = tab;
  }

  getLevelInfo() {
    if (!this.profile) return null;
    const level = this.profile.level as keyof typeof this.levelConfig;
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
      progressPercent
    };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return date.toLocaleDateString('fr-FR');
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      QUIZ: '📝',
      CHALLENGE: '🎯',
      EXAM: '📋',
      BADGE: '🏆',
      LEVEL_UP: '⭐'
    };
    return icons[type] || '•';
  }

  getBadgesByCategory(category: 'LEVEL' | 'ACHIEVEMENT' | 'SPECIAL') {
    return this.badges.filter(b => b.category === category);
  }

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
    }
  }
}
