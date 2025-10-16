# 🚀 Déploiement sur Render (Alternative à Railway)

Railway a des problèmes avec la détection du Dockerfile. Utilisons **Render** qui est plus fiable.

---

## 📋 Étapes Complètes

### 1. Créer un Compte Render

1. Aller sur : https://render.com
2. Cliquer sur "Get Started"
3. Se connecter avec GitHub

---

### 2. Créer une Base de Données PostgreSQL

1. Dans le Dashboard Render, cliquer sur "New +"
2. Sélectionner "PostgreSQL"
3. Configurer :
   - **Name** : `archify-db`
   - **Database** : `archify`
   - **User** : `archify`
   - **Region** : Frankfurt (ou le plus proche)
   - **PostgreSQL Version** : 16
   - **Plan** : Free
4. Cliquer sur "Create Database"
5. **NOTER l'URL** : Internal Database URL (format: `postgresql://...`)

---

### 3. Déployer le Backend

1. Cliquer sur "New +" → "Web Service"
2. Connecter le repository GitHub : `Archify_Project`
3. Configurer :

**Basic Settings** :
- **Name** : `archify-backend`
- **Region** : Frankfurt (ou le même que la DB)
- **Branch** : `main`
- **Root Directory** : `backend`

**Build & Deploy** :
- **Runtime** : Node
- **Build Command** :
  ```bash
  npm install && npx prisma generate && npm run build
  ```
- **Start Command** :
  ```bash
  npm start
  ```

**Advanced** :
- **Auto-Deploy** : Yes
- **Health Check Path** : `/healthz`

4. Cliquer sur "Advanced" pour ajouter les variables d'environnement

---

### 4. Configurer les Variables d'Environnement

Dans "Environment Variables", ajouter :

```
DATABASE_URL=<copier l'Internal Database URL de PostgreSQL>
JWT_SECRET=super-secret-key-changez-moi-avec-quelque-chose-de-tres-long
NODE_ENV=production
PORT=10000
```

**Note** : Render utilise automatiquement le port 10000 en interne.

---

### 5. Créer le Service

1. Cliquer sur "Create Web Service"
2. Render va :
   - Clone le repo
   - Installer les dépendances
   - Générer Prisma Client
   - Compiler TypeScript
   - Démarrer l'application
3. **Attendre 5-10 minutes** pour le premier déploiement

---

### 6. Exécuter les Migrations Prisma

Une fois le service déployé :

1. Dans le Dashboard du service, cliquer sur "Shell" (en haut à droite)
2. Exécuter :
   ```bash
   npx prisma migrate deploy
   ```

---

### 7. Obtenir l'URL Publique

Render génère automatiquement une URL :
```
https://archify-backend.onrender.com
```

**Tester** :
```bash
curl https://archify-backend.onrender.com/healthz
```

Devrait retourner :
```json
{"status":"ok"}
```

---

## ✅ Avantages de Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| Dockerfile Support | ✅ Natif | ⚠️ Parfois ignoré |
| PostgreSQL Inclus | ✅ Gratuit | ✅ Gratuit |
| Build Logs | ✅ Clairs | ⚠️ Parfois cryptiques |
| Déploiement Auto | ✅ Fiable | ✅ Fiable |
| Shell Access | ✅ Via Dashboard | ✅ Via CLI |
| Plan Gratuit | ✅ 750h/mois | ✅ $5 crédits/mois |

---

## 🔄 Migrations Automatiques (Optionnel)

Pour exécuter automatiquement les migrations à chaque déploiement, modifier le **Build Command** :

```bash
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```

⚠️ **Attention** : Cela exécute les migrations avant le build, ce qui peut causer des problèmes si une migration échoue.

**Recommandation** : Garder les migrations manuelles via le Shell.

---

## 📊 Monitoring

Render fournit :
- **Logs en temps réel**
- **Métriques CPU/RAM**
- **Health checks automatiques**
- **Alertes par email**

---

## 💰 Coûts

### Plan Gratuit
- ✅ 750 heures/mois par service
- ✅ PostgreSQL gratuit (1 GB)
- ⚠️ Le service s'endort après 15 min d'inactivité
- ⚠️ Redémarrage froid : 30-60 secondes

### Plan Starter ($7/mois)
- ✅ Service toujours actif (pas de sleep)
- ✅ Plus de ressources
- ✅ Pas de limite d'heures

---

## 🔗 Connecter le Frontend Vercel au Backend Render

Une fois le backend déployé sur Render :

1. **Obtenir l'URL** : `https://archify-backend.onrender.com`

2. **Créer** `frontend/src/environments/environment.prod.ts` :
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://archify-backend.onrender.com/api'
   };
   ```

3. **Mettre à jour les services** pour utiliser `environment.apiUrl`

4. **Commit et push** :
   ```bash
   git add frontend/src/environments/environment.prod.ts
   git commit -m "feat: Configure production API URL for Render backend"
   git push origin main
   ```

5. **Vercel redéploie automatiquement** le frontend

---

## 🎯 Résumé

**Architecture finale** :
```
┌────────────┐       API        ┌────────────┐
│   Vercel   │ ◄──────────────► │   Render   │
│  Frontend  │                  │  Backend   │
└────────────┘                  └────────────┘
                                      │
                                      │ SQL
                                      ▼
                                ┌────────────┐
                                │ PostgreSQL │
                                │   Render   │
                                └────────────┘
```

**URLs** :
- Frontend : `https://archify-project.vercel.app`
- Backend : `https://archify-backend.onrender.com`
- Database : `postgresql://...` (privée)

---

**Version** : 1.0
**Date** : 16 octobre 2025
**Statut** : Guide complet prêt à l'emploi
