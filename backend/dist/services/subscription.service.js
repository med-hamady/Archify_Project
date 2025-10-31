"use strict";
/**
 * Subscription Service
 *
 * Gère la vérification des abonnements actifs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserSubscription = checkUserSubscription;
exports.canAccessQuiz = canAccessQuiz;
exports.canAccessDocuments = canAccessDocuments;
exports.getUserActiveSubscriptions = getUserActiveSubscriptions;
exports.markExpiredSubscriptions = markExpiredSubscriptions;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ============================================
// FONCTIONS PRINCIPALES
// ============================================
/**
 * Vérifie si un utilisateur a un abonnement actif
 *
 * @param userId - ID de l'utilisateur
 * @returns Résultat de la vérification d'abonnement
 */
async function checkUserSubscription(userId) {
    try {
        // Récupérer l'abonnement actif le plus récent
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                endAt: {
                    gte: new Date() // La date de fin est dans le futur
                }
            },
            include: {
                plan: true
            },
            orderBy: {
                endAt: 'desc'
            }
        });
        // Aucun abonnement actif
        if (!subscription) {
            return {
                hasActiveSubscription: false,
                canAccessQuiz: false,
                canAccessDocuments: false,
                message: 'Aucun abonnement actif. Veuillez souscrire à un plan pour accéder au contenu.'
            };
        }
        // Vérifier les permissions selon le type d'abonnement
        const subscriptionType = subscription.plan.type;
        const canAccessQuiz = subscriptionType === 'QUIZ_ONLY' || subscriptionType === 'FULL_ACCESS';
        const canAccessDocuments = subscriptionType === 'DOCUMENTS_ONLY' || subscriptionType === 'FULL_ACCESS';
        return {
            hasActiveSubscription: true,
            subscriptionType,
            canAccessQuiz,
            canAccessDocuments,
            expiresAt: subscription.endAt,
            message: `Abonnement actif jusqu'au ${subscription.endAt.toLocaleDateString('fr-FR')}`
        };
    }
    catch (error) {
        console.error('[checkUserSubscription] Error:', error);
        throw error;
    }
}
/**
 * Vérifie si un utilisateur peut accéder aux quiz
 *
 * @param userId - ID de l'utilisateur
 * @returns true si l'utilisateur peut accéder aux quiz
 */
async function canAccessQuiz(userId) {
    const result = await checkUserSubscription(userId);
    return result.canAccessQuiz;
}
/**
 * Vérifie si un utilisateur peut accéder aux documents
 *
 * @param userId - ID de l'utilisateur
 * @returns true si l'utilisateur peut accéder aux documents
 */
async function canAccessDocuments(userId) {
    const result = await checkUserSubscription(userId);
    return result.canAccessDocuments;
}
/**
 * Récupère tous les abonnements actifs d'un utilisateur
 *
 * @param userId - ID de l'utilisateur
 * @returns Liste des abonnements actifs
 */
async function getUserActiveSubscriptions(userId) {
    return await prisma.subscription.findMany({
        where: {
            userId,
            status: 'ACTIVE',
            endAt: {
                gte: new Date()
            }
        },
        include: {
            plan: true
        },
        orderBy: {
            endAt: 'desc'
        }
    });
}
/**
 * Marque les abonnements expirés comme EXPIRED
 * Cette fonction devrait être appelée périodiquement (cron job)
 */
async function markExpiredSubscriptions() {
    const now = new Date();
    const result = await prisma.subscription.updateMany({
        where: {
            status: 'ACTIVE',
            endAt: {
                lt: now
            }
        },
        data: {
            status: 'EXPIRED'
        }
    });
    console.log(`[markExpiredSubscriptions] Marked ${result.count} subscriptions as expired`);
    return result.count;
}
//# sourceMappingURL=subscription.service.js.map