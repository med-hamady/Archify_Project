const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Fonction pour parser les fichiers QCM (chapitres 1-12)
function parseQCMFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());

  let chapterTitle = lines[0] || 'Chapitre sans titre';
  chapterTitle = chapterTitle.replace(/^[^\wÀ-ÿ\s]+\s*/, '').trim();
  chapterTitle = chapterTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();

  const questions = [];
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const qcmMatch = line.match(/^QCM\s+(\d+)\s+[—–-]\s+(.+)/i);
    if (qcmMatch) {
      if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        questionText: qcmMatch[2].trim(),
        options: [],
        explanation: undefined
      };
      continue;
    }

    const optionMatch = line.match(/^([A-E])\.\s+(.+)/);
    if (optionMatch && currentQuestion) {
      const fullText = optionMatch[2];
      const hasCheck = fullText.includes('✔️') || fullText.includes('(✔️)');
      const hasCross = fullText.includes('❌') || fullText.includes('(❌)');

      let optionText = '';
      let justification = '';
      let isCorrect = false;

      if (hasCheck) {
        isCorrect = true;
        optionText = fullText.replace(/✔️|\(✔️\)/g, '').trim();
      } else if (hasCross) {
        isCorrect = false;
        const parts = fullText.split(/❌|\(❌\)/);
        optionText = parts[0].trim();
        if (parts[1]) {
          const justParts = parts[1].split(/[—→]/);
          if (justParts.length > 1) {
            justification = justParts.slice(1).join('—').trim();
          }
        }
      }

      currentQuestion.options.push({
        text: optionText,
        isCorrect,
        justification: justification || undefined
      });
    }

    const conclusionMatch = line.match(/^🧠\s*Conclusion\s*:\s*(.+)/);
    if (conclusionMatch && currentQuestion) {
      currentQuestion.explanation = conclusionMatch[1].trim();
    }
  }

  if (currentQuestion && currentQuestion.options.length > 0) {
    questions.push(currentQuestion);
  }

  return { title: chapterTitle, questions };
}

// Fonction pour parser les fichiers emoji (chapitres 13-22)
function parseEmojiFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  let chapterTitle = '';
  const titleLine = lines.find(l => l.match(/^[🧠🧬🧩⚡🫀].+Chapitre\s+\d+/i));
  if (titleLine) {
    chapterTitle = titleLine.replace(/^[🧠🧬🧩⚡🫀\s]+/, '').trim();
    chapterTitle = chapterTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
  }

  const questions = [];
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const questionMatch = line.match(/^Question\s*:\s*(.+)/i);
    if (questionMatch) {
      if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        questionText: questionMatch[1].trim(),
        options: [],
        explanation: undefined
      };
      continue;
    }

    const optionMatch = line.match(/^([A-E])\.\s+(.+)/);
    if (optionMatch && currentQuestion) {
      const fullText = optionMatch[2];
      const hasCheck = fullText.includes('✔️');
      const hasCross = fullText.includes('❌');

      let optionText = '';
      let justification = '';
      let isCorrect = false;

      if (hasCheck) {
        isCorrect = true;
        optionText = fullText.replace(/✔️/g, '').trim();
      } else if (hasCross) {
        isCorrect = false;
        const parts = fullText.split('❌');
        optionText = parts[0].trim();
        if (parts[1]) {
          const justParts = parts[1].split(/[—–-]/);
          if (justParts.length > 1) {
            justification = justParts.slice(1).join('—').trim();
          }
        }
      }

      currentQuestion.options.push({
        text: optionText,
        isCorrect,
        justification: justification || undefined
      });
    }

    const conclusionMatch = line.match(/^🧠\s*Conclusion\s*:\s*(.+)/);
    if (conclusionMatch && currentQuestion) {
      currentQuestion.explanation = conclusionMatch[1].trim();
    }
  }

  if (currentQuestion && currentQuestion.options.length > 0) {
    questions.push(currentQuestion);
  }

  return { title: chapterTitle, questions };
}

async function fixAnatomieComplete() {
  try {
    console.log('🚀 Réimportation COMPLÈTE Anatomie PCEM2...\n');

    // Trouver le sujet Anatomie PCEM2
    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM2'
      },
      include: {
        chapters: true
      }
    });

    if (!anatomieSubject) {
      console.log('❌ Sujet Anatomie PCEM2 non trouvé');
      return;
    }

    console.log(`📚 Sujet trouvé: ${anatomieSubject.title}`);

    // Supprimer TOUS les chapitres et questions
    console.log('\n🗑️  Suppression de tous les chapitres et questions...');

    for (const chapter of anatomieSubject.chapters) {
      await prisma.question.deleteMany({
        where: { chapterId: chapter.id }
      });
    }

    await prisma.chapter.deleteMany({
      where: { subjectId: anatomieSubject.id }
    });

    console.log('✅ Tous les chapitres supprimés\n');

    const anatomieDir = path.join(__dirname, '../data/quiz/pcem2/anatomie');
    const files = fs.readdirSync(anatomieDir).filter(f => f.endsWith('.txt'));

    console.log(`📂 ${files.length} fichiers trouvés\n`);

    // Séparer les fichiers QCM (1-12) et emoji (13-22)
    const qcmFiles = files.filter(f => f.match(/^CHAPITRE\s+([1-9]|1[0-2])\s+/i));
    const emojiFiles = files.filter(f => f.match(/^CHAPITRE\s+(1[3-9]|2[0-2])[–—\s]/i));

    console.log(`📊 ${qcmFiles.length} fichiers QCM (chapitres 1-12)`);
    console.log(`📊 ${emojiFiles.length} fichiers emoji (chapitres 13-22)\n`);

    let totalImported = 0;

    // 1. Importer chapitres QCM (1-12)
    console.log('===== IMPORT CHAPITRES QCM (1-12) =====\n');

    const sortedQCM = qcmFiles.sort((a, b) => {
      const numA = parseInt(a.match(/CHAPITRE\s+(\d+)/i)[1]);
      const numB = parseInt(b.match(/CHAPITRE\s+(\d+)/i)[1]);
      return numA - numB;
    });

    for (const file of sortedQCM) {
      const filePath = path.join(anatomieDir, file);
      console.log(`📄 ${file}`);

      const { title, questions } = parseQCMFile(filePath);
      console.log(`   Titre: ${title}`);
      console.log(`   Questions: ${questions.length}`);

      const chapter = await prisma.chapter.create({
        data: {
          title: title,
          subjectId: anatomieSubject.id
        }
      });

      for (const q of questions) {
        await prisma.question.create({
          data: {
            questionText: q.questionText,
            options: q.options,
            explanation: q.explanation,
            chapterId: chapter.id
          }
        });
      }

      totalImported += questions.length;
      console.log(`   ✅ ${questions.length} questions importées\n`);
    }

    // 2. Importer chapitres emoji (13-22)
    console.log('===== IMPORT CHAPITRES EMOJI (13-22) =====\n');

    const sortedEmoji = emojiFiles.sort((a, b) => {
      const numA = parseInt(a.match(/CHAPITRE\s+(\d+)/i)[1]);
      const numB = parseInt(b.match(/CHAPITRE\s+(\d+)/i)[1]);
      return numA - numB;
    });

    for (const file of sortedEmoji) {
      const filePath = path.join(anatomieDir, file);
      console.log(`📄 ${file}`);

      const { title, questions } = parseEmojiFile(filePath);
      console.log(`   Titre: ${title || 'Sans titre'}`);
      console.log(`   Questions: ${questions.length}`);

      const chapter = await prisma.chapter.create({
        data: {
          title: title || file.replace('.txt', ''),
          subjectId: anatomieSubject.id
        }
      });

      for (const q of questions) {
        await prisma.question.create({
          data: {
            questionText: q.questionText,
            options: q.options,
            explanation: q.explanation,
            chapterId: chapter.id
          }
        });
      }

      totalImported += questions.length;
      console.log(`   ✅ ${questions.length} questions importées\n`);
    }

    console.log('='.repeat(60));
    console.log(`\n🎉 Import terminé !`);
    console.log(`📊 Total: ${totalImported} questions importées`);
    console.log(`📖 Total: ${qcmFiles.length + emojiFiles.length} chapitres\n`);

    // Mettre à jour totalQCM
    await prisma.subject.update({
      where: { id: anatomieSubject.id },
      data: { totalQCM: totalImported }
    });

    console.log(`✅ totalQCM mis à jour: ${totalImported}\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
    throw error;
  }
}

fixAnatomieComplete();
