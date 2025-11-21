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

/**
 * Parse les fichiers d'anatomie PCEM2 avec format emoji
 */
function parseAnatomieFile(filePath: string): { title: string; questions: ParsedQuestion[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());

  // Extraire le titre du chapitre (première ligne)
  let chapterTitle = lines[0] || 'Chapitre sans titre';
  // Nettoyer le titre (enlever emojis au début)
  chapterTitle = chapterTitle.replace(/^[^\wÀ-ÿ\s]+\s*/, '').trim();
  // Enlever les annotations de type (1->40), (1->20), (20 QCM), etc.
  chapterTitle = chapterTitle.replace(/s*([^)]*)s*$/, '').trim();

  const questions: ParsedQuestion[] = [];
  let currentQuestion: ParsedQuestion | null = null;
  let currentQuestionTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const qcmMatch = line.match(/^QCMs+(d+)s+[—–-]s+(.+)/i);
    // Détecter une nouvelle section de QCM (1️⃣, 2️⃣, ..., 🔟, 11️⃣, ...)
    const sectionMatch = line.match(/^([0-9]️⃣|🔟|1[0-9]️⃣|20️⃣)\s+(.+)/);
    if (qcmMatch || sectionMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
      }

      // Démarrer une nouvelle question
      if (qcmMatch) {
        currentQuestionTitle = qcmMatch[2].trim();
      } else if (sectionMatch) {
        currentQuestionTitle = sectionMatch[2].trim();
      }
      currentQuestion = {
        questionText: currentQuestionTitle,
        options: [],
        explanation: undefined
      };
      continue;
    }

    // Détecter une option (A., B., C., D., E.)
    const optionMatch = line.match(/^([A-E])\.\s+(.+)/);
    if (optionMatch && currentQuestion) {
      const letter = optionMatch[1];
      const fullText = optionMatch[2];

      // Séparer le texte de la justification
      // Format 1 (emoji): "Texte de la réponse ✔️" ou "Texte ❌ — Justification"
      // Format 2 (QCM ch1-12): "Texte (✔️)" ou "Texte (❌) → Justification"
      const hasCheck = fullText.includes('✔️');
      const hasCross = fullText.includes('❌');

      let optionText = '';
      let justification = '';
      let isCorrect = false;

      if (hasCheck) {
        isCorrect = true;
        // Remove both formats: "✔️" and "(✔️)"
        optionText = fullText.replace(/\s*\(?\s*✔️\s*\)?\s*$/, '').trim();
      } else if (hasCross) {
        isCorrect = false;
        // Format 2: "Texte (❌) → Justification"
        const format2Match = fullText.match(/^(.+?)\s*\(❌\)\s*→\s*(.+)$/);
        if (format2Match) {
          optionText = format2Match[1].trim();
          justification = format2Match[2].trim();
        } else {
          // Format 1: "Texte ❌ — Justification"
          const parts = fullText.split('❌');
          optionText = parts[0].trim();
          if (parts[1]) {
            // Extraire la justification après le "—"
            const justParts = parts[1].split('—');
            if (justParts.length > 1) {
              justification = justParts.slice(1).join('—').trim();
            }
          }
        }
      } else {
        // Pas de symbole trouvé, considérer comme faux par défaut
        optionText = fullText.trim();
        isCorrect = false;
      }

      currentQuestion.options.push({
        text: optionText,
        isCorrect,
        justification: justification || undefined
      });
      continue;
    }

    // Détecter la justification générale
    // Détecter la conclusion (🧠 Conclusion)
    const conclusionMatch = line.match(/^🧠\s*Conclusion\s*:?\s*(.+)/);
    if (conclusionMatch && currentQuestion) {
      currentQuestion.explanation = conclusionMatch[1].trim();
      continue;
    }

    const justificationMatch = line.match(/^Justification générale\s*:\s*(.+)/);
    if (justificationMatch && currentQuestion) {
      currentQuestion.explanation = justificationMatch[1].trim();
      continue;
    }
  }

  // Ajouter la dernière question
  if (currentQuestion && currentQuestion.options.length > 0) {
    questions.push(currentQuestion);
  }

  return { title: chapterTitle, questions };
}

async function main() {
  console.log('🚀 Démarrage de la réimportation des quiz d\'anatomie PCEM2...\n');

  try {
    // 1. Trouver le sujet Anatomie PCEM2
    const anatomieSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          include: { questions: true }
        }
      }
    });

    if (!anatomieSubject) {
      console.error('❌ Sujet Anatomie PCEM2 non trouvé');
      return;
    }

    console.log(`📚 Sujet trouvé: ${anatomieSubject.title} (${anatomieSubject.chapters.length} chapitres)\n`);

    // 2. Supprimer toutes les anciennes questions d'anatomie PCEM2
    console.log('🗑️  Suppression des anciennes questions...');
    const chapterIds = anatomieSubject.chapters.map(c => c.id);
    const deleteResult = await prisma.question.deleteMany({
      where: { chapterId: { in: chapterIds } }
    });
    console.log(`✅ ${deleteResult.count} anciennes questions supprimées\n`);

    // 3. Lire et parser tous les fichiers
    const anatomieDir = path.join(__dirname, '../data/quiz/pcem2/anatomie');
    const files = fs.readdirSync(anatomieDir).filter(f => f.endsWith('.txt'));

    console.log(`📂 ${files.length} fichiers trouvés dans le dossier anatomie\n`);

    let totalQuestionsImported = 0;

    for (const file of files) {
      const filePath = path.join(anatomieDir, file);
      console.log(`📄 Traitement de: ${file}`);

      const { title, questions } = parseAnatomieFile(filePath);
      console.log(`   Titre: ${title}`);
      console.log(`   Questions trouvées: ${questions.length}`);

      // Trouver ou créer le chapitre correspondant
      let chapter = anatomieSubject.chapters.find(c =>
        c.title.toLowerCase().includes(title.toLowerCase().substring(0, 20))
      );

      if (!chapter) {
        // Créer un nouveau chapitre
        const orderIndex = anatomieSubject.chapters.length;
        const newChapter = await prisma.chapter.create({
          data: {
            title,
            subjectId: anatomieSubject.id,
            orderIndex,
            description: null
          },
          include: { questions: true }
        });
        chapter = newChapter;
        console.log(`   ✨ Nouveau chapitre créé`);
      } else {
        console.log(`   ✓ Chapitre existant trouvé`);
      }

      // Importer les questions
      for (const q of questions) {
        await prisma.question.create({
          data: {
            chapterId: chapter.id,
            questionText: q.questionText,
            orderIndex: 0,
            options: q.options.map(opt => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              justification: opt.justification
            })),
            explanation: q.explanation
          }
        });
      }

      totalQuestionsImported += questions.length;
      console.log(`   ✅ ${questions.length} questions importées\n`);
    }

    console.log(`\n🎉 Import terminé avec succès !`);
    console.log(`📊 Total: ${totalQuestionsImported} questions importées dans ${files.length} chapitres`);

    // 4. Supprimer les chapitres vides (anciens chapitres qui n'ont plus de questions)
    console.log(`\n🗑️  Nettoyage des chapitres vides...`);

    const allChapters = await prisma.chapter.findMany({
      where: { subjectId: anatomieSubject.id },
      include: {
        _count: { select: { questions: true } }
      }
    });

    const emptyChapters = allChapters.filter(ch => ch._count.questions === 0);

    if (emptyChapters.length > 0) {
      console.log(`   Chapitres vides trouvés: ${emptyChapters.length}`);

      for (const chapter of emptyChapters) {
        await prisma.chapter.delete({ where: { id: chapter.id } });
        console.log(`   ✓ Supprimé: ${chapter.title}`);
      }

      console.log(`\n✅ ${emptyChapters.length} chapitres vides supprimés`);
    } else {
      console.log(`   ✓ Aucun chapitre vide à supprimer`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
