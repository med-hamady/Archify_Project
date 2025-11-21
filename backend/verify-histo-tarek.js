const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HISTO_TAREK_SUBJECT_ID = 'cmi9505dz00009zq2szqoj972';

async function verifyHistoTarek() {
  try {
    console.log('🔍 Verifying Histo Tarek import...\n');

    const subject = await prisma.subject.findUnique({
      where: { id: HISTO_TAREK_SUBJECT_ID },
      include: {
        chapters: {
          include: {
            subchapters: {
              include: {
                questions: true
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (!subject) {
      console.log('❌ Subject not found!');
      return;
    }

    const totalSubchapters = subject.chapters.reduce((sum, ch) => sum + ch.subchapters.length, 0);
    const totalQuestions = subject.chapters.reduce((sum, ch) =>
      sum + ch.subchapters.reduce((ssum, sc) => ssum + sc.questions.length, 0), 0);

    console.log('═'.repeat(80));
    console.log(`✅ Subject: ${subject.title}`);
    console.log(`   Semester: ${subject.semester}`);
    console.log(`   Chapters: ${subject.chapters.length}`);
    console.log(`   Subchapters: ${totalSubchapters}`);
    console.log(`   Total Questions: ${totalQuestions}`);
    console.log('═'.repeat(80));

    subject.chapters.forEach((ch, idx) => {
      console.log(`\n📚 ${idx + 1}. ${ch.title}`);

      ch.subchapters.forEach((sc, scIdx) => {
        console.log(`   📂 ${sc.title} (${sc.questions.length} QCMs)`);
      });
    });

    console.log('\n✅ Verification complete!');
    console.log('\nStructure: Subject → Chapters → Subchapters → Questions');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyHistoTarek();
