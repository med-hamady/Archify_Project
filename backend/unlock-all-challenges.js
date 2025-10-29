/**
 * Script pour débloquer le mode Challenge pour tous les chapitres de tous les utilisateurs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlockAllChallenges() {
  try {
    console.log('🔓 Déblocage du mode Challenge pour tous les utilisateurs...\n');

    // Mettre à jour tous les ChapterProgress pour débloquer Challenge
    const result = await prisma.chapterProgress.updateMany({
      where: {
        challengeUnlocked: false
      },
      data: {
        challengeUnlocked: true
      }
    });

    console.log(`✅ ${result.count} progressions de chapitres débloquées pour le mode Challenge`);

    // Optionnel: Débloquer aussi le challenge global pour tous les utilisateurs
    const subjectResult = await prisma.subjectProgress.updateMany({
      where: {
        challengeUnlockedGlobal: false
      },
      data: {
        challengeUnlockedGlobal: true
      }
    });

    console.log(`✅ ${subjectResult.count} progressions de matières débloquées globalement`);

    console.log('\n✨ Tous les challenges sont maintenant débloqués!');

  } catch (error) {
    console.error('❌ Erreur lors du déblocage des challenges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

unlockAllChallenges();
