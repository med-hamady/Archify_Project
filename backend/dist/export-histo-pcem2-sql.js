"use strict";
/**
 * Export SQL - Histo Nozha PCEM2
 *
 * Génère un dump SQL des données Histo PCEM2 pour import en production
 */
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
var prisma = new client_1.PrismaClient();
function exportToSQL() {
    return __awaiter(this, void 0, void 0, function () {
        var subject, totalQuestions, _i, _a, chapter, _b, _c, chapter, _d, _e, question, optionsJSON, error_1;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log('-- ============================================');
                    console.log('-- Export SQL - Histo Nozha PCEM2');
                    console.log('-- Généré le:', new Date().toISOString());
                    console.log('-- ============================================\n');
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, 4, 6]);
                    return [4 /*yield*/, prisma.subject.findFirst({
                            where: {
                                title: 'Histologie',
                                semester: 'PCEM2'
                            },
                            include: {
                                chapters: {
                                    include: {
                                        questions: true
                                    },
                                    orderBy: { orderIndex: 'asc' }
                                }
                            }
                        })];
                case 2:
                    subject = _f.sent();
                    if (!subject) {
                        console.error('-- ERREUR: Matière Histologie PCEM2 non trouvée');
                        return [2 /*return*/];
                    }
                    console.log('-- Stats:');
                    console.log("--   Chapitres: ".concat(subject.chapters.length));
                    totalQuestions = subject.chapters.reduce(function (sum, ch) { return sum + ch.questions.length; }, 0);
                    console.log("--   Questions: ".concat(totalQuestions));
                    console.log('-- ============================================\n');
                    // 1. Insert Subject
                    console.log('-- 1. Insérer la matière Histologie');
                    console.log("INSERT INTO \"Subject\" (id, title, semester, description, tags, \"totalQCM\", views, \"createdAt\")");
                    console.log("VALUES (\n  '".concat(subject.id, "',\n  '").concat(escapeSQL(subject.title), "',\n  '").concat(escapeSQL(subject.semester), "',\n  ").concat(subject.description ? "'".concat(escapeSQL(subject.description), "'") : 'NULL', ",\n  ARRAY[").concat(subject.tags.map(function (t) { return "'".concat(escapeSQL(t), "'"); }).join(', '), "]::text[],\n  ").concat(subject.totalQCM, ",\n  ").concat(subject.views, ",\n  '").concat(subject.createdAt.toISOString(), "'\n)\nON CONFLICT (id) DO UPDATE SET\n  title = EXCLUDED.title,\n  description = EXCLUDED.description,\n  tags = EXCLUDED.tags;\n"));
                    // 2. Insert Chapters
                    console.log('-- 2. Insérer les chapitres');
                    for (_i = 0, _a = subject.chapters; _i < _a.length; _i++) {
                        chapter = _a[_i];
                        console.log("INSERT INTO \"Chapter\" (id, \"subjectId\", title, description, \"orderIndex\", \"pdfUrl\", views, \"createdAt\")");
                        console.log("VALUES (\n  '".concat(chapter.id, "',\n  '").concat(subject.id, "',\n  '").concat(escapeSQL(chapter.title), "',\n  ").concat(chapter.description ? "'".concat(escapeSQL(chapter.description), "'") : 'NULL', ",\n  ").concat(chapter.orderIndex, ",\n  ").concat(chapter.pdfUrl ? "'".concat(escapeSQL(chapter.pdfUrl), "'") : 'NULL', ",\n  ").concat(chapter.views, ",\n  '").concat(chapter.createdAt.toISOString(), "'\n)\nON CONFLICT (id) DO UPDATE SET\n  title = EXCLUDED.title,\n  description = EXCLUDED.description,\n  \"orderIndex\" = EXCLUDED.\"orderIndex\";\n"));
                    }
                    // 3. Insert Questions
                    console.log('-- 3. Insérer les questions');
                    for (_b = 0, _c = subject.chapters; _b < _c.length; _b++) {
                        chapter = _c[_b];
                        for (_d = 0, _e = chapter.questions; _d < _e.length; _d++) {
                            question = _e[_d];
                            optionsJSON = JSON.stringify(question.options).replace(/'/g, "''");
                            console.log("INSERT INTO \"Question\" (id, \"chapterId\", \"questionText\", options, explanation, \"orderIndex\", \"createdAt\", \"updatedAt\")");
                            console.log("VALUES (\n  '".concat(question.id, "',\n  '").concat(chapter.id, "',\n  '").concat(escapeSQL(question.questionText), "',\n  '").concat(optionsJSON, "'::jsonb,\n  ").concat(question.explanation ? "'".concat(escapeSQL(question.explanation), "'") : 'NULL', ",\n  ").concat(question.orderIndex, ",\n  '").concat(question.createdAt.toISOString(), "',\n  '").concat(question.updatedAt.toISOString(), "'\n)\nON CONFLICT (id) DO UPDATE SET\n  \"questionText\" = EXCLUDED.\"questionText\",\n  options = EXCLUDED.options,\n  explanation = EXCLUDED.explanation,\n  \"orderIndex\" = EXCLUDED.\"orderIndex\";\n"));
                        }
                    }
                    console.log('-- ============================================');
                    console.log('-- Fin de l\'export SQL');
                    console.log('-- ============================================');
                    return [3 /*break*/, 6];
                case 3:
                    error_1 = _f.sent();
                    console.error('-- ERREUR:', error_1);
                    throw error_1;
                case 4: return [4 /*yield*/, prisma.$disconnect()];
                case 5:
                    _f.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function escapeSQL(str) {
    return str.replace(/'/g, "''");
}
exportToSQL()
    .then(function () { return process.exit(0); })
    .catch(function (error) {
    console.error('ERREUR FATALE:', error);
    process.exit(1);
});
