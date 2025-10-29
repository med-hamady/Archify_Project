"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.challengeRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const xp_service_1 = require("../services/xp.service");
const level_service_1 = require("../services/level.service");
const badge_service_1 = require("../services/badge.service");
const prisma = new client_1.PrismaClient();
exports.challengeRouter = express_1.default.Router();
// ============================================
// HELPER FUNCTIONS
// ============================================
/**
 * Vérifie si l'utilisateur peut accéder au mode Challenge
 * Conditions: Toujours accessible (0% progression)
 */
async function canAccessChallengeMode(userId, chapterId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { level: true }
    });
    if (!user)
        return false;
    // Challenge toujours accessible
    return true;
}
// ============================================
// DÉMARRER UN CHALLENGE
// ============================================
/**
 * POST /api/challenge/:chapterId/start
 * Démarre un challenge pour un chapitre
 * Conditions: 50% progression dans le chapitre OU niveau OR minimum
 */
exports.challengeRouter.post('/:chapterId/start', auth_1.requireAuth, async (req, res) => {
    try {
        const { chapterId } = req.params;
        const userId = req.userId;
        // Vérifier que le chapitre existe
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                subject: {
                    select: { title: true }
                },
                questions: true
            }
        });
        if (!chapter) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Chapitre non trouvé' }
            });
        }
        // Vérifier les conditions d'accès au Challenge
        const canAccess = await canAccessChallengeMode(userId, chapterId);
        if (!canAccess) {
            return res.status(403).json({
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Challenge non accessible'
                }
            });
        }
        // Vérifier s'il y a déjà un challenge récent (moins de 1h)
        const recentChallenge = await prisma.challengeResult.findFirst({
            where: {
                userId,
                chapterId,
                completedAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
                }
            }
        });
        if (recentChallenge) {
            return res.status(400).json({
                error: {
                    code: 'CHALLENGE_COOLDOWN',
                    message: 'Veuillez attendre avant de refaire ce challenge'
                }
            });
        }
        // Préparer les questions avec options sanitisées (sans révéler les réponses)
        const sanitizedQuestions = chapter.questions.map((q) => {
            const options = q.options;
            return {
                id: q.id,
                questionText: q.questionText,
                options: options.map((opt) => ({
                    text: opt.text
                    // Ne pas inclure isCorrect ni justification avant la soumission
                })),
                difficulty: q.difficulty
            };
        });
        res.status(200).json({
            success: true,
            challenge: {
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                subjectName: chapter.subject.title,
                totalQuestions: chapter.questions.length,
                questions: sanitizedQuestions
            }
        });
    }
    catch (err) {
        console.error('Error starting challenge:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors du démarrage du challenge' }
        });
    }
});
// ============================================
// SOUMETTRE RÉPONSES CHALLENGE
// ============================================
const submitChallengeSchema = zod_1.z.object({
    answers: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string(),
        selectedAnswer: zod_1.z.number().int().min(0).max(4) // 0-4 pour les options A-E
    })),
    timeSpentSec: zod_1.z.number().int().min(0).optional()
});
/**
 * POST /api/challenge/:chapterId/submit
 * Soumet les réponses d'un challenge et calcule le résultat
 */
exports.challengeRouter.post('/:chapterId/submit', auth_1.requireAuth, async (req, res) => {
    try {
        const { chapterId } = req.params;
        const userId = req.userId;
        // Valider les données
        const validation = submitChallengeSchema.safeParse(req.body);
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
        // Récupérer le chapitre avec questions
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                questions: true
            }
        });
        if (!chapter) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Chapitre non trouvé' }
            });
        }
        // Créer une map des questions
        const questionsMap = new Map(chapter.questions.map((q) => [q.id, q]));
        // Calculer le score
        let questionsCorrect = 0;
        let totalXPEarned = 0;
        const detailedResults = [];
        for (const answer of answers) {
            const question = questionsMap.get(answer.questionId);
            if (!question)
                continue;
            // Vérifier la réponse avec le nouveau format JSON
            const options = question.options;
            if (!Array.isArray(options) || answer.selectedAnswer >= options.length) {
                detailedResults.push({
                    questionId: question.id,
                    correct: false,
                    xpEarned: 0,
                    error: 'Invalid answer index'
                });
                continue;
            }
            const isCorrect = options[answer.selectedAnswer]?.isCorrect === true;
            // Préparer les options avec feedback pour les résultats détaillés
            const optionsWithFeedback = options.map((opt, index) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                justification: !opt.isCorrect ? opt.justification : undefined,
                wasSelected: index === answer.selectedAnswer
            }));
            if (isCorrect) {
                questionsCorrect++;
                // XP avec bonus Challenge (×1.5)
                const baseXP = xp_service_1.BASE_XP[question.difficulty];
                const challengeXP = Math.round(baseXP * 1.5);
                totalXPEarned += challengeXP;
                detailedResults.push({
                    questionId: question.id,
                    questionText: question.questionText,
                    correct: true,
                    xpEarned: challengeXP,
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
                    options: optionsWithFeedback,
                    explanation: question.explanation
                });
            }
        }
        const score = (questionsCorrect / chapter.questions.length) * 100;
        // Bonus XP si score parfait
        let xpBonus = 0;
        if (score === 100) {
            xpBonus = 100;
            totalXPEarned += xpBonus;
        }
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
        // Créer le résultat du challenge
        await prisma.challengeResult.create({
            data: {
                userId,
                chapterId,
                questionsTotal: chapter.questions.length,
                questionsCorrect,
                timeSpentSec: timeSpentSec || 0,
                score,
                xpBonus
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
                score,
                questionsCorrect,
                questionsTotal: chapter.questions.length,
                xpEarned: totalXPEarned,
                xpBonus,
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
        console.error('Error submitting challenge:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la soumission du challenge' }
        });
    }
});
// ============================================
// HISTORIQUE CHALLENGES
// ============================================
/**
 * GET /api/challenge/history/:chapterId
 * Récupère l'historique des challenges pour un chapitre
 */
exports.challengeRouter.get('/history/:chapterId', auth_1.requireAuth, async (req, res) => {
    try {
        const { chapterId } = req.params;
        const userId = req.userId;
        const challenges = await prisma.challengeResult.findMany({
            where: {
                userId,
                chapterId
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                score: true,
                questionsCorrect: true,
                questionsTotal: true,
                xpBonus: true,
                timeSpentSec: true,
                completedAt: true
            }
        });
        // Calculer statistiques
        const bestScore = challenges.length > 0
            ? Math.max(...challenges.map((c) => c.score))
            : 0;
        const averageScore = challenges.length > 0
            ? Math.round(challenges.reduce((sum, c) => sum + c.score, 0) / challenges.length)
            : 0;
        res.json({
            success: true,
            challenges,
            stats: {
                totalChallenges: challenges.length,
                bestScore,
                averageScore
            }
        });
    }
    catch (err) {
        console.error('Error fetching challenge history:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération de l\'historique' }
        });
    }
});
// ============================================
// LEADERBOARD CHALLENGE
// ============================================
/**
 * GET /api/challenge/leaderboard/:chapterId
 * Récupère le classement pour un chapitre spécifique
 */
exports.challengeRouter.get('/leaderboard/:chapterId', auth_1.requireAuth, async (req, res) => {
    try {
        const { chapterId } = req.params;
        // Récupérer les meilleurs scores
        const topScores = await prisma.challengeResult.findMany({
            where: { chapterId },
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
        console.error('Error fetching challenge leaderboard:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération du classement' }
        });
    }
});
//# sourceMappingURL=challenge.js.map