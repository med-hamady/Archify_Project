const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchHistoTarek() {
  try {
    // Search case-insensitively
    const subjects = await prisma.subject.findMany({
      where: {
        OR: [
          { title: { contains: 'Tarek', mode: 'insensitive' } },
          { title: { contains: 'tarek', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`Found ${subjects.length} subject(s) matching 'Tarek':\n`);
    subjects.forEach(s => {
      console.log(`- ${s.title} (Semester: ${s.semester}, ID: ${s.id})`);
    });

    if (subjects.length === 0) {
      console.log('No subjects found with "Tarek" in the title.');
      console.log('\nLet me create the subject "Histo Tarek" for PCEM1...');

      const newSubject = await prisma.subject.create({
        data: {
          title: 'Histo Tarek',
          semester: 'PCEM1',
          description: 'Histologie - Cours Tarek'
        }
      });

      console.log(`\n✅ Created subject: ${newSubject.title} (ID: ${newSubject.id})`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchHistoTarek();
