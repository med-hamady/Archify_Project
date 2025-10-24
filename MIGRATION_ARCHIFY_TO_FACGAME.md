# Plan de Migration : Archify → FacGame

## Vue d'ensemble

Transformation complète d'Archify (plateforme vidéos/PDF) en FacGame (plateforme gamifiée de quiz médicaux).

**Date:** 23 octobre 2025
**Objectif:** Conserver l'architecture robuste d'Archify tout en adaptant la logique métier pour le système de gamification FacGame.

---

## 1. Analyse comparative

### Ce qui reste identique ✅
- Système d'authentification (JWT, cookies, tokens)
- Gestion des rôles (STUDENT, ADMIN, SUPERADMIN)
- Système de paiement manuel (Bankily, Masrivi, Sedad)
- Upload de screenshots Cloudinary
- Gestion des commentaires
- Architecture modulaire backend
- Base PostgreSQL + Prisma ORM
- Middleware de sécurité (helmet, CORS, rate limiting)

### Ce qui change 🔄

| Archify | FacGame |
|---------|---------|
| Cours avec vidéos/PDF | Matières avec quiz interactifs |
| Lesson types: VIDEO/PDF/EXAM | Question types: FACILE/MOYEN/DIFFICILE/LEGENDE |
| Abonnements: VIDEOS_ONLY, DOCUMENTS_ONLY | Abonnements: QUIZ_ONLY, DOCUMENTS_ONLY |
| Progression simple (VIEWED/IN_PROGRESS) | Système XP avec 7 niveaux (Bois → Mondial) |
| Pas de gamification | Système complet de récompenses, badges, classements |
| - | Mode Challenge (déblocage 50% ou niveau Or) |
| - | Mode Examen (déblocage 80%) |
| - | Algorithme XP avec multiplicateurs |

---

## 2. Nouveau schéma de base de données

### Modèles à modifier

#### User (extension)
```prisma
model User {
  // ... champs existants ...

  // Nouveaux champs FacGame
  xpTotal          Int       @default(0)
  level            GameLevel @default(BOIS)
  consecutiveGoodAnswers Int @default(0)
  legendQuestionsCompleted Int @default(0)
  lastActivityAt   DateTime?

  // Relations
  quizAttempts     QuizAttempt[]
  userBadges       UserBadge[]
  challengeResults ChallengeResult[]
  examResults      ExamResult[]
}

enum GameLevel {
  BOIS          // 0-800 XP
  BRONZE        // 801-1600 XP
  ARGENT        // 1601-2800 XP
  OR            // 2801-4000 XP
  PLATINUM      // 4001-5500 XP
  LEGENDAIRE    // 5501-9000 XP
  MONDIAL       // 9001+ XP
}
```

#### Course → Subject (renommer)
```prisma
model Subject {
  id          String    @id @default(cuid())
  title       String    // Anatomie, Histologie, Physiologie
  description String?
  semester    String
  tags        String[]
  totalQCM    Int       @default(600)
  createdAt   DateTime  @default(now())

  chapters    Chapter[]
  views       Int       @default(0)
}
```

#### Lesson → Chapter (renommer et adapter)
```prisma
model Chapter {
  id           String    @id @default(cuid())
  subject      Subject   @relation(fields: [subjectId], references: [id])
  subjectId    String
  title        String
  description  String?
  orderIndex   Int       @default(0)

  // Support PDF
  pdfUrl       String?

  // Métadonnées
  createdAt    DateTime  @default(now())
  views        Int       @default(0)

  // Relations
  questions    Question[]
  comments     Comment[]
  progresses   ChapterProgress[]

  @@index([subjectId, orderIndex])
}
```

#### Question (nouveau modèle central)
```prisma
model Question {
  id           String         @id @default(cuid())
  chapter      Chapter        @relation(fields: [chapterId], references: [id])
  chapterId    String

  questionText String
  options      String[]       // Array de 4-5 options
  correctAnswer Int           // Index de la bonne réponse (0-4)
  explanation  String?        // Explication de la réponse

  difficulty   QuestionDifficulty @default(FACILE)
  orderIndex   Int           @default(0)

  createdAt    DateTime      @default(now())

  // Relations
  attempts     QuizAttempt[]

  @@index([chapterId, orderIndex])
}

enum QuestionDifficulty {
  FACILE      // +5 XP base
  MOYEN       // +10 XP base
  DIFFICILE   // +20 XP base
  LEGENDE     // +30 XP base (spécial)
}
```

#### QuizAttempt (tentatives de réponse)
```prisma
model QuizAttempt {
  id          String    @id @default(cuid())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  question    Question  @relation(fields: [questionId], references: [id])
  questionId  String

  attemptNumber Int     // 1ère, 2ème, 3ème tentative...
  selectedAnswer Int
  isCorrect   Boolean

  xpEarned    Int       // XP calculé pour cette tentative

  createdAt   DateTime  @default(now())

  @@index([userId, questionId])
}
```

#### ChapterProgress (progression par chapitre)
```prisma
model ChapterProgress {
  id              String   @id @default(cuid())
  user            User     @relation(fields: [userId], references: [id])
  userId          String
  chapter         Chapter  @relation(fields: [chapterId], references: [id])
  chapterId       String

  questionsAnswered Int    @default(0)
  questionsCorrect  Int    @default(0)
  progressPercent   Float  @default(0)

  challengeUnlocked Boolean @default(false)
  examUnlocked      Boolean @default(false)

  updatedAt       DateTime @updatedAt

  @@unique([userId, chapterId])
}
```

#### SubjectProgress (progression globale par matière)
```prisma
model SubjectProgress {
  id              String   @id @default(cuid())
  user            User     @relation(fields: [userId], references: [id])
  userId          String
  subject         Subject  @relation(fields: [subjectId], references: [id])
  subjectId       String

  totalQuestionsAnswered Int @default(0)
  progressPercent        Float @default(0)

  challengeUnlockedGlobal Boolean @default(false) // Déblocage au niveau Or

  updatedAt       DateTime @updatedAt

  @@unique([userId, subjectId])
}
```

#### ChallengeResult (résultats Mode Challenge)
```prisma
model ChallengeResult {
  id         String   @id @default(cuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  chapter    Chapter  @relation(fields: [chapterId], references: [id])
  chapterId  String

  questionsTotal   Int
  questionsCorrect Int
  timeSpentSec     Int
  score            Float      // Pourcentage

  xpBonus      Int            // Bonus si 100%

  completedAt  DateTime       @default(now())
}
```

#### ExamResult (résultats Mode Examen)
```prisma
model ExamResult {
  id         String   @id @default(cuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  subject    Subject  @relation(fields: [subjectId], references: [id])
  subjectId  String

  questionsTotal   Int
  questionsCorrect Int
  timeSpentSec     Int
  score            Float      // Note sur 20
  passed           Boolean    // Seuil 10/20

  completedAt      DateTime   @default(now())
}
```

#### Badge (système de badges)
```prisma
model Badge {
  id          String   @id @default(cuid())
  name        String   @unique
  description String
  iconUrl     String?

  requirement BadgeRequirement

  userBadges  UserBadge[]
}

enum BadgeRequirement {
  REACH_BRONZE
  REACH_ARGENT
  REACH_OR
  REACH_PLATINUM
  REACH_LEGENDAIRE
  REACH_MONDIAL
  COMPLETE_100_LEGEND_QCM
  STREAK_5_CORRECT
  STREAK_10_CORRECT
  CHALLENGE_100_PERCENT
}

model UserBadge {
  id       String   @id @default(cuid())
  user     User     @relation(fields: [userId], references: [id])
  userId   String
  badge    Badge    @relation(fields: [badgeId], references: [id])
  badgeId  String

  earnedAt DateTime @default(now())

  @@unique([userId, badgeId])
}
```

#### Abonnements (adapter)
```prisma
enum SubscriptionType {
  QUIZ_ONLY         // Ancien VIDEOS_ONLY
  DOCUMENTS_ONLY    // Reste identique
  FULL_ACCESS       // Reste identique
}
```

---

## 3. Algorithme de calcul XP

### Implémentation TypeScript

```typescript
/**
 * Calcule l'XP gagnée pour une réponse à un QCM
 *
 * @param difficulty - Difficulté du QCM
 * @param attemptNumber - Numéro de la tentative (1, 2, 3, 4+)
 * @param positionInChapter - Position du QCM dans le chapitre (0-indexed)
 * @param totalQCMInChapter - Nombre total de QCM dans le chapitre
 * @param hasBonus - Si l'utilisateur a un bonus actif (+20%)
 * @returns XP finale calculée
 */
function calculateXP(
  difficulty: QuestionDifficulty,
  attemptNumber: number,
  positionInChapter: number,
  totalQCMInChapter: number,
  hasBonus: boolean = false
): number {
  // 1. XP de base selon difficulté
  const baseXP = {
    FACILE: 5,
    MOYEN: 10,
    DIFFICILE: 20,
    LEGENDE: 30
  }[difficulty];

  // 2. Multiplicateur selon tentative
  let multiplier = 0;
  if (attemptNumber === 1) multiplier = 3;
  else if (attemptNumber === 2) multiplier = 1.5;
  else if (attemptNumber === 3) multiplier = 1;
  else return 0; // 4ème tentative ou plus = 0 XP

  // 3. Facteur de progression (augmente avec l'avancement)
  const progressionFactor = 1 + (0.5 * positionInChapter / totalQCMInChapter);

  // 4. Calcul de base
  let finalXP = baseXP * multiplier * progressionFactor;

  // 5. Bonus si actif
  if (hasBonus) {
    finalXP *= 1.2; // +20%
  }

  // 6. Arrondir
  return Math.round(finalXP);
}
```

### Exemple de calcul

```
QCM Difficile (20 XP base)
1ère tentative (×3)
Position 150/600 dans le chapitre
Bonus actif (+20%)

Calcul:
- progressionFactor = 1 + (0.5 × 150/600) = 1.125
- XP = 20 × 3 × 1.125 = 67.5
- Avec bonus: 67.5 × 1.2 = 81 XP

Résultat: 81 XP gagnés
```

---

## 4. Système de niveaux et seuils

```typescript
const LEVEL_THRESHOLDS = {
  BOIS: { min: 0, max: 800 },
  BRONZE: { min: 801, max: 1600 },
  ARGENT: { min: 1601, max: 2800 },
  OR: { min: 2801, max: 4000 },
  PLATINUM: { min: 4001, max: 5500 },
  LEGENDAIRE: { min: 5501, max: 9000 },
  MONDIAL: { min: 9001, max: Infinity }
};

function getLevelFromXP(xp: number): GameLevel {
  if (xp <= 800) return 'BOIS';
  if (xp <= 1600) return 'BRONZE';
  if (xp <= 2800) return 'ARGENT';
  if (xp <= 4000) return 'OR';
  if (xp <= 5500) return 'PLATINUM';
  if (xp <= 9000) return 'LEGENDAIRE';
  return 'MONDIAL';
}

function checkLevelUp(oldXP: number, newXP: number): {
  leveledUp: boolean;
  newLevel?: GameLevel;
  rewards?: string[];
} {
  const oldLevel = getLevelFromXP(oldXP);
  const newLevel = getLevelFromXP(newXP);

  if (oldLevel !== newLevel) {
    return {
      leveledUp: true,
      newLevel,
      rewards: getLevelRewards(newLevel)
    };
  }

  return { leveledUp: false };
}

function getLevelRewards(level: GameLevel): string[] {
  const rewards = {
    BRONZE: ['+2% XP permanent', 'Badge Bronze'],
    ARGENT: ['Mode Examen débloqué', 'Badge Argent'],
    OR: ['Mode Challenge global débloqué', '+3% XP permanent', 'Badge Or'],
    PLATINUM: ['+5% XP sur QCM difficiles', 'Badge Platinum'],
    LEGENDAIRE: ['Mode révision libre', 'Badge Légendaire'],
    MONDIAL: ['Classement international', 'Titre Excellence', 'Badge Mondial']
  };

  return rewards[level] || [];
}
```

---

## 5. Logique de déblocage des modes

### Mode Challenge

```typescript
/**
 * Vérifie si le Mode Challenge est débloqué pour un chapitre
 */
async function isChallengeUnlocked(
  userId: string,
  chapterId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Condition 1: Niveau Or atteint = Challenge débloqué partout
  if (user.level === 'OR' ||
      user.level === 'PLATINUM' ||
      user.level === 'LEGENDAIRE' ||
      user.level === 'MONDIAL') {
    return true;
  }

  // Condition 2: 50% de progression dans le chapitre
  const progress = await prisma.chapterProgress.findUnique({
    where: {
      userId_chapterId: { userId, chapterId }
    }
  });

  return progress && progress.progressPercent >= 50;
}
```

### Mode Examen

```typescript
/**
 * Vérifie si le Mode Examen est débloqué pour une matière
 */
async function isExamUnlocked(
  userId: string,
  subjectId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Condition 1: Niveau Argent minimum requis
  const levelOrder = ['BOIS', 'BRONZE', 'ARGENT', 'OR', 'PLATINUM', 'LEGENDAIRE', 'MONDIAL'];
  const userLevelIndex = levelOrder.indexOf(user.level);

  if (userLevelIndex < 2) { // Moins que Argent
    return false;
  }

  // Condition 2: 80% de progression dans la matière
  const progress = await prisma.subjectProgress.findUnique({
    where: {
      userId_subjectId: { userId, subjectId }
    }
  });

  return progress && progress.progressPercent >= 80;
}
```

---

## 6. Système de récompenses

### Bonus consécutifs

```typescript
async function checkConsecutiveBonus(userId: string): Promise<{
  bonusXP: number;
  message?: string;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user.consecutiveGoodAnswers === 5) {
    // Activer bonus +20% XP temporaire (1h)
    return {
      bonusXP: 0,
      message: 'Bonus +20% XP activé pour 1 heure!'
    };
  }

  if (user.consecutiveGoodAnswers === 10) {
    return {
      bonusXP: 50,
      message: 'Bonus +50 XP pour 10 réponses consécutives!'
    };
  }

  return { bonusXP: 0 };
}
```

### Attribution de badges

```typescript
async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userBadges: true }
  });

  const newBadges: Badge[] = [];

  // Badge niveau
  const levelBadge = await prisma.badge.findUnique({
    where: { name: `Niveau ${user.level}` }
  });

  const hasLevelBadge = user.userBadges.some(ub => ub.badgeId === levelBadge?.id);

  if (levelBadge && !hasLevelBadge) {
    await prisma.userBadge.create({
      data: { userId, badgeId: levelBadge.id }
    });
    newBadges.push(levelBadge);
  }

  // Badge Légende (100 QCM légendes)
  if (user.legendQuestionsCompleted >= 100) {
    const legendBadge = await prisma.badge.findUnique({
      where: { name: 'Maître des Légendes' }
    });

    const hasLegendBadge = user.userBadges.some(ub => ub.badgeId === legendBadge?.id);

    if (legendBadge && !hasLegendBadge) {
      await prisma.userBadge.create({
        data: { userId, badgeId: legendBadge.id }
      });
      newBadges.push(legendBadge);
    }
  }

  return newBadges;
}
```

---

## 7. APIs à créer/modifier

### Routes Quiz

```
POST   /api/quiz/answer
  - Enregistrer une réponse
  - Calculer XP
  - Vérifier level up
  - Mettre à jour progression
  - Retourner: { correct, xpEarned, totalXP, levelUp?, newBadges? }

GET    /api/quiz/chapter/:chapterId
  - Récupérer questions du chapitre (ordre aléatoire ou séquentiel)
  - Filtrer selon progression utilisateur
  - Inclure métadonnées (total, complétées, restantes)

GET    /api/quiz/next/:chapterId
  - Prochaine question à répondre
  - Exclure celles déjà réussies en 1-3 tentatives

GET    /api/quiz/progress/:chapterId
  - Progression détaillée par chapitre
  - Statistiques (correct/incorrect, moyenne tentatives)
```

### Routes Challenge

```
GET    /api/challenge/:chapterId/check
  - Vérifier si débloqué

POST   /api/challenge/:chapterId/start
  - Générer session de challenge
  - Sélectionner N questions aléatoires déjà vues
  - Timer

POST   /api/challenge/:chapterId/submit
  - Soumettre résultats
  - Calculer score
  - Attribuer bonus XP si 100%
```

### Routes Examen

```
GET    /api/exam/:subjectId/check
  - Vérifier si débloqué

POST   /api/exam/:subjectId/start
  - Générer examen (40-50 questions)
  - Mix difficultés
  - Timer strict

POST   /api/exam/:subjectId/submit
  - Soumettre réponses
  - Calculer note/20
  - Générer correction détaillée
```

### Routes Utilisateur (extension)

```
GET    /api/users/me/profile
  - Infos utilisateur + XP + niveau + badges

GET    /api/users/me/stats
  - Statistiques détaillées
  - Progression par matière
  - Graphiques d'activité

GET    /api/users/leaderboard
  - Classement global (top 100)
  - Filtres: par semestre, par matière
  - Pagination
```

---

## 8. Modifications Frontend

### Pages à créer

1. **Dashboard Étudiant**
   - XP actuelle + barre de progression vers niveau suivant
   - Badges obtenus
   - Progression par matière (cercles %)
   - Activité récente

2. **Page Matière**
   - Liste des chapitres
   - Progression par chapitre
   - Boutons "Mode Challenge" / "Mode Examen" (avec cadenas si bloqué)

3. **Page Quiz**
   - Question + options
   - Timer optionnel
   - Feedback immédiat
   - XP gagnée en temps réel
   - Animation level up

4. **Page Challenge**
   - Timer compte à rebours
   - Questions rapides
   - Score live
   - Résultats + correction

5. **Page Examen**
   - Interface formelle
   - Pas de feedback pendant l'examen
   - Soumission finale
   - Page de résultats avec note/20

6. **Classement (Leaderboard)**
   - Top utilisateurs
   - Position de l'utilisateur
   - Filtres (semestre, matière)

7. **Profil Utilisateur**
   - Infos personnelles
   - Statistiques complètes
   - Collection de badges
   - Historique de progression

### Composants à créer

- `XPBar` : Barre d'XP avec animations
- `LevelBadge` : Badge de niveau (Bois, Bronze, etc.)
- `QuizCard` : Carte de question interactive
- `ProgressCircle` : Cercle de progression par matière
- `BadgeDisplay` : Affichage de badge avec tooltip
- `LeaderboardRow` : Ligne du classement
- `ChallengeLock` : Indicateur de déblocage avec explication

---

## 9. Ordre d'implémentation (étapes)

### Phase 1: Base de données
1. ✅ Créer le nouveau schéma Prisma
2. Générer migration
3. Tester sur base de dev
4. Seed avec données de test (3 matières, quelques chapitres, 50 questions)

### Phase 2: Backend Core
1. Implémenter algorithme XP
2. Créer service de gestion de progression
3. Créer routes Quiz de base (answer, next)
4. Tester calcul XP et level up

### Phase 3: Backend Avancé
1. Implémenter logique Challenge
2. Implémenter logique Examen
3. Créer système de badges
4. Créer API classement

### Phase 4: Frontend Base
1. Adapter authentification
2. Créer Dashboard
3. Créer page Matière
4. Créer interface Quiz

### Phase 5: Frontend Avancé
1. Créer interface Challenge
2. Créer interface Examen
3. Créer page Classement
4. Créer page Profil

### Phase 6: Admin
1. Adapter dashboard admin
2. Créer interface de gestion des questions
3. Import/export de questions
4. Analytics spécifiques FacGame

### Phase 7: Tests & Polish
1. Tests unitaires (XP, progression)
2. Tests d'intégration (flows complets)
3. Tests de charge
4. Optimisations performance
5. Animations et UX

---

## 10. Points d'attention

### Sécurité
- Validation côté serveur de toutes les réponses
- Empêcher triche (timestamps, tentatives)
- Rate limiting sur routes de quiz
- Crypter les bonnes réponses en transit

### Performance
- Indexation DB optimale (userId, chapterId)
- Cache des classements (Redis?)
- Pagination des questions
- Lazy loading des chapitres

### UX
- Animations de level up engageantes
- Feedback immédiat et positif
- Progression visible en permanence
- Notifications de badges
- Son optionnel (bonne/mauvaise réponse)

### Data
- Backup régulier
- Migration des données existantes (si applicable)
- Analytics détaillées pour amélioration continue

---

## 11. Checklist de migration

- [ ] Créer nouveau schéma Prisma
- [ ] Générer et tester migrations
- [ ] Implémenter algorithme XP
- [ ] Créer services de progression
- [ ] Développer APIs Quiz
- [ ] Développer APIs Challenge
- [ ] Développer APIs Examen
- [ ] Créer système de badges
- [ ] Adapter système d'abonnements
- [ ] Créer Dashboard frontend
- [ ] Créer interfaces Quiz
- [ ] Créer interfaces Challenge/Examen
- [ ] Créer page Classement
- [ ] Adapter Admin panel
- [ ] Tests complets
- [ ] Documentation API
- [ ] Guide utilisateur
- [ ] Déploiement

---

## Conclusion

Cette migration transforme Archify en une plateforme gamifiée complète tout en conservant son architecture solide. Les principaux défis sont:

1. **Complexité de l'algorithme XP** (mais bien spécifié)
2. **Système de déblocage** (conditions multiples)
3. **UX engageante** (animations, feedback)
4. **Performance** (beaucoup de calculs et mises à jour)

La structure modulaire d'Archify facilite grandement cette migration. Chaque module peut être adapté indépendamment.

**Durée estimée:** 3-4 semaines de développement full-time
