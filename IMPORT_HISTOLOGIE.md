# 📚 Import Histologie PCEM2 - Documentation

## ✅ Résultat Final

Deux matières d'histologie coexistent maintenant dans le système :

### 1. **Histologie** (Cours Classique)
- **Source** : `C:\Users\pc\Desktop\FAC GAME\pcem2\S INETR\quiz pcem2\histo`
- **Chapitres** : 10
- **Questions** : 199
- **Format** : Sections emoji (1️⃣, 2️⃣) avec ✔️/❌

| # | Chapitre | Questions |
|---|----------|-----------|
| 1 | Histologie de l'Épithélium | 20 |
| 2 | Tissu conjonctif, cartilagineux et osseux | 20 |
| 3 | Sang et organes hématopoïétiques | 20 |
| 4 | Tissu musculaire | 20 |
| 5 | Tissu nerveux | 20 |
| 6 | Appareil digestif | 20 |
| 7 | Appareil respiratoire | 19 |
| 8 | Appareil urinaire | 20 |
| 9 | Appareil génital | 20 |
| 10 | Glandes endocrines | 20 |
| **TOTAL** | | **199** |

### 2. **Histo Nozha** (Examens)
- **Source** : `C:\Users\pc\Desktop\Archify_Project\backend\data\histo-nozha`
- **Chapitres** : 7
- **Questions** : 249
- **Format** : QCM numérotés avec (✅)/(❌)/(⚠️)

| # | Chapitre | Questions |
|---|----------|-----------|
| 1 | Glandes endocrines | 26 |
| 2 | Système digestif | 37 |
| 3 | Système lymphoïde | 42 |
| 4 | Système respiratoire | 30 |
| 5 | Système tégumentaire | 33 |
| 6 | Appareil urinaire | 56 |
| 7 | Glandes annexes | 25 |
| **TOTAL** | | **249** |

## 🚀 Commandes Disponibles

### Import des Matières

```bash
# Import Histologie (cours classique)
npm run import:histologie:pcem2

# Import Histo Nozha (examens)
npm run import:histo-nozha:pcem2
```

### Nettoyage des Matières

```bash
# Nettoyer Histologie uniquement
npm run clear:histologie:pcem2

# Nettoyer Histo Nozha uniquement
npm run clear:histo-nozha:pcem2
```

### Restauration Complète

```bash
# Restaurer les deux matières (nettoie + réimporte)
npm run restore:histologie
```

## 📁 Structure des Fichiers

```
backend/
├── src/
│   ├── import-histologie-pcem2.ts      # Import Histologie classique
│   ├── import-histo-nozha-pcem2.ts    # Import Histo Nozha (examens)
│   ├── clear-histologie-pcem2.ts       # Nettoyage Histologie
│   ├── clear-histo-pcem2.ts            # Nettoyage Histo Nozha
│   ├── restore-histologie-v2.ts        # Restauration complète
│   ├── check-subjects-state.ts         # Vérification état
│   └── check-all-subjects.ts           # Liste matières PCEM2
│
└── data/
    └── histo-nozha/                    # Fichiers sources Histo Nozha
        ├── Exam glandes endocrines isolé.txt
        ├── Exam système digestif isolé.txt
        ├── Exam système lymphoïde isolé.txt
        ├── Exam système respiratoire isolé.txt
        ├── Exam système tégumentaire isolé.txt
        ├── Examen  Appareil urinaire isolé.txt
        └── Examen  Glandes annexes isolé.txt
```

## 🔍 Différences entre les Formats

### Format Histologie (Cours Classique)

```
🧬 Chapitre 3 : Sang et organes hématopoïétiques

(20 QCM – difficulté progressive)

1️⃣ Nature du sang

Question : Le sang est considéré comme :
A. Un tissu conjonctif spécial ✔️
B. Un tissu épithélial ❌ — Il ne contient pas de cellules jointives.
C. Une matrice solide ❌ — Sa matrice est liquide (plasma).

Justification : Le sang est un tissu conjonctif liquide...
```

**Caractéristiques** :
- Sections numérotées avec emoji (1️⃣, 2️⃣, 3️⃣...)
- Symboles : ✔️ (correct) et ❌ (incorrect)
- Justifications précédées de " — "
- Explication globale après les options

### Format Histo Nozha (Examens)

```
A – HYPOPHYSE

QCM 1 — Les neurones parvocellulaires :

A. Sont situés au niveau de l'adénohypophyse. (❌) → Situés dans l'hypothalamus.
B. Sécrètent la GnRH dans le réseau capillaire. (✅)
C. Sécrètent la FSH et la LH. (❌) → Ces hormones sont produites par l'adénohypophyse.

🩵 Conclusion :
Les neurones parvocellulaires hypothalamiques sécrètent la GnRH...
```

**Caractéristiques** :
- QCM numérotés (QCM 1 —, QCM 2 —...)
- Symboles : (✅) correct, (❌) incorrect, (⚠️) partial
- Justifications précédées de " → "
- Conclusion globale avec 🩵

## 🎯 Système de Scoring

### Histologie (Cours Classique)
- ✔️ Correct : +1 point si sélectionné, -0.25 si raté
- ❌ Incorrect : -0.25 si sélectionné, 0 sinon

### Histo Nozha (Examens)
- (✅) Correct : +1 point si sélectionné, -0.25 si raté
- (❌) Incorrect : -0.25 si sélectionné, 0 sinon
- (⚠️) Partial : 0 impact (neutre pour score et XP)

## 📊 Vérification

### Vérifier l'état actuel

```bash
cd backend
npm run build

# Liste toutes les matières PCEM2
node dist/check-all-subjects.js

# Détails des matières Histologie
node dist/check-subjects-state.js
```

**Résultat attendu** :

```
📚 Nombre total de matières PCEM2: 4

   - Anatomie (Chapitres: 22)
   - Histologie (Chapitres: 10)
   - Histo Nozha (Chapitres: 7)
   - Physiologie (Chapitres: 1)
```

## 🔄 Workflow de Déploiement

### En Local

```bash
# 1. Build
cd backend
npm run build

# 2. Import Histologie classique
npm run import:histologie:pcem2

# 3. Import Histo Nozha (examens)
npm run import:histo-nozha:pcem2

# 4. Vérifier
node dist/check-all-subjects.js
```

### En Production (Render Shell)

```bash
# Option 1: Import séparé
npm run import:histologie:pcem2
npm run import:histo-nozha:pcem2

# Option 2: Restauration complète
npm run restore:histologie
```

## ⚠️ Notes Importantes

1. **Sources locales uniquement** : Les fichiers Histologie classique ne sont pas dans le repo (trop volumineux). L'import ne fonctionne qu'en local.

2. **Idempotence** : Les scripts sont idempotents. Ils vérifient si les données existent déjà avant d'importer.

3. **Production** : En production sur Render, seul Histo Nozha sera importé automatiquement (fichiers inclus dans le repo).

4. **Encodage** : Gère automatiquement les noms de fichiers avec accents (Chapitre 1  Histologie de l'Épit.txt).

## ✅ Tests Effectués

- ✅ Import Histologie : 199 questions importées
- ✅ Import Histo Nozha : 249 questions importées
- ✅ Les deux matières coexistent sans conflit
- ✅ Parsing des deux formats différents
- ✅ Système à 3 états pour Histo Nozha (✅❌⚠️)
- ✅ Justifications et conclusions préservées
- ✅ Build TypeScript sans erreur
- ✅ Idempotence vérifiée

## 📝 Historique

### Version 1 (Problème)
- Les données Histo Nozha étaient mélangées avec Histologie
- 57 chapitres désorganisés

### Version 2 (Solution)
- Séparation en 2 matières distinctes
- Script de restauration créé
- Import correct des deux sources

### Version 3 (Actuel)
- Import Histologie classique ajouté
- 199 questions + 249 questions = **448 questions totales**
- Documentation complète
