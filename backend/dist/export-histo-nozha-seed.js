"use strict";
/**
 * Export Histo Nozha data to seed file for Render deployment
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
async function exportHistoNozha() {
    console.log('📤 Export de Histo Nozha...\n');
    try {
        // Récupérer le sujet Histo Nozha
        const subject = await prisma.subject.findFirst({
            where: {
                title: 'Histo Nozha',
                semester: 'PCEM2'
            },
            include: {
                chapters: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        subchapters: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                questions: {
                                    orderBy: { orderIndex: 'asc' }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!subject) {
            console.log('❌ Sujet non trouvé');
            return;
        }
        // Transformer les données pour l'export
        const exportData = {
            subject: {
                title: subject.title,
                description: subject.description,
                semester: subject.semester,
                tags: subject.tags,
                totalQCM: subject.totalQCM
            },
            chapters: subject.chapters.map(chapter => ({
                title: chapter.title,
                description: chapter.description,
                orderIndex: chapter.orderIndex,
                subchapters: chapter.subchapters.map(subchapter => ({
                    title: subchapter.title,
                    orderIndex: subchapter.orderIndex,
                    questions: subchapter.questions.map(q => ({
                        questionText: q.questionText,
                        options: q.options,
                        explanation: q.explanation,
                        orderIndex: q.orderIndex
                    }))
                }))
            }))
        };
        // Écrire dans un fichier JSON
        const outputPath = path.join(__dirname, 'histo-nozha-seed.json');
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
        // Statistiques
        let totalSubchapters = 0;
        let totalQuestions = 0;
        exportData.chapters.forEach(ch => {
            totalSubchapters += ch.subchapters.length;
            ch.subchapters.forEach(sub => {
                totalQuestions += sub.questions.length;
            });
        });
        console.log('✅ Export terminé!');
        console.log(`📊 Statistiques:`);
        console.log(`   - Chapitres: ${exportData.chapters.length}`);
        console.log(`   - Sous-chapitres: ${totalSubchapters}`);
        console.log(`   - Questions: ${totalQuestions}`);
        console.log(`\n📁 Fichier créé: ${outputPath}`);
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
exportHistoNozha()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=export-histo-nozha-seed.js.map