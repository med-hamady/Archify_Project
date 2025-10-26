const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findMany({
  select: {
    email: true,
    name: true,
    semester: true
  }
}).then(users => {
  console.log('=== UTILISATEURS ===');
  console.log('Total:', users.length, '\n');

  users.forEach(u => {
    console.log(`${u.name} (${u.email}) - semester: "${u.semester}"`);
  });

  return prisma.$disconnect();
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
