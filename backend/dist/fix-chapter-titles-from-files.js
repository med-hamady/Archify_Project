const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function extractTitleFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());

    // La première ligne contient le titre
    let title = lines[0] || '';

    // Nettoyer le titre (enlever emojis au début)
    title = title.replace(/^[🧠🧬🧩⚡🫀\s]+/, '').trim();

    // Enlever les annotations de type (niveau sélectif : X réponses justes)
    title = title.replace(/\s*\(niveau\s+sélectif\s*:\s*[^)]+\)\s*$/i, '').trim();

    return title;
  } catch (error) {
    console.error(`Erreur lecture ${filePath}:`, error.message);
    return null;
  }
}

async function fixChapterTitlesFromFiles() {
  try {
    console.log('🔧 Correction des titres depuis les fichiers sources...\n');

    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });

    if (!anatomieSubject) {
      console.log('❌ Sujet Anatomie PCEM2 non trouvé');
      return;
    }

    console.log(`📚 Sujet: ${anatomieSubject.title}`);
    console.log(`📖 Chapitres totaux: ${anatomieSubject.chapters.length}\n`);

    const anatomieDir = path.join(__dirname, '../data/quiz/pcem2/anatomie');
    const files = fs.readdirSync(anatomieDir).filter(f => f.endsWith('.txt'));

    // Créer un mapping fichier -> titre extrait
    const fileTitles = {};
    for (const file of files) {
      const filePath = path.join(anatomieDir, file);
      const title = extractTitleFromFile(filePath);
      if (title) {
        fileTitles[file] = title;
      }
    }

    let fixedCount = 0;

    // Parcourir les chapitres et corriger les titres vides
    for (const chapter of anatomieSubject.chapters) {
      if (!chapter.title || chapter.title.trim().length < 3) {
        const questionCount = chapter._count.questions;
        console.log(`📄 Chapitre vide: ${chapter.id} (${questionCount} questions)`);

        // Récupérer les questions du chapitre pour trouver le fichier source
        const sampleQuestions = await prisma.question.findMany({
          where: { chapterId: chapter.id },
          take: 1
        });

        if (sampleQuestions.length > 0) {
          const firstQuestion = sampleQuestions[0].questionText;

          // Chercher le fichier qui contient cette question
          let matchedFile = null;
          let matchedTitle = null;

          for (const [file, title] of Object.entries(fileTitles)) {
            const filePath = path.join(anatomieDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            if (content.includes(firstQuestion.substring(0, 50))) {
              matchedFile = file;
              matchedTitle = title;
              break;
            }
          }

          if (matchedTitle) {
            await prisma.chapter.update({
              where: { id: chapter.id },
              data: { title: matchedTitle }
            });
            console.log(`   ✅ Titre mis à jour: "${matchedTitle}" (source: ${matchedFile})`);
            fixedCount++;
          } else {
            console.log(`   ⚠️  Fichier source non trouvé pour ce chapitre`);
          }
        } else {
          console.log(`   ⚠️  Aucune question trouvée pour ce chapitre`);
        }
      }
    }

    console.log(`\n✅ ${fixedCount} titres corrigés!\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
  }
}

fixChapterTitlesFromFiles();
