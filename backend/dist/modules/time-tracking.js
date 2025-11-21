"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// POST /api/time-tracking/start - Start a study session
router.post('/start', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                sessionStartTime: new Date(),
                lastXpRewardTime: new Date() // Initialize on session start
            },
            select: {
                id: true,
                sessionStartTime: true,
                totalStudyTimeSeconds: true
            }
        });
        res.json({
            success: true,
            sessionStartTime: user.sessionStartTime,
            totalStudyTimeSeconds: user.totalStudyTimeSeconds
        });
    }
    catch (error) {
        console.error('Error starting study session:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du démarrage de la session'
        });
    }
});
// POST /api/time-tracking/update - Update study time and award XP if needed
router.post('/update', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { elapsedSeconds } = req.body;
        if (typeof elapsedSeconds !== 'number' || elapsedSeconds < 0) {
            return res.status(400).json({
                success: false,
                error: 'Temps écoulé invalide'
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                xpTotal: true,
                totalStudyTimeSeconds: true,
                sessionStartTime: true,
                lastXpRewardTime: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        // IMPORTANT: This endpoint is called every 5 minutes during a session
        // The frontend sends elapsedSeconds = total seconds since session start
        // We should only add the time increment (300 seconds) each time, not the full elapsed time
        // Since we're called every 300 seconds (5 minutes), we add exactly 300 seconds
        // Exception: if elapsedSeconds < 300, it means this is an early update
        const timeIncrement = 300; // Always add 5 minutes per update
        const previousTotalTime = user.totalStudyTimeSeconds || 0;
        const newTotalSeconds = previousTotalTime + timeIncrement;
        // Calculate XP based on hours completed
        const previousHours = Math.floor(previousTotalTime / 3600);
        const newHours = Math.floor(newTotalSeconds / 3600);
        const hoursCompleted = newHours - previousHours;
        const actualXpToAward = Math.max(0, hoursCompleted * 60);
        console.log(`⏱️ [Time Update] User ${userId}: Adding ${timeIncrement}s (${previousTotalTime}s → ${newTotalSeconds}s)`);
        if (actualXpToAward > 0) {
            console.log(`🎉 [XP Award] User ${userId}: +${actualXpToAward} XP for completing ${hoursCompleted} hour(s)`);
        }
        // Update user with new study time and XP
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                totalStudyTimeSeconds: {
                    increment: timeIncrement
                },
                ...(actualXpToAward > 0 && {
                    xpTotal: {
                        increment: actualXpToAward
                    },
                    lastXpRewardTime: new Date()
                })
            },
            select: {
                id: true,
                xpTotal: true,
                totalStudyTimeSeconds: true,
                level: true
            }
        });
        res.json({
            success: true,
            totalStudyTimeSeconds: updatedUser.totalStudyTimeSeconds,
            xpAwarded: actualXpToAward,
            xpTotal: updatedUser.xpTotal,
            level: updatedUser.level
        });
    }
    catch (error) {
        console.error('Error updating study time:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du temps d\'étude'
        });
    }
});
// POST /api/time-tracking/end - End study session
router.post('/end', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { totalSeconds } = req.body;
        if (typeof totalSeconds !== 'number' || totalSeconds < 0) {
            return res.status(400).json({
                success: false,
                error: 'Temps total invalide'
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                totalStudyTimeSeconds: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        // Calculate total hours
        const previousTotalSeconds = user.totalStudyTimeSeconds || 0;
        const newTotalSeconds = previousTotalSeconds + totalSeconds;
        const previousHours = Math.floor(previousTotalSeconds / 3600);
        const newHours = Math.floor(newTotalSeconds / 3600);
        const completedHours = newHours - previousHours;
        const xpToAward = completedHours * 60;
        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                totalStudyTimeSeconds: newTotalSeconds,
                sessionStartTime: null,
                ...(xpToAward > 0 && {
                    xpTotal: {
                        increment: xpToAward
                    },
                    lastXpRewardTime: new Date()
                })
            },
            select: {
                id: true,
                xpTotal: true,
                totalStudyTimeSeconds: true,
                level: true
            }
        });
        res.json({
            success: true,
            totalStudyTimeSeconds: updatedUser.totalStudyTimeSeconds,
            xpAwarded: xpToAward,
            xpTotal: updatedUser.xpTotal,
            level: updatedUser.level,
            completedHours
        });
    }
    catch (error) {
        console.error('Error ending study session:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la fin de la session'
        });
    }
});
// GET /api/time-tracking/stats - Get study time statistics
router.get('/stats', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                totalStudyTimeSeconds: true,
                sessionStartTime: true,
                lastXpRewardTime: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        const totalHours = Math.floor((user.totalStudyTimeSeconds || 0) / 3600);
        const totalMinutes = Math.floor(((user.totalStudyTimeSeconds || 0) % 3600) / 60);
        const totalSeconds = (user.totalStudyTimeSeconds || 0) % 60;
        res.json({
            success: true,
            totalStudyTimeSeconds: user.totalStudyTimeSeconds || 0,
            formattedTime: {
                hours: totalHours,
                minutes: totalMinutes,
                seconds: totalSeconds
            },
            sessionStartTime: user.sessionStartTime,
            lastXpRewardTime: user.lastXpRewardTime,
            isSessionActive: !!user.sessionStartTime
        });
    }
    catch (error) {
        console.error('Error fetching study time stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques'
        });
    }
});
exports.default = router;
//# sourceMappingURL=time-tracking.js.map