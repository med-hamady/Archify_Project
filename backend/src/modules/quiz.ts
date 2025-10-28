/**
 * Quiz Routes - FacGame
 *
 * Routes pour le système de quiz interactif :
 * - Répondre à une question
 * - Récupérer la prochaine question
 * - Récupérer l'historique des réponses
 * - Récupérer les questions d'un chapitre
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';
import { calculateXP, checkConsecutiveBonus } from '../services/xp.service';
import { checkLevelUp, getLevelInfo } from '../services/level.service';
import { checkAndAwardBadges } from '../services/badge.service';
import { updateChapterProgress, updateSubjectProgress } from '../services/progress.service';

const prisma = new PrismaClient();
export const quizRouter = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const answerQuestionSchema = z.object({
  questionId: z.string(),
  selectedAnswers: z.array(z.number().int().min(0).max(4)).min(0) // Array of answer indices (0-4), can be empty if all answers are false
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/quiz/answer
 * Répondre à une question et calculer l'XP
 */
quizRouter.post('/answer', requireAuth, async (req: any, res: any) => {
  try {
    const { questionId, selectedAnswers } = answerQuestionSchema.parse(req.body);
    const userId = req.userId;

    // 1. Récupérer la question avec son chapitre
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        chapter: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({
        error: { code: 'QUESTION_NOT_FOUND', message: 'Question not found' }
      });
    }

    // 2. Vérifier si les réponses sont correctes en utilisant le nouveau format JSON
    const options = question.options as any[];
    if (!Array.isArray(options)) {
      return res.status(400).json({
        error: { code: 'INVALID_OPTIONS', message: 'Question options are invalid' }
      });
    }

    // Vérifier que tous les indices sont valides
    for (const answerIndex of selectedAnswers) {
      if (answerIndex >= options.length) {
        return res.status(400).json({
          error: { code: 'INVALID_ANSWER', message: 'Selected answer index out of range' }
        });
      }
    }

    // Trouver toutes les bonnes réponses
    const correctAnswerIndices = options
      .map((opt: any, index: number) => opt.isCorrect ? index : -1)
      .filter((index: number) => index !== -1);

    // Vérifier si l'utilisateur a sélectionné exactement les bonnes réponses
    const selectedSet = new Set(selectedAnswers);
    const correctSet = new Set(correctAnswerIndices);

    const isCorrect =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every(index => correctSet.has(index));

    // 3. Compter le nombre de tentatives précédentes
    const previousAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        questionId
      },
      orderBy: { createdAt: 'asc' }
    });

    const attemptNumber = previousAttempts.length + 1;

    // Vérifier si la question a déjà été répondue correctement (mode replay)
    const alreadyAnsweredCorrectly = previousAttempts.some(a => a.isCorrect);

    // 4. Compter le total de questions dans le chapitre
    const totalQuestions = await prisma.question.count({
      where: { chapterId: question.chapterId }
    });

    // 5. Déterminer la position de la question (pour le facteur de progression)
    const position = question.orderIndex;

    // 6. Récupérer l'utilisateur pour vérifier les bonus actifs
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // TODO: Implémenter vérification de bonus temporaire actif
    const hasActiveBonus = false;

    // 7. Calculer l'XP gagnée (seulement si correct ET pas en mode replay)
    let xpEarned = 0;
    if (isCorrect && !alreadyAnsweredCorrectly) {
      // Ne donner de l'XP que si la question n'a jamais été réussie avant
      const xpResult = calculateXP({
        difficulty: question.difficulty,
        attemptNumber,
        positionInChapter: position,
        totalQuestionsInChapter: totalQuestions,
        hasActiveBonus
      });

      xpEarned = xpResult.xpEarned;
    }

    // 8. Enregistrer la tentative (stocker le premier index sélectionné pour compatibilité)
    await prisma.quizAttempt.create({
      data: {
        userId,
        questionId,
        attemptNumber,
        selectedAnswer: selectedAnswers.length > 0 ? selectedAnswers[0] : -1, // -1 if no answer selected (all false)
        isCorrect,
        xpEarned
      }
    });

    // 9. Mettre à jour l'utilisateur
    let updatedUser = user;
    let levelUpResult: any = { leveledUp: false };
    let consecutiveBonusResult: any = { type: null, xpBonus: 0, message: undefined };
    let newBadges: any[] = [];

    if (isCorrect && !alreadyAnsweredCorrectly) {
      // Mettre à jour l'utilisateur seulement si ce n'est PAS un rejeu
      const oldXP = user.xpTotal;
      const newXP = oldXP + xpEarned;
      const newConsecutive = user.consecutiveGoodAnswers + 1;
      const newLegendCount = question.difficulty === 'LEGENDE'
        ? user.legendQuestionsCompleted + 1
        : user.legendQuestionsCompleted;

      // Mettre à jour l'utilisateur
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          xpTotal: newXP,
          level: getLevelInfo(newXP).current,
          consecutiveGoodAnswers: newConsecutive,
          legendQuestionsCompleted: newLegendCount,
          lastActivityAt: new Date()
        }
      });

      // Vérifier level up
      levelUpResult = checkLevelUp(oldXP, newXP);

      // Vérifier bonus consécutifs
      consecutiveBonusResult = checkConsecutiveBonus(newConsecutive);

      // Vérifier et attribuer badges
      const badgeResult = await checkAndAwardBadges(userId, {
        consecutiveGoodAnswers: newConsecutive,
        legendQuestionsCompleted: newLegendCount,
        level: updatedUser.level
      });

      newBadges = badgeResult.badges;

      // Ajouter XP de bonus consécutif si applicable
      if (consecutiveBonusResult.xpBonus > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            xpTotal: {
              increment: consecutiveBonusResult.xpBonus
            }
          }
        });
      }
    } else if (isCorrect && alreadyAnsweredCorrectly) {
      // En mode rejeu, juste mettre à jour lastActivityAt
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          lastActivityAt: new Date()
        }
      });
    } else {
      // Réponse incorrecte : réinitialiser la série
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          consecutiveGoodAnswers: 0,
          lastActivityAt: new Date()
        }
      });
    }

    // 10. Mettre à jour la progression
    await updateChapterProgress(userId, question.chapterId, isCorrect);
    await updateSubjectProgress(userId, question.chapter.subjectId);

    // 11. Récupérer les infos de niveau mises à jour
    const levelInfo = getLevelInfo(updatedUser.xpTotal);

    // 12. Préparer les options avec justifications pour la réponse
    const optionsWithFeedback = options.map((opt: any, index: number) => ({
      text: opt.text,
      isCorrect: opt.isCorrect,
      justification: !opt.isCorrect ? opt.justification : undefined,
      wasSelected: selectedAnswers.includes(index)
    }));

    // 13. Réponse complète
    return res.json({
      success: true,
      result: {
        correct: isCorrect,
        selectedAnswers,
        options: optionsWithFeedback, // Renvoyer toutes les options avec justifications
        explanation: question.explanation,
        attemptNumber,
        xpEarned,
        totalXP: updatedUser.xpTotal,
        levelInfo: {
          current: levelInfo.current,
          name: levelInfo.currentName,
          progress: levelInfo.progressPercent,
          xpToNext: levelInfo.xpToNextLevel
        },
        levelUp: levelUpResult.leveledUp ? {
          newLevel: levelUpResult.newLevel,
          rewards: levelUpResult.rewards,
          message: levelUpResult.message
        } : null,
        consecutiveBonus: consecutiveBonusResult.type ? {
          type: consecutiveBonusResult.type,
          xpBonus: consecutiveBonusResult.xpBonus,
          message: consecutiveBonusResult.message
        } : null,
        newBadges: newBadges.length > 0 ? newBadges.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description
        })) : null
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues }
      });
    }
    console.error('[quiz/answer] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/quiz/chapter/:chapterId/next
 * Récupérer la prochaine question à répondre dans un chapitre
 * Query params: replay=true pour rejouer le chapitre depuis le début
 */
quizRouter.get('/chapter/:chapterId/next', requireAuth, async (req: any, res: any) => {
  try {
    const { chapterId } = req.params;
    const { replay } = req.query;
    const userId = req.userId;

    // Récupérer toutes les questions du chapitre
    const allQuestions = await prisma.question.findMany({
      where: { chapterId },
      orderBy: { orderIndex: 'asc' }
    });

    if (allQuestions.length === 0) {
      return res.status(404).json({
        error: { code: 'NO_QUESTIONS', message: 'No questions in this chapter' }
      });
    }

    // Récupérer les tentatives de l'utilisateur
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        questionId: {
          in: allQuestions.map(q => q.id)
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Trouver la première question non réussie (pas de bonne réponse)
    const attemptsByQuestion = new Map();
    attempts.forEach(attempt => {
      if (!attemptsByQuestion.has(attempt.questionId)) {
        attemptsByQuestion.set(attempt.questionId, []);
      }
      attemptsByQuestion.get(attempt.questionId).push(attempt);
    });

    // Chercher une question non réussie
    let nextQuestion = null;

    // Si replay=true, recommencer depuis la première question
    if (replay === 'true') {
      nextQuestion = allQuestions[0];
    } else {
      // Mode normal: chercher la première question non réussie
      for (const question of allQuestions) {
        const questionAttempts = attemptsByQuestion.get(question.id) || [];
        const hasCorrectAnswer = questionAttempts.some((a: any) => a.isCorrect);

        if (!hasCorrectAnswer) {
          nextQuestion = question;
          break;
        }
      }

      if (!nextQuestion) {
        return res.json({
          success: true,
          question: null,
          completed: true,
          message: 'Chapter completed! All questions answered correctly.'
        });
      }
    }

    // Retourner la question avec les options (sans révéler les réponses correctes ni les justifications)
    const questionOptions = nextQuestion.options as any[];
    const sanitizedOptions = questionOptions.map((opt: any) => ({
      text: opt.text
      // Ne pas inclure isCorrect ni justification avant la réponse
    }));

    // Vérifier si cette question a déjà été répondue correctement (pour le mode replay)
    const questionAttempts = attemptsByQuestion.get(nextQuestion.id) || [];
    const alreadyAnsweredCorrectly = questionAttempts.some((a: any) => a.isCorrect);

    return res.json({
      success: true,
      question: {
        id: nextQuestion.id,
        questionText: nextQuestion.questionText,
        options: sanitizedOptions,
        difficulty: nextQuestion.difficulty,
        chapterId: nextQuestion.chapterId,
        orderIndex: nextQuestion.orderIndex,
        position: allQuestions.findIndex(q => q.id === nextQuestion.id),
        totalQuestions: allQuestions.length,
        isReplay: alreadyAnsweredCorrectly // Indiquer si c'est un rejeu
      }
    });

  } catch (error) {
    console.error('[quiz/chapter/:id/next] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/quiz/chapter/:chapterId/questions
 * Récupérer toutes les questions d'un chapitre (admin ou preview)
 */
quizRouter.get('/chapter/:chapterId/questions', requireAuth, async (req: any, res: any) => {
  try {
    const { chapterId } = req.params;
    const userId = req.userId;

    const questions = await prisma.question.findMany({
      where: { chapterId },
      orderBy: { orderIndex: 'asc' }
    });

    // Récupérer les tentatives de l'utilisateur pour chaque question
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        questionId: {
          in: questions.map(q => q.id)
        }
      }
    });

    const attemptsByQuestion = new Map();
    attempts.forEach(attempt => {
      if (!attemptsByQuestion.has(attempt.questionId)) {
        attemptsByQuestion.set(attempt.questionId, []);
      }
      attemptsByQuestion.get(attempt.questionId).push(attempt);
    });

    const questionsWithStatus = questions.map(question => {
      const questionAttempts = attemptsByQuestion.get(question.id) || [];
      const correctAttempt = questionAttempts.find((a: any) => a.isCorrect);

      return {
        id: question.id,
        text: question.questionText,
        difficulty: question.difficulty,
        orderIndex: question.orderIndex,
        status: correctAttempt ? 'completed' : questionAttempts.length > 0 ? 'attempted' : 'not_started',
        attempts: questionAttempts.length
      };
    });

    return res.json({ questions: questionsWithStatus });

  } catch (error) {
    console.error('[quiz/chapter/:id/questions] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

/**
 * GET /api/quiz/history/:questionId
 * Récupérer l'historique des tentatives pour une question
 */
quizRouter.get('/history/:questionId', requireAuth, async (req: any, res: any) => {
  try {
    const { questionId } = req.params;
    const userId = req.userId;

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        questionId
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({
      attempts: attempts.map(a => ({
        attemptNumber: a.attemptNumber,
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
        xpEarned: a.xpEarned,
        createdAt: a.createdAt
      }))
    });

  } catch (error) {
    console.error('[quiz/history/:id] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});
