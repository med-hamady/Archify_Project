const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const HISTO_TAREK_SUBJECT_ID = 'cmi9505dz00009zq2szqoj972';
const DATA_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem1\\S inetrnational\\quiz pcem1\\Histo Tarek';

// Parse a text file to extract subchapters and questions
function parseHistoTarekFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  const subchapters = [];
  let currentSubchapter = null;
  let currentQuestion = null;
  let currentQuestionText = [];
  let currentAnswers = [];
  let state = 'NONE';

  // Check if file has subchapter headers (A. B. C. etc.)
  // Pattern: Single letter (A-Z) + dot + space + text starting with capital or accented letter
  const hasSubchapters = lines.some(line =>
    line.match(/^[A-Z]\.\s+[A-ZÀ-ÿ]/i) &&
    !line.includes('✅') && !line.includes('❌') &&
    !line.includes('⚠️') && !line.includes('✔️')
  );

  // If no subchapters, create a default one
  if (!hasSubchapters) {
    currentSubchapter = {
      title: 'Questions générales',
      questions: []
    };
    subchapters.push(currentSubchapter);
    state = 'SUBCHAPTER';
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip conclusion lines
    if (line.startsWith('🩵 Conclusion')) {
      state = 'NONE';
      continue;
    }

    // Subchapter header: Single capital letter + dot + capitalized text, no checkmarks
    // Example: "A. Tissu conjonctif commun" or "A. Épithéliums de revêtement :"
    if (line.match(/^[A-Z]\.\s+[A-ZÀ-ÿ]/i) && !line.includes('✅') && !line.includes('❌') && !line.includes('⚠️') && !line.includes('✔️')) {
      // Save previous question if exists
      if (currentQuestion && currentAnswers.length > 0 && currentSubchapter) {
        currentSubchapter.questions.push({
          questionText: currentQuestionText.join(' ').trim(),
          answers: currentAnswers
        });
      }

      currentSubchapter = {
        title: line,
        questions: []
      };
      subchapters.push(currentSubchapter);
      state = 'SUBCHAPTER';
      currentQuestion = null;
      currentQuestionText = [];
      currentAnswers = [];
      continue;
    }

    // Question header - may contain question text after "QCM X —"
    const qcmMatch = line.match(/^QCM\s+\d+\s*[—\-–]\s*(.*)/);
    if (qcmMatch || line.match(/^QCM\s+\d+/)) {
      // Save previous question if exists
      if (currentQuestion && currentAnswers.length > 0 && currentSubchapter) {
        currentSubchapter.questions.push({
          questionText: currentQuestionText.join(' ').trim(),
          answers: currentAnswers
        });
      }

      currentQuestion = {};
      currentQuestionText = [];
      currentAnswers = [];

      // Check if question text is on the same line as "QCM X —"
      if (qcmMatch && qcmMatch[1] && qcmMatch[1].trim()) {
        currentQuestionText.push(qcmMatch[1].trim());
        state = 'QUESTION_TEXT';
      } else {
        state = 'QUESTION_HEADER';
      }
      continue;
    }

    // Answer option - check this BEFORE question text
    // Format: "A. text (✅)" or "A. text (✅) → explanation"
    const answerMatch = line.match(/^([A-Z])\.\s+(.+)\s+\((✅|❌|⚠️|✔️)\)/);
    if (answerMatch) {
      const [, letter, text, correct] = answerMatch;

      // Extract explanation if present (text after →)
      const parts = text.split('→');
      const answerText = parts[0].trim();
      const explanation = parts.length > 1 ? parts[1].trim() : '';

      currentAnswers.push({
        text: answerText,
        isCorrect: correct === '✅' || correct === '✔️',
        isPartial: correct === '⚠️',
        justification: explanation || null
      });

      state = 'ANSWERS';
      continue;
    }

    // Question text (lines between QCM header and first answer)
    if ((state === 'QUESTION_HEADER' || state === 'QUESTION_TEXT') && currentAnswers.length === 0) {
      currentQuestionText.push(line);
      state = 'QUESTION_TEXT';
      continue;
    }
  }

  // Save last question
  if (currentQuestion && currentAnswers.length > 0 && currentSubchapter) {
    currentSubchapter.questions.push({
      questionText: currentQuestionText.join(' ').trim(),
      answers: currentAnswers
    });
  }

  return subchapters;
}

async function importHistoTarek() {
  try {
    console.log('🔄 Starting Histo Tarek import (with Subchapters)...\n');

    // First, clear existing data for this subject
    console.log('🗑️  Clearing existing data...');

    // Get chapters to delete
    const existingChapters = await prisma.chapter.findMany({
      where: { subjectId: HISTO_TAREK_SUBJECT_ID },
      select: { id: true }
    });

    const chapterIds = existingChapters.map(c => c.id);

    if (chapterIds.length > 0) {
      // Delete subchapters first (they have questions)
      const subchapters = await prisma.subchapter.findMany({
        where: { chapterId: { in: chapterIds } },
        select: { id: true }
      });

      const subchapterIds = subchapters.map(s => s.id);

      if (subchapterIds.length > 0) {
        await prisma.question.deleteMany({
          where: { subchapterId: { in: subchapterIds } }
        });

        await prisma.subchapter.deleteMany({
          where: { chapterId: { in: chapterIds } }
        });
      }

      // Delete questions directly attached to chapters
      await prisma.question.deleteMany({
        where: { chapterId: { in: chapterIds } }
      });

      await prisma.chapter.deleteMany({
        where: { subjectId: HISTO_TAREK_SUBJECT_ID }
      });
    }

    console.log('✅ Cleared existing data\n');

    // Get all text files in the directory
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.txt'));
    console.log(`📁 Found ${files.length} files to import\n`);

    let chapterCount = 0;
    let subchapterCount = 0;
    let questionCount = 0;

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      const fileName = path.basename(file, '.txt');

      console.log(`\n📖 Processing: ${fileName}`);

      // Parse the file - each file becomes a CHAPTER
      const subchaptersData = parseHistoTarekFile(filePath);

      if (subchaptersData.length === 0) {
        console.log(`   ⚠️ No subchapters found, skipping...`);
        continue;
      }

      // Create the main chapter (file name)
      const chapter = await prisma.chapter.create({
        data: {
          title: fileName,
          subjectId: HISTO_TAREK_SUBJECT_ID,
          orderIndex: chapterCount
        }
      });

      console.log(`   ✅ Created chapter: ${fileName}`);
      chapterCount++;

      // Create subchapters and questions
      for (let scIdx = 0; scIdx < subchaptersData.length; scIdx++) {
        const scData = subchaptersData[scIdx];

        const subchapter = await prisma.subchapter.create({
          data: {
            title: scData.title,
            chapterId: chapter.id,
            orderIndex: scIdx
          }
        });

        console.log(`      📂 Created subchapter: ${scData.title}`);
        subchapterCount++;

        // Import questions for this subchapter
        let validQuestions = 0;
        for (let qIndex = 0; qIndex < scData.questions.length; qIndex++) {
          const questionData = scData.questions[qIndex];

          if (!questionData.questionText || questionData.answers.length === 0) {
            continue;
          }

          await prisma.question.create({
            data: {
              questionText: questionData.questionText,
              chapterId: chapter.id,
              subchapterId: subchapter.id,
              orderIndex: qIndex,
              options: questionData.answers
            }
          });

          questionCount++;
          validQuestions++;
        }

        console.log(`         ✅ Added ${validQuestions} questions`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Import complete!');
    console.log('═'.repeat(60));
    console.log(`   📚 Total chapters: ${chapterCount}`);
    console.log(`   📂 Total subchapters: ${subchapterCount}`);
    console.log(`   ❓ Total questions: ${questionCount}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importHistoTarek();
