# 🎓 Guide Étudiant - Payer votre Abonnement

## 📱 Comment Souscrire à un Abonnement

### Étape 1 : Choisir votre Plan
1. Connectez-vous à votre compte sur http://localhost:4200
2. Cliquez sur **"Tarifs"** dans le menu
   - Ou allez directement sur `/subscription`
3. Consultez les **3 plans disponibles** :

#### 📹 Vidéos Seulement - 650 MRU/an
- Accès à toutes les vidéos de cours
- Idéal pour les étudiants visuels

#### 📚 Documents Seulement - 500 MRU/an
- Accès à tous les documents PDF
- Idéal pour réviser sur papier

#### ⭐ Accès Complet - 1000 MRU/an
- Vidéos + Documents + Examens
- Le meilleur rapport qualité/prix !

4. Cliquez sur **"Choisir ce plan"** sur le plan qui vous convient

---

### Étape 2 : Remplir le Formulaire de Paiement

Vous serez redirigé vers la page de paiement. Remplissez le formulaire :

#### 💳 1. Choisir la Méthode de Paiement
Sélectionnez votre opérateur :
- **Bankily** 🏦
- **Masrivi** 💰
- **Sedad** 📱

#### 📞 2. Numéro de Téléphone
Entrez le numéro utilisé pour le paiement
```
Exemple : 22345678
Minimum : 8 chiffres
```

#### 🔢 3. Numéro de Transaction
Entrez le code de transaction fourni par votre opérateur
```
Exemple : TXN123456789
```

#### 📸 4. Capture d'Écran du Paiement
**IMPORTANT** : Uploadez une capture d'écran **claire** de votre paiement

**Comment prendre une bonne capture** :
- ✅ Assurez-vous que le montant est visible
- ✅ Le numéro de transaction doit être lisible
- ✅ La date et l'heure doivent apparaître
- ✅ Format accepté : JPG, PNG, GIF, WEBP
- ✅ Taille maximum : 5MB

**Exemple de ce qui doit apparaître** :
```
✓ Montant : 650 MRU (ou 500/1000 selon le plan)
✓ Transaction : TXN123456789
✓ Date : 14/10/2025
✓ Statut : Succès/Réussi
```

#### ✅ 5. Valider
Cliquez sur **"Soumettre le paiement"**

---

### Étape 3 : Confirmation

Après soumission, vous verrez :
```
✅ Paiement soumis avec succès !

Votre paiement a été enregistré et est en attente
de validation par un administrateur.

Vous recevrez une notification par email une fois validé.
```

Cliquez sur **"Voir le statut de mon paiement"** pour suivre votre demande.

---

## 📊 Suivre le Statut de votre Paiement

### Accéder à vos Paiements
1. Allez sur `/my-payments`
   - Ou cliquez sur le lien dans le message de confirmation
2. Vous verrez la liste de tous vos paiements

### Comprendre les Statuts

#### 🟡 En Attente (PENDING)
```
Votre paiement est en cours de vérification par un admin.
Délai habituel : 24 heures maximum
```
**Action** : Patientez, vous recevrez une notification

#### 🟢 Validé (COMPLETED)
```
Félicitations ! Votre paiement a été validé.
Votre abonnement est maintenant actif.
```
**Action** : Vous pouvez accéder aux vidéos/documents

#### 🔴 Rejeté (FAILED)
```
Votre paiement a été refusé.
Raison : [Note de l'administrateur]
```
**Action** : Lisez la note de l'admin et soumettez un nouveau paiement

---

## 💡 Conseils pour un Paiement Rapide

### ✅ À FAIRE
1. **Effectuer le paiement AVANT** de remplir le formulaire
2. **Prendre une capture claire** immédiatement après le paiement
3. **Vérifier tous les champs** avant de soumettre
4. **Noter le numéro de transaction** quelque part
5. **Patienter 24h** avant de contacter le support

### ❌ À ÉVITER
1. Ne pas envoyer de capture floue ou illisible
2. Ne pas inventer de numéro de transaction
3. Ne pas utiliser une vieille capture d'un autre paiement
4. Ne pas payer un montant différent du plan choisi
5. Ne pas soumettre plusieurs fois le même paiement

---

## 🔍 Détails de votre Paiement

Sur la page `/my-payments`, vous pouvez voir :

### Informations Affichées
- 📅 **Date** : Quand vous avez soumis le paiement
- 💰 **Montant** : Prix payé
- 🏦 **Méthode** : Bankily, Masrivi ou Sedad
- 🔢 **Transaction** : Votre numéro de transaction
- 📦 **Plan** : Le plan d'abonnement choisi
- ⭐ **Statut** : Pending, Completed ou Failed

### Actions Possibles
- 👁️ **Voir la capture** : Cliquer pour agrandir votre screenshot
- 📝 **Lire les notes** : Si rejeté, voir pourquoi

---

## 🚀 Après la Validation

### Votre Abonnement est Actif
Une fois validé par l'admin :
1. ✅ Vous recevez un email de confirmation
2. ✅ Le badge passe au vert 🟢
3. ✅ Vous pouvez accéder aux contenus premium

### Accéder au Contenu
1. Allez sur **"Cours"** dans le menu
2. Cliquez sur n'importe quel cours premium
3. Cliquez sur une leçon avec vidéo
4. **La vidéo se lit automatiquement** 🎬

### Durée de l'Abonnement
Votre abonnement est valable **1 an** à partir de la date de validation.

---

## ❓ FAQ - Questions Fréquentes

### Q1 : Combien de temps pour la validation ?
**R** : Maximum 24 heures. En général, quelques heures seulement.

### Q2 : Que faire si mon paiement est rejeté ?
**R** : Lisez attentivement la note de l'admin, corrigez le problème, puis soumettez un nouveau paiement avec une meilleure capture.

### Q3 : Puis-je soumettre plusieurs paiements ?
**R** : Oui, mais attendez que le premier soit traité avant d'en soumettre un autre.

### Q4 : Mon abonnement expire-t-il ?
**R** : Oui, après 1 an. Vous recevrez un email de rappel avant l'expiration.

### Q5 : Puis-je changer de plan ?
**R** : Oui, contactez un administrateur pour faire la modification.

### Q6 : Comment obtenir une facture ?
**R** : Contactez un administrateur avec votre numéro de transaction.

### Q7 : Le paiement est-il sécurisé ?
**R** : Oui, toutes vos informations sont stockées de manière sécurisée et chiffrées.

### Q8 : Puis-je partager mon compte ?
**R** : Non, chaque abonnement est strictement personnel.

---

## 📞 Besoin d'Aide ?

### En cas de Problème

#### Si votre capture est refusée
1. Prenez une nouvelle capture plus claire
2. Assurez-vous que tous les détails sont lisibles
3. Resoumettez le paiement

#### Si vous n'avez pas de nouvelle après 24h
1. Vérifiez vos spams/courrier indésirable
2. Consultez `/my-payments` pour voir le statut
3. Contactez un administrateur

#### Si vous avez fait une erreur
1. Ne paniquez pas
2. Contactez immédiatement un admin
3. Expliquez la situation

### Contact Support
- 📧 Email : support@archify-iscae.mr
- 📱 Téléphone : +222 XX XX XX XX
- 🏢 Bureau : ISCAE - Département Informatique

---

## 💳 Méthodes de Paiement Acceptées

### Bankily 🏦
- Utilisez l'application Bankily
- Envoyez le montant au compte ISCAE
- Prenez une capture de la confirmation

### Masrivi 💰
- Utilisez l'application Masrivi
- Effectuez le transfert
- Notez le numéro de transaction

### Sedad 📱
- Composez le code USSD ou utilisez l'app
- Confirmez le paiement
- Sauvegardez le message de confirmation

---

## 🎓 Conseils d'Étudiant à Étudiant

### Témoignages

> "J'ai pris l'abonnement Accès Complet et ça vaut vraiment le coup ! Les vidéos sont super claires."
> - Ahmed, 3ème année

> "Le paiement par Bankily est ultra rapide. Mon abonnement a été validé en 2h !"
> - Fatima, 2ème année

> "N'oubliez pas de faire une capture AVANT de quitter l'app de paiement !"
> - Mohamed, 1ère année

---

**Bon courage pour vos études ! 📚✨**

---

**Version du Guide** : 1.0
**Dernière mise à jour** : 14 octobre 2025
**Plateforme** : Archify - ISCAE Informatique de Gestion
