const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function fixAnatomieCompleteFinal() {
  try {
    console.log('🚀 Réimportation COMPLÈTE Anatomie PCEM2...\n');

    // Étape 1: Trouver le sujet
    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM2'
      },
      include: {
        chapters: true
      }
    });

    if (!anatomieSubject) {
      console.log('❌ Sujet Anatomie PCEM2 non trouvé');
      await prisma.$disconnect();
      return;
    }

    console.log(`📚 Sujet trouvé: ${anatomieSubject.title}`);
    console.log(`📖 Chapitres actuels: ${anatomieSubject.chapters.length}\n`);

    // Étape 2: Supprimer TOUS les chapitres et questions
    console.log('🗑️  Suppression complète...');

    for (const chapter of anatomieSubject.chapters) {
      const deletedCount = await prisma.question.deleteMany({
        where: { chapterId: chapter.id }
      });
      console.log(`   ✓ ${chapter.title.substring(0, 40)}: ${deletedCount.count} questions supprimées`);
    }

    const deletedChapters = await prisma.chapter.deleteMany({
      where: { subjectId: anatomieSubject.id }
    });

    console.log(`✅ ${deletedChapters.count} chapitres supprimés\n`);

    // Étape 3: Réimporter les chapitres emoji (13-22) = 200 questions
    console.log('===== IMPORT CHAPITRES EMOJI (13-22) =====\n');
    console.log('Exécution de fix-anatomie-pcem2.js...\n');

    try {
      const stdout1 = execSync('node dist/fix-anatomie-pcem2.js', {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      });
      console.log(stdout1);
    } catch (error) {
      console.error('Erreur lors de l\'import emoji:', error.message);
    }

    // Étape 4: Réimporter les chapitres QCM (1-12) = 170 questions
    console.log('\n===== IMPORT CHAPITRES QCM (1-12) =====\n');
    console.log('Exécution de fix-anatomie-pcem2-qcm-manual.js...\n');

    try {
      const stdout2 = execSync('node dist/fix-anatomie-pcem2-qcm-manual.js', {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      });
      console.log(stdout2);
    } catch (error) {
      console.error('Erreur lors de l\'import QCM:', error.message);
    }

    // Étape 5: Vérification finale
    console.log('\n===== VÉRIFICATION FINALE =====\n');

    const finalSubject = await prisma.subject.findFirst({
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

    if (finalSubject) {
      const totalQuestions = finalSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);

      console.log(`📊 Résultat final:`);
      console.log(`   Chapitres: ${finalSubject.chapters.length}`);
      console.log(`   Questions: ${totalQuestions}`);
      console.log(`   totalQCM: ${finalSubject.totalQCM}\n`);

      if (finalSubject.chapters.length === 22 && totalQuestions === 370) {
        console.log('✅ SUCCÈS! 22 chapitres et 370 questions importés correctement!\n');
      } else {
        console.log(`⚠️  ATTENTION: Résultats inattendus`);
        console.log(`   Attendu: 22 chapitres, 370 questions`);
        console.log(`   Obtenu: ${finalSubject.chapters.length} chapitres, ${totalQuestions} questions\n`);
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
    throw error;
  }
}

fixAnatomieCompleteFinal();
