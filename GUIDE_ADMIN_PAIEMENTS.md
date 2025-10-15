# 📋 Guide Admin - Gestion des Paiements Manuels

## 🎯 Accès à la Page de Gestion

### Méthode 1 : Via le Tableau de Bord Admin
1. Connectez-vous avec un compte **ADMIN** ou **SUPERADMIN**
2. Allez sur `/admin` (tableau de bord principal)
3. Dans la section **"Actions Rapides"**, cliquez sur le bouton :
   ```
   💳 Gérer les Paiements
   Valider les paiements manuels
   ```
4. Vous serez redirigé vers `/admin/payments`

### Méthode 2 : Accès Direct
Tapez directement dans le navigateur :
```
http://localhost:4200/admin/payments
```

---

## 🖥️ Interface de Gestion des Paiements

### En-tête avec Statistiques
Vous verrez en haut de la page :
- 🟡 **Paiements en attente** : Nombre de paiements nécessitant votre validation
- 🟢 **Paiements validés** : Nombre total de paiements approuvés
- 🔴 **Paiements rejetés** : Nombre total de paiements refusés

### Filtre par Statut
Utilisez le menu déroulant pour filtrer :
- **Tous les paiements** : Affiche tout
- **En attente** : Uniquement les paiements à traiter
- **Validés** : Uniquement les paiements approuvés
- **Rejetés** : Uniquement les paiements refusés

### Tableau des Paiements
Chaque ligne affiche :
| Colonne | Description |
|---------|-------------|
| **Date** | Date et heure de soumission |
| **Utilisateur** | Nom et email de l'étudiant |
| **Plan** | Plan d'abonnement choisi |
| **Montant** | Prix en MRU |
| **Méthode** | Bankily, Masrivi ou Sedad |
| **Transaction** | Numéro de transaction fourni |
| **Statut** | Badge coloré (Pending/Completed/Failed) |
| **Actions** | Boutons d'action |

**Note** : Les paiements en attente sont **surlignés en jaune** pour attirer l'attention !

---

## ✅ Valider un Paiement

### Étape 1 : Ouvrir les Détails
Cliquez sur le bouton **👁️** dans la colonne "Actions"

### Étape 2 : Examiner les Informations
Une modal s'ouvre avec :

#### 📝 Section "Informations Utilisateur"
- Nom complet
- Email
- Numéro de téléphone utilisé pour le paiement

#### 💰 Section "Informations Paiement"
- Plan d'abonnement choisi
- Montant payé
- Méthode de paiement (Bankily/Masrivi/Sedad)
- Numéro de transaction
- Date de soumission
- Statut actuel

#### 📸 Section "Capture d'écran du paiement"
- Image uploadée par l'utilisateur
- **Cliquez sur l'image** pour l'agrandir en plein écran
- Vérifiez que :
  - ✓ Le montant correspond
  - ✓ Le numéro de transaction correspond
  - ✓ La capture semble authentique

### Étape 3 : Ajouter des Notes (Optionnel)
Dans le champ **"Notes administrateur"**, vous pouvez ajouter :
- Des remarques internes
- Des détails de vérification
- Des commentaires pour le suivi

**Exemple** :
```
Vérifié avec l'opérateur Bankily. Transaction confirmée.
```

### Étape 4 : Valider
Cliquez sur le bouton **✅ "Valider le paiement"**

### Étape 5 : Confirmation
- Une popup de confirmation apparaît
- Cliquez sur **"OK"**
- Le système :
  1. ✅ Change le statut du paiement en **COMPLETED**
  2. ✅ Crée automatiquement un **abonnement actif** d'1 an
  3. ✅ Enregistre votre ID et la date de validation
  4. ✅ L'utilisateur peut maintenant accéder aux vidéos !

---

## ❌ Rejeter un Paiement

### Quand rejeter un paiement ?
- 🚫 Capture d'écran illisible ou falsifiée
- 🚫 Montant incorrect
- 🚫 Numéro de transaction invalide
- 🚫 Paiement non confirmé par l'opérateur

### Étapes
1. Ouvrez les détails du paiement (bouton 👁️)
2. Examinez la capture d'écran
3. **Ajoutez une note expliquant le rejet** ⚠️ **OBLIGATOIRE**
   ```
   Exemple : "La capture d'écran est illisible.
   Veuillez soumettre une nouvelle image claire."
   ```
4. Cliquez sur **❌ "Rejeter le paiement"**
5. Confirmez

### Résultat
- Le statut devient **FAILED** 🔴
- L'utilisateur voit vos notes sur `/my-payments`
- L'utilisateur peut soumettre un nouveau paiement

---

## 🔍 Actions Rapides sur le Tableau

Sans ouvrir les détails, vous pouvez :

### Pour un Paiement EN ATTENTE :
- **👁️ Voir** : Ouvrir les détails complets
- **✅ Valider** : Valider directement (sans voir les détails)
- **❌ Rejeter** : Rejeter directement (sans voir les détails)

### Pour un Paiement VALIDÉ ou REJETÉ :
- **👁️ Voir** : Consulter l'historique et les notes

---

## 📊 Pagination

Si vous avez plus de 20 paiements :
- Utilisez les boutons **"Précédent"** et **"Suivant"**
- Le numéro de page actuel est affiché : `Page X sur Y`

---

## 💡 Conseils et Bonnes Pratiques

### ✅ À FAIRE
1. **Vérifier systématiquement** la capture d'écran avant validation
2. **Ajouter des notes** pour garder une trace des vérifications
3. **Filtrer par "En attente"** pour voir uniquement ce qui nécessite une action
4. **Expliquer clairement** les raisons de rejet

### ❌ À ÉVITER
1. Ne pas valider sans voir la capture d'écran
2. Ne pas rejeter sans ajouter de note explicative
3. Ne pas valider des captures illisibles "pour faire plaisir"

### 🔒 Sécurité
- Seuls les comptes **ADMIN** et **SUPERADMIN** peuvent accéder à cette page
- Toutes les validations sont tracées (qui, quand)
- Les notes sont visibles par l'utilisateur en cas de rejet

---

## 🎯 Workflow Complet

```
1. ÉTUDIANT soumet un paiement
   ↓
2. ADMIN reçoit la notification (badge 🟡 en attente)
   ↓
3. ADMIN ouvre /admin/payments
   ↓
4. ADMIN clique sur "Voir détails"
   ↓
5. ADMIN examine la capture d'écran
   ↓
6a. SI VALIDE → Clic "Valider"
    → Abonnement créé automatiquement ✅
    → Étudiant peut accéder aux vidéos
   OU
6b. SI INVALIDE → Ajout note + Clic "Rejeter"
    → Étudiant voit la note et peut resoummettre
```

---

## 🚀 Raccourcis Clavier (Bientôt disponibles)

| Action | Raccourci |
|--------|-----------|
| Ouvrir premier paiement en attente | `Ctrl + P` |
| Valider le paiement ouvert | `Ctrl + Enter` |
| Rejeter le paiement ouvert | `Ctrl + Shift + R` |
| Fermer la modal | `Esc` |

---

## 📞 Support

En cas de problème :
1. Vérifiez que vous êtes bien connecté comme ADMIN
2. Rafraîchissez la page (F5)
3. Vérifiez les logs du backend en cas d'erreur
4. Contactez le développeur si le problème persiste

---

## 📈 Statistiques et Rapports

### Informations Disponibles
- Nombre total de paiements traités
- Taux de validation/rejet
- Méthodes de paiement les plus utilisées
- Revenus générés par les paiements manuels

### Accès aux Statistiques Détaillées
Les statistiques complètes seront bientôt disponibles dans l'onglet **"Analytiques"** du tableau de bord admin.

---

**Version du Guide** : 1.0
**Dernière mise à jour** : 14 octobre 2025
**Système** : Archify - Plateforme ISCAE
