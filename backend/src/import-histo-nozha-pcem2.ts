/**
 * Import Script - Histo Nozha PCEM2
 *
 * Importe les 7 fichiers d'examen d'histologie pour PCEM2
 * Total: 249 QCMs avec support des réponses à 3 états (✅❌⚠️)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

// Chemin relatif pour fonctionner en local ET en production
const SOURCE_DIR = path.join(__dirname, '..', 'data', 'histo-nozha');

const FILES = [
  'Exam glandes endocrines isolé.txt',
  'Exam système digestif isolé.txt',
  'Exam système lymphoïde isolé.txt',
  'Exam système respiratoire isolé.txt',
  'Exam système tégumentaire isolé.txt',
  'Examen  Appareil urinaire isolé.txt', // Note: double space
  'Examen  Glandes annexes isolé.txt'    // Note: double space
];

// Mapping des noms de fichiers vers noms de chapitres
const FILE_TO_CHAPTER: Record<string, string> = {
  'Exam glandes endocrines isolé.txt': 'Glandes endocrines',
  'Exam système digestif isolé.txt': 'Système digestif',
  'Exam système lymphoïde isolé.txt': 'Système lymphoïde',
  'Exam système respiratoire isolé.txt': 'Système respiratoire',
  'Exam système tégumentaire isolé.txt': 'Système tégumentaire',
  'Examen  Appareil urinaire isolé.txt': 'Appareil urinaire',
  'Examen  Glandes annexes isolé.txt': 'Glandes annexes'
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
  section: string | null; // A, B, C, etc.
}

interface ParsedChapterSection {
  sectionName: string; // "A – HYPOPHYSE"
  questions: ParsedQuestion[];
}

interface ParsedFile {
  fileName: string;
  chapterName: string;
  sections: ParsedChapterSection[];
  allQuestions: ParsedQuestion[];
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
 * Supporte deux formats:
 * - "A. Texte (✅/❌/⚠️) → Justification"
 * - "A-Texte ✅/❌/⚠️ → Justification"
 */
function parseOption(line: string): ParsedOption | null {
  // Format 1: "A. Texte ..."
  let match = line.match(/^([A-F])\.\s+(.+?)(?:\s*\((?:✅|❌|⚠️)\))?\s*(?:→\s*(.+))?$/);

  // Format 2: "A-Texte ..."
  if (!match) {
    match = line.match(/^([A-F])-(.+?)(?:\s+(?:✅|❌|⚠️))?\s*(?:→\s*(.+))?$/);
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

/**
 * Parse un fichier complet
 */
function parseFile(filePath: string, fileName: string): ParsedFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const chapterName = FILE_TO_CHAPTER[fileName] || fileName.replace('.txt', '');
  const sections: ParsedChapterSection[] = [];
  const allQuestions: ParsedQuestion[] = [];

  let currentSection: string | null = null;
  let currentSectionName: string | null = null;
  let currentQuestion: ParsedQuestion | null = null;
  let currentOptions: ParsedOption[] = [];
  let currentExplanation: string[] = [];
  let currentQuestionTextLines: string[] = [];
  let inConclusion = false;
  let awaitingQuestionText = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détection de section (A –, B –, C –, A-, B-, etc.)
    const sectionMatch = line.match(/^([A-Z])\s*[–—-]\s*(.+)$/);
    if (sectionMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        allQuestions.push(currentQuestion);

        // Ajouter à la section
        if (currentSectionName) {
          let section = sections.find(s => s.sectionName === currentSectionName);
          if (!section) {
            section = { sectionName: currentSectionName, questions: [] };
            sections.push(section);
          }
          section.questions.push(currentQuestion);
        }
      }

      currentSection = sectionMatch[1];
      currentSectionName = line;
      currentQuestion = null;
      currentOptions = [];
      currentExplanation = [];
      currentQuestionTextLines = [];
      inConclusion = false;
      awaitingQuestionText = false;
      continue;
    }

    // Détection de QCM (peut être sur 2 lignes)
    const qcmMatch = line.match(/^QCM\s+(\d+)\s+[—–-](?:\s+(.+?)\s*:?)?$/);
    if (qcmMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        allQuestions.push(currentQuestion);

        if (currentSectionName) {
          let section = sections.find(s => s.sectionName === currentSectionName);
          if (!section) {
            section = { sectionName: currentSectionName, questions: [] };
            sections.push(section);
          }
          section.questions.push(currentQuestion);
        }
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
      awaitingQuestionText = !questionText; // Si pas de texte après —, on attend la ligne suivante
      continue;
    }

    // Si on attend le texte de la question (QCM sur 2 lignes)
    if (awaitingQuestionText && currentQuestion && !currentQuestion.questionText) {
      // Continuer à accumuler le texte jusqu'à trouver une ligne option (A-/B-) ou vide
      if (/^[A-F][-.]/.test(line)) {
        // C'est une option, donc la question est terminée
        currentQuestion.questionText = currentQuestionTextLines.join(' ').trim().replace(/:$/, '');
        awaitingQuestionText = false;
        // Continuer le traitement de cette ligne comme option
      } else if (line.length > 0 && !line.includes('🩵')) {
        currentQuestionTextLines.push(line);
        continue;
      } else {
        // Ligne vide ou conclusion, on termine la question
        currentQuestion.questionText = currentQuestionTextLines.join(' ').trim().replace(/:$/, '');
        awaitingQuestionText = false;
        if (line.length === 0) continue;
      }
    }

    // Détection de conclusion
    if (line.includes('🩵 Conclusion')) {
      inConclusion = true;
      continue;
    }

    // Si on est dans une conclusion, ajouter à l'explication
    if (inConclusion && currentQuestion) {
      currentExplanation.push(line);
      continue;
    }

    // Détection d'option (A., B., C., A-, B-, etc.)
    if (currentQuestion && /^[A-F][-.]/.test(line)) {
      const option = parseOption(line);
      if (option) {
        currentOptions.push(option);
      }
      continue;
    }
  }

  // Sauvegarder la dernière question
  if (currentQuestion) {
    currentQuestion.options = currentOptions;
    currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
    allQuestions.push(currentQuestion);

    if (currentSectionName) {
      let section = sections.find(s => s.sectionName === currentSectionName);
      if (!section) {
        section = { sectionName: currentSectionName, questions: [] };
        sections.push(section);
      }
      section.questions.push(currentQuestion);
    }
  }

  return {
    fileName,
    chapterName,
    sections,
    allQuestions
  };
}

// ============================================
// FONCTIONS D'IMPORT EN BASE DE DONNÉES
// ============================================

async function importToDatabase() {
  console.log('🚀 Début de l\'import Histo Nozha PCEM2\n');

  try {
    // 0. Vérifier si les fichiers source existent (pour éviter erreur en production)
    if (!fs.existsSync(SOURCE_DIR)) {
      console.log('⚠️  Dossier source non trouvé:', SOURCE_DIR);
      console.log('   Import ignoré (normal en production sur Render.com).\n');
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

      console.log('✅ Données Histo PCEM2 déjà présentes:');
      console.log(`   📚 Matière: ${subject.title}`);
      console.log(`   📑 Chapitres: ${subject.chapters.length}`);
      console.log(`   ❓ Questions: ${totalQuestions}`);
      console.log('\n⏭️  Import ignoré pour éviter les doublons.\n');

      if (totalQuestions < 249) {
        console.log('⚠️  ATTENTION: Nombre de questions inférieur à 249.');
        console.log('   Pour réimporter: npm run clear:histo:pcem2 && npm run import:histo:pcem2\n');
      }

      return;
    }

    // Créer la matière si elle n'existe pas
    if (!subject) {
      const newSubject = await prisma.subject.create({
        data: {
          title: 'Histologie',
          semester: 'PCEM2',
          description: 'Étude microscopique des tissus et organes - PCEM2',
          tags: ['Histologie', 'PCEM2']
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

    // 2. Pour chaque fichier
    for (const fileName of FILES) {
      const filePath = path.join(SOURCE_DIR, fileName);

      console.log(`\n📄 Traitement: ${fileName}`);

      if (!fs.existsSync(filePath)) {
        console.log(`❌ Fichier non trouvé: ${filePath}`);
        continue;
      }

      // Parser le fichier
      const parsedFile = parseFile(filePath, fileName);
      console.log(`   📊 ${parsedFile.allQuestions.length} questions trouvées`);
      console.log(`   📑 ${parsedFile.sections.length} sections détectées`);

      // 3. Créer ou trouver le chapitre principal
      let mainChapter = await prisma.chapter.findFirst({
        where: {
          subjectId: subject.id,
          title: parsedFile.chapterName
        }
      });

      if (!mainChapter) {
        mainChapter = await prisma.chapter.create({
          data: {
            subjectId: subject.id,
            title: parsedFile.chapterName,
            description: `Chapitre ${parsedFile.chapterName} - Histologie PCEM2`,
            orderIndex: FILES.indexOf(fileName)
          }
        });
        console.log(`   ✅ Chapitre créé: ${parsedFile.chapterName}`);
      } else {
        console.log(`   ✅ Chapitre trouvé: ${parsedFile.chapterName}`);
      }

      // 4. Si des sections existent, créer des sous-chapitres
      if (parsedFile.sections.length > 0) {
        for (let sectionIndex = 0; sectionIndex < parsedFile.sections.length; sectionIndex++) {
          const section = parsedFile.sections[sectionIndex];

          let subChapter = await prisma.chapter.findFirst({
            where: {
              subjectId: subject.id,
              title: `${parsedFile.chapterName} - ${section.sectionName}`
            }
          });

          if (!subChapter) {
            subChapter = await prisma.chapter.create({
              data: {
                subjectId: subject.id,
                title: `${parsedFile.chapterName} - ${section.sectionName}`,
                description: section.sectionName,
                orderIndex: FILES.indexOf(fileName) * 100 + sectionIndex
              }
            });
          }

          // Importer les questions de cette section
          for (let qIndex = 0; qIndex < section.questions.length; qIndex++) {
            const question = section.questions[qIndex];

            await prisma.question.create({
              data: {
                chapterId: subChapter.id,
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

          console.log(`      ✅ Section "${section.sectionName}": ${section.questions.length} questions importées`);
        }
      } else {
        // Pas de sections, importer directement dans le chapitre principal
        for (let qIndex = 0; qIndex < parsedFile.allQuestions.length; qIndex++) {
          const question = parsedFile.allQuestions[qIndex];

          await prisma.question.create({
            data: {
              chapterId: mainChapter.id,
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

        console.log(`   ✅ ${parsedFile.allQuestions.length} questions importées`);
      }
    }

    console.log('\n✅ Import terminé avec succès!');
    console.log(`📊 Total: ${totalQuestionsImported} questions importées`);

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

    // En production, ne pas faire échouer le build
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.log('⚠️  Erreur ignorée en production (le serveur va démarrer normalement).\n');
      process.exit(0); // Exit success en production
    } else {
      process.exit(1); // Exit error en développement
    }
  });
