/**
 * Import Script - Histologie PCEM2 (Original)
 *
 * Importe les 10 chapitres d'histologie classique pour PCEM2
 * Total: ~200 QCMs (format différent de Histo Nozha)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

// Chemin relatif pour fonctionner en local ET en production
const SOURCE_DIR = path.join(__dirname, '..', 'data', 'histologie');

// Liste des fichiers (ordre alphanumérique)
const FILES = [
  'Chapitre 1  Histologie de l\'Épit.txt',
  'Chapitre 2  Tissu conjonctif, ca.txt',
  'Chapitre 3  Sang et organes héma.txt',
  'Chapitre 4  Tissu musculaire (sq.txt',
  'Chapitre 5  Tissu nerveux.txt',
  'Chapitre 6  Appareil digestif.txt',
  'Chapitre 7  Appareil respiratoir.txt',
  'Chapitre 8  Appareil urinaire.txt',
  'Chapitre 9  Appareil génital (ma.txt',
  'Chapitre 10  Glandes endocrines.txt'
];

// Mapping des noms de fichiers vers titres de chapitres
const FILE_TO_CHAPTER: Record<string, string> = {
  'Chapitre 1  Histologie de l\'Épit.txt': 'Histologie de l\'Épithélium',
  'Chapitre 2  Tissu conjonctif, ca.txt': 'Tissu conjonctif, cartilagineux et osseux',
  'Chapitre 3  Sang et organes héma.txt': 'Sang et organes hématopoïétiques',
  'Chapitre 4  Tissu musculaire (sq.txt': 'Tissu musculaire',
  'Chapitre 5  Tissu nerveux.txt': 'Tissu nerveux',
  'Chapitre 6  Appareil digestif.txt': 'Appareil digestif',
  'Chapitre 7  Appareil respiratoir.txt': 'Appareil respiratoire',
  'Chapitre 8  Appareil urinaire.txt': 'Appareil urinaire',
  'Chapitre 9  Appareil génital (ma.txt': 'Appareil génital',
  'Chapitre 10  Glandes endocrines.txt': 'Glandes endocrines'
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

interface ParsedFile {
  fileName: string;
  chapterName: string;
  allQuestions: ParsedQuestion[];
}

// ============================================
// FONCTIONS DE PARSING
// ============================================

/**
 * Détecte l'état de la réponse à partir des symboles ✔️❌⚠️
 */
function detectAnswerState(text: string): 'correct' | 'incorrect' | 'partial' {
  if (text.includes('✔️') || text.includes('✅')) return 'correct';
  if (text.includes('⚠️')) return 'partial';
  return 'incorrect'; // Par défaut ou si ❌
}

/**
 * Parse une option (ligne A., B., C., etc.)
 */
function parseOption(line: string): ParsedOption | null {
  // Format: "A. Texte ✔️" ou "A. Texte ❌ — Justification"
  const match = line.match(/^([A-F])\.\s+(.+?)(?:\s+([✔️❌⚠️✅]))?(?:\s*—\s*(.+))?$/);

  if (!match) return null;

  let fullText = match[2] || '';
  const justification = match[4]?.trim() || null;
  const answerState = detectAnswerState(line);

  // Nettoyer tous les symboles de réponse du texte de l'option
  // Enlever checkmarks, croix, warnings à la fin du texte
  fullText = fullText
    .replace(/\s*✔️?\s*$/g, '')  // ✔️ ou ✔
    .replace(/\s*❌\s*$/g, '')    // ❌
    .replace(/\s*⚠️?\s*$/g, '')  // ⚠️ ou ⚠
    .replace(/\s*✅\s*$/g, '')    // ✅
    .trim();

  return {
    text: fullText,
    answerState,
    justification
  };
}

/**
 * Parse un fichier Histologie
 * Format : sections avec emoji (1️⃣, 2️⃣) puis options A-E avec justifications
 */
function parseFile(filePath: string, fileName: string): ParsedFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Try to get chapter name from mapping, or extract from filename
  let chapterName = FILE_TO_CHAPTER[fileName];

  if (!chapterName) {
    // Extract from filename: "Chapitre X  Title.txt" -> "Title"
    const match = fileName.match(/Chapitre\s+\d+\s+(.+)\.txt/);
    chapterName = match ? match[1].trim() : fileName.replace('.txt', '');
  }
  const allQuestions: ParsedQuestion[] = [];

  let currentQuestion: ParsedQuestion | null = null;
  let currentOptions: ParsedOption[] = [];
  let currentExplanation: string | null = null;
  let currentQuestionText = '';
  let questionNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détection de section emoji (1️⃣, 2️⃣, etc.) = nouveau QCM
    const emojiMatch = line.match(/^([0-9]+)️⃣\s+(.+)$/);
    if (emojiMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation;
        allQuestions.push(currentQuestion);
      }

      questionNumber++;
      const sectionTitle = emojiMatch[2];

      currentQuestion = {
        questionNumber,
        questionText: sectionTitle, // Titre de la section comme question
        options: [],
        explanation: null
      };
      currentOptions = [];
      currentExplanation = null;
      currentQuestionText = '';
      continue;
    }

    // Détection de "Question :" (texte détaillé optionnel)
    if (line.startsWith('Question :')) {
      const questionText = line.replace('Question :', '').trim();
      if (currentQuestion && questionText) {
        currentQuestion.questionText = questionText;
      }
      continue;
    }

    // Détection de justification
    if (line.startsWith('Justification :')) {
      currentExplanation = line.replace('Justification :', '').trim();
      continue;
    }

    // Détection d'option (A., B., C., etc.)
    if (currentQuestion && /^[A-F]\./.test(line)) {
      const option = parseOption(line);
      if (option) {
        currentOptions.push(option);
      }
      continue;
    }
  }

  // Sauvegarder la dernière question
  if (currentQuestion && currentOptions.length > 0) {
    currentQuestion.options = currentOptions;
    currentQuestion.explanation = currentExplanation;
    allQuestions.push(currentQuestion);
  }

  return {
    fileName,
    chapterName,
    allQuestions
  };
}

// ============================================
// FONCTIONS D'IMPORT EN BASE DE DONNÉES
// ============================================

async function importToDatabase() {
  console.log('🚀 Début de l\'import Histologie PCEM2\n');

  try {
    // 0. Vérifier si les fichiers source existent
    if (!fs.existsSync(SOURCE_DIR)) {
      console.log('⚠️  Dossier source non trouvé:', SOURCE_DIR);
      console.log('   Import ignoré (normal en production).\n');
      return;
    }

    // 1. Trouver ou créer la matière "Histologie" pour PCEM2
    console.log('📚 Recherche/création de la matière Histologie...');

    let subject = await prisma.subject.findFirst({
      where: {
        title: 'Histologie',
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          include: {
            questions: true
          }
        }
      }
    });

    // Vérifier si les données existent déjà
    if (subject && subject.chapters.length > 0) {
      const totalQuestions = subject.chapters.reduce((sum, ch) => sum + ch.questions.length, 0);

      console.log('✅ Données Histologie PCEM2 déjà présentes:');
      console.log(`   📚 Matière: ${subject.title}`);
      console.log(`   📑 Chapitres: ${subject.chapters.length}`);
      console.log(`   ❓ Questions: ${totalQuestions}`);
      console.log('\n⏭️  Import ignoré pour éviter les doublons.\n');

      if (totalQuestions < 190) {
        console.log('⚠️  ATTENTION: Nombre de questions inférieur à 190.');
        console.log('   Pour réimporter: supprimer manuellement les chapitres\n');
      }

      return;
    }

    // Créer la matière si elle n'existe pas
    if (!subject) {
      const newSubject = await prisma.subject.create({
        data: {
          title: 'Histologie',
          semester: 'PCEM2',
          description: 'Histologie classique - PCEM2 (~200 QCMs)',
          tags: ['Histologie', 'PCEM2', 'Cours classique']
        }
      });
      console.log('✅ Matière "Histologie" créée');

      // Re-fetch avec include pour uniformité
      subject = await prisma.subject.findUnique({
        where: { id: newSubject.id },
        include: {
          chapters: { include: { questions: true } }
        }
      });

      if (!subject) {
        throw new Error('Impossible de récupérer la matière créée');
      }
    } else {
      console.log('✅ Matière "Histologie" trouvée (vide, import en cours...)');
    }

    let totalQuestionsImported = 0;

    // 2. Lire les fichiers réellement présents dans le dossier
    const actualFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.txt')).sort();

    console.log(`\n📁 ${actualFiles.length} fichiers trouvés\n`);

    // 3. Pour chaque fichier
    for (let i = 0; i < actualFiles.length; i++) {
      const fileName = actualFiles[i];
      const filePath = path.join(SOURCE_DIR, fileName);

      console.log(`📄 Traitement [${i + 1}/${actualFiles.length}]: ${fileName}`);

      if (!fs.existsSync(filePath)) {
        console.log(`   ❌ Fichier non trouvé: ${filePath}`);
        continue;
      }

      // Parser le fichier
      const parsedFile = parseFile(filePath, fileName);
      console.log(`   📊 ${parsedFile.allQuestions.length} questions trouvées`);

      // 4. Créer le chapitre
      const chapter = await prisma.chapter.create({
        data: {
          subjectId: subject.id,
          title: parsedFile.chapterName,
          description: `Chapitre ${parsedFile.chapterName} - Histologie PCEM2`,
          orderIndex: i // Utiliser l'index réel du fichier
        }
      });
      console.log(`   ✅ Chapitre créé: ${parsedFile.chapterName}`);

      // 4. Importer les questions
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
              isCorrect: opt.answerState === 'correct', // true/false
              isPartial: opt.answerState === 'partial', // true for partial answers
              justification: opt.justification
            }))
          }
        });

        totalQuestionsImported++;
      }

      console.log(`   ✅ ${parsedFile.allQuestions.length} questions importées`);
    }

    console.log('\n✅ Import terminé avec succès!');
    console.log(`📊 Total: ${totalQuestionsImported} questions importées dans "Histologie"`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// EXÉCUTION
// ============================================

importToDatabase()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur lors de l\'import:', error);
    process.exit(1);
  });
