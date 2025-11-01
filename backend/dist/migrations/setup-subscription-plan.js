"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSubscriptionPlan = setupSubscriptionPlan;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Migration automatique pour créer ou mettre à jour le plan d'abonnement Premium
 * S'exécute au démarrage du serveur
 */
async function setupSubscriptionPlan() {
    try {
        console.log('🔄 [Migration] Vérification du plan d\'abonnement Premium...');
        // Données du plan Premium
        const planData = {
            name: 'Premium',
            description: 'Accès complet à tous les quiz interactifs, documents PDF et supports de cours pour un semestre',
            type: 'FULL_ACCESS',
            interval: 'yearly',
            priceCents: 50000, // 500 MRU
            currency: 'MRU',
            features: [
                'Accès illimité à tous les quiz interactifs',
                'Téléchargement de tous les documents PDF',
                'Accès à tous les supports de cours',
                'Mises à jour gratuites du contenu',
                'Support prioritaire par email',
                'Valable pour un semestre complet'
            ],
            isActive: true
        };
        // Chercher un plan existant
        const existingPlans = await prisma.subscriptionPlan.findMany();
        if (existingPlans.length === 0) {
            // Créer le plan s'il n'existe pas
            console.log('📝 [Migration] Aucun plan trouvé, création du plan Premium...');
            const newPlan = await prisma.subscriptionPlan.create({
                data: planData
            });
            console.log('✅ [Migration] Plan Premium créé:', {
                id: newPlan.id,
                name: newPlan.name,
                price: `${newPlan.priceCents / 100} ${newPlan.currency}`
            });
        }
        else {
            // Mettre à jour le plan existant (prendre le premier ou celui nommé Premium)
            const planToUpdate = existingPlans.find(p => p.name.toLowerCase().includes('premium')) || existingPlans[0];
            console.log('🔧 [Migration] Plan trouvé, mise à jour:', planToUpdate.name);
            const updatedPlan = await prisma.subscriptionPlan.update({
                where: { id: planToUpdate.id },
                data: {
                    description: planData.description,
                    features: planData.features,
                    priceCents: planData.priceCents,
                    currency: planData.currency,
                    isActive: planData.isActive
                }
            });
            console.log('✅ [Migration] Plan Premium mis à jour:', {
                id: updatedPlan.id,
                name: updatedPlan.name,
                price: `${updatedPlan.priceCents / 100} ${updatedPlan.currency}`
            });
        }
        console.log('✅ [Migration] Configuration du plan d\'abonnement terminée avec succès');
    }
    catch (error) {
        console.error('❌ [Migration] Erreur lors de la configuration du plan:', error);
        // Ne pas faire échouer le démarrage du serveur, juste logger l'erreur
    }
}
//# sourceMappingURL=setup-subscription-plan.js.map