/**
 * Script de suppression - Biochimie kebir (ancienne matière vide)
 *
 * Supprime la matière "Biochimie kebir" qui n'a que des PDF/vidéos mais pas de QCM
 * (différente de "Biochimie kebire" qui a 84 QCM)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteBiochimieKebir() {
  console.log('🗑️  Searching for "Biochimie kebir" to delete...\n');

  // Chercher la matière "Biochimie kebir" (sans le 'e' à la fin) qui a 0 questions
  const subjects = await prisma.subject.findMany({
    where: {
      title: {
        in: ['Biochimie kebir', 'Biochimie Kebir', 'Biochimie kébir', 'Biochimie Kébir']
      },
      semester: 'PCEM1'
    },
    include: {
      chapters: { include: { questions: true } },
      coursePdfs: true,
      courseVideos: true,
      qrocs: true
    }
  });

  if (subjects.length === 0) {
    console.log('ℹ️  No "Biochimie kebir" found to delete.');
    console.log('   (Note: "Biochimie kebire" with 84 QCM is kept)');
    return;
  }

  for (const subject of subjects) {
    const totalQuestions = subject.chapters.reduce((acc, ch) => acc + ch.questions.length, 0);

    console.log('Found subject to delete:');
    console.log(`  - Title: ${subject.title}`);
    console.log(`  - ID: ${subject.id}`);
    console.log(`  - Semester: ${subject.semester}`);
    console.log(`  - Questions: ${totalQuestions}`);
    console.log(`  - Chapters: ${subject.chapters.length}`);
    console.log(`  - PDFs: ${subject.coursePdfs.length}`);
    console.log(`  - Videos: ${subject.courseVideos.length}`);
    console.log(`  - QROCs: ${subject.qrocs.length}`);

    // Supprimer les PDF
    if (subject.coursePdfs.length > 0) {
      await prisma.coursePdf.deleteMany({
        where: { subjectId: subject.id }
      });
      console.log(`  ✅ Deleted ${subject.coursePdfs.length} PDFs`);
    }

    // Supprimer les vidéos
    if (subject.courseVideos.length > 0) {
      await prisma.courseVideo.deleteMany({
        where: { subjectId: subject.id }
      });
      console.log(`  ✅ Deleted ${subject.courseVideos.length} videos`);
    }

    // Supprimer les questions des chapitres
    for (const chapter of subject.chapters) {
      if (chapter.questions.length > 0) {
        await prisma.question.deleteMany({
          where: { chapterId: chapter.id }
        });
      }
    }

    // Supprimer les chapitres
    if (subject.chapters.length > 0) {
      await prisma.chapter.deleteMany({
        where: { subjectId: subject.id }
      });
      console.log(`  ✅ Deleted ${subject.chapters.length} chapters`);
    }

    // Supprimer les QROCs
    if (subject.qrocs.length > 0) {
      await prisma.qroc.deleteMany({
        where: { subjectId: subject.id }
      });
      console.log(`  ✅ Deleted ${subject.qrocs.length} QROCs`);
    }

    // Supprimer la matière
    await prisma.subject.delete({
      where: { id: subject.id }
    });

    console.log(`\n✅ Deleted subject: ${subject.title}`);
  }

  console.log('\n✅ Cleanup complete!');
}

// Exécution
deleteBiochimieKebir()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
