/**
 * Admin XP Management Module
 *
 * Routes pour la gestion des XP par les administrateurs :
 * - Donner ou retirer des XP aux utilisateurs
 * - Consulter l'historique des modifications XP
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireSuperAdmin } from './auth';
import { getLevelInfo } from '../services/level.service';

const prisma = new PrismaClient();
export const adminXpRouter = Router();

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================

const giveXpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  xpAmount: z.number().int(), // Peut être négatif
  reason: z.string().optional()
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/admin/xp/give
 * Donner ou retirer des XP à un utilisateur
 */
adminXpRouter.post('/give', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
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
    const oldLevel = getLevelInfo(oldXp);
    const newLevel = getLevelInfo(newXp);

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

  } catch (error: any) {
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
adminXpRouter.get('/history', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

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

  } catch (error: any) {
    console.error('[Admin XP History] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});
