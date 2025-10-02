# Brief Développeur Frontend — Archify (Angular + Tailwind)

Rôles autour de toi:
- Chef de projet/PM (moi): pilotage, priorisation, QA finale, merges.
- Développeur Backend expert: API Express, endpoints, sécurité, paiements.
- Toi: Frontend expert Angular + Tailwind CSS, intégration UI/UX, performance, accessibilité.

Contexte produit:
- Cible initiale: Étudiants ISCAE — filière IG (Informatique de Gestion).
- Matières prioritaires (MVP): Algorithme, Analyse, Logique mathématiques (+2 à préciser).
- Valeur clé: simplicité mobile-first, protection de contenu (anti-capture/enregistrement, filigrane dynamique).

Références:
- Spécification: `Cahier_de_Charges_Archify.txt`
- PRD: `PRD_Archify_FR.md`
- Sprint 1: `Sprint_1_Plan_FR.md`
- Dépôt: https://github.com/AbdellahiAhmed/Archify_Project.git

Objectifs techniques (MVP):
- Angular 17+ standalone, TypeScript strict, Tailwind + Angular Material.
- Features: `core`, `shared`, `auth`, `catalog`, `lesson`, `dashboard`, `subscription`, `admin`.
- Intégrations: Vimeo Player SDK, ngx-extended-pdf-viewer, ngx-translate (FR par défaut), GA4 (optionnel), NgRx (si utile).
- Sécurité UI: overlay filigrane dynamique, désactivation PiP/AirPlay, clic droit, bouton download.

Tâches Sprint 1 (FE):
1) Bootstrapping Angular
   - Créer le workspace Angular 17, ajouter Tailwind, Angular Material.
   - Définir le routing et les guards stubs (`AuthGuard`, `SubscriptionGuard`).
   - Livrable: `ng serve` opérationnel, pages skeleton accessibles.
2) Catalogue mock IG
   - Pages: Accueil, Catalogue (filtres: semestre, département IG, matière, tri), Détail Cours.
   - Composants: Carte Cours (miniature, titre, prof, badges premium/nouveau, vues).
   - Livrable: filtres fonctionnels côté client (mock), responsive 360–1440px.
3) Page Leçon (vidéo/PDF)
   - Intégrer Vimeo Player SDK (id mock), PDF viewer.
   - Overlay filigrane dynamique (ID démo/email hashé/horodatage), désactiver PiP/AirPlay/clic droit.
   - Livrable: lecture fluide desktop/mobile, overlay visible, sources non exposées.

AC généraux (Sprint 1):
- Zéro erreur console, Lighthouse perf > 80 mobile pour pages clés, accessibilité AA.
- Filtres client fonctionnent; filigrane visible; désactivations actives.

Bonnes pratiques:
- Composants standalone, lazy routes, change detection OnPush où pertinent.
- Tailwind + Material: conserver cohérence visuelle et tokens (espacements 8px, rayons 8–12px).
- State: éviter complexité prématurée; NgRx si bénéfice clair (recherche, abonnement).
- I18n: texte FR par défaut, structure prête pour AR statique.

Collaboration:
- Branches `feat/*`, PR avec description, captures et checklist AC/cocher.
- Tests manuels: desktop + mobile, scénarios clés (recherche, leçon, abonnement UI).
- Ping PM pour validation avant merge; revue croisée avec BE si API touchée.

Commandes (à exécuter sur demande):
- Installer Node LTS et Angular CLI:
  - brew install node
  - npm i -g @angular/cli
- Initialiser frontend Angular:
  - ng new frontend --routing --style=css --standalone
  - cd frontend && npm i -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
  - npm i @angular/material ngx-extended-pdf-viewer
  - npm i @ngx-translate/core @ngx-translate/http-loader

Livrables fin Sprint 1 (FE):
- App Angular bootstrappée + pages mock (Accueil, Catalogue, Cours, Leçon).
- Player vidéo + PDF viewer + overlay filigrane + désactivations.
- README frontend (run local) mis à jour si nécessaire.
