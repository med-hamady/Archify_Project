/**
 * Export Histo Nozha data to seed file for Render deployment
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportHistoNozha() {
  console.log('📤 Export de Histo Nozha...\n');

  try {
    // Récupérer le sujet Histo Nozha
    const subject = await prisma.subject.findFirst({
      where: {
        title: 'Histo Nozha',
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            subchapters: {
              orderBy: { orderIndex: 'asc' },
              include: {
                questions: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!subject) {
      console.log('❌ Sujet non trouvé');
      return;
    }

    // Transformer les données pour l'export
    const exportData = {
      subject: {
        title: subject.title,
        description: subject.description,
        semester: subject.semester,
        tags: subject.tags,
        totalQCM: subject.totalQCM
      },
      chapters: subject.chapters.map(chapter => ({
        title: chapter.title,
        description: chapter.description,
        orderIndex: chapter.orderIndex,
        subchapters: chapter.subchapters.map(subchapter => ({
          title: subchapter.title,
          orderIndex: subchapter.orderIndex,
          questions: subchapter.questions.map(q => ({
            questionText: q.questionText,
            options: q.options,
            explanation: q.explanation,
            orderIndex: q.orderIndex
          }))
        }))
      }))
    };

    // Écrire dans un fichier JSON
    const outputPath = path.join(__dirname, 'histo-nozha-seed.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    // Statistiques
    let totalSubchapters = 0;
    let totalQuestions = 0;
    exportData.chapters.forEach(ch => {
      totalSubchapters += ch.subchapters.length;
      ch.subchapters.forEach(sub => {
        totalQuestions += sub.questions.length;
      });
    });

    console.log('✅ Export terminé!');
    console.log(`📊 Statistiques:`);
    console.log(`   - Chapitres: ${exportData.chapters.length}`);
    console.log(`   - Sous-chapitres: ${totalSubchapters}`);
    console.log(`   - Questions: ${totalQuestions}`);
    console.log(`\n📁 Fichier créé: ${outputPath}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportHistoNozha()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
