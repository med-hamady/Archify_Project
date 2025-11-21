const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getHistoTarekSubject() {
  try {
    const subject = await prisma.subject.findFirst({
      where: {
        title: {
          contains: 'Histo Tarek'
        }
      }
    });
    console.log(JSON.stringify(subject, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getHistoTarekSubject();
