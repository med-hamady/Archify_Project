import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserSemesters() {
  console.log('🔧 Correction des utilisateurs sans semester...\n');

  // Trouver tous les utilisateurs sans semester valide
  const usersWithoutSemester = await prisma.user.findMany({
    where: {
      OR: [
        { semester: '' },
        { semester: { not: { in: ['PCEM1', 'PCEM2'] } } }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      semester: true
    }
  });

  console.log(`❌ Trouvé ${usersWithoutSemester.length} utilisateur(s) sans semester valide:\n`);

  if (usersWithoutSemester.length === 0) {
    console.log('✅ Tous les utilisateurs ont un semester valide !');
    await prisma.$disconnect();
    return;
  }

  // Afficher les utilisateurs problématiques
  usersWithoutSemester.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.name} (${user.email}) - semester actuel: "${user.semester}"`);
  });

  // Mettre à jour tous les utilisateurs sans semester vers PCEM1 par défaut
  console.log(`\n🔄 Mise à jour vers PCEM1 par défaut...`);

  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { semester: '' },
        { semester: { not: { in: ['PCEM1', 'PCEM2'] } } }
      ]
    },
    data: {
      semester: 'PCEM1'
    }
  });

  console.log(`\n✅ ${result.count} utilisateur(s) mis à jour vers PCEM1`);

  // Vérifier les résultats
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      semester: true
    }
  });

  console.log('\n📊 État final de tous les utilisateurs:');
  const pcem1Count = allUsers.filter(u => u.semester === 'PCEM1').length;
  const pcem2Count = allUsers.filter(u => u.semester === 'PCEM2').length;

  console.log(`  - PCEM1: ${pcem1Count} utilisateurs`);
  console.log(`  - PCEM2: ${pcem2Count} utilisateurs`);

  await prisma.$disconnect();
}

fixUserSemesters().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
