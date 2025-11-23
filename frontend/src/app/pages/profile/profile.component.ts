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

  profile: UserProfile | null = null;
  badges: Badge[] = [];

  // Profile picture upload
  profilePictureLoading = false;
  profilePictureError: string | null = null;

  // Edit name form
  editNameForm: FormGroup;
  isEditingName = false;
  nameUpdateLoading = false;
  nameUpdateError: string | null = null;
  nameUpdateSuccess: string | null = null;
  activities: Activity[] = [];
  stats: DetailedStats | null = null;
  devicesInfo: any = null; // Informations de diagnostic sur les appareils

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
  }

  ngOnDestroy() {
    // Clean up subscriptions if needed
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
          createdAt: res.profile.createdAt,
          profilePicture: res.profile.profilePicture
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
        // Ajouter fallback pour category si non fourni par le backend
        this.badges = res.badges.map(badge => ({
          ...badge,
          category: badge.category || this.mapRequirementToCategory(badge.requirement)
        }));
      },
      error: (err) => console.error('Error loading badges:', err)
    });
  }

  // Fallback: mapper requirement vers category si le backend ne le fait pas
  private mapRequirementToCategory(requirement?: string): 'LEVEL' | 'ACHIEVEMENT' | 'SPECIAL' {
    if (!requirement) return 'SPECIAL';
    if (requirement.startsWith('REACH_')) return 'LEVEL';
    if (
      requirement.startsWith('STREAK_') ||
      requirement.startsWith('CHALLENGE_') ||
      requirement.startsWith('PERFECT_') ||
      requirement === 'FIRST_EXAM_PASSED' ||
      requirement === 'COMPLETE_100_LEGEND_QCM'
    ) {
      return 'ACHIEVEMENT';
    }
    return 'SPECIAL';
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

  // Profile picture methods
  onProfilePictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.profilePictureError = 'Veuillez sélectionner une image valide';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.profilePictureError = 'L\'image ne doit pas dépasser 5 Mo';
      return;
    }

    this.profilePictureLoading = true;
    this.profilePictureError = null;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      this.uploadProfilePicture(imageData);
    };
    reader.onerror = () => {
      this.profilePictureError = 'Erreur lors de la lecture du fichier';
      this.profilePictureLoading = false;
    };
    reader.readAsDataURL(file);
  }

  private uploadProfilePicture(imageData: string) {
    this.profileService.uploadProfilePicture(imageData).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile.profilePicture = response.profilePicture;
        }
        this.profilePictureLoading = false;
        this.profilePictureError = null;
      },
      error: (err) => {
        console.error('Error uploading profile picture:', err);
        this.profilePictureError = err.error?.message || 'Erreur lors de l\'upload de la photo';
        this.profilePictureLoading = false;
      }
    });
  }

  deleteProfilePicture() {
    if (!this.profile?.profilePicture) return;

    this.profilePictureLoading = true;
    this.profilePictureError = null;

    this.profileService.deleteProfilePicture().subscribe({
      next: () => {
        if (this.profile) {
          this.profile.profilePicture = undefined;
        }
        this.profilePictureLoading = false;
      },
      error: (err) => {
        console.error('Error deleting profile picture:', err);
        this.profilePictureError = err.error?.message || 'Erreur lors de la suppression';
        this.profilePictureLoading = false;
      }
    });
  }
}
