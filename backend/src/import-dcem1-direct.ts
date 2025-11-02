import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface QuestionOption {
  text: string;
  isCorrect: boolean;
  justification?: string;
}

interface QuestionData {
  id: string;
  chapterId: string;
  questionText: string;
  options: QuestionOption[];
  explanation: string | null;
  orderIndex: number;
  createdAt: string;
}

interface ChapterData {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  pdfUrl: string | null;
  createdAt: string;
  questions: QuestionData[];
}

interface SubjectData {
  id: string;
  title: string;
  description: string | null;
  semester: string;
  tags: string[];
  totalQCM: number;
  createdAt: string;
  views: number;
  chapters: ChapterData[];
}

/**
 * Vérifie si DCEM1 a déjà des questions
 */
async function hasDCEM1Questions(): Promise<boolean> {
  const count = await prisma.question.count({
    where: {
      chapter: {
        subject: {
          semester: 'DCEM1'
        }
      }
    }
  });

  if (count > 0) {
    console.log(`✓ DCEM1 contient déjà ${count} questions`);
    return true;
  }
  return false;
}

/**
 * Charge les données depuis le fichier JSON exporté
 */
function loadDCEM1Data(): SubjectData[] {
  const dataFile = path.join(__dirname, '..', 'dcem1-data.json');

  if (!fs.existsSync(dataFile)) {
    throw new Error(`Fichier ${dataFile} non trouvé`);
  }

  const rawData = fs.readFileSync(dataFile, 'utf-8');
  return JSON.parse(rawData);
}

/**
 * Importe les données DCEM1 directement via Prisma
 */
export async function importDCEM1Direct() {
  try {
    // Vérifier si déjà importé
    if (await hasDCEM1Questions()) {
      return;
    }

    console.log('📦 Import DCEM1 direct via Prisma...\n');

    // Nettoyer d'abord les données DCEM1 existantes (structure vide créée par seed)
    console.log('🗑️  Nettoyage des données DCEM1 existantes...');
    await prisma.question.deleteMany({
      where: {
        chapter: {
          subject: {
            semester: 'DCEM1'
          }
        }
      }
    });
    await prisma.chapter.deleteMany({
      where: {
        subject: {
          semester: 'DCEM1'
        }
      }
    });
    await prisma.subject.deleteMany({
      where: {
        semester: 'DCEM1'
      }
    });
    console.log('✓ Nettoyage terminé\n');

    // Charger les données
    console.log('📄 Chargement des données DCEM1...');
    const subjects = loadDCEM1Data();
    console.log(`✓ ${subjects.length} sujets chargés\n`);

    let totalSubjects = 0;
    let totalChapters = 0;
    let totalQuestions = 0;

    // Importer chaque sujet avec ses chapitres et questions
    for (const subjectData of subjects) {
      console.log(`📚 Import: ${subjectData.title}`);

      // Créer le sujet
      const subject = await prisma.subject.create({
        data: {
          id: subjectData.id,
          title: subjectData.title,
          description: subjectData.description,
          semester: subjectData.semester,
          tags: subjectData.tags,
          totalQCM: subjectData.totalQCM,
          createdAt: new Date(subjectData.createdAt),
          views: subjectData.views
        }
      });
      totalSubjects++;

      // Créer les chapitres
      for (const chapterData of subjectData.chapters) {
        const chapter = await prisma.chapter.create({
          data: {
            id: chapterData.id,
            subjectId: subject.id,
            title: chapterData.title,
            description: chapterData.description,
            orderIndex: chapterData.orderIndex,
            pdfUrl: chapterData.pdfUrl,
            createdAt: new Date(chapterData.createdAt)
          }
        });
        totalChapters++;

        // Créer les questions en batch (50 par 50 pour éviter les timeouts)
        const batchSize = 50;
        for (let i = 0; i < chapterData.questions.length; i += batchSize) {
          const batch = chapterData.questions.slice(i, i + batchSize);

          await prisma.question.createMany({
            data: batch.map(q => ({
              id: q.id,
              chapterId: chapter.id,
              questionText: q.questionText,
              options: q.options as any, // Prisma gère automatiquement le JSON
              explanation: q.explanation,
              orderIndex: q.orderIndex,
              createdAt: new Date(q.createdAt)
            }))
          });

          totalQuestions += batch.length;
        }
      }

      console.log(`   ✓ ${subjectData.chapters.length} chapitres, ${subjectData.chapters.reduce((sum, c) => sum + c.questions.length, 0)} questions\n`);
    }

    console.log('✅ Import DCEM1 terminé!');
    console.log(`   ${totalSubjects} sujets`);
    console.log(`   ${totalChapters} chapitres`);
    console.log(`   ${totalQuestions} questions\n`);

    // Vérification finale
    const finalCount = await prisma.question.count({
      where: {
        chapter: {
          subject: {
            semester: 'DCEM1'
          }
        }
      }
    });

    console.log(`📊 Total DCEM1: ${finalCount} questions importées`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import DCEM1:', error);
    throw error;
  }
}

// Si exécuté directement
if (require.main === module) {
  importDCEM1Direct()
    .then(() => {
      console.log('✅ Import terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}
