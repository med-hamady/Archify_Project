import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportDCEM1JSON() {
  try {
    console.log('📦 Export des données DCEM1 en JSON...\n');

    // Récupérer tous les sujets DCEM1 avec leurs relations
    const subjects = await prisma.subject.findMany({
      where: {
        semester: 'DCEM1'
      },
      include: {
        chapters: {
          include: {
            questions: {
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    console.log(`✓ ${subjects.length} sujets trouvés\n`);

    let totalChapters = 0;
    let totalQuestions = 0;

    for (const subject of subjects) {
      console.log(`📚 Export: ${subject.title}`);
      console.log(`   Chapitres: ${subject.chapters.length}`);

      const subjectQuestions = subject.chapters.reduce(
        (sum, c) => sum + c.questions.length,
        0
      );
      console.log(`   Questions: ${subjectQuestions}`);
      console.log(`   ✓ Exporté\n`);

      totalChapters += subject.chapters.length;
      totalQuestions += subjectQuestions;
    }

    // Écrire dans un fichier JSON
    const outputFile = 'dcem1-data.json';
    const jsonContent = JSON.stringify(subjects, null, 2);

    fs.writeFileSync(outputFile, jsonContent);

    console.log('✅ Export terminé!');
    console.log(`📄 Fichier créé: ${outputFile}`);
    console.log(`📊 Taille: ${(jsonContent.length / 1024).toFixed(2)} KB\n`);

    console.log('📊 Statistiques:');
    console.log(`   - ${subjects.length} sujets`);
    console.log(`   - ${totalChapters} chapitres`);
    console.log(`   - ${totalQuestions} questions\n`);

    console.log('💡 Pour importer sur Render:');
    console.log('   Le fichier dcem1-data.json sera automatiquement utilisé au démarrage\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'export
exportDCEM1JSON()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
