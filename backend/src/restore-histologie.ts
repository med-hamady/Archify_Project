/**
 * Restore Histologie to clean state and create Histo Nozha as separate subject
 *
 * This script:
 * 1. Deletes ALL contaminated chapters from "Histologie" PCEM2
 * 2. Creates "Histo Nozha" as a new separate subject
 * 3. Imports the 249 questions into "Histo Nozha" with 7 clean chapters
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Source files configuration
const SOURCE_DIR = path.join(__dirname, '..', 'data', 'histo-nozha');

const FILES = [
  'Exam glandes endocrines isolé.txt',
  'Exam système digestif isolé.txt',
  'Exam système lymphoïde isolé.txt',
  'Exam système respiratoire isolé.txt',
  'Exam système tégumentaire isolé.txt',
  'Examen  Appareil urinaire isolé.txt',
  'Examen  Glandes annexes isolé.txt'
];

const FILE_TO_CHAPTER: Record<string, string> = {
  'Exam glandes endocrines isolé.txt': 'Glandes endocrines',
  'Exam système digestif isolé.txt': 'Système digestif',
  'Exam système lymphoïde isolé.txt': 'Système lymphoïde',
  'Exam système respiratoire isolé.txt': 'Système respiratoire',
  'Exam système tégumentaire isolé.txt': 'Système tégumentaire',
  'Examen  Appareil urinaire isolé.txt': 'Appareil urinaire',
  'Examen  Glandes annexes isolé.txt': 'Glandes annexes'
};

interface ParsedOption {
  text: string;
  answerState: 'correct' | 'incorrect' | 'partial';
  justification: string | null;
}

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: ParsedOption[];
  explanation: string | null;
  section: string | null;
}

interface ParsedFile {
  fileName: string;
  chapterName: string;
  allQuestions: ParsedQuestion[];
}

function detectAnswerState(text: string): 'correct' | 'incorrect' | 'partial' {
  if (text.includes('(✅)') || text.includes('✅')) return 'correct';
  if (text.includes('(⚠️)') || text.includes('⚠️')) return 'partial';
  return 'incorrect';
}

function parseOption(line: string): ParsedOption | null {
  let match = line.match(/^([A-F])\.\\s+(.+?)(?:\\s*\\((?:✅|❌|⚠️)\\))?\\s*(?:→\\s*(.+))?$/);

  if (!match) {
    match = line.match(/^([A-F])-(.+?)(?:\\s+(?:✅|❌|⚠️))?\\s*(?:→\\s*(.+))?$/);
  }

  if (!match) return null;

  const fullText = match[2] || '';
  const justification = match[3]?.trim() || null;
  const answerState = detectAnswerState(line);

  return {
    text: fullText.trim(),
    answerState,
    justification
  };
}

function parseFile(filePath: string, fileName: string): ParsedFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\\n').map(l => l.trim()).filter(l => l.length > 0);

  const chapterName = FILE_TO_CHAPTER[fileName] || fileName.replace('.txt', '');
  const allQuestions: ParsedQuestion[] = [];

  let currentSection: string | null = null;
  let currentQuestion: ParsedQuestion | null = null;
  let currentOptions: ParsedOption[] = [];
  let currentExplanation: string[] = [];
  let currentQuestionTextLines: string[] = [];
  let inConclusion = false;
  let awaitingQuestionText = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section detection
    const sectionMatch = line.match(/^([A-Z])\\s*[–—-]\\s*(.+)$/);
    if (sectionMatch) {
      if (currentQuestion) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        allQuestions.push(currentQuestion);
      }

      currentSection = sectionMatch[1];
      currentQuestion = null;
      currentOptions = [];
      currentExplanation = [];
      currentQuestionTextLines = [];
      inConclusion = false;
      awaitingQuestionText = false;
      continue;
    }

    // QCM detection
    const qcmMatch = line.match(/^QCM\s+(\d+)\s+[—–-](?:\s+(.+?)\s*:?)?$/);
    if (qcmMatch) {
      if (currentQuestion) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        allQuestions.push(currentQuestion);
      }

      const questionText = qcmMatch[2]?.trim() || '';

      currentQuestion = {
        questionNumber: parseInt(qcmMatch[1]),
        questionText: questionText,
        options: [],
        explanation: null,
        section: currentSection
      };
      currentOptions = [];
      currentExplanation = [];
      currentQuestionTextLines = questionText ? [questionText] : [];
      inConclusion = false;
      awaitingQuestionText = !questionText;
      continue;
    }

    // Multi-line question text
    if (awaitingQuestionText && currentQuestion && !currentQuestion.questionText) {
      if (/^[A-F][-.]/.test(line)) {
        currentQuestion.questionText = currentQuestionTextLines.join(' ').trim().replace(/:$/, '');
        awaitingQuestionText = false;
      } else if (line.length > 0 && !line.includes('🩵')) {
        currentQuestionTextLines.push(line);
        continue;
      } else {
        currentQuestion.questionText = currentQuestionTextLines.join(' ').trim().replace(/:$/, '');
        awaitingQuestionText = false;
        if (line.length === 0) continue;
      }
    }

    // Conclusion detection
    if (line.includes('🩵 Conclusion')) {
      inConclusion = true;
      continue;
    }

    if (inConclusion && currentQuestion) {
      currentExplanation.push(line);
      continue;
    }

    // Option detection
    if (currentQuestion && /^[A-F][-.]/.test(line)) {
      const option = parseOption(line);
      if (option) {
        currentOptions.push(option);
      }
      continue;
    }
  }

  // Save last question
  if (currentQuestion) {
    currentQuestion.options = currentOptions;
    currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
    allQuestions.push(currentQuestion);
  }

  return {
    fileName,
    chapterName,
    allQuestions
  };
}

async function restore() {
  console.log('🔧 Restauration de Histologie et création de Histo Nozha...\\n');

  try {
    // ============================================
    // STEP 1: Clean up "Histologie" PCEM2
    // ============================================
    console.log('📋 Étape 1: Nettoyage de "Histologie"...');

    const histologieSubject = await prisma.subject.findFirst({
      where: {
        title: 'Histologie',
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });

    if (histologieSubject) {
      console.log(`   📚 Matière trouvée: ${histologieSubject.title}`);
      console.log(`   📑 Chapitres actuels: ${histologieSubject.chapters.length}`);

      const totalQuestions = histologieSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
      console.log(`   ❓ Questions actuelles: ${totalQuestions}`);

      // Delete ALL chapters (we'll start fresh)
      console.log('\\n   🗑️  Suppression de tous les chapitres contaminés...');

      for (const chapter of histologieSubject.chapters) {
        await prisma.question.deleteMany({
          where: { chapterId: chapter.id }
        });
        console.log(`      ✅ Questions supprimées: ${chapter.title} (${chapter._count.questions} questions)`);
      }

      await prisma.chapter.deleteMany({
        where: { subjectId: histologieSubject.id }
      });

      console.log('   ✅ Tous les chapitres supprimés de "Histologie"\\n');
    } else {
      console.log('   ℹ️  Matière "Histologie" non trouvée (OK)\\n');
    }

    // ============================================
    // STEP 2: Create or find "Histo Nozha"
    // ============================================
    console.log('📋 Étape 2: Création de "Histo Nozha" comme matière séparée...');

    let histoNozhaSubject = await prisma.subject.findFirst({
      where: {
        title: 'Histo Nozha',
        semester: 'PCEM2'
      }
    });

    if (histoNozhaSubject) {
      console.log('   ℹ️  "Histo Nozha" existe déjà\\n');
    } else {
      histoNozhaSubject = await prisma.subject.create({
        data: {
          title: 'Histo Nozha',
          semester: 'PCEM2',
          description: 'Histologie Nozha - Examens PCEM2 (249 QCMs)',
          tags: ['Histologie', 'Histo Nozha', 'PCEM2', 'Examens']
        }
      });
      console.log('   ✅ Matière "Histo Nozha" créée\\n');
    }

    // ============================================
    // STEP 3: Import data into "Histo Nozha"
    // ============================================
    console.log('📋 Étape 3: Import des données dans "Histo Nozha"...');

    if (!fs.existsSync(SOURCE_DIR)) {
      console.log('   ⚠️  Dossier source non trouvé:', SOURCE_DIR);
      console.log('   Import ignoré (normal en production).\\n');
      return;
    }

    let totalQuestionsImported = 0;

    for (const fileName of FILES) {
      const filePath = path.join(SOURCE_DIR, fileName);

      console.log(`\\n   📄 Traitement: ${fileName}`);

      if (!fs.existsSync(filePath)) {
        console.log(`      ❌ Fichier non trouvé`);
        continue;
      }

      const parsedFile = parseFile(filePath, fileName);
      console.log(`      📊 ${parsedFile.allQuestions.length} questions trouvées`);

      // Create chapter
      const chapter = await prisma.chapter.create({
        data: {
          subjectId: histoNozhaSubject.id,
          title: parsedFile.chapterName,
          description: `Chapitre ${parsedFile.chapterName} - Histologie PCEM2`,
          orderIndex: FILES.indexOf(fileName)
        }
      });

      console.log(`      ✅ Chapitre créé: ${parsedFile.chapterName}`);

      // Import questions
      for (let qIndex = 0; qIndex < parsedFile.allQuestions.length; qIndex++) {
        const question = parsedFile.allQuestions[qIndex];

        await prisma.question.create({
          data: {
            chapterId: chapter.id,
            questionText: question.questionText,
            explanation: question.explanation,
            orderIndex: qIndex,
            options: question.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.answerState,
              justification: opt.justification
            }))
          }
        });

        totalQuestionsImported++;
      }

      console.log(`      ✅ ${parsedFile.allQuestions.length} questions importées`);
    }

    console.log('\\n✅ Restauration terminée avec succès!');
    console.log(`📊 Total: ${totalQuestionsImported} questions importées dans "Histo Nozha"`);
    console.log('📚 "Histologie" a été nettoyée (prête pour données originales si nécessaire)\\n');

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restore()
  .then(() => {
    console.log('🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
