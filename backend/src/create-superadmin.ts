/**
 * Script pour créer un SUPERADMIN
 * Usage: npx ts-node src/create-superadmin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'babaadmin@facgame.com';
  const password = 'babaadminfacgame';
  const name = 'Baba Admin';

  console.log('🔐 Création du SUPERADMIN...');
  console.log(`   Email: ${email}`);
  console.log(`   Mot de passe: ${password}`);

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Mettre à jour le rôle en SUPERADMIN si ce n'est pas déjà le cas
      if (existingUser.role === 'SUPERADMIN') {
        console.log('✅ Le SUPERADMIN existe déjà!');
      } else {
        await prisma.user.update({
          where: { email },
          data: { role: 'SUPERADMIN' }
        });
        console.log('✅ Utilisateur existant promu en SUPERADMIN!');
      }
    } else {
      // Créer le SUPERADMIN
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name,
          role: 'SUPERADMIN',
          semester: '',
          assignedSemesters: []
        }
      });

      console.log('✅ SUPERADMIN créé avec succès!');
    }

    console.log('\n📋 Informations de connexion:');
    console.log(`   Email: ${email}`);
    console.log(`   Mot de passe: ${password}`);
    console.log('\n⚠️  Changez le mot de passe après la première connexion!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
