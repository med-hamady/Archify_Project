const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany();
    console.log('Plans actuels dans la base de données:');
    console.log(JSON.stringify(plans, null, 2));

    console.log(`\nNombre total de plans: ${plans.length}`);
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
