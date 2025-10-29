"use strict";
/**
 * Progress Service - FacGame
 *
 * Gère la progression des utilisateurs :
 * - Progression par chapitre
 * - Progression par matière
 * - Déblocage des modes Challenge et Examen
 * - Calcul des pourcentages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChapterProgress = updateChapterProgress;
exports.getChapterProgress = getChapterProgress;
exports.getUserChaptersProgress = getUserChaptersProgress;
exports.updateSubjectProgress = updateSubjectProgress;
exports.getSubjectProgress = getSubjectProgress;
exports.getUserSubjectsProgress = getUserSubjectsProgress;
exports.isChallengeUnlocked = isChallengeUnlocked;
exports.isExamUnlocked = isExamUnlocked;
exports.getUserGlobalStats = getUserGlobalStats;
const client_1 = require("@prisma/client");
const level_service_1 = require("./level.service");
const prisma = new client_1.PrismaClient();
// ============================================
// PROGRESSION PAR CHAPITRE
// ============================================
/**
 * Met à jour la progression d'un utilisateur dans un chapitre
 *
 * @param userId - ID de l'utilisateur
 * @param chapterId - ID du chapitre
 * @param isCorrect - Si la réponse était correcte
 */
async function updateChapterProgress(userId, chapterId, isCorrect) {
    // Récupérer le nombre total de questions dans le chapitre
    const totalQuestions = await prisma.question.count({
        where: { chapterId }
    });
    // Récupérer ou créer la progression
    let progress = await prisma.chapterProgress.findUnique({
        where: {
            userId_chapterId: {
                userId,
                chapterId
            }
        }
    });
    if (!progress) {
        progress = await prisma.chapterProgress.create({
            data: {
                userId,
                chapterId,
                questionsAnswered: 1,
                questionsCorrect: isCorrect ? 1 : 0,
                progressPercent: (1 / totalQuestions) * 100
            }
        });
    }
    else {
        // Mettre à jour
        const newQuestionsAnswered = progress.questionsAnswered + 1;
        const newQuestionsCorrect = isCorrect
            ? progress.questionsCorrect + 1
            : progress.questionsCorrect;
        progress = await prisma.chapterProgress.update({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId
                }
            },
            data: {
                questionsAnswered: newQuestionsAnswered,
                questionsCorrect: newQuestionsCorrect,
                progressPercent: (newQuestionsAnswered / totalQuestions) * 100
            }
        });
    }
    // Vérifier déblocage Challenge (0% - toujours débloqué)
    if (progress.progressPercent >= 0 && !progress.challengeUnlocked) {
        await prisma.chapterProgress.update({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId
                }
            },
            data: {
                challengeUnlocked: true
            }
        });
    }
    // Vérifier déblocage Examen (80%)
    if (progress.progressPercent >= 80 && !progress.examUnlocked) {
        await prisma.chapterProgress.update({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId
                }
            },
            data: {
                examUnlocked: true
            }
        });
    }
}
/**
 * Récupère la progression détaillée d'un chapitre
 */
async function getChapterProgress(userId, chapterId) {
    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
            questions: true
        }
    });
    if (!chapter)
        return null;
    const progress = await prisma.chapterProgress.findUnique({
        where: {
            userId_chapterId: {
                userId,
                chapterId
            }
        }
    });
    const questionsTotal = chapter.questions.length;
    const questionsAnswered = progress?.questionsAnswered || 0;
    const questionsCorrect = progress?.questionsCorrect || 0;
    const progressPercent = progress?.progressPercent || 0;
    return {
        chapterId,
        chapterTitle: chapter.title,
        questionsTotal,
        questionsAnswered,
        questionsCorrect,
        progressPercent: Math.round(progressPercent * 100) / 100,
        challengeUnlocked: progress?.challengeUnlocked || false,
        examUnlocked: progress?.examUnlocked || false,
        isComplete: progressPercent >= 100
    };
}
/**
 * Récupère toutes les progressions de chapitres d'un utilisateur pour une matière
 */
async function getUserChaptersProgress(userId, subjectId) {
    const chapters = await prisma.chapter.findMany({
        where: { subjectId },
        include: {
            questions: true,
            chapterProgresses: {
                where: { userId }
            }
        },
        orderBy: { orderIndex: 'asc' }
    });
    return chapters.map(chapter => {
        const progress = chapter.chapterProgresses[0];
        const questionsTotal = chapter.questions.length;
        const questionsAnswered = progress?.questionsAnswered || 0;
        const questionsCorrect = progress?.questionsCorrect || 0;
        const progressPercent = progress?.progressPercent || 0;
        return {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            questionsTotal,
            questionsAnswered,
            questionsCorrect,
            progressPercent: Math.round(progressPercent * 100) / 100,
            challengeUnlocked: progress?.challengeUnlocked || false,
            examUnlocked: progress?.examUnlocked || false,
            isComplete: progressPercent >= 100
        };
    });
}
// ============================================
// PROGRESSION PAR MATIÈRE
// ============================================
/**
 * Met à jour la progression globale dans une matière
 */
async function updateSubjectProgress(userId, subjectId) {
    // Récupérer la matière
    const subject = await prisma.subject.findUnique({
        where: { id: subjectId }
    });
    if (!subject)
        return;
    // Compter toutes les questions de la matière
    const totalQuestions = await prisma.question.count({
        where: {
            chapter: {
                subjectId
            }
        }
    });
    // Compter les questions répondues par l'utilisateur (uniques)
    const attempts = await prisma.quizAttempt.findMany({
        where: {
            userId,
            question: {
                chapter: {
                    subjectId
                }
            }
        },
        select: {
            questionId: true
        }
    });
    const uniqueQuestionIds = new Set(attempts.map(a => a.questionId));
    const answeredQuestions = uniqueQuestionIds.size;
    const progressPercent = (answeredQuestions / totalQuestions) * 100;
    // Récupérer ou créer la progression
    await prisma.subjectProgress.upsert({
        where: {
            userId_subjectId: {
                userId,
                subjectId
            }
        },
        update: {
            totalQuestionsAnswered: answeredQuestions,
            progressPercent
        },
        create: {
            userId,
            subjectId,
            totalQuestionsAnswered: answeredQuestions,
            progressPercent
        }
    });
    // Vérifier déblocage Challenge global (niveau Or)
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (user && (0, level_service_1.hasGlobalChallengeUnlock)(user.level)) {
        await prisma.subjectProgress.update({
            where: {
                userId_subjectId: {
                    userId,
                    subjectId
                }
            },
            data: {
                challengeUnlockedGlobal: true
            }
        });
    }
}
/**
 * Récupère la progression détaillée d'une matière
 */
async function getSubjectProgress(userId, subjectId) {
    const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
            chapters: {
                include: {
                    chapterProgresses: {
                        where: { userId }
                    }
                }
            }
        }
    });
    if (!subject)
        return null;
    const progress = await prisma.subjectProgress.findUnique({
        where: {
            userId_subjectId: {
                userId,
                subjectId
            }
        }
    });
    const chaptersTotal = subject.chapters.length;
    const chaptersCompleted = subject.chapters.filter(chapter => {
        const chapterProgress = chapter.chapterProgresses[0];
        return chapterProgress && chapterProgress.progressPercent >= 100;
    }).length;
    return {
        subjectId,
        subjectTitle: subject.title,
        totalQCM: subject.totalQCM,
        questionsAnswered: progress?.totalQuestionsAnswered || 0,
        progressPercent: Math.round((progress?.progressPercent || 0) * 100) / 100,
        challengeUnlockedGlobal: progress?.challengeUnlockedGlobal || false,
        chaptersCompleted,
        chaptersTotal
    };
}
/**
 * Récupère toutes les progressions de matières d'un utilisateur
 */
async function getUserSubjectsProgress(userId) {
    // Récupérer le semestre de l'utilisateur
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { semester: true }
    });
    if (!user)
        return [];
    // Filtrer les matières par semestre de l'utilisateur
    const subjects = await prisma.subject.findMany({
        where: {
            semester: user.semester
        },
        include: {
            chapters: {
                include: {
                    chapterProgresses: {
                        where: { userId }
                    }
                }
            },
            subjectProgresses: {
                where: { userId }
            }
        },
        orderBy: { title: 'asc' }
    });
    return subjects.map(subject => {
        const progress = subject.subjectProgresses[0];
        const chaptersTotal = subject.chapters.length;
        const chaptersCompleted = subject.chapters.filter(chapter => {
            const chapterProgress = chapter.chapterProgresses[0];
            return chapterProgress && chapterProgress.progressPercent >= 100;
        }).length;
        return {
            subjectId: subject.id,
            subjectTitle: subject.title,
            totalQCM: subject.totalQCM,
            questionsAnswered: progress?.totalQuestionsAnswered || 0,
            progressPercent: Math.round((progress?.progressPercent || 0) * 100) / 100,
            challengeUnlockedGlobal: progress?.challengeUnlockedGlobal || false,
            chaptersCompleted,
            chaptersTotal
        };
    });
}
// ============================================
// VÉRIFICATIONS DE DÉBLOCAGE
// ============================================
/**
 * Vérifie si le Mode Challenge est débloqué pour un chapitre
 */
async function isChallengeUnlocked(userId, chapterId) {
    // Vérifier niveau Or (déblocage global)
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (user && (0, level_service_1.hasGlobalChallengeUnlock)(user.level)) {
        return true;
    }
    // Vérifier progression 50% dans le chapitre
    const progress = await prisma.chapterProgress.findUnique({
        where: {
            userId_chapterId: {
                userId,
                chapterId
            }
        }
    });
    return progress?.challengeUnlocked || false;
}
/**
 * Vérifie si le Mode Examen est débloqué pour une matière
 */
async function isExamUnlocked(userId, subjectId) {
    // Vérifier niveau Argent minimum
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user)
        return false;
    const levelOrder = ['BOIS', 'BRONZE', 'ARGENT', 'OR', 'PLATINUM', 'DIAMANT', 'MONDIAL'];
    const userLevelIndex = levelOrder.indexOf(user.level);
    if (userLevelIndex < 2) { // Moins que Argent
        return false;
    }
    // Vérifier progression 80% dans la matière
    const progress = await prisma.subjectProgress.findUnique({
        where: {
            userId_subjectId: {
                userId,
                subjectId
            }
        }
    });
    return progress ? progress.progressPercent >= 80 : false;
}
// ============================================
// STATISTIQUES GLOBALES
// ============================================
/**
 * Récupère les statistiques globales d'un utilisateur
 */
async function getUserGlobalStats(userId) {
    const attempts = await prisma.quizAttempt.findMany({
        where: { userId }
    });
    const uniqueQuestions = new Set(attempts.map(a => a.questionId));
    const correctAttempts = attempts.filter(a => a.isCorrect);
    const chapterProgresses = await prisma.chapterProgress.findMany({
        where: { userId }
    });
    const completedChapters = chapterProgresses.filter(p => p.progressPercent >= 100).length;
    const subjectProgresses = await prisma.subjectProgress.findMany({
        where: { userId }
    });
    const totalCorrect = correctAttempts.length;
    const totalAnswered = attempts.length;
    const averageSuccessRate = totalAnswered > 0
        ? (totalCorrect / totalAnswered) * 100
        : 0;
    return {
        totalQuestionsAnswered: uniqueQuestions.size,
        totalQuestionsCorrect: correctAttempts.length,
        totalChaptersCompleted: completedChapters,
        totalSubjectsStarted: subjectProgresses.length,
        averageSuccessRate: Math.round(averageSuccessRate * 100) / 100
    };
}
//# sourceMappingURL=progress.service.js.map