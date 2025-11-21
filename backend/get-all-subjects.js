const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: {
        semester: 'asc'
      }
    });
    console.log(`Total subjects: ${subjects.length}\n`);
    subjects.forEach(s => {
      console.log(`- ${s.title} (Semester: ${s.semester}, ID: ${s.id})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllSubjects();
