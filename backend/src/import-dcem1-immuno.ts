/**
 * Import Script - Immuno DCEM1
 *
 * Importe les QCM d'Immunologie pour DCEM1
 * 7 chapitres, ~353 QCM
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const SEMESTER = 'DCEM1';
const SUBJECT_NAME = 'Immuno';
const SUBJECT_DESCRIPTION = 'Immunologie - DCEM1';
const BASE_SOURCE_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\dcem1\\S inetrnational\\quiz dcem1\\Immuno';
const SEED_FILE = path.join(__dirname, '..', 'data', 'dcem1', 'immuno-seed.json');

// Lire dynamiquement les fichiers .txt du répertoire
function getChapterFiles(): string[] {
  if (!fs.existsSync(BASE_SOURCE_DIR)) {
    return [];
  }
  return fs.readdirSync(BASE_SOURCE_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();
}

// ============================================
// TYPES
// ============================================

interface ParsedOption {
  text: string;
  isCorrect: boolean;
  isPartial: boolean;
  justification: string | null;
}

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: ParsedOption[];
  explanation: string | null;
}

interface ChapterData {
  title: string;
  questions: ParsedQuestion[];
}

interface SeedData {
  semester: string;
  subjectName: string;
  subjectDescription: string;
  chapters: ChapterData[];
  exportedAt: string;
  totalQuestions: number;
}

// ============================================
// FONCTIONS DE PARSING
// ============================================

function detectAnswerState(text: string): 'correct' | 'incorrect' | 'partial' {
  if (text.includes('(✅)') || text.includes('✅')) return 'correct';
  if (text.includes('(⚠️)') || text.includes('⚠️')) return 'partial';
  return 'incorrect';
}

function parseOption(line: string): ParsedOption | null {
  // Format: "A. Texte (✅/❌) → Justification" ou "A- Texte" ou lettres A-J
  const match = line.match(/^([A-Ja-j])[.\-)\]]\s*(.+)$/);
  if (!match) return null;

  let fullText = match[2] || '';
  const answerState = detectAnswerState(line);

  // Extraire la justification si présente (après →)
  let justification: string | null = null;
  const arrowIndex = fullText.indexOf('→');
  if (arrowIndex !== -1) {
    justification = fullText.substring(arrowIndex + 1).trim();
    fullText = fullText.substring(0, arrowIndex).trim();
  }

  // Nettoyer les symboles
  fullText = fullText
    .replace(/\s*\(✅\)\s*/g, '')
    .replace(/\s*\(❌\)\s*/g, '')
    .replace(/\s*\(⚠️\)\s*/g, '')
    .replace(/\s*✅\s*/g, '')
    .replace(/\s*❌\s*/g, '')
    .replace(/\s*⚠️\s*/g, '')
    .trim();

  return {
    text: fullText,
    isCorrect: answerState === 'correct',
    isPartial: answerState === 'partial',
    justification
  };
}

function parseChapterFile(filePath: string, fileName: string): ChapterData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Extraire le titre du chapitre (première ligne)
  let chapterTitle = fileName.replace('.txt', '').trim();
  if (lines[0] && !lines[0].match(/^QCM/i)) {
    chapterTitle = lines[0];
  }

  const questions: ParsedQuestion[] = [];
  let currentQuestion: ParsedQuestion | null = null;
  let currentOptions: ParsedOption[] = [];
  let currentExplanation: string[] = [];
  let inConclusion = false;
  let awaitingQuestionText = false;
  let questionTextLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détection d'une nouvelle question: "QCM X :" ou "QCM X" ou "QCM X : Question text"
    const qcmMatch = line.match(/^QCM\s+([\d.]+)\s*[:\-–]?\s*(.*)$/i);
    if (qcmMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.length > 0
          ? currentExplanation.join(' ').trim()
          : null;
        questions.push(currentQuestion);
      }

      const questionNumber = parseFloat(qcmMatch[1]);
      const questionTextOnSameLine = qcmMatch[2]?.trim() || '';

      currentQuestion = {
        questionNumber,
        questionText: questionTextOnSameLine,
        options: [],
        explanation: null
      };

      currentOptions = [];
      currentExplanation = [];
      questionTextLines = [];
      inConclusion = false;
      // Si le texte de la question est sur la même ligne, pas besoin d'attendre
      awaitingQuestionText = questionTextOnSameLine.length === 0;
      continue;
    }

    // Si on attend le texte de la question
    if (awaitingQuestionText && currentQuestion) {
      // Ignorer les lignes vides
      if (line === '') continue;

      // Si c'est juste des points, utiliser un texte par défaut
      if (line.match(/^[.…]+$/)) {
        currentQuestion.questionText = 'Cochez la ou les propositions correctes :';
        awaitingQuestionText = false;
        continue;
      }

      // Si c'est une option, le texte de la question est terminé
      if (line.match(/^[A-Ja-j][.\-)\]]/)) {
        // Pas de texte de question trouvé, utiliser un texte par défaut
        if (!currentQuestion.questionText) {
          currentQuestion.questionText = 'Cochez la ou les propositions correctes :';
        }
        awaitingQuestionText = false;
        // Traiter cette ligne comme une option
      } else {
        currentQuestion.questionText = line;
        awaitingQuestionText = false;
        continue;
      }
    }

    // Détection de la conclusion
    if (line.match(/^🩵\s*Conclusion\s*:/i)) {
      inConclusion = true;
      continue;
    }

    if (inConclusion) {
      currentExplanation.push(line);
      continue;
    }

    // Détection d'une option
    const option = parseOption(line);
    if (option && currentQuestion) {
      currentOptions.push(option);
    }
  }

  // Sauvegarder la dernière question
  if (currentQuestion && currentOptions.length > 0) {
    currentQuestion.options = currentOptions;
    currentQuestion.explanation = currentExplanation.length > 0
      ? currentExplanation.join(' ').trim()
      : null;
    questions.push(currentQuestion);
  }

  return { title: chapterTitle, questions };
}

// ============================================
// EXPORT SEED DATA
// ============================================

function exportSeedData(): SeedData | null {
  console.log('📦 Exporting Immuno DCEM1 seed data...\n');

  if (!fs.existsSync(BASE_SOURCE_DIR)) {
    console.log(`⚠️  Directory not found: ${BASE_SOURCE_DIR}`);
    return null;
  }

  const chapters: ChapterData[] = [];
  let totalQuestions = 0;

  const chapterFiles = getChapterFiles();
  for (const chapterFile of chapterFiles) {
    const filePath = path.join(BASE_SOURCE_DIR, chapterFile);

    const chapter = parseChapterFile(filePath, chapterFile);
    chapters.push(chapter);
    totalQuestions += chapter.questions.length;
    console.log(`  ✅ ${chapter.title}: ${chapter.questions.length} questions`);
  }

  const seedData: SeedData = {
    semester: SEMESTER,
    subjectName: SUBJECT_NAME,
    subjectDescription: SUBJECT_DESCRIPTION,
    chapters,
    exportedAt: new Date().toISOString(),
    totalQuestions
  };

  // Créer le dossier si nécessaire
  const outputDir = path.dirname(SEED_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(SEED_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  console.log(`\n📁 Saved to: ${SEED_FILE}`);
  console.log(`📊 Total: ${totalQuestions} questions`);

  return seedData;
}

// ============================================
// IMPORT TO DATABASE
// ============================================

async function importImmunoDCEM1() {
  console.log('🚀 Starting Immuno DCEM1 import...\n');

  // Charger ou exporter les données
  let seedData: SeedData;

  if (fs.existsSync(SEED_FILE)) {
    seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    console.log(`📦 Loaded seed data: ${seedData.totalQuestions} questions from ${seedData.exportedAt}`);
  } else if (fs.existsSync(BASE_SOURCE_DIR)) {
    const exported = exportSeedData();
    if (!exported) {
      console.log('❌ Failed to export seed data');
      return;
    }
    seedData = exported;
  } else {
    console.log(`⚠️  No seed file found: ${SEED_FILE}`);
    console.log('   Skipping Immuno DCEM1 import.');
    return;
  }

  // Créer ou récupérer la matière
  let subject = await prisma.subject.findFirst({
    where: {
      title: seedData.subjectName,
      semester: SEMESTER
    }
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        title: seedData.subjectName,
        description: seedData.subjectDescription,
        semester: SEMESTER,
        tags: ['DCEM1', 'Immunologie'],
        totalQCM: 0
      }
    });
    console.log(`✅ Created subject: ${seedData.subjectName}`);
  } else {
    console.log(`ℹ️  Subject already exists: ${seedData.subjectName}`);
  }

  let totalImported = 0;

  // Importer chaque chapitre
  for (let chapterIndex = 0; chapterIndex < seedData.chapters.length; chapterIndex++) {
    const chapterData = seedData.chapters[chapterIndex];

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
          description: chapterData.title,
          orderIndex: chapterIndex
        }
      });
      console.log(`  ✅ Created chapter: ${chapterData.title}`);
    } else {
      console.log(`  ℹ️  Chapter already exists: ${chapterData.title}`);
    }

    // Compter les questions existantes
    const existingCount = await prisma.question.count({
      where: { chapterId: chapter.id }
    });

    if (existingCount >= chapterData.questions.length) {
      console.log(`     ℹ️  All ${existingCount} questions already imported`);
      continue;
    }

    // Importer les questions (inclure les duplicats)
    let chapterImported = 0;
    for (const question of chapterData.questions) {
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
      totalImported++;
    }

    if (chapterImported > 0) {
      console.log(`     ✅ Imported ${chapterImported} new questions`);
    }
  }

  // Mettre à jour le total
  const totalSubjectQuestions = await prisma.question.count({
    where: { chapter: { subjectId: subject.id } }
  });

  await prisma.subject.update({
    where: { id: subject.id },
    data: { totalQCM: totalSubjectQuestions }
  });

  console.log(`\n✅ Import complete! Total: ${totalSubjectQuestions} questions`);
}

// ============================================
// EXECUTION
// ============================================

importImmunoDCEM1()
  .catch((e) => {
    console.error('❌ Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
