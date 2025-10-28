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
 * Parse un fichier de quiz Anatomie PCEM2
 * Format: emoji numéroté (1️⃣, 2️⃣, ..., 🔟, 11️⃣, ...) + "Question : [texte]"
 */
function parseQCMFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());
    // Extraire le titre du chapitre (première ligne)
    let chapterTitle = lines[0] || 'Chapitre sans titre';
    chapterTitle = chapterTitle.replace(/^[^\wÀ-ÿ\s]+\s*/, '').trim();
    // Enlever les annotations de type (1->40), (1->20), (20 QCM), etc.
    chapterTitle = chapterTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const questions = [];
    let currentQuestion = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Détecter une nouvelle question
        // Format QCM: QCM 1 — Titre
        const qcmMatch = line.match(/^QCMs+(d+)s+[—–-]s+(.+)/i);
        if (qcmMatch) {
            // Sauvegarder la question précédente
            if (currentQuestion && currentQuestion.options.length > 0) {
                questions.push(currentQuestion);
            }
            // Créer une nouvelle question
            const questionText = qcmMatch[2].trim();
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
 * Script principal pour corriger l'import de Anatomie PCEM1
 */
async function fixAnatomiePCEM2QCM() {
    try {
        console.log('🚀 Import des chapitres 1-12 (format QCM) d\'Anatomie PCEM2...\n');
        // Trouver le sujet Anatomie PCEM1
        const anatomieSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Anatomie', mode: 'insensitive' },
                semester: 'PCEM1'
            },
            include: {
                chapters: {
                    include: {
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        if (!anatomieSubject) {
            console.log('❌ Sujet Anatomie PCEM1 non trouvé');
            await prisma.$disconnect();
            return;
        }
        console.log(`📚 Sujet trouvé: ${anatomieSubject.title}`);
        console.log(`📖 Chapitres actuels: ${anatomieSubject.chapters.length}`);
        const totalQuestionsBefore = anatomieSubject.chapters.reduce((sum, ch) => sum + ch._count.questions, 0);
        console.log(`📊 Questions actuelles: ${totalQuestionsBefore}\n`);
        // Supprimer toutes les anciennes questions
        console.log('🗑️  Suppression des anciennes questions...');
        for (const chapter of anatomieSubject.chapters) {
            await prisma.question.deleteMany({
                where: { chapterId: chapter.id }
            });
        }
        console.log(`✅ ${totalQuestionsBefore} anciennes questions supprimées\n`);
        // Supprimer tous les anciens chapitres
        console.log('🗑️  Suppression des anciens chapitres...');
        await prisma.chapter.deleteMany({
            where: { subjectId: anatomieSubject.id }
        });
        console.log(`✅ ${anatomieSubject.chapters.length} anciens chapitres supprimés\n`);
        // Réimporter depuis les fichiers sources
        const anatomieDir = path.join(__dirname, '..', 'data', 'quiz', 'pcem2', 'anatomie');
        if (!fs.existsSync(anatomieDir)) {
            console.log(`❌ Dossier non trouvé: ${anatomieDir}`);
            await prisma.$disconnect();
            return;
        }
        const qcmFiles = [
            'CHAPITRE 1 — OSTÉOLOGIE DU CRÂNE.txt',
            'CHAPITRE 2 — L\'APPAREIL MANDUCATEUR.txt',
            'CHAPITRE 3 — LES MUSCLES DE LA TÊTE.txt',
            'CHAPITRE 4 — LES VAISSEAUX DE LA TÊ.txt',
            'CHAPITRE 5 — LES LYMPHATIQUES DE LA.txt',
            'CHAPITRE 6 — L\'APPAREIL DE VISION.txt',
            'CHAPITRE 7 — LES FOSSES NASALES.txt',
            'CHAPITRE 8 — L\'OREILLE.txt',
            'CHAPITRE 9 — PHARYNX ET LARYNX.txt',
            'CHAPITRE 10 — THYROÏDE ET LARYNX SU.txt',
            'CHAPITRE 11 — LES VOIES NERVEUSES.txt',
            'CHAPITRE 12 — EMBRYOLOGIE DU SYSTÈM.txt'
        ];
        console.log(`📂 ${qcmFiles.length} fichiers trouvés\n`);
        let totalImported = 0;
        let chapterIndex = 0;
        for (const file of qcmFiles) {
            const filePath = path.join(anatomieDir, file);
            console.log(`📄 Traitement: ${file}`);
            try {
                const { title, questions } = parseQCMFile(filePath);
                // Créer le chapitre
                const chapter = await prisma.chapter.create({
                    data: {
                        title,
                        subjectId: anatomieSubject.id,
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
            where: { id: anatomieSubject.id },
            data: { totalQCM: totalImported }
        });
        console.log(`✅ totalQCM mis à jour: ${totalImported}\n`);
        // Vérification finale
        const updatedSubject = await prisma.subject.findFirst({
            where: { id: anatomieSubject.id },
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
fixAnatomiePCEM2QCM();
//# sourceMappingURL=fix-anatomie-pcem2-qcm.js.map