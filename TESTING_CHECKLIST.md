# ✅ Checklist de Tests End-to-End - Archify Production

**URL Production** : https://archify-project.vercel.app
**API Backend** : https://archify-backend.onrender.com/api
**Date** : 16 octobre 2025

---

## ⚠️ Prérequis Avant les Tests

### 1. Vérifier que Render a la Variable CORS

**Action** : Aller sur Render Dashboard → archify-backend → Environment

**Variable requise** :
```
CORS_ORIGINS = https://archify-project.vercel.app,http://localhost:4200
```

**Si manquante** : Voir [RENDER_ENV_VARS_UPDATE.md](RENDER_ENV_VARS_UPDATE.md)

---

### 2. Vérifier que Vercel a Déployé

**Action** : Aller sur Vercel Dashboard

**Vérifier** :
- ✅ Dernier commit déployé (avec `environment.prod.ts` mis à jour)
- ✅ Build successful
- ✅ Status : Production

**Si pas déployé** : Attendre 2-5 minutes ou déclencher manuellement

---

### 3. Vérifier que le Backend est Éveillé

**Action** : Ouvrir dans le navigateur ou terminal :

```bash
curl https://archify-backend.onrender.com/healthz
```

**Résultat attendu** :
```json
{"status":"ok"}
```

**Si timeout** : Attendre 30-60 secondes (cold start) et réessayer

---

## 🧪 Tests Fonctionnels

### Partie 1 : Page d'Accueil

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 1.1 | Chargement page | Ouvrir `https://archify-project.vercel.app` | Page s'affiche en < 3 secondes | ⬜ |
| 1.2 | Header visible | Vérifier le menu | Logo, Accueil, Cours, Tarifs, Connexion visibles | ⬜ |
| 1.3 | Hero section | Vérifier section principale | Titre "Bienvenue sur Archify" visible | ⬜ |
| 1.4 | Catalogue preview | Scroll vers le bas | Section "Cours Populaires" ou similaire visible | ⬜ |
| 1.5 | Footer visible | Scroll jusqu'en bas | Footer avec copyright visible | ⬜ |

---

### Partie 2 : Catalogue de Cours (Sans Authentification)

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 2.1 | Accéder au catalogue | Cliquer sur "Cours" dans le header | Page liste des cours s'affiche | ⬜ |
| 2.2 | Cours visibles | Vérifier la page | Au moins 1 cours affiché (carte avec image, titre, description) | ⬜ |
| 2.3 | Détails cours | Cliquer sur un cours | Page détails du cours s'affiche | ⬜ |
| 2.4 | Leçons visibles | Sur la page détails | Liste des leçons affichée | ⬜ |
| 2.5 | Badge premium | Vérifier si affiché | Badge "Premium" ou icône cadenas si cours payant | ⬜ |
| 2.6 | CTA abonnement | Scroll page détails | Bouton "S'abonner" ou "Voir les tarifs" visible | ⬜ |

---

### Partie 3 : Authentification

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 3.1 | Page d'inscription | Cliquer "Inscription" ou "S'inscrire" | Formulaire d'inscription affiché | ⬜ |
| 3.2 | Créer compte | Remplir : nom, email, mot de passe, confirmer | Compte créé, redirection vers home ou login | ⬜ |
| 3.3 | Page connexion | Cliquer "Connexion" | Formulaire de connexion affiché | ⬜ |
| 3.4 | Se connecter | Entrer email et mot de passe du compte créé | Connexion réussie, nom d'utilisateur visible dans header | ⬜ |
| 3.5 | Menu utilisateur | Cliquer sur nom utilisateur | Menu dropdown avec "Mon Profil", "Déconnexion" | ⬜ |

---

### Partie 4 : Navigation Utilisateur Connecté

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 4.1 | Accès cours gratuit | Aller sur cours gratuit, cliquer sur leçon | Vidéo se charge et joue | ⬜ |
| 4.2 | Lecture vidéo | Tester play/pause, volume, plein écran | Tous les contrôles fonctionnent | ⬜ |
| 4.3 | Commentaires | Poster un commentaire sur un cours | Commentaire apparaît dans la liste | ⬜ |
| 4.4 | Accès cours premium (sans abonnement) | Cliquer sur leçon d'un cours premium | Message "Abonnement requis" ou redirection | ⬜ |
| 4.5 | Navigation profil | Cliquer sur "Mon Profil" | Page profil utilisateur s'affiche | ⬜ |

---

### Partie 5 : Abonnement et Paiement

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 5.1 | Page tarifs | Cliquer sur "Tarifs" dans header | Page avec plan Premium affiché | ⬜ |
| 5.2 | Détails plan | Vérifier contenu | Prix (300 DH), durée (6 mois), avantages listés | ⬜ |
| 5.3 | Bouton souscription | Cliquer sur "S'abonner" ou "Souscrire" | Redirection vers formulaire de paiement | ⬜ |
| 5.4 | Formulaire paiement | Vérifier les champs | Nom, Email, Téléphone, Screenshot upload visible | ⬜ |
| 5.5 | Upload screenshot | Uploader une image de test | Image uploadée, nom de fichier affiché | ⬜ |
| 5.6 | Soumettre paiement | Cliquer "Soumettre" | Message "Paiement en attente de validation" | ⬜ |
| 5.7 | Statut paiement | Aller sur profil ou dashboard | Statut "En attente" visible | ⬜ |

---

### Partie 6 : Interface Admin

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 6.1 | Connexion admin | Se déconnecter, se connecter avec compte admin (*) | Connexion réussie | ⬜ |
| 6.2 | Accès admin | Cliquer sur menu utilisateur | Option "Admin" ou "Tableau de bord admin" visible | ⬜ |
| 6.3 | Dashboard admin | Cliquer sur "Admin" | Dashboard avec stats et sections | ⬜ |
| 6.4 | Gestion cours | Cliquer "Gérer les cours" ou similaire | Liste des cours avec boutons Modifier/Supprimer | ⬜ |
| 6.5 | Créer cours | Cliquer "Ajouter un cours" | Formulaire création cours affiché | ⬜ |
| 6.6 | Remplir formulaire | Titre, description, catégorie, type (FREE/PREMIUM) | Tous les champs éditables | ⬜ |
| 6.7 | Sauvegarder cours | Cliquer "Créer" | Cours créé, visible dans liste | ⬜ |
| 6.8 | Ajouter leçon | Ouvrir cours créé, "Ajouter leçon" | Formulaire ajout leçon affiché | ⬜ |
| 6.9 | Remplir leçon | Titre, description, ordre | Champs éditables | ⬜ |
| 6.10 | Upload vidéo | Sélectionner fichier vidéo MP4 | Upload progress bar, puis succès | ⬜ |
| 6.11 | Sauvegarder leçon | Cliquer "Créer leçon" | Leçon créée avec vidéo | ⬜ |
| 6.12 | Gestion paiements | Cliquer "Paiements" ou "Abonnements" | Liste des paiements en attente | ⬜ |
| 6.13 | Voir screenshot | Cliquer sur paiement créé en 5.6 | Screenshot de paiement s'affiche | ⬜ |
| 6.14 | Approuver paiement | Cliquer "Approuver" | Statut passe à "Approuvé" | ⬜ |
| 6.15 | Vérifier abonnement | Vérifier utilisateur | Utilisateur a maintenant accès Premium | ⬜ |

**(*) Note** : Vous devez créer un compte admin manuellement dans la base de données ou via un script de seed.

---

### Partie 7 : Accès Premium Après Abonnement

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 7.1 | Se connecter utilisateur | Se déconnecter admin, se connecter avec compte de 5.6 | Connexion réussie | ⬜ |
| 7.2 | Badge premium visible | Vérifier header ou profil | Badge "Premium" ou icône visible | ⬜ |
| 7.3 | Accès cours premium | Aller sur cours premium, cliquer leçon | Vidéo se charge et joue (pas de blocage) | ⬜ |
| 7.4 | Lecture vidéo premium | Tester play/pause, volume | Tous les contrôles fonctionnent | ⬜ |

---

## 🔍 Tests Techniques (DevTools)

### Partie 8 : Vérification Réseau (F12 → Network)

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 8.1 | Requêtes API | Recharger page catalogue | Requêtes vers `archify-backend.onrender.com/api/...` | ⬜ |
| 8.2 | Status codes | Vérifier status | 200 OK pour requêtes réussies | ⬜ |
| 8.3 | CORS headers | Cliquer sur requête → Headers | `Access-Control-Allow-Origin` présent | ⬜ |
| 8.4 | Pas d'erreurs CORS | Vérifier console | Aucune erreur "blocked by CORS policy" | ⬜ |
| 8.5 | Temps de réponse | Vérifier Time colonne | < 500ms pour API, < 2s si cold start | ⬜ |

---

### Partie 9 : Vérification Console (F12 → Console)

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 9.1 | Pas d'erreurs JS | Naviguer sur toutes les pages | Aucune erreur rouge (sauf warnings acceptables) | ⬜ |
| 9.2 | Pas d'erreurs 404 | Vérifier Network | Aucune ressource 404 (CSS, JS, images) | ⬜ |
| 9.3 | Logs développement | Vérifier console | Logs de debug désactivés en production | ⬜ |

---

## 📱 Tests Responsive (Optionnel)

| # | Test | Procédure | Résultat Attendu | Status |
|---|------|-----------|------------------|--------|
| 10.1 | Mobile portrait | F12 → Responsive → iPhone 12 | Interface s'adapte, menu burger visible | ⬜ |
| 10.2 | Tablet | iPad | Interface s'adapte, layout 2 colonnes ou similaire | ⬜ |
| 10.3 | Navigation mobile | Cliquer burger menu | Menu s'ouvre en sidebar ou dropdown | ⬜ |

---

## 🎯 Résumé Final

### Nombre de Tests

- **Tests fonctionnels** : 53
- **Tests techniques** : 8
- **Tests responsive** : 3
- **Total** : 64 tests

---

### Critères de Succès

**Application prête pour production si** :

- ✅ **Tous les tests Parties 1-5** réussis (Utilisateur standard)
- ✅ **Partie 8** réussie (Pas d'erreurs CORS)
- ✅ **Au moins 80% des tests Partie 6** réussis (Admin)

**Optionnel mais recommandé** :
- ✅ Parties 7, 9, 10

---

## 🚨 Actions en Cas d'Échec

### Erreur CORS

**Symptôme** : Tests 8.3, 8.4 échouent
**Solution** : Vérifier [RENDER_ENV_VARS_UPDATE.md](RENDER_ENV_VARS_UPDATE.md)

### API Timeout

**Symptôme** : Test 8.5 > 2 secondes systématiquement
**Solution** : Backend Render endormi - attendre 1 minute et réessayer

### Vidéos ne jouent pas

**Symptôme** : Tests 4.1, 7.3 échouent
**Solution** : Vérifier uploads directory et CORS vidéo dans backend

### 404 sur requêtes API

**Symptôme** : Tests 2.2, 4.1 échouent
**Solution** : Vérifier `environment.prod.ts` pointe vers bonne URL

---

## 📊 Suivi des Tests

**Testeur** : _____________________
**Date** : _____________________
**Environnement** : Production (Vercel + Render)
**Navigateur** : _____________________

**Résultats** :
- Tests réussis : _____ / 64
- Tests échoués : _____
- Tests non applicables : _____

**Notes** :
```
[Espace pour notes et observations]
```

---

**Version** : 1.0
**Dernière mise à jour** : 16 octobre 2025
**Statut** : Prêt pour tests
