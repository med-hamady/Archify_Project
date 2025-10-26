const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Vérifier TOUTES les matières pour trouver celles avec des chapitres vides
    const allSubjects = await prisma.subject.findMany({
      include: {
        chapters: {
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });

    console.log('\n📊 Vérification de toutes les matières...\n');

    allSubjects.forEach(subject => {
      const emptyChapters = subject.chapters.filter(ch => ch._count.questions === 0);
      const totalQuestions = subject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);

      console.log(`📚 ${subject.title} (${subject.semester})`);
      console.log(`   Chapitres: ${subject.chapters.length}`);
      console.log(`   Chapitres vides: ${emptyChapters.length}`);
      console.log(`   Questions réelles: ${totalQuestions}`);
      console.log(`   totalQCM: ${subject.totalQCM}`);

      if (emptyChapters.length > 0 || totalQuestions !== subject.totalQCM) {
        console.log(`   ⚠️  PROBLÈME DÉTECTÉ!`);
      }
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
