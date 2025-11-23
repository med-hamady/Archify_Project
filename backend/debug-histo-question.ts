/**
 * Script de debug : Afficher le format exact d'une question Histologie
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugHistoQuestion() {
  try {
    // Trouver le sujet Histologie
    const histoSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Histologie', mode: 'insensitive' },
        semester: 'PCEM1'
      },
      include: {
        chapters: {
          include: {
            questions: { take: 3 } // Prendre les 3 premières questions
          }
        }
      }
    });

    if (!histoSubject) {
      console.log('❌ Sujet non trouvé');
      return;
    }

    console.log(`\n📚 Sujet : ${histoSubject.title}`);
    console.log(`📖 Chapitres : ${histoSubject.chapters.length}\n`);

    // Afficher les 3 premières questions
    for (const chapter of histoSubject.chapters.slice(0, 2)) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📂 Chapitre : ${chapter.title}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      for (const question of chapter.questions.slice(0, 2)) {
        console.log(`🔍 Question ID: ${question.id}`);
        console.log(`   Text: ${question.questionText.substring(0, 80)}...`);
        console.log(`\n   OPTIONS (format JSON) :`);
        console.log(JSON.stringify(question.options, null, 2));

        // Vérifier le format
        const options = question.options as any[];
        if (options && Array.isArray(options)) {
          console.log(`\n   📊 Analyse du format :`);
          options.forEach((opt, idx) => {
            console.log(`      Option ${idx}:`);
            console.log(`         - Has 'text': ${!!opt.text}`);
            console.log(`         - Has 'answerText': ${!!opt.answerText}`);
            console.log(`         - Has 'justification': ${!!opt.justification}`);
            console.log(`         - isCorrect: ${opt.isCorrect}`);
          });
        }
        console.log('\n');
      }
    }

  } catch (error) {
    console.error('❌ Erreur :', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugHistoQuestion();
