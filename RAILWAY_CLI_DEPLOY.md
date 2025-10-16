# 🚂 Guide Rapide - Déploiement Railway CLI

## 📋 Résumé des Commandes Complètes

```bash
# 1. Se connecter à Railway
railway login

# 2. Aller dans le dossier du projet
cd c:/Users/pc/Desktop/Archify_Project

# 3. Lier le projet Railway
railway link

# 4. Ajouter PostgreSQL
railway add
# Sélectionner: PostgreSQL

# 5. Configurer les variables d'environnement
railway variables --set JWT_SECRET="super-secret-key-changez-moi-12345"
railway variables --set NODE_ENV="production"
railway variables --set DATABASE_URL='${{Postgres.DATABASE_URL}}'

# 6. Vérifier les variables
railway variables

# 7. Déployer le backend
railway up

# 8. Voir les logs
railway logs

# 9. Générer un domaine public
railway domain

# 10. Exécuter les migrations Prisma
railway run npx prisma migrate deploy
railway run npx prisma generate

# 11. Ouvrir le backend
railway open
```

---

## 🔧 Dépannage

### Erreur : "Deploy failed"

**Voir les logs** :
```bash
railway logs
```

**Ou ouvrir les logs dans le navigateur** :
Cliquez sur le lien "Build Logs" affiché dans le terminal.

---

### Erreur : "Cannot find package.json"

**Solution** : Configurer le Root Directory

**Via Dashboard** :
1. Ouvrir https://railway.com/project/[votre-id]
2. Cliquer sur le service
3. Settings → Root Directory → `backend`
4. Sauvegarder et redéployer

---

### Erreur : "Prisma Client not generated"

**Solution** : Le `nixpacks.toml` mis à jour devrait résoudre ça.

Si le problème persiste :
```bash
railway run npx prisma generate
```

---

## 🎯 Après le Déploiement

Une fois le déploiement réussi :

```bash
# Obtenir l'URL publique
railway domain

# Tester le backend
curl https://votre-url.up.railway.app/healthz
```

Devrait retourner :
```json
{"status":"ok"}
```

---

## 📝 Checklist

- [x] Railway CLI installé
- [x] Connecté à Railway (`railway login`)
- [x] Projet lié (`railway link`)
- [x] PostgreSQL ajouté (`railway add`)
- [x] Variables configurées (`railway variables`)
- [x] `nixpacks.toml` créé et poussé sur GitHub
- [x] `backend/railway.toml` créé et poussé
- [ ] Backend déployé avec succès (`railway up`)
- [ ] Domaine généré (`railway domain`)
- [ ] Migrations exécutées (`railway run npx prisma migrate deploy`)
- [ ] Backend testé (`curl https://url/healthz`)

---

## 🔗 Liens Utiles

- **Votre Projet** : https://railway.com/project/3480644e-3098-4d97-907c-4b3ea30b76eb
- **Railway Docs** : https://docs.railway.app
- **Nixpacks Docs** : https://nixpacks.com
