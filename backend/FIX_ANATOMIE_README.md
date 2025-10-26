# Fix Anatomie PCEM2 - Instructions

## Problème
Les quiz d'anatomie PCEM2 n'ont importé que 28 questions au lieu de 200. Les questions sont toutes mélangées dans un seul chapitre au lieu d'être réparties dans 10 chapitres de 20 questions chacun.

## Solution
Un script de correction `fix-anatomie-pcem2.ts` a été créé pour réimporter correctement toutes les questions.

## Comment exécuter sur Render

### Étape 1 : Déployer le code
Les fichiers sont déjà poussés sur GitHub. Render va automatiquement redéployer.

### Étape 2 : Exécuter le script de correction via le Shell Render

1. Allez sur https://dashboard.render.com
2. Sélectionnez votre service backend "archify-project-backend"
3. Cliquez sur l'onglet "Shell" dans le menu de gauche
4. Dans le terminal, exécutez :

```bash
npm run fix:anatomie
```

### Résultat attendu
```
🚀 Démarrage de la réimportation des quiz d'anatomie PCEM2...
📚 Sujet trouvé: Anatomie (10 chapitres)
🗑️  Suppression des anciennes questions...
✅ 28 anciennes questions supprimées
📂 10 fichiers trouvés dans le dossier anatomie
...
🎉 Import terminé avec succès !
📊 Total: 200 questions importées dans 10 chapitres
```

### Vérification
Après l'exécution, vérifiez dans l'application que :
- 10 chapitres d'anatomie PCEM2 sont visibles
- Chaque chapitre contient 20 questions
- Les questions ne sont plus mélangées

## Alternative : Exécuter en local puis pousser la DB
Si vous préférez, vous pouvez :
1. Exécuter le script localement : `npm run fix:anatomie`
2. Faire un dump de votre base locale
3. Restaurer ce dump sur la base de production

Mais la méthode Shell Render est plus simple et plus directe.
