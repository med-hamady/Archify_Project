"use strict";
/**
 * Check question format in database
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkQuestions() {
    console.log('🔍 Vérification du format des questions...\n');
    try {
        // Get one question from Histologie
        const histoChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Histologie',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: {
                    take: 1
                }
            }
        });
        if (histoChapter && histoChapter.questions[0]) {
            console.log('📚 Question Histologie:');
            console.log('   Text:', histoChapter.questions[0].questionText);
            console.log('   Options:', JSON.stringify(histoChapter.questions[0].options, null, 2));
            console.log('');
        }
        // Get one question from Histo Nozha
        const nozhaChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Histo Nozha',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: {
                    take: 1
                }
            }
        });
        if (nozhaChapter && nozhaChapter.questions[0]) {
            console.log('📚 Question Histo Nozha:');
            console.log('   Text:', nozhaChapter.questions[0].questionText);
            console.log('   Options:', JSON.stringify(nozhaChapter.questions[0].options, null, 2));
            console.log('');
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
checkQuestions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=check-question-format.js.map