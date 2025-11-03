import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixQuestion6Chapter1() {
  try {
    console.log('🔄 Correction définitive de la question 6 du chapitre 1 - Anatomie PCEM1...');

    // Trouver le sujet Anatomie PCEM1
    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM1'
      }
    });

    if (!anatomieSubject) {
      console.error('❌ Sujet Anatomie PCEM1 non trouvé');
      return;
    }

    // Trouver le chapitre 1
    const chapter1 = await prisma.chapter.findFirst({
      where: {
        subjectId: anatomieSubject.id,
        title: { contains: 'Chapitre 1', mode: 'insensitive' }
      }
    });

    if (!chapter1) {
      console.error('❌ Chapitre 1 non trouvé');
      return;
    }

    // Trouver la question 6
    const questions = await prisma.question.findMany({
      where: {
        chapterId: chapter1.id
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    const question6 = questions[5]; // Index 5 = question 6

    console.log('✅ Question 6 trouvée:', question6.id);
    console.log('📝 Texte actuel:', question6.questionText);

    // Mise à jour de la question 6 avec les bonnes réponses
    const newQuestionText = 'À propos du squelette de la main.';
    const newOptions = [
      {
        text: 'Il comprend 8 os du carpe',
        isCorrect: true,
        justification: null
      },
      {
        text: 'Il comprend 5 métacarpiens',
        isCorrect: true,
        justification: null
      },
      {
        text: 'Il comprend 14 phalanges',
        isCorrect: true,
        justification: null
      },
      {
        text: 'Il comprend 12 phalanges',
        isCorrect: false,
        justification: 'Il y en a 14.'
      },
      {
        text: 'Il n\'a aucun os irrégulier',
        isCorrect: true,
        justification: null
      }
    ];
    const newExplanation = 'La main est constituée du carpe, du métacarpe et des phalanges.';

    console.log('\n📋 NOUVELLES OPTIONS (CORRIGÉES):');
    newOptions.forEach((opt, idx) => {
      console.log(`${String.fromCharCode(65 + idx)}. ${opt.text} - ${opt.isCorrect ? '✅ VRAI' : '❌ FAUX'}`);
      if (opt.justification) {
        console.log(`   Justification: ${opt.justification}`);
      }
    });

    // Mettre à jour la question
    const updatedQuestion = await prisma.question.update({
      where: { id: question6.id },
      data: {
        questionText: newQuestionText,
        options: newOptions,
        explanation: newExplanation
      }
    });

    console.log('\n✅ Question 6 corrigée avec succès!');
    console.log('📝 Nouveau texte:', updatedQuestion.questionText);
    console.log('💬 Nouvelle explication:', updatedQuestion.explanation);

    // Vérification
    const verifyQuestion = await prisma.question.findUnique({
      where: { id: question6.id }
    });

    console.log('\n🔍 VÉRIFICATION:');
    const opts = verifyQuestion?.options as any[];
    opts?.forEach((opt, idx) => {
      console.log(`${String.fromCharCode(65 + idx)}. ${opt.text} - ${opt.isCorrect ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixQuestion6Chapter1();
