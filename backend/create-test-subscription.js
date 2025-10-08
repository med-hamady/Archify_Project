const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSubscription() {
  try {
    console.log('🧪 Creating test subscription...');

    // First, get a user (assuming there's at least one user)
    const user = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    });

    if (!user) {
      console.log('❌ No student user found. Please create a user first.');
      return;
    }

    console.log('👤 Found user:', user.name, user.email);

    // Get a subscription plan
    const plan = await prisma.subscriptionPlan.findFirst();

    if (!plan) {
      console.log('❌ No subscription plan found. Please create a plan first.');
      return;
    }

    console.log('📋 Found plan:', plan.name);

    // Create a test subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      include: {
        user: true,
        plan: true
      }
    });

    console.log('✅ Test subscription created successfully!');
    console.log('📊 Subscription details:');
    console.log('   User:', subscription.user.name, subscription.user.email);
    console.log('   Plan:', subscription.plan.name);
    console.log('   Status:', subscription.status);
    console.log('   Start:', subscription.startAt);
    console.log('   End:', subscription.endAt);

  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSubscription();
