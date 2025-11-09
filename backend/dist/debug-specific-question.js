"use strict";
/**
 * Debug specific question from Histo Nozha
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function debugQuestion() {
    console.log('🔍 Debug question spécifique...\n');
    try {
        // Get a question from Histo Nozha Appareil urinaire chapter
        const chapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Histo Nozha',
                    semester: 'PCEM2'
                },
                title: 'Appareil urinaire'
            },
            include: {
                questions: {
                    take: 5,
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
        if (!chapter) {
            console.log('❌ Chapitre non trouvé');
            return;
        }
        console.log(`📚 Chapitre: ${chapter.title}`);
        console.log(`📊 Total questions: ${chapter.questions.length}\n`);
        chapter.questions.forEach((question, index) => {
            console.log(`\n📝 Question ${index + 1}:`);
            console.log(`   ID: ${question.id}`);
            console.log(`   Text: ${question.questionText}`);
            console.log(`   Options type: ${typeof question.options}`);
            console.log(`   Options is Array: ${Array.isArray(question.options)}`);
            if (Array.isArray(question.options)) {
                console.log(`   Options count: ${question.options.length}`);
                console.log(`   Options content:`);
                console.log(JSON.stringify(question.options, null, 2));
            }
            else {
                console.log(`   ⚠️  OPTIONS N'EST PAS UN TABLEAU!`);
                console.log(`   Raw value: ${JSON.stringify(question.options)}`);
            }
        });
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
debugQuestion()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=debug-specific-question.js.map