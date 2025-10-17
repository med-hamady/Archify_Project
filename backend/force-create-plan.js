const { PrismaClient } = require('@prisma/client');

// FORCE production database URL
const DATABASE_URL = 'postgresql://archify:GU6z0p3RFqI34AAB9n0HhuFAuk1EsHS9@dpg-d3ofreu3jp1c73bv5f20-a.oregon-postgres.render.com/archify';

console.log('\n📡 Connecting to database...');
console.log('   URL:', DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function createPlan() {
  try {
    // First, list ALL plans
    console.log('\n🔍 Listing ALL existing plans:');
    const allPlans = await prisma.subscriptionPlan.findMany();
    console.log(`   Found ${allPlans.length} plan(s) total`);
    allPlans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.id}): ${plan.priceCents/100} ${plan.currency}, active: ${plan.isActive}`);
    });

    // Delete old plans to start fresh
    if (allPlans.length > 0) {
      console.log('\n🗑️  Deleting old plans...');
      await prisma.subscriptionPlan.deleteMany({});
      console.log('   ✅ Old plans deleted');
    }

    // Create new Premium plan
    console.log('\n✨ Creating Premium plan...');
    const plan = await prisma.subscriptionPlan.create({
      data: {
        id: 'premium-2025',
        name: 'Premium',
        description: 'Accès complet à tous les cours, documents PDF et vidéos pour 1 an',
        type: 'FULL_ACCESS',
        interval: 'yearly',
        priceCents: 50000, // 500 MRU
        currency: 'MRU',
        isActive: true,
        features: [
          'Accès illimité à tous les cours vidéo',
          'Téléchargement de tous les documents PDF',
          'Accès à tous les supports de cours',
          'Mises à jour gratuites du contenu',
          'Support prioritaire par email',
          'Valable pour 1 an complet'
        ]
      }
    });

    console.log('\n🎉 SUCCESS! Premium plan created:');
    console.log('   - ID:', plan.id);
    console.log('   - Name:', plan.name);
    console.log('   - Price:', plan.priceCents / 100, plan.currency);
    console.log('   - Type:', plan.type);
    console.log('   - Active:', plan.isActive);
    console.log('   - Features:', plan.features.length, 'items');

    // Verify it was created
    console.log('\n✅ Verifying plan exists...');
    const verify = await prisma.subscriptionPlan.findMany({ where: { isActive: true } });
    console.log(`   Found ${verify.length} active plan(s)`);

    console.log('\n🌐 The plan should now appear on: https://archify-project.vercel.app/subscription\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPlan();
