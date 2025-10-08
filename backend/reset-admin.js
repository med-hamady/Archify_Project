// Script to reset admin accounts and allow new superadmin creation
// Run with: node reset-admin.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAdmins() {
  try {
    console.log('🔄 Resetting admin accounts...');
    
    // Delete all admin users
    const result = await prisma.user.deleteMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPERADMIN']
        }
      }
    });

    console.log(`✅ Deleted ${result.count} admin account(s)`);
    console.log('🎉 You can now create a new superadmin at /admin-init');
    
  } catch (error) {
    console.error('❌ Error resetting admin accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmins();
