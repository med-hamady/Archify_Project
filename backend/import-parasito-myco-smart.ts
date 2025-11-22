import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Question {
  questionText: string;
  options: {
    text: string;
    isCorrect: boolean;
    justification: string | null;
  }[];
  explanation: string | null;
  orderIndex: number;
}

interface SubChapter {
  title: string;
  questions: Question[];
  orderIndex: number;
}

const SUBJECT_TITLE = 'Parasito-myco Ba Ousmane';
const SUBJECT_DESCRIPTION = 'Parasitologie et Mycologie - Ba Ousmane';
const SEMESTER = 'DCEM1';
const SOURCE_FOLDER = path.join(__dirname, 'data', 'parasito-myco');

// Détecte si une ligne est un vrai sous-chapitre (et pas une option de QCM ou conclusion)
function isRealSubChapter(line: string, nextLines: string[], previousLines: string[]): boolean {
  // Doit commencer par une lettre A-J suivie d'un point (les sous-chapitres sont généralement A., B., C., etc.)
  // On exclut les autres lettres comme T., H., P. qui peuvent apparaître dans les conclusions
  if (!line.match(/^[A-J]\.\s+/)) {
    return false;
  }

  // Ne doit pas contenir de symboles de réponse
  if (line.includes('✅') || line.includes('❌') || line.includes('→') ||
      line.includes('(❌)') || line.includes('(✅)')) {
    return false;
  }

  // Ne doit PAS apparaître après une ligne de conclusion (contenant 🩵 ou "Conclusion")
  const hasConclusionBefore = previousLines.some(l => l.includes('🩵') || l.includes('Conclusion'));
  if (hasConclusionBefore) {
    return false;
  }

  // Un vrai sous-chapitre est suivi (dans les 5 prochaines lignes) d'un "QCM"
  // et PAS suivi immédiatement d'une autre option (B., C., D.)
  const nextNonEmptyLine = nextLines.find(l => l.trim() !== '');

  if (nextNonEmptyLine) {
    // Si la ligne suivante est une option B., C., D., alors la ligne actuelle est une option de QCM
    if (nextNonEmptyLine.match(/^[B-E]\./)) {
      return false;
    }
  }

  // Vérifier si un QCM apparaît dans les prochaines lignes (critère déterminant)
  const hasQCMAfter = nextLines.some(l => l.match(/^QCM\s+\d+/i));

  return hasQCMAfter;
}

// Détecte si un fichier contient des sous-chapitres
function hasSubChapters(content: string): boolean {
  const lines = content.split('\n').map(l => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLines = lines.slice(i + 1, i + 5);
    const previousLines = lines.slice(Math.max(0, i - 3), i);

    if (isRealSubChapter(line, nextLines, previousLines)) {
      return true;
    }
  }

  return false;
}

// Parse un fichier SANS sous-chapitres (directement des QCM)
function parseQCMFile(content: string, chapterTitle: string): Question[] {
  const questions: Question[] = [];
  const lines = content.split('\n');

  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: any[] = [];
  let currentExplanation: string[] = [];
  let questionIndex = 0;
  let inExplanation = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Détection du début d'un QCM
    if (line.match(/^QCM\s+\d+/i)) {
      // Sauvegarder la question précédente si elle existe
      if (currentQuestion && currentQuestion.questionText) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        currentQuestion.orderIndex = questionIndex++;
        questions.push(currentQuestion as Question);
      }

      // Réinitialiser pour la nouvelle question
      currentQuestion = { questionText: '', options: [], explanation: null, orderIndex: 0 };
      currentOptions = [];
      currentExplanation = [];
      inExplanation = false;
      continue;
    }

    // Détection de la question (ligne numérotée)
    if (currentQuestion && line.match(/^\d+[\s\.\-–—]+/)) {
      const questionMatch = line.match(/^\d+[\s\.\-–—]+(.+)/);
      if (questionMatch) {
        currentQuestion.questionText = questionMatch[1].trim();
      }
      continue;
    }

    // Détection des options (A., B., C., D., E.)
    if (currentQuestion && line.match(/^[A-E][\.\)]/)) {
      const optionMatch = line.match(/^([A-E])[\.\)]\s*(.+)/);
      if (optionMatch) {
        const letter = optionMatch[1];
        let optionText = optionMatch[2].trim();

        // Vérifier si c'est correct (✅) ou incorrect (❌)
        const isCorrect = optionText.includes('✅') || optionText.includes('(✅)');
        const hasJustification = optionText.includes('→');

        // Nettoyer le texte
        optionText = optionText.replace(/\(✅\)/g, '').replace(/✅/g, '').replace(/\(❌\)/g, '').replace(/❌/g, '').trim();

        // Extraire la justification si présente
        let justification: string | null = null;
        if (hasJustification) {
          const parts = optionText.split('→');
          optionText = parts[0].trim();
          justification = parts.slice(1).join('→').trim();
        }

        currentOptions.push({
          text: optionText,
          isCorrect,
          justification
        });
      }
      continue;
    }

    // Détection de l'explication (ligne commençant par 🩵)
    if (line.startsWith('🩵')) {
      inExplanation = true;
      const explanationText = line.replace(/🩵\s*(Conclusion\s*:)?/i, '').trim();
      if (explanationText) {
        currentExplanation.push(explanationText);
      }
      continue;
    }

    // Continuer l'explication si on est dedans
    if (inExplanation && line && !line.match(/^QCM\s+\d+/i) && !line.match(/^[A-E][\.\)]/)) {
      currentExplanation.push(line);
      continue;
    }

    // Ajouter le texte de la question si elle est en cours et que ce n'est pas une ligne vide
    if (currentQuestion && currentQuestion.questionText && line && !inExplanation) {
      currentQuestion.questionText += ' ' + line;
    }
  }

  // Ajouter la dernière question
  if (currentQuestion && currentQuestion.questionText) {
    currentQuestion.options = currentOptions;
    currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
    currentQuestion.orderIndex = questionIndex;
    questions.push(currentQuestion as Question);
  }

  return questions;
}

// Parse un fichier AVEC sous-chapitres
function parseFileWithSubChapters(content: string, chapterTitle: string): SubChapter[] {
  const subChapters: SubChapter[] = [];
  const lines = content.split('\n').map(l => l.trim());

  let currentSubChapter: Partial<SubChapter> | null = null;
  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: any[] = [];
  let currentExplanation: string[] = [];
  let questionIndex = 0;
  let subChapterIndex = 0;
  let inExplanation = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLines = lines.slice(i + 1, i + 5);
    const previousLines = lines.slice(Math.max(0, i - 3), i);

    // Détection d'un nouveau sous-chapitre
    if (isRealSubChapter(line, nextLines, previousLines)) {
      // Sauvegarder la question précédente si elle existe
      if (currentQuestion && currentQuestion.questionText && currentSubChapter) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        currentQuestion.orderIndex = questionIndex++;
        if (!currentSubChapter.questions) {
          currentSubChapter.questions = [];
        }
        currentSubChapter.questions.push(currentQuestion as Question);
      }

      // Sauvegarder le sous-chapitre précédent s'il existe
      if (currentSubChapter && currentSubChapter.title) {
        currentSubChapter.orderIndex = subChapterIndex++;
        subChapters.push(currentSubChapter as SubChapter);
      }

      // Créer un nouveau sous-chapitre
      const subChapterMatch = line.match(/^([A-Z])\.\s+(.+)/);
      if (subChapterMatch) {
        currentSubChapter = {
          title: subChapterMatch[2].trim(),
          questions: [],
          orderIndex: 0
        };
        questionIndex = 0;
        currentQuestion = null;
        currentOptions = [];
        currentExplanation = [];
        inExplanation = false;
      }
      continue;
    }

    // Si pas encore de sous-chapitre, ignorer (titre principal du fichier)
    if (!currentSubChapter) {
      continue;
    }

    // Détection du début d'un QCM
    if (line.match(/^QCM\s+\d+/i)) {
      // Sauvegarder la question précédente si elle existe
      if (currentQuestion && currentQuestion.questionText) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        currentQuestion.orderIndex = questionIndex++;
        if (!currentSubChapter.questions) {
          currentSubChapter.questions = [];
        }
        currentSubChapter.questions.push(currentQuestion as Question);
      }

      // Réinitialiser pour la nouvelle question
      currentQuestion = { questionText: '', options: [], explanation: null, orderIndex: 0 };
      currentOptions = [];
      currentExplanation = [];
      inExplanation = false;
      continue;
    }

    // Détection de la question (ligne numérotée)
    if (currentQuestion && line.match(/^\d+[\s\.\-–—]+/)) {
      const questionMatch = line.match(/^\d+[\s\.\-–—]+(.+)/);
      if (questionMatch) {
        currentQuestion.questionText = questionMatch[1].trim();
      }
      continue;
    }

    // Détection des options (A., B., C., D., E.)
    if (currentQuestion && line.match(/^[A-E][\.\)]/)) {
      const optionMatch = line.match(/^([A-E])[\.\)]\s*(.+)/);
      if (optionMatch) {
        const letter = optionMatch[1];
        let optionText = optionMatch[2].trim();

        const isCorrect = optionText.includes('✅') || optionText.includes('(✅)');
        const hasJustification = optionText.includes('→');

        optionText = optionText.replace(/\(✅\)/g, '').replace(/✅/g, '').replace(/\(❌\)/g, '').replace(/❌/g, '').trim();

        let justification: string | null = null;
        if (hasJustification) {
          const parts = optionText.split('→');
          optionText = parts[0].trim();
          justification = parts.slice(1).join('→').trim();
        }

        currentOptions.push({
          text: optionText,
          isCorrect,
          justification
        });
      }
      continue;
    }

    // Détection de l'explication
    if (line.startsWith('🩵')) {
      inExplanation = true;
      const explanationText = line.replace(/🩵\s*(Conclusion\s*:)?/i, '').trim();
      if (explanationText) {
        currentExplanation.push(explanationText);
      }
      continue;
    }

    // Continuer l'explication
    if (inExplanation && line && !line.match(/^QCM\s+\d+/i) && !line.match(/^[A-E][\.\)]/)) {
      currentExplanation.push(line);
      continue;
    }

    // Ajouter le texte de la question
    if (currentQuestion && currentQuestion.questionText && line && !inExplanation) {
      currentQuestion.questionText += ' ' + line;
    }
  }

  // Ajouter la dernière question
  if (currentQuestion && currentQuestion.questionText && currentSubChapter) {
    currentQuestion.options = currentOptions;
    currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
    currentQuestion.orderIndex = questionIndex;
    if (!currentSubChapter.questions) {
      currentSubChapter.questions = [];
    }
    currentSubChapter.questions.push(currentQuestion as Question);
  }

  // Ajouter le dernier sous-chapitre
  if (currentSubChapter && currentSubChapter.title) {
    currentSubChapter.orderIndex = subChapterIndex;
    subChapters.push(currentSubChapter as SubChapter);
  }

  return subChapters;
}

async function importParasitoMycoSmart() {
  console.log('🚀 Début de l\'importation intelligente de Parasito-myco Ba Ousmane pour DCEM1...\n');

  try {
    // Vérifier si la matière existe déjà
    let subject = await prisma.subject.findFirst({
      where: {
        title: SUBJECT_TITLE,
        semester: SEMESTER
      }
    });

    if (subject) {
      console.log('⚠️  La matière existe déjà. Suppression des anciennes données...');
      await prisma.question.deleteMany({
        where: {
          chapter: {
            subjectId: subject.id
          }
        }
      });
      await prisma.chapter.deleteMany({
        where: {
          subjectId: subject.id
        }
      });
      await prisma.subject.delete({
        where: { id: subject.id }
      });
      console.log('✅ Anciennes données supprimées.\n');
    }

    // Créer la nouvelle matière
    subject = await prisma.subject.create({
      data: {
        title: SUBJECT_TITLE,
        description: SUBJECT_DESCRIPTION,
        semester: SEMESTER,
        totalQCM: 0
      }
    });

    console.log(`✅ Matière créée: ${SUBJECT_TITLE} (${SEMESTER})\n`);

    // Lire tous les fichiers du dossier
    const files = fs.readdirSync(SOURCE_FOLDER).filter(f => f.endsWith('.txt'));
    console.log(`📁 ${files.length} fichiers trouvés\n`);

    let totalQuestions = 0;
    let totalChapters = 0;
    let chapterIndex = 0;

    for (const file of files) {
      const filePath = path.join(SOURCE_FOLDER, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const mainChapterTitle = file.replace('.txt', '');

      console.log(`\n📖 Traitement: ${mainChapterTitle}`);

      // Détecter si le fichier a des sous-chapitres
      if (hasSubChapters(content)) {
        console.log(`   ℹ️  Structure: AVEC sous-chapitres`);
        const subChapters = parseFileWithSubChapters(content, mainChapterTitle);

        if (subChapters.length === 0) {
          console.log(`   ⚠️  Aucun sous-chapitre trouvé, chapitre ignoré.\n`);
          continue;
        }

        for (const subChapter of subChapters) {
          if (subChapter.questions.length === 0) {
            console.log(`   ⚠️  Sous-chapitre "${subChapter.title}" sans questions, ignoré.`);
            continue;
          }

          const fullChapterTitle = `${mainChapterTitle} - ${subChapter.title}`;

          const chapter = await prisma.chapter.create({
            data: {
              title: fullChapterTitle,
              description: `${mainChapterTitle}: ${subChapter.title}`,
              subjectId: subject.id,
              orderIndex: chapterIndex++
            }
          });

          for (const question of subChapter.questions) {
            await prisma.question.create({
              data: {
                questionText: question.questionText,
                options: question.options,
                explanation: question.explanation,
                chapterId: chapter.id,
                orderIndex: question.orderIndex
              }
            });
          }

          totalQuestions += subChapter.questions.length;
          totalChapters++;
          console.log(`   ✅ ${subChapter.title} (${subChapter.questions.length} questions)`);
        }
      } else {
        console.log(`   ℹ️  Structure: SANS sous-chapitres (direct)`);
        const questions = parseQCMFile(content, mainChapterTitle);

        if (questions.length === 0) {
          console.log(`   ⚠️  Aucune question trouvée, chapitre ignoré.\n`);
          continue;
        }

        const chapter = await prisma.chapter.create({
          data: {
            title: mainChapterTitle,
            description: `Questions de ${mainChapterTitle}`,
            subjectId: subject.id,
            orderIndex: chapterIndex++
          }
        });

        for (const question of questions) {
          await prisma.question.create({
            data: {
              questionText: question.questionText,
              options: question.options,
              explanation: question.explanation,
              chapterId: chapter.id,
              orderIndex: question.orderIndex
            }
          });
        }

        totalQuestions += questions.length;
        totalChapters++;
        console.log(`   ✅ ${questions.length} questions importées`);
      }
    }

    // Mettre à jour le total de QCM de la matière
    await prisma.subject.update({
      where: { id: subject.id },
      data: { totalQCM: totalQuestions }
    });

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ IMPORTATION TERMINÉE !`);
    console.log(`📊 Matière: ${SUBJECT_TITLE}`);
    console.log(`📚 Chapitres: ${totalChapters}`);
    console.log(`❓ Questions totales: ${totalQuestions}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'import
importParasitoMycoSmart()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
