"use strict";
/**
 * Admin XP Management Module
 *
 * Routes pour la gestion des XP par les administrateurs :
 * - Donner ou retirer des XP aux utilisateurs
 * - Consulter l'historique des modifications XP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminXpRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const level_service_1 = require("../services/level.service");
const prisma = new client_1.PrismaClient();
exports.adminXpRouter = (0, express_1.Router)();
// ============================================
// SCHÉMAS DE VALIDATION
// ============================================
const giveXpSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    xpAmount: zod_1.z.number().int(), // Peut être négatif
    reason: zod_1.z.string().optional()
});
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/admin/xp/give
 * Donner ou retirer des XP à un utilisateur
 */
exports.adminXpRouter.post('/give', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const validation = giveXpSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: validation.error.issues
            });
        }
        const { userId, xpAmount, reason } = validation.data;
        const adminId = req.userId;
        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        // Calculer le nouvel XP (ne pas descendre en dessous de 0)
        const oldXp = user.xpTotal;
        const newXp = Math.max(0, oldXp + xpAmount);
        // Calculer les niveaux
        const oldLevel = (0, level_service_1.getLevelInfo)(oldXp);
        const newLevel = (0, level_service_1.getLevelInfo)(newXp);
        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                xpTotal: newXp,
                level: newLevel.current
            }
        });
        // Créer un enregistrement dans l'historique
        await prisma.xpTransaction.create({
            data: {
                userId,
                adminId,
                xpAmount,
                reason: reason || (xpAmount > 0 ? 'Bonus administrateur' : 'Ajustement administrateur'),
                oldXp,
                newXp,
                oldLevel: oldLevel.current,
                newLevel: newLevel.current
            }
        });
        console.log(`[Admin XP] Admin ${adminId} ${xpAmount > 0 ? 'gave' : 'removed'} ${Math.abs(xpAmount)} XP to user ${userId}`);
        return res.json({
            success: true,
            message: `${xpAmount > 0 ? 'Ajouté' : 'Retiré'} ${Math.abs(xpAmount)} XP`,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                oldXp,
                newXp,
                oldLevel: oldLevel.currentName,
                newLevel: newLevel.currentName,
                leveledUp: newLevel.current !== oldLevel.current
            }
        });
    }
    catch (error) {
        console.error('[Admin XP Give] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});
/**
 * GET /api/admin/xp/history
 * Obtenir l'historique des modifications XP
 */
exports.adminXpRouter.get('/history', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = await prisma.xpTransaction.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        semester: true
                    }
                },
                admin: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        return res.json({
            success: true,
            history: history.map(h => ({
                id: h.id,
                date: h.createdAt,
                admin: {
                    id: h.admin.id,
                    name: h.admin.name,
                    email: h.admin.email
                },
                user: {
                    id: h.user.id,
                    name: h.user.name,
                    email: h.user.email,
                    semester: h.user.semester
                },
                xpAmount: h.xpAmount,
                reason: h.reason,
                oldXp: h.oldXp,
                newXp: h.newXp,
                oldLevel: h.oldLevel,
                newLevel: h.newLevel
            }))
        });
    }
    catch (error) {
        console.error('[Admin XP History] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});
//# sourceMappingURL=admin-xp.js.map