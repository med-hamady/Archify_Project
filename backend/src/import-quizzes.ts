import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuizOption {
  text: string;
  isCorrect: boolean;
  justification?: string;
}

interface ParsedQuestion {
  questionText: string;
  options: QuizOption[];
  explanation?: string;
}

interface ChapterData {
  title: string;
  questions: ParsedQuestion[];
}

/**
 * Parse un fichier quiz et extrait toutes les questions
 */
function parseQuizFile(filePath: string): ChapterData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let chapterTitle = '';
  const questions: ParsedQuestion[] = [];

  let currentQuestion: ParsedQuestion | null = null;
  let currentQuestionText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extraire le titre du chapitre (chercher n'importe quelle ligne avec "Chapitre" dans les 5 premières lignes)
    if (!chapterTitle && i < 5 && line.match(/Chapitre\s+\d+/i)) {
      // Extraire tout ce qui est après "Chapitre X"
      const match = line.match(/(Chapitre\s+\d+[^:]*\s*[:\-–—]\s*)(.+)/i);
      if (match) {
        // Garder le titre complet avec "Chapitre X : ..."
        const chapNum = match[1].match(/\d+/)?.[0];
        chapterTitle = `Chapitre ${chapNum} : ${match[2].trim()}`;
      } else {
        // Si pas de séparateur, prendre toute la ligne après les caractères spéciaux
        chapterTitle = line.replace(/^[^\w\sÀ-ÿ]+\s*/, '').trim();
      }
      continue;
    }

    // Détecter une nouvelle question (ligne commençant par un numéro + emoji)
    // Format 1: "1️⃣ Question : ..." (avec "Question :")
    // Format 2: "1️⃣ Définition générale" (titre de section, question sur ligne suivante)
    const questionMatch = line.match(/^(\d+)️⃣\s*Question\s*:\s*(.+)/);
    if (questionMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      // Créer une nouvelle question
      currentQuestionText = questionMatch[2].trim();
      currentQuestion = {
        questionText: currentQuestionText,
        options: [],
        explanation: undefined
      };
      continue;
    }

    // Format alternatif: ligne commençant par "Question :" sans numéro emoji
    const questionMatch2 = line.match(/^Question\s*:\s*(.+)/);
    if (questionMatch2) {
      // Sauvegarder la question précédente
      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      // Créer une nouvelle question
      currentQuestionText = questionMatch2[1].trim();
      currentQuestion = {
        questionText: currentQuestionText,
        options: [],
        explanation: undefined
      };
      continue;
    }

    // Détecter une option de réponse (A., B., C., etc.)
    const optionMatch = line.match(/^([A-E])\.\s*(.+)/);
    if (optionMatch) {
      // Si on trouve une option A. mais qu'il n'y a pas de question en cours,
      // créer une question avec le dernier titre de section trouvé
      if (!currentQuestion) {
        // Chercher le dernier emoji title dans les lignes précédentes
        let sectionTitle = 'Question sans titre';
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j].trim();
          const sectionMatch = prevLine.match(/^(\d+)️⃣\s*(.+)/);
          if (sectionMatch) {
            sectionTitle = sectionMatch[2].trim();
          }
        }

        currentQuestion = {
          questionText: sectionTitle,
          options: [],
          explanation: undefined
        };
      }

      const optionText = optionMatch[2];

      // Vérifier si c'est une bonne réponse (✔️) ou fausse (❌)
      const isCorrect = optionText.includes('✔️');
      const isWrong = optionText.includes('❌');

      if (isCorrect) {
        // Réponse correcte
        const cleanText = optionText.replace('✔️', '').trim();
        currentQuestion.options.push({
          text: cleanText,
          isCorrect: true
        });
      } else if (isWrong) {
        // Réponse fausse avec justification
        const parts = optionText.split('❌');
        const cleanText = parts[0].trim();

        // Extraire la justification après le "—"
        let justification: string | undefined;
        if (parts[1]) {
          const justParts = parts[1].split('—');
          if (justParts[1]) {
            justification = justParts[1].trim();
          }
        }

        currentQuestion.options.push({
          text: cleanText,
          isCorrect: false,
          justification
        });
      }
      continue;
    }

    // Détecter le commentaire explicatif (ligne avec 💬)
    const commentMatch = line.match(/^💬\s*(.+)/);
    if (commentMatch && currentQuestion) {
      currentQuestion.explanation = commentMatch[1].trim();
      continue;
    }

    // Détecter "Justification :" qui marque la fin d'une question et stocke l'explication
    const justificationMatch = line.match(/^Justification\s*:\s*(.+)/);
    if (justificationMatch && currentQuestion) {
      currentQuestion.explanation = justificationMatch[1].trim();

      // Sauvegarder la question actuelle
      if (currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
      }
      currentQuestion = null; // Reset pour la prochaine question
      continue;
    }
  }

  // Ajouter la dernière question
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return {
    title: chapterTitle,
    questions
  };
}

/**
 * Récupère tous les fichiers .txt dans un dossier
 */
function getQuizFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Dossier non trouvé: ${dirPath}`);
    return [];
  }

  const files = fs.readdirSync(dirPath);
  return files
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(dirPath, file));
}

/**
 * Importe les quiz d'une matière
 */
async function importSubjectQuizzes(
  subjectTitle: string,
  semester: string,
  quizFilesPath: string,
  description?: string
) {
  console.log(`\n📚 Importation de ${subjectTitle} (${semester})...`);

  // Créer ou récupérer la matière
  let subject = await prisma.subject.findFirst({
    where: { title: subjectTitle, semester }
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        title: subjectTitle,
        semester,
        description: description || `Matière ${subjectTitle} pour ${semester}`,
        tags: [subjectTitle.toLowerCase(), semester.toLowerCase()],
        totalQCM: 0 // Sera mis à jour après
      }
    });
    console.log(`✅ Matière créée: ${subject.title}`);
  } else {
    console.log(`✅ Matière existante: ${subject.title}`);
  }

  // Récupérer tous les fichiers quiz
  const quizFiles = getQuizFiles(quizFilesPath);
  console.log(`📝 ${quizFiles.length} fichiers trouvés`);

  let totalQuestions = 0;

  for (const quizFile of quizFiles) {
    const fileName = path.basename(quizFile);
    console.log(`\n  📄 Traitement: ${fileName}`);

    try {
      const chapterData = parseQuizFile(quizFile);

      if (!chapterData.title) {
        console.log(`    ⚠️  Titre de chapitre manquant, skip`);
        continue;
      }

      // Créer ou récupérer le chapitre
      let chapter = await prisma.chapter.findFirst({
        where: {
          subjectId: subject.id,
          title: chapterData.title
        }
      });

      if (!chapter) {
        // Compter les chapitres existants pour l'orderIndex
        const chaptersCount = await prisma.chapter.count({
          where: { subjectId: subject.id }
        });

        chapter = await prisma.chapter.create({
          data: {
            subjectId: subject.id,
            title: chapterData.title,
            orderIndex: chaptersCount,
            description: `${chapterData.questions.length} questions`
          }
        });
        console.log(`    ✅ Chapitre créé: ${chapter.title}`);
      } else {
        console.log(`    ✅ Chapitre existant: ${chapter.title}`);
      }

      // Importer les questions
      for (let i = 0; i < chapterData.questions.length; i++) {
        const q = chapterData.questions[i];

        await prisma.question.create({
          data: {
            chapterId: chapter.id,
            questionText: q.questionText,
            options: q.options as any, // Json type
            explanation: q.explanation,
            difficulty: 'FACILE', // Par défaut, peut être ajusté manuellement
            orderIndex: i
          }
        });
      }

      console.log(`    ✅ ${chapterData.questions.length} questions importées`);
      totalQuestions += chapterData.questions.length;

    } catch (error) {
      console.error(`    ❌ Erreur lors du traitement de ${fileName}:`, error);
    }
  }

  // Mettre à jour le nombre total de questions
  await prisma.subject.update({
    where: { id: subject.id },
    data: { totalQCM: totalQuestions }
  });

  console.log(`\n✅ ${subjectTitle} importé: ${totalQuestions} questions au total\n`);
}

/**
 * Fonction principale d'importation
 */
async function main() {
  console.log('🚀 Début de l\'importation des quiz...\n');

  // Chemin relatif depuis le dossier backend (fonctionnera en local et sur Render)
  const baseDir = path.join(__dirname, '..', 'data', 'quiz');

  try {
    // ===== PCEM1 - S International =====
    console.log('═══════════════════════════════════════');
    console.log('📖 PCEM1 - S International');
    console.log('═══════════════════════════════════════');

    await importSubjectQuizzes(
      'Anatomie',
      'PCEM1',
      path.join(baseDir, 'pcem1', 'anatomie'),
      'Anatomie du membre supérieur et inférieur'
    );

    await importSubjectQuizzes(
      'Histologie',
      'PCEM1',
      path.join(baseDir, 'pcem1', 'histo'),
      'Histologie des tissus et organes'
    );

    await importSubjectQuizzes(
      'Physiologie',
      'PCEM1',
      path.join(baseDir, 'pcem1', 'physio'),
      'Physiologie cellulaire et des systèmes'
    );

    // ===== PCEM2 - S International =====
    console.log('\n═══════════════════════════════════════');
    console.log('📖 PCEM2 - S International');
    console.log('═══════════════════════════════════════');

    await importSubjectQuizzes(
      'Anatomie',
      'PCEM2',
      path.join(baseDir, 'pcem2', 'anatomie'),
      'Anatomie niveau PCEM2'
    );

    await importSubjectQuizzes(
      'Histologie',
      'PCEM2',
      path.join(baseDir, 'pcem2', 'histo'),
      'Histologie niveau PCEM2'
    );

    await importSubjectQuizzes(
      'Physiologie',
      'PCEM2',
      path.join(baseDir, 'pcem2', 'physio'),
      'Physiologie niveau PCEM2'
    );

    console.log('\n═══════════════════════════════════════');
    console.log('✅ IMPORTATION TERMINÉE AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'importation
main()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
