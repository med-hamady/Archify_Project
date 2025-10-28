import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProfileService, UserProfile, SubjectProgress } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-facgame-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './facgame-dashboard.component.html',
  styleUrls: ['./facgame-dashboard.component.css']
})
export class FacgameDashboardComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private profileService = inject(ProfileService);
  private router = inject(Router);
  private authService = inject(AuthService);

  profile: UserProfile | null = null;
  progress: SubjectProgress[] = [];
  loading = true;
  error: string | null = null;
  uploadingPicture = false;

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
          createdAt: res.profile.createdAt,
          profilePicture: res.profile.profilePicture
        };
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
      next: (res: any) => {
        // Adapter la structure backend à l'interface frontend
        this.progress = res.progress.map((p: any) => ({
          subjectId: p.subjectId,
          subjectName: p.subjectTitle,
          progressPercent: p.progressPercent,
          totalQCM: p.totalQCM,
          answeredQCM: p.questionsAnswered,
          chaptersCompleted: p.chaptersCompleted,
          chaptersTotal: p.chaptersTotal
        }));
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

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    // Convert to base64 and upload
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      this.uploadProfilePicture(base64Data);
    };
    reader.readAsDataURL(file);
  }

  uploadProfilePicture(imageData: string) {
    this.uploadingPicture = true;

    this.profileService.uploadProfilePicture(imageData).subscribe({
      next: (res) => {
        if (this.profile) {
          this.profile.profilePicture = res.profilePicture;
        }
        this.uploadingPicture = false;
        console.log('Profile picture uploaded successfully');
      },
      error: (err) => {
        console.error('Error uploading profile picture:', err);
        alert('Erreur lors de l\'upload de la photo de profil');
        this.uploadingPicture = false;
      }
    });
  }
}
