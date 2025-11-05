# Guide d'Import de Matières Complètes - FacGame

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs d'importer une matière complète avec tous ses chapitres et questions en une seule opération via le dashboard admin.

## Accès à la fonctionnalité

1. Connectez-vous au dashboard admin : `/admin`
2. Cliquez sur l'onglet **"Importer Matière"**
3. Vous verrez une interface avec :
   - Instructions d'utilisation
   - Un exemple de format JSON
   - Un formulaire de saisie

## Format JSON requis

```json
{
  "subject": {
    "title": "Nom de la matière",
    "description": "Description de la matière",
    "semester": "PCEM1",
    "totalQCM": 600
  },
  "chapters": [
    {
      "title": "Chapitre 1 : Titre",
      "description": "Description du chapitre",
      "orderIndex": 0,
      "pdfUrl": null,
      "questions": [
        {
          "questionText": "Votre question ici ?",
          "options": [
            {
              "text": "Option A",
              "isCorrect": true,
              "justification": "Explication pourquoi c'est correct"
            },
            {
              "text": "Option B",
              "isCorrect": false,
              "justification": "Explication pourquoi c'est faux"
            }
          ],
          "explanation": "Explication générale de la question",
          "orderIndex": 0
        }
      ]
    }
  ]
}
```

## Structure détaillée

### Objet `subject`
| Champ | Type | Requis | Description |
|-------|------|---------|-------------|
| `title` | string | ✅ Oui | Nom de la matière |
| `description` | string | ❌ Non | Description détaillée |
| `semester` | string | ✅ Oui | "PCEM1", "PCEM2" ou "DCEM1" |
| `totalQCM` | number | ❌ Non | Nombre total de QCM (défaut: 600) |

### Objet `chapters` (array)
| Champ | Type | Requis | Description |
|-------|------|---------|-------------|
| `title` | string | ✅ Oui | Titre du chapitre |
| `description` | string | ❌ Non | Description du chapitre |
| `orderIndex` | number | ❌ Non | Ordre d'affichage (défaut: 0) |
| `pdfUrl` | string | ❌ Non | URL du PDF du cours |
| `questions` | array | ❌ Non | Tableau de questions |

### Objet `questions` (array)
| Champ | Type | Requis | Description |
|-------|------|---------|-------------|
| `questionText` | string | ✅ Oui | Texte de la question |
| `options` | array | ✅ Oui | Options de réponse (min 2) |
| `explanation` | string | ❌ Non | Explication générale |
| `orderIndex` | number | ❌ Non | Ordre d'affichage (défaut: 0) |

### Objet `options` (array)
| Champ | Type | Requis | Description |
|-------|------|---------|-------------|
| `text` | string | ✅ Oui | Texte de l'option |
| `isCorrect` | boolean | ✅ Oui | Si cette option est correcte |
| `justification` | string | ❌ Non | Explication de l'option |

## Exemple complet : Biochimie

```json
{
  "subject": {
    "title": "Biochimie",
    "description": "Cours de biochimie médicale pour PCEM1",
    "semester": "PCEM1",
    "totalQCM": 100
  },
  "chapters": [
    {
      "title": "Chapitre 1 : Les Glucides",
      "description": "Introduction aux glucides et leur métabolisme",
      "orderIndex": 0,
      "pdfUrl": null,
      "questions": [
        {
          "questionText": "Qu'est-ce qu'un monosaccharide ?",
          "options": [
            {
              "text": "Un sucre simple non hydrolysable",
              "isCorrect": true,
              "justification": "Les monosaccharides sont les sucres les plus simples, comme le glucose"
            },
            {
              "text": "Un sucre complexe formé de plusieurs unités",
              "isCorrect": false,
              "justification": "Ce sont les polysaccharides qui sont complexes"
            },
            {
              "text": "Un lipide simple",
              "isCorrect": false,
              "justification": "Les lipides sont différents des glucides"
            },
            {
              "text": "Une protéine",
              "isCorrect": false,
              "justification": "Les protéines sont des polymères d'acides aminés"
            }
          ],
          "explanation": "Les monosaccharides (glucose, fructose, galactose) sont l'unité de base des glucides",
          "orderIndex": 0
        },
        {
          "questionText": "Quel est le principal monosaccharide du sang ?",
          "options": [
            {
              "text": "Le glucose",
              "isCorrect": true,
              "justification": "La glycémie mesure le taux de glucose sanguin"
            },
            {
              "text": "Le fructose",
              "isCorrect": false,
              "justification": "Le fructose est métabolisé par le foie"
            },
            {
              "text": "Le galactose",
              "isCorrect": false,
              "justification": "Le galactose est converti en glucose"
            }
          ],
          "explanation": "Le glucose est le carburant principal du corps humain",
          "orderIndex": 1
        }
      ]
    },
    {
      "title": "Chapitre 2 : Les Lipides",
      "description": "Structure et fonction des lipides",
      "orderIndex": 1,
      "pdfUrl": "https://example.com/lipides.pdf",
      "questions": [
        {
          "questionText": "Quelle est la structure de base des acides gras ?",
          "options": [
            {
              "text": "Une chaîne hydrocarbonée avec un groupe carboxyle",
              "isCorrect": true,
              "justification": "Les acides gras ont une queue hydrophobe et une tête carboxyle"
            },
            {
              "text": "Un cycle benzénique",
              "isCorrect": false,
              "justification": "Les cycles benzéniques sont des structures aromatiques"
            }
          ],
          "explanation": "Les acides gras sont les composants de base des lipides complexes",
          "orderIndex": 0
        }
      ]
    }
  ]
}
```

## Utilisation

### Étapes d'import

1. **Préparez votre JSON** : Utilisez l'exemple ci-dessus comme modèle
2. **Validez le JSON** : Assurez-vous qu'il est syntaxiquement correct (utilisez jsonlint.com)
3. **Copiez le JSON** : Collez-le dans la zone de texte du dashboard
4. **Cliquez sur "Importer la Matière"**
5. **Attendez la confirmation** : Vous verrez un message de succès avec le nombre de chapitres et questions importés

### Boutons disponibles

- **"Copier l'exemple"** : Remplit automatiquement le formulaire avec l'exemple
- **"Importer la Matière"** : Lance l'importation (devient gris pendant le traitement)
- **"Effacer"** : Vide le formulaire

## Conseils et bonnes pratiques

### ✅ À faire

- Vérifier que chaque question a **au moins une option correcte**
- Utiliser des **justifications** pour chaque option (enrichit l'apprentissage)
- Utiliser **orderIndex** pour contrôler l'ordre d'affichage
- Tester avec un petit exemple avant d'importer beaucoup de données
- Sauvegarder votre JSON dans un fichier avant d'importer

### ❌ À éviter

- Ne pas importer de doublons (vérifiez si la matière existe déjà)
- Ne pas mettre de caractères spéciaux non-échappés dans le JSON
- Ne pas oublier les virgules entre les objets
- Ne pas utiliser de semestre invalide (seulement PCEM1, PCEM2, DCEM1)

## Messages d'erreur courants

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Format JSON invalide" | Syntaxe JSON incorrecte | Validez avec jsonlint.com |
| "Subject title and semester are required" | Champs manquants | Ajoutez title et semester |
| "At least one chapter is required" | Tableau chapters vide | Ajoutez au moins un chapitre |
| "FORBIDDEN" | Pas les droits admin | Connectez-vous en tant qu'admin |

## API Backend

### Endpoint
```
POST /api/admin/create-subject-complete
```

### Headers
```
Content-Type: application/json
Cookie: accessToken=<jwt-token>
```

### Réponse succès (201)
```json
{
  "success": true,
  "message": "Subject, chapters, and questions created successfully",
  "data": {
    "subject": {
      "id": "...",
      "title": "Biochimie",
      ...
    },
    "chaptersCount": 2,
    "questionsCount": 15
  }
}
```

### Réponse erreur (400/403/500)
```json
{
  "error": {
    "code": "CREATE_ERROR",
    "message": "Failed to create subject",
    "details": "..."
  }
}
```

## Exemple avec cURL

```bash
curl -X POST http://localhost:3000/api/admin/create-subject-complete \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN" \
  -d @subject-data.json
```

## Limitations

- Taille maximale du JSON : ~10 MB (limite Express)
- Pas de validation de duplication (vérifiezmanually)
- Import synchrone (peut prendre du temps pour beaucoup de questions)

## Support

En cas de problème :
1. Vérifiez les logs backend dans la console
2. Vérifiez les logs frontend dans la console navigateur (F12)
3. Testez avec l'exemple fourni
4. Contactez l'équipe de développement

## Versions

- **v1.0.0** (2025-11-05) : Première version
  - Import complet matière + chapitres + questions
  - Validation basique
  - Messages d'erreur détaillés
