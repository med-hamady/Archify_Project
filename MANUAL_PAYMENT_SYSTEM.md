# Système de Paiement Manuel - Documentation Complète

## Vue d'ensemble

Un système complet de paiement manuel a été implémenté pour permettre aux utilisateurs de souscrire à des abonnements via Bankily, Masrivi ou Sedad, avec validation administrateur.

## Architecture du Système

### Backend (Node.js/Express + Prisma)

#### 1. Modèle de données (`backend/prisma/schema.prisma`)

Le modèle `Payment` a été étendu pour supporter les paiements manuels :

```prisma
model Payment {
  id             String        @id @default(cuid())
  user           User          @relation(fields: [userId], references: [id])
  userId         String
  subscription   Subscription?  @relation(fields: [subscriptionId], references: [id])
  subscriptionId String?       // Optionnel - créé après validation
  planId         String        // ID du plan acheté
  provider       PaymentProvider
  providerRef    String        // Numéro de transaction
  phoneNumber    String        // Numéro de téléphone du payeur
  amountCents    Int
  currency       String        @default("MRU")
  status         PaymentStatus @default(PENDING)
  screenshotUrl  String?       // URL de la capture d'écran
  adminNotes     String?       // Notes de l'admin
  validatedBy    String?       // ID de l'admin qui a validé
  validatedAt    DateTime?     // Date de validation
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

#### 2. API Endpoints (`backend/src/modules/manual-payments.ts`)

##### Routes Client :

- **POST `/api/manual-payments`** - Soumettre un paiement
  - Authentification requise
  - Upload de capture d'écran (max 5MB, formats: JPG, PNG, GIF, WEBP)
  - Paramètres : planId, provider, providerRef, phoneNumber, amountCents
  - Statut initial : PENDING

- **GET `/api/manual-payments/my-payments`** - Voir ses propres paiements
  - Authentification requise
  - Retourne l'historique complet avec détails du plan

##### Routes Admin :

- **GET `/api/manual-payments`** - Lister tous les paiements
  - Authentification admin requise
  - Filtrage par statut (optionnel)
  - Pagination (page, limit)

- **PUT `/api/manual-payments/:id/validate`** - Valider un paiement
  - Authentification admin requise
  - Crée automatiquement un abonnement actif de 1 an
  - Transaction atomique (payment + subscription)
  - Paramètres : adminNotes (optionnel)

- **PUT `/api/manual-payments/:id/reject`** - Rejeter un paiement
  - Authentification admin requise
  - Paramètres : adminNotes (requis pour expliquer le rejet)

#### 3. Configuration Multer

```javascript
// Stockage des captures d'écran
const storage = multer.diskStorage({
  destination: 'backend/uploads/payment-screenshots',
  filename: 'payment-{timestamp}-{random}.{ext}'
});

// Validation
- Taille max : 5MB
- Types acceptés : jpeg, jpg, png, gif, webp
```

### Frontend (Angular 20)

#### 1. Composants Créés

##### A. Formulaire de Paiement (`frontend/src/app/pages/payment/payment-form.component.ts`)

**Route** : `/payment/submit?planId={id}`

**Fonctionnalités** :
- Sélection de la méthode de paiement (Bankily/Masrivi/Sedad)
- Saisie du numéro de téléphone
- Saisie du numéro de transaction
- Upload de capture d'écran
- Validation en temps réel
- Instructions claires pour l'utilisateur
- Redirection vers le suivi des paiements après soumission

**Flux utilisateur** :
1. L'utilisateur clique sur un plan d'abonnement
2. Redirection vers `/payment/submit` avec l'ID du plan
3. Formulaire de paiement avec instructions
4. Soumission avec capture d'écran
5. Message de succès + lien vers le suivi

##### B. Suivi des Paiements (`frontend/src/app/pages/payment/my-payments.component.ts`)

**Route** : `/my-payments`

**Fonctionnalités** :
- Liste de tous les paiements de l'utilisateur
- Badges de statut colorés (Pending/Completed/Failed)
- Détails complets de chaque paiement
- Visualisation de la capture d'écran
- Notes de l'administrateur (si rejeté)
- Vue en plein écran des captures

**Statuts** :
- 🟡 **PENDING** : En attente de validation
- 🟢 **COMPLETED** : Validé - Abonnement activé
- 🔴 **FAILED** : Rejeté - Voir les notes admin

##### C. Interface Admin (`frontend/src/app/pages/admin/admin-payments.component.ts`)

**Route** : `/admin/payments`

**Fonctionnalités** :
- Tableau complet de tous les paiements
- Filtrage par statut
- Statistiques en temps réel (Pending/Completed/Failed)
- Pagination
- Actions rapides (Voir/Valider/Rejeter)
- Modal de détails avec :
  - Informations utilisateur complètes
  - Détails du paiement
  - Visualisation de la capture d'écran
  - Champ de notes administrateur
  - Boutons de validation/rejet

**Flux administrateur** :
1. Accéder à `/admin/payments`
2. Voir les paiements en attente (surlignés en jaune)
3. Cliquer sur "Voir" pour ouvrir les détails
4. Examiner la capture d'écran du paiement
5. Ajouter des notes (optionnel pour validation, requis pour rejet)
6. Cliquer sur "Valider" ou "Rejeter"
7. L'abonnement est automatiquement créé si validé

#### 2. Modification du Composant Abonnement

**Fichier** : `frontend/src/app/pages/subscription/subscription.component.ts`

**Changement** :
```typescript
// AVANT : Création directe d'abonnement (temporaire)
selectPlan(planId: string) {
  this.subscribeDirectly(planId);
}

// APRÈS : Redirection vers le formulaire de paiement
selectPlan(planId: string) {
  this.router.navigate(['/payment/submit'], { queryParams: { planId } });
}
```

#### 3. Routes Ajoutées

**Fichier** : `frontend/src/app/app.routes.ts`

```typescript
{
  path: 'payment/submit',
  loadComponent: () => import('./pages/payment/payment-form.component').then(m => m.PaymentFormComponent),
  canActivate: [authGuard]
},
{
  path: 'my-payments',
  loadComponent: () => import('./pages/payment/my-payments.component').then(m => m.MyPaymentsComponent),
  canActivate: [authGuard]
},
{
  path: 'admin/payments',
  loadComponent: () => import('./pages/admin/admin-payments.component').then(m => m.AdminPaymentsComponent),
  canActivate: [authGuard, roleGuard(['admin', 'superadmin'])]
}
```

## Flux Complet du Système

### 1. Souscription Utilisateur

```
Utilisateur visite /subscription
  ↓
Clique sur un plan (ex: "Vidéos uniquement")
  ↓
Redirection vers /payment/submit?planId={id}
  ↓
Remplit le formulaire :
  - Méthode de paiement (Bankily/Masrivi/Sedad)
  - Numéro de téléphone
  - Numéro de transaction
  - Upload capture d'écran
  ↓
Soumet le formulaire
  ↓
Backend crée Payment (status: PENDING)
  ↓
Message de succès affiché
  ↓
Utilisateur peut suivre le statut sur /my-payments
```

### 2. Validation Admin

```
Admin visite /admin/payments
  ↓
Voit les paiements en attente (surlignés)
  ↓
Clique sur "Voir détails"
  ↓
Examine :
  - Informations utilisateur
  - Détails du paiement
  - Capture d'écran
  ↓
Décision :

SI VALIDE :
  ↓
  Ajoute notes (optionnel)
  ↓
  Clique "Valider le paiement"
  ↓
  Backend crée automatiquement :
    - Subscription (status: ACTIVE, durée: 1 an)
    - Mise à jour Payment (status: COMPLETED)
  ↓
  L'utilisateur peut maintenant accéder aux vidéos

SI REJETÉ :
  ↓
  Ajoute notes expliquant le rejet (requis)
  ↓
  Clique "Rejeter le paiement"
  ↓
  Backend met à jour Payment (status: FAILED)
  ↓
  L'utilisateur voit le rejet + notes sur /my-payments
```

## Sécurité

### Backend

1. **Authentification** : Tous les endpoints requièrent un JWT valide
2. **Autorisation** : Les routes admin vérifient le rôle (ADMIN/SUPERADMIN)
3. **Validation** : Zod schemas pour valider toutes les entrées
4. **Upload** :
   - Taille limitée à 5MB
   - Types de fichiers restreints
   - Noms de fichiers randomisés
   - Stockage sécurisé
5. **Transaction atomique** : Création subscription + update payment en une transaction

### Frontend

1. **Guards** :
   - `authGuard` : Vérifie l'authentification
   - `roleGuard` : Vérifie les permissions admin
2. **Validation** :
   - Validation côté client avant soumission
   - Messages d'erreur clairs
3. **Sanitization** : Angular sanitize automatiquement les inputs

## Stockage des Fichiers

```
backend/
  uploads/
    payment-screenshots/
      payment-1760444682949-123456789.jpg
      payment-1760444723123-987654321.png
      ...
```

**Format des noms** : `payment-{timestamp}-{random}.{extension}`

**Accès** :
- Les captures sont servies via `/uploads/payment-screenshots/{filename}`
- Accessible uniquement par l'utilisateur propriétaire et les admins

## Base de Données

### Migration Appliquée

```bash
npx prisma migrate dev --name add_payment_manual_fields
```

**Changements** :
- `subscriptionId` → optionnel (créé après validation)
- Ajout : `planId`, `phoneNumber`, `screenshotUrl`
- Ajout : `adminNotes`, `validatedBy`, `validatedAt`
- Ajout : `updatedAt` (timestamp automatique)

## Testing

### Tester le Flux Complet

1. **En tant qu'utilisateur** :
   ```
   1. Créer un compte étudiant
   2. Aller sur /subscription
   3. Cliquer sur un plan
   4. Remplir le formulaire de paiement
   5. Soumettre avec une capture d'écran
   6. Vérifier sur /my-payments (statut: PENDING)
   ```

2. **En tant qu'admin** :
   ```
   1. Se connecter avec compte admin
   2. Aller sur /admin/payments
   3. Voir le paiement en attente
   4. Cliquer sur "Voir détails"
   5. Examiner la capture
   6. Valider le paiement
   ```

3. **Retour utilisateur** :
   ```
   1. Retourner sur /my-payments
   2. Voir le statut : COMPLETED
   3. Essayer d'accéder à une vidéo
   4. Vérifier que l'accès est autorisé
   ```

### Tester le Rejet

1. Suivre le même flux mais rejeter le paiement
2. Ajouter des notes expliquant le rejet
3. Vérifier que l'utilisateur voit les notes sur /my-payments

## Améliorations Futures Possibles

1. **Notifications Email** :
   - Notification admin lors d'un nouveau paiement
   - Notification utilisateur lors de la validation/rejet

2. **Dashboard Analytics** :
   - Statistiques de paiements par méthode
   - Revenus mensuels
   - Taux de validation/rejet

3. **Recherche et Filtres** :
   - Recherche par utilisateur, email
   - Filtres par date
   - Filtres par méthode de paiement

4. **Export** :
   - Export CSV des paiements
   - Génération de rapports PDF

5. **Notifications Push** :
   - Notifier l'admin en temps réel
   - Notifier l'utilisateur sur mobile

6. **Intégration API** :
   - Vérification automatique via API des opérateurs
   - Validation automatique si possible

## Support

Pour toute question ou problème :
- Backend : Vérifier les logs dans `backend/dist/`
- Frontend : Ouvrir la console du navigateur
- Base de données : Utiliser Prisma Studio (`npx prisma studio`)

## État Actuel

✅ **Backend** : Complètement implémenté et fonctionnel
✅ **Frontend** : Tous les composants créés
✅ **Routes** : Configurées et protégées
✅ **Base de données** : Migration appliquée
✅ **Upload** : Multer configuré et fonctionnel

Le système est **prêt à être utilisé en production** !
