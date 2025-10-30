/**
 * Script de migration : deviceId → authorizedDevices
 * Convertit l'ancien système (1 appareil) vers le nouveau (2 appareils max)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateDevices() {
  console.log('🔄 Début de la migration des appareils...');

  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        deviceId: true,
        authorizedDevices: true
      }
    });

    console.log(`📊 Trouvé ${users.length} utilisateurs`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Si l'utilisateur a déjà authorizedDevices, sauter
        if (user.authorizedDevices && user.authorizedDevices.length > 0) {
          console.log(`⏭️  ${user.email}: déjà migré (${user.authorizedDevices.length} appareil(s))`);
          skippedCount++;
          continue;
        }

        // Si l'utilisateur a un deviceId (ancien système)
        if (user.deviceId) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              authorizedDevices: [user.deviceId],
              activeDeviceId: null, // Réinitialiser la session
              activeToken: null
            }
          });
          console.log(`✅ ${user.email}: migré (1 appareil)`);
          migratedCount++;
        } else {
          // Pas de deviceId, initialiser avec tableau vide
          await prisma.user.update({
            where: { id: user.id },
            data: {
              authorizedDevices: [],
              activeDeviceId: null,
              activeToken: null
            }
          });
          console.log(`🆕 ${user.email}: initialisé (0 appareil)`);
          migratedCount++;
        }
      } catch (err) {
        console.error(`❌ Erreur pour ${user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📈 Résumé de la migration:');
    console.log(`  ✅ Migrés: ${migratedCount}`);
    console.log(`  ⏭️  Déjà migrés: ${skippedCount}`);
    console.log(`  ❌ Erreurs: ${errorCount}`);
    console.log(`  📊 Total: ${users.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration terminée avec succès !');
    } else {
      console.log('\n⚠️  Migration terminée avec des erreurs');
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateDevices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
