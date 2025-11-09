"use strict";
/**
 * Debug script to check question structure in database
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function debugQuestions() {
    console.log('🔍 Vérification de la structure des questions...\n');
    try {
        // Check Histo Nozha questions
        const histoNozhaChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Histo Nozha',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: {
                    take: 3,
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
        if (histoNozhaChapter && histoNozhaChapter.questions.length > 0) {
            console.log('📚 Histo Nozha - Première question complète:\n');
            const firstQuestion = histoNozhaChapter.questions[0];
            console.log('Question ID:', firstQuestion.id);
            console.log('Question Text:', firstQuestion.questionText);
            console.log('Number of options:', Array.isArray(firstQuestion.options) ? firstQuestion.options.length : 'NOT AN ARRAY');
            console.log('Options type:', typeof firstQuestion.options);
            console.log('\nOptions détaillées:');
            console.log(JSON.stringify(firstQuestion.options, null, 2));
            console.log('\n---\n');
        }
        // Check Histologie questions
        const histologieChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Histologie',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: {
                    take: 3,
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
        if (histologieChapter && histologieChapter.questions.length > 0) {
            console.log('📚 Histologie - Première question complète:\n');
            const firstQuestion = histologieChapter.questions[0];
            console.log('Question ID:', firstQuestion.id);
            console.log('Question Text:', firstQuestion.questionText);
            console.log('Number of options:', Array.isArray(firstQuestion.options) ? firstQuestion.options.length : 'NOT AN ARRAY');
            console.log('Options type:', typeof firstQuestion.options);
            console.log('\nOptions détaillées:');
            console.log(JSON.stringify(firstQuestion.options, null, 2));
            console.log('\n---\n');
        }
        // Check Anatomie for comparison
        const anatomieChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Anatomie',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: {
                    take: 1,
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
        if (anatomieChapter && anatomieChapter.questions.length > 0) {
            console.log('📚 Anatomie (référence qui fonctionne) - Première question:\n');
            const firstQuestion = anatomieChapter.questions[0];
            console.log('Question ID:', firstQuestion.id);
            console.log('Question Text:', firstQuestion.questionText);
            console.log('Number of options:', Array.isArray(firstQuestion.options) ? firstQuestion.options.length : 'NOT AN ARRAY');
            console.log('Options type:', typeof firstQuestion.options);
            console.log('\nOptions détaillées:');
            console.log(JSON.stringify(firstQuestion.options, null, 2));
        }
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
debugQuestions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=debug-question-structure.js.map