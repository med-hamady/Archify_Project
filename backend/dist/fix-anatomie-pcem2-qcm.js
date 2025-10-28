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
function parseQCMFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(', ').map(l => l.trim());, let, chapterTitle = lines[0] || 'Chapitre sans titre');
    chapterTitle = chapterTitle.replace(/^[^wÀ-ÿs]+s*/, '').trim();
    chapterTitle = chapterTitle.replace(/s*([^)]*)s*$/, '').trim();
    const questions = [];
    let currentQuestion = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const qcmMatch = line.match(/^QCMs+(d+)s+[—–-]s+(.+)/i);
        if (qcmMatch) {
            if (currentQuestion && currentQuestion.options.length > 0) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                questionText: qcmMatch[2].trim(),
                options: [],
                explanation: undefined
            };
            continue;
        }
        const optionMatch = line.match(/^([A-E]).s+(.+)/);
        if (optionMatch && currentQuestion) {
            const fullText = optionMatch[2];
            const hasCheck = fullText.includes('✔️') || fullText.includes('(✔️)');
            const hasCross = fullText.includes('❌') || fullText.includes('(❌)');
            let optionText = '';
            let justification = '';
            let isCorrect = false;
            if (hasCheck) {
                isCorrect = true;
                optionText = fullText.replace(/✔️|(✔️)/g, '').trim();
            }
            else if (hasCross) {
                isCorrect = false;
                const parts = fullText.split(/❌|(❌)/);
                optionText = parts[0].trim();
                if (parts[1]) {
                    const justParts = parts[1].split(/[—→]/);
                    if (justParts.length > 1) {
                        justification = justParts.slice(1).join('—').trim();
                    }
                }
            }
            else {
                optionText = fullText.trim();
                isCorrect = false;
            }
            currentQuestion.options.push({
                text: optionText,
                isCorrect,
                justification: justification || undefined
            });
            continue;
        }
        const conclusionMatch = line.match(/^🧠s*Conclusions*:s*(.+)/);
        if (conclusionMatch && currentQuestion) {
            currentQuestion.explanation = conclusionMatch[1].trim();
            continue;
        }
    }
    if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
    }
    return { title: chapterTitle, questions };
}
async function fixAnatomiePCEM2QCM() {
    try {
        console.log('🚀 Import chapitres 1-12 (format QCM) Anatomie PCEM2..., '););
        const anatomieSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Anatomie', mode: 'insensitive' },
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
        if (!anatomieSubject) {
            console.log('❌ Sujet Anatomie PCEM2 non trouvé');
            await prisma.$disconnect();
            return;
        }
        console.log(`📚 Sujet: ${anatomieSubject.title}
`);
        const anatomieDir = path.join(__dirname, '..', 'data', 'quiz', 'pcem2', 'anatomie');
        const qcmFiles = [
            'CHAPITRE 1 — OSTÉOLOGIE DU CRÂNE.txt',
            'CHAPITRE 2 — L', APPAREIL, MANDUCATEUR.txt, ',,
            'CHAPITRE 3 — LES MUSCLES DE LA TÊTE.txt',
            'CHAPITRE 4 — LES VAISSEAUX DE LA TÊ.txt',
            'CHAPITRE 5 — LES LYMPHATIQUES DE LA.txt',
            'CHAPITRE 6 — L', APPAREIL, DE, VISION.txt, ',,
            'CHAPITRE 7 — LES FOSSES NASALES.txt',
            'CHAPITRE 8 — L', OREILLE.txt, ',,
            'CHAPITRE 9 — PHARYNX ET LARYNX.txt',
            'CHAPITRE 10 — THYROÏDE ET LARYNX SU.txt',
            'CHAPITRE 11 — LES VOIES NERVEUSES.txt',
            'CHAPITRE 12 — EMBRYOLOGIE DU SYSTÈM.txt'
        ];
        let totalImported = 0;
        let highestOrderIndex = Math.max(...anatomieSubject.chapters.map(c => c.orderIndex || 0), -1);
        for (const file of qcmFiles) {
            const filePath = path.join(anatomieDir, file);
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Fichier non trouvé: ${file}`);
                continue;
            }
            console.log(`📄 Traitement: ${file}`);
            try {
                const { title, questions } = parseQCMFile(filePath);
                console.log(`   Titre: ${title}`);
                console.log(`   Questions: ${questions.length}`);
                const chapter = await prisma.chapter.create({
                    data: {
                        title,
                        subjectId: anatomieSubject.id,
                        orderIndex: ++highestOrderIndex
                    }
                });
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
                console.log(`   ✅ ${questions.length} questions importées
`);
                totalImported += questions.length;
            }
            catch (error) {
                console.error(`   ✗ Erreur: ${error.message}`);
            }
        }
        console.log(`
🎉 Import terminé !`);
        console.log(`📊 Total: ${totalImported} questions importées
`);
        const totalQuestions = await prisma.question.count({
            where: {
                chapter: {
                    subjectId: anatomieSubject.id
                }
            }
        });
        await prisma.subject.update({
            where: { id: anatomieSubject.id },
            data: { totalQCM: totalQuestions }
        });
        console.log(`✅ totalQCM mis à jour: ${totalQuestions}
`);
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('❌ Erreur:', error.message);
        await prisma.$disconnect();
        throw error;
    }
}
fixAnatomiePCEM2QCM();
//# sourceMappingURL=fix-anatomie-pcem2-qcm.js.map