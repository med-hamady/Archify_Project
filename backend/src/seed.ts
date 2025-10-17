import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');


  // Create Premium subscription plan
  const plans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { id: 'premium-plan' },
      update: {},
      create: {
        id: 'premium-plan',
        name: 'Premium',
        description: 'Accès complet à tous les cours et ressources de la plateforme Archify',
        type: 'FULL_ACCESS',
        interval: 'yearly',
        priceCents: 50000, // 500 MRU par an
        currency: 'MRU',
        features: [
          'Accès illimité à tous les cours vidéo',
          'Accès à tous les documents PDF et supports',
          'Téléchargement des ressources',
          'Support prioritaire',
          'Mises à jour et nouveaux contenus inclus',
          'Valable pendant 1 an'
        ],
        isActive: true
      }
    })
  ]);

  console.log('✅ Subscription plans created');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@archify.ma' },
    update: {},
    create: {
      email: 'admin@archify.ma',
      passwordHash: adminPassword,
      name: 'Administrateur Archify',
      role: 'SUPERADMIN',
      semester: '1'
    }
  });

  console.log('✅ Admin user created');

  // Create test student
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@archify.ma' },
    update: {},
    create: {
      email: 'student@archify.ma',
      passwordHash: studentPassword,
      name: 'Étudiant Test',
      role: 'STUDENT',
      semester: '1'
    }
  });

  console.log('✅ Test student created');

  // Create courses
  const courses = await Promise.all([
    prisma.course.upsert({
      where: { id: 'course-1' },
      update: {},
      create: {
        id: 'course-1',
        title: 'Introduction à l\'Algorithmique',
        description: 'Découvrez les bases de l\'algorithmique et de la programmation avec des exemples pratiques et des exercices concrets.',
        semester: 'S1',
        tags: ['Algorithmique', 'Programmation', 'Logique'],
        isPremium: true,
        views: 150
      }
    }),
    prisma.course.upsert({
      where: { id: 'course-2' },
      update: {},
      create: {
        id: 'course-2',
        title: 'Analyse Mathématique',
        description: 'Maîtrisez les concepts fondamentaux de l\'analyse mathématique et des fonctions avec des applications pratiques.',
        semester: 'S1',
        tags: ['Mathématiques', 'Analyse', 'Fonctions'],
        isPremium: false,
        views: 89
      }
    }),
    prisma.course.upsert({
      where: { id: 'course-3' },
      update: {},
      create: {
        id: 'course-3',
        title: 'Logique et Théorie des Ensembles',
        description: 'Explorez la logique mathématique et les fondements de la théorie des ensembles avec des exemples concrets.',
        semester: 'S2',
        tags: ['Logique', 'Théorie des Ensembles', 'Mathématiques'],
        isPremium: true,
        views: 67
      }
    }),
    prisma.course.upsert({
      where: { id: 'course-4' },
      update: {},
      create: {
        id: 'course-4',
        title: 'Comptabilité Générale',
        description: 'Apprenez les principes fondamentaux de la comptabilité générale avec des cas pratiques.',
        semester: 'S1',
        tags: ['Comptabilité', 'Finance', 'Gestion'],
        isPremium: false,
        views: 120
      }
    })
  ]);

  console.log('✅ Courses created');

  // Create lessons for each course
  const lessons = await Promise.all([
    // Course 1 - Algorithmique
    prisma.lesson.upsert({
      where: { id: 'lesson-1-1' },
      update: {},
      create: {
        id: 'lesson-1-1',
        courseId: courses[0].id,
        title: 'Introduction aux algorithmes - Examen 2020',
        type: 'VIDEO',
        durationSec: 1800, // 30 minutes
        vimeoId: '123456789',
        isPremium: true,
        requiresVideoSubscription: true,
        orderIndex: 1
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-1-2' },
      update: {},
      create: {
        id: 'lesson-1-2',
        courseId: courses[0].id,
        title: 'Variables et types de données - Examen 2021',
        type: 'VIDEO',
        durationSec: 2400, // 40 minutes
        vimeoId: '123456790',
        isPremium: true,
        requiresVideoSubscription: true,
        orderIndex: 2
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-1-3' },
      update: {},
      create: {
        id: 'lesson-1-3',
        courseId: courses[0].id,
        title: 'Structures de contrôle - Test 2020',
        type: 'VIDEO',
        durationSec: 2700, // 45 minutes
        vimeoId: '123456791',
        isPremium: true,
        requiresVideoSubscription: true,
        orderIndex: 3
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-1-4' },
      update: {},
      create: {
        id: 'lesson-1-4',
        courseId: courses[0].id,
        title: 'Solutions écrites - Algorithmique 2020',
        type: 'PDF',
        pdfUrl: 'https://example.com/solutions-algorithmique-2020.pdf',
        isPremium: true,
        requiresDocumentSubscription: true,
        orderIndex: 4
      }
    }),

    // Course 2 - Analyse Mathématique
    prisma.lesson.upsert({
      where: { id: 'lesson-2-1' },
      update: {},
      create: {
        id: 'lesson-2-1',
        courseId: courses[1].id,
        title: 'Limites et continuité - Examen 2020',
        type: 'VIDEO',
        durationSec: 2100, // 35 minutes
        vimeoId: '123456792',
        isPremium: true,
        requiresVideoSubscription: true,
        orderIndex: 1
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-2-2' },
      update: {},
      create: {
        id: 'lesson-2-2',
        courseId: courses[1].id,
        title: 'Dérivées - Examen 2021',
        type: 'VIDEO',
        durationSec: 3000, // 50 minutes
        vimeoId: '123456793',
        isPremium: true,
        requiresVideoSubscription: true,
        orderIndex: 2
      }
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-2-3' },
      update: {},
      create: {
        id: 'lesson-2-3',
        courseId: courses[1].id,
        title: 'Solutions écrites - Analyse 2020',
        type: 'PDF',
        pdfUrl: 'https://example.com/solutions-analyse-2020.pdf',
        isPremium: true,
        requiresDocumentSubscription: true,
        orderIndex: 3
      }
    }),

    // Course 3 - Logique
    prisma.lesson.upsert({
      where: { id: 'lesson-3-1' },
      update: {},
      create: {
        id: 'lesson-3-1',
        courseId: courses[2].id,
        title: 'Logique propositionnelle - Test 2020',
        type: 'VIDEO',
        durationSec: 2400, // 40 minutes
        vimeoId: '123456794',
        isPremium: true,
        requiresVideoSubscription: true,
        orderIndex: 1
      }
    }),

    // Course 4 - Comptabilité
    prisma.lesson.upsert({
      where: { id: 'lesson-4-1' },
      update: {},
      create: {
        id: 'lesson-4-1',
        courseId: courses[3].id,
        title: 'Principes de la comptabilité - Examen 2020',
        type: 'VIDEO',
        durationSec: 1800, // 30 minutes
        vimeoId: '123456795',
        isPremium: true,
        requiresVideoSubscription: true,
        orderIndex: 1
      }
    })
  ]);

  console.log('✅ Lessons created');

  // Create some comments
  await Promise.all([
    prisma.comment.upsert({
      where: { id: 'comment-1' },
      update: {},
      create: {
        id: 'comment-1',
        lessonId: lessons[0].id,
        userId: student.id,
        content: 'Excellent cours, très bien expliqué !'
      }
    }),
    prisma.comment.upsert({
      where: { id: 'comment-2' },
      update: {},
      create: {
        id: 'comment-2',
        lessonId: lessons[0].id,
        userId: student.id,
        content: 'J\'aimerais plus d\'exemples pratiques dans la prochaine leçon.'
      }
    })
  ]);

  console.log('✅ Comments created');

  // Create a premium subscription for the student
  await prisma.subscription.upsert({
    where: { id: 'sub-1' },
    update: {},
    create: {
      id: 'sub-1',
      userId: student.id,
      planId: plans[0].id, // Premium plan
      status: 'ACTIVE',
      startAt: new Date(),
      endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  });

  console.log('✅ Test subscription created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('Admin: admin@archify.ma / admin123');
  console.log('Student: student@archify.ma / student123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
