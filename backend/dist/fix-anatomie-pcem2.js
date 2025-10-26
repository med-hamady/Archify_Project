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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var prisma = new client_1.PrismaClient();
/**
 * Parse les fichiers d'anatomie PCEM2 avec format emoji
 */
function parseAnatomieFile(filePath) {
    var content = fs.readFileSync(filePath, 'utf-8');
    var lines = content.split('\n').map(function (l) { return l.trim(); });
    // Extraire le titre du chapitre (première ligne)
    var chapterTitle = lines[0] || 'Chapitre sans titre';
    // Nettoyer le titre (enlever emojis au début)
    chapterTitle = chapterTitle.replace(/^[^\wÀ-ÿ\s]+\s*/, '').trim();
    var questions = [];
    var currentQuestion = null;
    var currentQuestionTitle = '';
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Détecter une nouvelle section de QCM (1️⃣, 2️⃣, ..., 🔟, 11️⃣, ...)
        var sectionMatch = line.match(/^([0-9]️⃣|🔟|1[0-9]️⃣|20️⃣)\s+(.+)/);
        if (sectionMatch) {
            // Sauvegarder la question précédente
            if (currentQuestion && currentQuestion.options.length > 0) {
                questions.push(currentQuestion);
            }
            // Démarrer une nouvelle question
            currentQuestionTitle = sectionMatch[2].trim();
            currentQuestion = {
                questionText: currentQuestionTitle,
                options: [],
                explanation: undefined
            };
            continue;
        }
        // Détecter une option (A., B., C., D., E.)
        var optionMatch = line.match(/^([A-E])\.\s+(.+)/);
        if (optionMatch && currentQuestion) {
            var letter = optionMatch[1];
            var fullText = optionMatch[2];
            // Séparer le texte de la justification
            // Format: "Texte de la réponse ✔️" ou "Texte ❌ — Justification"
            var hasCheck = fullText.includes('✔️');
            var hasCross = fullText.includes('❌');
            var optionText = '';
            var justification = '';
            var isCorrect = false;
            if (hasCheck) {
                isCorrect = true;
                optionText = fullText.replace('✔️', '').trim();
            }
            else if (hasCross) {
                isCorrect = false;
                var parts = fullText.split('❌');
                optionText = parts[0].trim();
                if (parts[1]) {
                    // Extraire la justification après le "—"
                    var justParts = parts[1].split('—');
                    if (justParts.length > 1) {
                        justification = justParts.slice(1).join('—').trim();
                    }
                }
            }
            else {
                // Pas de symbole trouvé, considérer comme faux par défaut
                optionText = fullText.trim();
                isCorrect = false;
            }
            currentQuestion.options.push({
                text: optionText,
                isCorrect: isCorrect,
                justification: justification || undefined
            });
            continue;
        }
        // Détecter la justification générale
        var justificationMatch = line.match(/^Justification générale\s*:\s*(.+)/);
        if (justificationMatch && currentQuestion) {
            currentQuestion.explanation = justificationMatch[1].trim();
            continue;
        }
    }
    // Ajouter la dernière question
    if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
    }
    return { title: chapterTitle, questions: questions };
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var anatomieSubject, chapterIds, deleteResult, anatomieDir, files, totalQuestionsImported, _loop_1, _i, files_1, file, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Démarrage de la réimportation des quiz d\'anatomie PCEM2...\n');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 11]);
                    return [4 /*yield*/, prisma.subject.findFirst({
                            where: {
                                title: { contains: 'Anatomie', mode: 'insensitive' },
                                semester: 'PCEM2'
                            },
                            include: {
                                chapters: {
                                    include: { questions: true }
                                }
                            }
                        })];
                case 2:
                    anatomieSubject = _a.sent();
                    if (!anatomieSubject) {
                        console.error('❌ Sujet Anatomie PCEM2 non trouvé');
                        return [2 /*return*/];
                    }
                    console.log("\uD83D\uDCDA Sujet trouv\u00E9: ".concat(anatomieSubject.title, " (").concat(anatomieSubject.chapters.length, " chapitres)\n"));
                    // 2. Supprimer toutes les anciennes questions d'anatomie PCEM2
                    console.log('🗑️  Suppression des anciennes questions...');
                    chapterIds = anatomieSubject.chapters.map(function (c) { return c.id; });
                    return [4 /*yield*/, prisma.question.deleteMany({
                            where: { chapterId: { in: chapterIds } }
                        })];
                case 3:
                    deleteResult = _a.sent();
                    console.log("\u2705 ".concat(deleteResult.count, " anciennes questions supprim\u00E9es\n"));
                    anatomieDir = path.join(__dirname, '../data/quiz/pcem2/anatomie');
                    files = fs.readdirSync(anatomieDir).filter(function (f) { return f.endsWith('.txt'); });
                    console.log("\uD83D\uDCC2 ".concat(files.length, " fichiers trouv\u00E9s dans le dossier anatomie\n"));
                    totalQuestionsImported = 0;
                    _loop_1 = function (file) {
                        var filePath, _b, title, questions, chapter, orderIndex, newChapter, _c, questions_1, q;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    filePath = path.join(anatomieDir, file);
                                    console.log("\uD83D\uDCC4 Traitement de: ".concat(file));
                                    _b = parseAnatomieFile(filePath), title = _b.title, questions = _b.questions;
                                    console.log("   Titre: ".concat(title));
                                    console.log("   Questions trouv\u00E9es: ".concat(questions.length));
                                    chapter = anatomieSubject.chapters.find(function (c) {
                                        return c.title.toLowerCase().includes(title.toLowerCase().substring(0, 20));
                                    });
                                    if (!!chapter) return [3 /*break*/, 2];
                                    orderIndex = anatomieSubject.chapters.length;
                                    return [4 /*yield*/, prisma.chapter.create({
                                            data: {
                                                title: title,
                                                subjectId: anatomieSubject.id,
                                                orderIndex: orderIndex,
                                                description: null
                                            },
                                            include: { questions: true }
                                        })];
                                case 1:
                                    newChapter = _d.sent();
                                    chapter = newChapter;
                                    console.log("   \u2728 Nouveau chapitre cr\u00E9\u00E9");
                                    return [3 /*break*/, 3];
                                case 2:
                                    console.log("   \u2713 Chapitre existant trouv\u00E9");
                                    _d.label = 3;
                                case 3:
                                    _c = 0, questions_1 = questions;
                                    _d.label = 4;
                                case 4:
                                    if (!(_c < questions_1.length)) return [3 /*break*/, 7];
                                    q = questions_1[_c];
                                    return [4 /*yield*/, prisma.question.create({
                                            data: {
                                                chapterId: chapter.id,
                                                questionText: q.questionText,
                                                difficulty: 'MOYEN', // Par défaut
                                                orderIndex: 0,
                                                options: q.options.map(function (opt) { return ({
                                                    text: opt.text,
                                                    isCorrect: opt.isCorrect,
                                                    justification: opt.justification
                                                }); }),
                                                explanation: q.explanation
                                            }
                                        })];
                                case 5:
                                    _d.sent();
                                    _d.label = 6;
                                case 6:
                                    _c++;
                                    return [3 /*break*/, 4];
                                case 7:
                                    totalQuestionsImported += questions.length;
                                    console.log("   \u2705 ".concat(questions.length, " questions import\u00E9es\n"));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, files_1 = files;
                    _a.label = 4;
                case 4:
                    if (!(_i < files_1.length)) return [3 /*break*/, 7];
                    file = files_1[_i];
                    return [5 /*yield**/, _loop_1(file)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    console.log("\n\uD83C\uDF89 Import termin\u00E9 avec succ\u00E8s !");
                    console.log("\uD83D\uDCCA Total: ".concat(totalQuestionsImported, " questions import\u00E9es dans ").concat(files.length, " chapitres"));
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _a.sent();
                    console.error('❌ Erreur lors de l\'import:', error_1);
                    throw error_1;
                case 9: return [4 /*yield*/, prisma.$disconnect()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
main();
