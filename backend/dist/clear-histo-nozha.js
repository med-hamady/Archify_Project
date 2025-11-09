"use strict";
/**
 * Clear Histo Nozha data
 * Supprime toutes les données Histo Nozha existantes avant réimport
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function clearHistoNozha() {
    console.log('🗑️  Nettoyage de Histo Nozha...\n');
    try {
        // Trouver le sujet Histo Nozha
        const subject = await prisma.subject.findFirst({
            where: {
                title: 'Histo Nozha',
                semester: 'PCEM2'
            },
            include: {
                chapters: {
                    include: {
                        subchapters: true,
                        questions: true
                    }
                }
            }
        });
        if (!subject) {
            console.log('❌ Sujet "Histo Nozha" non trouvé');
            return;
        }
        console.log(`📚 Sujet trouvé: ${subject.title}`);
        console.log(`   Chapitres: ${subject.chapters.length}`);
        // Compter les sous-chapitres et questions
        let totalSubchapters = 0;
        let totalQuestions = 0;
        for (const chapter of subject.chapters) {
            totalSubchapters += chapter.subchapters.length;
            totalQuestions += chapter.questions.length;
        }
        console.log(`   Sous-chapitres: ${totalSubchapters}`);
        console.log(`   Questions: ${totalQuestions}\n`);
        // Supprimer les questions (cascade supprimera les tentatives)
        console.log('🗑️  Suppression des questions...');
        for (const chapter of subject.chapters) {
            const deleted = await prisma.question.deleteMany({
                where: { chapterId: chapter.id }
            });
            console.log(`   ✅ ${deleted.count} questions supprimées du chapitre "${chapter.title}"`);
        }
        // Supprimer les sous-chapitres
        console.log('\n🗑️  Suppression des sous-chapitres...');
        for (const chapter of subject.chapters) {
            const deleted = await prisma.subchapter.deleteMany({
                where: { chapterId: chapter.id }
            });
            if (deleted.count > 0) {
                console.log(`   ✅ ${deleted.count} sous-chapitres supprimés du chapitre "${chapter.title}"`);
            }
        }
        // Supprimer les chapitres
        console.log('\n🗑️  Suppression des chapitres...');
        const deletedChapters = await prisma.chapter.deleteMany({
            where: { subjectId: subject.id }
        });
        console.log(`   ✅ ${deletedChapters.count} chapitres supprimés`);
        // Supprimer le sujet
        console.log('\n🗑️  Suppression du sujet...');
        await prisma.subject.delete({
            where: { id: subject.id }
        });
        console.log(`   ✅ Sujet supprimé`);
        console.log('\n✅ Nettoyage terminé!');
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
clearHistoNozha()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=clear-histo-nozha.js.map