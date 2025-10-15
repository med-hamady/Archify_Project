# Guide de Test: Protection par Abonnement

## Ce Qui Est Protégé

Le système protège **TOUTES LES VIDÉOS** avec deux couches de sécurité:

### Couche 1: API `/api/lessons/:id`
- Quand un utilisateur sans abonnement clique sur une vidéo
- Le backend vérifie l'abonnement
- Retourne **403 SUBSCRIPTION_REQUIRED**
- Le frontend affiche le message "Contenu Premium"

### Couche 2: Fichiers Vidéo `/uploads/videos/:filename`
- Quand le player vidéo essaie de charger le fichier vidéo
- Les middlewares `optionalAuth` + `checkVideoFileAccess` vérifient l'abonnement
- Retourne **403 SUBSCRIPTION_REQUIRED** si pas d'abonnement
- La vidéo ne se charge PAS

## Comment Tester

### Test 1: Utilisateur Sans Abonnement

1. **Créer un nouvel utilisateur:**
   - Aller sur http://localhost:4200/auth
   - Créer un compte (ex: test@example.com)
   - Se connecter

2. **Vérifier qu'il n'a PAS d'abonnement:**
   - Ouvrir la console du navigateur (F12)
   - Taper: `localStorage.getItem('archify_user')`
   - Vérifier qu'il n'y a PAS de subscriptions

3. **Essayer d'accéder à une vidéo:**
   - Aller sur http://localhost:4200/catalog
   - Cliquer sur un cours
   - Cliquer sur une leçon vidéo

4. **Résultat Attendu:**
   - ❌ La page de la leçon affiche: **"Contenu Premium"**
   - ❌ Message: "Cette leçon nécessite un abonnement actif pour y accéder"
   - ✅ Bouton "Voir les abonnements"
   - ❌ **La vidéo ne se charge PAS**

### Test 2: Vérifier dans la Console du Navigateur

1. Ouvrir la console (F12)
2. Onglet "Network"
3. Essayer d'accéder à une vidéo
4. Chercher la requête vers `/api/lessons/{id}`

**Résultat Attendu:**
```
GET /api/lessons/{id}
Status: 403 Forbidden

Response:
{
  "error": {
    "code": "SUBSCRIPTION_REQUIRED",
    "message": "Video content requires an active subscription"
  },
  "lesson": {
    "id": "...",
    "title": "...",
    "isPremium": true,
    "requiresSubscription": true,
    "type": "VIDEO"
  }
}
```

### Test 3: Vérifier l'Accès Direct au Fichier Vidéo

1. Dans la console Network, chercher la requête vers `/uploads/videos/{filename}`
2. **Si l'utilisateur n'a pas d'abonnement**, cette requête devrait retourner **403**

**Résultat Attendu:**
```
GET /uploads/videos/{filename}
Status: 403 Forbidden

Response:
{
  "error": {
    "code": "SUBSCRIPTION_REQUIRED",
    "message": "Active video subscription required to access this content"
  }
}
```

### Test 4: Logs Backend

Dans le terminal backend, vous devriez voir:
```
🎬 Video request: {filename}
🎬 Origin header: http://localhost:4200
🎬 Referer header: http://localhost:4200/lesson/{id}
```

Si l'utilisateur n'a pas d'abonnement, le middleware `checkVideoFileAccess` bloque la requête AVANT d'envoyer le fichier.

## Vérifier la Base de Données

Pour confirmer qu'un utilisateur n'a PAS d'abonnement:

```sql
-- Voir tous les utilisateurs et leurs abonnements
SELECT
    u.email,
    u.role,
    s.status as subscription_status,
    sp.type as subscription_type,
    sp.name as subscription_name
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u.id AND s.status = 'ACTIVE'
LEFT JOIN "SubscriptionPlan" sp ON sp.id = s."planId"
ORDER BY u."createdAt" DESC;
```

**Résultat Attendu** pour un utilisateur sans abonnement:
```
email              | role    | subscription_status | subscription_type | subscription_name
test@example.com   | STUDENT | null                | null              | null
```

## Créer un Abonnement de Test

Si vous voulez tester avec un abonnement:

```sql
-- 1. Créer un plan d'abonnement (si pas déjà fait)
INSERT INTO "SubscriptionPlan" (id, name, description, type, interval, "priceCents", currency, features, "isActive", "createdAt")
VALUES (
  'plan_test_videos',
  'Abonnement Vidéos Test',
  'Accès à toutes les vidéos',
  'VIDEOS_ONLY',
  'yearly',
  10000,
  'MRU',
  ARRAY['Accès illimité aux vidéos'],
  true,
  NOW()
);

-- 2. Créer un abonnement pour l'utilisateur
INSERT INTO "Subscription" (id, "userId", "planId", status, "startAt", "endAt", "createdAt")
VALUES (
  'sub_test_' || floor(random() * 1000000),
  (SELECT id FROM "User" WHERE email = 'test@example.com'),
  'plan_test_videos',
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW()
);
```

Après avoir créé l'abonnement:
1. Se déconnecter
2. Se reconnecter
3. Essayer d'accéder à une vidéo
4. **Résultat Attendu**: ✅ La vidéo se charge et se lit normalement

## Problèmes Courants

### Problème 1: L'utilisateur peut voir la vidéo même sans abonnement

**Causes possibles:**
1. L'utilisateur est un ADMIN (les admins ont toujours accès)
2. Le backend n'a pas été recompilé après les modifications
3. Le cookie JWT n'est pas envoyé avec la requête

**Solution:**
```bash
# Recompiler le backend
cd backend
npm run build

# Redémarrer le serveur
npm run dev
```

### Problème 2: L'utilisateur voit "Contenu Premium" mais c'est normal

**Explication:**
C'est le comportement VOULU! L'utilisateur voit la page avec le message "Contenu Premium" parce que:
- L'API `/api/lessons/:id` retourne 403
- Le frontend affiche le message approprié
- **La vidéo ne se charge pas**

C'est différent d'un utilisateur qui peut **lire** la vidéo.

### Problème 3: Le cookie n'est pas envoyé

**Vérification:**
1. Ouvrir Network dans la console
2. Cliquer sur une requête vers `/api/lessons/:id`
3. Onglet "Headers"
4. Chercher "Cookie"

**Résultat Attendu:**
```
Cookie: access_token=ey...; refresh_token=ey...
```

Si pas de cookie, le problème vient de l'authentification.

## Logs de Débogage

Pour activer plus de logs dans le backend:

**Backend: `src/middleware/subscription-access.ts`**

Ajouter des console.log:
```typescript
export async function checkVideoFileAccess(req: any, res: Response, next: NextFunction) {
  console.log('🔐 Checking video access...');
  console.log('  User ID:', req.userId);
  console.log('  User Role:', req.userRole);
  console.log('  Filename:', req.params.filename);

  // ... rest of the code

  const hasAccess = await canAccessVideo(req.userId);
  console.log('  Has Access:', hasAccess);

  if (!hasAccess) {
    console.log('❌ Access DENIED - No subscription');
    return res.status(403).json({...});
  }

  console.log('✅ Access GRANTED - User has subscription');
  next();
}
```

## Confirmation Finale

Pour confirmer que le système fonctionne:

1. ✅ L'utilisateur SANS abonnement voit "Contenu Premium"
2. ✅ La vidéo ne se charge PAS (erreur 403)
3. ✅ L'utilisateur AVEC abonnement peut lire la vidéo
4. ✅ Les ADMINS peuvent toujours lire les vidéos

Si ces 4 points sont vrais, **le système fonctionne correctement**! 🎉
