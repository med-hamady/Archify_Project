import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Suppression des données quiz existantes...\n');

  // Supprimer dans l'ordre des dépendances
  await prisma.quizAttempt.deleteMany({});
  console.log('✅ QuizAttempts supprimés');

  await prisma.challengeResult.deleteMany({});
  console.log('✅ ChallengeResults supprimés');

  await prisma.examResult.deleteMany({});
  console.log('✅ ExamResults supprimés');

  await prisma.chapterProgress.deleteMany({});
  console.log('✅ ChapterProgress supprimés');

  await prisma.subjectProgress.deleteMany({});
  console.log('✅ SubjectProgress supprimés');

  await prisma.comment.deleteMany({});
  console.log('✅ Comments supprimés');

  await prisma.question.deleteMany({});
  console.log('✅ Questions supprimées');

  await prisma.chapter.deleteMany({});
  console.log('✅ Chapitres supprimés');

  await prisma.subject.deleteMany({});
  console.log('✅ Matières supprimées');

  console.log('\n✅ Toutes les données quiz ont été supprimées avec succès !');
}

main()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
