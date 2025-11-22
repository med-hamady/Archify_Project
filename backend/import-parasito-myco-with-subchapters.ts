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

interface Chapter {
  title: string;
  description: string;
  subChapters: SubChapter[];
  orderIndex: number;
}

const SUBJECT_TITLE = 'Parasito-myco Ba Ousmane';
const SUBJECT_DESCRIPTION = 'Parasitologie et Mycologie - Ba Ousmane';
const SEMESTER = 'DCEM1';
const SOURCE_FOLDER = path.join(__dirname, 'data', 'parasito-myco');

function parseFileWithSubChapters(content: string, chapterTitle: string): SubChapter[] {
  const subChapters: SubChapter[] = [];
  const lines = content.split('\n');

  let currentSubChapter: Partial<SubChapter> | null = null;
  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: any[] = [];
  let currentExplanation: string[] = [];
  let questionIndex = 0;
  let subChapterIndex = 0;
  let inExplanation = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Détection d'un nouveau sous-chapitre (A., B., C., etc.) - doit être sur sa propre ligne et pas une option de QCM
    // Un sous-chapitre ne contient pas de symboles de réponse ✅ ou ❌ et pas de justification →
    const isSubChapter = line.match(/^[A-Z]\.\s+.+$/) && !line.includes('✅') && !line.includes('❌') && !line.includes('→') && !line.includes('(❌)') && !line.includes('(✅)');

    if (isSubChapter) {
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

async function importParasitoMycoWithSubChapters() {
  console.log('🚀 Début de l\'importation de Parasito-myco Ba Ousmane avec sous-chapitres pour DCEM1...\n');

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
      // Supprimer les anciennes données
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
    let totalSubChapters = 0;
    let chapterIndex = 0;

    for (const file of files) {
      const filePath = path.join(SOURCE_FOLDER, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Le nom du fichier sans extension devient le titre du chapitre principal
      const mainChapterTitle = file.replace('.txt', '');

      console.log(`\n📖 Traitement du chapitre: ${mainChapterTitle}`);

      // Parser les sous-chapitres
      const subChapters = parseFileWithSubChapters(content, mainChapterTitle);

      if (subChapters.length === 0) {
        console.log(`   ⚠️  Aucun sous-chapitre trouvé, chapitre ignoré.\n`);
        continue;
      }

      // Créer les sous-chapitres
      for (const subChapter of subChapters) {
        if (subChapter.questions.length === 0) {
          console.log(`   ⚠️  Sous-chapitre "${subChapter.title}" sans questions, ignoré.`);
          continue;
        }

        const fullChapterTitle = `${mainChapterTitle} - ${subChapter.title}`;

        console.log(`   📑 Sous-chapitre: ${subChapter.title}`);

        // Créer le chapitre dans la base de données
        const chapter = await prisma.chapter.create({
          data: {
            title: fullChapterTitle,
            description: `${mainChapterTitle}: ${subChapter.title}`,
            subjectId: subject.id,
            orderIndex: chapterIndex++
          }
        });

        // Créer les questions
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
        totalSubChapters++;
        console.log(`      ✅ ${subChapter.questions.length} questions importées`);
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
    console.log(`📚 Sous-chapitres: ${totalSubChapters}`);
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
importParasitoMycoWithSubChapters()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
