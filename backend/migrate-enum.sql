-- Migration pour simplifier vers PREMIUM uniquement

-- Étape 1: Ajouter PREMIUM à l'enum
ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'PREMIUM';

-- Étape 2: Mettre à jour tous les plans existants vers PREMIUM
UPDATE "SubscriptionPlan"
SET type = 'PREMIUM'
WHERE type IN ('VIDEOS_ONLY', 'DOCUMENTS_ONLY', 'FULL_ACCESS');

-- Étape 3: Vérifier les résultats
SELECT id, name, type FROM "SubscriptionPlan";
