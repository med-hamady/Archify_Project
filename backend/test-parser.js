const fs = require('fs');

function parseHistoTarekFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  console.log(`Total lines: ${lines.length}\n`);

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
      console.log(`[${i}] CONCLUSION: ${line.substring(0, 50)}`);
      state = 'NONE';
      continue;
    }

    // Chapter header: Single capital letter + dot + capitalized text, no checkmarks
    if (line.match(/^[A-Z]\.\s+[A-Z]/) && !line.includes('✅') && !line.includes('❌') && !line.includes('⚠️') && !line.includes('✔️')) {
      console.log(`[${i}] CHAPTER: ${line}`);

      // Save previous question if exists
      if (currentQuestion && currentAnswers.length > 0 && currentChapter) {
        console.log(`    → Saving previous question with ${currentAnswers.length} answers`);
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
      console.log(`[${i}] QCM HEADER: ${line}`);

      // Save previous question if exists
      if (currentQuestion && currentAnswers.length > 0 && currentChapter) {
        console.log(`    → Saving previous question with ${currentAnswers.length} answers`);
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

    // Answer option - check this BEFORE question text
    // Format: "A. text (✅)" or "A. text (✅) → explanation"
    const answerMatch = line.match(/^([A-Z])\.\s+(.+)\s+\((✅|❌|⚠️|✔️)\)/);
    if (answerMatch) {
      const [, letter, text, correct] = answerMatch;
      console.log(`[${i}] ANSWER ${letter}: ${correct === '✅' || correct === '✔️' ? 'CORRECT' : 'WRONG'} - ${text.substring(0, 30)}`);

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
      console.log(`[${i}] QUESTION TEXT: ${line.substring(0, 50)}`);
      currentQuestionText.push(line);
      state = 'QUESTION_TEXT';
      continue;
    }

    console.log(`[${i}] IGNORED (state=${state}): ${line.substring(0, 50)}`);
  }

  // Save last question
  if (currentQuestion && currentAnswers.length > 0 && currentChapter) {
    console.log(`    → Saving last question with ${currentAnswers.length} answers`);
    currentChapter.questions.push({
      questionText: currentQuestionText.join(' ').trim(),
      answers: currentAnswers
    });
  }

  return chapters;
}

const filePath = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem1\\S inetrnational\\quiz pcem1\\Histo Tarek\\Tissu conjonctif isolé.txt';
const chapters = parseHistoTarekFile(filePath);

console.log('\n\n===== RESULTS =====');
console.log(`Total chapters: ${chapters.length}`);
chapters.forEach((ch, idx) => {
  console.log(`\nChapter ${idx + 1}: ${ch.title}`);
  console.log(`  Questions: ${ch.questions.length}`);
  ch.questions.slice(0, 2).forEach((q, qIdx) => {
    console.log(`    Q${qIdx + 1}: ${q.questionText.substring(0, 50)}...`);
    console.log(`       Answers: ${q.answers.length}`);
  });
});
