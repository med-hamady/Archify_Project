"use strict";
/**
 * Profile Routes - FacGame
 *
 * Routes pour le profil utilisateur :
 * - Statistiques complètes
 * - Badges obtenus
 * - Historique de progression
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
exports.profileRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const level_service_1 = require("../services/level.service");
const badge_service_1 = require("../services/badge.service");
const progress_service_1 = require("../services/progress.service");
const prisma = new client_1.PrismaClient();
exports.profileRouter = (0, express_1.Router)();
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/profile/me
 * Profil complet de l'utilisateur connecté
 */
exports.profileRouter.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                semester: true,
                role: true,
                xpTotal: true,
                level: true,
                consecutiveGoodAnswers: true,
                bestStreak: true,
                legendQuestionsCompleted: true,
                lastActivityAt: true,
                createdAt: true,
                profilePicture: true
            }
        });
        if (!user) {
            return res.status(404).json({
                error: { code: 'USER_NOT_FOUND', message: 'User not found' }
            });
        }
        // Niveau et progression
        const levelInfo = (0, level_service_1.getLevelInfo)(user.xpTotal);
        // Badges
        const badgeStats = await (0, badge_service_1.getUserBadgeStats)(userId);
        // Statistiques globales
        const globalStats = await (0, progress_service_1.getUserGlobalStats)(userId);
        return res.json({
            profile: {
                id: user.id,
                email: user.email,
                name: user.name,
                semester: user.semester,
                role: user.role,
                createdAt: user.createdAt,
                lastActivityAt: user.lastActivityAt,
                profilePicture: user.profilePicture,
                gamification: {
                    xpTotal: user.xpTotal,
                    level: {
                        current: levelInfo.current,
                        name: levelInfo.currentName,
                        xpMin: levelInfo.xpMin,
                        xpMax: levelInfo.xpMax,
                        progressPercent: levelInfo.progressPercent,
                        xpToNextLevel: levelInfo.xpToNextLevel,
                        isMaxLevel: levelInfo.isMaxLevel
                    },
                    consecutiveStreak: user.consecutiveGoodAnswers,
                    bestStreak: user.bestStreak,
                    legendQuestionsCompleted: user.legendQuestionsCompleted,
                    badges: {
                        total: badgeStats.total,
                        byCategory: badgeStats.byCategory,
                        latest: badgeStats.latestBadge ? {
                            id: badgeStats.latestBadge.id,
                            name: badgeStats.latestBadge.name,
                            description: badgeStats.latestBadge.description
                        } : null
                    }
                },
                stats: {
                    totalQuestionsAnswered: globalStats.totalQuestionsAnswered,
                    totalQuestionsCorrect: globalStats.totalQuestionsCorrect,
                    totalChaptersCompleted: globalStats.totalChaptersCompleted,
                    totalSubjectsStarted: globalStats.totalSubjectsStarted,
                    averageSuccessRate: globalStats.averageSuccessRate
                }
            }
        });
    }
    catch (error) {
        console.error('[profile/me] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * GET /api/profile/badges
 * Liste complète des badges de l'utilisateur
 */
exports.profileRouter.get('/badges', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const badges = await (0, badge_service_1.getUserBadges)(userId);
        return res.json({
            badges: badges.map(badge => ({
                id: badge.id,
                name: badge.name,
                description: badge.description,
                iconUrl: badge.iconUrl,
                requirement: badge.requirement
            }))
        });
    }
    catch (error) {
        console.error('[profile/badges] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * GET /api/profile/activity
 * Activité récente de l'utilisateur
 */
exports.profileRouter.get('/activity', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 20;
        // Récupérer les dernières tentatives
        const recentAttempts = await prisma.quizAttempt.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                question: {
                    include: {
                        chapter: {
                            include: {
                                subject: {
                                    select: {
                                        title: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const activity = recentAttempts.map(attempt => ({
            id: attempt.id,
            type: 'quiz_attempt',
            questionId: attempt.questionId,
            chapterTitle: attempt.question.chapter.title,
            subjectTitle: attempt.question.chapter.subject.title,
            isCorrect: attempt.isCorrect,
            xpEarned: attempt.xpEarned,
            attemptNumber: attempt.attemptNumber,
            createdAt: attempt.createdAt
        }));
        return res.json({ activity });
    }
    catch (error) {
        console.error('[profile/activity] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * GET /api/profile/progress
 * Progression détaillée par matière
 */
exports.profileRouter.get('/progress', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const subjectsProgress = await (0, progress_service_1.getUserSubjectsProgress)(userId);
        return res.json({
            progress: subjectsProgress.map(sp => ({
                subjectId: sp.subjectId,
                subjectTitle: sp.subjectTitle,
                totalQCM: sp.totalQCM,
                questionsAnswered: sp.questionsAnswered,
                progressPercent: sp.progressPercent,
                chaptersCompleted: sp.chaptersCompleted,
                chaptersTotal: sp.chaptersTotal,
                challengeUnlocked: sp.challengeUnlockedGlobal
            }))
        });
    }
    catch (error) {
        console.error('[profile/progress] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * GET /api/profile/stats/detailed
 * Statistiques détaillées par difficulté
 */
exports.profileRouter.get('/stats/detailed', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        // Récupérer toutes les tentatives
        const allAttempts = await prisma.quizAttempt.findMany({
            where: { userId },
            include: {
                question: {
                    select: {
                        id: true
                    }
                }
            }
        });
        // Calculer les stats globales
        const totalQuestions = allAttempts.length;
        const correctAnswers = allAttempts.filter(a => a.isCorrect).length;
        const incorrectAnswers = totalQuestions - correctAnswers;
        const successRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const totalXPEarned = allAttempts.reduce((sum, a) => sum + a.xpEarned, 0);
        // Calculer la moyenne des tentatives
        const questionAttempts = new Map();
        allAttempts.forEach(attempt => {
            const qId = attempt.questionId;
            questionAttempts.set(qId, (questionAttempts.get(qId) || 0) + 1);
        });
        const averageAttempts = questionAttempts.size > 0
            ? Array.from(questionAttempts.values()).reduce((sum, count) => sum + count, 0) / questionAttempts.size
            : 0;
        // Compter les questions répondues correctement du premier coup
        const firstAttempts = new Map();
        allAttempts.forEach(attempt => {
            const qId = attempt.questionId;
            if (!firstAttempts.has(qId)) {
                firstAttempts.set(qId, attempt.isCorrect);
            }
        });
        const perfectScores = Array.from(firstAttempts.values()).filter(v => v).length;
        // Compter les challenges complétés
        const challengesCompleted = await prisma.challengeResult.count({
            where: { userId }
        });
        // Compter les examens complétés et réussis
        const examsCompleted = await prisma.examResult.count({
            where: { userId }
        });
        const examsPassed = await prisma.examResult.count({
            where: {
                userId,
                passed: true
            }
        });
        return res.json({
            success: true,
            stats: {
                totalQuestions,
                correctAnswers,
                incorrectAnswers,
                successRate,
                averageAttempts,
                totalXPEarned,
                challengesCompleted,
                examsCompleted,
                examsPassed,
                perfectScores
            }
        });
    }
    catch (error) {
        console.error('[profile/stats/detailed] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
/**
 * GET /api/profile/subscription
 * Vérifier le statut de l'abonnement de l'utilisateur
 */
exports.profileRouter.get('/subscription', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        // Importer dynamiquement le service de subscription
        const { checkUserSubscription } = await Promise.resolve().then(() => __importStar(require('../services/subscription.service')));
        const subscriptionResult = await checkUserSubscription(userId);
        return res.json({
            success: true,
            subscription: {
                hasActive: subscriptionResult.hasActiveSubscription,
                type: subscriptionResult.subscriptionType,
                canAccessQuiz: subscriptionResult.canAccessQuiz,
                canAccessDocuments: subscriptionResult.canAccessDocuments,
                expiresAt: subscriptionResult.expiresAt,
                message: subscriptionResult.message
            }
        });
    }
    catch (error) {
        console.error('[profile/subscription] Error:', error);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});
//# sourceMappingURL=profile.js.map