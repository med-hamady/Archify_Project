const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmptyChapterTitles() {
  try {
    console.log('🔧 Correction des titres vides Anatomie PCEM2...\n');

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

    // Mapping des titres attendus basé sur le nombre de questions
    const titleMapping = {
      13: { questions: 20, title: 'Chapitre 1 – Organisation générale du système nerveux' },
      14: { questions: 20, title: 'Chapitre 2 – Moelle épinière et voies nerveuses' },
      15: { questions: 20, title: 'Chapitre 3 – Tronc cérébral et nerfs crâniens' },
      16: { questions: 20, title: 'Chapitre 4 – Cervelet et coordination motrice' },
      17: { questions: 20, title: 'Chapitre 5 – Diencéphale (Thalamus, Hypothalamus, Épithalamus, Métathalamus)' },
      18: { questions: 20, title: 'Chapitre 6 – Télencéphale et cortex cérébral' },
      19: { questions: 20, title: 'Chapitre 7 – Système limbique et formation réticulée' },
      20: { questions: 20, title: 'Chapitre 8 – Système nerveux périphérique et autonome' },
      21: { questions: 20, title: 'Chapitre 9 – Vascularisation du système nerveux' },
      22: { questions: 20, title: 'Chapitre 10 – Méninges, Ventricules et Liquide Cérébrospinal' }
    };

    let fixedCount = 0;

    for (const chapter of anatomieSubject.chapters) {
      // Si le chapitre a un titre vide ou très court
      if (!chapter.title || chapter.title.trim().length < 3) {
        const questionCount = chapter._count.questions;
        console.log(`📄 Chapitre vide trouvé: "${chapter.title}" (${questionCount} questions)`);

        // Essayer de trouver le titre basé sur le nombre de questions
        let newTitle = null;

        // Chercher dans le mapping des chapitres emoji
        for (const [chapNum, info] of Object.entries(titleMapping)) {
          if (questionCount === info.questions) {
            // Vérifier si ce titre n'est pas déjà utilisé
            const titleExists = anatomieSubject.chapters.some(
              c => c.id !== chapter.id && c.title === info.title
            );

            if (!titleExists) {
              newTitle = info.title;
              break;
            }
          }
        }

        if (newTitle) {
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: { title: newTitle }
          });
          console.log(`   ✅ Titre mis à jour: "${newTitle}"`);
          fixedCount++;
        } else {
          console.log(`   ⚠️  Impossible de déterminer le titre (${questionCount} questions)`);
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

fixEmptyChapterTitles();
