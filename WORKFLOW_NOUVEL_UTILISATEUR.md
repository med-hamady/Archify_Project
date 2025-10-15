# 🎯 Workflow Complet : Nouvel Utilisateur → Abonnement Premium

## 📋 Scénario Complet

Ce document décrit le parcours complet d'un **nouvel utilisateur** depuis l'inscription jusqu'à l'accès aux vidéos premium.

---

## 🔄 Étapes du Workflow

### 1️⃣ Inscription du Nouvel Utilisateur

**URL** : `/register`

**Actions de l'utilisateur** :
- Remplit le formulaire d'inscription :
  - Email : `nouveau@iscae.mr`
  - Mot de passe : `Password123!`
  - Nom : `Ahmed Mohamed`
  - Semestre : `S1`
- Clique sur "S'inscrire"

**Backend** : `POST /api/auth/register`
```typescript
// backend/src/modules/auth.ts ligne 128-168
const user = await prisma.user.create({
  data: {
    email: 'nouveau@iscae.mr',
    passwordHash: hash,
    name: 'Ahmed Mohamed',
    semester: 'S1'
  }
});

// Récupération avec abonnements (aucun pour un nouvel utilisateur)
user = await prisma.user.findUniqueOrThrow({
  where: { id: user.id },
  include: {
    subscriptions: {
      where: { status: 'ACTIVE' },
      include: { plan: true }
    }
  }
});

// Retour au frontend
return res.status(201).json({
  user: getUserPublic(user)
});
```

**Résultat** :
```json
{
  "user": {
    "id": "clxyz123...",
    "email": "nouveau@iscae.mr",
    "name": "Ahmed Mohamed",
    "role": "STUDENT",
    "subscription": null  // ❌ PAS D'ABONNEMENT
  }
}
```

✅ **L'utilisateur est inscrit mais N'A PAS d'abonnement**

---

### 2️⃣ Connexion de l'Utilisateur

**URL** : `/login`

**Actions** :
- Entre email et mot de passe
- Clique sur "Se connecter"

**Backend** : `POST /api/auth/login`
```typescript
// backend/src/modules/auth.ts ligne 159-189
const user = await prisma.user.findUnique({
  where: { email: 'nouveau@iscae.mr' },
  include: {
    subscriptions: {
      where: { status: 'ACTIVE' },
      include: { plan: true }
    }
  }
});

// user.subscriptions = [] (vide)
```

**Résultat** :
```json
{
  "user": {
    "id": "clxyz123...",
    "email": "nouveau@iscae.mr",
    "subscription": null  // ❌ TOUJOURS PAS D'ABONNEMENT
  }
}
```

✅ **L'utilisateur est connecté mais subscription = null**

---

### 3️⃣ Tentative d'Accès à une Vidéo/Cours

**Scénario A** : L'utilisateur essaie d'accéder au catalogue

**URL** : `/catalog`

**Frontend - Route Guard** : `app.routes.ts` ligne 12-15
```typescript
{
  path: 'catalog',
  loadComponent: () => import('./pages/catalog/catalog.component'),
  canActivate: [authGuard, subscriptionGuard]  // 🔒 PROTECTION
}
```

**Vérification 1 - authGuard** :
```typescript
// frontend/src/app/core/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) return true;  // ✅ Utilisateur connecté

  router.navigate(['/auth']);
  return false;
};
```
✅ **Passe** : L'utilisateur est connecté

**Vérification 2 - subscriptionGuard** :
```typescript
// frontend/src/app/core/guards/subscription.guard.ts ligne 5-12
export const subscriptionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const canAccess = auth.canAccessPremium();  // Vérifie l'abonnement
  if (canAccess) return true;

  router.navigate(['/subscription']);  // ❌ REDIRECTION
  return false;
};
```

**Méthode canAccessPremium()** :
```typescript
// frontend/src/app/services/auth.service.ts ligne 256-260
canAccessPremium(): boolean {
  const user = this.user();
  if (!user?.subscription) return false;  // ❌ subscription = null
  return user.subscription.isActive === true;
}
```

**Résultat** :
- `user.subscription` = `null`
- `canAccessPremium()` retourne `false`
- ❌ **ACCÈS REFUSÉ**
- 🔀 **REDIRECTION automatique vers `/subscription`**

---

**Scénario B** : L'utilisateur clique sur une vidéo directement

**URL** : `/lesson/clxyz123`

**Même processus** :
1. `authGuard` ✅ Passe (connecté)
2. `subscriptionGuard` ❌ Bloque (pas d'abonnement)
3. 🔀 **Redirection vers `/subscription`**

---

### 4️⃣ Page Tarifs (Subscription)

**URL** : `/subscription`

**Affichage** :
```
┌─────────────────────────────────────────┐
│    ⭐ Abonnement Premium                │
├─────────────────────────────────────────┤
│              Premium                     │
│                                          │
│         [Icône Étoile]                   │
│                                          │
│           500 MRU                        │
│            /an                           │
│                                          │
│  ✅ Accès illimité aux cours vidéo      │
│  ✅ Accès aux documents PDF             │
│  ✅ Téléchargement ressources           │
│  ✅ Support prioritaire                 │
│  ✅ Nouveaux contenus inclus            │
│  ✅ Valable 1 an                        │
│                                          │
│     [Choisir Premium] ───────→          │
└─────────────────────────────────────────┘
```

**Actions** :
- L'utilisateur voit le plan Premium à 500 MRU/an
- Clique sur "Choisir Premium"

**Redirection** : `/payment/submit?planId=premium-plan`

---

### 5️⃣ Formulaire de Paiement Manuel

**URL** : `/payment/submit?planId=premium-plan`

**Affichage du formulaire** :
```
┌─────────────────────────────────────────┐
│     Paiement pour Plan Premium          │
├─────────────────────────────────────────┤
│  Prix: 500 MRU/an                       │
│                                          │
│  Méthode de paiement:                   │
│    ○ Bankily                            │
│    ○ Masrivi                            │
│    ○ Sedad                              │
│                                          │
│  Numéro de téléphone:                   │
│  [____________________]                 │
│                                          │
│  Numéro de transaction:                 │
│  [____________________]                 │
│                                          │
│  Capture d'écran du paiement:           │
│  [Choisir fichier...]                   │
│                                          │
│     [Soumettre le paiement] ───────→    │
└─────────────────────────────────────────┘
```

**Actions de l'utilisateur** :
1. Sélectionne mode de paiement : **Bankily**
2. Entre numéro téléphone : `22234567`
3. Entre numéro transaction : `TRX123456789`
4. Upload capture d'écran : `paiement_bankily.jpg`
5. Clique sur "Soumettre le paiement"

**Backend** : `POST /api/manual-payments`
```typescript
// backend/src/modules/manual-payments.ts ligne 64-132
const payment = await prisma.payment.create({
  data: {
    userId: req.userId,  // ID du nouvel utilisateur
    planId: 'premium-plan',
    provider: 'BANKILY',
    providerRef: 'TRX123456789',
    phoneNumber: '22234567',
    amountCents: 50000,  // 500 MRU
    currency: 'MRU',
    status: 'PENDING',  // ⏳ EN ATTENTE
    screenshotUrl: '/uploads/payment-screenshots/clxyz_123456.jpg'
  }
});
```

**Résultat** :
```json
{
  "success": true,
  "paymentId": "clpayment123...",
  "status": "PENDING",
  "message": "Paiement soumis avec succès. En attente de validation."
}
```

✅ **Paiement créé avec statut PENDING**
⏳ **En attente de validation admin**

---

### 6️⃣ Suivi du Paiement par l'Utilisateur

**URL** : `/my-payments`

**Affichage** :
```
┌─────────────────────────────────────────────────┐
│           Mes Paiements                          │
├─────────────────────────────────────────────────┤
│  Plan Premium - 500 MRU                         │
│  Date: 15/10/2025                               │
│  Transaction: TRX123456789                      │
│  Statut: ⏳ EN ATTENTE DE VALIDATION           │
│  Mode: Bankily (22234567)                      │
└─────────────────────────────────────────────────┘
```

❗ **L'utilisateur NE PEUT TOUJOURS PAS accéder aux vidéos**
- Son `subscription` reste `null`
- Il doit attendre la validation admin

---

### 7️⃣ Validation par l'Admin

**URL Admin** : `/admin/payments`

**Affichage admin** :
```
┌───────────────────────────────────────────────────────────┐
│     Gestion des Paiements Manuels                         │
├───────────────────────────────────────────────────────────┤
│  🔔 Paiements en attente: 1                               │
│                                                            │
│  ┌────────────────────────────────────────────┐          │
│  │ Ahmed Mohamed (nouveau@iscae.mr)           │          │
│  │ Plan: Premium - 500 MRU                    │          │
│  │ Transaction: TRX123456789                  │          │
│  │ Bankily: 22234567                          │          │
│  │ Date: 15/10/2025 14:30                     │          │
│  │                                             │          │
│  │ 📷 [Voir capture d'écran]                  │          │
│  │                                             │          │
│  │  [✅ Valider]  [❌ Rejeter]                 │          │
│  └────────────────────────────────────────────┘          │
└───────────────────────────────────────────────────────────┘
```

**Actions de l'admin** :
1. Vérifie la capture d'écran du paiement
2. Confirme que le paiement est légitime
3. Clique sur "✅ Valider"

**Backend** : `POST /api/manual-payments/:id/validate`
```typescript
// backend/src/modules/manual-payments.ts ligne 180-270
async function validatePayment(paymentId) {
  // 1. Mettre à jour le paiement
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'COMPLETED',  // ✅ VALIDÉ
      validatedBy: req.userId,  // ID de l'admin
      validatedAt: new Date()
    }
  });

  // 2. CRÉER AUTOMATIQUEMENT L'ABONNEMENT PREMIUM
  const subscription = await prisma.subscription.create({
    data: {
      userId: payment.userId,  // Le nouvel utilisateur
      planId: 'premium-plan',
      status: 'ACTIVE',  // ✅ ACTIF
      startAt: new Date(),
      endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)  // +1 an
    }
  });

  // 3. Lier le paiement à l'abonnement
  await prisma.payment.update({
    where: { id: paymentId },
    data: { subscriptionId: subscription.id }
  });

  return { success: true, subscription };
}
```

**Résultat dans la base de données** :
```sql
-- Table: Subscription
id: clsub123...
userId: clxyz123...  -- Le nouvel utilisateur
planId: premium-plan
status: ACTIVE  -- ✅ ACTIF
startAt: 2025-10-15
endAt: 2026-10-15  -- +1 an

-- Table: Payment
id: clpayment123...
userId: clxyz123...
status: COMPLETED  -- ✅ VALIDÉ
subscriptionId: clsub123...
validatedBy: cladmin...
validatedAt: 2025-10-15 14:35:00
```

✅ **Abonnement Premium créé et ACTIVÉ automatiquement**

---

### 8️⃣ Rafraîchissement de l'Utilisateur

**Deux façons pour l'utilisateur de voir son abonnement actif** :

#### Option A : L'utilisateur rafraîchit la page (F5)

**Frontend - Initialisation** : `auth.service.ts` ligne 89-98
```typescript
private initializeAuth() {
  const user = this.getStoredUser();
  if (user) {
    this.user.set(user);

    // Appel automatique pour récupérer les dernières données
    this.verifyToken().subscribe({
      next: (response) => this.updateUser(response.user),
      error: () => this.logout(),
    });
  }
}
```

**Backend** : `GET /api/auth/verify`
```typescript
// backend/src/modules/auth.ts ligne 233-253
const user = await prisma.user.findUnique({
  where: { id: decoded.sub },
  include: {
    subscriptions: {
      where: { status: 'ACTIVE' },  // ✅ Trouve l'abonnement nouvellement créé
      include: { plan: true }
    }
  }
});

return res.json({
  user: getUserPublic(user),  // Maintenant avec subscription
  valid: true
});
```

**Résultat frontend** :
```json
{
  "user": {
    "id": "clxyz123...",
    "email": "nouveau@iscae.mr",
    "name": "Ahmed Mohamed",
    "subscription": {
      "type": "PREMIUM",  // ✅ ABONNEMENT ACTIF
      "isActive": true,
      "expiresAt": "2026-10-15T00:00:00.000Z"
    }
  }
}
```

✅ **L'utilisateur a maintenant un abonnement Premium actif**

#### Option B : L'utilisateur se déconnecte et se reconnecte

**Backend** : `POST /api/auth/login`
- Même processus que l'Option A
- Récupère les abonnements actifs
- Retourne `subscription.isActive = true`

---

### 9️⃣ Accès aux Vidéos DÉBLOQUÉ

**L'utilisateur essaie à nouveau d'accéder au catalogue**

**URL** : `/catalog`

**Vérification - subscriptionGuard** :
```typescript
canAccessPremium(): boolean {
  const user = this.user();
  if (!user?.subscription) return false;

  // Maintenant: user.subscription.isActive = true
  return user.subscription.isActive === true;  // ✅ RETOURNE TRUE
}
```

**Résultat** :
- ✅ **subscriptionGuard AUTORISE l'accès**
- ✅ **Page catalogue s'affiche**
- ✅ **L'utilisateur voit tous les cours**

---

**L'utilisateur clique sur un cours** → `/course/clxyz`
- ✅ **Accès autorisé** (subscriptionGuard passe)

**L'utilisateur clique sur une leçon vidéo** → `/lesson/clxyz`
- ✅ **Accès autorisé** (subscriptionGuard passe)

**La vidéo tente de charger** → `GET /uploads/videos/video123.mp4`

**Backend - Middleware** : `checkVideoFileAccess`
```typescript
// backend/src/middleware/subscription-access.ts ligne 154-207
async function checkVideoFileAccess(req, res, next) {
  console.log('🔐 Checking video access for user:', req.userId);

  // Vérifier l'abonnement
  const hasAccess = await canAccessVideo(req.userId);

  if (!hasAccess) {
    return res.status(403).json({
      error: 'Active subscription required'
    });
  }

  console.log('✅ ACCESS GRANTED');
  next();  // ✅ AUTORISE LE TÉLÉCHARGEMENT
}

async function canAccessVideo(userId) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endAt: { gt: new Date() }
    },
    include: { plan: true }
  });

  if (!subscription) return false;

  // PREMIUM subscription grants access to all videos
  if (subscription.plan.type === 'PREMIUM') {
    return true;  // ✅ RETOURNE TRUE
  }

  return false;
}
```

**Résultat** :
- ✅ **Backend trouve l'abonnement Premium actif**
- ✅ **Middleware autorise l'accès**
- ✅ **Vidéo servie au navigateur**
- ✅ **LA VIDÉO SE LIT !** 🎉

---

## 📊 Résumé du Workflow

```
┌──────────────────────────────────────────────────────────────┐
│  1. INSCRIPTION                                              │
│     └─> user.subscription = null                            │
├──────────────────────────────────────────────────────────────┤
│  2. CONNEXION                                                │
│     └─> user.subscription = null                            │
├──────────────────────────────────────────────────────────────┤
│  3. TENTATIVE D'ACCÈS VIDÉO                                  │
│     └─> subscriptionGuard: BLOQUÉ ❌                        │
│     └─> Redirection automatique: /subscription              │
├──────────────────────────────────────────────────────────────┤
│  4. PAGE TARIFS                                              │
│     └─> Voit le plan Premium 500 MRU/an                     │
│     └─> Clique "Choisir Premium"                            │
├──────────────────────────────────────────────────────────────┤
│  5. FORMULAIRE PAIEMENT                                      │
│     └─> Sélectionne Bankily                                 │
│     └─> Entre transaction + téléphone                       │
│     └─> Upload capture d'écran                              │
│     └─> Backend: Payment créé (status: PENDING)             │
├──────────────────────────────────────────────────────────────┤
│  6. ATTENTE VALIDATION                                       │
│     └─> user.subscription = null (toujours)                 │
│     └─> Vidéos toujours bloquées ❌                         │
├──────────────────────────────────────────────────────────────┤
│  7. ADMIN VALIDE                                             │
│     └─> Payment: status → COMPLETED                         │
│     └─> Subscription: CRÉÉE AUTOMATIQUEMENT ✅              │
│     └─> status: ACTIVE, durée: 1 an                         │
├──────────────────────────────────────────────────────────────┤
│  8. RAFRAÎCHISSEMENT                                         │
│     └─> user.subscription.isActive = true ✅                │
│     └─> user.subscription.type = 'PREMIUM'                  │
├──────────────────────────────────────────────────────────────┤
│  9. ACCÈS DÉBLOQUÉ                                           │
│     └─> subscriptionGuard: AUTORISÉ ✅                      │
│     └─> Vidéos accessibles ✅                               │
│     └─> Documents accessibles ✅                            │
│     └─> Tout le contenu accessible ✅                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Points de Vérification du Système

### ✅ Protection Frontend (Route Guards)
- **Fichier** : `frontend/src/app/app.routes.ts`
- **Routes protégées** : `/catalog`, `/course/:id`, `/lesson/:id`
- **Guard** : `subscriptionGuard`
- **Redirection** : `/subscription` si pas d'abonnement

### ✅ Protection Backend (API Endpoints)
- **Fichier** : `backend/src/modules/lessons.ts`
- **Lignes** : 186-191 et 240-245
- **Vérification** : `subscription.plan.type === 'PREMIUM'`

### ✅ Protection Fichiers Vidéo
- **Fichier** : `backend/src/middleware/subscription-access.ts`
- **Middleware** : `checkVideoFileAccess`
- **Route** : `GET /uploads/videos/:filename`

### ✅ Création Automatique d'Abonnement
- **Fichier** : `backend/src/modules/manual-payments.ts`
- **Lignes** : 223-237
- **Trigger** : Validation du paiement par admin

### ✅ Récupération des Données Abonnement
- **Fichier** : `backend/src/modules/auth.ts`
- **Endpoints** : `/login`, `/register`, `/verify`, `/refresh`, `/me`
- **Include** : `subscriptions { where: { status: 'ACTIVE' } }`

---

## 🧪 Commandes de Test

### Test 1 : Créer un Nouvel Utilisateur
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.nouveau@iscae.mr",
    "password": "Test123!",
    "name": "Test Utilisateur",
    "semester": "S1"
  }' \
  -c cookies.txt | jq '.user.subscription'

# Résultat attendu: null
```

### Test 2 : Tenter d'Accéder à une Vidéo (Sans Abonnement)
```bash
curl -X GET http://localhost:3000/uploads/videos/test.mp4 \
  -b cookies.txt

# Résultat attendu: 403 Forbidden (Subscription required)
```

### Test 3 : Soumettre un Paiement
```bash
curl -X POST http://localhost:3000/api/manual-payments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "planId": "premium-plan",
    "provider": "BANKILY",
    "providerRef": "TEST123456",
    "phoneNumber": "22234567",
    "screenshot": "data:image/png;base64,..."
  }' | jq

# Résultat attendu: { "success": true, "status": "PENDING" }
```

### Test 4 : Vérifier l'Abonnement Après Validation Admin
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt | jq '.user.subscription'

# AVANT validation: null
# APRÈS validation: { "type": "PREMIUM", "isActive": true, ... }
```

### Test 5 : Accéder à une Vidéo (Avec Abonnement)
```bash
curl -X GET http://localhost:3000/uploads/videos/test.mp4 \
  -b cookies.txt

# Résultat attendu: 200 OK + fichier vidéo
```

---

## ✅ Confirmation du Système

Le système fonctionne **EXACTEMENT** comme vous l'avez demandé :

1. ✅ Nouvel utilisateur s'inscrit → **subscription = null**
2. ✅ Essaie d'accéder aux vidéos → **Bloqué automatiquement**
3. ✅ Redirigé vers `/subscription` → **Voit le plan Premium**
4. ✅ Soumet un paiement → **Payment créé (PENDING)**
5. ✅ Admin valide → **Abonnement créé automatiquement (ACTIVE)**
6. ✅ Utilisateur rafraîchit → **subscription.isActive = true**
7. ✅ Peut accéder aux vidéos → **Accès débloqué** 🎉

---

**Version** : 1.0
**Date** : 15 octobre 2025
**Système** : Archify - Plateforme ISCAE
**Abonnement** : Premium 500 MRU/an
