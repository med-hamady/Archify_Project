/**
 * Import automatique des données DCEM1 depuis le fichier SQL
 *
 * Ce script s'exécute au démarrage du serveur et importe les 985 questions
 * si elles ne sont pas déjà présentes
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Vérifie si DCEM1 a des questions
 */
async function hasDCEM1Questions(): Promise<boolean> {
  const count = await prisma.question.count({
    where: {
      chapter: {
        subject: {
          semester: 'DCEM1'
        }
      }
    }
  });

  if (count > 0) {
    console.log(`✓ DCEM1 contient déjà ${count} questions`);
    return true;
  }

  return false;
}

/**
 * Importe les données depuis le fichier SQL
 */
export async function importDCEM1SQL() {
  try {
    // Vérifier si déjà importé
    if (await hasDCEM1Questions()) {
      return;
    }

    console.log('📦 Import DCEM1 depuis SQL...\n');

    // Chercher le fichier SQL
    const sqlFile = path.join(__dirname, '..', 'dcem1-export.sql');

    if (!fs.existsSync(sqlFile)) {
      console.log('⚠️  Fichier dcem1-export.sql non trouvé, skip import');
      console.log('   Pour importer manuellement, utilisez le fichier SQL ou l\'interface admin\n');
      return;
    }

    console.log('📄 Lecture du fichier SQL...');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // Diviser en statements individuels
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 ${statements.length} statements à exécuter\n`);

    // Exécuter chaque statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;

        // Afficher la progression tous les 100 statements
        if ((i + 1) % 100 === 0) {
          console.log(`   Progression: ${i + 1}/${statements.length} statements`);
        }
      } catch (error: any) {
        // Ignorer les erreurs de contraintes (données déjà existantes)
        if (!error.message.includes('duplicate') && !error.message.includes('already exists')) {
          errorCount++;
          if (errorCount <= 5) { // Afficher seulement les 5 premières erreurs
            console.error(`   ⚠️  Erreur statement ${i + 1}:`, error.message.substring(0, 100));
          }
        }
      }
    }

    console.log(`\n✅ Import SQL terminé!`);
    console.log(`   ${successCount} statements réussis`);
    if (errorCount > 0) {
      console.log(`   ${errorCount} erreurs (ignorées si données déjà existantes)`);
    }

    // Vérification finale
    const finalCount = await prisma.question.count({
      where: {
        chapter: {
          subject: {
            semester: 'DCEM1'
          }
        }
      }
    });

    console.log(`\n📊 Total DCEM1: ${finalCount} questions importées\n`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import SQL DCEM1:', error);
    // Ne pas throw pour ne pas bloquer le démarrage
  } finally {
    await prisma.$disconnect();
  }
}
