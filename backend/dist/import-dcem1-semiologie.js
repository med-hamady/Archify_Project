"use strict";
/**
 * Script d'import pour Sémiologie DCEM1
 *
 * La sémiologie est organisée en sous-catégories:
 * - Sémiologie cardiovasculaire
 * - Sémiologie digestive
 * - Sémiologie endocrinienne
 * - Sémiologie neurologique
 * - Sémiologie pédiatrique
 * - Sémiologie rénale et urologique
 * - Sémiologie respiratoire
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
const QUIZ_PATH = 'C:\\Users\\pc\\Desktop\\FAC GAME\\dcem1\\S inetrnational\\quiz dcem1\\semiologie';
/**
 * Parse un fichier de quiz DCEM1 (format Sémiologie)
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
 * Mapper pour nettoyer les noms de sous-catégories
 */
function cleanSubcategoryName(dirname) {
    const mapping = {
        'semiologie cardiovasculaire': 'Sémiologie Cardiovasculaire',
        'semiologie digestive': 'Sémiologie Digestive',
        'semiologie endocrinienne': 'Sémiologie Endocrinienne',
        'semiologie neurologique': 'Sémiologie Neurologique',
        'semiologie pediatrique': 'Sémiologie Pédiatrique',
        'semiologie renale et urologique': 'Sémiologie Rénale et Urologique',
        'semiologie resoiratoire': 'Sémiologie Respiratoire' // Typo dans le nom du dossier
    };
    return mapping[dirname.toLowerCase()] || dirname;
}
/**
 * Script principal pour importer Sémiologie DCEM1
 */
async function importSemiologieDCEM1() {
    try {
        console.log('🚀 Démarrage de l\'import de Sémiologie DCEM1...\n');
        // Lire les sous-catégories de sémiologie
        const subcategories = fs.readdirSync(QUIZ_PATH)
            .filter(item => {
            const fullPath = path.join(QUIZ_PATH, item);
            return fs.statSync(fullPath).isDirectory();
        })
            .sort();
        console.log(`📂 ${subcategories.length} sous-catégories trouvées:\n`);
        subcategories.forEach(cat => console.log(`   - ${cleanSubcategoryName(cat)}`));
        console.log('');
        let totalQuestionsAll = 0;
        let totalChaptersAll = 0;
        // Importer chaque sous-catégorie comme un sujet séparé
        for (const subcategory of subcategories) {
            const subcategoryPath = path.join(QUIZ_PATH, subcategory);
            const cleanName = cleanSubcategoryName(subcategory);
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📚 Traitement: ${cleanName}`);
            console.log('='.repeat(60));
            // Trouver ou créer le sujet
            let subject = await prisma.subject.findFirst({
                where: {
                    title: { contains: cleanName, mode: 'insensitive' },
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
            if (!subject) {
                console.log(`📝 Création du sujet ${cleanName}...`);
                subject = await prisma.subject.create({
                    data: {
                        title: cleanName,
                        semester: 'DCEM1',
                        description: `Cours de ${cleanName}`,
                        tags: ['DCEM1', 'Sémiologie', cleanName],
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
                console.log('✅ Sujet créé');
            }
            else {
                console.log(`✓ Sujet trouvé: ${cleanName}`);
                console.log(`   Chapitres actuels: ${subject.chapters.length}`);
                console.log(`   Questions actuelles: ${subject.chapters.reduce((sum, ch) => sum + ch.questions.length, 0)}`);
                // Supprimer les anciennes questions
                console.log('   🗑️  Suppression des anciennes questions...');
                for (const chapter of subject.chapters) {
                    await prisma.question.deleteMany({
                        where: { chapterId: chapter.id }
                    });
                }
                // Supprimer les anciens chapitres
                console.log('   🗑️  Suppression des anciens chapitres...');
                await prisma.chapter.deleteMany({
                    where: { subjectId: subject.id }
                });
                console.log('   ✅ Nettoyage terminé');
            }
            // Lire les fichiers de quiz de cette sous-catégorie
            const files = fs.readdirSync(subcategoryPath)
                .filter(f => f.endsWith('.txt'))
                .sort();
            console.log(`\n📄 ${files.length} chapitres à importer\n`);
            let totalQuestions = 0;
            // Importer chaque fichier
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const filePath = path.join(subcategoryPath, file);
                console.log(`   ${i + 1}. ${file}`);
                try {
                    const chapterData = parseQuizFile(filePath);
                    // Créer le chapitre
                    const chapter = await prisma.chapter.create({
                        data: {
                            subjectId: subject.id,
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
                    console.log(`      ✓ ${chapterData.questions.length} questions`);
                }
                catch (error) {
                    console.error(`      ❌ Erreur:`, error);
                }
            }
            // Mettre à jour totalQCM
            await prisma.subject.update({
                where: { id: subject.id },
                data: { totalQCM: totalQuestions }
            });
            console.log(`\n   ✅ ${cleanName}: ${totalQuestions} questions importées`);
            totalQuestionsAll += totalQuestions;
            totalChaptersAll += files.length;
        }
        console.log(`\n${'='.repeat(60)}`);
        console.log('🎉 Import de Sémiologie DCEM1 terminé !');
        console.log('='.repeat(60));
        console.log(`📊 Total général:`);
        console.log(`   - ${subcategories.length} sous-catégories`);
        console.log(`   - ${totalChaptersAll} chapitres`);
        console.log(`   - ${totalQuestionsAll} questions\n`);
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
importSemiologieDCEM1();
//# sourceMappingURL=import-dcem1-semiologie.js.map