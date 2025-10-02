# PRD — Archify (أرشيفي)
Version 1.0 — 30/09/2025

Auteur: Proger Tech — Produit

## 1. Contexte & Vision
Archify est une plateforme d’apprentissage universitaire centralisée pour les étudiants francophones, avec un focus initial sur ISCAE — filière IG (Informatique de Gestion). Offre: cours, vidéos explicatives, notes PDF et archives d’examens, avec un accès premium via abonnement. UX mobile-first, simple et élégante.

## 2. Objectifs métier (KPIs)
- Acquisition: +500 comptes étudiants IG sur 2–3 mois (MVP) ; Taux d’activation > 50%.
- Monétisation: 15–25% des actifs IG en abonnements payants (mois 3–6).
- Engagement: Durée moyenne de session > 6 min ; 3+ leçons vues/session.
- Qualité: Taux d’erreur < 0,5% (4xx/5xx), NPS > 45.

## 3. Portée du produit
### 3.1 Inclus (MVP)
- Cible initiale: ISCAE/IG uniquement.
- Matières prioritaires: Algorithme, Analyse, Logique mathématiques, + 2 matières à préciser.
- Auth (inscription/connexion, mot de passe oublié), profils.
- Catalogue cours/leçons (vidéos, PDF, archives), recherche + filtres (pré-sélection IG/matières prioritaires).
- Abonnement payant (Bankily/Masrivi/Sedad) et gating premium.
- Commentaires (modération basique), progression « vu ».
- Dashboard étudiant (contenus suivis, recommandations basiques).
- Admin: CRUD contenus, uploads via URL présignée (S3/Cloudinary), gestion abonnements, analytics basiques.
- Protection: anti-capture/enregistrement, filigrane dynamique, URLs signées, PiP/AirPlay désactivés.

### 3.2 Exclusions (MVP)
- Recommandations IA (V2.0).
- Coupons/essais étendus (V1.0).
- App mobile native.

## 4. Personas & Utilisateurs cibles
- Étudiante « Ahmed » (IG L2): recherche de vidéos, télécharge PDF, révise examens.
- Étudiant « Minetou » (IG L3): se prépare via archives, filtre par professeur/semestre.
- Admin (Prof/Chargé de TD): met en ligne contenus, modère commentaires, suit analytics.

## 5. Parcours clés (User Flows)
- Découverte → Recherche/Filtre → Détail Cours → Leçon (Vidéo/PDF) → Marquer « vu » → Recommandations.
- Abonnement → Choix plan → Paiement Bankily/Masrivi/Sedad → Validation webhook → Accès premium.
- Admin → Login → Upload (URL présignée) → Publier leçon → Mesurer vues/engagement.

## 6. Épics & User Stories (AC)
### 6.1 Authentification
- Création de compte email/mot de passe.
  - AC: Erreurs claires, cookies HttpOnly, reset password OK.
- Profil éditable (nom, département, semestre).
  - AC: Validation serveur, messages FR.

### 6.2 Catalogue & Leçons
- Recherche/filtre par semestre, département, matière, professeur; tri.
  - AC: Résultats pertinents < 500 ms (moyenne), filtres combinables.
- Lecture vidéo/PDF fluide; progression.
  - AC: Player moderne (vitesse, qualité), PDF viewer intégré; marquer « vu ».

### 6.3 Abonnements & Paiements
- Souscription Mensuel/Annuel, accès premium après paiement.
  - AC: Paiement Bankily/Masrivi/Sedad, webhook validé, abonnement actif; expiration gérée.

### 6.4 Protection du contenu
- Réduction des fuites: anti-capture/enregistrement, filigrane, sources protégées.
  - AC: Filigrane dynamique visible; PiP/AirPlay off; URLs signées courte durée; jeton requis; CGU interdisant capture.

### 6.5 Commentaires & Modération
- Création/suppression par auteur; modération admin.
  - AC: Anti-spam simple, signalement, suppression.

### 6.6 Admin & Analytics
- CRUD départements, cours, leçons, assets; upload présigné.
  - AC: État de publication; validations.
- Analytics basiques IG: vues, top cours, watch time agrégé.
  - AC: Tableaux triables; export CSV minimal.

## 7. Exigences fonctionnelles (synthèse)
- Voir « Cahier_de_Charges_Archify.txt » pour API, DB, technique.
- Gating premium serveur; recherche + filtres multi-critères avec pré-sélection IG.
- I18n: FR par défaut; AR statique ultérieure.

## 8. Exigences non-fonctionnelles
- Sécurité: JWT HttpOnly, bcrypt, Helmet, CORS restreint, rate limiting, logs d’audit.
- Protection contenu: filigrane, URLs signées, HLS AES-128 si dispo, PiP/AirPlay off, no-download, CSP.
- Performance: TTFB < 300 ms (API), lazy-loading Angular, bundles optimisés.
- Disponibilité: 99.5% (MVP), /healthz.
- Accessibilité: AA, clavier, focus visibles.
- Confidentialité: RGPD, minimisation.

## 9. Dépendances & Intégrations
- Paiements: Bankily/Masrivi/Sedad.
- Vidéo: Vimeo (privacy domaine) / YouTube (fallback).
- Stockage: S3/Cloudinary.
- DB: PostgreSQL.

## 10. Contraintes & Hypothèses
- Cible initiale IG; extension ultérieure.
- Réseaux lents: adaptatif, poids contrôlés.
- Abonnement actif obligatoire pour premium.

## 11. Mesure du succès
- Conversion, rétention, engagement, qualité, sécurité.

## 12. Livrables PRD
- Ce PRD.
- Cahier des charges: `Cahier_de_Charges_Archify.txt` / `.docx`.
- Backlog GitHub à créer.
