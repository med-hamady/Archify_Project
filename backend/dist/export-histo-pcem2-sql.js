"use strict";
/**
 * Export SQL - Histo Nozha PCEM2
 *
 * Génère un dump SQL des données Histo PCEM2 pour import en production
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function exportToSQL() {
    console.log('-- ============================================');
    console.log('-- Export SQL - Histo Nozha PCEM2');
    console.log('-- Généré le:', new Date().toISOString());
    console.log('-- ============================================\n');
    try {
        const subject = await prisma.subject.findFirst({
            where: {
                title: 'Histologie',
                semester: 'PCEM2'
            },
            include: {
                chapters: {
                    include: {
                        questions: true
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
        if (!subject) {
            console.error('-- ERREUR: Matière Histologie PCEM2 non trouvée');
            return;
        }
        console.log('-- Stats:');
        console.log(`--   Chapitres: ${subject.chapters.length}`);
        const totalQuestions = subject.chapters.reduce((sum, ch) => sum + ch.questions.length, 0);
        console.log(`--   Questions: ${totalQuestions}`);
        console.log('-- ============================================\n');
        // 1. Insert Subject
        console.log('-- 1. Insérer la matière Histologie');
        console.log(`INSERT INTO "Subject" (id, title, semester, description, tags, "totalQCM", views, "createdAt")`);
        console.log(`VALUES (
  '${subject.id}',
  '${escapeSQL(subject.title)}',
  '${escapeSQL(subject.semester)}',
  ${subject.description ? `'${escapeSQL(subject.description)}'` : 'NULL'},
  ARRAY[${subject.tags.map(t => `'${escapeSQL(t)}'`).join(', ')}]::text[],
  ${subject.totalQCM},
  ${subject.views},
  '${subject.createdAt.toISOString()}'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags;\n`);
        // 2. Insert Chapters
        console.log('-- 2. Insérer les chapitres');
        for (const chapter of subject.chapters) {
            console.log(`INSERT INTO "Chapter" (id, "subjectId", title, description, "orderIndex", "pdfUrl", views, "createdAt")`);
            console.log(`VALUES (
  '${chapter.id}',
  '${subject.id}',
  '${escapeSQL(chapter.title)}',
  ${chapter.description ? `'${escapeSQL(chapter.description)}'` : 'NULL'},
  ${chapter.orderIndex},
  ${chapter.pdfUrl ? `'${escapeSQL(chapter.pdfUrl)}'` : 'NULL'},
  ${chapter.views},
  '${chapter.createdAt.toISOString()}'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex";\n`);
        }
        // 3. Insert Questions
        console.log('-- 3. Insérer les questions');
        for (const chapter of subject.chapters) {
            for (const question of chapter.questions) {
                const optionsJSON = JSON.stringify(question.options).replace(/'/g, "''");
                console.log(`INSERT INTO "Question" (id, "chapterId", "questionText", options, explanation, "orderIndex", "createdAt", "updatedAt")`);
                console.log(`VALUES (
  '${question.id}',
  '${chapter.id}',
  '${escapeSQL(question.questionText)}',
  '${optionsJSON}'::jsonb,
  ${question.explanation ? `'${escapeSQL(question.explanation)}'` : 'NULL'},
  ${question.orderIndex},
  '${question.createdAt.toISOString()}',
  '${question.updatedAt.toISOString()}'
)
ON CONFLICT (id) DO UPDATE SET
  "questionText" = EXCLUDED."questionText",
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  "orderIndex" = EXCLUDED."orderIndex";\n`);
            }
        }
        console.log('-- ============================================');
        console.log('-- Fin de l\'export SQL');
        console.log('-- ============================================');
    }
    catch (error) {
        console.error('-- ERREUR:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
function escapeSQL(str) {
    return str.replace(/'/g, "''");
}
exportToSQL()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('ERREUR FATALE:', error);
    process.exit(1);
});
//# sourceMappingURL=export-histo-pcem2-sql.js.map