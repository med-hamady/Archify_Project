const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseAnatomie() {
  try {
    console.log('🔍 Diagnostic Anatomie PCEM2...\n');

    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          orderBy: { title: 'asc' },
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });

    if (!anatomieSubject) {
      console.log('❌ Anatomie PCEM2 non trouvé');
      return;
    }

    console.log(`📚 Sujet: ${anatomieSubject.title}`);
    console.log(`📊 totalQCM: ${anatomieSubject.totalQCM}`);
    console.log(`📖 Nombre de chapitres: ${anatomieSubject.chapters.length}`);
    console.log('\n📋 Liste des chapitres:\n');

    let totalQuestions = 0;
    anatomieSubject.chapters.forEach((ch, index) => {
      const qCount = ch._count.questions;
      totalQuestions += qCount;
      console.log(`${(index + 1).toString().padStart(2, ' ')}. [${qCount.toString().padStart(3, ' ')} Q] ${ch.title}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL: ${anatomieSubject.chapters.length} chapitres, ${totalQuestions} questions`);
    console.log(`📊 totalQCM dans BDD: ${anatomieSubject.totalQCM}`);
    console.log('='.repeat(60));

    // Vérifier les chapitres manquants attendus
    const expectedChapters = [
      'OSTÉOLOGIE DU CRÂNE',
      'APPAREIL MANDUCATEUR',
      'LES MUSCLES DE LA TÊTE',
      'LES VAISSEAUX DE LA TÊ',
      'LES LYMPHATIQUES DE LA',
      'APPAREIL DE VISION',
      'LES FOSSES NASALES',
      'OREILLE',
      'PHARYNX ET LARYNX',
      'THYROÏDE ET LARYNX SU',
      'LES VOIES NERVEUSES',
      'EMBRYOLOGIE DU SYSTÈM'
    ];

    console.log('\n🔍 Vérification chapitres QCM (1-12):\n');
    expectedChapters.forEach((expected, i) => {
      const found = anatomieSubject.chapters.some(ch => ch.title.includes(expected.substring(0, 15)));
      console.log(`${found ? '✅' : '❌'} Chapitre ${i + 1}: ${expected}`);
    });

    // Compter les questions par type
    const allQuestions = await prisma.question.findMany({
      where: {
        chapter: {
          subjectId: anatomieSubject.id
        }
      },
      include: {
        chapter: {
          select: { title: true }
        }
      }
    });

    console.log(`\n📊 Total questions dans la BDD: ${allQuestions.length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
  }
}

diagnoseAnatomie();
