"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function deleteAllUsersExceptAdmin() {
    try {
        console.log('🔍 Recherche de tous les utilisateurs...');
        // Récupérer tous les utilisateurs
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                name: true
            }
        });
        console.log(`\n📊 Total utilisateurs trouvés: ${allUsers.length}`);
        // Afficher tous les utilisateurs
        console.log('\n👥 Liste des utilisateurs:');
        allUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} - ${user.role} (${user.name})`);
        });
        // Trouver les admins
        const admins = allUsers.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN');
        const nonAdmins = allUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'SUPERADMIN');
        console.log(`\n👑 Admins (seront conservés): ${admins.length}`);
        admins.forEach(admin => {
            console.log(`  ✅ ${admin.email} - ${admin.role}`);
        });
        console.log(`\n🗑️  Utilisateurs à supprimer: ${nonAdmins.length}`);
        nonAdmins.forEach(user => {
            console.log(`  ❌ ${user.email} - ${user.role}`);
        });
        if (nonAdmins.length === 0) {
            console.log('\n✅ Aucun utilisateur non-admin à supprimer.');
            await prisma.$disconnect();
            return;
        }
        // Supprimer toutes les données liées aux utilisateurs non-admin
        console.log('\n🔄 Suppression des données liées aux utilisateurs non-admin...');
        const userIdsToDelete = nonAdmins.map(u => u.id);
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
        // Supprimer les badges utilisateur
        const deletedUserBadges = await prisma.userBadge.deleteMany({
            where: { userId: { in: userIdsToDelete } }
        });
        console.log(`  ✅ ${deletedUserBadges.count} badges utilisateur supprimés`);
        // Enfin, supprimer les utilisateurs non-admin
        console.log('\n🗑️  Suppression des utilisateurs non-admin...');
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                id: { in: userIdsToDelete }
            }
        });
        console.log(`\n✅ ${deletedUsers.count} utilisateurs supprimés avec succès!`);
        // Afficher les utilisateurs restants
        const remainingUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                name: true
            }
        });
        console.log(`\n👥 Utilisateurs restants: ${remainingUsers.length}`);
        remainingUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} - ${user.role} (${user.name})`);
        });
        await prisma.$disconnect();
        console.log('\n✅ Opération terminée avec succès!');
    }
    catch (error) {
        console.error('❌ Erreur lors de la suppression des utilisateurs:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}
// Exécuter le script
deleteAllUsersExceptAdmin();
//# sourceMappingURL=delete-all-users-except-admin.js.map