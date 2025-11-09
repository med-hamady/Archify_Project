"use strict";
/**
 * Compare question formats between subjects
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function compareFormats() {
    console.log('🔍 Comparaison des formats de questions...\n');
    try {
        // Anatomie
        const anatomieChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Anatomie',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: { take: 1 }
            }
        });
        if (anatomieChapter && anatomieChapter.questions[0]) {
            console.log('📚 Anatomie (matière qui fonctionne):');
            console.log(JSON.stringify(anatomieChapter.questions[0].options, null, 2));
            console.log('');
        }
        // Histologie
        const histoChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Histologie',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: { take: 1 }
            }
        });
        if (histoChapter && histoChapter.questions[0]) {
            console.log('📚 Histologie:');
            console.log(JSON.stringify(histoChapter.questions[0].options, null, 2));
            console.log('');
        }
        // Histo Nozha
        const histoNozhaChapter = await prisma.chapter.findFirst({
            where: {
                subject: {
                    title: 'Histo Nozha',
                    semester: 'PCEM2'
                }
            },
            include: {
                questions: { take: 1 }
            }
        });
        if (histoNozhaChapter && histoNozhaChapter.questions[0]) {
            console.log('📚 Histo Nozha:');
            console.log(JSON.stringify(histoNozhaChapter.questions[0].options, null, 2));
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
compareFormats()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=compare-question-formats.js.map