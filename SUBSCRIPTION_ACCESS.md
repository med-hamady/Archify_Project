# Système de Contrôle d'Accès par Abonnement

## Vue d'ensemble

Le système de contrôle d'accès par abonnement permet de restreindre l'accès aux vidéos et documents en fonction du type d'abonnement de l'utilisateur.

## Types d'Abonnement

Le système supporte 3 types d'abonnements (définis dans `backend/prisma/schema.prisma`):

1. **VIDEOS_ONLY** - Accès uniquement aux vidéos
2. **DOCUMENTS_ONLY** - Accès uniquement aux documents (PDF, examens)
3. **FULL_ACCESS** - Accès complet (vidéos + documents)

## Architecture

### Backend

#### 1. Middleware de Vérification d'Accès
Fichier: `backend/src/middleware/subscription-access.ts`

**Fonctions principales:**
- `hasActiveSubscription(userId)` - Vérifie si l'utilisateur a un abonnement actif
- `canAccessVideo(userId, lessonId)` - Vérifie l'accès aux vidéos
- `canAccessDocument(userId, lessonId)` - Vérifie l'accès aux documents
- `checkLessonAccess` - Middleware pour protéger les routes de leçons
- `checkVideoFileAccess` - Middleware pour protéger les fichiers vidéo

**Logique de vérification:**
```typescript
// Pour les vidéos
if (subscriptionType === 'FULL_ACCESS' || subscriptionType === 'VIDEOS_ONLY') {
  return true; // Accès autorisé
}

// Pour les documents
if (subscriptionType === 'FULL_ACCESS' || subscriptionType === 'DOCUMENTS_ONLY') {
  return true; // Accès autorisé
}
```

#### 2. Protection des Routes
Fichier: `backend/src/index.ts`

Les routes vidéo sont protégées avec deux middlewares:
```typescript
app.get('/uploads/videos/:filename', optionalAuth, checkVideoFileAccess, (req, res) => {
  // Servir la vidéo seulement si l'utilisateur a accès
});
```

**Middleware `optionalAuth`:**
- Extrait le token JWT des cookies ou headers
- N'empêche PAS l'accès si pas de token (contrairement à `requireAuth`)
- Définit `req.userId` et `req.userRole` si le token est valide

**Middleware `checkVideoFileAccess`:**
- Vérifie si la vidéo nécessite un abonnement (`lesson.isPremium` ou `lesson.requiresVideoSubscription`)
- Si oui, vérifie que l'utilisateur a un abonnement actif du bon type
- Retourne 403 si l'accès n'est pas autorisé

#### 3. Champs de Contrôle dans la Base de Données

**Table Lesson:**
```prisma
model Lesson {
  isPremium                    Boolean @default(false)
  requiresVideoSubscription    Boolean @default(false)
  requiresDocumentSubscription Boolean @default(false)
  // ...
}
```

**Table Course:**
```prisma
model Course {
  isPremium Boolean @default(false)
  // ...
}
```

### Frontend

#### 1. Détection de l'Erreur d'Abonnement
Fichier: `frontend/src/app/pages/lesson/lesson.component.ts`

Ligne 634-659: Gestion de l'erreur 403 avec code `SUBSCRIPTION_REQUIRED`
```typescript
error: (error) => {
  if (error.status === 403 && error.error?.code === 'SUBSCRIPTION_REQUIRED') {
    this.subscriptionRequired.set(true);
    // Afficher le message d'abonnement requis
  }
}
```

#### 2. Affichage du Message
Lignes 150-171: Template qui affiche un message quand l'abonnement est requis
```html
<div *ngIf="subscriptionRequired() && !isLoading()">
  <h2>Contenu Premium</h2>
  <p>Cette leçon nécessite un abonnement actif pour y accéder.</p>
  <button (click)="router.navigate(['/subscription'])">
    Voir les abonnements
  </button>
</div>
```

## Flux de Fonctionnement

### Scénario 1: Utilisateur sans Abonnement

1. Utilisateur clique sur une leçon premium
2. Frontend demande `/api/lessons/:id`
3. Backend vérifie l'abonnement via `checkLessonAccess`
4. Backend retourne 403 avec `SUBSCRIPTION_REQUIRED`
5. Frontend affiche le message "Contenu Premium"
6. Utilisateur est redirigé vers `/subscription`

### Scénario 2: Utilisateur avec Abonnement VIDEOS_ONLY

1. Utilisateur accède à une vidéo premium
2. Middleware vérifie: `canAccessVideo(userId)` → true
3. Vidéo est servie normalement
4. Utilisateur accède à un PDF premium
5. Middleware vérifie: `canAccessDocument(userId)` → false
6. Backend retourne 403
7. Frontend affiche le message d'abonnement requis

### Scénario 3: Utilisateur avec FULL_ACCESS

1. Utilisateur accède à n'importe quel contenu premium
2. Middleware vérifie: `hasActiveSubscription()` → FULL_ACCESS
3. Tous les contenus sont accessibles

## Exceptions

### Administrateurs
Les admins (rôle `ADMIN` ou `SUPERADMIN`) ont toujours accès à tout le contenu, indépendamment de leur abonnement.

```typescript
if (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN') {
  return next(); // Accès autorisé
}
```

### Contenu Gratuit
Les leçons qui ne sont pas premium (`isPremium: false`) sont accessibles à tous:

```typescript
if (!lesson.isPremium && !lesson.requiresVideoSubscription) {
  return next(); // Pas besoin d'abonnement
}
```

## API Routes Subscription

### Vérifier l'Abonnement Actuel
```
GET /api/subscriptions/my-subscription
```

Retourne:
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "id": "...",
    "status": "ACTIVE",
    "startAt": "2024-01-01T00:00:00Z",
    "endAt": "2025-01-01T00:00:00Z",
    "plan": {
      "type": "FULL_ACCESS",
      "name": "Abonnement Complet",
      "priceCents": 10000
    }
  }
}
```

### Vérifier l'Accès à une Leçon
```
GET /api/subscriptions/check-access/:lessonId
```

Retourne:
```json
{
  "hasAccess": true,
  "reason": "active_subscription" | "free_content" | "subscription_required"
}
```

## Configuration des Leçons

### Marquer une Leçon comme Premium

Pour activer la protection par abonnement sur une leçon, utilisez l'interface admin ou mettez à jour directement dans la base de données:

```typescript
// Via Prisma
await prisma.lesson.update({
  where: { id: lessonId },
  data: {
    isPremium: true,
    requiresVideoSubscription: true  // Pour vidéos uniquement
    // OU
    requiresDocumentSubscription: true  // Pour documents uniquement
  }
});
```

### Marquer un Cours Complet comme Premium

```typescript
await prisma.course.update({
  where: { id: courseId },
  data: {
    isPremium: true
  }
});
```

## Tests

### Test Manuel

1. **Sans abonnement:**
   - Créer un utilisateur sans abonnement
   - Accéder à une leçon premium
   - Vérifier que le message "Contenu Premium" s'affiche

2. **Avec VIDEOS_ONLY:**
   - Créer un abonnement VIDEOS_ONLY
   - Accéder à une vidéo premium → Devrait fonctionner
   - Accéder à un PDF premium → Devrait afficher le message d'abonnement

3. **Avec FULL_ACCESS:**
   - Créer un abonnement FULL_ACCESS
   - Accéder à tous les contenus → Tout devrait fonctionner

### Créer un Abonnement de Test

Via l'API:
```bash
POST /api/subscriptions/subscribe
{
  "planId": "plan_id_here"
}
```

Ou directement en base de données:
```sql
INSERT INTO "Subscription" (id, "userId", "planId", status, "startAt", "endAt", "createdAt")
VALUES (
  'sub_test_123',
  'user_id_here',
  'plan_id_here',
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW()
);
```

## Sécurité

### Protection Multi-Couches

1. **Backend:** Middleware vérifie l'accès avant de servir les fichiers
2. **Frontend:** Affiche le message approprié et empêche le chargement
3. **Base de données:** Contraintes et relations assurent l'intégrité

### Points d'Accès Protégés

- ✅ Routes API `/api/lessons/:id`
- ✅ Fichiers vidéo `/uploads/videos/:filename`
- ✅ Fichiers PDF (via les routes lessons)
- ✅ Examens (via les routes lessons)

## Dépannage

### Problème: Vidéo accessible sans abonnement

**Solution:**
1. Vérifier que `lesson.isPremium = true` ou `lesson.requiresVideoSubscription = true`
2. Vérifier que le middleware `checkVideoFileAccess` est bien appliqué
3. Vérifier les logs backend pour voir si la vérification est effectuée

### Problème: Utilisateur avec abonnement ne peut pas accéder

**Solution:**
1. Vérifier que l'abonnement est ACTIVE: `subscription.status = 'ACTIVE'`
2. Vérifier que la date de fin n'est pas expirée: `subscription.endAt > NOW()`
3. Vérifier que le type d'abonnement correspond au contenu:
   - Vidéo → Nécessite `VIDEOS_ONLY` ou `FULL_ACCESS`
   - Document → Nécessite `DOCUMENTS_ONLY` ou `FULL_ACCESS`

### Problème: Message d'erreur générique au lieu du message d'abonnement

**Solution:**
1. Vérifier que le backend retourne bien le code `SUBSCRIPTION_REQUIRED` en 403
2. Vérifier dans le frontend que la gestion d'erreur capture bien ce code
3. Vérifier les logs de la console pour voir l'erreur exacte

## Prochaines Étapes

- [ ] Ajouter des tests automatisés pour le middleware
- [ ] Implémenter la vérification d'expiration d'abonnement en temps réel
- [ ] Ajouter des notifications quand l'abonnement expire bientôt
- [ ] Créer un système de grace period après expiration
- [ ] Ajouter des analytics pour tracker les tentatives d'accès refusées
