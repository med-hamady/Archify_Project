"use strict";
/**
 * Script d'import pour Parasitologie DCEM1
 *
 * Format spécifique DCEM1:
 * - QCM 1, QCM 2, etc.
 * - Réponses: A. Texte. (✔️) ou A. Texte. (❌) → Justification
 * - Conclusions: 🩵 Conclusion : texte
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
// Chemin vers les fichiers de quiz
const QUIZ_PATH = 'C:\\Users\\pc\\Desktop\\FAC GAME\\dcem1\\S inetrnational\\quiz dcem1\\parasitologie';
/**
 * Parse un fichier de quiz DCEM1 (format Parasitologie)
 */
function parseQuizFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let chapterTitle = '';
    const questions = [];
    let currentQuestion = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Ligne vide
        if (!line)
            continue;
        // Titre du chapitre (première ligne non vide)
        if (!chapterTitle && line.length > 0) {
            chapterTitle = line;
            continue;
        }
        // Détecter une question (QCM 1, QCM 2, etc.)
        const qcmMatch = line.match(/^QCM\s+(\d+)\s+[—–-]\s+(.+)/i);
        if (qcmMatch) {
            // Sauvegarder la question précédente
            if (currentQuestion && currentQuestion.options.length > 0) {
                questions.push(currentQuestion);
            }
            // Nouvelle question
            currentQuestion = {
                questionText: qcmMatch[2].trim(),
                options: [],
                explanation: undefined
            };
            continue;
        }
        // Détecter une option de réponse
        const optionMatch = line.match(/^([A-E])\.\s+(.+)$/);
        if (optionMatch && currentQuestion) {
            const optionLetter = optionMatch[1];
            const fullText = optionMatch[2];
            let optionText = '';
            let isCorrect = false;
            let justification = undefined;
            // Format: Texte. (✔️)
            if (fullText.includes('(✔️)')) {
                isCorrect = true;
                optionText = fullText.replace(/\(✔️\)/g, '').replace(/\.$/, '').trim();
            }
            // Format: Texte. (❌) → Justification
            else if (fullText.includes('(❌)')) {
                isCorrect = false;
                const parts = fullText.split('(❌)');
                optionText = parts[0].replace(/\.$/, '').trim();
                if (parts[1]) {
                    // Extraire justification après "→"
                    const justParts = parts[1].split('→');
                    if (justParts.length > 1) {
                        justification = justParts.slice(1).join('→').trim();
                    }
                }
            }
            currentQuestion.options.push({
                text: optionText,
                isCorrect,
                justification
            });
            continue;
        }
        // Détecter une conclusion/explication (🩵 Conclusion)
        if (line.startsWith('🩵') && currentQuestion) {
            currentQuestion.explanation = line.replace('🩵', '').replace(/Conclusion\s*:?/i, '').trim();
        }
    }
    // Ajouter la dernière question
    if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
    }
    return { title: chapterTitle, questions };
}
/**
 * Script principal pour importer Parasitologie DCEM1
 */
async function importParasitologieDCEM1() {
    try {
        console.log('🚀 Démarrage de l\'import de Parasitologie DCEM1...\n');
        // Trouver ou créer le sujet Parasitologie DCEM1
        let parasitologieSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Parasitologie', mode: 'insensitive' },
                semester: 'DCEM1'
            },
            include: {
                chapters: {
                    include: {
                        questions: true
                    }
                }
            }
        });
        if (!parasitologieSubject) {
            console.log('📝 Création du sujet Parasitologie DCEM1...');
            parasitologieSubject = await prisma.subject.create({
                data: {
                    title: 'Parasitologie',
                    semester: 'DCEM1',
                    description: 'Étude des parasites et des maladies parasitaires',
                    tags: ['DCEM1', 'Parasitologie', 'Médecine'],
                    totalQCM: 0
                },
                include: {
                    chapters: {
                        include: {
                            questions: true
                        }
                    }
                }
            });
            console.log('✅ Sujet créé\n');
        }
        else {
            console.log('📚 Sujet trouvé: Parasitologie');
            console.log(`📖 Chapitres actuels: ${parasitologieSubject.chapters.length}`);
            console.log(`📊 Questions actuelles: ${parasitologieSubject.chapters.reduce((sum, ch) => sum + ch.questions.length, 0)}\n`);
            // Supprimer les anciennes questions
            console.log('🗑️  Suppression des anciennes questions...');
            for (const chapter of parasitologieSubject.chapters) {
                await prisma.question.deleteMany({
                    where: { chapterId: chapter.id }
                });
            }
            const deletedCount = parasitologieSubject.chapters.reduce((sum, ch) => sum + ch.questions.length, 0);
            console.log(`✅ ${deletedCount} anciennes questions supprimées\n`);
            // Supprimer les anciens chapitres
            console.log('🗑️  Suppression des anciens chapitres...');
            await prisma.chapter.deleteMany({
                where: { subjectId: parasitologieSubject.id }
            });
            console.log(`✅ ${parasitologieSubject.chapters.length} anciens chapitres supprimés\n`);
        }
        // Lire tous les fichiers de quiz
        const files = fs.readdirSync(QUIZ_PATH)
            .filter(f => f.endsWith('.txt'))
            .sort();
        console.log(`📂 ${files.length} fichiers trouvés\n`);
        let totalQuestions = 0;
        // Importer chaque fichier
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = path.join(QUIZ_PATH, file);
            console.log(`📄 Traitement: ${file}`);
            try {
                const chapterData = parseQuizFile(filePath);
                // Créer le chapitre
                const chapter = await prisma.chapter.create({
                    data: {
                        subjectId: parasitologieSubject.id,
                        title: chapterData.title,
                        orderIndex: i + 1
                    }
                });
                // Créer les questions
                for (let j = 0; j < chapterData.questions.length; j++) {
                    const q = chapterData.questions[j];
                    await prisma.question.create({
                        data: {
                            chapterId: chapter.id,
                            questionText: q.questionText,
                            options: q.options,
                            explanation: q.explanation,
                            orderIndex: j
                        }
                    });
                }
                totalQuestions += chapterData.questions.length;
                console.log(`   ✓ Importé: ${chapterData.questions.length} questions`);
            }
            catch (error) {
                console.error(`   ❌ Erreur lors du traitement de ${file}:`, error);
            }
        }
        // Mettre à jour totalQCM
        await prisma.subject.update({
            where: { id: parasitologieSubject.id },
            data: { totalQCM: totalQuestions }
        });
        console.log(`\n🎉 Import terminé !`);
        console.log(`📊 Total: ${totalQuestions} questions importées dans ${files.length} chapitres\n`);
        // Vérification finale
        const finalSubject = await prisma.subject.findUnique({
            where: { id: parasitologieSubject.id },
            include: {
                chapters: {
                    include: {
                        _count: {
                            select: { questions: true }
                        }
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
        console.log('📋 Vérification finale:');
        finalSubject?.chapters.forEach((ch, idx) => {
            console.log(`   ${idx + 1}. ${ch.title} - ${ch._count.questions} questions`);
        });
        console.log(`\n✅ totalQCM mis à jour: ${finalSubject?.totalQCM}\n`);
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
importParasitologieDCEM1();
//# sourceMappingURL=import-dcem1-parasitologie.js.map