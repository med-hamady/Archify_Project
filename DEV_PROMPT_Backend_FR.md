# Brief Développeur Backend — Archify (Node.js + Express)

Rôles autour de toi:
- Chef de projet/PM (moi): pilotage, priorisation, QA finale, merges.
- Développeur Frontend expert: Angular + Tailwind, intégration UI/UX.
- Toi: Backend expert Node.js + Express, sécurité, paiements, intégrations.

Contexte produit:
- Cible initiale: Étudiants ISCAE — filière IG (Informatique de Gestion).
- Matières MVP: Algorithme, Analyse, Logique mathématiques (+2 à préciser).
- Valeur clé: protection stricte du contenu (anti-capture/enregistrement, filigrane — côté UI) et gating premium côté serveur.

Références:
- Spécification: `Cahier_de_Charges_Archify.txt`
- PRD: `PRD_Archify_FR.md`
- Sprint 1: `Sprint_1_Plan_FR.md`
- Dépôt: https://github.com/AbdellahiAhmed/Archify_Project.git

Architecture & Stack:
- Node.js + Express (TypeScript), structure modulaire `src/modules`:
  - `auth`, `users`, `courses`, `lessons`, `assets`, `comments`, `subscriptions`, `payments`, `admin`, `search`
- Middlewares: Helmet, CORS restreint, rate limiting, Pino logs, validation (Zod/Joi).
- DB: PostgreSQL (MVP mock data en Sprint 1), migrations ultérieures.
- Stockage: S3/Cloudinary (URLs présignées) — cadrage puis implémentation.
- Vidéo: Vimeo (privacy domaine) / YouTube (fallback), contrôle d’accès serveur.
- Paiements: Bankily/Masrivi/Sedad (REST + webhooks), états robustes.

Tâches Sprint 1 (BE):
1) Bootstrapping API
   - Express TS + structure modules, `/healthz`, Helmet/CORS/ratelimiting/Pino.
   - Livrable: serveur démarre, healthz 200, linter OK.
2) Auth & Users (stubs)
   - Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` (stubs), `GET /api/me` (mock user/role/subscription).
   - JWT cookies HttpOnly (stubs), bcrypt pour hash.
   - Livrable: flux login/register simulables (Postman), validations.
3) Catalogue IG (mock) & Lessons (mock)
   - Endpoints: `GET /api/catalog`, `GET /api/courses/:id`, `GET /api/courses/:id/lessons` avec filtres/tri basiques.
   - Livrable: dataset mock IG (Algorithme, Analyse, Logique), réponses rapides (<300 ms).
4) Paiements — cadrage (mock)
   - `POST /api/checkout` (renvoyer intent/approval mock), `POST /api/payments/webhook` (activer abonnement mock).
   - Logs, signature webhook simulée, transitions d’états d’abonnement.

AC généraux (Sprint 1):
- Lint OK, `/healthz` 200, endpoints stubs répondent selon spécs, logs structurés (Pino JSON).
- Filtres/tri côté serveur sur dataset mock, réponse cohérente avec FE.

Sécurité & Protection de contenu (direction technique):
- Accès premium: vérification abonnement côté serveur avant livraison de sources.
- URLs signées courte durée (S3/Cloudinary) pour PDF/assets; pour vidéo, HLS AES-128 si applicable.
- Token de lecture par utilisateur/ressource; invalidation en cas de partage.
- Journaux d’accès (userId, IP, UA), corrélations.

Collaboration:
- Branches `feat/*`, PR avec description, captures Postman si pertinent.
- Tests Postman: inclure collection simple; ping PM/FE si contrat évolue.
- CI: jobs Node 20, lint/build passent.

Commandes (à exécuter sur demande):
- Installer Node LTS:
  - brew install node
- Initialiser backend:
  - mkdir backend && cd backend && npm init -y && npm i express zod helmet cors pino pino-http && npm i -D typescript ts-node-dev @types/express @types/node
  - npx tsc --init --rootDir src --outDir dist --esModuleInterop --resolveJsonModule --module commonjs --target ES2020
  - mkdir -p src/modules && echo "// TODO: bootstrap server" > src/index.ts

Livrables fin Sprint 1 (BE):
- API Express opérationnelle, endpoints mock auth/catalog/lessons/payments, `/healthz`.
- README backend (run local) si nécessaire.
