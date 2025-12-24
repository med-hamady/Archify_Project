"use strict";
/**
 * Export Script - PCEP2 Seed Data
 *
 * Lit les fichiers QCM locaux et génère un fichier JSON
 * pour être embarqué dans le projet et utilisé en production
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ============================================
// CONFIGURATION
// ============================================
const BASE_SOURCE_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\PCEP2\\QCM';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'pcep2', 'pcep2-seed.json');
const SUBJECTS_CONFIG = {
    'Biochimie': {
        description: 'Biochimie médicale - PCEP2',
        chapters: [
            'Chapitre 1 bioénergétique.txt',
            'Chapitre 2 métabolisme glucidique.txt',
            'Chapitre 3 Métabolisme des Lipides.txt',
            'Chapitre 4  métabolisme protéique.txt',
            'Chapitre 5 Enzymologie.txt'
        ]
    },
    'Microbiologie Bacterio': {
        description: 'Microbiologie - Bactériologie',
        chapters: [
            'Chapitre 1  Structure bactérienne.txt',
            'Chapitre 2 NUTRITION DES BACTÉRIE.txt',
            'Chapitre 3 CROISSANCE BACTÉRIE.txt',
            'Chapitre 4 FACTEURS de PATHOGÉNICITÉ.txt'
        ]
    },
    'Microbiologie virologie': {
        description: 'Microbiologie - Virologie',
        chapters: [
            'CHAPITRE 1 structure et classificat.txt',
            'CHAPITRE 2 Multiplication virale.txt',
            'CHAPITRE 3 Diagnostic virologique.txt'
        ]
    }
};
// ============================================
// FONCTIONS DE PARSING
// ============================================
function detectAnswerState(text) {
    if (text.includes('(✅)') || text.includes('✅'))
        return 'correct';
    if (text.includes('(⚠️)') || text.includes('⚠️'))
        return 'partial';
    return 'incorrect';
}
function parseOption(line) {
    let match = line.match(/^([A-Fa-f])\.\s+(.+)$/);
    if (!match) {
        match = line.match(/^([A-Fa-f])\]\s+(.+)$/);
    }
    if (!match)
        return null;
    let fullText = match[2] || '';
    const answerState = detectAnswerState(line);
    fullText = fullText
        .replace(/\s*\(✅\)\s*$/g, '')
        .replace(/\s*\(❌\)\s*$/g, '')
        .replace(/\s*\(⚠️\)\s*$/g, '')
        .replace(/\s*✅\s*$/g, '')
        .replace(/\s*❌\s*$/g, '')
        .replace(/\s*⚠️\s*$/g, '')
        .trim();
    return {
        text: fullText,
        isCorrect: answerState === 'correct',
        isPartial: answerState === 'partial'
    };
}
function parseChapterFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const chapterTitle = lines[0] || 'Unknown Chapter';
    const questions = [];
    let currentQuestion = null;
    let currentOptions = [];
    let currentExplanation = [];
    let inConclusion = false;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const qcmMatch = line.match(/^QCM\s+(\d+)\s*[–—:\-]\s*(.+)$/i);
        if (qcmMatch) {
            if (currentQuestion && currentOptions.length > 0) {
                currentQuestion.options = currentOptions;
                currentQuestion.explanation = currentExplanation.length > 0
                    ? currentExplanation.join(' ').trim()
                    : null;
                questions.push(currentQuestion);
            }
            currentQuestion = {
                questionNumber: parseInt(qcmMatch[1]),
                questionText: qcmMatch[2].trim(),
                options: [],
                explanation: null
            };
            currentOptions = [];
            currentExplanation = [];
            inConclusion = false;
            continue;
        }
        if (line.match(/^🩵\s*Conclusion\s*:/i)) {
            inConclusion = true;
            continue;
        }
        if (inConclusion) {
            currentExplanation.push(line);
            continue;
        }
        const option = parseOption(line);
        if (option) {
            currentOptions.push({
                text: option.text,
                isCorrect: option.isCorrect,
                isPartial: option.isPartial,
                justification: null
            });
        }
    }
    if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions;
        currentQuestion.explanation = currentExplanation.length > 0
            ? currentExplanation.join(' ').trim()
            : null;
        questions.push(currentQuestion);
    }
    return { title: chapterTitle, questions };
}
// ============================================
// EXPORT
// ============================================
function exportPCEP2Seed() {
    console.log('📦 Exporting PCEP2 seed data...\n');
    const subjects = [];
    let totalQuestions = 0;
    for (const [subjectName, config] of Object.entries(SUBJECTS_CONFIG)) {
        console.log(`📚 Processing: ${subjectName}`);
        const chapters = [];
        for (const chapterFile of config.chapters) {
            const filePath = path.join(BASE_SOURCE_DIR, subjectName, chapterFile);
            if (!fs.existsSync(filePath)) {
                console.log(`  ⚠️  File not found: ${chapterFile}`);
                continue;
            }
            const chapter = parseChapterFile(filePath);
            chapters.push(chapter);
            totalQuestions += chapter.questions.length;
            console.log(`  ✅ ${chapter.title}: ${chapter.questions.length} questions`);
        }
        subjects.push({
            title: subjectName,
            description: config.description,
            chapters
        });
    }
    const seedData = {
        semester: 'PCEP2',
        subjects,
        exportedAt: new Date().toISOString(),
        totalQuestions
    };
    // Créer le dossier si nécessaire
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Export complete!`);
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Total: ${totalQuestions} questions`);
    console.log('='.repeat(50));
}
exportPCEP2Seed();
//# sourceMappingURL=export-pcep2-seed.js.map