"use strict";
/**
 * Import automatique des données DCEM1 depuis le fichier SQL
 *
 * Ce script s'exécute au démarrage du serveur et importe les 985 questions
 * si elles ne sont pas déjà présentes
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.importDCEM1SQL = importDCEM1SQL;
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
/**
 * Vérifie si DCEM1 a des questions
 */
async function hasDCEM1Questions() {
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
async function importDCEM1SQL() {
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
        // Nettoyer d'abord les données DCEM1 existantes (structure vide créée par seed)
        console.log('🗑️  Nettoyage des données DCEM1 existantes...');
        await prisma.$executeRaw `
      DELETE FROM "Question" WHERE "chapterId" IN (
        SELECT id FROM "Chapter" WHERE "subjectId" IN (
          SELECT id FROM "Subject" WHERE semester = 'DCEM1'
        )
      )
    `;
        await prisma.$executeRaw `
      DELETE FROM "Chapter" WHERE "subjectId" IN (
        SELECT id FROM "Subject" WHERE semester = 'DCEM1'
      )
    `;
        await prisma.$executeRaw `DELETE FROM "Subject" WHERE semester = 'DCEM1'`;
        console.log('✓ Nettoyage terminé\n');
        console.log('📄 Lecture du fichier SQL...');
        const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
        // Diviser en statements individuels et filtrer
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => {
            // Ignorer les lignes vides, commentaires, et statements SET/DELETE (déjà fait manuellement)
            if (s.length === 0)
                return false;
            if (s.startsWith('--'))
                return false;
            if (s.startsWith('SET '))
                return false;
            if (s.startsWith('DELETE '))
                return false;
            return true;
        });
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
            }
            catch (error) {
                errorCount++;
                // Afficher les 10 premières erreurs pour diagnostic
                if (errorCount <= 10) {
                    console.error(`   ⚠️  Erreur statement ${i + 1}:`, error.message.substring(0, 200));
                    // Afficher le statement qui a causé l'erreur (50 premiers caractères)
                    console.error(`       Statement: ${statement.substring(0, 100)}...`);
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
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'import SQL DCEM1:', error);
        // Ne pas throw pour ne pas bloquer le démarrage
    }
    finally {
        await prisma.$disconnect();
    }
}
//# sourceMappingURL=import-dcem1-sql.js.map