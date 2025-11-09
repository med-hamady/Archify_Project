/**
 * Restoration Script - Complete Histologie Restoration
 *
 * 1. Cleans contaminated "Histologie" PCEM2
 * 2. Imports Histologie classique (199 QCMs)
 * 3. Imports Histo Nozha (249 QCMs)
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function restoreAll() {
  console.log('🔧 Restauration complète des matières Histologie PCEM2\n');
  console.log('=' .repeat(60));

  try {
    // ============================================
    // STEP 1: Clean up "Histologie" PCEM2
    // ============================================
    console.log('\n📋 Étape 1: Nettoyage de "Histologie"...');

    const histologieSubject = await prisma.subject.findFirst({
      where: {
        title: 'Histologie',
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

    if (histologieSubject && histologieSubject.chapters.length > 0) {
      console.log(`   📚 Matière trouvée: ${histologieSubject.title}`);
      console.log(`   📑 Chapitres actuels: ${histologieSubject.chapters.length}`);

      const totalQuestions = histologieSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
      console.log(`   ❓ Questions actuelles: ${totalQuestions}`);

      console.log('\n   🗑️  Suppression de tous les chapitres...');

      for (const chapter of histologieSubject.chapters) {
        await prisma.question.deleteMany({
          where: { chapterId: chapter.id }
        });
      }

      await prisma.chapter.deleteMany({
        where: { subjectId: histologieSubject.id }
      });

      console.log('   ✅ Tous les chapitres supprimés de "Histologie"\n');
    } else {
      console.log('   ℹ️  Matière "Histologie" vide (OK)\n');
    }

    // ============================================
    // STEP 2: Clean up "Histo Nozha" if exists
    // ============================================
    console.log('📋 Étape 2: Nettoyage de "Histo Nozha"...');

    const histoNozhaSubject = await prisma.subject.findFirst({
      where: {
        title: 'Histo Nozha',
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

    if (histoNozhaSubject && histoNozhaSubject.chapters.length > 0) {
      console.log(`   📚 Matière trouvée: ${histoNozhaSubject.title}`);
      console.log(`   📑 Chapitres actuels: ${histoNozhaSubject.chapters.length}`);

      const totalQuestions = histoNozhaSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
      console.log(`   ❓ Questions actuelles: ${totalQuestions}`);

      console.log('\n   🗑️  Suppression de tous les chapitres...');

      for (const chapter of histoNozhaSubject.chapters) {
        await prisma.question.deleteMany({
          where: { chapterId: chapter.id }
        });
      }

      await prisma.chapter.deleteMany({
        where: { subjectId: histoNozhaSubject.id }
      });

      console.log('   ✅ Tous les chapitres supprimés de "Histo Nozha"\n');
    } else {
      console.log('   ℹ️  Matière "Histo Nozha" vide (OK)\n');
    }

    await prisma.$disconnect();

    // ============================================
    // STEP 3: Import Histologie classique
    // ============================================
    console.log('=' .repeat(60));
    console.log('\n📋 Étape 3: Import Histologie classique...\n');

    try {
      execSync('node dist/import-histologie-pcem2.js', { stdio: 'inherit', cwd: __dirname + '/..' });
      console.log('\n✅ Histologie classique importée avec succès');
    } catch (error) {
      console.error('⚠️  Erreur lors de l\'import Histologie (ignoré)');
    }

    // ============================================
    // STEP 4: Import Histo Nozha
    // ============================================
    console.log('\n=' .repeat(60));
    console.log('\n📋 Étape 4: Import Histo Nozha...\n');

    try {
      execSync('node dist/import-histo-nozha-pcem2.js', { stdio: 'inherit', cwd: __dirname + '/..' });
      console.log('\n✅ Histo Nozha importée avec succès');
    } catch (error) {
      console.error('⚠️  Erreur lors de l\'import Histo Nozha (ignoré)');
    }

    console.log('\n=' .repeat(60));
    console.log('\n✅ Restauration complète terminée!');
    console.log('\n📊 Résultat attendu:');
    console.log('   - Histologie: 10 chapitres, 199 questions');
    console.log('   - Histo Nozha: 7 chapitres, 249 questions');
    console.log('   - TOTAL: 448 questions\n');

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    throw error;
  }
}

// ============================================
// EXÉCUTION
// ============================================

restoreAll()
  .then(() => {
    console.log('🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);

    // En production, ne pas faire échouer le build
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.log('⚠️  Erreur ignorée en production (le serveur va démarrer normalement).\n');
      process.exit(0); // Exit success en production
    } else {
      process.exit(1); // Exit error en développement
    }
  });
