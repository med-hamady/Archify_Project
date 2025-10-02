# PRD — Archify (أرشيفي)
Version 1.0 — 30/09/2025

Auteur: Proger Tech — Produit

## 1. Contexte & Vision
Archify est une plateforme d’apprentissage universitaire centralisée pour les étudiants francophones, offrant cours, vidéos explicatives, notes PDF et archives d’examens, avec un accès premium via abonnement. L’objectif est d’améliorer l’accès aux ressources, l’engagement et la réussite, avec une UX mobile-first, simple et élégante.

## 2. Objectifs métier (KPIs)
- Acquisition: +1 000 comptes étudiants sur 3 mois (MVP) ; Taux d’activation > 50%.
- Monétisation: 15–25% des actifs en abonnements payants (mois 3–6).
- Engagement: Durée moyenne de session > 6 min ; 3+ leçons vues/session.
- Qualité: Taux d’erreur < 0,5% (4xx/5xx), NPS > 45.

## 3. Portée du produit
### 3.1 Inclus (MVP)
- Auth (inscription/connexion, mot de passe oublié), profils.
- Catalogue cours/leçons (vidéos, PDF, archives), recherche + filtres.
- Abonnement payant (Bankily/Masrivi/Sedad) et gating premium.
- Commentaires (modération basique), progression « vu ».
- Tableau de bord étudiant (contenus suivis, recommandations basiques).
- Admin: CRUD contenus, uploads via URL présignée (S3/Cloudinary), gestion abonnements, analytics basiques.
- Protection du contenu: interdiction capture d’écran/enregistrement, filigrane dynamique, URLs signées, PiP/AirPlay désactivés (cf. spécifications).

### 3.2 Exclusions (MVP)
- IA de recommandations personnalisées (V2.0).
- Coupons/essais étendus (V1.0).
- App mobile native.

## 4. Personas & Utilisateurs cibles
- Étudiante « Ahmed » (L2 Informatique de Gestion): recherche de vidéos, télécharge PDF, révise examens.
- Étudiant « Minetou » (L3 Informatique de Gestion): se prépare via archives, filtre par professeur/semestre.
- Admin (Prof/Chargé de TD): met en ligne contenus, modère commentaires, suit analytics.

## 5. Parcours clés (User Flows)
- Découverte → Recherche/Filtre → Détail Cours → Leçon (Vidéo/PDF) → Marquer « vu » → Recommandations.
- Abonnement → Choix plan → Paiement Bankily/Masrivi/Sedad → Validation webhook → Accès premium.
- Admin → Login → Upload (URL présignée) → Publier leçon → Mesurer vues/engagement.

## 6. Épics & User Stories (avec critères d’acceptation)
### 6.1 Authentification
- En tant qu’étudiant, je peux créer un compte avec email/mot de passe pour accéder aux contenus.
  - AC: Erreurs claires, cookies HttpOnly, réinitialisation mot de passe opérationnelle.
- En tant qu’étudiant, je peux voir mon profil et le mettre à jour (nom, département, semestre).
  - AC: Validation serveur, messages d’erreur localisés (FR).

### 6.2 Catalogue & Leçons
- En tant qu’étudiant, je peux rechercher et filtrer les cours par semestre, département, matière, professeur, et trier.
  - AC: Résultats pertinents < 500 ms (moyenne), filtres combinables.
- En tant qu’étudiant, je peux visionner des vidéos et consulter des PDF avec une expérience fluide.
  - AC: Player moderne (vitesse, qualité), PDF viewer intégré ; suivi « vu ».

### 6.3 Abonnements & Paiements
- En tant qu’étudiant, je peux souscrire un plan mensuel/annuel et obtenir l’accès aux contenus premium.
  - AC: Paiement Bankily/Masrivi/Sedad → webhook validé → abonnement actif ; fin d’accès à expiration.

### 6.4 Protection du contenu
- En tant qu’éditeur, je veux réduire le risque de fuite: interdiction captures/enregistrements, filigrane, sources protégées.
  - AC: Filigrane dynamique (ID/email haché/horodatage) visible sur vidéo/PDF ; PiP/AirPlay désactivés ; URLs signées courte durée ; lecture impossible sans jeton valide ; CGU interdisant explicitement la capture.

### 6.5 Commentaires & Modération
- En tant qu’étudiant, je peux laisser un commentaire ; je peux supprimer mes commentaires.
  - AC: Anti-spam simple, signalement, suppression par auteur/admin.

### 6.6 Admin & Analytics
- En tant qu’admin, je peux créer/éditer/supprimer départements, cours, leçons et assets.
  - AC: Upload via URL présignée ; état de publication ; validation des champs.
- En tant qu’admin, je peux consulter des métriques basiques (vues, top cours, watch time agrégé).
  - AC: Tableaux triables, export CSV minimal.

## 7. Exigences fonctionnelles (synthèse)
- Voir « Cahier_de_Charges_Archify.txt » pour les contrats API, schéma DB, et détails techniques.
- Gating premium par statut d’abonnement côté serveur.
- Recherche texte + filtres multi-critères.
- Internationalisation: FR par défaut; AR statique ultérieure (JSON).

## 8. Exigences non-fonctionnelles
- Sécurité: JWT HttpOnly, bcrypt, Helmet, CORS restreint, rate limiting, logs d’audit admin.
- Protection contenu: filigrane dynamique, URLs signées (HLS AES-128 si applicable), PiP/AirPlay désactivés, no-download, CSP stricte.
- Performance: TTFB < 300 ms (API), build optimisé, lazy-loading Angular.
- Disponibilité: 99.5% (MVP), healthcheck /healthz.
- Accessibilité: contrastes AA, navigation clavier, focus visibles.
- Confidentialité: minimisation des données, RGPD (politique et consentement analytics si activés).

## 9. Dépendances & Intégrations
- Paiements: Bankily/Masrivi/Sedad (REST + webhooks).
- Vidéo: Vimeo (privacy domaine) ou YouTube non répertorié (fallback).
- Stockage: AWS S3/Cloudinary (URLs présignées).
- Base de données: PostgreSQL managé.

## 10. Contraintes & Hypothèses
- Mobile-first (≥ 360px) ; desktop ≥ 1280px.
- Réseaux lents: chargement adaptatif, posters vidéo, tailles PDF raisonnables.
- Contenu premium derrière abonnement actif vérifié côté serveur.

## 11. Mesure du succès
- Taux de conversion abonnement, rétention M1/M3, réachat annuel.
- Engagement: vues/étudiant, temps de visionnage, complétion leçons.
- Qualité: latence API, taux d’erreur, incidents sécurité (0 fuite connue).

## 12. Livrables PRD
- Ce PRD (fonctionnel).
- Cahier des charges technique: `Cahier_de_Charges_Archify.txt` / `.docx`.
- Backlog épics/user stories (à créer en issues GitHub).
