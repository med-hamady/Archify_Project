const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const HISTO_TAREK_SUBJECT_ID = 'cmi9505dz00009zq2szqoj972';
const DATA_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem1\\S inetrnational\\quiz pcem1\\Histo Tarek';

// Parse a text file to extract chapters and questions
function parseHistoTarekFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  const chapters = [];
  let currentChapter = null;
  let currentQuestion = null;
  let currentQuestionText = [];
  let currentAnswers = [];
  let state = 'NONE'; // NONE, CHAPTER, QUESTION_HEADER, QUESTION_TEXT, ANSWERS

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip conclusion lines
    if (line.startsWith('🩵 Conclusion')) {
      state = 'NONE';
      continue;
    }

    // Chapter header: Single capital letter + dot + capitalized text, no checkmarks
    if (line.match(/^[A-Z]\.\s+[A-Z]/) && !line.includes('✅') && !line.includes('❌') && !line.includes('⚠️') && !line.includes('✔️')) {
      // Save previous question if exists
      if (currentQuestion && currentAnswers.length > 0 && currentChapter) {
        currentChapter.questions.push({
          questionText: currentQuestionText.join(' ').trim(),
          answers: currentAnswers
        });
      }

      currentChapter = {
        title: line,
        questions: []
      };
      chapters.push(currentChapter);
      state = 'CHAPTER';
      currentQuestion = null;
      currentQuestionText = [];
      currentAnswers = [];
      continue;
    }

    // Question header
    if (line.match(/^QCM\s+\d+/)) {
      // Save previous question if exists
      if (currentQuestion && currentAnswers.length > 0 && currentChapter) {
        currentChapter.questions.push({
          questionText: currentQuestionText.join(' ').trim(),
          answers: currentAnswers
        });
      }

      currentQuestion = {};
      currentQuestionText = [];
      currentAnswers = [];
      state = 'QUESTION_HEADER';
      continue;
    }

    // Answer option
    const answerMatch = line.match(/^([A-Z])\.\s+(.+?)\s+(✅|❌|⚠️|✔️)/);
    if (answerMatch && (state === 'QUESTION_TEXT' || state === 'ANSWERS')) {
      const [, letter, text, correct] = answerMatch;

      // Extract explanation if present (text after →)
      const parts = text.split('→');
      const answerText = parts[0].replace(/\(✅\)|\(❌\)|\(⚠️\)|\(✔️\)/g, '').trim();
      const explanation = parts.length > 1 ? parts[1].trim() : '';

      currentAnswers.push({
        answerText,
        isCorrect: correct === '✅' || correct === '✔️',
        explanation
      });

      state = 'ANSWERS';
      continue;
    }

    // Question text (lines between QCM header and first answer)
    if (state === 'QUESTION_HEADER' || (state === 'QUESTION_TEXT' && currentAnswers.length === 0)) {
      currentQuestionText.push(line);
      state = 'QUESTION_TEXT';
      continue;
    }
  }

  // Save last question
  if (currentQuestion && currentAnswers.length > 0 && currentChapter) {
    currentChapter.questions.push({
      questionText: currentQuestionText.join(' ').trim(),
      answers: currentAnswers
    });
  }

  return chapters;
}

async function importHistoTarek() {
  try {
    console.log('🔄 Starting Histo Tarek import (v2)...\n');

    // First, clear existing data for this subject
    console.log('🗑️  Clearing existing data...');
    await prisma.answer.deleteMany({
      where: {
        question: {
          subjectId: HISTO_TAREK_SUBJECT_ID
        }
      }
    });

    await prisma.question.deleteMany({
      where: { subjectId: HISTO_TAREK_SUBJECT_ID }
    });

    await prisma.chapter.deleteMany({
      where: { subjectId: HISTO_TAREK_SUBJECT_ID }
    });

    console.log('✅ Cleared existing data\n');

    // Get all text files in the directory
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.txt'));
    console.log(`📁 Found ${files.length} files to import\n`);

    let chapterCount = 0;
    let questionCount = 0;

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      const fileName = path.basename(file, '.txt');

      console.log(`\n📖 Processing: ${fileName}`);

      // Parse the file
      const chapters = parseHistoTarekFile(filePath);
      console.log(`   Found ${chapters.length} chapter(s)`);

      // Import each chapter
      for (const chapterData of chapters) {
        const chapter = await prisma.chapter.create({
          data: {
            title: `${fileName} - ${chapterData.title}`,
            subjectId: HISTO_TAREK_SUBJECT_ID,
            orderIndex: chapterCount
          }
        });

        console.log(`   ✅ Created chapter: ${chapterData.title}`);
        chapterCount++;

        // Import questions for this chapter
        for (let qIndex = 0; qIndex < chapterData.questions.length; qIndex++) {
          const questionData = chapterData.questions[qIndex];

          if (!questionData.questionText || questionData.answers.length === 0) {
            console.log(`      ⚠️ Skipping invalid question`);
            continue;
          }

          await prisma.question.create({
            data: {
              questionText: questionData.questionText,
              chapterId: chapter.id,
              subjectId: HISTO_TAREK_SUBJECT_ID,
              orderIndex: qIndex,
              answers: {
                create: questionData.answers.map((ans, ansIndex) => ({
                  answerText: ans.answerText,
                  isCorrect: ans.isCorrect,
                  explanation: ans.explanation || null,
                  orderIndex: ansIndex
                }))
              }
            }
          });

          questionCount++;
        }

        console.log(`      ✅ Added ${chapterData.questions.length} questions`);
      }
    }

    console.log('\n✅ Import complete!');
    console.log(`   Total chapters: ${chapterCount}`);
    console.log(`   Total questions: ${questionCount}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importHistoTarek();
