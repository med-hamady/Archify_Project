"use strict";
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
/**
 * Parse un fichier de quiz Physiologie PCEM2
 * Format: emoji numéroté (1️⃣, 2️⃣, ..., 🔟, 11️⃣, ...) + "Question : [texte]"
 */
function parsePhysioFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());
    // Extraire le titre du chapitre (première ligne)
    let chapterTitle = lines[0] || 'Chapitre sans titre';
    chapterTitle = chapterTitle.replace(/^[^\wÀ-ÿ\s]+\s*/, '').trim();
    const questions = [];
    let currentQuestion = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Détecter une nouvelle question
        // Accepte: 1️⃣, 2️⃣, ..., 9️⃣, 🔟, 11️⃣, ..., 20️⃣, 30️⃣, 40️⃣
        const questionMatch = line.match(/^((?:\d+)️⃣|🔟)\s*Question\s*:\s*(.+)/);
        if (questionMatch) {
            // Sauvegarder la question précédente
            if (currentQuestion && currentQuestion.options.length > 0) {
                questions.push(currentQuestion);
            }
            // Créer une nouvelle question
            const questionText = questionMatch[2].trim();
            currentQuestion = {
                questionText,
                options: [],
                explanation: undefined
            };
            continue;
        }
        // Détecter une option (A., B., C., D., E.)
        const optionMatch = line.match(/^([A-E])\.\s+(.+)/);
        if (optionMatch && currentQuestion) {
            const fullText = optionMatch[2];
            const hasCheck = fullText.includes('✔️');
            const hasCross = fullText.includes('❌');
            let optionText = '';
            let justification = '';
            let isCorrect = false;
            if (hasCheck) {
                isCorrect = true;
                optionText = fullText.replace('✔️', '').trim();
            }
            else if (hasCross) {
                isCorrect = false;
                const parts = fullText.split('❌');
                optionText = parts[0].trim();
                if (parts[1]) {
                    // Extraire justification après "—"
                    const justParts = parts[1].split('—');
                    if (justParts.length > 1) {
                        justification = justParts.slice(1).join('—').trim();
                    }
                }
            }
            currentQuestion.options.push({
                text: optionText,
                isCorrect,
                justification: justification || undefined
            });
            continue;
        }
        // Détecter une explication (💬)
        if (line.startsWith('💬') && currentQuestion) {
            currentQuestion.explanation = line.replace('💬', '').trim();
        }
    }
    // Ajouter la dernière question
    if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
    }
    return { title: chapterTitle, questions };
}
/**
 * Script principal pour corriger l'import de Physiologie PCEM2
 */
async function fixPhysioPCEM2() {
    try {
        console.log('🚀 Démarrage de la correction de Physiologie PCEM2...\n');
        // Trouver le sujet Physiologie PCEM2
        const physioSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Physiologie', mode: 'insensitive' },
                semester: 'PCEM2'
            },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        if (!physioSubject) {
            console.log('❌ Sujet Physiologie PCEM2 non trouvé');
            await prisma.$disconnect();
            return;
        }
        console.log(`📚 Sujet trouvé: ${physioSubject.title}`);
        console.log(`📖 Chapitres actuels: ${physioSubject.chapters.length}`);
        const totalQuestionsBefore = physioSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
        console.log(`📊 Questions actuelles: ${totalQuestionsBefore}\n`);
        // Supprimer toutes les anciennes questions
        console.log('🗑️  Suppression des anciennes questions...');
        for (const chapter of physioSubject.chapters) {
            await prisma.question.deleteMany({
                where: { chapterId: chapter.id }
            });
        }
        console.log(`✅ ${totalQuestionsBefore} anciennes questions supprimées\n`);
        // Supprimer tous les anciens chapitres
        console.log('🗑️  Suppression des anciens chapitres...');
        await prisma.chapter.deleteMany({
            where: { subjectId: physioSubject.id }
        });
        console.log(`✅ ${physioSubject.chapters.length} anciens chapitres supprimés\n`);
        // Réimporter depuis les fichiers sources
        const physioDir = path.join(__dirname, '..', 'data', 'quiz', 'pcem2', 'physio');
        if (!fs.existsSync(physioDir)) {
            console.log(`❌ Dossier non trouvé: ${physioDir}`);
            await prisma.$disconnect();
            return;
        }
        const files = fs.readdirSync(physioDir)
            .filter(f => f.endsWith('.txt'))
            .sort();
        console.log(`📂 ${files.length} fichiers trouvés\n`);
        let totalImported = 0;
        let chapterIndex = 0;
        for (const file of files) {
            const filePath = path.join(physioDir, file);
            console.log(`📄 Traitement: ${file}`);
            try {
                const { title, questions } = parsePhysioFile(filePath);
                // Créer le chapitre
                const chapter = await prisma.chapter.create({
                    data: {
                        title,
                        subjectId: physioSubject.id,
                        orderIndex: chapterIndex++
                    }
                });
                // Créer les questions
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    await prisma.question.create({
                        data: {
                            chapterId: chapter.id,
                            questionText: q.questionText,
                            options: q.options,
                            explanation: q.explanation,
                            difficulty: 'MOYEN',
                            orderIndex: i
                        }
                    });
                }
                console.log(`   ✓ Importé: ${questions.length} questions`);
                totalImported += questions.length;
            }
            catch (error) {
                console.error(`   ✗ Erreur: ${error.message}`);
            }
        }
        console.log(`\n🎉 Import terminé !`);
        console.log(`📊 Total: ${totalImported} questions importées dans ${chapterIndex} chapitres\n`);
        // Mettre à jour le totalQCM du sujet
        await prisma.subject.update({
            where: { id: physioSubject.id },
            data: { totalQCM: totalImported }
        });
        console.log(`✅ totalQCM mis à jour: ${totalImported}\n`);
        // Vérification finale
        const updatedSubject = await prisma.subject.findFirst({
            where: { id: physioSubject.id },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        console.log('📋 Vérification finale:');
        updatedSubject?.chapters.forEach((ch, index) => {
            console.log(`   ${index + 1}. ${ch.title} - ${ch._count.questions} questions`);
        });
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('❌ Erreur:', error.message);
        await prisma.$disconnect();
        throw error;
    }
}
// Exécuter le script
fixPhysioPCEM2();
//# sourceMappingURL=fix-physiologie-pcem2.js.map