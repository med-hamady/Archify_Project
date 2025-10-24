# Cahier des Charges - FacGame

## Description du Projet
FacGame est une plateforme d'apprentissage basée sur des quiz interactifs et des supports PDF.

---

## Contenu à ajouter
*Veuillez coller ici le contenu complet du cahier des charges*

---
FacGame – Cahier des Charges Officiel
Version : 1.3 (mise à jour complète – Modes Challenge et Examen)

Date : 20/10/2025

Auteur : Mohamed SidiYahya Hamady

Projet : FacGame – Plateforme médicale interactive et gamifiée pour étudiants en médecine

 

Résumé exécutif :


FacGame est une plateforme d’apprentissage ludique destinée aux étudiants en médecine des deux premiers cycles.
Elle couvre les principales matières fondamentales (anatomie, histologie, physiologie) et transforme la révision académique
en un jeu progressif à niveaux, avec des défis, des classements et des récompenses. Le présent cahier des charges détaille
les logiques de progression, les algorithmes de points, et les modes spéciaux (Challenge et Examen).



1. Présentation du projet

FacGame est une plateforme éducative médicale interactive destinée aux étudiants en médecine du premier et du deuxième cycle.
Elle allie rigueur scientifique et motivation ludique grâce à un système de gamification basé sur des QCM, des niveaux et des défis.
L’objectif est d’aider les étudiants à maîtriser durablement les matières fondamentales telles que l’anatomie, la physiologie et l’histologie.

2. Structure des contenus pédagogiques

Les matières couvertes par la plateforme :
1. Anatomie (ostéologie, myologie, articulations, systèmes)
2. Histologie (générale et spécifique)
3. Physiologie (fonctions vitales, systèmes et régulations)

Chaque discipline est divisée en chapitres contenant en moyenne 600 QCM.
Les QCM sont répartis selon quatre niveaux de difficulté : facile, moyen, difficile et légende.

3. Système de progression et niveaux

Le système de progression repose sur 7 niveaux de maîtrise, reflétant la montée en compétence de l’étudiant.
Chaque niveau nécessite un certain nombre de points d’expérience (XP).


| Niveau | Description | XP requis |
|---------|--------------|------------|
| Bois | Débutant, découverte du jeu | 0 – 800 |
| Bronze | Premières notions maîtrisées | 801 – 1 600 |
| Argent | Bonne base scientifique | 1 601 – 2 800 |
| Or | Niveau avancé, logique consolidée | 2 801 – 4 000 |
| Platinum | Fin du S1, maîtrise confirmée | 4 001 – 5 500 |
| Légendaire | Haut niveau d’expertise | 5 501 – 9 000 |
| Mondial | Excellence absolue | 9 001+ |

4. Algorithme de calcul des points (XP)

Chaque QCM rapporte un nombre de points selon :
- la difficulté du QCM,
- le nombre de tentatives,
- la progression dans le chapitre.


Barème de base :
- Facile : +5 XP
- Moyen : +10 XP
- Difficile : +20 XP

Multiplicateur selon la tentative :
- 1ère tentative : ×3
- 2ème tentative : ×1.5
- 3ème tentative : ×1
- 4ème tentative ou plus : 0

Formule : XP_final = XP_base × multiplicateur × (1 + 0.5 × position_QCM / total_QCM)

5. Modes Challenge et Examen

Deux modes spéciaux complètent le système classique : le Mode Challenge et le Mode Examen.
Ces modes encouragent la révision active et la préparation à l’évaluation.


1️⃣ Mode Challenge :
- Se débloque automatiquement à 50 % de progression dans une matière (exemple : 300 QCM sur 600).
- Permet de réviser les QCM déjà rencontrés sous forme de mini-défis chronométrés.
- Si le joueur atteint le niveau “Or”, le Mode Challenge est débloqué pour *toutes les matières*.


2️⃣ Mode Examen :
- Se débloque à 80 % de progression dans une matière (exemple : 480 QCM sur 600).
- Simule un examen réel avec temps limité, score et correction.
- Accessible à partir du niveau “Argent”.


Résumé des conditions :
| Mode | Condition | Fonction |
|-------|------------|----------|
| Challenge (par matière) | 50 % de progression | Révision dynamique |
| Challenge (global) | Niveau Or | Disponible partout |
| Examen | 80 % de progression | Simulation complète |

6. Structure technique et pseudo-code

Variables principales :
- XP_total : cumul d’expérience
- niveau : niveau actuel
- progression_matiere : % de progression par matière
- bonus_challenge : statut du défi
- palier_suivant : seuils d’XP

Pseudo-code :
pour chaque QCM répondu :
   définir XP_base selon difficulté
   définir multiplicateur selon tentative
   calculer facteur_progression
   si bonus actif : +20 % XP
   XP_total += XP_base × multiplicateur × facteur_progression
   vérifier passage de niveau et débloquer modes

7. Système de récompenses

Bonus dynamiques :
- 5 bonnes réponses consécutives : +20 % XP temporaire.
- 10 bonnes réponses consécutives : +50 XP.
- Challenge 100 % réussi : +200 XP.
- Badge “Légende” : après 100 QCM légendes réussis.


Récompenses de progression :
- Bronze : +2 % XP permanent.
- Argent : Déblocage du Mode Examen (si progression ≥ 80 %).
- Or : Déblocage global du Mode Challenge.
- Platinum : +5 % XP sur QCM difficiles.
- Légendaire : Badge spécial + mode révision libre.
- Mondial : Classement international + Titre d’excellence.

8. Objectifs pédagogiques et comportement attendu

L’étudiant est encouragé à répondre juste dès la première tentative, à maintenir la régularité dans ses révisions et à relever les défis pour gagner des bonus.
Le système favorise la constance, la précision et l’engagement progressif tout au long de l’année académique.
