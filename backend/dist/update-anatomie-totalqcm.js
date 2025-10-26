"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Script pour mettre à jour le totalQCM d'Anatomie PCEM2 à 200
 */
async function updateAnatomieTotal() {
    try {
        console.log('🔧 Mise à jour du totalQCM d\'Anatomie PCEM2...\n');
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
        console.log(`   totalQCM actuel: ${anatomieSubject.totalQCM}`);
        // Calculer le vrai nombre de questions
        const actualQuestions = anatomieSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
        console.log(`   Questions réelles dans la DB: ${actualQuestions}\n`);
        if (anatomieSubject.totalQCM === actualQuestions) {
            console.log('✅ Le totalQCM est déjà correct, pas besoin de mise à jour');
            await prisma.$disconnect();
            return;
        }
        // Mettre à jour le totalQCM
        console.log(`🔄 Mise à jour de ${anatomieSubject.totalQCM} → ${actualQuestions}...`);
        const updatedSubject = await prisma.subject.update({
            where: { id: anatomieSubject.id },
            data: { totalQCM: actualQuestions }
        });
        console.log(`✅ totalQCM mis à jour avec succès !`);
        console.log(`   Nouvelle valeur: ${updatedSubject.totalQCM}\n`);
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('❌ Erreur:', error.message);
        await prisma.$disconnect();
        throw error;
    }
}
// Exécuter le script
updateAnatomieTotal();
//# sourceMappingURL=update-anatomie-totalqcm.js.map