const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPremiumEnum() {
  console.log('🔄 Ajout de PREMIUM à l\'enum SubscriptionType...\n');

  try {
    // Ajouter PREMIUM à l'enum
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'PREMIUM';
    `);

    console.log('✅ PREMIUM ajouté à l\'enum');

    // Mettre à jour tous les plans vers PREMIUM
    console.log('\n🔄 Mise à jour des plans existants...');

    await prisma.$executeRawUnsafe(`
      UPDATE "SubscriptionPlan"
      SET type = 'PREMIUM'::"SubscriptionType"
      WHERE type IN ('VIDEOS_ONLY'::"SubscriptionType", 'DOCUMENTS_ONLY'::"SubscriptionType", 'FULL_ACCESS'::"SubscriptionType");
    `);

    console.log('✅ Plans mis à jour');

    // Vérifier
    const plans = await prisma.$queryRaw`
      SELECT id, name, type FROM "SubscriptionPlan";
    `;

    console.log('\n📋 Plans après migration:');
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: ${plan.type}`);
    });

    console.log('\n✅ Migration terminée!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addPremiumEnum();
