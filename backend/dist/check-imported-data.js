"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('\n📊 RÉSUMÉ DE L\'IMPORTATION\n');
    console.log('═══════════════════════════════════════\n');
    const subjects = await prisma.subject.findMany({
        include: {
            chapters: {
                include: {
                    questions: true
                }
            }
        },
        orderBy: [
            { semester: 'asc' },
            { title: 'asc' }
        ]
    });
    let totalQuestions = 0;
    for (const subject of subjects) {
        console.log(`\n📚 ${subject.title} (${subject.semester})`);
        console.log(`   ${subject.chapters.length} chapitres | ${subject.totalQCM} questions totales\n`);
        for (const chapter of subject.chapters) {
            const questionsCount = chapter.questions.length;
            totalQuestions += questionsCount;
            console.log(`   📖 ${chapter.title}`);
            console.log(`      ${questionsCount} questions`);
            // Afficher un exemple de question si disponible
            if (chapter.questions.length > 0) {
                const firstQ = chapter.questions[0];
                const options = firstQ.options;
                const correctCount = options.filter((o) => o.isCorrect).length;
                const withJustification = options.filter((o) => !o.isCorrect && o.justification).length;
                console.log(`      ✓ ${correctCount} réponses correctes | ✗ ${withJustification} justifications`);
            }
        }
    }
    console.log('\n═══════════════════════════════════════');
    console.log(`\n🎯 TOTAL: ${totalQuestions} questions importées`);
    console.log(`📚 ${subjects.length} matières créées`);
    console.log(`📖 ${subjects.reduce((acc, s) => acc + s.chapters.length, 0)} chapitres créés\n`);
}
main()
    .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check-imported-data.js.map