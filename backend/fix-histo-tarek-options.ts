/**
 * Script de migration : Corriger le format des options dans Histologie Tarek PCEM1
 *
 * Problème : Les questions de "Histologie Tarek" utilisent "answerText" au lieu de "text"
 * Solution : Transformer answerText → text pour toutes les questions de cette matière
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixHistoTarekOptions() {
  try {
    console.log('🔧 Début de la correction des options Histologie Tarek...\n');

    // 1. Trouver le sujet "Histologie Tarek" en PCEM1
    const histoSubject = await prisma.subject.findFirst({
      where: {
        title: {
          contains: 'Histologie',
          mode: 'insensitive'
        },
        semester: 'PCEM1'
      },
      include: {
        chapters: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!histoSubject) {
      console.log('❌ Sujet "Histologie Tarek PCEM1" non trouvé');
      return;
    }

    console.log(`✅ Sujet trouvé : "${histoSubject.title}" (ID: ${histoSubject.id})`);
    console.log(`   Chapitres : ${histoSubject.chapters.length}`);

    let totalQuestions = 0;
    let fixedQuestions = 0;
    let alreadyCorrect = 0;

    // 2. Parcourir tous les chapitres et questions
    for (const chapter of histoSubject.chapters) {
      const questions = chapter.questions;
      totalQuestions += questions.length;

      for (const question of questions) {
        const options = question.options as any[];

        if (!options || !Array.isArray(options)) {
          console.log(`⚠️  Question ${question.id} : options invalides`);
          continue;
        }

        // Vérifier si la question utilise "answerText" au lieu de "text"
        const hasAnswerText = options.some(opt => 'answerText' in opt && !('text' in opt));

        if (hasAnswerText) {
          // Transformer answerText → text
          const fixedOptions = options.map(opt => ({
            text: opt.answerText || opt.text,
            isCorrect: opt.isCorrect,
            isPartial: opt.isPartial || false,
            justification: opt.justification || null
          }));

          // Mettre à jour la question
          await prisma.question.update({
            where: { id: question.id },
            data: { options: fixedOptions }
          });

          fixedQuestions++;
          console.log(`✅ Question ${question.id} corrigée (${fixedOptions.length} options)`);
        } else {
          alreadyCorrect++;
        }
      }
    }

    console.log('\n📊 Résumé de la correction :');
    console.log(`   Total questions : ${totalQuestions}`);
    console.log(`   Questions corrigées : ${fixedQuestions}`);
    console.log(`   Questions déjà correctes : ${alreadyCorrect}`);
    console.log('\n✅ Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixHistoTarekOptions()
  .then(() => {
    console.log('\n🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Échec du script :', error);
    process.exit(1);
  });
