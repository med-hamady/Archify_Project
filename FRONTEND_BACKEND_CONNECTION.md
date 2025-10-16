# 🔗 Connexion Frontend Vercel ↔ Backend Render

## ✅ Configuration Actuelle

### Backend Render
- **URL** : `https://archify-backend.onrender.com`
- **Base de données** : PostgreSQL sur Render
- **Status** : ✅ Live et fonctionnel

### Frontend Vercel
- **URL** : `https://archify-project.vercel.app` (à venir)
- **API URL** : Configurée pour pointer vers Render

---

## 📁 Fichiers de Configuration

### Environment de Production

**Fichier** : `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://archify-backend.onrender.com/api'
};
```

**Utilisé par** : Build de production (Vercel)

---

### Environment de Développement

**Fichier** : `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**Utilisé par** : Développement local (`ng serve`)

---

## 🔄 Comment Ça Fonctionne

### En Production (Vercel)

1. **Vercel build** le frontend avec `ng build`
2. **Angular** utilise `environment.prod.ts`
3. **Toutes les requêtes API** vont vers `https://archify-backend.onrender.com/api`

### En Développement (Local)

1. **Vous lancez** `ng serve`
2. **Angular** utilise `environment.ts`
3. **Toutes les requêtes API** vont vers `http://localhost:3000/api`

---

## 🧪 Tests à Effectuer

### Après Déploiement Vercel

1. **Ouvrir** : `https://archify-project.vercel.app`
2. **Tester l'authentification** :
   - Se connecter avec un compte existant
   - Créer un nouveau compte
3. **Tester les cours** :
   - Voir la liste des cours
   - Accéder à un cours
4. **Vérifier les logs** :
   - Ouvrir DevTools (F12)
   - Onglet Network
   - Vérifier que les requêtes vont vers `archify-backend.onrender.com`

---

## 🔒 CORS Configuration

Le backend est configuré pour accepter les requêtes depuis Vercel.

**Fichier** : `backend/src/index.ts`

```typescript
app.use(cors({
  origin: [
    'https://archify-project.vercel.app',  // Production Vercel
    'http://localhost:4200'  // Développement local
  ],
  credentials: true
}));
```

---

## 🚨 Problèmes Potentiels

### Erreur : "CORS policy"

**Cause** : Le backend n'accepte pas l'URL du frontend

**Solution** : Ajouter l'URL Vercel dans la configuration CORS du backend

---

### Erreur : "Network Error" ou "Failed to fetch"

**Cause** : Le backend Render est endormi (plan gratuit)

**Solution** :
- Le backend se réveille automatiquement (~30 secondes)
- Rafraîchir la page après quelques secondes

---

### Erreur : "404 Not Found"

**Cause** : URL de l'API incorrecte

**Solution** : Vérifier `environment.prod.ts`

---

## 📊 Architecture Complète

```
┌─────────────────────────────────────────┐
│          GitHub Repository              │
│       (Source de vérité)                │
└─────────────────────────────────────────┘
           │                    │
           │ Auto-deploy        │ Auto-deploy
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

## 🔗 URLs Finales

### Production
- **Frontend** : `https://archify-project.vercel.app`
- **Backend** : `https://archify-backend.onrender.com`
- **API** : `https://archify-backend.onrender.com/api`

### Développement Local
- **Frontend** : `http://localhost:4200`
- **Backend** : `http://localhost:3000`
- **API** : `http://localhost:3000/api`

---

## ✅ Checklist de Déploiement

- [x] Backend déployé sur Render
- [x] Base de données PostgreSQL créée
- [x] Migrations Prisma exécutées
- [x] Backend testé et fonctionnel
- [x] `environment.prod.ts` configuré avec URL Render
- [ ] Changements commités et poussés sur GitHub
- [ ] Frontend redéployé sur Vercel
- [ ] Tests end-to-end effectués

---

**Version** : 1.0
**Date** : 16 octobre 2025
**Statut** : Configuration complète prête pour le déploiement
