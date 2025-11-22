const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check all subjects (not just PCEM2)
  const subjects = await prisma.subject.findMany({
    where: {
      title: { contains: 'Ali Ghorbel', mode: 'insensitive' }
    },
    select: { id: true, title: true, semester: true, totalQCM: true }
  });
  console.log('Anatomie Ali Ghorbel:');
  console.log(JSON.stringify(subjects, null, 2));
}

main().finally(() => prisma.$disconnect());
