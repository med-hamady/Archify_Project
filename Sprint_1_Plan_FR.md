# Sprint 1 — Plan & Assignations
Durée: 2 semaines
Cible: ISCAE — IG (Informatique de Gestion)
Matières initiales: Algorithme, Analyse, Logique mathématiques (+2 à préciser)

## Objectifs Sprint
- Base projet (repo, CI, docs) prête (fait)
- Structure initiale frontend/backend + routing + auth squelette
- Catalogue minimal (liste cours/leçons mock), player/PDF viewer intégrés
- Paiements: cadrage intégration Bankily/Masrivi/Sedad (mock endpoints)
- Protection contenu: filigrane overlay UI + désactivation PiP/AirPlay/clic droit (UI)

## Assignations
### Frontend (Angular + Tailwind)
1) Bootstrapping projet Angular
   - Tâches:
     - Créer workspace Angular 17, Tailwind, Angular Material
     - Modules/features: core, shared, auth, catalog, lesson, dashboard, subscription, admin (squelettes)
     - Routing de base + guards stubs (AuthGuard/SubscriptionGuard)
   - AC:
     - `ng serve` OK; routes accessibles; styles Tailwind OK
   - Tests:
     - Démarrage local, navigation entre routes, no console errors

2) UI Catalogue & Cartes Cours (mock)
   - Tâches:
     - Pages: Accueil, Catalogue (liste), Détail Cours (mock data)
     - Composants: Carte cours, filtres (semestre, département IG, matière)
   - AC:
     - Filtres fonctionnels côté client (mock), design conforme charte
   - Tests:
     - Interactions filtres, responsive 360–1440px

3) Page Leçon: Player vidéo + PDF viewer
   - Tâches:
     - Intégrer Vimeo Player SDK (mock id), ngx-extended-pdf-viewer
     - Overlay filigrane dynamique (ID démo/email hashé/horodatage)
     - Désactiver PiP/AirPlay, clic droit, download UI
   - AC:
     - Lecture vidéo et rendu PDF OK; filigrane visible; PiP off
   - Tests:
     - Lecture sur desktop/mobile; vérif overlay et désactivations

### Backend (Node.js + Express)
1) Bootstrapping API
   - Tâches:
     - Créer projet Express TS, structure modules: auth, users, courses, lessons, subscriptions, payments, comments, admin
     - Middlewares: Helmet, CORS restreint, rate limiting, logger (Pino)
   - AC:
     - `/healthz` OK; linter OK
   - Tests:
     - Démarrage local, requête healthz 200

2) Auth & Users (squelette)
   - Tâches:
     - Endpoints: register/login/refresh (stubs), me (mock)
     - JWT cookies HttpOnly (stubs), bcrypt
   - AC:
     - Flux login/register stubs fonctionnels avec validations
   - Tests:
     - Inscription + connexion simulées via Postman

3) Catalogue (mock) & Lessons (mock)
   - Tâches:
     - Endpoints GET /catalog, /courses/:id, /courses/:id/lessons (retour mock IG)
   - AC:
     - Filtres/tri basiques côté serveur (mock dataset)
   - Tests:
     - Réponses JSON filtrées/triées attendues

4) Paiements — cadrage (mock)
   - Tâches:
     - Spécifier endpoints /checkout, /payments/webhook (mock providers)
     - Définir contrat minimal (request/response), logs
   - AC:
     - Webhook simulé active un abonnement mock
   - Tests:
     - Appels Postman; statut abonnement mis à jour (mock)

## Définitions de Terminé (DoD)
- Code linté, build passe en CI
- Tests manuels validés (checklist ci-dessus)
- PR approuvée (pair FE/BE) et merge

## Risques Sprint
- Délais intégration design → composant; mitigation: composants placeholder
- Variations provider paiements: mock robuste et logs

## Livrables Sprint 1
- Frontend: routes + pages clés mock, player/PDF + overlay
- Backend: endpoints mock auth/catalog/payments, healthz
- Documentation: README mis à jour, instructions run local
