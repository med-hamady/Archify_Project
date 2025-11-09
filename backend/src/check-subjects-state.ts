/**
 * Check current state of Histologie subjects
 * To identify what needs to be restored
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkState() {
  console.log('🔍 Vérification de l\'état des matières Histologie...\n');

  try {
    // Find all histology subjects
    const subjects = await prisma.subject.findMany({
      where: {
        OR: [
          { title: { contains: 'Histo' } },
          { title: 'Histologie' }
        ],
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: { questions: true }
            }
          }
        }
      }
    });

    if (subjects.length === 0) {
      console.log('❌ Aucune matière d\'histologie trouvée pour PCEM2\n');
      return;
    }

    for (const subject of subjects) {
      console.log('═'.repeat(60));
      console.log(`📚 Matière: ${subject.title}`);
      console.log(`   ID: ${subject.id}`);
      console.log(`   Semestre: ${subject.semester}`);
      console.log(`   Chapitres: ${subject.chapters.length}`);

      const totalQuestions = subject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
      console.log(`   Questions: ${totalQuestions}\n`);

      if (subject.chapters.length > 0) {
        console.log('   📑 Liste des chapitres:');
        for (const chapter of subject.chapters) {
          console.log(`      ${chapter.orderIndex}. ${chapter.title} (${chapter._count.questions} questions)`);
        }
        console.log('');
      }
    }

    console.log('═'.repeat(60));
    console.log('\n✅ Vérification terminée\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkState()
  .then(() => {
    console.log('🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
