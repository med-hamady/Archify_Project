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

interface Chapter {
  title: string;
  description: string;
  questions: Question[];
  orderIndex: number;
}

const SUBJECT_TITLE = 'Parasito-myco Ba Ousmane';
const SUBJECT_DESCRIPTION = 'Parasitologie et Mycologie - Ba Ousmane';
const SEMESTER = 'DCEM1';
const SOURCE_FOLDER = path.join(__dirname, 'data', 'parasito-myco');

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

async function importParasitoMyco() {
  console.log('🚀 Début de l\'importation de Parasito-myco Ba Ousmane pour DCEM1...\n');

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
    let chapterIndex = 0;

    for (const file of files) {
      const filePath = path.join(SOURCE_FOLDER, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Le nom du fichier sans extension devient le titre du chapitre
      const chapterTitle = file.replace('.txt', '');

      console.log(`📖 Traitement du chapitre: ${chapterTitle}`);

      // Parser les questions
      const questions = parseQCMFile(content, chapterTitle);

      if (questions.length === 0) {
        console.log(`   ⚠️  Aucune question trouvée, chapitre ignoré.\n`);
        continue;
      }

      // Créer le chapitre
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterTitle,
          description: `Questions de ${chapterTitle}`,
          subjectId: subject.id,
          orderIndex: chapterIndex++
        }
      });

      // Créer les questions
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
      console.log(`   ✅ ${questions.length} questions importées\n`);
    }

    // Mettre à jour le total de QCM de la matière
    await prisma.subject.update({
      where: { id: subject.id },
      data: { totalQCM: totalQuestions }
    });

    console.log('═══════════════════════════════════════');
    console.log(`✅ IMPORTATION TERMINÉE !`);
    console.log(`📊 Matière: ${SUBJECT_TITLE}`);
    console.log(`📚 Chapitres: ${chapterIndex}`);
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
importParasitoMyco()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
