const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getPCEM1Subjects() {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        semester: 'pcem1'
      },
      orderBy: {
        title: 'asc'
      }
    });
    console.log('PCEM1 Subjects:');
    subjects.forEach(s => {
      console.log(`- ${s.title} (ID: ${s.id})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getPCEM1Subjects();
