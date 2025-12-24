"use strict";
/**
 * Import Script - QROC PCEP2
 *
 * Importe les QROC pour le niveau PCEP2 depuis le fichier JSON embarqué
 * Matières:
 * - Biochimie
 * - Biologie
 * - Botanique
 * - Chimie organique
 * - Pharmacie Galénique
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
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
// ============================================
// CONFIGURATION
// ============================================
const SEMESTER = 'PCEP2';
const SEED_FILE = path.join(__dirname, '..', 'data', 'pcep2', 'pcep2-qroc-seed.json');
// ============================================
// IMPORTATION DANS LA BASE DE DONNÉES
// ============================================
async function importPCEP2Qrocs() {
    console.log('🚀 Starting PCEP2 QROC import...\n');
    // Vérifier si le fichier seed existe
    if (!fs.existsSync(SEED_FILE)) {
        console.log(`⚠️  Seed file not found: ${SEED_FILE}`);
        console.log('   Skipping PCEP2 QROC import.');
        return;
    }
    // Charger les données depuis le fichier JSON
    const seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    console.log(`📦 Loaded seed data: ${seedData.totalQrocs} QROCs from ${seedData.exportedAt}`);
    let totalImported = 0;
    for (const subjectData of seedData.subjects) {
        console.log(`\n📚 Importing QROC for subject: ${subjectData.title}`);
        // Créer ou récupérer la matière (pour les QROC, on utilise la même matière que les QCM si elle existe)
        let subject = await prisma.subject.findFirst({
            where: {
                title: subjectData.title,
                semester: SEMESTER
            }
        });
        if (!subject) {
            // Créer la matière si elle n'existe pas
            subject = await prisma.subject.create({
                data: {
                    title: subjectData.title,
                    description: subjectData.description,
                    semester: SEMESTER,
                    tags: ['PCEP2', subjectData.title, 'QROC'],
                    totalQCM: 0
                }
            });
            console.log(`  ✅ Created subject: ${subjectData.title}`);
        }
        else {
            console.log(`  ℹ️  Subject already exists: ${subjectData.title}`);
        }
        // Compter les QROC existantes pour cette matière
        const existingQrocsCount = await prisma.qroc.count({
            where: { subjectId: subject.id }
        });
        if (existingQrocsCount >= subjectData.qrocs.length) {
            console.log(`  ℹ️  All ${existingQrocsCount} QROCs already imported`);
            continue;
        }
        // Importer les QROC
        let subjectImported = 0;
        for (const qroc of subjectData.qrocs) {
            // Vérifier si le QROC existe déjà
            const existingQroc = await prisma.qroc.findFirst({
                where: {
                    subjectId: subject.id,
                    question: qroc.question
                }
            });
            if (existingQroc) {
                continue;
            }
            // Créer le QROC
            await prisma.qroc.create({
                data: {
                    subjectId: subject.id,
                    question: qroc.question,
                    answer: qroc.answer,
                    category: qroc.category,
                    orderIndex: qroc.orderIndex
                }
            });
            subjectImported++;
            totalImported++;
        }
        if (subjectImported > 0) {
            console.log(`  ✅ Imported ${subjectImported} new QROCs`);
        }
        // Afficher le total pour cette matière
        const totalSubjectQrocs = await prisma.qroc.count({
            where: { subjectId: subject.id }
        });
        console.log(`  ✅ Subject "${subjectData.title}" complete: ${totalSubjectQrocs} QROCs`);
    }
    console.log(`\n✅ Import complete! Total new QROCs imported: ${totalImported}`);
}
// ============================================
// EXECUTION
// ============================================
importPCEP2Qrocs()
    .catch((e) => {
    console.error('❌ Error during import:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=import-pcep2-qroc.js.map