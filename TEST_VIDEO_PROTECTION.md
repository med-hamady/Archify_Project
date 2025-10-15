# 🧪 Guide de Test - Protection des Vidéos

## 🎯 Objectif

Vérifier que le système de protection des vidéos fonctionne correctement après la correction.

---

## ✅ Test 1 : Utilisateur Non Connecté

### Étapes
1. Ouvrez un navigateur en **mode navigation privée**
2. Allez sur http://localhost:4200
3. **NE VOUS CONNECTEZ PAS**
4. Allez sur "Cours" dans le menu
5. Cliquez sur un cours qui contient des vidéos
6. Essayez de cliquer sur une leçon vidéo

### Résultat Attendu
- ❌ Vous devriez être **redirigé vers la page de connexion**
- ❌ Message : "Veuillez vous connecter"
- 🔒 Vidéo **NON accessible**

### Si le test échoue
Le `authGuard` ne fonctionne pas correctement sur les routes.

---

## ✅ Test 2 : Utilisateur Connecté SANS Abonnement

### Étapes
1. Créez un **nouveau compte étudiant**
   - Email : `test-no-sub@example.com`
   - Mot de passe : `Test1234!`
2. Connectez-vous avec ce compte
3. Allez sur "Cours"
4. Cliquez sur un cours
5. Cliquez sur une leçon vidéo

### Résultat Attendu
- ✅ Vous accédez à la page de la leçon
- ❌ Le lecteur vidéo affiche une **erreur**
- ❌ Message dans la console du navigateur (F12) :
  ```
  Failed to load resource: the server responded with a status of 403 (Forbidden)
  GET http://localhost:3000/uploads/videos/xxx.mp4
  ```
- 🔒 Vidéo **NON accessible**

### Logs Backend Attendus
```
🔐 ===== CHECKING VIDEO ACCESS =====
  User ID: xxx
  User Role: STUDENT
  Has Access Result: false
❌ ACCESS DENIED - No active video subscription
```

---

## ✅ Test 3 : Utilisateur avec Paiement EN ATTENTE

### Étapes
1. Connectez-vous avec le compte de test
2. Allez sur `/subscription`
3. Choisissez le plan "Vidéos Seulement"
4. Remplissez le formulaire de paiement
5. Uploadez une image
6. Soumettez le paiement
7. Allez sur `/my-payments` → Statut : **"En attente"** 🟡
8. Retournez sur un cours avec vidéo
9. Essayez de lire une vidéo

### Résultat Attendu
- ❌ Erreur 403 dans le lecteur vidéo
- 🔒 Vidéo **NON accessible**
- Le paiement est EN ATTENTE mais l'abonnement n'est **pas encore créé**

### Logs Backend Attendus
```
🔐 ===== CHECKING VIDEO ACCESS =====
  User ID: xxx
  User Role: STUDENT
  Has Access Result: false
❌ ACCESS DENIED - No active video subscription
```

---

## ✅ Test 4 : Admin VALIDE le Paiement

### Étapes
1. **Connectez-vous comme ADMIN**
2. Allez sur `/admin/payments`
3. Vous devriez voir le paiement du Test 3 en **attente** 🟡
4. Cliquez sur "Voir détails"
5. Examinez la capture d'écran
6. Cliquez sur **"Valider le paiement"**
7. Confirmez
8. Message : "Paiement validé avec succès!"

### Résultat Attendu Backend
Le système crée automatiquement :
```sql
INSERT INTO Subscription (
  userId: 'xxx',
  planId: 'videos-only',
  status: 'ACTIVE',
  startAt: NOW(),
  endAt: NOW() + 1 YEAR
)
```

---

## ✅ Test 5 : Utilisateur Accède aux Vidéos APRÈS Validation

### Étapes
1. **Retournez sur le compte étudiant** (test-no-sub@example.com)
2. Rafraîchissez la page (F5)
3. Allez sur `/my-payments`
4. Vérifiez que le statut est **"Validé"** 🟢
5. Allez sur un cours avec vidéo
6. Cliquez sur une leçon vidéo

### Résultat Attendu
- ✅ Le lecteur vidéo **se charge**
- ✅ La vidéo **commence à jouer** 🎬
- ✅ Aucune erreur 403
- 🎉 **SUCCÈS !**

### Logs Backend Attendus
```
🔐 ===== CHECKING VIDEO ACCESS =====
  User ID: xxx
  User Role: STUDENT
  Has Access Result: true
✅ ACCESS GRANTED - User has active subscription
🎬 Video request: lesson-1.mp4
✅ Sending video file: /path/to/video
```

---

## ✅ Test 6 : Admin Peut TOUJOURS Accéder

### Étapes
1. Connectez-vous comme **ADMIN**
2. Allez sur n'importe quel cours
3. Cliquez sur une vidéo

### Résultat Attendu
- ✅ Vidéo se lit **immédiatement**
- ✅ Pas de vérification d'abonnement pour les admins

### Logs Backend Attendus
```
🔐 ===== CHECKING VIDEO ACCESS =====
  User Role: ADMIN
✅ ACCESS GRANTED - User is ADMIN
```

---

## ✅ Test 7 : Accès Direct via URL

### Étapes
1. **Déconnectez-vous** complètement
2. Ouvrez un nouvel onglet en navigation privée
3. Collez directement dans la barre d'adresse :
   ```
   http://localhost:3000/uploads/videos/lesson-1_1760130703368.mp4
   ```
4. Appuyez sur Entrée

### Résultat Attendu
- ❌ Erreur 401 ou 403
- ❌ JSON retourné :
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication required to access this video"
    }
  }
  ```
- 🔒 **Pas de téléchargement** du fichier vidéo

---

## 📊 Tableau Récapitulatif des Tests

| Test | Scénario | Résultat Attendu | Statut |
|------|----------|------------------|--------|
| 1 | Non connecté | ❌ Redirigé vers login | ⬜ À tester |
| 2 | Connecté sans abonnement | ❌ Erreur 403 | ⬜ À tester |
| 3 | Paiement en attente | ❌ Erreur 403 | ⬜ À tester |
| 4 | Admin valide paiement | ✅ Abonnement créé | ⬜ À tester |
| 5 | Après validation | ✅ Vidéo accessible | ⬜ À tester |
| 6 | Admin accède | ✅ Toujours autorisé | ⬜ À tester |
| 7 | Accès direct URL | ❌ Erreur 401/403 | ⬜ À tester |

---

## 🐛 Si un Test Échoue

### Test 1 ou 2 Échoue (Vidéo accessible sans abonnement)

**Vérifiez** :
1. Le backend a-t-il redémarré après la correction ?
2. La ligne `express.static` est-elle bien commentée ?
   ```bash
   grep -n "express.static.*uploads" backend/src/index.ts
   ```
3. Les logs backend s'affichent-ils ?

### Test 5 Échoue (Vidéo non accessible après validation)

**Vérifiez** :
1. L'abonnement a-t-il été créé dans la base ?
   ```sql
   SELECT * FROM Subscription WHERE userId = 'xxx';
   ```
2. Le statut est-il `ACTIVE` ?
3. La date `endAt` est-elle dans le futur ?
4. Le type est-il `VIDEOS_ONLY` ou `FULL_ACCESS` ?

### Test 7 Échoue (Accès direct fonctionne)

**Problème** : La route protégée n'intercepte pas les requêtes directes.

**Solution** : Vérifier l'ordre des routes dans `index.ts`

---

## 🎉 Validation Complète

Si **TOUS les tests passent** ✅ :

```
🎊 FÉLICITATIONS ! 🎊

Le système de protection des vidéos fonctionne parfaitement !

✅ Utilisateurs sans abonnement bloqués
✅ Paiements en attente ne donnent pas accès
✅ Validation admin active l'abonnement
✅ Abonnements valides donnent accès
✅ Admins toujours autorisés
✅ Accès direct bloqué

🚀 Le système est prêt pour la production !
```

---

## 📝 Rapport de Test

Copiez ce template et remplissez-le après vos tests :

```
=== RAPPORT DE TEST - PROTECTION VIDÉOS ===
Date : _______________
Testeur : _______________

Test 1 (Non connecté)         : [ ] ✅ Passé  [ ] ❌ Échoué
Test 2 (Sans abonnement)      : [ ] ✅ Passé  [ ] ❌ Échoué
Test 3 (Paiement en attente)  : [ ] ✅ Passé  [ ] ❌ Échoué
Test 4 (Validation admin)     : [ ] ✅ Passé  [ ] ❌ Échoué
Test 5 (Après validation)     : [ ] ✅ Passé  [ ] ❌ Échoué
Test 6 (Admin accès)          : [ ] ✅ Passé  [ ] ❌ Échoué
Test 7 (Accès direct URL)     : [ ] ✅ Passé  [ ] ❌ Échoué

Notes :
_____________________________________________
_____________________________________________
_____________________________________________

Statut Final : [ ] ✅ Tous les tests passent
               [ ] ❌ Des corrections sont nécessaires
```

---

**Bon test ! 🧪**
