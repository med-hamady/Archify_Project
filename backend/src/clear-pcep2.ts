/**
 * Script de nettoyage PCEP2
 *
 * Supprime toutes les matières et QCM du niveau PCEP2
 * Utile pour réimporter les données depuis zéro
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPCEP2() {
  console.log('🧹 Starting PCEP2 cleanup...\n');

  try {
    // Récupérer toutes les matières PCEP2
    const subjects = await prisma.subject.findMany({
      where: {
        semester: 'PCEP2'
      },
      include: {
        chapters: {
          include: {
            questions: true
          }
        }
      }
    });

    if (subjects.length === 0) {
      console.log('ℹ️  No PCEP2 subjects found. Nothing to clean.');
      return;
    }

    console.log(`📋 Found ${subjects.length} PCEP2 subjects to delete:\n`);

    let totalQuestionsDeleted = 0;
    let totalChaptersDeleted = 0;

    for (const subject of subjects) {
      console.log(`📚 Subject: ${subject.title}`);
      console.log(`   Chapters: ${subject.chapters.length}`);

      let subjectQuestionCount = 0;
      for (const chapter of subject.chapters) {
        subjectQuestionCount += chapter.questions.length;
      }

      console.log(`   Questions: ${subjectQuestionCount}\n`);

      // Supprimer toutes les questions de tous les chapitres
      for (const chapter of subject.chapters) {
        if (chapter.questions.length > 0) {
          await prisma.question.deleteMany({
            where: {
              chapterId: chapter.id
            }
          });
          totalQuestionsDeleted += chapter.questions.length;
        }
      }

      // Supprimer tous les chapitres
      if (subject.chapters.length > 0) {
        await prisma.chapter.deleteMany({
          where: {
            subjectId: subject.id
          }
        });
        totalChaptersDeleted += subject.chapters.length;
      }

      // Supprimer la matière
      await prisma.subject.delete({
        where: {
          id: subject.id
        }
      });

      console.log(`   ✅ Deleted subject: ${subject.title}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Cleanup complete!');
    console.log('='.repeat(50));
    console.log(`📊 Statistics:`);
    console.log(`   - Subjects deleted: ${subjects.length}`);
    console.log(`   - Chapters deleted: ${totalChaptersDeleted}`);
    console.log(`   - Questions deleted: ${totalQuestionsDeleted}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Exécution
clearPCEP2()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
