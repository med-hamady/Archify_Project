# 🔐 Créer un Compte Administrateur

**Date** : 16 octobre 2025
**Objectif** : Créer un compte admin pour accéder à l'interface d'administration

---

## 📋 Méthode Recommandée

### Étape 1 : Créer un Compte Normal

1. **Ouvrir** : https://archify-project.vercel.app
2. **Cliquer** sur "S'inscrire" ou "Inscription"
3. **Remplir le formulaire** :
   - Email : `admin@iscae.ma` (ou votre email)
   - Nom : `Admin ISCAE`
   - Mot de passe : *Choisissez un mot de passe fort*
4. **Soumettre** le formulaire
5. **Noter** l'email utilisé (vous en aurez besoin pour l'étape suivante)

---

### Étape 2 : Promouvoir le Compte en Admin

Vous devez **modifier la base de données** pour changer le rôle de l'utilisateur de `STUDENT` à `ADMIN`.

---

## 🔧 Option A : Via l'Interface Render (Recommandé si Plan Payant)

### Prérequis
- Compte Render avec plan payant (Shell n'est pas disponible en plan gratuit)

### Étapes

1. **Aller sur Render Dashboard** : https://dashboard.render.com
2. **Sélectionner** : `archify-db` (votre base de données PostgreSQL)
3. **Cliquer** : "Shell" (en haut à droite)
4. **Exécuter** la commande suivante :

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'admin@iscae.ma';
```

**Remplacez** `admin@iscae.ma` par l'email que vous avez utilisé à l'étape 1.

5. **Vérifier** que la mise à jour a réussi :

```sql
SELECT id, email, name, role FROM "User" WHERE email = 'admin@iscae.ma';
```

**Résultat attendu** :
```
id  | email             | name        | role
----|-------------------|-------------|------
xxx | admin@iscae.ma    | Admin ISCAE | ADMIN
```

---

## 🔧 Option B : Via un Client PostgreSQL Local (Plan Gratuit Compatible)

### Prérequis
- Installer un client PostgreSQL sur votre machine
  - **Windows** : [pgAdmin](https://www.pgadmin.org/download/) ou `psql` via [PostgreSQL installer](https://www.postgresql.org/download/windows/)
  - **Mac** : `brew install postgresql`
  - **Linux** : `sudo apt install postgresql-client`

### Étapes

#### 1. Récupérer l'URL de Connexion

1. **Aller sur** : https://dashboard.render.com
2. **Sélectionner** : `archify-db`
3. **Copier** : "External Database URL" ou "PSQL Command"

Cela ressemble à :
```
postgresql://archify:VOTRE_PASSWORD@dpg-xxxxx.oregon-postgres.render.com/archify_db
```

#### 2. Se Connecter à la Base de Données

**Via psql (ligne de commande)** :
```bash
psql "postgresql://archify:PASSWORD@dpg-xxxxx.oregon-postgres.render.com/archify_db"
```

**Via pgAdmin** :
1. Ouvrir pgAdmin
2. Clic droit sur "Servers" → "Create" → "Server"
3. Remplir :
   - **Name** : Archify Render
   - **Host** : `dpg-xxxxx.oregon-postgres.render.com`
   - **Port** : `5432`
   - **Database** : `archify_db`
   - **Username** : `archify`
   - **Password** : [votre password depuis Render]

#### 3. Exécuter la Requête SQL

Une fois connecté, exécuter :

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'admin@iscae.ma';
```

**Remplacez** `admin@iscae.ma` par votre email.

#### 4. Vérifier

```sql
SELECT id, email, name, role, "createdAt"
FROM "User"
WHERE email = 'admin@iscae.ma';
```

---

## 🔧 Option C : Via un Script Node.js (Avancé)

Si vous préférez un script automatisé :

### 1. Créer le Script

Créez un fichier `backend/scripts/create-admin.js` :

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node create-admin.js <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log('✅ User promoted to ADMIN:', user);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
```

### 2. Configurer DATABASE_URL

```bash
# Dans backend/
export DATABASE_URL="postgresql://archify:PASSWORD@dpg-xxxxx.oregon-postgres.render.com/archify_db"
```

### 3. Exécuter le Script

```bash
cd backend
node scripts/create-admin.js admin@iscae.ma
```

---

## ✅ Vérification Finale

### 1. Se Connecter sur le Site

1. **Aller sur** : https://archify-project.vercel.app
2. **Se connecter** avec :
   - Email : `admin@iscae.ma`
   - Mot de passe : [celui que vous avez créé]

### 2. Vérifier l'Accès Admin

Après connexion, vous devriez voir :
- ✅ Un menu "Admin" ou "Tableau de bord" dans le header
- ✅ Accès à `/admin` ou `/dashboard`
- ✅ Options de gestion des cours, utilisateurs, paiements

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Email Admin** :
   - Utilisez un email professionnel dédié
   - Exemple : `admin@iscae.ma` ou `administrator@iscae.ma`

2. **Mot de Passe** :
   - Minimum 12 caractères
   - Mélange de majuscules, minuscules, chiffres, symboles
   - Exemple : `Iscae@Admin2025!`

3. **Accès Database** :
   - Ne partagez JAMAIS l'URL de connexion PostgreSQL
   - Gardez vos credentials en sécurité

4. **Après Création** :
   - Changez immédiatement le mot de passe si nécessaire
   - Notez les credentials dans un gestionnaire de mots de passe

---

## 🆘 Dépannage

### Problème : "User not found"

**Cause** : Le compte n'a pas été créé via l'interface d'inscription

**Solution** : Retournez à l'Étape 1 et créez d'abord un compte normal

---

### Problème : "Cannot connect to database"

**Cause** : URL de connexion incorrecte ou database endormie (plan gratuit)

**Solution** :
1. Vérifier que l'URL est correcte (copier depuis Render Dashboard)
2. Le backend Render réveille automatiquement la DB quand il reçoit des requêtes
3. Essayer de charger le site d'abord pour réveiller le backend

---

### Problème : "Role not updated"

**Cause** : Erreur dans la requête SQL (casse, guillemets)

**Solution** : Vérifier que vous utilisez bien :
- `"User"` avec un U majuscule et des guillemets doubles
- `role = 'ADMIN'` avec ADMIN en majuscules

---

## 📊 Rôles Disponibles

Dans Archify, il existe 3 rôles :

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `STUDENT` | Étudiant normal | Voir cours, s'abonner, commenter |
| `ADMIN` | Administrateur | + Gérer cours, leçons, valider paiements |
| `SUPERADMIN` | Super admin | + Gérer autres admins (non implémenté) |

Pour la plupart des usages, **`ADMIN` est suffisant**.

---

## 🎯 Récapitulatif Rapide

**Si vous êtes pressé, voici la méthode la plus simple** :

1. **Créer un compte** sur https://archify-project.vercel.app (email + mot de passe)
2. **Aller sur** : https://dashboard.render.com
3. **Database** : archify-db → Copier "External Database URL"
4. **Installer** : pgAdmin ou psql
5. **Se connecter** à la DB
6. **Exécuter** : `UPDATE "User" SET role = 'ADMIN' WHERE email = 'votre-email@example.com';`
7. **Se reconnecter** sur le site → Accès admin disponible ✅

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des difficultés :

1. **Vérifier les logs** : Render Dashboard → archify-backend → Logs
2. **Tester la connexion DB** : Render Dashboard → archify-db → Connect
3. **Consulter** : [DEPLOYMENT_README.md](DEPLOYMENT_README.md)

---

**Version** : 1.0
**Dernière mise à jour** : 16 octobre 2025
**Auteur** : Med Hamady
