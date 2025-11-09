# 🚀 Workflow de Déploiement Automatique - Histo Nozha PCEM2

## 📋 Vue d'ensemble

Le script d'import Histo Nozha PCEM2 s'exécute **automatiquement** lors de chaque déploiement sur Render.com.

## 🔄 Processus de Déploiement

### 1. Modifications Locales

```bash
# Faire vos modifications de code
# ...

# Build le projet (compile TypeScript)
cd backend
npm run build
```

### 2. Commit & Push vers GitHub

```bash
git add .
git commit -m "feat: Add Histo Nozha PCEM2 import with 3-state answer system"
git push origin main
```

### 3. Déploiement Automatique sur Render

Render détecte automatiquement le push et lance le déploiement:

```bash
# 1. Build (exécuté par Render)
npm run build

# 2. Start (exécuté par Render)
npm start
  ├─ npx prisma db push        # Synchronise le schéma DB
  ├─ node dist/import-histo-nozha-pcem2.js  # Import Histo (idempotent)
  └─ node dist/index.js         # Démarre le serveur
```

## 🎯 Comportement du Script lors du Déploiement

### Premier Déploiement (Base vide)

```
🚀 Début de l'import Histo Nozha PCEM2

⚠️  Dossier source non trouvé: C:\Users\pc\Desktop\FAC GAME\pcem2\Histo Nozha
   Import ignoré (normal en production sur Render.com).

🎉 Script terminé avec succès
```

**Résultat**: Le serveur démarre normalement, les données seront importées manuellement via SQL dump.

### Déploiements Suivants (Données déjà présentes)

Si vous importez les données manuellement en production, les prochains déploiements afficheront:

```
🚀 Début de l'import Histo Nozha PCEM2

📚 Recherche/création de la matière Histologie...
✅ Données Histo PCEM2 déjà présentes:
   📚 Matière: Histologie
   📑 Chapitres: 57
   ❓ Questions: 249

⏭️  Import ignoré pour éviter les doublons.

🎉 Script terminé avec succès
```

**Résultat**: Le serveur démarre normalement, aucun doublon créé.

## 📊 Import des Données en Production

Puisque les fichiers sources (`.txt`) sont uniquement sur votre machine locale, voici comment peupler la base de production:

### Option 1: Export SQL (Recommandé)

```bash
# 1. Sur votre machine locale - Générer le dump SQL
cd backend
npm run build
npx tsc src/export-histo-pcem2-sql.ts --outDir dist --esModuleInterop --skipLibCheck
npm run export:histo:sql > histo-pcem2-dump.sql

# 2. Le fichier histo-pcem2-dump.sql contient tous les INSERT statements
```

### Option 2: Importer le SQL sur Render

#### Via Shell Render (Méthode Simple)

1. Aller sur [render.com](https://render.com)
2. Sélectionner votre service PostgreSQL
3. Cliquer sur "Shell" ou "Connect"
4. Copier/coller le contenu de `histo-pcem2-dump.sql`

#### Via psql (Méthode Professionnelle)

```bash
# Récupérer l'URL de connexion depuis Render.com
# Dashboard > PostgreSQL > "External Database URL"

psql "postgresql://user:password@host:port/database" < histo-pcem2-dump.sql
```

### Option 3: Via Interface Admin

Utiliser l'onglet "Ajouter Contenu" dans le dashboard admin pour créer manuellement:
1. La matière "Histologie" (PCEM2)
2. Les 7 chapitres
3. Les 249 questions avec leurs options

## 🔧 Configuration Render.com

### Build Command

```bash
npm install && npm run build
```

### Start Command

```bash
npm start
```

Le script `npm start` exécute dans l'ordre:
1. `prisma db push` - Synchronise le schéma DB
2. `node dist/import-histo-nozha-pcem2.js` - Import Histo (idempotent)
3. `node dist/index.js` - Démarre le serveur Express

## ⚙️ Variables d'Environnement

Assurez-vous que ces variables sont configurées sur Render:

- `DATABASE_URL` - URL de connexion PostgreSQL
- `NODE_ENV=production` - Mode production
- `RENDER=true` - Détecté automatiquement par Render

## 🧪 Tester en Local avant le Push

```bash
# 1. Build
cd backend
npm run build

# 2. Test du script d'import
npm run import:histo:pcem2

# 3. Vérifier l'idempotence (doit afficher "Import ignoré")
npm run import:histo:pcem2

# 4. Test du démarrage complet
npm start
```

## 📝 Commandes Utiles

```bash
# Import manuel (idempotent)
npm run import:histo:pcem2

# Nettoyer les données Histo PCEM2
npm run clear:histo:pcem2

# Export SQL pour production
npm run export:histo:sql > dump.sql

# Réimport complet
npm run clear:histo:pcem2 && npm run import:histo:pcem2
```

## 🚨 Dépannage

### Le serveur ne démarre pas après le déploiement

**Vérifier les logs Render**:
1. Aller sur Render Dashboard
2. Sélectionner votre service
3. Cliquer sur "Logs"
4. Chercher les messages du script d'import

**Erreur commune**: Le script d'import échoue mais ne bloque pas le démarrage grâce à la gestion d'erreur en production.

### Les données Histo ne sont pas présentes

1. Vérifier que le script s'est exécuté: chercher dans les logs Render
2. Si "Import ignoré" → les données existent déjà
3. Si "Dossier source non trouvé" → normal en production, importer via SQL dump
4. Vérifier la base de données:
```bash
# Via Shell Render
psql $DATABASE_URL
SELECT COUNT(*) FROM "Question" WHERE "chapterId" IN (
  SELECT id FROM "Chapter" WHERE "subjectId" IN (
    SELECT id FROM "Subject" WHERE title = 'Histologie' AND semester = 'PCEM2'
  )
);
```

### Besoin de réimporter en production

```bash
# 1. Via Shell Render
npm run clear:histo:pcem2

# 2. Puis soit:
#    - Réexécuter le dump SQL
#    - OU redéployer (le script tentera l'import)
```

## ✅ Checklist de Déploiement

Avant de pousser vers GitHub:

- [ ] `npm run build` passe sans erreur
- [ ] `npm run import:histo:pcem2` s'exécute correctement en local
- [ ] Le script affiche "Import ignoré" à la 2ème exécution
- [ ] Le serveur démarre avec `npm start`
- [ ] Les tests passent (si applicable)
- [ ] Le dump SQL est généré: `npm run export:histo:sql > dump.sql`

Après le push:

- [ ] Vérifier que Render a détecté le commit
- [ ] Surveiller les logs de build
- [ ] Vérifier que le script d'import s'est exécuté
- [ ] Vérifier que le serveur démarre correctement
- [ ] Tester l'API en production

## 📍 Fichiers Impliqués

- [backend/package.json](backend/package.json) - Configuration des scripts
- [backend/src/import-histo-nozha-pcem2.ts](backend/src/import-histo-nozha-pcem2.ts) - Script d'import
- [backend/src/export-histo-pcem2-sql.ts](backend/src/export-histo-pcem2-sql.ts) - Export SQL
- [backend/src/clear-histo-pcem2.ts](backend/src/clear-histo-pcem2.ts) - Nettoyage
- [DEPLOIEMENT_HISTO.md](DEPLOIEMENT_HISTO.md) - Documentation détaillée

---

## 🎉 Résumé

Avec cette configuration, **chaque déploiement sur Render**:
1. ✅ Build le code TypeScript
2. ✅ Synchronise le schéma DB avec Prisma
3. ✅ Tente l'import Histo (idempotent, ne fait rien si déjà présent)
4. ✅ Démarre le serveur Express

Le script est **safe** et **ne bloquera jamais** le déploiement! 🚀
