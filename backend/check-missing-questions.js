const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkMissingQuestions() {
  try {
    console.log('\n🔍 Recherche des questions manquantes...\n');

    // Récupérer le sujet Physiologie
    const physioSubject = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Physiologie', mode: 'insensitive' },
        semester: 'PCEM1'
      },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              select: {
                id: true,
                questionText: true
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    if (!physioSubject) {
      console.log('❌ Sujet non trouvé');
      await prisma.$disconnect();
      return;
    }

    const physioDir = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem1\\S inetrnational\\quiz pcem1\\physio';

    // Mapping manuel des chapitres aux fichiers
    const chapterFileMap = {
      'Chapitre 1 : Physiologie du milieu intérieur (30 QCM)': '🩸 Chapitre 1 – Physiologie du mili.txt',
      'Chapitre 2 : Physiologie cellulaire et membranaire (1 → 40)': '⚡ Chapitre 2 – Physiologie cellulai.txt',
      'Chapitre 3 : Physiologie du système nerveux (1 → 20)': '🧠 Chapitre 3 – Physiologie du syst.txt',
      'Chapitre 4 : Physiologie musculaire (1 → 20)': '💪 Chapitre 4 – Physiologie muscula.txt',
      'Chapitre 5 : Physiologie de la thermorégulation (1 → 20)': '🌡️ Chapitre 5 – Physiologie de la.txt',
      'Chapitre 6 : Physiologie du métabolisme et de la nutrition (version finale mélangée)': '🍽️ Chapitre 6 – Physiologie du mét.txt'
    };

    // Vérifier chaque chapitre
    for (const chapter of physioSubject.chapters) {
      const matchingFile = chapterFileMap[chapter.title];

      if (!matchingFile) {
        console.log(`⚠️  Pas de fichier trouvé pour: ${chapter.title}`);
        continue;
      }

      const filePath = path.join(physioDir, matchingFile);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extraire les questions du fichier
      const fileQuestions = [];
      const questionRegex = /([0-9]️⃣|🔟|1[0-9]️⃣|20️⃣|30️⃣|40️⃣)\s+Question\s*:\s*(.+)/g;
      let match;
      while ((match = questionRegex.exec(content)) !== null) {
        fileQuestions.push({
          number: match[1],
          text: match[2].trim()
        });
      }

      console.log(`\n📄 ${chapter.title}`);
      console.log(`   Fichier: ${matchingFile}`);
      console.log(`   Questions dans le fichier: ${fileQuestions.length}`);
      console.log(`   Questions en DB: ${chapter.questions.length}`);

      if (fileQuestions.length !== chapter.questions.length) {
        console.log(`\n   ⚠️  Questions manquantes:\n`);

        // Comparer les questions
        const dbQuestions = chapter.questions.map(q =>
          q.questionText.trim().toLowerCase().substring(0, 50)
        );

        fileQuestions.forEach((fq, index) => {
          const found = dbQuestions.some(dbq =>
            dbq.includes(fq.text.trim().toLowerCase().substring(0, 30))
          );

          if (!found) {
            console.log(`   ❌ ${fq.number} - ${fq.text.substring(0, 60)}...`);
          }
        });
      } else {
        console.log(`   ✅ Toutes les questions présentes`);
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkMissingQuestions();
