# 🚂 Déploiement du Backend Archify sur Railway

## 📋 Prérequis

- ✅ Compte GitHub avec le repository `Archify_Project`
- ✅ Fichiers de configuration créés (`railway.json`, `Procfile`)
- ✅ Backend fonctionnel en local

---

## 🎯 Étape 1 : Créer un Compte Railway

1. **Aller sur** : https://railway.app
2. **Cliquer sur** "Start a New Project"
3. **Se connecter avec GitHub** (recommandé)
4. **Autoriser Railway** à accéder à vos repositories

---

## 🚀 Étape 2 : Créer un Nouveau Projet

### A. Depuis l'Interface Railway

1. **Cliquer sur** "New Project"
2. **Sélectionner** "Deploy from GitHub repo"
3. **Choisir** le repository `Archify_Project`
4. **Railway va détecter** automatiquement que c'est un projet Node.js

### B. Configuration Automatique

Railway va :
- ✅ Détecter `package.json` dans `/backend`
- ✅ Installer les dépendances avec `npm install`
- ✅ Compiler TypeScript avec `npm run build`
- ✅ Démarrer le serveur avec `npm start`

---

## 🗄️ Étape 3 : Ajouter PostgreSQL

### A. Créer la Base de Données

1. **Dans votre projet Railway**, cliquer sur "+ New"
2. **Sélectionner** "Database"
3. **Choisir** "PostgreSQL"
4. **Railway va créer** automatiquement une instance PostgreSQL

### B. Variables d'Environnement Automatiques

Railway crée automatiquement ces variables :
```
PGHOST=containers-us-west-xxx.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=xxxxxxxxxxxxx
PGDATABASE=railway
DATABASE_URL=postgresql://postgres:xxxxx@containers-us-west-xxx.railway.app:5432/railway
```

---

## ⚙️ Étape 4 : Configurer les Variables d'Environnement

### A. Dans Railway Dashboard

1. **Cliquer sur votre service backend**
2. **Aller dans** "Variables"
3. **Ajouter les variables suivantes** :

```env
# Database (Railway génère DATABASE_URL automatiquement)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret (générer une clé aléatoire sécurisée)
JWT_SECRET=votre-super-secret-key-ici-changez-moi-123456789

# Email Configuration (pour l'envoi d'emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app

# Environment
NODE_ENV=production

# Port (Railway utilise PORT automatiquement)
PORT=${{PORT}}

# CORS Origins (URL de votre frontend Vercel)
FRONTEND_URL=https://archify-project.vercel.app
```

### B. Référence des Variables

**Variables Obligatoires** :
- ✅ `DATABASE_URL` - Connexion PostgreSQL (auto-générée)
- ✅ `JWT_SECRET` - Clé secrète pour les tokens JWT
- ✅ `NODE_ENV` - Environnement de production
- ✅ `PORT` - Port du serveur (auto-assigné par Railway)

**Variables Optionnelles** :
- `EMAIL_HOST` - Serveur SMTP pour l'envoi d'emails
- `EMAIL_PORT` - Port SMTP
- `EMAIL_USER` - Adresse email d'envoi
- `EMAIL_PASSWORD` - Mot de passe de l'email
- `FRONTEND_URL` - URL du frontend pour CORS

---

## 🔧 Étape 5 : Configurer le Service Backend

### A. Settings du Service

1. **Dans Railway**, cliquer sur votre service backend
2. **Aller dans** "Settings"
3. **Configurer** :

**Root Directory** :
```
backend
```

**Build Command** (optionnel, Railway détecte automatiquement) :
```bash
npm install && npm run build
```

**Start Command** (optionnel, Railway détecte automatiquement) :
```bash
npm start
```

**Watch Paths** (optionnel) :
```
backend/**
```
*Cela redéploiera automatiquement si des fichiers dans `/backend` changent*

---

## 🔗 Étape 6 : Connecter la Base de Données

### A. Lier PostgreSQL au Backend

1. **Cliquer sur votre service backend**
2. **Aller dans** "Variables"
3. **Cliquer sur** "+ New Variable"
4. **Sélectionner** "Reference" → `Postgres.DATABASE_URL`
5. **Railway va automatiquement** mettre à jour `DATABASE_URL`

### B. Vérifier la Connexion

Railway va automatiquement :
- ✅ Injecter `DATABASE_URL` dans votre backend
- ✅ Prisma va utiliser cette variable pour se connecter
- ✅ Les migrations seront appliquées (si configurées)

---

## 📦 Étape 7 : Exécuter les Migrations Prisma

### Option 1 : Via Railway CLI (Recommandé)

#### Installation de Railway CLI

```bash
npm install -g @railway/cli
```

#### Connexion

```bash
railway login
```

#### Lier au Projet

```bash
cd c:/Users/pc/Desktop/Archify_Project
railway link
```

**Choisir** :
- Votre compte Railway
- Le projet `Archify_Project`
- Le service `backend`

#### Exécuter les Migrations

```bash
railway run npx prisma migrate deploy
```

#### Générer le Client Prisma

```bash
railway run npx prisma generate
```

---

### Option 2 : Ajouter les Migrations au Build

**Modifier** : `backend/package.json`

```json
{
  "scripts": {
    "build": "prisma generate && tsc -p tsconfig.json",
    "start": "prisma migrate deploy && node dist/index.js"
  }
}
```

**Attention** : Cette méthode exécute les migrations à chaque démarrage.

---

### Option 3 : Via Railway Dashboard (One-off Command)

1. **Dans Railway**, cliquer sur votre service backend
2. **Aller dans** "Deployments"
3. **Cliquer sur les trois points** (...) du déploiement
4. **Sélectionner** "Open Shell"
5. **Exécuter** :
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## 🌐 Étape 8 : Obtenir l'URL du Backend

### A. URL Publique

1. **Dans Railway**, cliquer sur votre service backend
2. **Aller dans** "Settings"
3. **Trouver** "Domains"
4. **Cliquer sur** "Generate Domain"

Railway va générer une URL comme :
```
https://archify-backend-production.up.railway.app
```

### B. URL Personnalisée (Optionnel)

Vous pouvez ajouter votre propre domaine :
1. **Cliquer sur** "Custom Domain"
2. **Entrer** votre domaine (ex: `api.archify.com`)
3. **Configurer les DNS** selon les instructions Railway

---

## 🔒 Étape 9 : Configurer CORS

### A. Mettre à Jour le Backend

**Fichier** : `backend/src/index.ts`

Vérifier que CORS est configuré pour accepter votre frontend Vercel :

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'https://archify-project.vercel.app',  // Frontend Vercel
    'http://localhost:4200'  // Local development
  ],
  credentials: true
}));
```

### B. Utiliser la Variable d'Environnement

**Meilleure pratique** :

```typescript
const allowedOrigins = process.env.FRONTEND_URL?.split(',') || [
  'http://localhost:4200'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

Puis dans Railway Variables :
```
FRONTEND_URL=https://archify-project.vercel.app,http://localhost:4200
```

---

## 📡 Étape 10 : Mettre à Jour le Frontend

### A. Créer le Fichier d'Environnement de Production

**Fichier** : `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://archify-backend-production.up.railway.app/api'
};
```

### B. Mettre à Jour les Services

**Exemple** : `frontend/src/app/services/auth.service.ts`

**Avant** :
```typescript
private readonly API_URL = 'http://localhost:3000/api';
```

**Après** :
```typescript
import { environment } from '../../environments/environment';

private readonly API_URL = environment.apiUrl;
```

**Répéter pour tous les services** :
- `auth.service.ts`
- `payment.service.ts`
- Etc.

### C. Mettre à Jour angular.json

**Fichier** : `frontend/angular.json`

Vérifier que la configuration de production utilise le bon fichier :

```json
{
  "projects": {
    "frontend": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### D. Redéployer le Frontend sur Vercel

```bash
git add .
git commit -m "chore: Update API URL to Railway backend"
git push origin main
```

Vercel va automatiquement redéployer avec la nouvelle URL.

---

## ✅ Étape 11 : Tester le Déploiement

### A. Tester le Backend

#### Health Check
```bash
curl https://archify-backend-production.up.railway.app/healthz
```

**Résultat attendu** :
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T..."
}
```

#### Test d'Authentification
```bash
curl -X POST https://archify-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### B. Tester depuis le Frontend

1. **Aller sur** : https://archify-project.vercel.app
2. **Essayer de se connecter**
3. **Vérifier les Network logs** (F12 → Network)
4. **Vérifier que les requêtes vont vers Railway**

---

## 🐛 Dépannage

### Erreur : `Database connection failed`

**Solution** :
1. Vérifier que `DATABASE_URL` est bien configurée
2. Vérifier que PostgreSQL est démarré sur Railway
3. Vérifier les logs : Railway Dashboard → Service → Logs

---

### Erreur : `Prisma Client not generated`

**Solution** :
```bash
railway run npx prisma generate
```

Ou ajouter à `package.json` :
```json
{
  "scripts": {
    "build": "prisma generate && tsc"
  }
}
```

---

### Erreur : `CORS policy`

**Solution** :
1. Vérifier que `FRONTEND_URL` contient l'URL Vercel
2. Vérifier la configuration CORS dans `backend/src/index.ts`
3. Redéployer le backend

---

### Erreur : `Port already in use`

**Solution** :
Railway gère automatiquement les ports. Utiliser :
```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT);
```

---

### Les Logs ne s'affichent pas

**Solution** :
1. **Dans Railway**, cliquer sur votre service
2. **Aller dans** "Deployments"
3. **Cliquer sur** le dernier déploiement
4. **Voir les logs** en temps réel

---

## 📊 Monitoring

### A. Logs Railway

**Railway Dashboard** → **Service** → **Deployments** → **View Logs**

Les logs montrent :
- ✅ Démarrage du serveur
- ✅ Connexion à la base de données
- ✅ Requêtes HTTP
- ❌ Erreurs et exceptions

### B. Métriques

**Railway Dashboard** → **Service** → **Metrics**

Affiche :
- 📈 CPU usage
- 💾 Memory usage
- 🌐 Network traffic
- ⏱️ Response time

---

## 💰 Coûts Railway

### Plan Gratuit (Trial)

- ✅ $5 de crédits gratuits par mois
- ✅ Suffisant pour un petit projet
- ✅ Pas de carte bancaire requise initialement

### Plan Hobby ($5/mois)

- ✅ $5 de crédits inclus
- ✅ Idéal pour des projets personnels
- ✅ Support PostgreSQL

### Estimation Archify

**Backend + PostgreSQL** :
- Backend : ~$2-3/mois (usage léger)
- PostgreSQL : ~$1-2/mois (petite DB)
- **Total** : ~$3-5/mois

---

## 🔄 Déploiement Automatique

### A. Configuration

Railway déploie automatiquement à chaque push sur GitHub :

1. **Commit et push** :
```bash
git add .
git commit -m "Update backend"
git push origin main
```

2. **Railway détecte** le changement
3. **Rebuild automatique** du backend
4. **Redéploiement** en quelques minutes

### B. Désactiver le Déploiement Auto

**Railway Dashboard** → **Service** → **Settings** → **Disable Auto Deploy**

---

## 📚 Checklist Complète

### Avant le Déploiement

- [x] Créer `railway.json`
- [x] Créer `Procfile`
- [x] Vérifier `package.json` (scripts build et start)
- [x] Vérifier que le backend fonctionne en local
- [ ] Créer un compte Railway
- [ ] Connecter GitHub à Railway

### Déploiement Backend

- [ ] Créer un nouveau projet Railway
- [ ] Importer depuis GitHub (`Archify_Project`)
- [ ] Ajouter PostgreSQL
- [ ] Configurer les variables d'environnement
- [ ] Générer un domaine public
- [ ] Exécuter les migrations Prisma
- [ ] Tester l'endpoint `/healthz`

### Connexion Frontend ↔ Backend

- [ ] Créer `environment.prod.ts`
- [ ] Mettre à jour tous les services avec `environment.apiUrl`
- [ ] Configurer CORS dans le backend
- [ ] Commit et push les changements
- [ ] Vercel redéploie automatiquement
- [ ] Tester l'authentification depuis le frontend

### Tests Finaux

- [ ] Se connecter depuis le frontend Vercel
- [ ] Créer un nouvel utilisateur
- [ ] Tester l'upload de fichiers
- [ ] Tester le paiement manuel
- [ ] Vérifier les vidéos protégées

---

## 🎯 Résumé

### URLs Finales

- **Frontend Vercel** : `https://archify-project.vercel.app`
- **Backend Railway** : `https://archify-backend-production.up.railway.app`
- **Base de Données** : PostgreSQL hébergée sur Railway (privée)

### Architecture Déployée

```
┌─────────────────────────────────────────┐
│          GitHub Repository              │
│       (Source de vérité)                │
└─────────────────────────────────────────┘
           │                    │
           │ Auto-deploy        │ Auto-deploy
           ▼                    ▼
    ┌────────────┐       ┌────────────┐
    │   Vercel   │       │  Railway   │
    │  Frontend  │◄─API──│  Backend   │
    │  (Static)  │       │  (Node.js) │
    └────────────┘       └────────────┘
                              │
                              │ Connect
                              ▼
                         ┌────────────┐
                         │ PostgreSQL │
                         │  Database  │
                         └────────────┘
```

---

**Version** : 1.0
**Date** : 16 octobre 2025
**Auteur** : Claude Code
**Statut** : Guide complet prêt à l'emploi
