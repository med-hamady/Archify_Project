// Script to check study time for a user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudyTime() {
  try {
    console.log('🔍 Connecting to database...\n');

    // Get all users with their study time
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        totalStudyTimeSeconds: true,
        sessionStartTime: true,
        lastXpRewardTime: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📊 Found ${users.length} users\n`);
    console.log('═'.repeat(80));

    users.forEach((user, index) => {
      const hours = Math.floor((user.totalStudyTimeSeconds || 0) / 3600);
      const minutes = Math.floor(((user.totalStudyTimeSeconds || 0) % 3600) / 60);
      const seconds = (user.totalStudyTimeSeconds || 0) % 60;

      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Total Study Time: ${hours}h ${minutes}m ${seconds}s (${user.totalStudyTimeSeconds || 0} seconds)`);
      console.log(`   Session Active: ${user.sessionStartTime ? 'Yes' : 'No'}`);
      if (user.sessionStartTime) {
        console.log(`   Session Started: ${user.sessionStartTime}`);
      }
      console.log('─'.repeat(80));
    });

    console.log('\n✅ Check complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudyTime();
