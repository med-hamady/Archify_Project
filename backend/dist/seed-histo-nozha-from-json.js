"use strict";
/**
 * Seed Histo Nozha from JSON export
 * Can be run on Render without needing source text files
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
async function seedHistoNozhaFromJson() {
    console.log('🌱 Seed Histo Nozha depuis JSON...\n');
    try {
        // Lire le fichier JSON
        const jsonPath = path.join(__dirname, 'histo-nozha-seed.json');
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(jsonData);
        console.log(`📖 Données chargées:`);
        console.log(`   - Chapitres: ${data.chapters.length}`);
        let totalSubchapters = 0;
        let totalQuestions = 0;
        data.chapters.forEach(ch => {
            totalSubchapters += ch.subchapters.length;
            ch.subchapters.forEach(sub => {
                totalQuestions += sub.questions.length;
            });
        });
        console.log(`   - Sous-chapitres: ${totalSubchapters}`);
        console.log(`   - Questions: ${totalQuestions}\n`);
        // 1. Créer ou récupérer le sujet
        let subject = await prisma.subject.findFirst({
            where: {
                title: data.subject.title,
                semester: data.subject.semester
            }
        });
        if (subject) {
            console.log(`✅ Sujet existant trouvé: ${subject.id}`);
        }
        else {
            subject = await prisma.subject.create({
                data: data.subject
            });
            console.log(`✅ Sujet créé: ${subject.id}`);
        }
        // 2. Créer les chapitres et sous-chapitres
        let importedSubchapters = 0;
        let importedQuestions = 0;
        for (const chapterData of data.chapters) {
            console.log(`\n📖 Chapitre: ${chapterData.title}`);
            // Vérifier si le chapitre existe
            let chapter = await prisma.chapter.findFirst({
                where: {
                    subjectId: subject.id,
                    title: chapterData.title
                }
            });
            if (!chapter) {
                chapter = await prisma.chapter.create({
                    data: {
                        subjectId: subject.id,
                        title: chapterData.title,
                        description: chapterData.description,
                        orderIndex: chapterData.orderIndex
                    }
                });
                console.log(`   ✅ Chapitre créé`);
            }
            else {
                console.log(`   ✅ Chapitre existant`);
            }
            // Créer les sous-chapitres
            for (const subchapterData of chapterData.subchapters) {
                const subchapter = await prisma.subchapter.create({
                    data: {
                        chapterId: chapter.id,
                        title: subchapterData.title,
                        orderIndex: subchapterData.orderIndex
                    }
                });
                importedSubchapters++;
                console.log(`      📌 ${subchapterData.title} (${subchapterData.questions.length} QCMs)`);
                // Créer les questions
                for (const questionData of subchapterData.questions) {
                    await prisma.question.create({
                        data: {
                            chapterId: chapter.id,
                            subchapterId: subchapter.id,
                            questionText: questionData.questionText,
                            options: questionData.options,
                            explanation: questionData.explanation,
                            orderIndex: questionData.orderIndex
                        }
                    });
                    importedQuestions++;
                }
            }
        }
        console.log('\n\n✅ Import terminé!');
        console.log(`📊 Statistiques:`);
        console.log(`   - Sous-chapitres importés: ${importedSubchapters}`);
        console.log(`   - Questions importées: ${importedQuestions}`);
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
seedHistoNozhaFromJson()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=seed-histo-nozha-from-json.js.map