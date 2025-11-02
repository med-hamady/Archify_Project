"use strict";
/**
 * Script pour corriger la question 9 du chapitre 2 d'anatomie PCEM1
 *
 * Correction: La réponse A doit être fausse avec une justification claire
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixQuestion9() {
    try {
        console.log('🔧 Correction de la question 9 du chapitre 2 anatomie PCEM1...\n');
        // Trouver le chapitre
        const chapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: { contains: 'Anatomie', mode: 'insensitive' },
                    semester: 'PCEM1'
                },
                title: { contains: 'Articulations du membre supérieur', mode: 'insensitive' }
            },
            include: {
                questions: {
                    where: {
                        questionText: { contains: 'radio-ulnaire proximale', mode: 'insensitive' }
                    }
                }
            }
        });
        if (!chapter || chapter.questions.length === 0) {
            console.error('❌ Question non trouvée');
            return;
        }
        const question = chapter.questions[0];
        console.log(`📝 Question trouvée: ${question.questionText}`);
        console.log(`   Options actuelles:`, JSON.stringify(question.options, null, 2));
        // Corriger les options
        const correctedOptions = [
            {
                text: "Elle unit la tête du radius à l'incisure radiale",
                isCorrect: false,
                justification: "Incomplet : à l'incisure radiale de l'ulna."
            },
            {
                text: "Elle est de type trochoïde",
                isCorrect: true
            },
            {
                text: "Elle permet la pronation-supination",
                isCorrect: true
            },
            {
                text: "Elle est immobile",
                isCorrect: false,
                justification: "Très mobile."
            },
            {
                text: "Elle relie directement l'humérus au radius",
                isCorrect: false,
                justification: "Non."
            }
        ];
        // Mettre à jour la question
        await prisma.question.update({
            where: { id: question.id },
            data: {
                options: correctedOptions
            }
        });
        console.log('✅ Question corrigée avec succès!');
        console.log('   Nouvelles options:', JSON.stringify(correctedOptions, null, 2));
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixQuestion9();
//# sourceMappingURL=fix-question-9.js.map