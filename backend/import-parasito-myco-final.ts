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

// Détecte si une ligne est un vrai sous-chapitre
function isRealSubChapter(line: string, nextLines: string[], previousLines: string[]): boolean {
  if (!line.match(/^[A-J]\.\s+/)) {
    return false;
  }

  if (line.includes('✅') || line.includes('❌') || line.includes('→') ||
      line.includes('(❌)') || line.includes('(✅)')) {
    return false;
  }

  const hasConclusionBefore = previousLines.some(l => l.includes('🩵') || l.includes('Conclusion'));
  if (hasConclusionBefore) {
    return false;
  }

  const nextNonEmptyLine = nextLines.find(l => l.trim() !== '');
  if (nextNonEmptyLine && nextNonEmptyLine.match(/^[B-E]\./)) {
    return false;
  }

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

// Parse un fichier SANS sous-chapitres
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

    if (line.match(/^QCM\s+\d+/i)) {
      if (currentQuestion && currentQuestion.questionText) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        currentQuestion.orderIndex = questionIndex++;
        questions.push(currentQuestion as Question);
      }

      currentQuestion = { questionText: '', options: [], explanation: null, orderIndex: 0 };
      currentOptions = [];
      currentExplanation = [];
      inExplanation = false;
      continue;
    }

    if (currentQuestion && line.match(/^\d+[\s\.\-–—]+/)) {
      const questionMatch = line.match(/^\d+[\s\.\-–—]+(.+)/);
      if (questionMatch) {
        currentQuestion.questionText = questionMatch[1].trim();
      }
      continue;
    }

    if (currentQuestion && line.match(/^[A-E][\.\)]/)) {
      const optionMatch = line.match(/^([A-E])[\.\)]\s*(.+)/);
      if (optionMatch) {
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

    if (line.startsWith('🩵')) {
      inExplanation = true;
      const explanationText = line.replace(/🩵\s*(Conclusion\s*:)?/i, '').trim();
      if (explanationText) {
        currentExplanation.push(explanationText);
      }
      continue;
    }

    if (inExplanation && line && !line.match(/^QCM\s+\d+/i) && !line.match(/^[A-E][\.\)]/)) {
      currentExplanation.push(line);
      continue;
    }

    if (currentQuestion && currentQuestion.questionText && line && !inExplanation) {
      currentQuestion.questionText += ' ' + line;
    }
  }

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

    if (isRealSubChapter(line, nextLines, previousLines)) {
      if (currentQuestion && currentQuestion.questionText && currentSubChapter) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        currentQuestion.orderIndex = questionIndex++;
        if (!currentSubChapter.questions) {
          currentSubChapter.questions = [];
        }
        currentSubChapter.questions.push(currentQuestion as Question);
      }

      if (currentSubChapter && currentSubChapter.title) {
        currentSubChapter.orderIndex = subChapterIndex++;
        subChapters.push(currentSubChapter as SubChapter);
      }

      const subChapterMatch = line.match(/^([A-J])\.\s+(.+)/);
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

    if (!currentSubChapter) {
      continue;
    }

    if (line.match(/^QCM\s+\d+/i)) {
      if (currentQuestion && currentQuestion.questionText) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
        currentQuestion.orderIndex = questionIndex++;
        if (!currentSubChapter.questions) {
          currentSubChapter.questions = [];
        }
        currentSubChapter.questions.push(currentQuestion as Question);
      }

      currentQuestion = { questionText: '', options: [], explanation: null, orderIndex: 0 };
      currentOptions = [];
      currentExplanation = [];
      inExplanation = false;
      continue;
    }

    if (currentQuestion && line.match(/^\d+[\s\.\-–—]+/)) {
      const questionMatch = line.match(/^\d+[\s\.\-–—]+(.+)/);
      if (questionMatch) {
        currentQuestion.questionText = questionMatch[1].trim();
      }
      continue;
    }

    if (currentQuestion && line.match(/^[A-E][\.\)]/)) {
      const optionMatch = line.match(/^([A-E])[\.\)]\s*(.+)/);
      if (optionMatch) {
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

    if (line.startsWith('🩵')) {
      inExplanation = true;
      const explanationText = line.replace(/🩵\s*(Conclusion\s*:)?/i, '').trim();
      if (explanationText) {
        currentExplanation.push(explanationText);
      }
      continue;
    }

    if (inExplanation && line && !line.match(/^QCM\s+\d+/i) && !line.match(/^[A-E][\.\)]/)) {
      currentExplanation.push(line);
      continue;
    }

    if (currentQuestion && currentQuestion.questionText && line && !inExplanation) {
      currentQuestion.questionText += ' ' + line;
    }
  }

  if (currentQuestion && currentQuestion.questionText && currentSubChapter) {
    currentQuestion.options = currentOptions;
    currentQuestion.explanation = currentExplanation.join(' ').trim() || null;
    currentQuestion.orderIndex = questionIndex;
    if (!currentSubChapter.questions) {
      currentSubChapter.questions = [];
    }
    currentSubChapter.questions.push(currentQuestion as Question);
  }

  if (currentSubChapter && currentSubChapter.title) {
    currentSubChapter.orderIndex = subChapterIndex;
    subChapters.push(currentSubChapter as SubChapter);
  }

  return subChapters;
}

async function importParasitoMycoFinal() {
  console.log('🚀 Import Parasito-myco avec structure chapitres/sous-chapitres...\n');

  try {
    // Vérifier si la matière existe déjà
    let subject = await prisma.subject.findFirst({
      where: {
        title: SUBJECT_TITLE,
        semester: SEMESTER
      }
    });

    if (subject) {
      console.log('⚠️  Suppression des anciennes données...');
      await prisma.question.deleteMany({
        where: {
          chapter: {
            subjectId: subject.id
          }
        }
      });
      await prisma.subchapter.deleteMany({
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
      console.log('✅ Données supprimées.\n');
    }

    // Créer la matière
    subject = await prisma.subject.create({
      data: {
        title: SUBJECT_TITLE,
        description: SUBJECT_DESCRIPTION,
        semester: SEMESTER,
        totalQCM: 0
      }
    });

    console.log(`✅ Matière créée: ${SUBJECT_TITLE}\n`);

    const files = fs.readdirSync(SOURCE_FOLDER).filter(f => f.endsWith('.txt'));
    console.log(`📁 ${files.length} fichiers trouvés\n`);

    let totalQuestions = 0;
    let chapterIndex = 0;

    for (const file of files) {
      const filePath = path.join(SOURCE_FOLDER, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const mainChapterTitle = file.replace('.txt', '');

      console.log(`\n📖 ${mainChapterTitle}`);

      // Créer le chapitre principal
      const chapter = await prisma.chapter.create({
        data: {
          title: mainChapterTitle,
          description: `Cours de ${mainChapterTitle}`,
          subjectId: subject.id,
          orderIndex: chapterIndex++
        }
      });

      if (hasSubChapters(content)) {
        console.log(`   Structure: AVEC sous-chapitres`);
        const subChapters = parseFileWithSubChapters(content, mainChapterTitle);

        let subchapterOrderIndex = 0;
        for (const subChapterData of subChapters) {
          if (subChapterData.questions.length === 0) continue;

          // Créer le sous-chapitre
          const subchapter = await prisma.subchapter.create({
            data: {
              title: subChapterData.title,
              chapterId: chapter.id,
              orderIndex: subchapterOrderIndex++
            }
          });

          // Créer les questions liées au sous-chapitre
          for (const question of subChapterData.questions) {
            await prisma.question.create({
              data: {
                questionText: question.questionText,
                options: question.options,
                explanation: question.explanation,
                chapterId: chapter.id,
                subchapterId: subchapter.id,
                orderIndex: question.orderIndex
              }
            });
          }

          totalQuestions += subChapterData.questions.length;
          console.log(`   ├─ ${subChapterData.title} (${subChapterData.questions.length} QCMs)`);
        }
      } else {
        console.log(`   Structure: SANS sous-chapitres`);
        const questions = parseQCMFile(content, mainChapterTitle);

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
        console.log(`   └─ ${questions.length} QCMs`);
      }
    }

    // Mettre à jour le total
    await prisma.subject.update({
      where: { id: subject.id },
      data: { totalQCM: totalQuestions }
    });

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ IMPORTATION TERMINÉE`);
    console.log(`📊 ${SUBJECT_TITLE}`);
    console.log(`📚 ${files.length} chapitres`);
    console.log(`❓ ${totalQuestions} questions`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importParasitoMycoFinal()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
