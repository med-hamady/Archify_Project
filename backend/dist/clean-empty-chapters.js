"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Script pour supprimer tous les chapitres vides (0 questions)
 * du sujet Anatomie PCEM2
 */
async function cleanEmptyChapters() {
    try {
        console.log('🧹 Nettoyage des chapitres vides d\'Anatomie PCEM2...\n');
        // Trouver le sujet Anatomie PCEM2
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
            console.log('❌ Sujet Anatomie PCEM2 non trouvé');
            await prisma.$disconnect();
            return;
        }
        console.log(`📚 Sujet trouvé: ${anatomieSubject.title}`);
        console.log(`📖 Total de chapitres: ${anatomieSubject.chapters.length}\n`);
        // Filtrer les chapitres vides
        const emptyChapters = anatomieSubject.chapters.filter(ch => ch._count.questions === 0);
        if (emptyChapters.length === 0) {
            console.log('✅ Aucun chapitre vide à supprimer !');
            await prisma.$disconnect();
            return;
        }
        console.log(`🗑️  Chapitres vides trouvés: ${emptyChapters.length}\n`);
        // Afficher les chapitres qui seront supprimés
        console.log('Chapitres à supprimer:');
        emptyChapters.forEach((ch, index) => {
            console.log(`   ${index + 1}. ${ch.title} (${ch._count.questions} questions)`);
        });
        console.log('\n⏳ Suppression en cours...\n');
        // Supprimer chaque chapitre vide
        let deletedCount = 0;
        for (const chapter of emptyChapters) {
            try {
                await prisma.chapter.delete({ where: { id: chapter.id } });
                console.log(`   ✓ Supprimé: ${chapter.title}`);
                deletedCount++;
            }
            catch (error) {
                console.error(`   ✗ Erreur lors de la suppression de "${chapter.title}":`, error.message);
            }
        }
        console.log(`\n✅ ${deletedCount} chapitres vides supprimés avec succès !`);
        // Afficher l'état final
        const updatedSubject = await prisma.subject.findFirst({
            where: { id: anatomieSubject.id },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        console.log(`\n📊 État final:`);
        console.log(`   Chapitres restants: ${updatedSubject?.chapters.length}`);
        const totalQuestions = updatedSubject?.chapters.reduce((sum, ch) => sum + ch._count.questions, 0) || 0;
        console.log(`   Total de questions: ${totalQuestions}`);
        if (updatedSubject && updatedSubject.chapters.length > 0) {
            console.log(`\n📋 Chapitres restants:`);
            updatedSubject.chapters.forEach((ch, index) => {
                console.log(`   ${index + 1}. ${ch.title} (${ch._count.questions} questions)`);
            });
        }
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('❌ Erreur:', error.message);
        await prisma.$disconnect();
        throw error;
    }
}
// Exécuter le script
cleanEmptyChapters();
//# sourceMappingURL=clean-empty-chapters.js.map