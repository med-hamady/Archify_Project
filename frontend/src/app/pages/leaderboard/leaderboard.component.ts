import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LeaderboardService, LeaderboardEntry, LeaderboardFilters } from '../../services/leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);

  entries: LeaderboardEntry[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  activeScope: 'global' | 'semester' = 'global';
  activeTimeframe: 'all-time' | 'monthly' | 'weekly' = 'all-time';
  selectedSubjectId: string | null = null;

  // Level config for display
  levelConfig = {
    BOIS: { color: '#8B4513', image: '/assets/images/badges/bois.jpg', label: 'Bois' },
    BRONZE: { color: '#CD7F32', image: '/assets/images/badges/bronze.jpg', label: 'Bronze' },
    ARGENT: { color: '#C0C0C0', image: '/assets/images/badges/argent.jpg', label: 'Argent' },
    OR: { color: '#FFD700', image: '/assets/images/badges/or.jpg', label: 'Or' },
    PLATINUM: { color: '#E5E4E2', image: '/assets/images/badges/platine.jpg', label: 'Platinum' },
    LEGENDAIRE: { color: '#9C27B0', image: '/assets/images/badges/legendaire.jpg', label: 'Légendaire' },
    MONDIAL: { color: '#FF6B6B', image: '/assets/images/badges/mondial.jpg', label: 'Mondial' }
  };

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.loading = true;
    this.error = null;

    const filters: LeaderboardFilters = {
      scope: this.activeScope,
      timeframe: this.activeTimeframe,
      subjectId: this.selectedSubjectId || undefined
    };

    this.leaderboardService.getLeaderboard(filters).subscribe({
      next: (res) => {
        this.entries = res.leaderboard;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading leaderboard:', err);
        this.error = 'Erreur lors du chargement du classement';
        this.loading = false;
      }
    });
  }

  setScope(scope: 'global' | 'semester') {
    this.activeScope = scope;
    this.loadLeaderboard();
  }

  setTimeframe(timeframe: 'all-time' | 'monthly' | 'weekly') {
    this.activeTimeframe = timeframe;
    this.loadLeaderboard();
  }

  getRankIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  }

  getLevelInfo(level: string) {
    return this.levelConfig[level as keyof typeof this.levelConfig] || this.levelConfig.BOIS;
  }

  isCurrentUser(entry: LeaderboardEntry): boolean {
    // Check if this entry is the current user
    return entry.isCurrentUser || false;
  }
}
