/**
 * Seed Histo Nozha from JSON export
 * Can be run on Render without needing source text files
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuestionData {
  questionText: string;
  options: any;
  explanation: string | null;
  orderIndex: number;
}

interface SubchapterData {
  title: string;
  orderIndex: number;
  questions: QuestionData[];
}

interface ChapterData {
  title: string;
  description: string | null;
  orderIndex: number;
  subchapters: SubchapterData[];
}

interface SeedData {
  subject: {
    title: string;
    description: string | null;
    semester: string;
    tags: string[];
    totalQCM: number;
  };
  chapters: ChapterData[];
}

async function seedHistoNozhaFromJson() {
  console.log('🌱 Seed Histo Nozha depuis JSON...\n');

  try {
    // Lire le fichier JSON
    const jsonPath = path.join(__dirname, 'histo-nozha-seed.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const data: SeedData = JSON.parse(jsonData);

    console.log(`📖 Données chargées:`);
    console.log(`   - Chapitres: ${data.chapters.length}`);

    let totalSubchapters = 0;
    let totalQuestions = 0;
    data.chapters.forEach(ch => {
      totalSubchapters += ch.subchapters.length;
      ch.subchapters.forEach(sub => {
        totalQuestions += sub.questions.length;
      });
    });
    console.log(`   - Sous-chapitres: ${totalSubchapters}`);
    console.log(`   - Questions: ${totalQuestions}\n`);

    // 1. Créer ou récupérer le sujet
    let subject = await prisma.subject.findFirst({
      where: {
        title: data.subject.title,
        semester: data.subject.semester
      }
    });

    if (subject) {
      console.log(`✅ Sujet existant trouvé: ${subject.id}`);
    } else {
      subject = await prisma.subject.create({
        data: data.subject
      });
      console.log(`✅ Sujet créé: ${subject.id}`);
    }

    // 2. Créer les chapitres et sous-chapitres
    let importedSubchapters = 0;
    let importedQuestions = 0;

    for (const chapterData of data.chapters) {
      console.log(`\n📖 Chapitre: ${chapterData.title}`);

      // Vérifier si le chapitre existe
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
            description: chapterData.description,
            orderIndex: chapterData.orderIndex
          }
        });
        console.log(`   ✅ Chapitre créé`);
      } else {
        console.log(`   ✅ Chapitre existant`);
      }

      // Créer les sous-chapitres
      for (const subchapterData of chapterData.subchapters) {
        const subchapter = await prisma.subchapter.create({
          data: {
            chapterId: chapter.id,
            title: subchapterData.title,
            orderIndex: subchapterData.orderIndex
          }
        });
        importedSubchapters++;

        console.log(`      📌 ${subchapterData.title} (${subchapterData.questions.length} QCMs)`);

        // Créer les questions
        for (const questionData of subchapterData.questions) {
          await prisma.question.create({
            data: {
              chapterId: chapter.id,
              subchapterId: subchapter.id,
              questionText: questionData.questionText,
              options: questionData.options,
              explanation: questionData.explanation,
              orderIndex: questionData.orderIndex
            }
          });
          importedQuestions++;
        }
      }
    }

    console.log('\n\n✅ Import terminé!');
    console.log(`📊 Statistiques:`);
    console.log(`   - Sous-chapitres importés: ${importedSubchapters}`);
    console.log(`   - Questions importées: ${importedQuestions}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedHistoNozhaFromJson()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
