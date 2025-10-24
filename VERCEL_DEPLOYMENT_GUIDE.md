# 🚀 Guide de Déploiement Vercel - Frontend FacGame

## 📋 Prérequis

1. Compte Vercel (gratuit sur [vercel.com](https://vercel.com))
2. Vercel CLI installé globalement:
   ```bash
   npm install -g vercel
   ```
3. Backend déployé sur Render: `https://archify-backend.onrender.com`

---

## 🔧 Configuration Effectuée

### Fichiers Créés

1. **vercel.json** - Configuration du déploiement
   - Build command: `npm run build`
   - Output directory: `dist/frontend/browser`
   - Routes SPA configurées
   - Headers de sécurité
   - Cache optimisé

2. **.vercelignore** - Fichiers à ignorer lors du déploiement
   - node_modules
   - fichiers de test
   - fichiers IDE

3. **environment.prod.ts** - Configuration production (déjà configuré)
   - API URL: `https://archify-backend.onrender.com/api`

---

## 🚀 Méthodes de Déploiement

### Méthode 1: Déploiement via Vercel CLI (Recommandé)

#### Étape 1: Login à Vercel
```bash
cd frontend
vercel login
```

#### Étape 2: Déploiement Initial
```bash
vercel
```

Répondez aux questions:
- **Set up and deploy?** → Yes
- **Which scope?** → Votre compte personnel
- **Link to existing project?** → No
- **Project name?** → `facgame-frontend` (ou votre choix)
- **In which directory is your code located?** → `./`
- **Want to modify settings?** → No

#### Étape 3: Déploiement en Production
```bash
vercel --prod
```

### Méthode 2: Déploiement via GitHub + Vercel Dashboard

#### Étape 1: Pusher sur GitHub
```bash
# À la racine du projet
git add .
git commit -m "feat: Configure Vercel deployment for frontend"
git push origin main
```

#### Étape 2: Configurer Vercel Dashboard
1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquer sur **"Add New Project"**
3. Importer votre repository GitHub
4. Configurer le projet:
   - **Framework Preset**: Angular
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/frontend/browser`
   - **Install Command**: `npm install`

5. Cliquer sur **"Deploy"**

---

## ⚙️ Variables d'Environnement (Optionnel)

Si vous avez besoin de variables d'environnement supplémentaires:

### Via CLI:
```bash
vercel env add API_URL production
# Entrez: https://archify-backend.onrender.com/api
```

### Via Dashboard:
1. Projet → Settings → Environment Variables
2. Ajouter `API_URL` = `https://archify-backend.onrender.com/api`

---

## 🧪 Test Local Avant Déploiement

### 1. Build de Production
```bash
cd frontend
npm run build
```

Vérifiez qu'il n'y a pas d'erreurs de compilation.

### 2. Test du Build avec Vercel CLI
```bash
vercel dev
```

Testez l'application sur `http://localhost:3000`

---

## 📊 Post-Déploiement

### Vérifications à Effectuer

1. **Test des Routes**:
   - ✅ `/` - Page d'accueil
   - ✅ `/facgame-dashboard` - Dashboard FacGame
   - ✅ `/subjects` - Liste des matières
   - ✅ `/quiz/:chapterId` - Quiz
   - ✅ `/challenge/:chapterId` - Challenge
   - ✅ `/exam/:subjectId` - Examen
   - ✅ `/profile` - Profil utilisateur
   - ✅ `/leaderboard` - Classement

2. **Test de l'API Backend**:
   - ✅ Connexion/Inscription
   - ✅ Récupération des matières
   - ✅ Soumission de quiz
   - ✅ Classement

3. **Test Responsive**:
   - ✅ Mobile (< 480px)
   - ✅ Tablette (768px)
   - ✅ Desktop (> 1024px)

### URLs Déployées

- **Preview**: `https://facgame-frontend-xxx.vercel.app` (généré automatiquement)
- **Production**: `https://facgame-frontend.vercel.app` (domaine par défaut)

---

## 🔄 Déploiements Automatiques

### Configuration GitHub
Une fois le projet lié à GitHub:
- ✅ Chaque push sur `main` → Déploiement en production
- ✅ Chaque PR → Déploiement preview
- ✅ Rollback facile depuis le dashboard

---

## 🌐 Configuration de Domaine Personnalisé (Optionnel)

### Via Dashboard Vercel
1. Projet → Settings → Domains
2. Ajouter votre domaine (ex: `facgame.votredomaine.com`)
3. Suivre les instructions DNS

---

## 🐛 Dépannage

### Erreur: "Build failed"
```bash
# Vérifier le build localement
cd frontend
npm install
npm run build
```

### Erreur: "Cannot find module"
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "API not reachable"
- Vérifier que le backend Render est actif
- Vérifier `environment.prod.ts` contient la bonne URL
- Vérifier les CORS sur le backend

### Erreur: "Routes not working"
- Vérifier `vercel.json` existe
- Vérifier la configuration des routes SPA

---

## 📈 Monitoring et Analytics

### Vercel Analytics (Recommandé)
1. Activer dans Settings → Analytics
2. Suivre les performances en temps réel

### Logs
```bash
vercel logs [deployment-url]
```

---

## 🔐 Sécurité

### Headers Configurés
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`

### HTTPS
- ✅ Automatique sur Vercel
- ✅ Certificat SSL gratuit

---

## 💰 Coûts

### Plan Hobby (Gratuit)
- ✅ Bande passante: 100 GB/mois
- ✅ Builds: Illimités
- ✅ Domaine `.vercel.app` gratuit
- ✅ SSL automatique

### Limites
- Pas de limite de projets
- Pas de limite de déploiements

---

## 📝 Commandes Utiles

```bash
# Déployer en production
vercel --prod

# Déployer en preview
vercel

# Voir les logs
vercel logs

# Lister les déploiements
vercel ls

# Promouvoir un déploiement en production
vercel promote [deployment-url]

# Voir les infos du projet
vercel inspect

# Supprimer un déploiement
vercel rm [deployment-url]
```

---

## ✅ Checklist Finale

Avant de considérer le déploiement complet:

- [ ] Build local réussi sans erreurs
- [ ] Tests E2E passent
- [ ] Backend Render actif et accessible
- [ ] CORS configuré sur le backend
- [ ] Variables d'environnement correctes
- [ ] vercel.json configuré
- [ ] .vercelignore créé
- [ ] Premier déploiement effectué
- [ ] Routes testées en production
- [ ] API backend testée depuis le frontend déployé
- [ ] Responsive vérifié sur mobile/tablette/desktop
- [ ] Domaine personnalisé configuré (optionnel)

---

## 🎉 Félicitations!

Votre frontend FacGame est maintenant déployé sur Vercel!

### Support
- [Documentation Vercel](https://vercel.com/docs)
- [Community Vercel](https://github.com/vercel/vercel/discussions)
- [Status Vercel](https://www.vercel-status.com/)

---

**Date**: 2025-10-24
**Version**: 1.0.0
**Statut**: Production Ready 🚀
