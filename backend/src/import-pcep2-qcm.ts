/**
 * Import Script - QCM PCEP2
 *
 * Importe les QCM pour le niveau PCEP2 depuis le fichier JSON embarqué
 * Matières:
 * - Biochimie (5 chapitres)
 * - Microbiologie Bacterio (4 chapitres)
 * - Microbiologie virologie (3 chapitres)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const SEMESTER = 'PCEP2';
const SEED_FILE = path.join(__dirname, '..', 'data', 'pcep2', 'pcep2-seed.json');

// ============================================
// TYPES
// ============================================

interface SeedOption {
  text: string;
  isCorrect: boolean;
  isPartial: boolean;
  justification: string | null;
}

interface SeedQuestion {
  questionNumber: number;
  questionText: string;
  options: SeedOption[];
  explanation: string | null;
}

interface SeedChapter {
  title: string;
  questions: SeedQuestion[];
}

interface SeedSubject {
  title: string;
  description: string;
  chapters: SeedChapter[];
}

interface SeedData {
  semester: string;
  subjects: SeedSubject[];
  exportedAt: string;
  totalQuestions: number;
}

// ============================================
// IMPORTATION DANS LA BASE DE DONNÉES
// ============================================

async function importPCEP2() {
  console.log('🚀 Starting PCEP2 QCM import...\n');

  // Vérifier si le fichier seed existe
  if (!fs.existsSync(SEED_FILE)) {
    console.log(`⚠️  Seed file not found: ${SEED_FILE}`);
    console.log('   Skipping PCEP2 import.');
    return;
  }

  // Charger les données depuis le fichier JSON
  const seedData: SeedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  console.log(`📦 Loaded seed data: ${seedData.totalQuestions} questions from ${seedData.exportedAt}`);

  let totalImported = 0;

  for (const subjectData of seedData.subjects) {
    console.log(`\n📚 Importing subject: ${subjectData.title}`);

    // Créer ou récupérer la matière
    let subject = await prisma.subject.findFirst({
      where: {
        title: subjectData.title,
        semester: SEMESTER
      }
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          title: subjectData.title,
          description: subjectData.description,
          semester: SEMESTER,
          tags: ['PCEP2', subjectData.title],
          totalQCM: 0
        }
      });
      console.log(`  ✅ Created subject: ${subjectData.title}`);
    } else {
      console.log(`  ℹ️  Subject already exists: ${subjectData.title}`);
    }

    let subjectQuestionCount = 0;

    // Importer chaque chapitre
    for (let chapterIndex = 0; chapterIndex < subjectData.chapters.length; chapterIndex++) {
      const chapterData = subjectData.chapters[chapterIndex];

      // Créer ou récupérer le chapitre
      let chapter = await prisma.chapter.findFirst({
        where: {
          subjectId: subject.id,
          title: chapterData.title
        }
      });

      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            subjectId: subject.id,
            title: chapterData.title,
            description: `Chapitre ${chapterIndex + 1} - ${chapterData.title}`,
            orderIndex: chapterIndex
          }
        });
        console.log(`  ✅ Created chapter: ${chapterData.title}`);
      } else {
        console.log(`  ℹ️  Chapter already exists: ${chapterData.title}`);
      }

      // Compter les questions existantes dans ce chapitre
      const existingQuestionsCount = await prisma.question.count({
        where: { chapterId: chapter.id }
      });

      if (existingQuestionsCount >= chapterData.questions.length) {
        console.log(`     ℹ️  All ${existingQuestionsCount} questions already imported`);
        subjectQuestionCount += existingQuestionsCount;
        continue;
      }

      // Importer les questions
      let chapterImported = 0;
      for (const question of chapterData.questions) {
        // Vérifier si la question existe déjà
        const existingQuestion = await prisma.question.findFirst({
          where: {
            chapterId: chapter.id,
            questionText: question.questionText
          }
        });

        if (existingQuestion) {
          continue;
        }

        // Créer la question
        await prisma.question.create({
          data: {
            chapterId: chapter.id,
            questionText: question.questionText,
            options: question.options as any,
            explanation: question.explanation,
            orderIndex: question.questionNumber - 1
          }
        });

        chapterImported++;
        subjectQuestionCount++;
        totalImported++;
      }

      if (chapterImported > 0) {
        console.log(`     ✅ Imported ${chapterImported} new questions`);
      }
    }

    // Mettre à jour le total de QCM pour la matière
    const totalSubjectQuestions = await prisma.question.count({
      where: {
        chapter: {
          subjectId: subject.id
        }
      }
    });

    await prisma.subject.update({
      where: { id: subject.id },
      data: { totalQCM: totalSubjectQuestions }
    });

    console.log(`  ✅ Subject "${subjectData.title}" complete: ${totalSubjectQuestions} questions`);
  }

  console.log(`\n✅ Import complete! Total new questions imported: ${totalImported}`);
}

// ============================================
// EXECUTION
// ============================================

importPCEP2()
  .catch((e) => {
    console.error('❌ Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
