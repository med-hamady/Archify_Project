/**
 * Script pour corriger les questions 9 et 14 du chapitre 2 d'anatomie PCEM1
 *
 * Corrections:
 * - Question 9: La réponse A doit être fausse avec une justification claire
 * - Question 14: La réponse C doit être fausse avec une justification claire
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixQuestion9() {
  try {
    console.log('🔧 Correction des questions 9 et 14 du chapitre 2 anatomie PCEM1...\n');

    // Trouver le chapitre
    const chapter = await prisma.chapter.findFirst({
      where: {
        subject: {
          title: { contains: 'Anatomie', mode: 'insensitive' },
          semester: 'PCEM1'
        },
        title: { contains: 'Articulations du membre supérieur', mode: 'insensitive' }
      },
      include: {
        questions: {
          where: {
            questionText: { contains: 'radio-ulnaire proximale', mode: 'insensitive' }
          }
        }
      }
    });

    if (!chapter || chapter.questions.length === 0) {
      console.error('❌ Question non trouvée');
      return;
    }

    const question = chapter.questions[0];
    console.log(`📝 Question trouvée: ${question.questionText}`);
    console.log(`   Options actuelles:`, JSON.stringify(question.options, null, 2));

    // Corriger les options
    const correctedOptions = [
      {
        text: "Elle unit la tête du radius à l'incisure radiale",
        isCorrect: false,
        justification: "Incomplet : à l'incisure radiale de l'ulna."
      },
      {
        text: "Elle est de type trochoïde",
        isCorrect: true
      },
      {
        text: "Elle permet la pronation-supination",
        isCorrect: true
      },
      {
        text: "Elle est immobile",
        isCorrect: false,
        justification: "Très mobile."
      },
      {
        text: "Elle relie directement l'humérus au radius",
        isCorrect: false,
        justification: "Non."
      }
    ];

    // Mettre à jour la question
    await prisma.question.update({
      where: { id: question.id },
      data: {
        options: correctedOptions as any
      }
    });

    console.log('✅ Question 9 corrigée avec succès!');
    console.log('   Nouvelles options:', JSON.stringify(correctedOptions, null, 2));

    // ========================================
    // Corriger la question 14
    // ========================================
    console.log('\n🔧 Correction de la question 14...\n');

    const question14 = await prisma.question.findFirst({
      where: {
        chapterId: chapter.id,
        questionText: { contains: 'articulations interphalangiennes', mode: 'insensitive' }
      }
    });

    if (!question14) {
      console.error('❌ Question 14 non trouvée');
      return;
    }

    console.log(`📝 Question 14 trouvée: ${question14.questionText}`);
    console.log(`   Options actuelles:`, JSON.stringify(question14.options, null, 2));

    // Corriger les options de la question 14
    const correctedOptions14 = [
      {
        text: "Elles sont de type trochléen",
        isCorrect: true
      },
      {
        text: "Elles permettent flexion-extension",
        isCorrect: true
      },
      {
        text: "Elles autorisent rotation",
        isCorrect: false,
        justification: "Non, rotation bloquée."
      },
      {
        text: "Chaque doigt (sauf le pouce) en possède deux",
        isCorrect: true
      },
      {
        text: "Elles unissent les métacarpiens entre eux",
        isCorrect: false,
        justification: "Non."
      }
    ];

    // Mettre à jour la question 14
    await prisma.question.update({
      where: { id: question14.id },
      data: {
        options: correctedOptions14 as any
      }
    });

    console.log('✅ Question 14 corrigée avec succès!');
    console.log('   Nouvelles options:', JSON.stringify(correctedOptions14, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixQuestion9();
