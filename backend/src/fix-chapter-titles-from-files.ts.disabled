import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function extractTitleFromFile(filePath: string): string | null {
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
  } catch (error: any) {
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
    const fileTitles: { [key: string]: string } = {};
    for (const file of files) {
      const filePath = path.join(anatomieDir, file);
      const title = extractTitleFromFile(filePath);
      if (title) {
        fileTitles[file] = title;
      }
    }

    let fixedCount = 0;
    const usedTitles = new Set<string>(); // Track already assigned titles
    const usedFiles = new Set<string>(); // Track already used files

    // Parcourir les chapitres et corriger les titres vides
    for (const chapter of anatomieSubject.chapters) {
      if (!chapter.title || chapter.title.trim().length < 3) {
        const questionCount = chapter._count.questions;
        console.log(`📄 Chapitre vide: ${chapter.id} (${questionCount} questions)`);

        // Récupérer plusieurs questions du chapitre pour un meilleur matching
        const sampleQuestions = await prisma.question.findMany({
          where: { chapterId: chapter.id },
          take: 3 // Get first 3 questions for better matching
        });

        if (sampleQuestions.length > 0) {
          // Chercher le fichier qui contient ces questions
          let matchedFile: string | null = null;
          let matchedTitle: string | null = null;
          let bestMatchScore = 0;

          for (const [file, title] of Object.entries(fileTitles)) {
            // Skip files that have already been used
            if (usedFiles.has(file) || usedTitles.has(title)) {
              continue;
            }

            const filePath = path.join(anatomieDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Count how many questions from this chapter match this file
            let matchScore = 0;
            for (const question of sampleQuestions) {
              // Use a longer substring for better matching accuracy
              const searchText = question.questionText.substring(0, 100);
              if (content.includes(searchText)) {
                matchScore++;
              }
            }

            // If at least 2 out of 3 questions match, this is likely the correct file
            if (matchScore > bestMatchScore) {
              bestMatchScore = matchScore;
              matchedFile = file;
              matchedTitle = title;
            }
          }

          // Require at least 2 matching questions for confidence
          if (matchedTitle && bestMatchScore >= 2) {
            await prisma.chapter.update({
              where: { id: chapter.id },
              data: { title: matchedTitle }
            });
            console.log(`   ✅ Titre mis à jour: "${matchedTitle}" (source: ${matchedFile}, score: ${bestMatchScore}/${sampleQuestions.length})`);
            usedTitles.add(matchedTitle);
            usedFiles.add(matchedFile!);
            fixedCount++;
          } else if (matchedTitle && bestMatchScore === 1) {
            // If only 1 match, still use it but log a warning
            await prisma.chapter.update({
              where: { id: chapter.id },
              data: { title: matchedTitle }
            });
            console.log(`   ⚠️  Titre mis à jour (faible confiance): "${matchedTitle}" (source: ${matchedFile}, score: ${bestMatchScore}/${sampleQuestions.length})`);
            usedTitles.add(matchedTitle);
            usedFiles.add(matchedFile!);
            fixedCount++;
          } else {
            console.log(`   ⚠️  Fichier source non trouvé pour ce chapitre (meilleur score: ${bestMatchScore})`);
          }
        } else {
          console.log(`   ⚠️  Aucune question trouvée pour ce chapitre`);
        }
      }
    }

    console.log(`\n✅ ${fixedCount} titres corrigés!\n`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
  }
}

fixChapterTitlesFromFiles();
