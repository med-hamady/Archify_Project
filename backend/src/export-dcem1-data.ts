/**
 * Export des données DCEM1 vers un fichier SQL
 *
 * Ce script exporte uniquement les sujets DCEM1 avec leurs chapitres et questions
 * pour pouvoir les importer sur Render
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportDCEM1Data() {
  try {
    console.log('📦 Export des données DCEM1...\n');

    // Récupérer tous les sujets DCEM1 avec leurs chapitres et questions
    const subjects = await prisma.subject.findMany({
      where: {
        semester: 'DCEM1'
      },
      include: {
        chapters: {
          include: {
            questions: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (subjects.length === 0) {
      console.log('❌ Aucun sujet DCEM1 trouvé dans la base locale');
      return;
    }

    console.log(`✓ ${subjects.length} sujets trouvés\n`);

    let sqlStatements: string[] = [];

    // Générer les statements SQL
    for (const subject of subjects) {
      console.log(`📚 Export: ${subject.title}`);
      console.log(`   Chapitres: ${subject.chapters.length}`);

      let totalQuestions = 0;

      // Créer le sujet
      sqlStatements.push(`
-- Subject: ${subject.title}
INSERT INTO "Subject" (id, title, description, semester, tags, "totalQCM", "createdAt", views)
VALUES (
  '${subject.id}',
  '${subject.title.replace(/'/g, "''")}',
  ${subject.description ? `'${subject.description.replace(/'/g, "''")}'` : 'NULL'},
  '${subject.semester}',
  ARRAY[${subject.tags.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')}]::text[],
  ${subject.totalQCM},
  '${subject.createdAt.toISOString()}',
  ${subject.views}
);
`);

      // Créer les chapitres
      for (const chapter of subject.chapters) {
        totalQuestions += chapter.questions.length;

        sqlStatements.push(`
-- Chapter: ${chapter.title}
INSERT INTO "Chapter" (id, "subjectId", title, description, "orderIndex", "pdfUrl", "createdAt")
VALUES (
  '${chapter.id}',
  '${subject.id}',
  '${chapter.title.replace(/'/g, "''")}',
  ${chapter.description ? `'${chapter.description.replace(/'/g, "''")}'` : 'NULL'},
  ${chapter.orderIndex},
  ${chapter.pdfUrl ? `'${chapter.pdfUrl}'` : 'NULL'},
  '${chapter.createdAt.toISOString()}'
);
`);

        // Créer les questions
        for (const question of chapter.questions) {
          const optionsJson = JSON.stringify(question.options).replace(/'/g, "''");

          sqlStatements.push(`
-- Question: ${question.questionText.substring(0, 50)}...
INSERT INTO "Question" (id, "chapterId", "questionText", options, explanation, "orderIndex", "createdAt")
VALUES (
  '${question.id}',
  '${chapter.id}',
  '${question.questionText.replace(/'/g, "''")}',
  '${optionsJson}'::jsonb,
  ${question.explanation ? `'${question.explanation.replace(/'/g, "''")}'` : 'NULL'},
  ${question.orderIndex},
  '${question.createdAt.toISOString()}'
);
`);
        }
      }

      console.log(`   Questions: ${totalQuestions}`);
      console.log(`   ✓ Exporté\n`);
    }

    // Écrire dans un fichier SQL
    const outputFile = 'dcem1-export.sql';
    const sqlContent = `
-- ============================================
-- Export DCEM1 Data
-- Date: ${new Date().toISOString()}
-- ============================================

-- Désactiver les triggers temporairement
SET session_replication_role = 'replica';

-- Supprimer les données DCEM1 existantes si elles existent
DELETE FROM "Question" WHERE "chapterId" IN (
  SELECT id FROM "Chapter" WHERE "subjectId" IN (
    SELECT id FROM "Subject" WHERE semester = 'DCEM1'
  )
);
DELETE FROM "Chapter" WHERE "subjectId" IN (
  SELECT id FROM "Subject" WHERE semester = 'DCEM1'
);
DELETE FROM "Subject" WHERE semester = 'DCEM1';

-- Insérer les nouvelles données
${sqlStatements.join('\n')}

-- Réactiver les triggers
SET session_replication_role = 'origin';

-- Vérification
SELECT
  s.title as "Sujet",
  COUNT(DISTINCT c.id) as "Chapitres",
  COUNT(q.id) as "Questions"
FROM "Subject" s
LEFT JOIN "Chapter" c ON c."subjectId" = s.id
LEFT JOIN "Question" q ON q."chapterId" = c.id
WHERE s.semester = 'DCEM1'
GROUP BY s.id, s.title
ORDER BY s.title;
`;

    fs.writeFileSync(outputFile, sqlContent);

    console.log('✅ Export terminé!');
    console.log(`📄 Fichier créé: ${outputFile}`);
    console.log(`\n📊 Statistiques:`);

    const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const totalQuestions = subjects.reduce((sum, s) =>
      sum + s.chapters.reduce((qSum, c) => qSum + c.questions.length, 0), 0
    );

    console.log(`   - ${subjects.length} sujets`);
    console.log(`   - ${totalChapters} chapitres`);
    console.log(`   - ${totalQuestions} questions`);

    console.log(`\n💡 Pour importer sur Render:`);
    console.log(`   1. Copiez le contenu de ${outputFile}`);
    console.log(`   2. Connectez-vous à la base Render avec psql`);
    console.log(`   3. Collez et exécutez le SQL\n`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportDCEM1Data();
