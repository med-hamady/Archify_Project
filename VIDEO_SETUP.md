# 🎥 Configuration du Support Vidéo - Archify

## 📋 Vue d'ensemble

Le projet Archify supporte maintenant l'upload et la lecture de vidéos locales (fichiers MP4) uploadés par les administrateurs. Les vidéos sont stockées sur le serveur backend et streamées vers le frontend Angular.

---

## ✅ Fonctionnalités

- ✅ **Upload de vidéos** par les administrateurs (via interface admin)
- ✅ **Streaming vidéo** avec lecteur HTML5
- ✅ **Support CORS** complet entre frontend et backend
- ✅ **Métadonnées vidéo** (durée, taille, type MIME)
- ✅ **Lecture sécurisée** avec contrôles (pas de téléchargement)
- ✅ **Tracking des vues** pour les statistiques

---

## 🏗️ Architecture

### **Backend (Node.js + Express)**

**Stockage** : `backend/uploads/videos/`

**Route de streaming** : `/uploads/videos/:filename`

**Fichiers modifiés** :
- `backend/src/index.ts` : Route de streaming avec headers CORS
- `backend/src/modules/courses.ts` : API inclut `videoUrl` dans les réponses
- `backend/src/modules/video-upload.ts` : Gestion des uploads
- `backend/prisma/schema.prisma` : Champs `videoUrl`, `videoSize`, `videoType`

### **Frontend (Angular 20)**

**Proxy de développement** : `frontend/proxy.conf.json`

**Composants vidéo** :
- `frontend/src/app/components/video-player/` : Lecteur vidéo réutilisable
- `frontend/src/app/pages/course/` : Affichage vidéo dans les cours
- `frontend/src/app/pages/lesson/` : Affichage vidéo dans les leçons

---

## 🔧 Configuration requise

### **1. Backend**

#### Variables d'environnement (`.env`)
```env
CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
PORT=3000
```

#### Headers CORS configurés
```javascript
// backend/src/index.ts lignes 107-135
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, HEAD, OPTIONS
- Accept-Ranges: bytes
- Content-Type: video/mp4
```

#### CSP (Content Security Policy)
Les headers CSP sont **désactivés** pour les routes `/uploads/videos/*` pour permettre le streaming.

### **2. Frontend**

#### Proxy Angular (`proxy.conf.json`)
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  },
  "/uploads": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

#### Configuration Angular (`angular.json`)
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

---

## 🚀 Comment utiliser

### **1. Upload d'une vidéo (Admin)**

1. Se connecter en tant qu'admin
2. Aller dans l'interface d'administration
3. Créer ou éditer une leçon
4. Uploader un fichier vidéo (MP4 recommandé)
5. La vidéo est automatiquement stockée dans `backend/uploads/videos/`

### **2. Lecture de vidéo (Étudiant)**

1. Naviguer vers un cours
2. Cliquer sur une leçon avec vidéo
3. La vidéo se charge automatiquement via le proxy Angular
4. Utiliser les contrôles HTML5 standard

---

## 📊 Format des URLs

### **Backend (API Response)**
```json
{
  "id": "lesson-id",
  "title": "Introduction aux algorithmes",
  "type": "VIDEO",
  "videoUrl": "/uploads/videos/lesson-1-1_1760130703368.mp4",
  "videoSize": 7300602,
  "videoType": "video/mp4",
  "uploadedAt": "2024-10-10T20:39:00.000Z"
}
```

### **Frontend (URLs relatives)**
```typescript
// ❌ Avant (ne fonctionne pas - CORS)
videoUrl = "http://localhost:3000/uploads/videos/lesson-1-1.mp4"

// ✅ Après (fonctionne avec proxy)
videoUrl = "/uploads/videos/lesson-1-1.mp4"
```

Le proxy Angular redirige automatiquement `/uploads/*` vers `http://localhost:3000/uploads/*`

---

## 🛠️ Dépannage

### **Problème : "Video source is not supported"**

**Cause** : CORS bloqué ou proxy non activé

**Solution** :
1. Vérifier que le proxy est configuré dans `angular.json`
2. Redémarrer le frontend : `npm start`
3. Vérifier les logs du terminal pour voir si le proxy est actif :
   ```
   [HPM] Proxy created: /uploads -> http://localhost:3000
   ```

### **Problème : Vidéo ne se charge pas**

**Vérification** :
1. Backend en cours d'exécution sur port 3000
2. Frontend en cours d'exécution sur port 4200
3. Fichier vidéo existe dans `backend/uploads/videos/`
4. Console du navigateur (F12) pour voir les erreurs

**Test direct** :
```
http://localhost:3000/uploads/videos/lesson-1-1_1760130703368.mp4
```
Doit afficher/télécharger la vidéo directement.

### **Problème : Upload échoue**

**Vérification** :
1. Permissions du dossier `backend/uploads/videos/`
2. Taille du fichier (limite Multer par défaut : 100MB)
3. Format vidéo supporté (MP4 recommandé)

---

## 📁 Structure des fichiers

```
Archify_Project/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Route streaming vidéo
│   │   ├── modules/
│   │   │   ├── courses.ts              # API cours avec videoUrl
│   │   │   ├── lessons.ts              # API leçons
│   │   │   └── video-upload.ts         # Upload vidéo
│   │   └── middleware/
│   │       └── upload.ts               # Configuration Multer
│   ├── uploads/
│   │   └── videos/                     # Stockage vidéos
│   │       └── lesson-1-1_xxx.mp4
│   └── prisma/
│       └── schema.prisma               # Schéma BD avec videoUrl
│
├── frontend/
│   ├── proxy.conf.json                 # ⭐ Configuration proxy
│   ├── angular.json                    # ⭐ Référence proxy
│   └── src/app/
│       ├── components/
│       │   └── video-player/           # Lecteur vidéo
│       │       └── video-player.component.ts
│       └── pages/
│           ├── course/
│           │   └── course.component.ts # ⭐ getVideoUrl() mis à jour
│           └── lesson/
│               └── lesson.component.ts # ⭐ getVideoUrl() mis à jour
│
└── VIDEO_SETUP.md                      # Ce fichier
```

---

## 🔒 Sécurité

### **Protection du contenu**

- ✅ Vidéos servies uniquement via le backend (pas d'accès direct filesystem)
- ✅ Attribut `controlsList="nodownload"` sur la balise `<video>`
- ✅ Attribut `disablePictureInPicture` pour empêcher PiP
- ✅ Vérification des rôles (admin upload, student view)

### **CORS**

- ✅ Headers CORS permissifs en développement
- ⚠️ À restreindre en production avec domaines spécifiques

---

## 🚢 Déploiement en production

### **Backend**

1. **Variables d'environnement** :
   ```env
   CORS_ORIGINS=https://votre-domaine.com
   ```

2. **Stockage vidéo** :
   - Option 1 : Serveur de fichiers
   - Option 2 : Cloud storage (AWS S3, Cloudinary, etc.)
   - Option 3 : CDN pour meilleure performance

### **Frontend**

1. **Build de production** :
   ```bash
   cd frontend
   npm run build
   ```

2. **Configuration proxy** :
   - Le proxy n'est utilisé qu'en développement
   - En production, configurer les URLs absolues ou variables d'environnement :
   ```typescript
   const API_URL = environment.production
     ? 'https://api.votre-domaine.com'
     : 'http://localhost:3000';
   ```

---

## 📝 Formats vidéo supportés

**Recommandé** : MP4 (H.264 + AAC)

**Supportés** :
- MP4 (video/mp4)
- WebM (video/webm)
- OGG (video/ogg)

**Conversion recommandée** :
```bash
ffmpeg -i input.avi -c:v libx264 -c:a aac -strict experimental output.mp4
```

---

## 📈 Améliorations futures

- [ ] Streaming adaptatif (HLS/DASH)
- [ ] Compression vidéo automatique
- [ ] Génération de miniatures
- [ ] Sous-titres (WebVTT)
- [ ] Vitesse de lecture variable
- [ ] Reprise de lecture automatique
- [ ] Statistiques de visionnage avancées
- [ ] CDN integration

---

## 👥 Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs backend/frontend
3. Tester l'URL directe : `http://localhost:3000/uploads/videos/filename.mp4`

---

**Document créé le** : 11 Octobre 2024
**Dernière mise à jour** : 11 Octobre 2024
**Version** : 1.0.0
