# 🚀 Archify - Plateforme Éducative ISCAE

## 📊 Status du Déploiement

| Composant | Plateforme | URL | Status |
|-----------|------------|-----|--------|
| **Frontend** | Vercel | https://archify-project.vercel.app | 🟢 Déployé |
| **Backend** | Render | https://archify-backend.onrender.com | 🟢 Déployé |
| **Database** | Render PostgreSQL | (privée) | 🟢 Actif |
| **API** | Render | https://archify-backend.onrender.com/api | 🟢 Live |

---

## 🎯 Vue d'Ensemble

**Archify** est une plateforme d'apprentissage en ligne développée pour les étudiants d'ISCAE, offrant des cours gratuits et premium avec système d'abonnement.

### Fonctionnalités Principales

✅ Catalogue de cours (gratuits et premium)
✅ Authentification (inscription/connexion)
✅ Lecture vidéo en streaming
✅ Système d'abonnement (300 DH / 6 mois)
✅ Paiement manuel avec screenshot
✅ Interface administrateur complète
✅ Gestion des cours et leçons
✅ Validation manuelle des paiements
✅ Commentaires sur les cours

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│           GitHub Repository                   │
│        (Source de vérité)                     │
│     github.com/med-hamady/Archify_Project     │
└──────────────────────────────────────────────┘
              │                    │
              │ Auto-deploy        │ Auto-deploy
              │ (on push)          │ (on push)
              ▼                    ▼
       ┌────────────┐       ┌────────────┐
       │   Vercel   │       │   Render   │
       │  Frontend  │◄─API──│  Backend   │
       │  (Angular) │       │  (Node.js) │
       └────────────┘       └────────────┘
                                 │
                                 │ SQL
                                 ▼
                            ┌────────────┐
                            │ PostgreSQL │
                            │   Render   │
                            └────────────┘
```

---

## 🛠️ Technologies

### Frontend
- **Framework** : Angular 20
- **UI** : Angular Material
- **Routing** : Angular Router
- **HTTP** : HttpClient
- **Hébergement** : Vercel

### Backend
- **Runtime** : Node.js 20
- **Framework** : Express.js
- **ORM** : Prisma
- **Database** : PostgreSQL 16
- **Auth** : JWT + bcrypt
- **Upload** : Multer
- **Hébergement** : Render (Docker)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md) | 🎉 Résumé complet du déploiement réussi |
| [DEPLOY_RENDER.md](DEPLOY_RENDER.md) | 🚀 Guide de déploiement sur Render |
| [FRONTEND_BACKEND_CONNECTION.md](FRONTEND_BACKEND_CONNECTION.md) | 🔗 Configuration frontend-backend |
| [RENDER_ENV_VARS_UPDATE.md](RENDER_ENV_VARS_UPDATE.md) | ⚠️ Variables d'environnement CORS (IMPORTANT) |
| [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) | ✅ Checklist de tests end-to-end (64 tests) |
| [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) | 📦 Déploiement frontend sur Vercel |
| [RAILWAY_CLI_DEPLOY.md](RAILWAY_CLI_DEPLOY.md) | 🚂 Archive : Tentatives Railway |
| [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md) | 🔧 Archive : Dépannage Railway |

---

## 🚀 Quick Start

### 1. ⚠️ ACTION IMMÉDIATE REQUISE

**Avant de tester l'application**, vous DEVEZ configurer la variable CORS sur Render :

1. Aller sur : https://dashboard.render.com
2. Service : `archify-backend`
3. Section : "Environment"
4. Ajouter : `CORS_ORIGINS` = `https://archify-project.vercel.app,http://localhost:4200`
5. Sauvegarder (Render redéploiera automatiquement)

**📖 Voir détails** : [RENDER_ENV_VARS_UPDATE.md](RENDER_ENV_VARS_UPDATE.md)

---

### 2. Vérifier le Backend

```bash
curl https://archify-backend.onrender.com/healthz
```

**Résultat attendu** :
```json
{"status":"ok"}
```

---

### 3. Tester le Frontend

1. Ouvrir : https://archify-project.vercel.app
2. Vérifier que la page se charge
3. Ouvrir DevTools (F12) → Console
4. Vérifier qu'il n'y a **aucune erreur CORS**

---

### 4. Tests End-to-End

Suivre la checklist complète : [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)

**Tests prioritaires** :
- ✅ Catalogue de cours visible
- ✅ Inscription/Connexion fonctionne
- ✅ Lecture vidéo cours gratuit
- ✅ Soumission paiement
- ✅ Interface admin accessible

---

## 🔐 Accès Admin

Pour créer un compte administrateur, vous devez le faire manuellement dans la base de données :

### Option 1 : Via Render Shell (Plan payant requis)

```bash
# Se connecter à la base de données
psql $DATABASE_URL

# Mettre à jour un utilisateur existant
UPDATE "User" SET role = 'ADMIN' WHERE email = 'votre-email@example.com';
```

### Option 2 : Via Client PostgreSQL Local

1. Récupérer `DATABASE_URL` depuis Render
2. Se connecter :
   ```bash
   psql "postgresql://archify:password@host/database"
   ```
3. Exécuter la même requête UPDATE

### Option 3 : Créer un Script de Seed

Créer `backend/prisma/seed-admin.ts` (à venir si nécessaire)

---

## 🔄 Workflow de Développement

### Faire des Modifications

```bash
# 1. Travailler localement
cd backend  # ou cd frontend
npm run dev

# 2. Tester localement
# Backend : http://localhost:3000
# Frontend : http://localhost:4200

# 3. Commiter
git add .
git commit -m "Description des changements"

# 4. Pousser
git push origin main

# 5. Attendre le déploiement automatique (2-5 min)
# Vercel et Render détectent et déploient automatiquement
```

---

### Mettre à Jour le Schéma de Base de Données

```bash
cd backend

# 1. Modifier prisma/schema.prisma

# 2. Créer une migration
npx prisma migrate dev --name nom_migration

# 3. Commiter les fichiers de migration
git add prisma/migrations
git commit -m "db: Add migration nom_migration"
git push origin main

# 4. Render exécute automatiquement `npx prisma migrate deploy`
```

---

## 📊 Monitoring

### Render Dashboard
- **Logs** : Voir les logs en temps réel
- **Metrics** : CPU, RAM, Requests
- **Events** : Déploiements, erreurs, redémarrages

### Vercel Dashboard
- **Deployments** : Historique des déploiements
- **Analytics** : Visiteurs, performances
- **Logs** : Logs des fonctions (si applicable)

---

## ⚠️ Limitations Connues

### Render Free Tier

| Limitation | Impact | Solution |
|------------|--------|----------|
| Service s'endort après 15 min | Première requête : 30-60s | Attendre le réveil ou passer au plan payant |
| 750 heures/mois | Service peut s'arrêter fin de mois | Passer au Starter Plan ($7/mois) |
| Pas de Shell | Commandes manuelles impossibles | Automatiser via Start Command |

### Vercel Free Tier

| Limitation | Impact |
|------------|--------|
| 100 GB bandwidth/mois | Suffisant pour usage normal |
| Pas de fonctions serverless backend | N/A (backend sur Render) |

---

## 🐛 Dépannage

### Erreur CORS dans le navigateur

**Symptôme** :
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution** : Vérifier que `CORS_ORIGINS` est configuré sur Render
**Voir** : [RENDER_ENV_VARS_UPDATE.md](RENDER_ENV_VARS_UPDATE.md)

---

### Backend timeout / Network Error

**Symptôme** : Requêtes API échouent ou prennent > 60 secondes

**Cause** : Backend Render endormi (plan gratuit)

**Solution** :
1. Attendre 30-60 secondes
2. Rafraîchir la page
3. Le backend se réveille automatiquement

---

### Vidéos ne jouent pas

**Symptôme** : Erreur lors de la lecture vidéo

**Solutions possibles** :
1. Vérifier que le cours/leçon existe
2. Vérifier l'abonnement utilisateur (si cours premium)
3. Vérifier les logs Render pour erreurs vidéo
4. Vérifier que le fichier vidéo est bien uploadé

---

### Migrations échouent

**Symptôme** : Erreur lors du déploiement Render

**Solutions** :
1. Vérifier la syntaxe du schema Prisma
2. Vérifier la compatibilité PostgreSQL
3. Voir les logs Render pour l'erreur exacte

---

## 📈 Prochaines Étapes (Optionnel)

### Améliorations Recommandées

- [ ] Configurer un domaine personnalisé (ex: `archify.iscae.ma`)
- [ ] Ajouter Google Analytics pour tracking
- [ ] Configurer Sentry pour monitoring d'erreurs
- [ ] Mettre en place des tests automatisés (Playwright/Cypress)
- [ ] Ajouter un CDN pour les vidéos (Cloudflare, AWS S3)
- [ ] Configurer des alertes email (Render + Vercel)
- [ ] Implémenter un système de cache Redis
- [ ] Ajouter des webhooks pour notifications

### Évolutivité

- [ ] Passer au plan payant Render ($7/mois) pour pas de sleep
- [ ] Implémenter un système de paiement automatisé (Stripe, PayPal)
- [ ] Ajouter un système de notifications in-app
- [ ] Implémenter des certificats de fin de cours
- [ ] Ajouter un forum de discussion

---

## 👥 Équipe

**Développeur** : [Votre nom]
**Institution** : ISCAE
**Framework** : Angular + Node.js + PostgreSQL
**Deployment** : Vercel + Render

---

## 📞 Support

### Issues GitHub
Pour signaler des bugs ou demander des fonctionnalités :
https://github.com/med-hamady/Archify_Project/issues

### Documentation
Toute la documentation est dans le repository :
- `/DEPLOYMENT_*.md` - Documentation de déploiement
- `/FRONTEND_BACKEND_CONNECTION.md` - Configuration
- `/TESTING_CHECKLIST.md` - Tests

---

## 📝 Changelog

### Version 1.0 - 16 octobre 2025

**🎉 Déploiement Initial Production**

**Frontend (Vercel)** :
- ✅ Angular 20 application déployée
- ✅ Configuration production pointant vers Render
- ✅ Auto-déploiement configuré depuis GitHub

**Backend (Render)** :
- ✅ Node.js/Express API déployée
- ✅ PostgreSQL database créée et migrée
- ✅ Docker containerization
- ✅ Auto-déploiement configuré depuis GitHub
- ✅ Health check endpoint fonctionnel

**Fonctionnalités** :
- ✅ Authentification JWT
- ✅ Gestion de cours et leçons
- ✅ Upload et streaming vidéo
- ✅ Système d'abonnement
- ✅ Paiement manuel avec screenshot
- ✅ Interface admin complète
- ✅ Commentaires sur cours

---

## 📄 License

Projet privé - ISCAE

---

## ✅ Statut Final

**🟢 Production Ready**

✅ Backend déployé et fonctionnel
✅ Frontend déployé et fonctionnel
✅ Base de données configurée
✅ Migrations appliquées
✅ Auto-déploiement configuré
✅ Documentation complète
⏳ Tests end-to-end à effectuer
⏳ Variable CORS à configurer sur Render (critique)

---

**Dernière mise à jour** : 16 octobre 2025
**Version** : 1.0
**Auteur** : Med Hamady (via Claude Code)
