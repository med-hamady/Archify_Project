-- Vérifier les utilisateurs et leurs abonnements
SELECT
    u.id,
    u.email,
    u.name,
    u.role,
    u.semester,
    s.id as subscription_id,
    s.status as subscription_status,
    s."startAt",
    s."endAt",
    sp.type as plan_type,
    sp.name as plan_name
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u.id AND s.status = 'ACTIVE'
LEFT JOIN "SubscriptionPlan" sp ON sp.id = s."planId"
ORDER BY u."createdAt" DESC
LIMIT 10;
