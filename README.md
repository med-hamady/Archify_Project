# Archify — أرشيفي

Plateforme universitaire moderne (cours, vidéos, PDF, archives d'examens) — orientée étudiants francophones.

## 🚀 Quick Start

### Prérequis
- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**
- **PostgreSQL** (base de données)
- **Git**

### Installation et Démarrage

#### 1. Cloner le projet
```bash
git clone <repository-url>
cd Archify_Project
```

#### 2. Configuration de la base de données
```bash
# Créer une base de données PostgreSQL
createdb archify_db

# Ou utiliser un service cloud (Supabase, Railway, etc.)
```

#### 3. Configuration Backend
```bash
cd backend
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres de base de données

# Exécuter les migrations
npx prisma migrate dev

# Démarrer le serveur backend
npm run dev
```

#### 4. Configuration Frontend
```bash
# Dans un nouveau terminal
cd frontend
npm install

# Démarrer le serveur de développement
ng serve
```

### 🌐 Accès à l'application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Base de données**: PostgreSQL (port 5432 par défaut)

### 📁 Structure du projet
```
Archify_Project/
├── backend/           # API Node.js + Express
│   ├── src/
│   ├── prisma/       # Schéma de base de données
│   └── uploads/      # Fichiers uploadés (vidéos, PDF)
├── frontend/         # Application Angular
│   ├── src/
│   └── dist/        # Build de production
└── README.md
```

### 🔧 Scripts disponibles

#### Backend
```bash
cd backend
npm run dev          # Démarrage en mode développement
npm run build        # Build de production
npm run start        # Démarrage en production
npm run db:migrate   # Exécuter les migrations
npm run db:seed      # Peupler la base de données
```

#### Frontend
```bash
cd frontend
ng serve             # Démarrage en mode développement
ng build             # Build de production
ng test              # Tests unitaires
ng lint              # Vérification du code
```

### 🎬 Fonctionnalités Vidéo
- **Upload de vidéos** par les administrateurs
- **Lecture intégrée** avec player personnalisé
- **Support CORS** pour le streaming
- **Gestion des métadonnées** (durée, taille, type)

### 👥 Rôles utilisateurs
- **STUDENT**: Accès aux cours et leçons
- **ADMIN**: Gestion des cours, leçons et vidéos
- **SUPERADMIN**: Accès complet à la plateforme

### 🛠️ Technologies utilisées
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Frontend**: Angular 17, Tailwind CSS, TypeScript
- **Upload**: Multer pour les fichiers
- **Authentification**: JWT avec cookies sécurisés

### 📝 Documentation
- **Cahier des charges**: `Cahier_de_Charges_Archify.docx`
- **API Documentation**: Disponible sur `/api/docs` (en développement)
- **Schéma de base**: `backend/prisma/schema.prisma`

### 🚀 Déploiement
- **Frontend**: Vercel, Netlify, ou Angular hosting
- **Backend**: Render, Railway, ou AWS
- **Base de données**: PostgreSQL cloud (Supabase, Railway, etc.)

### 🐛 Dépannage
- **Port déjà utilisé**: Changer les ports dans les fichiers de configuration
- **Erreurs CORS**: Vérifier les variables d'environnement
- **Base de données**: S'assurer que PostgreSQL est démarré
- **Uploads**: Vérifier les permissions du dossier `uploads/`
