const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://archify:GU6z0p3RFqI34AAB9n0HhuFAuk1EsHS9@dpg-d3ofreu3jp1c73bv5f20-a.oregon-postgres.render.com/archify';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function createPremiumPlan() {
  try {
    console.log('\n🔍 Checking for existing Premium plan...');

    // Check if Premium plan already exists
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Premium' }
    });

    if (existingPlan) {
      console.log('✅ Premium plan already exists!');
      console.log('   - ID:', existingPlan.id);
      console.log('   - Name:', existingPlan.name);
      console.log('   - Price:', existingPlan.priceCents / 100, existingPlan.currency);
      console.log('   - Type:', existingPlan.type);
      console.log('   - Active:', existingPlan.isActive);
      return;
    }

    console.log('\n📝 Creating Premium plan...');

    // Create Premium plan
    const premiumPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Premium',
        description: 'Accès complet à tous les cours, documents PDF et vidéos pour 1 an',
        type: 'FULL_ACCESS',
        interval: 'yearly',
        priceCents: 200000, // 2000 MRU = 200000 centimes
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

    console.log('\n✅ Premium plan created successfully!');
    console.log('   - ID:', premiumPlan.id);
    console.log('   - Name:', premiumPlan.name);
    console.log('   - Price:', premiumPlan.priceCents / 100, premiumPlan.currency);
    console.log('   - Description:', premiumPlan.description);
    console.log('   - Features:');
    premiumPlan.features.forEach(feature => {
      console.log('     ✓', feature);
    });

    console.log('\n🎉 You can now see the Premium plan on https://archify-project.vercel.app/subscription\n');

  } catch (error) {
    console.error('\n❌ Error creating Premium plan:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPremiumPlan();
