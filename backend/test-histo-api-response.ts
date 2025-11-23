/**
 * Test : Simuler la réponse API pour une question Histologie Tarek
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHistoAPIResponse() {
  try {
    console.log('🧪 Test de la réponse API pour Histologie Tarek\n');

    // 1. Trouver une question de Histologie
    const histoSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Histologie', mode: 'insensitive' },
        semester: 'PCEM1'
      },
      include: {
        chapters: {
          take: 1,
          include: {
            questions: { take: 3 }
          }
        }
      }
    });

    if (!histoSubject || !histoSubject.chapters[0]?.questions[0]) {
      console.log('❌ Aucune question trouvée');
      return;
    }

    const question = histoSubject.chapters[0].questions[0];
    console.log(`📝 Question : ${question.questionText.substring(0, 80)}...`);
    console.log(`📍 ID : ${question.id}\n`);

    // 2. Simuler le mapping fait par le backend (ligne 257-263 de quiz.ts)
    const options = question.options as any[];

    console.log('🔍 OPTIONS RAW (depuis la DB) :');
    console.log(JSON.stringify(options, null, 2));

    console.log('\n📤 OPTIONS TRANSFORMÉES (ce que l\'API renverrait) :');

    // Simuler une réponse utilisateur (indices 0 et 2)
    const selectedAnswers = [0, 2];

    const optionsWithFeedback = options.map((opt: any, index: number) => ({
      text: opt.text,
      isCorrect: opt.isCorrect,
      isPartial: opt.isPartial || false,
      justification: opt.justification || undefined,
      wasSelected: selectedAnswers.includes(index)
    }));

    console.log(JSON.stringify(optionsWithFeedback, null, 2));

    // 3. Analyse
    console.log('\n📊 ANALYSE :');
    optionsWithFeedback.forEach((opt, idx) => {
      console.log(`\nOption ${idx} (${['A','B','C','D','E'][idx]}) :`);
      console.log(`  - text: ${opt.text ? '✅ OK' : '❌ UNDEFINED'}`);
      console.log(`  - isCorrect: ${opt.isCorrect}`);
      console.log(`  - isPartial: ${opt.isPartial}`);
      console.log(`  - justification: ${opt.justification ? `✅ "${opt.justification}"` : '❌ none'}`);
      console.log(`  - wasSelected: ${opt.wasSelected}`);
      console.log(`  - Devrait afficher justification? ${!opt.isCorrect && opt.justification ? '✅ OUI' : '❌ NON'}`);
    });

  } catch (error) {
    console.error('❌ Erreur :', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHistoAPIResponse();
