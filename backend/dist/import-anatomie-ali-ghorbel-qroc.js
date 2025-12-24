"use strict";
/**
 * Import Script - QROC Anatomie Ali Ghorbel PCEM2
 *
 * Importe les QROC d'Anatomie Ali Ghorbel pour le niveau PCEM2
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
const SEMESTER = 'PCEM2';
const SUBJECT_NAME = 'Anatomie Ali Ghorbel'; // Matière séparée d'Anatomie
const SOURCE_FILE = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem2\\Anatomie Ali Ghorbel\\QROC Ali ghorbel\\QROC Ali ghorbel.txt';
const SEED_FILE = path.join(__dirname, '..', 'data', 'pcem2', 'anatomie-ali-ghorbel-qroc-seed.json');
// ============================================
// FONCTIONS DE PARSING
// ============================================
function parseQrocFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());
    const qrocs = [];
    let currentQuestion = null;
    let currentAnswer = [];
    let questionNumber = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Détection d'une nouvelle question: "Q1 : Question"
        const qMatch = line.match(/^Q(\d+)\s*[:\-–]\s*(.+)$/i);
        if (qMatch) {
            // Sauvegarder la question précédente
            if (currentQuestion && currentAnswer.length > 0) {
                qrocs.push({
                    question: currentQuestion,
                    answer: currentAnswer.join('\n').trim(),
                    category: 'Anatomie Ali Ghorbel',
                    orderIndex: questionNumber - 1
                });
            }
            questionNumber = parseInt(qMatch[1]);
            currentQuestion = qMatch[2].trim();
            currentAnswer = [];
            continue;
        }
        // Détection de la réponse: "Réponse : ..."
        const rMatch = line.match(/^Réponse\s*:\s*(.*)$/i);
        if (rMatch) {
            if (rMatch[1]) {
                currentAnswer.push(rMatch[1]);
            }
            continue;
        }
        // Si on a une question en cours et la ligne n'est pas vide, c'est la suite de la réponse
        if (currentQuestion && line.length > 0 && !line.match(/^Q\d+/i) && !line.match(/^QROC/i)) {
            currentAnswer.push(line);
        }
    }
    // Sauvegarder la dernière question
    if (currentQuestion && currentAnswer.length > 0) {
        qrocs.push({
            question: currentQuestion,
            answer: currentAnswer.join('\n').trim(),
            category: 'Anatomie Ali Ghorbel',
            orderIndex: questionNumber - 1
        });
    }
    return qrocs;
}
// ============================================
// EXPORT SEED DATA
// ============================================
function exportSeedData() {
    console.log('📦 Exporting Anatomie Ali Ghorbel QROC seed data...\n');
    if (!fs.existsSync(SOURCE_FILE)) {
        console.log(`⚠️  Source file not found: ${SOURCE_FILE}`);
        return null;
    }
    const qrocs = parseQrocFile(SOURCE_FILE);
    console.log(`  ✅ Parsed ${qrocs.length} QROCs`);
    const seedData = {
        semester: SEMESTER,
        subjectName: SUBJECT_NAME,
        qrocs,
        exportedAt: new Date().toISOString(),
        totalQrocs: qrocs.length
    };
    // Créer le dossier si nécessaire
    const outputDir = path.dirname(SEED_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(SEED_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log(`  ✅ Saved to: ${SEED_FILE}`);
    return seedData;
}
// ============================================
// IMPORT TO DATABASE
// ============================================
async function importQrocs() {
    console.log('🚀 Starting Anatomie Ali Ghorbel QROC import...\n');
    // Essayer de charger depuis le fichier seed, sinon exporter d'abord
    let seedData;
    if (fs.existsSync(SEED_FILE)) {
        seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
        console.log(`📦 Loaded seed data: ${seedData.totalQrocs} QROCs from ${seedData.exportedAt}`);
    }
    else if (fs.existsSync(SOURCE_FILE)) {
        // Exporter d'abord
        const exported = exportSeedData();
        if (!exported) {
            console.log('❌ Failed to export seed data');
            return;
        }
        seedData = exported;
    }
    else {
        console.log(`⚠️  No seed file found: ${SEED_FILE}`);
        console.log('   Skipping Anatomie Ali Ghorbel QROC import.');
        return;
    }
    // Trouver la matière
    const subject = await prisma.subject.findFirst({
        where: {
            title: seedData.subjectName,
            semester: SEMESTER
        }
    });
    if (!subject) {
        console.log(`❌ Subject "${seedData.subjectName}" not found for ${SEMESTER}`);
        return;
    }
    console.log(`📚 Found subject: ${subject.title} (${subject.id})`);
    // Compter les QROC existantes
    const existingCount = await prisma.qroc.count({
        where: { subjectId: subject.id }
    });
    if (existingCount >= seedData.qrocs.length) {
        console.log(`ℹ️  All ${existingCount} QROCs already imported`);
        return;
    }
    // Importer les QROC
    let imported = 0;
    for (const qroc of seedData.qrocs) {
        // Vérifier si le QROC existe déjà
        const existing = await prisma.qroc.findFirst({
            where: {
                subjectId: subject.id,
                question: qroc.question
            }
        });
        if (existing) {
            continue;
        }
        await prisma.qroc.create({
            data: {
                subjectId: subject.id,
                question: qroc.question,
                answer: qroc.answer,
                category: qroc.category,
                orderIndex: qroc.orderIndex
            }
        });
        imported++;
    }
    console.log(`\n✅ Import complete! ${imported} new QROCs imported`);
    // Afficher le total
    const totalQrocs = await prisma.qroc.count({
        where: { subjectId: subject.id }
    });
    console.log(`📊 Total QROCs for ${subject.title}: ${totalQrocs}`);
}
// ============================================
// EXECUTION
// ============================================
importQrocs()
    .catch((e) => {
    console.error('❌ Error during import:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=import-anatomie-ali-ghorbel-qroc.js.map