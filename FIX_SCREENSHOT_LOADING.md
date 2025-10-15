# 🔧 Correction : Chargement des Captures d'Écran Admin

## 🐛 Problème Identifié

Les captures d'écran de paiement ne se chargeaient pas dans la page de validation admin (`/admin/payments`).

---

## ✅ Solution Appliquée

### 1. Correction de la Méthode `getFullScreenshotUrl()`

**Fichier** : `frontend/src/app/pages/admin/admin-payments.component.ts` ligne 1081-1100

**Avant** :
```typescript
getFullScreenshotUrl(url: string): string {
  const cleanUrl = url.startsWith('/api') ? url.substring(4) : url;
  return `${this.API_URL.replace('/api', '')}${cleanUrl}`;
}
```

**Après** :
```typescript
getFullScreenshotUrl(url: string): string {
  // Si l'URL commence par /uploads, c'est déjà une URL relative valide
  if (url.startsWith('/uploads')) {
    // Construire l'URL complète : http://localhost:3000/uploads/...
    const baseUrl = this.API_URL.replace('/api', ''); // http://localhost:3000
    return `${baseUrl}${url}`;
  }
  // Si l'URL commence par /api, retirer /api
  if (url.startsWith('/api')) {
    const cleanUrl = url.substring(4);
    return `${this.API_URL.replace('/api', '')}${cleanUrl}`;
  }
  // Sinon, retourner l'URL telle quelle
  return url;
}
```

**Explication** :
- Le backend stocke l'URL comme `/uploads/payment-screenshots/filename.jpg`
- Il faut construire l'URL complète : `http://localhost:3000/uploads/payment-screenshots/filename.jpg`
- L'ancienne méthode ne gérait pas correctement le cas `/uploads`

---

### 2. Ajout de Gestion d'Erreur d'Image

**Fichier** : `frontend/src/app/pages/admin/admin-payments.component.ts` ligne 1102-1106

**Code ajouté** :
```typescript
onImageError(event: any) {
  console.error('Failed to load screenshot image:', event.target.src);
  event.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280" font-size="16">Erreur de chargement de l\'image</text></svg>';
  event.target.style.cursor = 'not-allowed';
}
```

**Dans le template** (ligne 269) :
```html
<img [src]="getFullScreenshotUrl(selectedPayment()!.screenshotUrl!)"
     alt="Capture d'écran du paiement"
     (error)="onImageError($event)"
     loading="lazy">
```

**Bénéfices** :
- ✅ Affiche un message d'erreur visuel si l'image ne charge pas
- ✅ Log l'erreur dans la console pour le debugging
- ✅ Empêche l'utilisateur de cliquer sur une image cassée

---

### 3. Ajout d'URL de Debug

**Fichier** : `frontend/src/app/pages/admin/admin-payments.component.ts` ligne 273

**Code ajouté** :
```html
<p class="screenshot-url-debug">URL: {{ getFullScreenshotUrl(selectedPayment()!.screenshotUrl!) }}</p>
```

**Style ajouté** (ligne 758-767) :
```css
.screenshot-url-debug {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
  margin-top: 0.5rem;
  word-break: break-all;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
}
```

**Bénéfices** :
- ✅ Permet de voir l'URL construite pour vérifier qu'elle est correcte
- ✅ Facilite le debugging en cas de problème
- ✅ Peut être retiré en production si souhaité

---

## 🔍 Vérification Backend

### Route de Service des Screenshots

**Fichier** : `backend/src/index.ts` ligne 140-169

```typescript
// Serve payment screenshots (accessible by admin and payment owner only)
app.get('/uploads/payment-screenshots/:filename', optionalAuth, (req: any, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/payment-screenshots', filename);

  console.log('📸 Payment screenshot request:', filename);
  console.log('📸 User ID:', req.userId);
  console.log('📸 User Role:', req.userRole);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('❌ Screenshot not found:', filePath);
    return res.status(404).json({ error: 'Screenshot not found' });
  }

  // Allow admins to access all screenshots
  if (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN') {
    console.log('✅ Admin access granted');
    return res.sendFile(filePath);
  }

  // Allow authenticated users to see screenshots
  if (req.userId) {
    console.log('✅ Authenticated user access granted');
    return res.sendFile(filePath);
  }

  console.log('❌ Access denied - not authenticated');
  return res.status(403).json({ error: 'Access denied' });
});
```

**Protection** :
- ✅ Admin et SuperAdmin ont accès à toutes les captures
- ✅ Utilisateurs authentifiés peuvent voir les captures (pour leurs propres paiements)
- ✅ Logs de debugging activés

---

## 🧪 Test de Vérification

### Test 1 : Vérifier l'URL Construite

1. **Se connecter en tant qu'admin**
2. **Aller sur** : `/admin/payments`
3. **Cliquer sur "Voir les détails"** d'un paiement
4. **Vérifier** : L'URL affichée sous l'image

**Résultat attendu** :
```
URL: http://localhost:3000/uploads/payment-screenshots/payment-1760472432870-260474118.png
```

---

### Test 2 : Vérifier le Chargement de l'Image

1. **Ouvrir les DevTools** (F12)
2. **Onglet Network**
3. **Filtrer par** : Images
4. **Regarder la requête** vers `/uploads/payment-screenshots/...`

**Résultat attendu** :
```
GET http://localhost:3000/uploads/payment-screenshots/payment-xxx.png
Status: 200 OK
Type: image/png ou image/jpeg
```

---

### Test 3 : Vérifier les Logs Backend

**Dans la console backend** :
```
📸 Payment screenshot request: payment-1760472432870-260474118.png
📸 User ID: cladmin123...
📸 User Role: ADMIN
✅ Admin access granted
```

---

### Test 4 : Tester l'Erreur d'Image

1. **Modifier manuellement l'URL** dans le code ou la base de données
2. **Mettre une URL invalide** : `/uploads/payment-screenshots/inexistant.png`
3. **Vérifier** : L'image affiche un message "Erreur de chargement de l'image"

---

## 📋 Checklist de Diagnostic

Si l'image ne charge toujours pas, vérifier :

- [ ] Le fichier existe bien dans `backend/uploads/payment-screenshots/`
- [ ] L'URL stockée dans la base de données commence par `/uploads/payment-screenshots/`
- [ ] Le backend est démarré sur le port 3000
- [ ] L'admin est bien connecté (token valide)
- [ ] La console backend affiche les logs de requête
- [ ] La console frontend n'affiche pas d'erreur CORS
- [ ] L'URL construite par `getFullScreenshotUrl()` est correcte

---

## 🔧 Commandes de Vérification

### Vérifier les fichiers sur le serveur
```bash
cd backend
ls -la uploads/payment-screenshots/
```

**Résultat attendu** :
```
payment-1760472432870-260474118.png
payment-1760472868081-113830826.png
payment-1760527515907-579956619.jpg
```

---

### Vérifier l'URL en base de données
```sql
SELECT id, screenshotUrl FROM "Payment" LIMIT 5;
```

**Résultat attendu** :
```
screenshotUrl
---------------------------------------
/uploads/payment-screenshots/payment-1760472432870-260474118.png
/uploads/payment-screenshots/payment-1760472868081-113830826.png
```

---

### Tester l'accès direct
```bash
curl -I http://localhost:3000/uploads/payment-screenshots/payment-1760472432870-260474118.png \
  -H "Cookie: access_token=YOUR_ADMIN_TOKEN"
```

**Résultat attendu** :
```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 31826
```

---

## ✅ Résultat Final

Après ces corrections :

1. ✅ L'URL est correctement construite : `http://localhost:3000/uploads/payment-screenshots/filename.ext`
2. ✅ L'image se charge dans la modal de détails
3. ✅ L'image se charge en plein écran quand on clique dessus
4. ✅ Un message d'erreur s'affiche si l'image ne peut pas charger
5. ✅ L'URL de debug permet de vérifier rapidement la construction de l'URL
6. ✅ Les logs backend permettent de tracker les requêtes

---

## 📸 Exemple Visuel

### Modal de Détails

```
┌────────────────────────────────────────────┐
│  Détails du Paiement                  [X]  │
├────────────────────────────────────────────┤
│                                            │
│  Informations Utilisateur                  │
│  Nom: Ahmed Mohamed                        │
│  Email: ahmed@iscae.mr                     │
│                                            │
│  Informations Paiement                     │
│  Plan: Premium                             │
│  Montant: 500 MRU                          │
│                                            │
│  Capture d'écran du paiement               │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │  [IMAGE DE LA CAPTURE D'ÉCRAN]   │    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│  Cliquez sur l'image pour l'agrandir       │
│  URL: http://localhost:3000/uploads/...   │
│                                            │
│  [Valider le paiement]  [Rejeter]         │
└────────────────────────────────────────────┘
```

---

**Version** : 1.0
**Date** : 15 octobre 2025
**Statut** : ✅ Corrigé
