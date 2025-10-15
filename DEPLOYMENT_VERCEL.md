# 🚀 Déploiement Archify sur Vercel

## ⚠️ IMPORTANT : Architecture Fullstack

Votre projet Archify est une application **fullstack** avec :
- **Frontend** : Angular 20 (dans `/frontend`)
- **Backend** : Node.js/Express + PostgreSQL (dans `/backend`)

**Vercel ne peut déployer que le frontend statique.** Le backend doit être déployé séparément.

---

## 📋 Options de Déploiement

### Option 1: Frontend sur Vercel + Backend ailleurs (Recommandé)

#### Frontend sur Vercel
✅ **Avantages** :
- CDN global ultra-rapide
- SSL automatique
- Déploiement automatique depuis GitHub
- Gratuit pour les projets personnels

#### Backend sur Railway/Render/Heroku
✅ **Avantages** :
- Support PostgreSQL natif
- Variables d'environnement sécurisées
- Déploiement automatique
- Gratuit (plans limités disponibles)

---

### Option 2: Tout sur Railway ou Render

Déployer frontend ET backend sur la même plateforme.

---

## 🔧 Configuration Actuelle pour Vercel (Frontend uniquement)

### Fichiers de Configuration Créés

#### 1. `vercel.json` (racine du projet)

```json
{
  "version": 2,
  "buildCommand": "npm install --prefix frontend && npm run build --prefix frontend",
  "outputDirectory": "frontend/dist/frontend/browser",
  "installCommand": "npm install --prefix frontend",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Explication** :
- `buildCommand` : Installe les dépendances et build Angular
- `outputDirectory` : Dossier contenant les fichiers HTML/JS/CSS générés
- `rewrites` : Redirige toutes les routes vers `index.html` (pour Angular Router)

---

#### 2. `.vercelignore`

```
backend/
node_modules/
*.md
.git/
```

**Explication** : Ignore le backend et fichiers inutiles pour réduire la taille du déploiement.

---

## 📦 Étapes de Déploiement sur Vercel

### Méthode 1 : Via l'Interface Vercel (Recommandé)

1. **Aller sur** : https://vercel.com
2. **Se connecter** avec votre compte GitHub
3. **Cliquer sur** "Add New Project"
4. **Importer** le repository `Archify_Project`
5. **Configurer** :
   - **Framework Preset** : Other
   - **Root Directory** : `./` (laisser vide)
   - **Build Command** : `npm install --prefix frontend && npm run build --prefix frontend`
   - **Output Directory** : `frontend/dist/frontend/browser`
   - **Install Command** : `npm install --prefix frontend`

6. **Variables d'environnement** (optionnel pour le frontend) :
   ```
   NODE_ENV=production
   ```

7. **Cliquer sur** "Deploy"

---

### Méthode 2 : Via Vercel CLI

#### Installation de Vercel CLI

```bash
npm install -g vercel
```

#### Connexion

```bash
vercel login
```

#### Déploiement

```bash
cd c:/Users/pc/Desktop/Archify_Project
vercel
```

**Répondre aux questions** :
- Set up and deploy? **Y**
- Which scope? **Votre nom d'utilisateur**
- Link to existing project? **N**
- Project name? **archify** (ou le nom de votre choix)
- In which directory is your code located? **./frontend**
- Override settings? **Y**
- Build Command? **npm run build**
- Output Directory? **dist/frontend/browser**
- Development Command? **npm run start**

---

## 🔗 Configuration du Backend (à déployer séparément)

### Option A : Railway (Recommandé)

1. **Aller sur** : https://railway.app
2. **Créer un nouveau projet**
3. **Déployer depuis GitHub** : Sélectionner `Archify_Project`
4. **Ajouter PostgreSQL** : Railway → Add → Database → PostgreSQL
5. **Variables d'environnement** :
   ```
   DATABASE_URL=${PGDATABASE_URL}
   JWT_SECRET=your-super-secret-key-here
   PORT=3000
   NODE_ENV=production
   ```
6. **Configuration** :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`

---

### Option B : Render

1. **Aller sur** : https://render.com
2. **Créer un Web Service**
3. **Connecter GitHub** : `Archify_Project`
4. **Configuration** :
   - **Name** : archify-backend
   - **Root Directory** : `backend`
   - **Environment** : Node
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
5. **Créer une base de données PostgreSQL**
6. **Lier la base de données** au Web Service
7. **Variables d'environnement** :
   ```
   DATABASE_URL=<automatic from Render>
   JWT_SECRET=your-super-secret-key
   NODE_ENV=production
   ```

---

## 🌐 Connecter Frontend et Backend

Une fois le backend déployé sur Railway/Render, vous obtiendrez une URL comme :
```
https://archify-backend.up.railway.app
```

### Mettre à jour le Frontend

**Fichier** : `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://archify-backend.up.railway.app/api'  // ← URL de votre backend
};
```

**Fichier** : `frontend/src/app/services/*.service.ts`

Remplacer :
```typescript
private readonly API_URL = 'http://localhost:3000/api';
```

Par :
```typescript
private readonly API_URL = environment.apiUrl;
```

Et importer :
```typescript
import { environment } from '../../environments/environment';
```

---

## 🔧 Résolution du Problème Actuel

### Erreur : `ng: command not found`

**Cause** : Vercel ne trouve pas Angular CLI car il n'est pas installé globalement.

**Solution** : Utiliser `npm run build` au lieu de `ng build`

**Vérification** : Le `package.json` du frontend contient déjà :
```json
{
  "scripts": {
    "build": "ng build"
  }
}
```

Donc `npm run build` appellera automatiquement `ng build`.

---

## ✅ Checklist de Déploiement

### Avant de Déployer

- [x] `vercel.json` créé à la racine
- [x] `.vercelignore` créé
- [ ] Tester le build localement : `cd frontend && npm run build`
- [ ] Vérifier que `frontend/dist/frontend/browser/index.html` existe après le build
- [ ] Pousser les changements sur GitHub :
  ```bash
  git add vercel.json .vercelignore DEPLOYMENT_VERCEL.md
  git commit -m "chore: Add Vercel deployment configuration"
  git push origin main
  ```

### Déployer le Frontend

- [ ] Connecter le repo GitHub à Vercel
- [ ] Configurer les paramètres de build
- [ ] Lancer le déploiement
- [ ] Vérifier que le site est accessible

### Déployer le Backend

- [ ] Choisir une plateforme (Railway / Render)
- [ ] Créer un service PostgreSQL
- [ ] Configurer les variables d'environnement
- [ ] Déployer le backend
- [ ] Tester l'API avec Postman ou curl

### Connecter Frontend ↔ Backend

- [ ] Récupérer l'URL du backend déployé
- [ ] Mettre à jour `environment.prod.ts`
- [ ] Modifier les services pour utiliser `environment.apiUrl`
- [ ] Redéployer le frontend sur Vercel

---

## 🧪 Tests Après Déploiement

### Frontend

```bash
# Tester l'URL Vercel
curl https://archify-project.vercel.app

# Vérifier que index.html est chargé
curl https://archify-project.vercel.app/index.html

# Tester une route Angular
curl https://archify-project.vercel.app/catalog
# ↑ Devrait renvoyer index.html (grâce aux rewrites)
```

### Backend

```bash
# Tester l'API
curl https://archify-backend.up.railway.app/api/health

# Tester l'authentification
curl -X POST https://archify-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🚨 Problèmes Courants

### 1. Erreur : `ng: command not found`

**Solution** : Utiliser `npm run build` dans le `buildCommand` au lieu de `ng build`.

---

### 2. Erreur : `Cannot GET /catalog`

**Solution** : Ajouter les rewrites dans `vercel.json` :
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### 3. Erreur : `CORS policy`

**Solution** : Configurer CORS dans le backend :

```typescript
// backend/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: [
    'https://archify-project.vercel.app',
    'http://localhost:4200'  // Pour le développement
  ],
  credentials: true
}));
```

---

### 4. Erreur : `404 Not Found` pour les assets

**Solution** : Vérifier que le `outputDirectory` pointe vers le bon dossier :
```
frontend/dist/frontend/browser
```

---

## 📚 Ressources

- **Vercel Docs** : https://vercel.com/docs
- **Railway Docs** : https://docs.railway.app
- **Render Docs** : https://render.com/docs
- **Angular Deployment** : https://angular.dev/tools/cli/deployment

---

## 🎯 Résumé

### Architecture Actuelle
```
┌─────────────────────────────────────┐
│  GitHub Repository                  │
│  ├── frontend/ (Angular 20)         │
│  └── backend/ (Node.js + PostgreSQL)│
└─────────────────────────────────────┘
           │
           ├──────────────────────┬────────────────────┐
           │                      │                    │
           ▼                      ▼                    ▼
    ┌──────────┐          ┌──────────┐        ┌──────────┐
    │  Vercel  │          │ Railway  │        │   Local  │
    │ Frontend │ ◄─API──► │ Backend  │        │ Dev Env  │
    │  Static  │          │ + DB     │        └──────────┘
    └──────────┘          └──────────┘
```

### URLs Finales
- **Frontend** : `https://archify-project.vercel.app`
- **Backend** : `https://archify-backend.up.railway.app`
- **Database** : PostgreSQL hébergé sur Railway

---

**Version** : 1.0
**Date** : 16 octobre 2025
**Auteur** : Claude Code
**Statut** : Configuration prête pour le déploiement
