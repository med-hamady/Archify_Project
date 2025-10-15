# ⚡ Test Rapide : Workflow Complet Nouvel Utilisateur

## 🎯 Test en 5 Minutes

### ✅ Étape 1 : Créer un Nouvel Utilisateur

1. **Ouvrir le navigateur** : `http://localhost:4200/register`
2. **Remplir le formulaire** :
   - Email : `test@iscae.mr`
   - Mot de passe : `Test123!`
   - Nom : `Test Utilisateur`
   - Semestre : `S1`
3. **Cliquer** : "S'inscrire"

**Résultat attendu** :
- ✅ Redirection vers le tableau de bord
- ✅ Message de bienvenue
- ⚠️ **PAS d'accès aux cours** (pas d'abonnement)

---

### ✅ Étape 2 : Tenter d'Accéder aux Vidéos

1. **Cliquer sur** : "Catalogue des cours" (dans le menu)
   OU directement : `http://localhost:4200/catalog`

**Résultat attendu** :
- ❌ **Accès BLOQUÉ**
- 🔀 **Redirection AUTOMATIQUE vers** : `/subscription`
- ✅ Page "Tarifs" s'affiche

---

### ✅ Étape 3 : Voir le Plan Premium

**Sur la page `/subscription`** :

**Résultat attendu** :
```
┌────────────────────────────┐
│  ⭐ Abonnement Premium     │
│                            │
│        Premium             │
│                            │
│       500 MRU              │
│        /an                 │
│                            │
│  ✅ Accès vidéos          │
│  ✅ Accès documents       │
│  ✅ Support prioritaire   │
│                            │
│  [Choisir Premium] ────→  │
└────────────────────────────┘
```

**Cliquer sur** : "Choisir Premium"

**Résultat attendu** :
- ✅ Redirection vers `/payment/submit?planId=premium-plan`

---

### ✅ Étape 4 : Soumettre un Paiement

**Sur la page `/payment/submit`** :

1. **Sélectionner** : Bankily
2. **Entrer** :
   - Numéro téléphone : `22234567`
   - Numéro transaction : `TEST123456789`
3. **Upload** : Capture d'écran (n'importe quelle image)
4. **Cliquer** : "Soumettre le paiement"

**Résultat attendu** :
- ✅ Message : "Paiement soumis avec succès"
- ✅ Redirection vers `/my-payments`
- ✅ Paiement visible avec statut : **⏳ EN ATTENTE**

**⚠️ IMPORTANT** :
- ❌ **Toujours PAS d'accès aux vidéos**
- ❌ Si vous essayez d'aller sur `/catalog` → Toujours redirigé vers `/subscription`
- ⏳ **Attente de validation admin**

---

### ✅ Étape 5 : Validation Admin

**Ouvrir un nouvel onglet** :

1. **Se déconnecter** (si nécessaire)
2. **Se connecter en tant qu'admin** : `http://localhost:4200/login`
   - Email : `admin@archify.ma`
   - Mot de passe : `admin123`

3. **Aller sur** : `/admin/payments`
   OU **Cliquer sur** : "Gérer les Paiements" (dans le tableau de bord admin)

4. **Vérifier** : Le paiement de `test@iscae.mr` apparaît
   - Statut : ⏳ EN ATTENTE
   - Montant : 500 MRU
   - Transaction : TEST123456789

5. **Cliquer sur** : "Voir capture d'écran" (vérifier l'image)

6. **Cliquer sur** : "✅ Valider"

**Résultat attendu** :
- ✅ Message : "Paiement validé avec succès"
- ✅ Statut change : **✅ VALIDÉ**
- ✅ **Abonnement Premium créé AUTOMATIQUEMENT** pour `test@iscae.mr`

---

### ✅ Étape 6 : Rafraîchir en tant qu'Utilisateur

**Retour sur l'onglet utilisateur** :

1. **Rafraîchir la page** (F5)
   OU
2. **Se déconnecter et se reconnecter**

**Vérifier l'abonnement** :
- **Aller sur** : `/dashboard`
- **Chercher** : Badge "Premium" ou "Abonné"
- **Vérifier** : Date d'expiration (dans 1 an)

---

### ✅ Étape 7 : Accéder aux Vidéos

**Maintenant, essayer d'accéder aux cours** :

1. **Cliquer sur** : "Catalogue des cours"
   OU : `http://localhost:4200/catalog`

**Résultat attendu** :
- ✅ **Accès AUTORISÉ**
- ✅ **Page catalogue s'affiche**
- ✅ **Liste des cours visible**

2. **Cliquer sur un cours**

**Résultat attendu** :
- ✅ **Page du cours s'affiche**
- ✅ **Liste des leçons visible**

3. **Cliquer sur une leçon vidéo**

**Résultat attendu** :
- ✅ **Page de la leçon s'affiche**
- ✅ **Player vidéo visible**
- ✅ **Vidéo se charge et se lit** 🎉

---

## 🔍 Points de Vérification

### Avant Validation Admin

| Test | Résultat Attendu |
|------|------------------|
| Accès `/catalog` | ❌ Redirigé vers `/subscription` |
| Accès `/course/:id` | ❌ Redirigé vers `/subscription` |
| Accès `/lesson/:id` | ❌ Redirigé vers `/subscription` |
| Voir plan Premium | ✅ Visible sur `/subscription` |
| Soumettre paiement | ✅ Créé avec statut PENDING |

### Après Validation Admin

| Test | Résultat Attendu |
|------|------------------|
| Accès `/catalog` | ✅ Page affichée |
| Accès `/course/:id` | ✅ Page affichée |
| Accès `/lesson/:id` | ✅ Page affichée |
| Vidéos | ✅ Se lisent normalement |
| Documents | ✅ Accessibles |
| Badge "Premium" | ✅ Visible dans dashboard |

---

## 🛠️ Vérification Console

### Console Frontend (F12)

**Avant validation** :
```javascript
// Dans la console
localStorage.getItem('archify_user')
// Résultat : "subscription": null
```

**Après validation et rafraîchissement** :
```javascript
// Dans la console
localStorage.getItem('archify_user')
// Résultat : "subscription": {"type":"PREMIUM","isActive":true,...}
```

### Console Backend

**Logs lors de la validation** :
```
✅ Payment validated: clpayment123...
🎉 Subscription created: clsub123...
   - User: test@iscae.mr
   - Plan: Premium
   - Status: ACTIVE
   - Expires: 2026-10-15
```

**Logs lors de l'accès vidéo** :
```
🔐 ===== CHECKING VIDEO ACCESS =====
  User ID: clxyz123...
  User Role: STUDENT
  Checking subscription...
✅ ACCESS GRANTED - Active subscription found
```

---

## ❌ Tests d'Échec (Comportement Attendu)

### Test 1 : Accès Sans Connexion
1. **Se déconnecter**
2. **Essayer d'aller sur** : `/catalog`

**Résultat** :
- ❌ Redirigé vers `/auth` (page de connexion)

### Test 2 : Accès Vidéo Directe Sans Abonnement
1. **Créer un nouvel utilisateur** (sans payer)
2. **Ouvrir directement** : `http://localhost:3000/uploads/videos/test.mp4`

**Résultat** :
- ❌ Erreur 401 ou 403
- ❌ Message : "Active subscription required"

### Test 3 : Accès Après Expiration
1. **Dans la base de données, modifier** : `subscription.endAt` → date passée
2. **Rafraîchir**
3. **Essayer d'accéder** : `/catalog`

**Résultat** :
- ❌ Redirigé vers `/subscription`
- ❌ Abonnement considéré comme expiré

---

## 📊 Vérification Base de Données

### Vérifier l'abonnement créé

```sql
-- Dans PostgreSQL
SELECT
  u.email,
  u.name,
  s.status,
  s.startAt,
  s.endAt,
  sp.name as plan_name,
  sp.priceCents / 100 as price
FROM "User" u
JOIN "Subscription" s ON u.id = s.userId
JOIN "SubscriptionPlan" sp ON s.planId = sp.id
WHERE u.email = 'test@iscae.mr';
```

**Résultat attendu** :
```
email          | name             | status | startAt    | endAt      | plan_name | price
---------------|------------------|--------|------------|------------|-----------|------
test@iscae.mr  | Test Utilisateur | ACTIVE | 2025-10-15 | 2026-10-15 | Premium   | 500
```

### Vérifier le paiement validé

```sql
SELECT
  p.status,
  p.amountCents / 100 as amount,
  p.provider,
  p.providerRef,
  p.validatedAt,
  s.id as subscription_id
FROM "Payment" p
LEFT JOIN "Subscription" s ON p.subscriptionId = s.id
WHERE p.userId = (SELECT id FROM "User" WHERE email = 'test@iscae.mr');
```

**Résultat attendu** :
```
status    | amount | provider | providerRef    | validatedAt         | subscription_id
----------|--------|----------|----------------|---------------------|----------------
COMPLETED | 500    | BANKILY  | TEST123456789  | 2025-10-15 14:35:00 | clsub123...
```

---

## ✅ Checklist Complète

- [ ] Nouvel utilisateur créé
- [ ] Accès catalogue **bloqué** avant paiement
- [ ] Redirection automatique vers `/subscription`
- [ ] Plan Premium visible (500 MRU)
- [ ] Paiement soumis avec succès
- [ ] Statut "EN ATTENTE" visible
- [ ] Vidéos toujours **bloquées** en attente validation
- [ ] Admin peut voir le paiement
- [ ] Admin valide le paiement
- [ ] Abonnement créé **automatiquement**
- [ ] Utilisateur rafraîchit la page
- [ ] Accès catalogue **débloqué**
- [ ] Vidéos **accessibles** et se lisent
- [ ] Badge "Premium" visible

---

## 🎉 Résultat Final

Si tous les tests passent :
- ✅ Le système fonctionne **parfaitement**
- ✅ La protection est **efficace**
- ✅ Le workflow est **fluide**
- ✅ L'activation est **automatique**

---

**Durée du test** : ~5 minutes
**Difficulté** : Facile
**Prérequis** : Backend et frontend en cours d'exécution
