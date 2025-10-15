const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteOldPlans() {
  console.log('🗑️  Suppression des anciens plans d\'abonnement...\n');

  try {
    // 1. Afficher tous les plans actuels
    const allPlans = await prisma.subscriptionPlan.findMany();
    console.log('📋 Plans actuellement en base de données:');
    allPlans.forEach(plan => {
      const status = plan.isActive ? '✅ ACTIF' : '❌ INACTIF';
      console.log(`   ${status} - ${plan.name} (ID: ${plan.id}) - ${plan.priceCents / 100} ${plan.currency}`);
    });

    // 2. Vérifier les abonnements actifs liés aux anciens plans
    console.log('\n🔍 Vérification des abonnements actifs...');
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        planId: { not: 'premium-plan' }
      },
      include: {
        plan: true,
        user: { select: { email: true, name: true } }
      }
    });

    if (activeSubscriptions.length > 0) {
      console.log(`\n⚠️  ATTENTION: ${activeSubscriptions.length} abonnement(s) actif(s) lié(s) aux anciens plans:`);
      activeSubscriptions.forEach(sub => {
        console.log(`   - ${sub.user.email}: Plan "${sub.plan.name}" (expire: ${sub.endAt.toLocaleDateString('fr-FR')})`);
      });

      // Migrer ces abonnements vers le plan Premium
      console.log('\n🔄 Migration des abonnements actifs vers le plan Premium...');
      for (const sub of activeSubscriptions) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { planId: 'premium-plan' }
        });
        console.log(`   ✅ Abonnement de ${sub.user.email} migré vers Premium`);
      }
    } else {
      console.log('   ✅ Aucun abonnement actif lié aux anciens plans');
    }

    // 3. Vérifier les paiements liés aux anciens plans
    console.log('\n🔍 Vérification des paiements...');
    const payments = await prisma.payment.findMany({
      where: {
        planId: { not: 'premium-plan' }
      }
    });

    if (payments.length > 0) {
      console.log(`   ⚠️  ${payments.length} paiement(s) lié(s) aux anciens plans`);
      console.log('   ℹ️  Ces paiements seront conservés pour l\'historique');
    } else {
      console.log('   ✅ Aucun paiement lié aux anciens plans');
    }

    // 4. Supprimer tous les plans sauf Premium
    console.log('\n🗑️  Suppression des anciens plans...');
    const deleteResult = await prisma.subscriptionPlan.deleteMany({
      where: {
        id: { not: 'premium-plan' }
      }
    });

    console.log(`   ✅ ${deleteResult.count} plan(s) supprimé(s)`);

    // 5. Afficher le résultat final
    console.log('\n📋 Plans restants en base de données:');
    const remainingPlans = await prisma.subscriptionPlan.findMany();
    remainingPlans.forEach(plan => {
      const status = plan.isActive ? '✅ ACTIF' : '❌ INACTIF';
      console.log(`   ${status} - ${plan.name} (ID: ${plan.id}) - ${plan.priceCents / 100} ${plan.currency}`);
      console.log(`      Fonctionnalités: ${plan.features.join(', ')}`);
    });

    // 6. Statistiques finales
    console.log('\n📊 Statistiques:');
    const totalActiveSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    });
    console.log(`   - Abonnements actifs: ${totalActiveSubscriptions}`);
    console.log(`   - Plans disponibles: ${remainingPlans.length}`);
    console.log(`   - Type d'abonnement: ${remainingPlans[0].type}`);

    console.log('\n✅ Nettoyage terminé avec succès!');
    console.log('✨ Il ne reste plus que le plan Premium à 500 MRU/an\n');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldPlans();
