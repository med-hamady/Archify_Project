/**
 * Import Script - QCM PCEP2
 *
 * Importe les QCM pour le niveau PCEP2
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
const BASE_SOURCE_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\PCEP2\\QCM';

// Structure des matières et leurs chapitres
const SUBJECTS_CONFIG = {
  'Biochimie': {
    description: 'Biochimie médicale - PCEP2',
    chapters: [
      'Chapitre 1 bioénergétique.txt',
      'Chapitre 2 métabolisme glucidique.txt',
      'Chapitre 3 Métabolisme des Lipides.txt',
      'Chapitre 4  métabolisme protéique.txt',
      'Chapitre 5 Enzymologie.txt'
    ]
  },
  'Microbiologie Bacterio': {
    description: 'Microbiologie - Bactériologie',
    chapters: [
      'Chapitre 1  Structure bactérienne.txt',
      'Chapitre 2 NUTRITION DES BACTÉRIE.txt',
      'Chapitre 3 CROISSANCE BACTÉRIE.txt',
      'Chapitre 4 FACTEURS de PATHOGÉNICITÉ.txt'
    ]
  },
  'Microbiologie virologie': {
    description: 'Microbiologie - Virologie',
    chapters: [
      'CHAPITRE 1 structure et classificat.txt',
      'CHAPITRE 2 Multiplication virale.txt',
      'CHAPITRE 3 Diagnostic virologique.txt'
    ]
  }
};

// ============================================
// TYPES
// ============================================

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
}

interface ParsedChapter {
  chapterTitle: string;
  questions: ParsedQuestion[];
}

// ============================================
// FONCTIONS DE PARSING
// ============================================

/**
 * Détecte l'état de la réponse à partir des symboles ✅❌⚠️
 */
function detectAnswerState(text: string): 'correct' | 'incorrect' | 'partial' {
  if (text.includes('(✅)') || text.includes('✅')) return 'correct';
  if (text.includes('(⚠️)') || text.includes('⚠️')) return 'partial';
  return 'incorrect'; // Par défaut ou si (❌)
}

/**
 * Parse une option (ligne A., B., C., etc.)
 */
function parseOption(line: string): ParsedOption | null {
  // Format: "A. Texte (✅/❌/⚠️)" ou "A] Texte (✅/❌/⚠️)"
  let match = line.match(/^([A-Fa-f])\.\s+(.+)$/);

  // Essayer aussi le format avec ]
  if (!match) {
    match = line.match(/^([A-Fa-f])\]\s+(.+)$/);
  }

  if (!match) return null;

  let fullText = match[2] || '';
  const answerState = detectAnswerState(line);

  // Nettoyer tous les symboles de réponse du texte de l'option
  fullText = fullText
    .replace(/\s*\(✅\)\s*$/g, '')
    .replace(/\s*\(❌\)\s*$/g, '')
    .replace(/\s*\(⚠️\)\s*$/g, '')
    .replace(/\s*✅\s*$/g, '')
    .replace(/\s*❌\s*$/g, '')
    .replace(/\s*⚠️\s*$/g, '')
    .trim();

  return {
    text: fullText,
    answerState,
    justification: null
  };
}

/**
 * Parse un fichier chapitre complet
 */
function parseChapterFile(filePath: string, fileName: string): ParsedChapter {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Le titre du chapitre est sur la première ligne
  const chapterTitle = lines[0] || fileName.replace('.txt', '');

  const questions: ParsedQuestion[] = [];
  let currentQuestion: ParsedQuestion | null = null;
  let currentOptions: ParsedOption[] = [];
  let currentExplanation: string[] = [];
  let inConclusion = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Détection d'une nouvelle question: "QCM X – Titre" ou "QCM X : Titre"
    const qcmMatch = line.match(/^QCM\s+(\d+)\s*[–—:\-]\s*(.+)$/i);
    if (qcmMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.length > 0
          ? currentExplanation.join(' ').trim()
          : null;
        questions.push(currentQuestion);
      }

      // Nouvelle question
      const questionNumber = parseInt(qcmMatch[1]);
      const questionText = qcmMatch[2].trim();

      currentQuestion = {
        questionNumber,
        questionText,
        options: [],
        explanation: null
      };

      currentOptions = [];
      currentExplanation = [];
      inConclusion = false;
      continue;
    }

    // Détection de la conclusion
    if (line.match(/^🩵\s*Conclusion\s*:/i)) {
      inConclusion = true;
      continue;
    }

    // Si on est dans la conclusion, on accumule le texte
    if (inConclusion) {
      currentExplanation.push(line);
      continue;
    }

    // Détection d'une option (A., B., C., etc.)
    const option = parseOption(line);
    if (option) {
      currentOptions.push(option);
      continue;
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

  return {
    chapterTitle,
    questions
  };
}

// ============================================
// IMPORTATION DANS LA BASE DE DONNÉES
// ============================================

async function importPCEP2() {
  console.log('🚀 Starting PCEP2 QCM import...\n');

  let totalImported = 0;

  for (const [subjectName, subjectConfig] of Object.entries(SUBJECTS_CONFIG)) {
    console.log(`\n📚 Importing subject: ${subjectName}`);

    // Créer ou récupérer la matière
    let subject = await prisma.subject.findFirst({
      where: {
        title: subjectName,
        semester: SEMESTER
      }
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          title: subjectName,
          description: subjectConfig.description,
          semester: SEMESTER,
          tags: ['PCEP2', subjectName],
          totalQCM: 0 // Sera mis à jour après comptage
        }
      });
      console.log(`  ✅ Created subject: ${subjectName}`);
    } else {
      console.log(`  ℹ️  Subject already exists: ${subjectName}`);
    }

    let subjectQuestionCount = 0;

    // Importer chaque chapitre
    for (let chapterIndex = 0; chapterIndex < subjectConfig.chapters.length; chapterIndex++) {
      const chapterFileName = subjectConfig.chapters[chapterIndex];
      const chapterFilePath = path.join(BASE_SOURCE_DIR, subjectName, chapterFileName);

      if (!fs.existsSync(chapterFilePath)) {
        console.log(`  ⚠️  File not found: ${chapterFilePath}`);
        continue;
      }

      console.log(`  📖 Parsing chapter: ${chapterFileName}`);
      const parsedChapter = parseChapterFile(chapterFilePath, chapterFileName);

      // Créer ou récupérer le chapitre
      let chapter = await prisma.chapter.findFirst({
        where: {
          subjectId: subject.id,
          title: parsedChapter.chapterTitle
        }
      });

      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            subjectId: subject.id,
            title: parsedChapter.chapterTitle,
            description: `Chapitre ${chapterIndex + 1} - ${parsedChapter.chapterTitle}`,
            orderIndex: chapterIndex
          }
        });
        console.log(`    ✅ Created chapter: ${parsedChapter.chapterTitle}`);
      } else {
        console.log(`    ℹ️  Chapter already exists: ${parsedChapter.chapterTitle}`);
      }

      // Importer les questions
      for (const question of parsedChapter.questions) {
        // Vérifier si la question existe déjà
        const existingQuestion = await prisma.question.findFirst({
          where: {
            chapterId: chapter.id,
            questionText: question.questionText
          }
        });

        if (existingQuestion) {
          console.log(`    ⏭️  Question already exists: QCM ${question.questionNumber}`);
          continue;
        }

        // Convertir les options au format attendu
        const options = question.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.answerState === 'correct',
          isPartial: opt.answerState === 'partial',
          justification: opt.justification
        }));

        // Créer la question
        await prisma.question.create({
          data: {
            chapterId: chapter.id,
            questionText: question.questionText,
            options: options,
            explanation: question.explanation,
            orderIndex: question.questionNumber - 1
          }
        });

        subjectQuestionCount++;
        totalImported++;
      }

      console.log(`    ✅ Imported ${parsedChapter.questions.length} questions`);
    }

    // Mettre à jour le total de QCM pour la matière
    await prisma.subject.update({
      where: { id: subject.id },
      data: { totalQCM: subjectQuestionCount }
    });

    console.log(`  ✅ Subject "${subjectName}" complete: ${subjectQuestionCount} questions`);
  }

  console.log(`\n✅ Import complete! Total questions imported: ${totalImported}`);
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
