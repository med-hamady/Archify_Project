/**
 * Script pour créer un compte admin
 * Usage: node create-admin.js <email>
 *
 * IMPORTANT: Créez d'abord un compte normal sur le site avec cet email,
 * puis exécutez ce script pour le promouvoir en ADMIN.
 */

const { PrismaClient } = require('@prisma/client');

// Configuration de l'URL de la base de données
// IMPORTANT: Vérifiez l'URL complète sur Render Dashboard → archify-db → Connections
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://archify:GU6z0p3RFqI34AAB9n0HhuFAuk1EsHS9@dpg-d3ofreu3jp1c73bv5f20-a.oregon-postgres.render.com/archify';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function createAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Erreur: Email requis');
    console.error('Usage: node create-admin.js <email>');
    console.error('Exemple: node create-admin.js admin@iscae.ma');
    process.exit(1);
  }

  console.log(`\n🔍 Recherche de l'utilisateur avec l'email: ${email}...`);

  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {
      console.error(`\n❌ Erreur: Aucun utilisateur trouvé avec l'email "${email}"`);
      console.error('\n📝 Instructions:');
      console.error('1. Allez sur https://archify-project.vercel.app');
      console.error('2. Cliquez sur "S\'inscrire"');
      console.error(`3. Créez un compte avec l'email: ${email}`);
      console.error('4. Puis ré-exécutez ce script\n');
      process.exit(1);
    }

    console.log('✅ Utilisateur trouvé!');
    console.log(`   - Nom: ${existingUser.name}`);
    console.log(`   - Email: ${existingUser.email}`);
    console.log(`   - Rôle actuel: ${existingUser.role}`);

    if (existingUser.role === 'ADMIN') {
      console.log('\n⚠️  Cet utilisateur est déjà administrateur!');
      process.exit(0);
    }

    // Promouvoir en admin
    console.log('\n🔄 Promotion en administrateur...');
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log('\n✅ Succès! L\'utilisateur a été promu ADMIN');
    console.log(`   - Nom: ${updatedUser.name}`);
    console.log(`   - Email: ${updatedUser.email}`);
    console.log(`   - Nouveau rôle: ${updatedUser.role}`);
    console.log('\n🎉 Vous pouvez maintenant vous connecter sur le site avec cet email et accéder au dashboard admin!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la mise à jour:', error.message);

    if (error.message.includes('getaddrinfo') || error.message.includes('connect')) {
      console.error('\n💡 Vérifiez que:');
      console.error('   - Votre connexion internet fonctionne');
      console.error('   - L\'URL de la base de données est correcte');
      console.error('   - Le service Render n\'est pas endormi (attendez 1 minute et réessayez)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
