const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAnatomie() {
  try {
    console.log('\n📊 Vérification Anatomie PCEM1...\n');

    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM1'
      },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });

    if (!anatomieSubject) {
      console.log('❌ Anatomie PCEM1 non trouvé');
      await prisma.$disconnect();
      return;
    }

    console.log(`📚 Sujet: ${anatomieSubject.title}`);
    console.log(`📖 Total chapitres: ${anatomieSubject.chapters.length}`);
    console.log(`📊 totalQCM: ${anatomieSubject.totalQCM}\n`);

    let totalQuestions = 0;
    console.log('📋 Détail par chapitre:\n');

    anatomieSubject.chapters.forEach((chapter, index) => {
      const questionCount = chapter._count.questions;
      totalQuestions += questionCount;
      console.log(`   ${index + 1}. ${chapter.title}`);
      console.log(`      Questions: ${questionCount}`);
    });

    console.log(`\n📊 TOTAL: ${totalQuestions} questions dans la base\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAnatomie();
