import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanNonAdminUsers() {
  try {
    console.log('🔍 [Migration] Vérification des utilisateurs non-admin...');

    // Récupérer tous les utilisateurs
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });

    // Trouver les utilisateurs non-admin
    const nonAdmins = allUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'SUPERADMIN');

    if (nonAdmins.length === 0) {
      console.log('✅ [Migration] Aucun utilisateur non-admin à supprimer.');
      await prisma.$disconnect();
      return;
    }

    console.log(`🗑️  [Migration] ${nonAdmins.length} utilisateurs non-admin à supprimer...`);

    const userIdsToDelete = nonAdmins.map(u => u.id);

    // Supprimer toutes les données liées aux utilisateurs non-admin
    console.log('🔄 [Migration] Suppression des données liées...');

    // Supprimer les progressions de chapitres
    const deletedChapterProgress = await prisma.chapterProgress.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedChapterProgress.count} progressions de chapitres supprimées`);

    // Supprimer les progressions de matières
    const deletedSubjectProgress = await prisma.subjectProgress.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedSubjectProgress.count} progressions de matières supprimées`);

    // Supprimer les tentatives de quiz
    const deletedAttempts = await prisma.quizAttempt.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedAttempts.count} tentatives de quiz supprimées`);

    // Supprimer les résultats d'examen
    const deletedExamResults = await prisma.examResult.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedExamResults.count} résultats d'examen supprimés`);

    // Supprimer les résultats de défis
    const deletedChallengeResults = await prisma.challengeResult.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedChallengeResults.count} résultats de défis supprimés`);

    // Supprimer les abonnements
    const deletedSubscriptions = await prisma.subscription.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedSubscriptions.count} abonnements supprimés`);

    // Supprimer les paiements
    const deletedPayments = await prisma.payment.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedPayments.count} paiements supprimés`);

    // Supprimer les commentaires
    const deletedComments = await prisma.comment.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedComments.count} commentaires supprimés`);

    // Supprimer les tokens de réinitialisation de mot de passe
    const deletedTokens = await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedTokens.count} tokens de réinitialisation supprimés`);

    // Supprimer les badges utilisateur
    const deletedUserBadges = await prisma.userBadge.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`  ✅ ${deletedUserBadges.count} badges utilisateur supprimés`);

    // Enfin, supprimer les utilisateurs non-admin
    console.log('🗑️  [Migration] Suppression des utilisateurs non-admin...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: userIdsToDelete }
      }
    });

    console.log(`✅ [Migration] ${deletedUsers.count} utilisateurs non-admin supprimés avec succès!`);

    // Afficher les utilisateurs restants
    const remainingUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        name: true
      }
    });

    console.log(`👑 [Migration] Utilisateurs restants: ${remainingUsers.length}`);
    remainingUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ [Migration] Erreur lors de la suppression des utilisateurs:', error.message);
    await prisma.$disconnect();
    throw error;
  }
}
