# Configuration: Toutes les Vidéos Nécessitent un Abonnement

## Résumé

Le système a été configuré pour que **TOUTES les vidéos** nécessitent un abonnement actif pour être visionnées. Les utilisateurs sans abonnement seront automatiquement redirigés vers la page d'abonnement lorsqu'ils essaient d'accéder à une vidéo.

## Changements Implémentés

### 1. Middleware Backend - [backend/src/middleware/subscription-access.ts](backend/src/middleware/subscription-access.ts)

#### `checkVideoFileAccess` (Lignes 149-194)
- **Avant**: Vérifiait uniquement si `lesson.isPremium` ou `lesson.requiresVideoSubscription` était true
- **Après**: **TOUTES les vidéos** nécessitent maintenant un abonnement, peu importe leur statut premium
- Exception: Les admins (ADMIN/SUPERADMIN) ont toujours accès

```typescript
// ALL VIDEOS NOW REQUIRE SUBSCRIPTION (except for admins)
export async function checkVideoFileAccess(req: any, res: Response, next: NextFunction) {
  // If user is admin, allow access
  if (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN') {
    return next();
  }

  // Check if user is authenticated
  if (!req.userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required to access this video' }
    });
  }

  // ALL VIDEOS REQUIRE SUBSCRIPTION
  const hasAccess = await canAccessVideo(req.userId);

  if (!hasAccess) {
    return res.status(403).json({
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Active video subscription required to access this content'
      }
    });
  }

  next();
}
```

#### `checkLessonAccess` (Lignes 71-148)
- **Avant**: Vérifiait les flags premium individuellement
- **Après**: Toutes les leçons de type VIDEO nécessitent un abonnement

```typescript
// ALL VIDEO LESSONS REQUIRE SUBSCRIPTION
if (lesson.type === 'VIDEO') {
  hasAccess = await canAccessVideo(req.userId, lessonId);
}
```

### 2. Routes API - [backend/src/modules/lessons.ts](backend/src/modules/lessons.ts)

#### Route `GET /api/lessons/:id` (Lignes 153-267)
- **Avant**: Vérifiait uniquement `lesson.isPremium`
- **Après**: Vérifie `lesson.type === 'VIDEO'` pour exiger un abonnement

```typescript
// ALL VIDEO LESSONS REQUIRE SUBSCRIPTION (except for admins)
if (lesson.type === 'VIDEO') {
  // Verify user has active subscription with video access
  // Return 403 with SUBSCRIPTION_REQUIRED if not
}
```

### 3. Protection Multi-Couches

Le système implémente une protection à 3 niveaux:

1. **Route API `/api/lessons/:id`**
   - Vérifie l'abonnement lors de la récupération des détails de la leçon
   - Retourne 403 si l'utilisateur n'a pas d'abonnement

2. **Route de fichier `/uploads/videos/:filename`**
   - Middleware `optionalAuth` extrait l'utilisateur du token JWT
   - Middleware `checkVideoFileAccess` vérifie l'abonnement
   - Retourne 403 si pas d'accès

3. **Frontend**
   - Détecte l'erreur 403 avec code `SUBSCRIPTION_REQUIRED`
   - Affiche un message "Contenu Premium"
   - Bouton de redirection vers `/subscription`

## Types d'Abonnements Acceptés pour les Vidéos

Pour accéder aux vidéos, l'utilisateur doit avoir un abonnement **ACTIF** de type:
- ✅ **VIDEOS_ONLY** - Accès aux vidéos uniquement
- ✅ **FULL_ACCESS** - Accès complet (vidéos + documents)
- ❌ **DOCUMENTS_ONLY** - PAS d'accès aux vidéos

## Vérification d'Abonnement Actif

Un abonnement est considéré comme actif si:
1. `subscription.status === 'ACTIVE'`
2. `subscription.endAt > new Date()` (pas expiré)
3. `subscription.plan.type === 'VIDEOS_ONLY'` OU `'FULL_ACCESS'`

```typescript
const subscription = await prisma.subscription.findFirst({
  where: {
    userId: req.userId,
    status: 'ACTIVE',
    endAt: { gt: new Date() }
  },
  include: { plan: true }
});

if (subscription &&
    (subscription.plan.type === 'VIDEOS_ONLY' ||
     subscription.plan.type === 'FULL_ACCESS')) {
  // User has access
}
```

## Exceptions

### Administrateurs
Les utilisateurs avec le rôle `ADMIN` ou `SUPERADMIN` ont **toujours** accès à toutes les vidéos, même sans abonnement.

```typescript
if (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN') {
  return next(); // Bypass subscription check
}
```

### Documents (PDF/Examens)
Les documents restent accessibles gratuitement SAUF s'ils sont marqués comme premium:
- `lesson.isPremium = true` pour le document
- OU `lesson.requiresDocumentSubscription = true`

## Comportement Frontend

### Scénario 1: Utilisateur Non Connecté
1. Utilisateur essaie d'accéder à une vidéo
2. Backend retourne 401 UNAUTHORIZED
3. Frontend redirige vers `/login`

### Scénario 2: Utilisateur Sans Abonnement
1. Utilisateur connecté clique sur une vidéo
2. Backend retourne 403 avec code `SUBSCRIPTION_REQUIRED`
3. Frontend affiche:
   ```
   🔒 Contenu Premium

   Cette leçon nécessite un abonnement actif pour y accéder.

   [Voir les abonnements] [Retour au catalogue]
   ```
4. Clic sur "Voir les abonnements" → Redirige vers `/subscription`

### Scénario 3: Utilisateur avec Abonnement DOCUMENTS_ONLY
1. Utilisateur essaie d'accéder à une vidéo
2. Backend vérifie: Type d'abonnement = DOCUMENTS_ONLY → ❌ Pas d'accès vidéo
3. Retourne 403 `SUBSCRIPTION_REQUIRED`
4. Frontend affiche le message d'abonnement requis

### Scénario 4: Utilisateur avec Abonnement VIDEOS_ONLY ou FULL_ACCESS
1. Utilisateur accède à une vidéo
2. Backend vérifie: Abonnement actif + Type valide → ✅ Accès autorisé
3. Vidéo se charge et se lit normalement

## Codes d'Erreur

### 401 UNAUTHORIZED
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required to access this video"
  }
}
```
**Raison**: Utilisateur non connecté

### 403 SUBSCRIPTION_REQUIRED
```json
{
  "error": {
    "code": "SUBSCRIPTION_REQUIRED",
    "message": "Active video subscription required to access this content"
  }
}
```
**Raison**: Utilisateur connecté mais sans abonnement valide

## Tests

### Test 1: Utilisateur Sans Abonnement
```bash
# 1. Créer un utilisateur test
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}

# 2. Essayer d'accéder à une vidéo
GET /api/lessons/{lesson_id}

# Résultat attendu: 403 SUBSCRIPTION_REQUIRED
```

### Test 2: Utilisateur avec VIDEOS_ONLY
```bash
# 1. Créer un abonnement VIDEOS_ONLY
POST /api/subscriptions/subscribe
{
  "planId": "{videos_only_plan_id}"
}

# 2. Accéder à une vidéo
GET /api/lessons/{lesson_id}

# Résultat attendu: 200 OK avec les détails de la leçon

# 3. Essayer d'accéder à la vidéo directement
GET /uploads/videos/{filename}

# Résultat attendu: 200 OK avec le fichier vidéo
```

### Test 3: Admin Sans Abonnement
```bash
# 1. Se connecter en tant qu'admin
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "admin_password"
}

# 2. Accéder à une vidéo
GET /api/lessons/{lesson_id}

# Résultat attendu: 200 OK (bypass subscription check)
```

## Migration des Données Existantes

### Aucune Migration Nécessaire
Contrairement à l'approche précédente, cette implémentation ne nécessite PAS de marquer les leçons comme premium dans la base de données. Le contrôle se fait au niveau du code:

- Si `lesson.type === 'VIDEO'` → Abonnement requis
- Peu importe la valeur de `lesson.isPremium`

### Pour Rendre une Vidéo Gratuite (Cas Exceptionnel)

Si vous voulez qu'une vidéo spécifique soit gratuite, vous devrez:

1. Modifier le middleware pour ajouter une liste blanche:
```typescript
const FREE_VIDEO_IDS = ['video_id_1', 'video_id_2'];

if (FREE_VIDEO_IDS.includes(lesson.id)) {
  return next(); // Allow free access
}
```

OU

2. Changer le type de leçon de VIDEO à un autre type

## Avantages de cette Approche

✅ **Simple**: Toutes les vidéos nécessitent un abonnement par défaut
✅ **Sécurisé**: Protection multi-couches (API + fichiers)
✅ **Cohérent**: Même logique appliquée partout
✅ **Pas de migration**: Fonctionne avec les données existantes
✅ **Flexible**: Facile d'ajouter des exceptions si nécessaire

## Prochaines Étapes Recommandées

1. **Créer des plans d'abonnement**
   ```bash
   POST /api/subscriptions/plans
   {
     "name": "Abonnement Vidéos",
     "type": "VIDEOS_ONLY",
     "interval": "yearly",
     "priceCents": 10000,
     "currency": "MRU"
   }
   ```

2. **Tester avec des utilisateurs réels**
   - Créer des comptes test avec différents types d'abonnements
   - Vérifier le flux complet: inscription → abonnement → accès vidéo

3. **Configurer les paiements**
   - Intégrer Bankily, Masrivi ou Sedad
   - Tester le processus de paiement complet

4. **Analytics**
   - Tracker les tentatives d'accès refusées
   - Mesurer le taux de conversion vers les abonnements

## Support

En cas de problème:

1. Vérifier les logs backend pour les erreurs de vérification d'abonnement
2. Vérifier la console frontend pour voir les erreurs API
3. Confirmer que l'utilisateur a un abonnement actif dans la base de données
4. Vérifier que le token JWT est valide et contient le userId

## Commandes Utiles

```bash
# Recompiler le backend
cd backend && npm run build

# Démarrer le backend
npm run dev

# Vérifier les abonnements d'un utilisateur
# Dans psql:
SELECT u.email, s.status, s."startAt", s."endAt", sp.type, sp.name
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u.id
LEFT JOIN "SubscriptionPlan" sp ON sp.id = s."planId"
WHERE u.email = 'user@example.com';
```
