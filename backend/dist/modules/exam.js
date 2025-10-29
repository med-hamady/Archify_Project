"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const level_service_1 = require("../services/level.service");
const badge_service_1 = require("../services/badge.service");
const prisma = new client_1.PrismaClient();
exports.examRouter = express_1.default.Router();
// ============================================
// HELPER FUNCTIONS
// ============================================
/**
 * Vérifie si l'utilisateur peut accéder au mode Examen
 * Conditions: 50% des QCM de la matière complétés (update4)
 */
async function canAccessExamMode(userId, subjectId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
    });
    if (!user) {
        return { canAccess: false, progressPercent: 0, totalQuestions: 0, completedQuestions: 0 };
    }
    // Compter le nombre total de questions dans la matière
    const totalQuestions = await prisma.question.count({
        where: {
            chapter: {
                subjectId
            }
        }
    });
    if (totalQuestions === 0) {
        return { canAccess: false, progressPercent: 0, totalQuestions: 0, completedQuestions: 0 };
    }
    // Compter combien de questions ont été répondues correctement au moins une fois en mode révision
    const correctAttempts = await prisma.quizAttempt.findMany({
        where: {
            userId,
            question: {
                chapter: {
                    subjectId
                }
            },
            isCorrect: true
        },
        select: {
            questionId: true
        },
        distinct: ['questionId']
    });
    const completedQuestions = correctAttempts.length;
    const progressPercent = Math.round((completedQuestions / totalQuestions) * 100);
    // Nécessite 50% de complétion
    return {
        canAccess: progressPercent >= 50,
        progressPercent,
        totalQuestions,
        completedQuestions
    };
}
function getGrade(score) {
    if (score >= 18)
        return 'A+';
    if (score >= 16)
        return 'A';
    if (score >= 14)
        return 'B+';
    if (score >= 12)
        return 'B';
    if (score >= 10)
        return 'C';
    return 'F';
}
// ============================================
// DÉMARRER UN EXAMEN
// ============================================
/**
 * POST /api/exam/:subjectId/start
 * Démarre un examen pour une matière
 * Conditions: 50% des QCM complétés (update4)
 * Body: { questionCount?: number, duration?: number } - nombre de questions (10/20/30/40) et durée en minutes (15-90)
 */
exports.examRouter.post('/:subjectId/start', auth_1.requireAuth, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { questionCount, duration } = req.body; // Options d'examen
        const userId = req.userId;
        // Vérifier que la matière existe
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                chapters: {
                    include: {
                        questions: {
                            orderBy: { orderIndex: 'asc' }
                        }
                    }
                }
            }
        });
        if (!subject) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Matière non trouvée' }
            });
        }
        // Compter le total de questions
        const totalQuestions = subject.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
        if (totalQuestions === 0) {
            return res.status(400).json({
                error: {
                    code: 'NO_QUESTIONS',
                    message: 'Cette matière ne contient pas de questions'
                }
            });
        }
        // Vérifier les conditions d'accès à l'Examen
        const accessCheck = await canAccessExamMode(userId, subjectId);
        if (!accessCheck.canAccess) {
            return res.status(403).json({
                error: {
                    code: 'ACCESS_DENIED',
                    message: `Examen non accessible. Vous devez compléter 50% des QCM de la matière en mode Révision (actuellement ${accessCheck.progressPercent}% - ${accessCheck.completedQuestions}/${accessCheck.totalQuestions} QCM complétés).`
                }
            });
        }
        // Pas de cooldown selon update4 (liberté totale d'essai)
        // Récupérer les questions déjà vues en mode Révision (update4)
        const seenQuestionIds = await prisma.quizAttempt.findMany({
            where: {
                userId,
                question: {
                    chapter: {
                        subjectId
                    }
                },
                isCorrect: true // Questions vues et répondues correctement
            },
            select: {
                questionId: true
            },
            distinct: ['questionId']
        });
        const seenIds = seenQuestionIds.map((sq) => sq.questionId);
        if (seenIds.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'NO_SEEN_QUESTIONS',
                    message: 'Vous devez d\'abord répondre correctement à des questions en mode Révision avant de passer l\'examen.'
                }
            });
        }
        // Filtrer pour ne garder que les questions déjà vues
        const seenQuestions = subject.chapters.flatMap((chapter) => chapter.questions
            .filter((q) => seenIds.includes(q.id))
            .map((q) => {
            const options = q.options;
            return {
                id: q.id,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                questionText: q.questionText,
                options: options.map((opt) => opt.text), // Envoyer seulement le texte
                difficulty: q.difficulty
            };
        }));
        // Déterminer le nombre de questions pour l'examen
        const validQuestionCounts = [10, 20, 30, 40];
        let examQuestionCount = seenQuestions.length; // Par défaut, toutes les questions vues
        if (questionCount && validQuestionCounts.includes(questionCount)) {
            examQuestionCount = Math.min(questionCount, seenQuestions.length);
        }
        // Sélection aléatoire des questions
        const shuffled = [...seenQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, examQuestionCount);
        // Créer un enregistrement d'examen (sera mis à jour lors de la soumission)
        const exam = await prisma.examResult.create({
            data: {
                userId,
                subjectId,
                score: 0, // Sera mis à jour lors de la soumission
                passed: false,
                questionsCorrect: 0,
                questionsTotal: selectedQuestions.length,
                timeSpentSec: 0, // Sera mis à jour lors de la soumission
                completedAt: new Date()
            }
        });
        res.status(200).json({
            success: true,
            exam: {
                examId: exam.id,
                subjectId: subject.id,
                subjectName: subject.title,
                totalAvailableQuestions: seenQuestions.length,
                totalQuestions: selectedQuestions.length,
                duration: duration || 90, // Durée en minutes (par défaut 90 min)
                totalChapters: subject.chapters.length,
                questions: selectedQuestions
            }
        });
    }
    catch (err) {
        console.error('Error starting exam:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors du démarrage de l\'examen' }
        });
    }
});
// ============================================
// SOUMETTRE RÉPONSES EXAMEN
// ============================================
const submitExamSchema = zod_1.z.object({
    examId: zod_1.z.string().optional(),
    answers: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string(),
        selectedAnswers: zod_1.z.array(zod_1.z.number().int().min(0).max(4)) // Tableau de 0-4 pour les options A-E (peut être vide)
    })),
    timeSpentSec: zod_1.z.number().int().min(0).optional()
});
/**
 * POST /api/exam/:subjectId/submit
 * Soumet les réponses d'un examen et calcule le résultat
 */
exports.examRouter.post('/:subjectId/submit', auth_1.requireAuth, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const userId = req.userId;
        // Valider les données
        const validation = submitExamSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: validation.error.issues
                }
            });
        }
        const { answers, timeSpentSec } = validation.data;
        // Récupérer la matière avec toutes les questions
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                chapters: {
                    include: {
                        questions: true
                    }
                }
            }
        });
        if (!subject) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Matière non trouvée' }
            });
        }
        // Créer une map des questions
        const questionsMap = new Map();
        for (const chapter of subject.chapters) {
            for (const question of chapter.questions) {
                questionsMap.set(question.id, question);
            }
        }
        // Calculer le score
        let questionsCorrect = 0;
        let totalXPEarned = 0;
        const detailedResults = [];
        for (const answer of answers) {
            const question = questionsMap.get(answer.questionId);
            if (!question)
                continue;
            // Vérifier la réponse avec le nouveau format JSON (réponses multiples)
            const options = question.options;
            if (!Array.isArray(options)) {
                detailedResults.push({
                    questionId: question.id,
                    questionText: question.questionText,
                    correct: false,
                    xpEarned: 0,
                    difficulty: question.difficulty,
                    error: 'Invalid options format'
                });
                continue;
            }
            // Vérifier si les index sont valides
            const invalidIndexes = answer.selectedAnswers.some((idx) => idx >= options.length);
            if (invalidIndexes) {
                detailedResults.push({
                    questionId: question.id,
                    questionText: question.questionText,
                    correct: false,
                    xpEarned: 0,
                    difficulty: question.difficulty,
                    error: 'Invalid answer index'
                });
                continue;
            }
            // Trouver les indices des bonnes réponses
            const correctIndexes = options
                .map((opt, idx) => opt.isCorrect ? idx : -1)
                .filter((idx) => idx !== -1)
                .sort();
            // Trier les réponses sélectionnées pour la comparaison
            const selectedSorted = [...answer.selectedAnswers].sort();
            // Vérifier si les tableaux sont identiques
            const isCorrect = correctIndexes.length === selectedSorted.length &&
                correctIndexes.every((val, idx) => val === selectedSorted[idx]);
            // Préparer les options avec feedback
            const optionsWithFeedback = options.map((opt, index) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                justification: !opt.isCorrect ? opt.justification : undefined,
                wasSelected: answer.selectedAnswers.includes(index)
            }));
            if (isCorrect) {
                questionsCorrect++;
                detailedResults.push({
                    questionId: question.id,
                    questionText: question.questionText,
                    correct: true,
                    xpEarned: 4, // 4 XP par bonne réponse (update4)
                    difficulty: question.difficulty,
                    options: optionsWithFeedback,
                    explanation: question.explanation
                });
            }
            else {
                detailedResults.push({
                    questionId: question.id,
                    questionText: question.questionText,
                    correct: false,
                    xpEarned: 0,
                    difficulty: question.difficulty,
                    options: optionsWithFeedback,
                    explanation: question.explanation
                });
            }
        }
        // XP brute = 4 × (nombre de bonnes réponses) (update4)
        const baseXP = questionsCorrect * 4;
        // Compter le nombre de fois où cet examen a déjà été complété pour cette matière
        const previousCompletions = await prisma.examResult.count({
            where: {
                userId,
                subjectId
            }
        });
        // Appliquer la pénalité de replay : ×(1/2)^k où k = nombre de runs déjà crédités
        const replayPenalty = Math.pow(0.5, previousCompletions);
        totalXPEarned = Math.round(baseXP * replayPenalty);
        const totalQuestions = answers.length; // Nombre de questions dans cet examen spécifique
        const scorePercent = (questionsCorrect / totalQuestions) * 100;
        const scoreSur20 = (scorePercent / 100) * 20;
        const passed = scoreSur20 >= 10;
        // Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
            });
        }
        const oldXP = user.xpTotal;
        const newXP = oldXP + totalXPEarned;
        // Créer le résultat de l'examen
        await prisma.examResult.create({
            data: {
                userId,
                subjectId,
                questionsTotal: totalQuestions,
                questionsCorrect,
                timeSpentSec: timeSpentSec || 0,
                score: scoreSur20,
                passed
            }
        });
        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                xpTotal: newXP,
                level: (0, level_service_1.getLevelInfo)(newXP).current
            }
        });
        // Vérifier level-up
        const levelUpResult = (0, level_service_1.checkLevelUp)(oldXP, newXP);
        // Vérifier nouveaux badges
        const badgeResult = await (0, badge_service_1.checkAndAwardBadges)(userId, {
            consecutiveGoodAnswers: updatedUser.consecutiveGoodAnswers,
            legendQuestionsCompleted: updatedUser.legendQuestionsCompleted,
            level: updatedUser.level
        });
        res.json({
            success: true,
            result: {
                score: scoreSur20,
                scoreOutOf20: scoreSur20, // Alias pour compatibilité frontend
                scorePercent,
                passed,
                grade: getGrade(scoreSur20),
                questionsCorrect,
                questionsTotal: totalQuestions,
                xpEarned: totalXPEarned,
                totalXP: newXP,
                levelInfo: (0, level_service_1.getLevelInfo)(newXP),
                levelUp: levelUpResult.leveledUp ? {
                    oldLevel: levelUpResult.oldLevel,
                    newLevel: levelUpResult.newLevel
                } : null,
                newBadges: badgeResult.badges.length > 0 ? badgeResult.badges : null,
                detailedResults
            }
        });
    }
    catch (err) {
        console.error('Error submitting exam:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la soumission de l\'examen' }
        });
    }
});
// ============================================
// CORRECTION DÉTAILLÉE EXAMEN
// ============================================
/**
 * GET /api/exam/:examId/correction
 * Récupère la correction détaillée d'un examen
 */
exports.examRouter.get('/:examId/correction', auth_1.requireAuth, async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.userId;
        const exam = await prisma.examResult.findUnique({
            where: { id: examId },
            include: {
                subject: {
                    include: {
                        chapters: {
                            include: {
                                questions: true
                            }
                        }
                    }
                }
            }
        });
        if (!exam) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Examen non trouvé' }
            });
        }
        if (exam.userId !== userId) {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Cet examen ne vous appartient pas' }
            });
        }
        // Récupérer les tentatives de l'utilisateur autour de la date de l'examen
        const questionIds = exam.subject.chapters.flatMap((chapter) => chapter.questions.map((q) => q.id));
        const attempts = await prisma.quizAttempt.findMany({
            where: {
                userId,
                questionId: { in: questionIds },
                createdAt: {
                    gte: new Date(exam.completedAt.getTime() - 3 * 60 * 60 * 1000), // 3h avant
                    lte: new Date(exam.completedAt.getTime() + 1 * 60 * 60 * 1000) // 1h après
                }
            },
            include: {
                question: true
            }
        });
        // Organiser par chapitre
        const correctionByChapter = exam.subject.chapters.map((chapter) => {
            const questions = chapter.questions.map((question) => {
                const attempt = attempts.find(a => a.questionId === question.id);
                const options = question.options;
                // Préparer les options avec feedback
                const optionsWithFeedback = options.map((opt, index) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    justification: !opt.isCorrect ? opt.justification : undefined,
                    wasSelected: attempt ? index === attempt.selectedAnswer : false
                }));
                return {
                    questionId: question.id,
                    questionText: question.questionText,
                    options: optionsWithFeedback,
                    userAnswer: attempt?.selectedAnswer ?? null,
                    isCorrect: attempt?.isCorrect ?? false,
                    explanation: question.explanation,
                    difficulty: question.difficulty
                };
            });
            const correctCount = questions.filter((q) => q.isCorrect).length;
            return {
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                questions,
                correctCount,
                totalCount: questions.length,
                chapterScore: Math.round((correctCount / questions.length) * 20)
            };
        });
        res.json({
            success: true,
            correction: {
                examId: exam.id,
                subjectName: exam.subject.name,
                score: exam.score,
                passed: exam.passed,
                grade: getGrade(exam.score),
                questionsCorrect: exam.questionsCorrect,
                questionsTotal: exam.questionsTotal,
                completedAt: exam.completedAt,
                chapters: correctionByChapter
            }
        });
    }
    catch (err) {
        console.error('Error fetching exam correction:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération de la correction' }
        });
    }
});
// ============================================
// HISTORIQUE EXAMENS
// ============================================
/**
 * GET /api/exam/history/:subjectId
 * Récupère l'historique des examens pour une matière
 */
exports.examRouter.get('/history/:subjectId', auth_1.requireAuth, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const userId = req.userId;
        const exams = await prisma.examResult.findMany({
            where: {
                userId,
                subjectId
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                score: true,
                passed: true,
                questionsCorrect: true,
                questionsTotal: true,
                timeSpentSec: true,
                completedAt: true
            }
        });
        // Calculer statistiques
        const bestScore = exams.length > 0
            ? Math.max(...exams.map((e) => e.score))
            : 0;
        const averageScore = exams.length > 0
            ? Math.round((exams.reduce((sum, e) => sum + e.score, 0) / exams.length) * 10) / 10
            : 0;
        const passedCount = exams.filter((e) => e.passed).length;
        const examsWithGrades = exams.map((exam) => ({
            ...exam,
            grade: getGrade(exam.score)
        }));
        res.json({
            success: true,
            exams: examsWithGrades,
            stats: {
                totalExams: exams.length,
                passedExams: passedCount,
                failedExams: exams.length - passedCount,
                bestScore,
                bestGrade: getGrade(bestScore),
                averageScore
            }
        });
    }
    catch (err) {
        console.error('Error fetching exam history:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération de l\'historique' }
        });
    }
});
// ============================================
// LEADERBOARD EXAMEN
// ============================================
/**
 * GET /api/exam/leaderboard/:subjectId
 * Récupère le classement pour une matière spécifique
 */
exports.examRouter.get('/leaderboard/:subjectId', auth_1.requireAuth, async (req, res) => {
    try {
        const { subjectId } = req.params;
        // Récupérer les meilleurs scores
        const topScores = await prisma.examResult.findMany({
            where: { subjectId, passed: true },
            orderBy: [
                { score: 'desc' },
                { timeSpentSec: 'asc' }
            ],
            take: 20,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        level: true
                    }
                }
            }
        });
        // Grouper par utilisateur (garder le meilleur score)
        const userBestScores = new Map();
        for (const result of topScores) {
            if (!userBestScores.has(result.userId)) {
                userBestScores.set(result.userId, {
                    userId: result.user.id,
                    userName: result.user.name,
                    userLevel: result.user.level,
                    score: result.score,
                    grade: getGrade(result.score),
                    timeSpentSec: result.timeSpentSec,
                    completedAt: result.completedAt
                });
            }
        }
        const leaderboard = Array.from(userBestScores.values()).slice(0, 10);
        res.json({
            success: true,
            leaderboard
        });
    }
    catch (err) {
        console.error('Error fetching exam leaderboard:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération du classement' }
        });
    }
});
//# sourceMappingURL=exam.js.map