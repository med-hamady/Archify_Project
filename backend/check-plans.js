const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany();
    console.log('=== Plans disponibles dans la base de données ===');
    plans.forEach(p => {
      console.log(`\nID: ${p.id}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  Type: ${p.type}`);
      console.log(`  Price: ${p.priceCents / 100} ${p.currency}`);
      console.log(`  Active: ${p.isActive}`);
    });
    console.log(`\nTotal: ${plans.length} plans`);
  } catch (e) {
    console.error('Erreur:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
