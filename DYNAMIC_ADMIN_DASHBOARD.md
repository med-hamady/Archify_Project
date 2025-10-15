# 📊 Tableau de Bord Admin Dynamique - Documentation

## 🎯 Objectif

Rendre le tableau de bord admin dynamique en récupérant les statistiques en temps réel depuis la base de données au lieu d'afficher des valeurs statiques.

---

## ✅ Fonctionnalités Implémentées

### 1. Endpoint Backend - Statistiques du Tableau de Bord

**Route** : `GET /api/admin/dashboard-stats`
**Fichier** : `backend/src/modules/admin.ts` (lignes 304-419)
**Authentification** : Requiert un rôle ADMIN ou SUPERADMIN

#### Statistiques Calculées

| Métrique | Description | Calcul |
|----------|-------------|--------|
| **Total Cours** | Nombre total de cours créés | `COUNT(courses)` |
| **Total Utilisateurs** | Nombre d'étudiants inscrits | `COUNT(users WHERE role = 'STUDENT')` |
| **Abonnements Actifs** | Abonnements actuellement actifs | `COUNT(subscriptions WHERE status = 'ACTIVE' AND endAt > NOW())` |
| **Revenus Totaux** | Revenus totaux en MRU | `SUM(payments.amountCents WHERE status = 'COMPLETED') / 100` |

#### Calcul de Croissance (Mensuel)

Pour chaque métrique, la croissance est calculée en comparant avec le mois dernier :

```typescript
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

// Exemple: Croissance des cours
const coursesLastMonth = await prisma.course.count({
  where: { createdAt: { lt: lastMonth } }
});

const coursesGrowth = coursesLastMonth > 0
  ? Math.round(((totalCourses - coursesLastMonth) / coursesLastMonth) * 100)
  : totalCourses > 0 ? 100 : 0;
```

**Formule** : `((valeur_actuelle - valeur_mois_dernier) / valeur_mois_dernier) * 100`

#### Réponse JSON

```json
{
  "totalCourses": 5,
  "totalUsers": 12,
  "activeSubscriptions": 3,
  "totalRevenueMRU": 1500,
  "growth": {
    "courses": 25,
    "users": 50,
    "subscriptions": 100,
    "revenue": 33
  }
}
```

---

### 2. Frontend - Intégration des Données Dynamiques

**Fichier** : `frontend/src/app/pages/admin/admin-enhanced.component.ts`

#### Modifications Apportées

##### A. Signal `stats` Étendu (lignes 1341-1354)

```typescript
stats = signal({
  totalCourses: 0,
  totalUsers: 0,
  totalLessons: 0,
  activeSubscriptions: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  userGrowth: 0,
  courseViews: 0,
  coursesGrowth: 0,        // Nouveau
  usersGrowth: 0,          // Nouveau
  subscriptionsGrowth: 0,  // Nouveau
  revenueGrowth: 0         // Nouveau
});
```

##### B. Méthode `loadData()` Mise à Jour (lignes 1508-1528)

```typescript
loadData() {
  // Load dashboard statistics from new API endpoint
  this.http.get<any>(`${this.API_URL}/admin/dashboard-stats`).subscribe({
    next: (data) => {
      console.log('📊 Dashboard stats loaded:', data);
      this.stats.set({
        totalCourses: data.totalCourses || 0,
        totalUsers: data.totalUsers || 0,
        totalLessons: 0,
        activeSubscriptions: data.activeSubscriptions || 0,
        totalRevenue: data.totalRevenueMRU || 0,
        monthlyRevenue: 0,
        userGrowth: 0,
        courseViews: 0,
        coursesGrowth: data.growth?.courses || 0,
        usersGrowth: data.growth?.users || 0,
        subscriptionsGrowth: data.growth?.subscriptions || 0,
        revenueGrowth: data.growth?.revenue || 0
      });
    },
    error: (error) => console.error('❌ Error loading dashboard stats:', error)
  });

  // ... autres chargements de données
}
```

##### C. Template - Affichage Dynamique de la Croissance

**Total Cours** (ligne 134) :
```html
<p class="text-xs text-blue-500 mt-2 flex items-center">
  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fill-rule="evenodd" d="..."/>
  </svg>
  {{ stats().coursesGrowth >= 0 ? '+' : '' }}{{ stats().coursesGrowth }}% ce mois
</p>
```

**Total Utilisateurs** (ligne 156) :
```html
{{ stats().usersGrowth >= 0 ? '+' : '' }}{{ stats().usersGrowth }}% ce mois
```

**Abonnements Actifs** (ligne 178) :
```html
{{ stats().subscriptionsGrowth >= 0 ? '+' : '' }}{{ stats().subscriptionsGrowth }}% ce mois
```

**Revenus Totaux** (ligne 200) :
```html
{{ stats().revenueGrowth >= 0 ? '+' : '' }}{{ stats().revenueGrowth }}% ce mois
```

---

## 🔄 Flux d'Exécution

```
1. Admin ouvre /admin (tableau de bord)
   ↓
2. ngOnInit() appelle loadData()
   ↓
3. HTTP GET /api/admin/dashboard-stats
   ↓
4. Backend vérifie authentification (requireAuth)
   ↓
5. Backend vérifie rôle (ADMIN ou SUPERADMIN)
   ↓
6. Backend exécute requêtes Prisma :
   - COUNT courses
   - COUNT users (role = STUDENT)
   - COUNT active subscriptions
   - SUM payments (status = COMPLETED)
   - COUNT historique mois dernier pour chaque métrique
   ↓
7. Backend calcule les pourcentages de croissance
   ↓
8. Backend retourne JSON avec stats + growth
   ↓
9. Frontend reçoit les données
   ↓
10. stats.set() met à jour le signal
    ↓
11. Template se rafraîchit automatiquement (Angular signals)
    ↓
12. Cartes affichent les valeurs réelles de la BD
```

---

## 📊 Exemple de Données Réelles

Supposons la base de données actuelle :

| Métrique | Valeur Actuelle | Valeur Mois Dernier | Croissance |
|----------|-----------------|---------------------|------------|
| Cours | 8 | 6 | +33% |
| Utilisateurs | 25 | 20 | +25% |
| Abonnements | 5 | 3 | +66% |
| Revenus | 2500 MRU | 1500 MRU | +66% |

### Affichage dans le Tableau de Bord

```
┌─────────────────────────────┐
│   Total Cours              │
│   8                         │
│   📈 +33% ce mois          │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Total Utilisateurs       │
│   25                        │
│   📈 +25% ce mois          │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Abonnements Actifs       │
│   5                         │
│   📈 +66% ce mois          │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Revenus Totaux           │
│   MRU2,500                  │
│   📈 +66% ce mois          │
└─────────────────────────────┘
```

---

## 🔒 Sécurité

### Protection de l'Endpoint

```typescript
adminRouter.get('/dashboard-stats', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Only admin can view dashboard stats'
      }
    });
  }
  // ...
});
```

**Vérifications** :
1. ✅ Token JWT valide (via `requireAuth` middleware)
2. ✅ Rôle ADMIN ou SUPERADMIN
3. ✅ Retourne 403 Forbidden si non autorisé

---

## 🧪 Tests de Vérification

### Test 1 : Données Réelles Affichées

1. **Se connecter en tant qu'admin**
2. **Accéder à** : `http://localhost:4200/admin`
3. **Vérifier** :
   - ✅ Total Cours affiche le nombre réel de cours dans la BD
   - ✅ Total Utilisateurs affiche le nombre d'étudiants
   - ✅ Abonnements Actifs affiche les abonnements actifs uniquement
   - ✅ Revenus Totaux affiche la somme des paiements complétés

**Console Frontend (Logs attendus)** :
```javascript
📊 Dashboard stats loaded: {
  totalCourses: 5,
  totalUsers: 12,
  activeSubscriptions: 3,
  totalRevenueMRU: 1500,
  growth: { courses: 0, users: 0, subscriptions: 0, revenue: 0 }
}
```

---

### Test 2 : Croissance Calculée Correctement

**Scénario** : Ajouter un nouveau cours pour tester la croissance

1. **Noter les stats actuelles** (ex: 5 cours)
2. **Créer un nouveau cours**
3. **Rafraîchir le tableau de bord** (F5)
4. **Vérifier** :
   - ✅ Total Cours = 6
   - ✅ Croissance affichée (dépend de la date de création)

**Note** : La croissance est calculée par rapport au mois dernier. Si tous les cours ont été créés ce mois-ci, la croissance sera de 100% (ou 0% si aucun cours n'existait le mois dernier).

---

### Test 3 : Authentification Requise

1. **Se déconnecter**
2. **Essayer d'accéder à** : `http://localhost:3000/api/admin/dashboard-stats`
3. **Vérifier** :
   - ✅ Retourne 401 Unauthorized

**Réponse attendue** :
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid token"
  }
}
```

---

### Test 4 : Rôle Admin Requis

1. **Se connecter en tant qu'étudiant** (rôle STUDENT)
2. **Essayer d'accéder à l'endpoint via API** : `GET /api/admin/dashboard-stats`
3. **Vérifier** :
   - ✅ Retourne 403 Forbidden

**Réponse attendue** :
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only admin can view dashboard stats"
  }
}
```

---

## 📂 Fichiers Modifiés

### Backend

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `backend/src/modules/admin.ts` | 304-419 | Nouveau endpoint GET /dashboard-stats |

### Frontend

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `frontend/src/app/pages/admin/admin-enhanced.component.ts` | 1341-1354 | Signal stats étendu |
| `frontend/src/app/pages/admin/admin-enhanced.component.ts` | 1508-1528 | Appel API dashboard-stats |
| `frontend/src/app/pages/admin/admin-enhanced.component.ts` | 1540 | Correction endpoint users (/admin/users) |
| `frontend/src/app/pages/admin/admin-enhanced.component.ts` | 134, 156, 178, 200 | Affichage dynamique croissance |
| `frontend/src/app/pages/admin/admin-enhanced.component.ts` | 1590-1606 | updateStats() avec propriétés growth |

---

## 🎨 Affichage Visuel

### Carte de Statistique

```html
┌───────────────────────────────────────────┐
│  📘  Total Cours                         │
│                                           │
│      5                                    │
│      📈 +25% ce mois                     │
│                                           │
│      [Icône de livre]                    │
└───────────────────────────────────────────┘
```

**Couleurs** :
- 🔵 Bleu : Total Cours
- 🟢 Vert : Total Utilisateurs
- 🟣 Violet : Abonnements Actifs
- 🟠 Orange : Revenus Totaux

**Effets** :
- Hover : Agrandissement (scale 1.05)
- Cliquable : Redirection vers l'onglet correspondant
- Ombre portée dynamique

---

## 📈 Calcul de Croissance - Exemples

### Exemple 1 : Croissance Positive

```
Cours actuels = 10
Cours mois dernier = 8
Croissance = ((10 - 8) / 8) * 100 = 25%
Affichage : +25% ce mois
```

### Exemple 2 : Décroissance

```
Utilisateurs actuels = 15
Utilisateurs mois dernier = 20
Croissance = ((15 - 20) / 20) * 100 = -25%
Affichage : -25% ce mois
```

### Exemple 3 : Premier Mois (Pas de Données Historiques)

```
Revenus actuels = 1500 MRU
Revenus mois dernier = 0 MRU
Croissance = 100% (ou 0% selon la logique)
Affichage : +100% ce mois
```

**Logique Backend** :
```typescript
const growth = lastMonthValue > 0
  ? Math.round(((currentValue - lastMonthValue) / lastMonthValue) * 100)
  : currentValue > 0 ? 100 : 0;
```

---

## 🔄 Actualisation des Données

### Automatique
- ❌ **Pas encore implémenté** : Polling ou WebSocket pour refresh automatique
- ✅ **Actuel** : Refresh manuel (F5) ou navigation entre onglets

### Manuel
- Recharger la page (F5)
- Naviguer vers un autre onglet puis revenir à "Vue d'ensemble"

### Future Amélioration (Optionnel)

Ajouter un bouton "Actualiser" ou un polling toutes les 30 secondes :

```typescript
ngOnInit() {
  this.loadData();

  // Refresh every 30 seconds
  setInterval(() => {
    this.loadData();
  }, 30000);
}
```

---

## 🐛 Debugging

### Logs Backend

L'endpoint affiche des logs en cas d'erreur :

```typescript
catch (err: any) {
  console.error('Error fetching dashboard stats:', err);
  return res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal error'
    }
  });
}
```

### Logs Frontend

Vérifier la console du navigateur :

```javascript
// Succès
📊 Dashboard stats loaded: { totalCourses: 5, ... }

// Erreur
❌ Error loading dashboard stats: HttpErrorResponse { ... }
```

### Vérification Base de Données

Pour vérifier manuellement les calculs :

```sql
-- Total Cours
SELECT COUNT(*) FROM "Course";

-- Total Utilisateurs (Étudiants)
SELECT COUNT(*) FROM "User" WHERE role = 'STUDENT';

-- Abonnements Actifs
SELECT COUNT(*) FROM "Subscription"
WHERE status = 'ACTIVE' AND "endAt" > NOW();

-- Revenus Totaux (en centimes)
SELECT SUM("amountCents") FROM "Payment" WHERE status = 'COMPLETED';

-- Cours créés le mois dernier
SELECT COUNT(*) FROM "Course"
WHERE "createdAt" < (NOW() - INTERVAL '1 month');
```

---

## ✅ Résultat Final

Après ces modifications :

1. ✅ Le tableau de bord affiche les données réelles de la base de données
2. ✅ Les statistiques sont calculées côté backend avec Prisma
3. ✅ Les pourcentages de croissance sont calculés automatiquement
4. ✅ L'interface se met à jour automatiquement grâce aux signals Angular
5. ✅ L'endpoint est protégé (authentification + autorisation)
6. ✅ Les données sont affichées avec formatage approprié (MRU pour les revenus, etc.)

---

## 🚀 Prochaines Étapes (Optionnel)

1. **Graphiques de tendances** : Ajouter des graphiques pour visualiser l'évolution
2. **Période personnalisable** : Permettre de choisir la période (semaine, mois, année)
3. **Export de données** : Permettre d'exporter les stats en CSV/PDF
4. **Notifications** : Alerter l'admin en cas de chute significative
5. **Comparaison année précédente** : Comparer avec l'année dernière

---

**Version** : 1.0
**Date** : 15 octobre 2025
**Statut** : ✅ Implémenté et fonctionnel
**Technique** : Backend (Prisma + PostgreSQL) + Frontend (Angular Signals)
