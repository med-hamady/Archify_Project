const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToPremium() {
  console.log('🔄 Migration vers abonnement Premium unique...\n');

  try {
    // 1. Vérifier les plans existants
    const existingPlans = await prisma.subscriptionPlan.findMany();
    console.log('📋 Plans existants:', existingPlans.length);
    existingPlans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.type})`);
    });

    // 2. Mettre à jour tous les plans vers PREMIUM via SQL direct
    console.log('\n🔄 Mise à jour de tous les types vers PREMIUM...');

    // Utiliser une requête SQL brute pour mettre à jour l'enum
    await prisma.$executeRaw`
      UPDATE "SubscriptionPlan"
      SET type = 'PREMIUM'::"SubscriptionType"
      WHERE type IN ('VIDEOS_ONLY', 'DOCUMENTS_ONLY', 'FULL_ACCESS')
    `;

    console.log('✅ Plans mis à jour avec succès');

    // 3. Vérifier les résultats
    const updatedPlans = await prisma.subscriptionPlan.findMany();
    console.log('\n📋 Plans après migration:', updatedPlans.length);
    updatedPlans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.type})`);
    });

    // 4. Créer ou mettre à jour le plan Premium principal
    console.log('\n🎯 Création/mise à jour du plan Premium principal...');

    const premiumPlan = await prisma.subscriptionPlan.upsert({
      where: { id: 'premium-plan' },
      update: {
        name: 'Premium',
        description: 'Accès complet à tous les cours et ressources',
        type: 'PREMIUM',
        interval: 'year',
        priceCents: 50000, // 500 MRU
        currency: 'MRU',
        features: [
          'Accès à tous les cours vidéo',
          'Accès à tous les documents PDF',
          'Téléchargement des ressources',
          'Support prioritaire',
          'Accès illimité pendant 1 an'
        ],
        isActive: true
      },
      create: {
        id: 'premium-plan',
        name: 'Premium',
        description: 'Accès complet à tous les cours et ressources',
        type: 'PREMIUM',
        interval: 'year',
        priceCents: 50000,
        currency: 'MRU',
        features: [
          'Accès à tous les cours vidéo',
          'Accès à tous les documents PDF',
          'Téléchargement des ressources',
          'Support prioritaire',
          'Accès illimité pendant 1 an'
        ],
        isActive: true
      }
    });

    console.log('✅ Plan Premium créé/mis à jour:', premiumPlan.id);

    // 5. Désactiver les anciens plans
    console.log('\n🔄 Désactivation des anciens plans...');
    await prisma.subscriptionPlan.updateMany({
      where: {
        id: { not: 'premium-plan' }
      },
      data: {
        isActive: false
      }
    });

    console.log('✅ Anciens plans désactivés');

    // 6. Vérifier les abonnements actifs
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true, user: true }
    });

    console.log(`\n📊 Abonnements actifs: ${activeSubscriptions.length}`);
    activeSubscriptions.forEach(sub => {
      console.log(`  - ${sub.user.email}: ${sub.plan.name} (expire le ${sub.endAt.toLocaleDateString()})`);
    });

    console.log('\n✅ Migration terminée avec succès!');
    console.log('\n📌 Prochaine étape: Exécuter `npx prisma migrate dev` pour mettre à jour le schéma\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToPremium();
