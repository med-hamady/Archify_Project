const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubscriptionData() {
  try {
    console.log('🔍 Checking subscription data...\n');

    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log('👥 Users:');
    users.forEach(user => {
      console.log(`   ${user.name} (${user.email}) - ${user.role}`);
    });

    // Check subscription plans
    const plans = await prisma.subscriptionPlan.findMany({
      select: {
        id: true,
        name: true,
        priceCents: true,
        currency: true,
        interval: true,
        createdAt: true
      }
    });

    console.log('\n📋 Subscription Plans:');
    plans.forEach(plan => {
      console.log(`   ${plan.name} - ${plan.priceCents / 100} ${plan.currency}/${plan.interval}`);
    });

    // Check existing subscriptions
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } }
      }
    });

    console.log('\n💳 Existing Subscriptions:');
    if (subscriptions.length === 0) {
      console.log('   No subscriptions found');
    } else {
      subscriptions.forEach(sub => {
        console.log(`   ${sub.user.name} -> ${sub.plan.name} (${sub.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptionData();
