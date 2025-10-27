const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhysio() {
  try {
    console.log('\n📊 Vérification Physiologie PCEM2...\n');

    const physioSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Physiologie', mode: 'insensitive' },
        semester: 'PCEM2'
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

    if (!physioSubject) {
      console.log('❌ Physiologie PCEM2 non trouvé');
      await prisma.$disconnect();
      return;
    }

    console.log(`📚 Sujet: ${physioSubject.title}`);
    console.log(`📖 Total chapitres: ${physioSubject.chapters.length}`);
    console.log(`📊 totalQCM: ${physioSubject.totalQCM}\n`);

    let totalQuestions = 0;
    console.log('📋 Détail par chapitre:\n');

    physioSubject.chapters.forEach((chapter, index) => {
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

checkPhysio();
