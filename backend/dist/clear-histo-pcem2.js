"use strict";
/**
 * Clear Histo Nozha PCEM2 data before re-import
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function clearData() {
    console.log('🧹 Nettoyage des données Histologie PCEM2...\n');
    try {
        // Find the subject
        const subject = await prisma.subject.findFirst({
            where: {
                title: 'Histologie',
                semester: 'PCEM2'
            },
            include: {
                chapters: {
                    include: {
                        questions: true
                    }
                }
            }
        });
        if (!subject) {
            console.log('❌ Matière Histologie PCEM2 non trouvée');
            return;
        }
        console.log(`📚 Matière trouvée: ${subject.title}`);
        console.log(`📑 Chapitres: ${subject.chapters.length}`);
        const totalQuestions = subject.chapters.reduce((sum, ch) => sum + ch.questions.length, 0);
        console.log(`❓ Questions: ${totalQuestions}\n`);
        // Delete questions first (cascade should handle this but being explicit)
        for (const chapter of subject.chapters) {
            await prisma.question.deleteMany({
                where: { chapterId: chapter.id }
            });
            console.log(`   ✅ Questions supprimées du chapitre: ${chapter.title}`);
        }
        // Delete chapters
        await prisma.chapter.deleteMany({
            where: { subjectId: subject.id }
        });
        console.log(`✅ Tous les chapitres supprimés\n`);
        console.log('✅ Nettoyage terminé!');
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
clearData()
    .then(() => {
    console.log('\n🎉 Script terminé');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
});
//# sourceMappingURL=clear-histo-pcem2.js.map