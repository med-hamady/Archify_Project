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
  devicesInfo: any = null; // Informations de diagnostic sur les appareils
  levelInfoFromBackend: any = null; // Informations de niveau venant du backend

  // Niveau config - Seulement pour les couleurs et images (les seuils XP viennent du backend)
  levelConfig = {
    BOIS: { color: '#8B4513', image: '/images/badges/bois.png', label: 'Bois' },
    BRONZE: { color: '#CD7F32', image: '/images/badges/bronze.png', label: 'Bronze' },
    ARGENT: { color: '#C0C0C0', image: '/images/badges/argent.png', label: 'Argent' },
    OR: { color: '#FFD700', image: '/images/badges/or.png', label: 'Or' },
    PLATINUM: { color: '#E5E4E2', image: '/images/badges/platine.png', label: 'Platinum' },
    DIAMANT: { color: '#9C27B0', image: '/images/badges/diamant.png', label: 'Diamant' },
    MONDIAL: { color: '#FF6B6B', image: '/images/badges/mondial.png', label: 'Mondial' }
  };

  ngOnInit() {
    this.loadDashboard();
    this.loadDevicesInfo();
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
          bestStreak: res.profile.gamification.bestStreak || 0,
          legendQuestionsCompleted: res.profile.gamification.legendQuestionsCompleted,
          createdAt: res.profile.createdAt,
          profilePicture: res.profile.profilePicture
        };
        // Stocker les informations de niveau du backend (avec les vrais seuils XP)
        this.levelInfoFromBackend = res.profile.gamification.level;
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
    if (!this.profile || !this.levelInfoFromBackend) return null;

    const level = this.profile.level as keyof typeof this.levelConfig;

    // Utiliser les données du backend (source de vérité)
    const xpMin = this.levelInfoFromBackend.xpMin;
    const xpMax = this.levelInfoFromBackend.xpMax;
    const currentXP = this.profile.xpTotal;
    const progressPercent = this.levelInfoFromBackend.progressPercent;

    const xpInLevel = currentXP - xpMin;
    const xpNeeded = xpMax - xpMin;

    return {
      ...this.levelConfig[level],
      currentXP,
      xpInLevel,
      xpNeeded,
      progressPercent,
      nextLevel: this.levelInfoFromBackend.isMaxLevel ? 'MAX' : this.getNextLevel(level)
    };
  }

  getNextLevel(current: string): string {
    const levels = ['BOIS', 'BRONZE', 'ARGENT', 'OR', 'PLATINUM', 'DIAMANT', 'MONDIAL'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : 'MAX';
  }

  navigateToSubject(subjectId: string) {
    // Navigate to options page to show Quiz/Cours/Videos
    this.router.navigate(['/subject-options', subjectId]);
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
}
