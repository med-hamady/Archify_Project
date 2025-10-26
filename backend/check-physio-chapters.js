const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhysioChapters() {
  try {
    console.log('\n📊 Vérification des chapitres Physiologie PCEM1...\n');

    const physioSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Physiologie', mode: 'insensitive' },
        semester: 'PCEM1'
      },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });

    if (!physioSubject) {
      console.log('❌ Sujet Physiologie PCEM1 non trouvé');
      await prisma.$disconnect();
      return;
    }

    console.log(`📚 Sujet: ${physioSubject.title}`);
    console.log(`📖 Total chapitres: ${physioSubject.chapters.length}`);
    console.log(`📊 totalQCM: ${physioSubject.totalQCM}\n`);

    let totalQuestionsInDB = 0;

    console.log('📋 Détail par chapitre:\n');

    const expectedCounts = {
      'Chapitre 1 : Physiologie du milieu intérieur (30 QCM)': 30,
      'Chapitre 2 : Physiologie cellulaire et membranaire (1 → 40)': 40,
      'Chapitre 3 : Physiologie du système nerveux (1 → 20)': 20,
      'Chapitre 4 : Physiologie musculaire (1 → 20)': 20,
      'Chapitre 5 : Physiologie de la thermorégulation (1 → 20)': 20,
      'Chapitre 6 : Physiologie du métabolisme et de la nutrition (version finale mélangée)': 20
    };

    physioSubject.chapters.forEach((chapter, index) => {
      const questionCount = chapter._count.questions;
      totalQuestionsInDB += questionCount;

      const expected = expectedCounts[chapter.title] || '?';
      const status = questionCount === expected ? '✅' : '⚠️';

      console.log(`${status} ${chapter.title}`);
      console.log(`   Questions en DB: ${questionCount}`);
      console.log(`   Questions attendues: ${expected}`);
      if (questionCount !== expected) {
        console.log(`   ❌ DIFFÉRENCE: ${questionCount - expected}`);
      }
      console.log('');
    });

    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   Total questions en DB: ${totalQuestionsInDB}`);
    console.log(`   Total attendu: 150`);
    console.log(`   Différence: ${totalQuestionsInDB - 150}\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkPhysioChapters();
