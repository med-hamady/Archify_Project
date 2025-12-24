/**
 * Export Script - PCEP2 Seed Data
 *
 * Lit les fichiers QCM locaux et génère un fichier JSON
 * pour être embarqué dans le projet et utilisé en production
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const BASE_SOURCE_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\PCEP2\\QCM';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'pcep2', 'pcep2-seed.json');

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

interface SubjectData {
  title: string;
  description: string;
  chapters: ChapterData[];
}

interface SeedData {
  semester: string;
  subjects: SubjectData[];
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

function parseOption(line: string): { text: string; isCorrect: boolean; isPartial: boolean } | null {
  let match = line.match(/^([A-Fa-f])\.\s+(.+)$/);
  if (!match) {
    match = line.match(/^([A-Fa-f])\]\s+(.+)$/);
  }
  if (!match) return null;

  let fullText = match[2] || '';
  const answerState = detectAnswerState(line);

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
    isCorrect: answerState === 'correct',
    isPartial: answerState === 'partial'
  };
}

function parseChapterFile(filePath: string): ChapterData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const chapterTitle = lines[0] || 'Unknown Chapter';
  const questions: ParsedQuestion[] = [];

  let currentQuestion: ParsedQuestion | null = null;
  let currentOptions: ParsedOption[] = [];
  let currentExplanation: string[] = [];
  let inConclusion = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    const qcmMatch = line.match(/^QCM\s+(\d+)\s*[–—:\-]\s*(.+)$/i);
    if (qcmMatch) {
      if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.length > 0
          ? currentExplanation.join(' ').trim()
          : null;
        questions.push(currentQuestion);
      }

      currentQuestion = {
        questionNumber: parseInt(qcmMatch[1]),
        questionText: qcmMatch[2].trim(),
        options: [],
        explanation: null
      };

      currentOptions = [];
      currentExplanation = [];
      inConclusion = false;
      continue;
    }

    if (line.match(/^🩵\s*Conclusion\s*:/i)) {
      inConclusion = true;
      continue;
    }

    if (inConclusion) {
      currentExplanation.push(line);
      continue;
    }

    const option = parseOption(line);
    if (option) {
      currentOptions.push({
        text: option.text,
        isCorrect: option.isCorrect,
        isPartial: option.isPartial,
        justification: null
      });
    }
  }

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
// EXPORT
// ============================================

function exportPCEP2Seed() {
  console.log('📦 Exporting PCEP2 seed data...\n');

  const subjects: SubjectData[] = [];
  let totalQuestions = 0;

  for (const [subjectName, config] of Object.entries(SUBJECTS_CONFIG)) {
    console.log(`📚 Processing: ${subjectName}`);

    const chapters: ChapterData[] = [];

    for (const chapterFile of config.chapters) {
      const filePath = path.join(BASE_SOURCE_DIR, subjectName, chapterFile);

      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  File not found: ${chapterFile}`);
        continue;
      }

      const chapter = parseChapterFile(filePath);
      chapters.push(chapter);
      totalQuestions += chapter.questions.length;
      console.log(`  ✅ ${chapter.title}: ${chapter.questions.length} questions`);
    }

    subjects.push({
      title: subjectName,
      description: config.description,
      chapters
    });
  }

  const seedData: SeedData = {
    semester: 'PCEP2',
    subjects,
    exportedAt: new Date().toISOString(),
    totalQuestions
  };

  // Créer le dossier si nécessaire
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(seedData, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Export complete!`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log(`📊 Total: ${totalQuestions} questions`);
  console.log('='.repeat(50));
}

exportPCEP2Seed();
