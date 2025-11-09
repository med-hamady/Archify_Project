/**
 * Check for partial answers in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPartialAnswers() {
  console.log('🔍 Recherche de réponses partielles...\n');

  try {
    // Check Histo Nozha for partial answers
    const histoNozhaChapters = await prisma.chapter.findMany({
      where: {
        subject: {
          title: 'Histo Nozha',
          semester: 'PCEM2'
        }
      },
      include: {
        questions: true
      }
    });

    console.log('📚 Histo Nozha:');
    let partialFound = 0;
    for (const chapter of histoNozhaChapters) {
      for (const question of chapter.questions) {
        const options = question.options as any[];
        const partialOptions = options.filter(opt => opt.isPartial === true);
        if (partialOptions.length > 0) {
          partialFound++;
          console.log(`\n  ✅ Question avec réponse partielle trouvée:`);
          console.log(`     Question: ${question.questionText.substring(0, 60)}...`);
          console.log(`     Options partielles:`);
          partialOptions.forEach(opt => {
            console.log(`       - ${opt.text.substring(0, 50)}...`);
            console.log(`         Justification: ${opt.justification || 'N/A'}`);
          });
        }
      }
    }
    console.log(`\n  Total: ${partialFound} questions avec réponses partielles\n`);

    // Check Histologie for partial answers
    const histologieChapters = await prisma.chapter.findMany({
      where: {
        subject: {
          title: 'Histologie',
          semester: 'PCEM2'
        }
      },
      include: {
        questions: true
      }
    });

    console.log('📚 Histologie:');
    partialFound = 0;
    for (const chapter of histologieChapters) {
      for (const question of chapter.questions) {
        const options = question.options as any[];
        const partialOptions = options.filter(opt => opt.isPartial === true);
        if (partialOptions.length > 0) {
          partialFound++;
          console.log(`\n  ✅ Question avec réponse partielle trouvée:`);
          console.log(`     Question: ${question.questionText.substring(0, 60)}...`);
          console.log(`     Options partielles:`);
          partialOptions.forEach(opt => {
            console.log(`       - ${opt.text.substring(0, 50)}...`);
            console.log(`         Justification: ${opt.justification || 'N/A'}`);
          });
        }
      }
    }
    console.log(`\n  Total: ${partialFound} questions avec réponses partielles\n`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkPartialAnswers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
