# 🌟 Système d'Abonnement Premium Unique

## 📌 Vue d'Ensemble

Le système d'abonnement Archify a été **simplifié** pour offrir **un seul type d'abonnement Premium** qui donne accès à **tout le contenu** de la plateforme.

### Avantages de cette Simplification

✅ **Plus simple pour les utilisateurs** - Un seul choix clair
✅ **Plus facile à gérer** - Moins de complexité administrative
✅ **Meilleure conversion** - Évite la confusion entre les plans
✅ **Expérience unifiée** - Tous les abonnés ont les mêmes avantages

---

## 🎯 Plan Premium Unique

### Caractéristiques

| Aspect | Détails |
|--------|---------|
| **Nom** | Premium |
| **Type** | `PREMIUM` |
| **Prix** | 500 MRU / an |
| **Durée** | 1 an (12 mois) |
| **ID dans la base** | `premium-plan` |

### Fonctionnalités Incluses

- ✅ Accès illimité à **tous les cours vidéo**
- ✅ Accès à **tous les documents PDF et supports**
- ✅ **Téléchargement des ressources**
- ✅ **Support prioritaire**
- ✅ **Mises à jour et nouveaux contenus inclus**
- ✅ Valable pendant **1 an complet**

---

## 🔧 Architecture Technique

### 1️⃣ Backend - Type d'Abonnement

#### Schéma Prisma (schema.prisma)

```prisma
enum SubscriptionType {
  PREMIUM  // Seul type d'abonnement disponible
}

model SubscriptionPlan {
  id           String  @id @default(cuid())
  name         String
  description  String?
  type         SubscriptionType  // Toujours PREMIUM
  interval     String
  priceCents   Int
  currency     String  @default("MRU")
  features     String[]
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())
  subscriptions Subscription[]
}
```

#### Plan Premium en Base de Données

```javascript
// backend/setup-premium-plan.js
{
  id: 'premium-plan',
  name: 'Premium',
  description: 'Accès complet à tous les cours et ressources',
  type: 'PREMIUM',
  interval: 'yearly',
  priceCents: 50000,  // 500 MRU
  currency: 'MRU',
  features: [
    'Accès illimité à tous les cours vidéo',
    'Accès à tous les documents PDF et supports',
    'Téléchargement des ressources',
    'Support prioritaire',
    'Mises à jour et nouveaux contenus inclus',
    'Valable pendant 1 an'
  ],
  isActive: true
}
```

---

### 2️⃣ Frontend - Interfaces TypeScript

#### Interface Utilisateur (auth.service.ts)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'superadmin' | 'STUDENT' | 'ADMIN' | 'SUPERADMIN';
  subscription?: {
    type: 'PREMIUM';  // Seul type possible
    expiresAt: Date | null;
    isActive: boolean;
  };
  // ... autres champs
}
```

#### Vérification d'Accès Premium

```typescript
// Dans auth.service.ts
canAccessPremium(): boolean {
  const user = this.user();
  if (!user?.subscription) return false;
  return user.subscription.isActive === true;
}

// Signal computed
isPremium = computed(() => this.user()?.subscription?.isActive === true);
```

---

### 3️⃣ Middleware de Protection

#### Vérification d'Accès Vidéo (subscription-access.ts)

```typescript
export async function canAccessVideo(userId: string): Promise<boolean> {
  const { hasSubscription, subscriptionType } = await hasActiveSubscription(userId);

  if (!hasSubscription) {
    return false;
  }

  // PREMIUM subscription grants access to all videos
  if (subscriptionType === 'PREMIUM') {
    return true;
  }

  return false;
}
```

#### Vérification d'Accès Documents

```typescript
export async function canAccessDocument(userId: string): Promise<boolean> {
  const { hasSubscription, subscriptionType } = await hasActiveSubscription(userId);

  if (!hasSubscription) {
    return false;
  }

  // PREMIUM subscription grants access to all documents
  if (subscriptionType === 'PREMIUM') {
    return true;
  }

  return false;
}
```

**IMPORTANT** : Avec Premium, les utilisateurs ont accès à **TOUT** - vidéos ET documents.

---

## 🎨 Interface Utilisateur

### Page d'Abonnement (subscription.component.ts)

La page affiche **un seul plan Premium** centré, avec :

- 🌟 Badge "Abonnement Premium" animé
- 💎 Icône étoile scintillante
- 💰 Prix affiché : **500 MRU/an**
- 📋 Liste des fonctionnalités
- 🔵 Bouton "Choisir Premium" avec dégradé bleu-indigo-violet

```html
<div class="flex justify-center mb-16">
  <div class="max-w-lg w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border-4 border-blue-500 ring-8 ring-blue-500/20">
    <!-- Badge Premium animé -->
    <div class="absolute -top-6 left-1/2 transform -translate-x-1/2">
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg animate-pulse">
        ⭐ Abonnement Premium
      </div>
    </div>

    <!-- Contenu du plan... -->
  </div>
</div>
```

---

## 🔄 Workflow d'Abonnement

### Scénario Complet

1. **Utilisateur visite `/subscription`**
   - Voit le plan Premium unique à 500 MRU/an
   - Clique sur "Choisir Premium"

2. **Redirection vers `/payment/submit`**
   - URL contient `?planId=premium-plan`
   - Formulaire de paiement manuel s'affiche
   - Choix du mode de paiement (Bankily, Masrivi, Sedad)

3. **Soumission du Paiement**
   - Utilisateur entre son numéro de téléphone
   - Utilisateur entre le numéro de transaction
   - Utilisateur upload une capture d'écran de paiement
   - **Backend crée un `Payment` avec `status: PENDING`**

4. **Admin valide le Paiement** (`/admin/payments`)
   - Admin voit le paiement en attente
   - Admin vérifie la capture d'écran
   - Admin clique sur "Valider"
   - **Backend**:
     - Change le statut du paiement : `PENDING` → `COMPLETED`
     - **Crée automatiquement un abonnement Premium** :
       ```typescript
       const subscription = await prisma.subscription.create({
         data: {
           userId: payment.userId,
           planId: 'premium-plan',
           status: 'ACTIVE',
           startAt: new Date(),
           endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 an
         }
       });
       ```

5. **Utilisateur rafraîchit la page**
   - `/api/auth/verify` renvoie les données avec `subscription.isActive = true`
   - Frontend met à jour `user.subscription`
   - **Accès débloqué** : `/catalog`, `/course/:id`, `/lesson/:id` ✅

---

## 🛡️ Protection des Contenus

### Routes Protégées (app.routes.ts)

```typescript
{
  path: 'catalog',
  canActivate: [authGuard, subscriptionGuard],  // Bloque sans Premium
  loadComponent: () => import('./pages/catalog/catalog.component')
},
{
  path: 'course/:id',
  canActivate: [authGuard, subscriptionGuard],  // Bloque sans Premium
  loadComponent: () => import('./pages/course/course.component')
},
{
  path: 'lesson/:id',
  canActivate: [authGuard, subscriptionGuard],  // Bloque sans Premium
  loadComponent: () => import('./pages/lesson/lesson.component')
}
```

### Routes Ouvertes (Sans Abonnement)

- ✅ `/` - Page d'accueil
- ✅ `/dashboard` - Tableau de bord personnel (authentifié)
- ✅ `/subscription` - Page du plan Premium
- ✅ `/payment/submit` - Formulaire de paiement
- ✅ `/my-payments` - Historique des paiements
- ✅ `/auth`, `/login`, `/register` - Authentification

---

## 📊 Base de Données

### État Actuel des Plans

Après migration, voici l'état de la base :

| Plan | Type | Statut | Prix |
|------|------|--------|------|
| **Premium** | PREMIUM | ✅ ACTIF | 500 MRU |
| Gratuit | PREMIUM | ❌ INACTIF | 0 MRU |
| Vidéos Seulement | PREMIUM | ❌ INACTIF | 650 MRU |
| Documents Seulement | PREMIUM | ❌ INACTIF | 500 MRU |
| Accès Complet | PREMIUM | ❌ INACTIF | 1000 MRU |

**Note** : Les anciens plans ont été désactivés (`isActive: false`) pour ne pas apparaître sur la page d'abonnement. Seul le plan Premium actif est affiché.

---

## 🧪 Tests et Vérification

### Test 1 : Utilisateur Sans Abonnement

```bash
# 1. Se connecter
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"etudiant@test.com","password":"password123"}' \
  -c cookies.txt

# 2. Vérifier l'absence d'abonnement
curl http://localhost:3000/api/auth/me -b cookies.txt | jq '.user.subscription'
# Résultat attendu: null

# 3. Tenter d'accéder au catalogue
curl http://localhost:4200/catalog -b cookies.txt
# Résultat attendu: Redirection vers /subscription
```

### Test 2 : Utilisateur Avec Premium Actif

```bash
# 1. Se connecter avec un compte Premium
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@archify.ma","password":"student123"}' \
  -c cookies.txt

# 2. Vérifier l'abonnement
curl http://localhost:3000/api/auth/me -b cookies.txt | jq '.user.subscription'
# Résultat attendu:
# {
#   "type": "PREMIUM",
#   "isActive": true,
#   "expiresAt": "2026-10-15T..."
# }

# 3. Accéder au catalogue
curl http://localhost:4200/catalog -b cookies.txt
# Résultat attendu: Page du catalogue affichée ✅

# 4. Accéder à une vidéo
curl http://localhost:3000/uploads/videos/test.mp4 -b cookies.txt
# Résultat attendu: Vidéo servie (200 OK) ✅
```

### Test 3 : Vérification des Plans Disponibles

```bash
curl http://localhost:3000/api/subscriptions/plans | jq
# Résultat attendu:
# {
#   "plans": [
#     {
#       "id": "premium-plan",
#       "name": "Premium",
#       "interval": "yearly",
#       "priceCents": 50000,
#       "price": "500.00",
#       "currency": "MRU"
#     }
#   ]
# }
```

---

## 📝 Scripts de Migration

### 1. Ajouter PREMIUM à l'Enum PostgreSQL

```javascript
// backend/add-premium-enum.js
await prisma.$executeRawUnsafe(`
  ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'PREMIUM';
`);

await prisma.$executeRawUnsafe(`
  UPDATE "SubscriptionPlan"
  SET type = 'PREMIUM'::"SubscriptionType"
  WHERE type IN ('VIDEOS_ONLY', 'DOCUMENTS_ONLY', 'FULL_ACCESS');
`);
```

### 2. Créer le Plan Premium

```javascript
// backend/setup-premium-plan.js
const premiumPlan = await prisma.subscriptionPlan.upsert({
  where: { id: 'premium-plan' },
  update: { /* ... */ },
  create: {
    id: 'premium-plan',
    name: 'Premium',
    type: 'PREMIUM',
    priceCents: 50000,
    // ... autres champs
  }
});

// Désactiver les anciens plans
await prisma.subscriptionPlan.updateMany({
  where: { id: { not: 'premium-plan' } },
  data: { isActive: false }
});
```

---

## 🔐 Sécurité et Protection

### Niveaux de Protection

1. **Frontend - Route Guards**
   - `subscriptionGuard` bloque l'accès aux routes `/catalog`, `/course/:id`, `/lesson/:id`
   - Redirige vers `/subscription` si pas d'abonnement actif

2. **Backend - API Endpoints**
   - Tous les endpoints `/api/auth/*` renvoient les données d'abonnement
   - Vérifient automatiquement `subscription.isActive`

3. **Backend - Fichiers Vidéo**
   - Middleware `checkVideoFileAccess` vérifie l'abonnement avant de servir les vidéos
   - Route protégée : `/uploads/videos/:filename`
   - `express.static` désactivé pour empêcher l'accès direct

---

## ✅ Checklist de Migration

- ✅ Schéma Prisma mis à jour avec `enum SubscriptionType { PREMIUM }`
- ✅ Enum PostgreSQL mis à jour avec `ALTER TYPE`
- ✅ Plan Premium créé en base de données
- ✅ Anciens plans désactivés (`isActive: false`)
- ✅ Interfaces frontend `User` et `BackendUser` mises à jour
- ✅ Méthode `canAccessPremium()` simplifiée
- ✅ Signal `isPremium` mis à jour
- ✅ Guards appliqués sur les routes `/catalog` et `/course/:id`
- ✅ Middleware `subscription-access.ts` mis à jour
- ✅ Module `lessons.ts` mis à jour pour vérifier `type === 'PREMIUM'`
- ✅ Module `subscriptions.ts` mis à jour avec `z.enum(['PREMIUM'])`
- ✅ Fichier `seed.ts` mis à jour avec le plan Premium unique
- ✅ Composant `subscription.component.ts` optimisé pour un plan unique
- ✅ Backend compilé sans erreurs (`npm run build`)
- ✅ Client Prisma régénéré (`npx prisma generate`)

---

## 📚 Fichiers Modifiés

### Backend

| Fichier | Modification |
|---------|--------------|
| `prisma/schema.prisma` | `enum SubscriptionType { PREMIUM }` |
| `src/middleware/subscription-access.ts` | Vérification `type === 'PREMIUM'` |
| `src/modules/auth.ts` | Fonction `getUserPublic()` retourne abonnement actif |
| `src/modules/lessons.ts` | Vérification `subscription.plan.type === 'PREMIUM'` |
| `src/modules/subscriptions.ts` | `z.enum(['PREMIUM'])` |
| `src/seed.ts` | Création du plan Premium unique |

### Frontend

| Fichier | Modification |
|---------|--------------|
| `src/app/services/auth.service.ts` | `subscription: { type: 'PREMIUM' }` |
| `src/app/app.routes.ts` | `subscriptionGuard` sur `/catalog` et `/course/:id` |
| `src/app/pages/subscription/subscription.component.ts` | Affichage d'un plan unique centré |

---

## 🎓 Résumé

### Avant (3 Plans)

- ❌ Vidéos Seulement (650 MRU/an)
- ❌ Documents Seulement (500 MRU/an)
- ❌ Accès Complet (1000 MRU/an)

### Après (1 Plan)

- ✅ **Premium** (500 MRU/an) - Accès à **TOUT**

### Avantages

1. **Simplicité** - Un seul choix pour les utilisateurs
2. **Prix compétitif** - 500 MRU pour tout le contenu
3. **Meilleure conversion** - Pas de confusion entre plans
4. **Gestion facilitée** - Un seul type d'abonnement à gérer
5. **Expérience unifiée** - Tous les abonnés ont les mêmes droits

---

**Version** : 2.0 - Système Premium Unique
**Date** : 15 octobre 2025
**Système** : Archify - Plateforme ISCAE
**Type d'Abonnement** : PREMIUM (Accès Complet)
