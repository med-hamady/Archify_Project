# 🚨 Dépannage Railway - Deploy Failed

## Problème Actuel

**Erreur** : `Deploy failed`

**Cause probable** : Railway essaie de déployer depuis la racine au lieu de `/backend`

---

## ✅ Solutions à Essayer (Dans l'Ordre)

### Solution 1 : Configurer le Root Directory via Dashboard

1. **Ouvrir** : https://railway.com/project/3H806UHa-3098-4d97-987c-4b3ea30b76eb
2. **Cliquer** sur le service `archify-backend`
3. **Aller dans** "Settings"
4. **Chercher** "Root Directory" ou "Source"
5. **Mettre** : `backend`
6. **Sauvegarder** et **Redéployer**

---

### Solution 2 : Vérifier les Logs d'Erreur

Dans votre terminal :

```bash
railway logs
```

Cela va montrer exactement pourquoi le build a échoué.

**Erreurs communes** :
- ❌ `npm install` ne trouve pas `package.json` → Root directory incorrect
- ❌ `Prisma generate failed` → Variables d'environnement manquantes
- ❌ `Cannot find module` → Dépendances non installées

---

### Solution 3 : Redéployer avec le Nouveau nixpacks.toml

Le fichier `nixpacks.toml` a été créé et poussé sur GitHub. Railway devrait maintenant :

1. **Détecter** le fichier `nixpacks.toml`
2. **Exécuter** les commandes dans le dossier `/backend`
3. **Builder** correctement le projet

**Redéployer** :

```bash
railway up
```

Ou via le Dashboard : Cliquez sur "Redeploy" sur le dernier déploiement.

---

### Solution 4 : Vérifier que PostgreSQL est Ajouté

```bash
railway add
```

**Sélectionner** : PostgreSQL (si ce n'est pas déjà fait)

Puis vérifier les variables :

```bash
railway variables
```

**Vous devriez voir** :
- `DATABASE_URL` (généré automatiquement par PostgreSQL)
- `JWT_SECRET` (si vous l'avez défini)
- `NODE_ENV` (si vous l'avez défini)

---

### Solution 5 : Variables d'Environnement Manquantes

Ajouter les variables nécessaires :

```bash
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set JWT_SECRET="super-secret-key-changez-moi-12345"
railway variables set NODE_ENV="production"
```

---

## 🔍 Vérifier l'État Actuel

### Voir les Services

```bash
railway status
```

### Voir les Variables

```bash
railway variables
```

### Voir les Logs en Temps Réel

```bash
railway logs --follow
```

---

## 📊 Architecture Attendue

Votre projet Railway devrait avoir :

```
Railway Project: archify-backend
├── Service: archify-backend (Node.js)
│   ├── Root Directory: backend
│   ├── Build Command: npm install && npm run build
│   ├── Start Command: npm start
│   └── Variables:
│       ├── DATABASE_URL (référence à Postgres)
│       ├── JWT_SECRET
│       └── NODE_ENV=production
└── Database: PostgreSQL
    └── Génère automatiquement DATABASE_URL
```

---

## 🚀 Processus de Build Attendu

Railway devrait exécuter dans cet ordre :

1. **Clone** du repository GitHub
2. **Détection** de Node.js (via `package.json`)
3. **Installation** : `cd backend && npm install`
4. **Build** : `cd backend && npm run build`
5. **Prisma Generate** : `npx prisma generate` (automatique si dans package.json)
6. **Start** : `cd backend && npm start`

---

## ⚠️ Erreurs Communes et Solutions

### Erreur : `Cannot find package.json`

**Cause** : Root directory incorrect

**Solution** : Mettre `backend` dans Root Directory

---

### Erreur : `Prisma Client not generated`

**Cause** : `prisma generate` non exécuté

**Solution** : Ajouter dans `backend/package.json` :

```json
{
  "scripts": {
    "build": "prisma generate && tsc",
    "start": "node dist/index.js"
  }
}
```

---

### Erreur : `DATABASE_URL not found`

**Cause** : PostgreSQL non lié ou variable non définie

**Solution** :

1. Vérifier que PostgreSQL est ajouté : `railway add`
2. Lier la variable :
   ```bash
   railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
   ```

---

### Erreur : `Port 3000 already in use`

**Cause** : Le port est hardcodé

**Solution** : Dans `backend/src/index.ts`, utiliser :

```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 📞 Commandes Utiles pour Déboguer

```bash
# Voir l'état du projet
railway status

# Voir les logs en direct
railway logs --follow

# Voir les variables
railway variables

# Ouvrir le dashboard
railway open

# Redéployer
railway up

# Se connecter au service via shell
railway shell
```

---

## ✅ Checklist de Vérification

Avant de redéployer, vérifiez :

- [ ] `nixpacks.toml` créé et poussé sur GitHub
- [ ] Root Directory = `backend` (dans Settings)
- [ ] PostgreSQL ajouté au projet
- [ ] `DATABASE_URL` configuré
- [ ] `JWT_SECRET` configuré
- [ ] `NODE_ENV=production` configuré
- [ ] `backend/package.json` a les bons scripts (build, start)
- [ ] `backend/src/index.ts` utilise `process.env.PORT`

---

## 🎯 Prochaines Étapes

1. **Vérifier les logs** : `railway logs`
2. **Corriger le Root Directory** : Dashboard → Settings → Root Directory → `backend`
3. **Redéployer** : `railway up` ou Dashboard → Redeploy
4. **Attendre** le build (2-5 minutes)
5. **Vérifier** : `railway open` ou tester `/healthz`

---

**Une fois le backend déployé avec succès, nous pourrons :**
- Obtenir l'URL publique
- Exécuter les migrations Prisma
- Connecter le frontend Vercel
- Tester l'application complète

---

**Statut** : En attente de correction du Root Directory
**Prochaine action** : Configurer `Root Directory = backend` dans Railway Dashboard
