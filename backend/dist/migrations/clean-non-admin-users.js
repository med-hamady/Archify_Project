"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanNonAdminUsers = cleanNonAdminUsers;
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
async function cleanNonAdminUsers() {
    try {
        // Vérifier si la migration a déjà été exécutée
        const migrationFlagPath = path.join(__dirname, '../../.migration-clean-users-done');
        if (fs.existsSync(migrationFlagPath)) {
            console.log('✅ [Migration] Nettoyage des utilisateurs non-admin déjà effectué (flag trouvé)');
            await prisma.$disconnect();
            return;
        }
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
        // Créer le fichier flag pour indiquer que la migration a été exécutée
        fs.writeFileSync(migrationFlagPath, new Date().toISOString());
        console.log('✅ [Migration] Flag de migration créé - cette opération ne sera plus exécutée');
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('❌ [Migration] Erreur lors de la suppression des utilisateurs:', error.message);
        await prisma.$disconnect();
        throw error;
    }
}
//# sourceMappingURL=clean-non-admin-users.js.map