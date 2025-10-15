# 🔒 Système de Protection par Statut d'Abonnement

## 📌 Vue d'Ensemble

Ce système garantit que **seuls les utilisateurs avec un abonnement actif** peuvent accéder aux contenus premium (cours, leçons, vidéos).

Les utilisateurs **sans abonnement** ou avec un **abonnement en attente** sont automatiquement redirigés vers la page Tarifs (`/subscription`).

---

## 🎯 Règles d'Accès

### ✅ Accès AUTORISÉ pour Tous les Utilisateurs

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Page d'accueil publique |
| Authentification | `/auth`, `/login`, `/register` | Connexion et inscription |
| Tableau de bord | `/dashboard` | Tableau de bord personnel (authentifié) |
| Tarifs | `/subscription` | Page des plans d'abonnement |
| Paiement | `/payment/submit` | Formulaire de soumission de paiement |
| Mes paiements | `/my-payments` | Historique des paiements |
| Réinitialisation MDP | `/forgot-password` | Récupération de mot de passe |

### 🔒 Accès RÉSERVÉ aux Abonnés Actifs

| Page | URL | Protection | Redirection si Refus |
|------|-----|------------|---------------------|
| Catalogue | `/catalog` | `authGuard + subscriptionGuard` | → `/subscription` |
| Détails Cours | `/course/:id` | `authGuard + subscriptionGuard` | → `/subscription` |
| Leçon avec Vidéo | `/lesson/:id` | `authGuard + subscriptionGuard` | → `/subscription` |

### 👑 Accès RÉSERVÉ aux Admins

| Page | URL | Protection | Redirection si Refus |
|------|-----|------------|---------------------|
| Admin Dashboard | `/admin` | `authGuard + roleGuard(['admin', 'superadmin'])` | → `/` |
| Gestion Paiements | `/admin/payments` | `authGuard + roleGuard(['admin', 'superadmin'])` | → `/` |
| Upload Vidéo | `/admin/upload` | `authGuard + roleGuard(['admin', 'superadmin'])` | → `/` |

---

## 🛠️ Architecture Technique

### 1️⃣ Frontend - Guards Angular

#### `authGuard` (auth.guard.ts)
Vérifie que l'utilisateur est **authentifié** (connecté).

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/auth']);
  return false;
};
```

#### `subscriptionGuard` (subscription.guard.ts)
Vérifie que l'utilisateur a un **abonnement actif**.

```typescript
export const subscriptionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const canAccess = auth.canAccessPremium();
  if (canAccess) return true;

  router.navigate(['/subscription']);
  return false;
};
```

**Logique de vérification** :
```typescript
// Dans auth.service.ts
canAccessPremium(): boolean {
  const user = this.user();
  if (!user?.subscription) return false;
  return user.subscription.isActive === true;
}
```

#### Application des Guards (app.routes.ts)

```typescript
{
  path: 'catalog',
  loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent),
  canActivate: [authGuard, subscriptionGuard] // ✅ Protection complète
},
{
  path: 'course/:id',
  loadComponent: () => import('./pages/course/course.component').then(m => m.CourseComponent),
  canActivate: [authGuard, subscriptionGuard] // ✅ Protection complète
},
{
  path: 'lesson/:id',
  loadComponent: () => import('./pages/lesson/lesson.component').then(m => m.LessonComponent),
  canActivate: [authGuard, subscriptionGuard] // ✅ Protection complète
}
```

---

### 2️⃣ Backend - Renvoi des Données d'Abonnement

#### `getUserPublic()` - Fonction Helper (auth.ts)

Cette fonction extrait les données de l'utilisateur **incluant son abonnement actif** :

```typescript
function getUserPublic(user: any) {
  let subscriptionData: any = null;

  // Extraire l'abonnement actif
  if (user.subscriptions && user.subscriptions.length > 0) {
    const activeSub = user.subscriptions[0];
    subscriptionData = {
      type: activeSub.plan?.type || activeSub.type,  // VIDEOS_ONLY, DOCUMENTS_ONLY, FULL_ACCESS
      isActive: activeSub.status === 'ACTIVE',       // true si actif
      expiresAt: activeSub.expiresAt,                // Date d'expiration
    };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscription: subscriptionData,  // ✅ Inclut l'abonnement
    // ... autres champs
  };
}
```

#### Endpoints Modifiés

Tous les endpoints suivants **incluent maintenant les données d'abonnement** :

##### POST `/api/auth/register`
```typescript
authRouter.post('/register', async (req, res) => {
  // ... création utilisateur

  // ✅ Récupère l'utilisateur avec ses abonnements
  user = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true }
      }
    }
  });

  return res.status(201).json({ user: getUserPublic(user) });
});
```

##### POST `/api/auth/login`
```typescript
authRouter.post('/login', async (req, res) => {
  // ✅ Récupère l'utilisateur avec ses abonnements
  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true }
      }
    }
  });

  return res.json({ user: getUserPublic(user) });
});
```

##### GET `/api/auth/verify`
```typescript
authRouter.get('/verify', async (req, res) => {
  // ✅ Récupère l'utilisateur avec ses abonnements
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true }
      }
    }
  });

  return res.json({ user: getUserPublic(user), valid: true });
});
```

##### POST `/api/auth/refresh`
```typescript
authRouter.post('/refresh', async (req, res) => {
  // ✅ Récupère l'utilisateur avec ses abonnements
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true }
      }
    }
  });

  return res.json({ user: getUserPublic(user) });
});
```

##### GET `/api/auth/me`
```typescript
authRouter.get('/me', requireAuth, async (req: any, res) => {
  // ✅ Récupère l'utilisateur avec ses abonnements
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true }
      }
    }
  });

  return res.json({ user: getUserPublic(user) });
});
```

---

### 3️⃣ Backend - Protection des Fichiers Vidéo

#### Middleware `checkVideoFileAccess` (index.ts)

Ce middleware vérifie que l'utilisateur a un abonnement actif avant de servir une vidéo :

```typescript
async function checkVideoFileAccess(req: any, res: any, next: any) {
  console.log('🔍 [VIDEO ACCESS] Checking access for user:', req.userId);

  if (!req.userId) {
    console.log('❌ [VIDEO ACCESS] Access denied: Not authenticated');
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      }
    });

    if (!user) {
      console.log('❌ [VIDEO ACCESS] Access denied: User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    // Admins ont toujours accès
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      console.log('✅ [VIDEO ACCESS] Access granted: Admin user');
      return next();
    }

    // Vérifier l'abonnement actif
    const hasActiveSubscription = user.subscriptions && user.subscriptions.length > 0;

    if (!hasActiveSubscription) {
      console.log('❌ [VIDEO ACCESS] Access denied: No active subscription');
      return res.status(403).json({
        error: 'Active subscription required',
        message: 'Vous devez avoir un abonnement actif pour accéder aux vidéos'
      });
    }

    console.log('✅ [VIDEO ACCESS] Access granted: Active subscription found');
    return next();
  } catch (error) {
    console.error('❌ [VIDEO ACCESS] Error checking access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### Route Protégée pour les Vidéos (index.ts)

```typescript
// Servir les vidéos (PROTÉGÉ par abonnement)
app.get('/uploads/videos/:filename', optionalAuth, checkVideoFileAccess, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/videos', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.sendFile(filePath);
});
```

**IMPORTANT** : Le middleware `express.static` pour `/uploads` a été **désactivé** pour empêcher l'accès direct :

```typescript
// ❌ NE PAS réactiver cette ligne, elle contourne la protection !
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

---

## 🔄 Workflow Complet

### Scénario 1️⃣ : Utilisateur SANS Abonnement

1. **Connexion** → `/api/auth/login`
   - Backend renvoie : `{ user: { ..., subscription: null } }`
   - Frontend stocke l'utilisateur dans `auth.service.ts`

2. **Tentative d'accès** → `/catalog`
   - `authGuard` : ✅ Passe (utilisateur connecté)
   - `subscriptionGuard` : ❌ Bloque
     - Vérifie `user.subscription?.isActive` → `false`
     - Redirige vers `/subscription`

3. **Affichage** → Page Tarifs
   - L'utilisateur voit les 3 plans disponibles
   - Peut cliquer sur "Choisir ce plan"

---

### Scénario 2️⃣ : Utilisateur AVEC Abonnement Actif

1. **Connexion** → `/api/auth/login`
   - Backend renvoie :
   ```json
   {
     "user": {
       "id": "clg123...",
       "email": "etudiant@iscae.mr",
       "name": "Ahmed Mohamed",
       "role": "STUDENT",
       "subscription": {
         "type": "FULL_ACCESS",
         "isActive": true,
         "expiresAt": "2025-10-14T00:00:00.000Z"
       }
     }
   }
   ```

2. **Tentative d'accès** → `/catalog`
   - `authGuard` : ✅ Passe (utilisateur connecté)
   - `subscriptionGuard` : ✅ Passe
     - Vérifie `user.subscription?.isActive` → `true`
     - Autorise l'accès

3. **Affichage** → Page Catalogue des Cours
   - L'utilisateur voit tous les cours
   - Peut cliquer sur un cours → `/course/:id`
   - Peut cliquer sur une leçon → `/lesson/:id`
   - Peut lire les vidéos ✅

---

### Scénario 3️⃣ : Paiement Validé → Activation Automatique

1. **Admin valide le paiement** → `/api/manual-payments/:id/validate`
   - Backend :
     - Change le statut du paiement : `PENDING` → `COMPLETED`
     - **Crée automatiquement un abonnement actif** :
     ```typescript
     const subscription = await prisma.subscription.create({
       data: {
         userId: payment.userId,
         planId: payment.planId,
         status: 'ACTIVE',
         expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 an
       }
     });
     ```

2. **Utilisateur rafraîchit la page**
   - Frontend appelle `/api/auth/verify`
   - Backend renvoie les nouvelles données avec `subscription.isActive = true`
   - Frontend met à jour `user.subscription`

3. **Accès débloqué** ✅
   - L'utilisateur peut maintenant accéder à `/catalog`, `/course/:id`, `/lesson/:id`
   - Les vidéos se lisent normalement

---

## 🧪 Tests de Vérification

### Test 1 : Utilisateur Non Connecté

```bash
# Tentative d'accès direct
curl http://localhost:4200/catalog

# Résultat attendu : Redirection vers /auth
```

### Test 2 : Utilisateur Connecté SANS Abonnement

```bash
# 1. Se connecter (sans abonnement)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"etudiant@test.com","password":"password123"}' \
  -c cookies.txt

# 2. Tenter d'accéder au catalogue
curl http://localhost:4200/catalog -b cookies.txt

# Résultat attendu : Redirection vers /subscription
```

### Test 3 : Utilisateur Connecté AVEC Abonnement Actif

```bash
# 1. Se connecter (avec abonnement actif)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"abonne@test.com","password":"password123"}' \
  -c cookies.txt

# 2. Accéder au catalogue
curl http://localhost:4200/catalog -b cookies.txt

# Résultat attendu : Page du catalogue affichée ✅
```

### Test 4 : Tentative d'Accès Direct aux Vidéos

```bash
# Sans authentification
curl http://localhost:3000/uploads/videos/video123.mp4

# Résultat attendu : 401 Unauthorized

# Avec authentification mais sans abonnement
curl http://localhost:3000/uploads/videos/video123.mp4 -b cookies.txt

# Résultat attendu : 403 Forbidden (Active subscription required)

# Avec authentification ET abonnement actif
curl http://localhost:3000/uploads/videos/video123.mp4 -b cookies-abonne.txt

# Résultat attendu : 200 OK + fichier vidéo ✅
```

---

## 📋 Checklist de Sécurité

- ✅ `authGuard` appliqué sur toutes les routes protégées
- ✅ `subscriptionGuard` appliqué sur `/catalog`, `/course/:id`, `/lesson/:id`
- ✅ Backend renvoie les données d'abonnement dans `/login`, `/register`, `/verify`, `/refresh`, `/me`
- ✅ Middleware `checkVideoFileAccess` vérifie l'abonnement avant de servir les vidéos
- ✅ `express.static('/uploads')` **désactivé** pour éviter les contournements
- ✅ Routes de paiement screenshot protégées
- ✅ Logs de débogage activés pour tracer les accès

---

## 🔧 Dépannage

### Problème : "L'utilisateur peut accéder aux cours sans abonnement"

**Vérifications** :
1. Vérifier que `subscriptionGuard` est bien dans `canActivate` des routes `/catalog`, `/course/:id`, `/lesson/:id`
2. Vérifier que `canAccessPremium()` retourne `false` pour cet utilisateur
3. Vérifier que le backend renvoie bien `subscription: null` ou `subscription.isActive: false`

**Commandes de test** :
```bash
# Vérifier les données utilisateur
curl http://localhost:3000/api/auth/me -b cookies.txt | jq '.user.subscription'

# Résultat attendu (sans abonnement) :
null

# Résultat attendu (avec abonnement actif) :
{
  "type": "FULL_ACCESS",
  "isActive": true,
  "expiresAt": "2025-10-14T00:00:00.000Z"
}
```

### Problème : "Les vidéos sont accessibles directement par URL"

**Vérifications** :
1. Vérifier que `express.static('/uploads')` est **commenté** dans `backend/src/index.ts` ligne 140
2. Vérifier que la route `/uploads/videos/:filename` utilise bien `checkVideoFileAccess`
3. Vérifier les logs du backend lors de l'accès

**Commandes de test** :
```bash
# Accès direct sans cookies
curl -I http://localhost:3000/uploads/videos/test.mp4

# Résultat attendu : 401 Unauthorized
```

---

## 📚 Fichiers Modifiés

### Frontend
- ✅ `frontend/src/app/services/auth.service.ts` : Interfaces `User` et `BackendUser` mises à jour, `isPremium` et `canAccessPremium()` corrigés
- ✅ `frontend/src/app/app.routes.ts` : `subscriptionGuard` ajouté sur `/catalog` et `/course/:id`
- ✅ `frontend/src/app/core/guards/subscription.guard.ts` : Redirige vers `/subscription` si pas d'abonnement actif

### Backend
- ✅ `backend/src/modules/auth.ts` :
  - Fonction `getUserPublic()` modifiée pour extraire les abonnements actifs
  - Endpoints `/register`, `/login`, `/verify`, `/refresh`, `/me` incluent maintenant les abonnements
- ✅ `backend/src/index.ts` :
  - Middleware `checkVideoFileAccess` vérifie l'abonnement
  - `express.static('/uploads')` désactivé (ligne 140)

---

## 🎓 Résumé

Le système de protection par abonnement fonctionne en **3 couches** :

1. **Frontend Guards** : Bloquent l'accès aux routes `/catalog`, `/course/:id`, `/lesson/:id` pour les non-abonnés
2. **Backend Auth Endpoints** : Renvoient systématiquement les données d'abonnement avec l'utilisateur
3. **Backend File Middleware** : Vérifient l'abonnement avant de servir les fichiers vidéo

**Résultat** : Un utilisateur sans abonnement actif ne peut :
- ❌ Accéder au catalogue de cours
- ❌ Voir les détails d'un cours
- ❌ Ouvrir une leçon
- ❌ Lire une vidéo

Il peut uniquement :
- ✅ Voir son tableau de bord
- ✅ Consulter les tarifs (`/subscription`)
- ✅ Soumettre un paiement
- ✅ Suivre ses paiements (`/my-payments`)

---

**Version** : 1.0
**Date** : 14 octobre 2025
**Système** : Archify - Plateforme ISCAE
