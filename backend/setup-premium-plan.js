const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPremiumPlan() {
  console.log('🎯 Configuration du plan Premium unique...\n');

  try {
    // 1. Créer ou mettre à jour le plan Premium
    const premiumPlan = await prisma.subscriptionPlan.upsert({
      where: { id: 'premium-plan' },
      update: {
        name: 'Premium',
        description: 'Accès complet à tous les cours et ressources de la plateforme Archify',
        type: 'PREMIUM',
        interval: 'year',
        priceCents: 50000, // 500 MRU par an
        currency: 'MRU',
        features: [
          'Accès illimité à tous les cours vidéo',
          'Accès à tous les documents PDF et supports',
          'Téléchargement des ressources',
          'Support prioritaire',
          'Mises à jour et nouveaux contenus inclus',
          'Valable pendant 1 an'
        ],
        isActive: true
      },
      create: {
        id: 'premium-plan',
        name: 'Premium',
        description: 'Accès complet à tous les cours et ressources de la plateforme Archify',
        type: 'PREMIUM',
        interval: 'year',
        priceCents: 50000,
        currency: 'MRU',
        features: [
          'Accès illimité à tous les cours vidéo',
          'Accès à tous les documents PDF et supports',
          'Téléchargement des ressources',
          'Support prioritaire',
          'Mises à jour et nouveaux contenus inclus',
          'Valable pendant 1 an'
        ],
        isActive: true
      }
    });

    console.log('✅ Plan Premium créé/mis à jour:');
    console.log(`   ID: ${premiumPlan.id}`);
    console.log(`   Nom: ${premiumPlan.name}`);
    console.log(`   Prix: ${premiumPlan.priceCents / 100} ${premiumPlan.currency}`);
    console.log(`   Type: ${premiumPlan.type}`);

    // 2. Désactiver tous les autres plans
    console.log('\n🔄 Désactivation des anciens plans...');
    const result = await prisma.subscriptionPlan.updateMany({
      where: {
        id: { not: 'premium-plan' }
      },
      data: {
        isActive: false
      }
    });

    console.log(`✅ ${result.count} ancien(s) plan(s) désactivé(s)`);

    // 3. Afficher tous les plans
    console.log('\n📋 Liste de tous les plans:');
    const allPlans = await prisma.subscriptionPlan.findMany({
      orderBy: { isActive: 'desc' }
    });

    allPlans.forEach(plan => {
      const status = plan.isActive ? '✅ ACTIF' : '❌ INACTIF';
      console.log(`   ${status} - ${plan.name} (${plan.type}) - ${plan.priceCents / 100} ${plan.currency}`);
    });

    // 4. Vérifier les abonnements actifs
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        plan: true,
        user: { select: { email: true, name: true } }
      }
    });

    console.log(`\n📊 Abonnements actifs: ${activeSubscriptions.length}`);
    if (activeSubscriptions.length > 0) {
      activeSubscriptions.forEach(sub => {
        console.log(`   - ${sub.user.email}: Plan "${sub.plan.name}" (expire: ${sub.endAt.toLocaleDateString('fr-FR')})`);
      });
    }

    console.log('\n✅ Configuration terminée!');
    console.log('\n📌 Le plan Premium est maintenant le seul plan actif.');
    console.log('📌 Prix: 500 MRU/an pour un accès complet à tout le contenu.\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPremiumPlan();
