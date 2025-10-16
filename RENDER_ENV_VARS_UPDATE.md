# ⚠️ IMPORTANT : Mise à Jour Variables d'Environnement Render

## 🚨 Action Immédiate Requise

Pour que le frontend Vercel puisse communiquer avec le backend Render, vous devez **ajouter une variable d'environnement CORS** sur Render.

---

## 📋 Étapes

### 1. Aller sur Render Dashboard

1. Ouvrir : https://dashboard.render.com
2. Sélectionner le service `archify-backend`
3. Cliquer sur "Environment" dans le menu de gauche

---

### 2. Ajouter la Variable CORS_ORIGINS

Cliquer sur "Add Environment Variable" et ajouter :

**Clé** : `CORS_ORIGINS`

**Valeur** : `https://archify-project.vercel.app,http://localhost:4200`

---

### 3. Redéployer le Service

1. Cliquer sur "Save Changes"
2. Render va automatiquement redéployer le service
3. Attendre 2-3 minutes que le service redémarre

---

## 🔍 Vérification

Une fois redéployé, tester :

```bash
curl -H "Origin: https://archify-project.vercel.app" -I https://archify-backend.onrender.com/healthz
```

Vous devriez voir dans les headers :
```
Access-Control-Allow-Origin: https://archify-project.vercel.app
```

---

## 📊 Variables d'Environnement Complètes

Après cet ajout, votre backend Render devrait avoir ces variables :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `postgresql://archify:***@***` | Connexion PostgreSQL (copié depuis DB) |
| `JWT_SECRET` | `[votre clé secrète]` | Secret pour signer les JWT |
| `NODE_ENV` | `production` | Mode de production |
| `PORT` | `10000` | Port (automatique sur Render) |
| **`CORS_ORIGINS`** | `https://archify-project.vercel.app,http://localhost:4200` | **NOUVEAU - Origins autorisées** |

---

## 🧠 Pourquoi C'est Nécessaire ?

Le code backend utilise cette variable pour déterminer quelles origines peuvent faire des requêtes :

**Fichier** : [backend/src/index.ts](backend/src/index.ts:28-30)

```typescript
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());
```

**Sans cette variable**, le backend n'acceptera QUE `http://localhost:4200` (valeur par défaut).

**Avec cette variable**, le backend acceptera :
- ✅ `https://archify-project.vercel.app` (Production)
- ✅ `http://localhost:4200` (Développement local)

---

## 🚨 Symptômes si la Variable est Manquante

Si vous testez le frontend Vercel **sans** ajouter `CORS_ORIGINS`, vous verrez :

### Dans le navigateur (Console F12) :
```
Access to fetch at 'https://archify-backend.onrender.com/api/courses'
from origin 'https://archify-project.vercel.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Dans le Network tab :
- Status : `(failed) net::ERR_FAILED`
- Type : `cors`

### Comportement visible :
- Page d'accueil charge
- Mais aucun cours ne s'affiche
- Aucun utilisateur ne peut se connecter
- Toutes les requêtes API échouent

---

## ✅ Après l'Ajout de la Variable

### Le frontend pourra :
- ✅ Récupérer la liste des cours
- ✅ Authentifier les utilisateurs (login/register)
- ✅ Soumettre des paiements
- ✅ Lire les vidéos de cours
- ✅ Poster des commentaires
- ✅ Accéder au tableau de bord admin

---

## 🔄 Ordre des Opérations

1. **✅ Backend déployé sur Render** (fait)
2. **✅ Frontend configuré pour utiliser backend Render** (fait)
3. **✅ Changements poussés sur GitHub** (fait)
4. **⏳ Vercel redéploie automatiquement** (en cours ou fait)
5. **❌ Variable CORS_ORIGINS ajoutée sur Render** (À FAIRE MAINTENANT)
6. **⏳ Render redéploie avec nouvelle variable** (après ajout)
7. **⏳ Tests end-to-end** (après redéploiement)

---

## 📝 Résumé

### À Faire Maintenant :

1. Aller sur : https://dashboard.render.com
2. Service : `archify-backend`
3. Section : "Environment"
4. Ajouter : `CORS_ORIGINS` = `https://archify-project.vercel.app,http://localhost:4200`
5. Cliquer : "Save Changes"
6. Attendre : 2-3 minutes (redéploiement automatique)

### Ensuite :
7. Tester : Ouvrir `https://archify-project.vercel.app`
8. Vérifier : Catalogue de cours visible
9. Tester : Login/Register
10. Célébrer : 🎉 Application complètement fonctionnelle !

---

**Priorité** : 🔴 **CRITIQUE - À faire immédiatement**

**Temps estimé** : 2 minutes + 3 minutes de redéploiement

**Impact** : Sans cette variable, le frontend Vercel ne peut PAS communiquer avec le backend.

---

**Date** : 16 octobre 2025
**Status** : ⚠️ Action requise avant tests end-to-end
