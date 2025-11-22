import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuizOption {
  text: string;
  isCorrect: boolean;
  justification: string | null;
}

interface ParsedQuestion {
  questionText: string;
  options: QuizOption[];
  explanation: string | null;
  orderIndex: number;
}

interface SubChapterData {
  title: string;
  questions: ParsedQuestion[];
}

interface ChapterData {
  title: string;
  subchapters: SubChapterData[];
  questionsWithoutSubchapter: ParsedQuestion[];
}

/**
 * Détecte si une ligne est un titre de sous-chapitre
 * Format: "A. 1er groupe", "B. 2ème groupe", "A. 1 a 10", etc.
 */
function isSubchapterTitle(line: string, nextLines: string[]): boolean {
  // Match A., B., C., D. au début suivi d'un texte (avec ou sans espace après le point)
  // Ex: "A. 1er groupe" ou "B.2eme groupe"
  const match = line.match(/^([A-J])\.?\s*(.+)/);
  if (!match) return false;

  // Vérifier que ça commence bien par une lettre suivie d'un point
  if (!line.match(/^[A-J]\./)) return false;

  const text = match[2];

  // Exclure les options de QCM (contiennent ✅, ❌, →)
  if (text.includes('✅') || text.includes('❌') || text.includes('→') ||
      text.includes('(❌)') || text.includes('(✅)')) {
    return false;
  }

  // Vérifier si c'est un titre de groupe/section
  // Patterns: "1er groupe", "2ème groupe", "2eme groupe", "1 a 10", "11 a 20", etc.
  if (text.match(/^\d+(er|ème|e|eme)?\s*(groupe|section)/i) ||
      text.match(/^\d+\s*(a|à|-)?\s*\d+$/i)) {
    return true;
  }

  // Vérifier si les lignes suivantes contiennent un QCM
  const hasQCMAfter = nextLines.slice(0, 10).some(l => l.match(/^QCM\s+\d+/i));
  return hasQCMAfter;
}

/**
 * Parse un fichier et extrait les chapitres avec sous-chapitres
 */
function parseFile(filePath: string): ChapterData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());

  // Le titre du chapitre est la première ligne non vide
  let chapterTitle = '';
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      chapterTitle = lines[i].trim();
      startIndex = i + 1;
      break;
    }
  }

  const subchapters: SubChapterData[] = [];
  const questionsWithoutSubchapter: ParsedQuestion[] = [];

  let currentSubchapter: SubChapterData | null = null;
  let currentQuestion: ParsedQuestion | null = null;
  let questionIndex = 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const nextLines = lines.slice(i + 1, i + 15);

    // Détecter un nouveau sous-chapitre
    if (isSubchapterTitle(line, nextLines)) {
      // Sauvegarder la question en cours
      if (currentQuestion && currentQuestion.options.length > 0) {
        if (currentSubchapter) {
          currentSubchapter.questions.push(currentQuestion);
        } else {
          questionsWithoutSubchapter.push(currentQuestion);
        }
      }
      currentQuestion = null;

      // Sauvegarder le sous-chapitre précédent s'il existe
      if (currentSubchapter && currentSubchapter.questions.length > 0) {
        subchapters.push(currentSubchapter);
      }

      // Créer un nouveau sous-chapitre
      // Extraire le titre après "X." (avec ou sans espace)
      const match = line.match(/^[A-J]\.\s*(.+)/);
      currentSubchapter = {
        title: match ? match[1].trim() : line,
        questions: []
      };
      questionIndex = 0;
      continue;
    }

    // Détecter une nouvelle question (QCM X — Titre)
    const qcmMatch = line.match(/^(✅\s*)?QCM\s+(\d+)\s*[—–-]?\s*(.*)/i);
    if (qcmMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion && currentQuestion.options.length > 0) {
        if (currentSubchapter) {
          currentSubchapter.questions.push(currentQuestion);
        } else {
          questionsWithoutSubchapter.push(currentQuestion);
        }
      }

      // Démarrer une nouvelle question
      let questionText = qcmMatch[3].trim();

      // Si le titre du QCM est vide, prendre la ligne suivante non vide
      if (!questionText) {
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.match(/^[A-E]\./)) {
            questionText = nextLine;
            break;
          }
        }
      }

      currentQuestion = {
        questionText: questionText,
        options: [],
        explanation: null,
        orderIndex: questionIndex++
      };
      continue;
    }

    // Détecter une option (A., B., C., D., E.)
    const optionMatch = line.match(/^([A-Ea-e])[\.\)]\s+(.+)/);
    if (optionMatch && currentQuestion) {
      const fullText = optionMatch[2];

      // Analyser l'option
      const hasCheck = fullText.includes('✅') || fullText.includes('✔️');
      const hasCross = fullText.includes('❌');

      let optionText = '';
      let justification = '';
      let isCorrect = false;

      if (hasCheck) {
        isCorrect = true;
        // Format: "Texte (✅)" ou "Texte ✅"
        optionText = fullText.replace(/\s*\(?\s*(✅|✔️)\s*\)?\s*$/, '').trim();
        // Extraire justification si présente (après →)
        const arrowMatch = fullText.match(/→\s*(.+)/);
        if (arrowMatch) {
          optionText = fullText.split('→')[0].replace(/\s*\(?\s*(✅|✔️)\s*\)?\s*/, '').trim();
          justification = arrowMatch[1].trim();
        }
      } else if (hasCross) {
        isCorrect = false;
        // Format: "Texte (❌) → Justification"
        const format1 = fullText.match(/^(.+?)\s*\(❌\)\s*→\s*(.+)$/);
        if (format1) {
          optionText = format1[1].trim();
          justification = format1[2].trim();
        } else {
          // Format: "Texte ❌ — Justification" ou juste "Texte (❌)"
          const parts = fullText.split(/❌|→|—/);
          optionText = parts[0].replace(/\s*\(\s*$/, '').trim();
          if (parts.length > 1) {
            justification = parts.slice(1).join(' ').trim();
          }
        }
      } else {
        // Pas de symbole, considérer comme faux par défaut
        optionText = fullText.trim();
        isCorrect = false;
      }

      currentQuestion.options.push({
        text: optionText,
        isCorrect,
        justification: justification || null
      });
      continue;
    }

    // Détecter la conclusion
    const conclusionMatch = line.match(/^🩵\s*Conclusion\s*:?\s*(.*)/);
    if (conclusionMatch && currentQuestion) {
      let conclusion = conclusionMatch[1].trim();
      // Si la conclusion est sur la ligne suivante
      if (!conclusion && i + 1 < lines.length) {
        conclusion = lines[i + 1].trim();
      }
      if (conclusion && conclusion !== '.') {
        currentQuestion.explanation = conclusion;
      }
      continue;
    }
  }

  // Sauvegarder la dernière question
  if (currentQuestion && currentQuestion.options.length > 0) {
    if (currentSubchapter) {
      currentSubchapter.questions.push(currentQuestion);
    } else {
      questionsWithoutSubchapter.push(currentQuestion);
    }
  }

  // Sauvegarder le dernier sous-chapitre
  if (currentSubchapter && currentSubchapter.questions.length > 0) {
    subchapters.push(currentSubchapter);
  }

  return {
    title: chapterTitle,
    subchapters,
    questionsWithoutSubchapter
  };
}

async function main() {
  console.log('🚀 Démarrage de l\'import Anatomie Ali Ghorbel (PCEM2)...\n');

  try {
    // 1. Trouver ou créer le sujet "Anatomie Ali Ghorbel"
    let subject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie Ali Ghorbel', mode: 'insensitive' },
        semester: 'PCEM2'
      }
    });

    if (!subject) {
      console.log('📚 Création du sujet "Anatomie Ali Ghorbel"...');
      subject = await prisma.subject.create({
        data: {
          title: 'Anatomie Ali Ghorbel',
          description: 'Cours d\'anatomie du Pr Ali Ghorbel - PCEM2',
          semester: 'PCEM2',
          totalQCM: 0
        }
      });
      console.log(`✅ Sujet créé: ${subject.title}\n`);
    } else {
      console.log(`📚 Sujet existant trouvé: ${subject.title}`);

      // Supprimer les anciens chapitres et questions
      console.log('🗑️  Suppression des anciennes données...');
      const chapters = await prisma.chapter.findMany({
        where: { subjectId: subject.id },
        select: { id: true }
      });

      for (const chapter of chapters) {
        await prisma.question.deleteMany({ where: { chapterId: chapter.id } });
        await prisma.subchapter.deleteMany({ where: { chapterId: chapter.id } });
      }
      await prisma.chapter.deleteMany({ where: { subjectId: subject.id } });
      console.log('✅ Anciennes données supprimées\n');
    }

    // 2. Lire les fichiers
    const dataDir = path.join(__dirname, 'data', 'anatomie-ali-ghorbel');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.txt'));

    console.log(`📂 ${files.length} fichiers trouvés\n`);

    let totalQuestions = 0;
    let chapterIndex = 0;

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      console.log(`📄 Traitement: ${file}`);

      const chapterData = parseFile(filePath);
      console.log(`   Titre: ${chapterData.title}`);
      console.log(`   Sous-chapitres: ${chapterData.subchapters.length}`);

      // Créer le chapitre
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterData.title,
          description: `Cours de ${chapterData.title}`,
          subjectId: subject.id,
          orderIndex: chapterIndex++
        }
      });

      let chapterQuestionCount = 0;

      // Si des sous-chapitres existent
      if (chapterData.subchapters.length > 0) {
        let subchapterIndex = 0;

        for (const subchapterData of chapterData.subchapters) {
          // Créer le sous-chapitre
          const subchapter = await prisma.subchapter.create({
            data: {
              title: subchapterData.title,
              chapterId: chapter.id,
              orderIndex: subchapterIndex++
            }
          });

          console.log(`      └─ ${subchapterData.title}: ${subchapterData.questions.length} QCMs`);

          // Créer les questions
          for (const question of subchapterData.questions) {
            await prisma.question.create({
              data: {
                questionText: question.questionText,
                options: question.options as any,
                explanation: question.explanation,
                chapterId: chapter.id,
                subchapterId: subchapter.id,
                orderIndex: question.orderIndex
              }
            });
            chapterQuestionCount++;
          }
        }
      }

      // Questions sans sous-chapitre
      if (chapterData.questionsWithoutSubchapter.length > 0) {
        for (const question of chapterData.questionsWithoutSubchapter) {
          await prisma.question.create({
            data: {
              questionText: question.questionText,
              options: question.options as any,
              explanation: question.explanation,
              chapterId: chapter.id,
              orderIndex: question.orderIndex
            }
          });
          chapterQuestionCount++;
        }
      }

      totalQuestions += chapterQuestionCount;
      console.log(`   ✅ ${chapterQuestionCount} questions importées\n`);
    }

    // Mettre à jour le total QCM du sujet
    await prisma.subject.update({
      where: { id: subject.id },
      data: { totalQCM: totalQuestions }
    });

    console.log('═'.repeat(50));
    console.log(`🎉 Import terminé avec succès !`);
    console.log(`📊 Total: ${files.length} chapitres, ${totalQuestions} questions`);
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
