import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixQuestion5Chapter1() {
  try {
    console.log('🔄 Correction de la question 5 du chapitre 1 - Anatomie PCEM1...');

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

    // Trouver la question 5
    const questions = await prisma.question.findMany({
      where: {
        chapterId: chapter1.id
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    const question5 = questions[4]; // Index 4 = question 5

    console.log('✅ Question 5 trouvée:', question5.id);
    console.log('📝 Texte actuel:', question5.questionText);

    // Mise à jour de la question 5 avec les bonnes réponses
    const newQuestionText = 'Concernant l\'ulna (cubitus).';
    const newOptions = [
      {
        text: 'Il est latéral dans l\'avant-bras',
        isCorrect: false,
        justification: 'Médial.'
      },
      {
        text: 'Il présente une incisure trochléaire',
        isCorrect: true,
        justification: null
      },
      {
        text: 'Il forme la saillie du coude (olécrâne)',
        isCorrect: true,
        justification: null
      },
      {
        text: 'Il ne s\'articule pas avec le radius',
        isCorrect: false,
        justification: 'Il s\'y articule aux deux extrémités.'
      },
      {
        text: 'Il participe à l\'articulation du poignet',
        isCorrect: false,
        justification: 'Il ne participe pas directement au poignet, car il est séparé du carpe par un disque articulaire.'
      }
    ];
    const newExplanation = 'L\'ulna est un os médial stabilisateur, essentiel au coude et au poignet.';

    console.log('\n📋 NOUVELLES OPTIONS:');
    newOptions.forEach((opt, idx) => {
      console.log(`${String.fromCharCode(65 + idx)}. ${opt.text} - ${opt.isCorrect ? '✅ VRAI' : '❌ FAUX'}`);
      if (opt.justification) {
        console.log(`   Justification: ${opt.justification}`);
      }
    });

    // Mettre à jour la question
    const updatedQuestion = await prisma.question.update({
      where: { id: question5.id },
      data: {
        questionText: newQuestionText,
        options: newOptions,
        explanation: newExplanation
      }
    });

    console.log('\n✅ Question 5 corrigée avec succès!');
    console.log('📝 Nouveau texte:', updatedQuestion.questionText);
    console.log('💬 Nouvelle explication:', updatedQuestion.explanation);

    // Vérification
    const verifyQuestion = await prisma.question.findUnique({
      where: { id: question5.id }
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

fixQuestion5Chapter1();
