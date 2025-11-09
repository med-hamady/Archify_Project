# 🚀 Déploiement - Import Histo Nozha PCEM2

## 📋 Vue d'ensemble

Le script d'import Histo Nozha PCEM2 est maintenant **idempotent** et **safe pour la production**:

- ✅ Vérifie si les données existent déjà avant d'importer
- ✅ Ignore l'import en production si les fichiers sources ne sont pas disponibles
- ✅ Ne fait pas échouer le build en cas d'erreur
- ✅ Peut être exécuté manuellement après déploiement

## 🔧 Méthodes d'Exécution

### Option 1: Import Automatique lors du Build Local

```bash
cd backend
npm run build
npm run import:histo:pcem2
```

Le script vérifiera automatiquement:
- Si les fichiers sources existent
- Si les données sont déjà en base
- N'importera que si nécessaire

### Option 2: Import Manuel sur Render.com

#### Étape 1: Se connecter au shell Render

1. Aller sur [render.com](https://render.com)
2. Sélectionner votre service backend
3. Cliquer sur "Shell" dans le menu de gauche

#### Étape 2: Exécuter l'import

```bash
# Vérifier que le script est compilé
ls dist/import-histo-nozha-pcem2.js

# Lancer l'import
npm run import:histo:pcem2
```

Le script affichera:
- ⏭️ "Import ignoré" si les données existent déjà (249 questions)
- 📥 "Lancement de l'import" si les données manquent
- ⚠️ "Dossier source non trouvé" en production (normal, fichiers en local uniquement)

### Option 3: Import avec Base de Données Locale

Si vous développez en local avec une base PostgreSQL locale:

```bash
cd backend

# 1. Build le projet
npm run build

# 2. Importer (première fois ou réimport)
npm run import:histo:pcem2

# 3. Si besoin de nettoyer avant réimport
npm run clear:histo:pcem2
npm run import:histo:pcem2
```

## 📊 Comportement du Script

### En Développement (Local)

```
🚀 Début de l'import Histo Nozha PCEM2

📚 Recherche/création de la matière Histologie...
✅ Matière "Histologie" trouvée

✅ Données Histo PCEM2 déjà présentes:
   📚 Matière: Histologie
   📑 Chapitres: 50
   ❓ Questions: 249

⏭️  Import ignoré pour éviter les doublons.

🎉 Script terminé avec succès
```

### En Production (Render.com)

```
🚀 Début de l'import Histo Nozha PCEM2

⚠️  Dossier source non trouvé: C:\Users\pc\Desktop\FAC GAME\pcem2\Histo Nozha
   Import ignoré (normal en production sur Render.com).

🎉 Script terminé avec succès
```

## 🗄️ Import Initial de Données en Production

Puisque les fichiers sources sont uniquement en local, voici comment peupler la base de production:

### Méthode Recommandée: Export/Import SQL

```bash
# 1. Sur votre machine locale, exporter les données Histo
cd backend
node dist/export-histo-pcem2-sql.js > histo-pcem2-dump.sql

# 2. Uploader le dump sur Render via pgAdmin ou psql
# Connectez-vous à votre base PostgreSQL sur Render
# puis exécutez le script SQL
```

### Méthode Alternative: API Admin

Utilisez l'interface admin que nous avons créée pour ajouter:
1. La matière "Histologie" (PCEM2)
2. Les chapitres un par un
3. Les questions via l'interface "Ajouter Contenu"

## 📝 Scripts Disponibles

```json
{
  "import:histo:pcem2": "Import Histo Nozha (idempotent, safe)",
  "clear:histo:pcem2": "Nettoie toutes les données Histo PCEM2",
  "build": "Compile TypeScript vers dist/",
  "start": "Démarre le serveur (avec Prisma db push)"
}
```

## ⚠️ Notes Importantes

1. **Fichiers Sources**: Les fichiers `.txt` dans `C:\Users\pc\Desktop\FAC GAME\pcem2\Histo Nozha\` sont uniquement sur votre machine locale

2. **Production**: En production, les données doivent être:
   - Importées localement puis synchronisées via dump SQL
   - OU créées via l'interface admin
   - OU la base de dev peut être clonée vers prod

3. **Idempotence**: Le script peut être exécuté plusieurs fois sans danger:
   ```
   Exécution 1: ✅ Import de 249 questions
   Exécution 2: ⏭️ Données déjà présentes, ignoré
   Exécution 3: ⏭️ Données déjà présentes, ignoré
   ```

4. **Erreurs en Production**: Si une erreur survient en production, le build ne sera pas bloqué (exit 0)

## 🔄 Workflow de Déploiement Complet

### Déploiement avec Nouvelles Données

```bash
# 1. Local: Importer les nouvelles données
cd backend
npm run build
npm run import:histo:pcem2

# 2. Local: Vérifier que tout fonctionne
npm run start:dev

# 3. Git: Commit et push
git add .
git commit -m "feat: Add Histo Nozha PCEM2 import (249 QCMs)"
git push origin main

# 4. Render: Auto-déploiement détecté
# Le build se fera automatiquement

# 5. Production: Copier les données
# Option A: Dump SQL de dev vers prod
# Option B: Exécuter l'import manuellement si fichiers disponibles
```

## 🧪 Tester l'Import

```bash
# Test 1: Import initial
npm run clear:histo:pcem2
npm run import:histo:pcem2
# Attendu: 249 questions importées

# Test 2: Idempotence
npm run import:histo:pcem2
# Attendu: Import ignoré

# Test 3: Réimport
npm run clear:histo:pcem2 && npm run import:histo:pcem2
# Attendu: 249 questions réimportées
```

## 📍 Fichiers Impliqués

- [backend/src/import-histo-nozha-pcem2.ts](backend/src/import-histo-nozha-pcem2.ts) - Script principal
- [backend/src/clear-histo-pcem2.ts](backend/src/clear-histo-pcem2.ts) - Script de nettoyage
- [backend/package.json](backend/package.json) - Scripts NPM
- [backend/src/services/xp.service.ts](backend/src/services/xp.service.ts) - Système 3 états (✅❌⚠️)

---

✅ **Le script est maintenant prêt pour le déploiement automatique!**
