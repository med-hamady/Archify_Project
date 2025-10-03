# Archify — Guide de progression (Plan de tâches + Workflow)

Objectif: Travailler par incréments clairs. Pour chaque tâche: implémenter → tester → valider → pousser → passer à la suivante.

## Règles de travail
- Unité de travail = une tâche/feature atomique.
- Dès qu’une tâche est finie: tests locaux → validation → commit & push → ouvrir PR (si besoin) → passer à la suivante.
- Pas de fichiers internes sensibles dans le repo (specs/PRD/plans). `.gitignore` à jour.

## Workflow standard
1) Créer la branche: `feat/<domaine>-<courte-description>`
2) Implémenter la tâche (code clair, modularisé)
3) Test local (chemin critique + perf + accessibilité si FE)
4) Commit(s) propres: `type: description` (ex: `feat: scaffold angular app`)
5) Push + PR (si revue) → Merge après validation

## Backlog de tâches (ordre conseillé)

### Phase 0 — Setup (repo propre)
- [ ] Nettoyage repo (ok) — pas de docs internes ni secrets
- [ ] Guide de progression (ce fichier)

### Phase 1 — Design → Structure
- [ ] Frontend: Scaffold Angular 17+ standalone + Tailwind + Material
- [ ] Frontend: Routing de base + pages placeholders (Home, Catalog, Course, Lesson, Auth, Dashboard, Subscription, Admin)
- [ ] Frontend: Thème (palette, typos), layout responsive et accessibilité AA
- [ ] Backend: Scaffold Express TS + `/healthz` + middlewares (Helmet, CORS, rate-limit, Pino)

### Phase 2 — Contenu IG (placeholders)
- [ ] FE: Catalog avec filtres IG (semestre, département IG, matière, tri) — données mock
- [ ] FE: Carte cours (miniature 16:9, titre, prof, badges)
- [ ] FE: Page cours (liste leçons mock)
- [ ] FE: Page leçon — Vimeo/PDF viewers avec overlay filigrane + désactivation PiP/AirPlay/clic droit/téléchargement
- [ ] BE: Endpoints mock — `/api/catalog`, `/api/courses/:id`, `/api/courses/:id/lessons`

### Phase 3 — Auth & Gating (placeholders)
- [ ] BE: auth stubs — `register/login/refresh`, `me` mock
- [ ] FE: formulaires auth (UI), guards `AuthGuard`/`SubscriptionGuard` (stubs)
- [ ] BE: abonnement mock + gating premium côté serveur
- [ ] FE: pages d’accès premium requis + état abonnement mock

### Phase 4 — Paiements (cadrage mock)
- [ ] BE: `POST /checkout`, `POST /payments/webhook` (mock Bankily/Masrivi/Sedad)
- [ ] FE: UI checkout (placeholders), gestion redirections succès/échec

### Phase 5 — Admin (squelette)
- [ ] FE: Admin shell (navigation, CRUD placeholders)
- [ ] BE: endpoints admin (mock): presign uploads, CRUD basiques

### Phase 6 — Qualité & Livraison
- [ ] FE: Accessibilité (revue AA), perf (Lighthouse > 80 mobile sur pages clés)
- [ ] BE: logs/erreurs cohérents, tests basiques Postman, temps de réponse mock < 300ms
- [ ] README Front/Back: instructions RUN local
- [ ] Déploiement initial (dev/staging) et vérification santé

## Tests par tâche — Checklists
- Frontend (par page/feature):
  - [ ] UI conforme au design (mobile-first + desktop)
  - [ ] Aucun warning/erreur console
  - [ ] Navigation et interactions ok
  - [ ] Accessibilité: focus visibles, labels, contrastes AA
  - [ ] Performance acceptable (Lighthouse)
- Backend (par endpoint/feature):
  - [ ] `/healthz` OK
  - [ ] Contrats JSON conformes
  - [ ] Logs Pino présents
  - [ ] Temps de réponse < 300ms (mock)

## Convention de branches & commits
- Branches: `feat/*`, `fix/*`, `chore/*`, `docs/*`
- Commits: `type: description`

## Définitions de Terminé (DoD)
- Lint OK, build OK (si applicable)
- Tests manuels passés
- Code revu (si PR) et fusionné
- Documentation d’usage mise à jour (si besoin)
