const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAnatomieCount() {
  try {
    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM2'
      },
      include: {
        chapters: {
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
    console.log(`📊 totalQCM actuel: ${anatomieSubject.totalQCM}`);
    console.log(`\n📖 Chapitres (${anatomieSubject.chapters.length}):\n`);

    let totalQuestions = 0;
    anatomieSubject.chapters.forEach((ch, index) => {
      const qCount = ch._count.questions;
      totalQuestions += qCount;
      console.log(`${index + 1}. ${ch.title}: ${qCount} questions`);
    });

    console.log(`\n✅ Total réel de questions: ${totalQuestions}`);
    console.log(`📊 totalQCM dans la BDD: ${anatomieSubject.totalQCM}`);
    console.log(`${totalQuestions === anatomieSubject.totalQCM ? '✅' : '❌'} Correspondance: ${totalQuestions === anatomieSubject.totalQCM ? 'OUI' : 'NON'}`);

    if (totalQuestions !== anatomieSubject.totalQCM) {
      console.log(`\n🔧 Correction du totalQCM de ${anatomieSubject.totalQCM} → ${totalQuestions}...`);
      await prisma.subject.update({
        where: { id: anatomieSubject.id },
        data: { totalQCM: totalQuestions }
      });
      console.log('✅ totalQCM corrigé!');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
  }
}

checkAnatomieCount();
