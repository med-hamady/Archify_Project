const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const HISTO_TAREK_SUBJECT_ID = 'cmi9505dz00009zq2szqoj972';
const DATA_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem1\\S inetrnational\\quiz pcem1\\Histo Tarek';

// Parse a text file to extract chapters and questions
function parseHistoTarekFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const chapters = [];
  let currentChapter = null;
  let currentQuestion = null;
  let currentAnswers = [];
  let answerLetter = 'A';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Chapter header (e.g., "A. Tissu conjonctif commun")
    // Must be a single letter followed by dot and text, but NOT an answer option (which has checkmarks)
    if (line.match(/^[A-Z]\.\s+[A-Z]/) && !line.includes('✅') && !line.includes('❌') && !line.includes('⚠️')) {
      if (currentQuestion && currentAnswers.length > 0) {
        currentChapter.questions.push({
          questionText: currentQuestion.text,
          answers: currentAnswers
        });
        currentQuestion = null;
        currentAnswers = [];
      }

      currentChapter = {
        title: line,
        questions: []
      };
      chapters.push(currentChapter);
      continue;
    }

    // Question header (e.g., "QCM 1 —")
    if (line.match(/^QCM\s+\d+/)) {
      // Save previous question if exists
      if (currentQuestion && currentAnswers.length > 0) {
        currentChapter.questions.push({
          questionText: currentQuestion.text,
          answers: currentAnswers
        });
      }

      currentQuestion = { text: '' };
      currentAnswers = [];
      answerLetter = 'A';
      continue;
    }

    // Conclusion line (skip it)
    if (line.startsWith('🩵 Conclusion')) {
      continue;
    }

    // Answer option (e.g., "A. option text (✅)" or "B. option text (❌)")
    const answerMatch = line.match(/^([A-Z])\.\s+(.+?)\s+(✅|❌|⚠️)/);
    if (answerMatch && currentQuestion) {
      const [, letter, text, correct] = answerMatch;

      // Extract explanation if present (text after →)
      const parts = text.split('→');
      const answerText = parts[0].trim();
      const explanation = parts.length > 1 ? parts[1].trim() : '';

      currentAnswers.push({
        answerText,
        isCorrect: correct === '✅',
        explanation
      });
      continue;
    }

    // Question text (accumulate lines until we hit an answer)
    if (currentQuestion && !currentQuestion.text && !line.startsWith('A.')) {
      currentQuestion.text = line;
      continue;
    }

    // Additional question text
    if (currentQuestion && currentQuestion.text && !line.startsWith('A.') && !answerMatch) {
      currentQuestion.text += ' ' + line;
    }
  }

  // Save last question
  if (currentQuestion && currentAnswers.length > 0 && currentChapter) {
    currentChapter.questions.push({
      questionText: currentQuestion.text,
      answers: currentAnswers
    });
  }

  return chapters;
}

async function importHistoTarek() {
  try {
    console.log('🔄 Starting Histo Tarek import...\n');

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
            title: chapterData.title,
            subjectId: HISTO_TAREK_SUBJECT_ID,
            orderIndex: chapterCount
          }
        });

        console.log(`   ✅ Created chapter: ${chapter.title}`);
        chapterCount++;

        // Import questions for this chapter
        for (let qIndex = 0; qIndex < chapterData.questions.length; qIndex++) {
          const questionData = chapterData.questions[qIndex];

          const question = await prisma.question.create({
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

        console.log(`      Added ${chapterData.questions.length} questions`);
      }
    }

    console.log('\n✅ Import complete!');
    console.log(`   Total chapters: ${chapterCount}`);
    console.log(`   Total questions: ${questionCount}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importHistoTarek();
