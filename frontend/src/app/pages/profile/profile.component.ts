import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  ProfileService,
  UserProfile,
  Badge,
  Activity,
  DetailedStats
} from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { TimeTrackingService } from '../../services/time-tracking.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  timeTrackingService = inject(TimeTrackingService);

  profile: UserProfile | null = null;
  badges: Badge[] = [];

  // Edit name form
  editNameForm: FormGroup;
  isEditingName = false;
  nameUpdateLoading = false;
  nameUpdateError: string | null = null;
  nameUpdateSuccess: string | null = null;
  activities: Activity[] = [];
  stats: DetailedStats | null = null;
  devicesInfo: any = null; // Informations de diagnostic sur les appareils

  // Time tracking
  elapsedSeconds = 0;
  totalStudyTimeSeconds = 0;
  private timeSubscription: any = null;
  private totalTimeSubscription: any = null;

  loading = true;
  error: string | null = null;
  activeTab: 'badges' | 'activity' | 'stats' = 'badges';

  levelConfig = {
    BOIS: { color: '#8B4513', image: '/images/badges/bois.png', label: 'Bois' },
    BRONZE: { color: '#CD7F32', image: '/images/badges/bronze.png', label: 'Bronze' },
    ARGENT: { color: '#C0C0C0', image: '/images/badges/argent.png', label: 'Argent' },
    OR: { color: '#FFD700', image: '/images/badges/or.png', label: 'Or' },
    PLATINUM: { color: '#E5E4E2', image: '/images/badges/platine.png', label: 'Platinum' },
    DIAMANT: { color: '#9C27B0', image: '/images/badges/diamant.png', label: 'Diamant' },
    MONDIAL: { color: '#FF6B6B', image: '/images/badges/mondial.png', label: 'Mondial' }
  };

  levelThresholds = {
    BOIS: { min: 0, max: 800 },
    BRONZE: { min: 801, max: 1600 },
    ARGENT: { min: 1601, max: 2800 },
    OR: { min: 2801, max: 4000 },
    PLATINUM: { min: 4001, max: 5500 },
    DIAMANT: { min: 5501, max: 9000 },
    MONDIAL: { min: 9001, max: 999999 }
  };

  constructor() {
    this.editNameForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  ngOnInit() {
    this.loadProfile();
    this.loadDevicesInfo();

    // Subscribe to time tracking updates
    this.timeSubscription = this.timeTrackingService.getElapsedSeconds().subscribe(seconds => {
      this.elapsedSeconds = seconds;
    });

    this.totalTimeSubscription = this.timeTrackingService.getTotalStudyTime().subscribe(seconds => {
      this.totalStudyTimeSeconds = seconds;
    });

    // Start time tracking automatically
    this.timeTrackingService.startTracking();
  }

  ngOnDestroy() {
    // Clean up subscriptions
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
    if (this.totalTimeSubscription) {
      this.totalTimeSubscription.unsubscribe();
    }
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
          bestStreak: res.profile.gamification.bestStreak || 0,
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

  loadDevicesInfo() {
    // Charger les informations de diagnostic sur les appareils
    this.authService.getDevicesDebugInfo().subscribe({
      next: (info) => {
        this.devicesInfo = info;
        console.log('🔍 [DIAGNOSTIC] Informations sur les appareils:', info);
        console.log('📱 Appareils autorisés:', info.authorizedDevices);
        console.log('📊 Nombre d\'appareils:', info.authorizedDevicesCount);
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des infos appareils:', err);
      }
    });
  }

  // Edit name methods
  startEditingName() {
    if (this.profile) {
      this.editNameForm.patchValue({ name: this.profile.name });
      this.isEditingName = true;
      this.nameUpdateError = null;
      this.nameUpdateSuccess = null;
    }
  }

  cancelEditingName() {
    this.isEditingName = false;
    this.editNameForm.reset();
    this.nameUpdateError = null;
    this.nameUpdateSuccess = null;
  }

  submitNameUpdate() {
    if (this.editNameForm.invalid) {
      return;
    }

    this.nameUpdateLoading = true;
    this.nameUpdateError = null;
    this.nameUpdateSuccess = null;

    const newName = this.editNameForm.value.name.trim();

    this.profileService.updateName(newName).subscribe({
      next: (response) => {
        console.log('✅ Nom mis à jour:', response);
        this.nameUpdateSuccess = response.message;
        this.nameUpdateLoading = false;

        // Mettre à jour le profil local
        if (this.profile) {
          this.profile.name = response.user.name;
        }

        // Fermer le formulaire après 2 secondes
        setTimeout(() => {
          this.isEditingName = false;
          this.nameUpdateSuccess = null;
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la mise à jour du nom:', err);
        this.nameUpdateError = err.error?.error?.message || 'Erreur lors de la mise à jour du nom';
        this.nameUpdateLoading = false;
      }
    });
  }

  // Time tracking methods
  formatTime(seconds: number): string {
    return this.timeTrackingService.formatTime(seconds);
  }

  getProgressToNextHour(): number {
    const seconds = this.elapsedSeconds;
    const remainingInHour = seconds % 3600;
    return (remainingInHour / 3600) * 100;
  }

  getNextXpReward(): number {
    const hours = Math.floor(this.elapsedSeconds / 3600);
    return (hours + 1) * 60;
  }

  getTimeUntilNextReward(): string {
    const secondsInCurrentHour = this.elapsedSeconds % 3600;
    const secondsUntilNextHour = 3600 - secondsInCurrentHour;
    return this.formatTime(secondsUntilNextHour);
  }

  getTotalHours(): number {
    return Math.floor(this.totalStudyTimeSeconds / 3600);
  }
}
