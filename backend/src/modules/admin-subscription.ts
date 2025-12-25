/**
 * Admin Subscription Management Routes
 *
 * Routes pour la gestion des abonnements et paiements par les admins
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, requireSuperAdmin, requireLevelAdmin, getSemesterFilter } from './auth';
import { z } from 'zod';
import { emailService } from '../services/email.service';

const prisma = new PrismaClient();
export const adminSubscriptionRouter = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const activateSubscriptionSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  durationMonths: z.number().int().min(1).max(36).default(12)
});

const extendSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  additionalMonths: z.number().int().min(1).max(12)
});

const validatePaymentSchema = z.object({
  paymentId: z.string(),
  status: z.enum(['COMPLETED', 'FAILED']),
  adminNotes: z.string().optional()
});

const assignSemestersSchema = z.object({
  semesters: z.array(z.enum(['PCEM1', 'PCEM2', 'PCEP2', 'DCEM1']))
});

// ============================================
// GESTION DES ADMINS DE NIVEAU (SUPERADMIN ONLY)
// ============================================

/**
 * GET /api/admin/admins
 * Liste tous les admins avec leurs niveaux assignés (SUPERADMIN only)
 */
adminSubscriptionRouter.get('/admins', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedSemesters: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(admins);
  } catch (error) {
    console.error('[admin/admins] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération des admins' }
    });
  }
});

/**
 * POST /api/admin/users/:userId/semesters
 * Assigne des niveaux à un admin (SUPERADMIN only)
 */
adminSubscriptionRouter.post('/users/:userId/semesters', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { semesters } = assignSemestersSchema.parse(req.body);

    // Vérifier que l'utilisateur existe et est un admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(400).json({
        error: { code: 'NOT_AN_ADMIN', message: 'Cet utilisateur n\'est pas un admin. Seuls les admins peuvent avoir des niveaux assignés.' }
      });
    }

    // Mettre à jour les niveaux assignés
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { assignedSemesters: semesters },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedSemesters: true
      }
    });

    console.log(`[admin] Semesters assigned to admin ${user.email}:`, semesters);

    return res.json({
      success: true,
      message: `Niveaux assignés: ${semesters.join(', ')}`,
      user: updatedUser
    });

  } catch (error: any) {
    console.error('[admin/users/:userId/semesters] Error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Niveaux invalides', details: error.errors }
      });
    }

    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de l\'assignation des niveaux' }
    });
  }
});

// ============================================
// STATISTIQUES GLOBALES
// ============================================

/**
 * GET /api/admin/dashboard-stats
 * Récupère les statistiques du dashboard admin (filtrées par niveau pour Level Admin)
 */
adminSubscriptionRouter.get('/dashboard-stats', requireAuth, requireLevelAdmin, async (req: any, res: any) => {
  try {
    const semesterFilter = getSemesterFilter(req);
    const now = new Date();

    // Compter les utilisateurs (filtrés par niveau pour Level Admin)
    const totalUsers = await prisma.user.count({ where: semesterFilter });
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT', ...semesterFilter } });

    // Admins visibles seulement pour SUPERADMIN
    const totalAdmins = req.isSuperAdmin
      ? await prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } })
      : 0;

    // Compter les abonnements actifs (filtrés par niveau)
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        endAt: { gte: now },
        user: semesterFilter
      }
    });

    // Compter les abonnements expirés (filtrés par niveau)
    const expiredSubscriptions = await prisma.subscription.count({
      where: {
        OR: [
          { status: 'EXPIRED' },
          { status: 'ACTIVE', endAt: { lt: now } }
        ],
        user: semesterFilter
      }
    });

    // Paiements et revenus visibles uniquement pour SUPERADMIN
    let paymentsStats = { pending: 0, completed: 0, failed: 0, total: 0 };
    let revenueStats = { total: 0, monthly: 0, currency: 'MRU' };

    if (req.isSuperAdmin) {
      const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } });
      const completedPayments = await prisma.payment.count({ where: { status: 'COMPLETED' } });
      const failedPayments = await prisma.payment.count({ where: { status: 'FAILED' } });

      const revenueResult = await prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amountCents: true }
      });
      const totalRevenueMRU = (revenueResult._sum.amountCents || 0) / 100;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenueResult = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          validatedAt: { gte: startOfMonth }
        },
        _sum: { amountCents: true }
      });
      const monthlyRevenueMRU = (monthlyRevenueResult._sum.amountCents || 0) / 100;

      paymentsStats = {
        pending: pendingPayments,
        completed: completedPayments,
        failed: failedPayments,
        total: pendingPayments + completedPayments + failedPayments
      };
      revenueStats = { total: totalRevenueMRU, monthly: monthlyRevenueMRU, currency: 'MRU' };
    }

    // Utilisateurs récents (derniers 30 jours, filtrés par niveau)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo }, ...semesterFilter }
    });

    return res.json({
      users: {
        total: totalUsers,
        students: totalStudents,
        admins: totalAdmins,
        recent: recentUsers
      },
      subscriptions: {
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        total: activeSubscriptions + expiredSubscriptions
      },
      payments: paymentsStats,
      revenue: revenueStats,
      // Indiquer au frontend les restrictions
      isLevelAdmin: !req.isSuperAdmin,
      assignedSemesters: req.assignedSemesters
    });

  } catch (error) {
    console.error('[admin/dashboard-stats] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération des statistiques' }
    });
  }
});

// ============================================
// LISTE DES UTILISATEURS AVEC ABONNEMENTS
// ============================================

/**
 * GET /api/admin/users-subscriptions
 * Récupère la liste des utilisateurs avec leurs abonnements (filtrée par niveau pour Level Admin)
 */
adminSubscriptionRouter.get('/users-subscriptions', requireAuth, requireLevelAdmin, async (req: any, res: any) => {
  try {
    const semesterFilter = getSemesterFilter(req);

    const users = await prisma.user.findMany({
      where: { role: 'STUDENT', ...semesterFilter },
      select: {
        id: true,
        email: true,
        name: true,
        semester: true,
        xpTotal: true,
        level: true,
        createdAt: true,
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: {
            endAt: 'desc'
          },
          take: 1 // Prendre le dernier abonnement
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const now = new Date();

    const usersWithStatus = users.map(user => {
      const subscription = user.subscriptions[0];

      let subscriptionStatus: 'active' | 'expired' | 'none' = 'none';
      let canAccessQuiz = false;
      let canAccessDocuments = false;
      let expiresAt = null;
      let planName = null;
      let planType = null;

      if (subscription) {
        const isActive = subscription.status === 'ACTIVE' && subscription.endAt >= now;
        subscriptionStatus = isActive ? 'active' : 'expired';

        if (isActive) {
          canAccessQuiz = subscription.plan.type === 'QUIZ_ONLY' || subscription.plan.type === 'FULL_ACCESS';
          canAccessDocuments = subscription.plan.type === 'DOCUMENTS_ONLY' || subscription.plan.type === 'FULL_ACCESS';
          expiresAt = subscription.endAt;
          planName = subscription.plan.name;
          planType = subscription.plan.type;
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'STUDENT',
        semester: user.semester,
        xpTotal: user.xpTotal,
        level: user.level,
        createdAt: user.createdAt,
        canAccessQuiz,
        canAccessDocuments,
        subscription: subscription ? {
          id: subscription.id,
          status: subscriptionStatus.toUpperCase(),
          type: planType,
          startAt: subscription.startAt,
          endAt: expiresAt,
          planName
        } : null
      };
    });

    return res.json(usersWithStatus);

  } catch (error) {
    console.error('[admin/users-subscriptions] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération des utilisateurs' }
    });
  }
});

// ============================================
// LISTE DES PAIEMENTS
// ============================================

/**
 * GET /api/admin/payments
 * Récupère la liste des paiements (SUPERADMIN only)
 */
adminSubscriptionRouter.get('/payments', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { status, limit } = req.query;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit as string) : undefined
    });

    // Récupérer les informations des plans pour chaque paiement
    const paymentsWithPlans = await Promise.all(
      payments.map(async (payment) => {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: payment.planId },
          select: {
            id: true,
            name: true,
            type: true
          }
        });

        return {
          id: payment.id,
          userId: payment.userId,
          planId: payment.planId,
          user: payment.user,
          plan: plan || { id: payment.planId, name: 'Plan inconnu', type: 'UNKNOWN' },
          provider: payment.provider,
          providerRef: payment.providerRef,
          phoneNumber: payment.phoneNumber,
          amountCents: payment.amountCents,
          currency: payment.currency,
          status: payment.status,
          receiptScreenshot: payment.screenshotUrl,
          adminNotes: payment.adminNotes,
          validatedBy: payment.validatedBy,
          validatedAt: payment.validatedAt,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        };
      })
    );

    return res.json(paymentsWithPlans);

  } catch (error) {
    console.error('[admin/payments] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la récupération des paiements' }
    });
  }
});

// ============================================
// ACTIONS ADMIN - ACTIVER ABONNEMENT
// ============================================

/**
 * POST /api/admin/subscription/activate
 * Crée et active un abonnement pour un utilisateur (SUPERADMIN only)
 */
adminSubscriptionRouter.post('/subscription/activate', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { userId, planId, durationMonths } = activateSubscriptionSchema.parse(req.body);

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' }
      });
    }

    // Vérifier que le plan existe
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({
        error: { code: 'PLAN_NOT_FOUND', message: 'Plan non trouvé' }
      });
    }

    // Calculer les dates
    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    // Créer l'abonnement
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
        startAt,
        endAt
      },
      include: {
        plan: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`[admin] Subscription activated: ${subscription.id} for user ${user.email}`);

    return res.json({
      success: true,
      message: 'Abonnement activé avec succès',
      subscription: {
        id: subscription.id,
        user: subscription.user,
        plan: subscription.plan,
        status: subscription.status,
        startAt: subscription.startAt,
        endAt: subscription.endAt
      }
    });

  } catch (error: any) {
    console.error('[admin/subscription/activate] Error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: error.errors }
      });
    }

    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de l\'activation de l\'abonnement' }
    });
  }
});

// ============================================
// ACTIONS ADMIN - PROLONGER ABONNEMENT
// ============================================

/**
 * POST /api/admin/subscription/extend
 * Prolonge un abonnement existant (SUPERADMIN only)
 */
adminSubscriptionRouter.post('/subscription/extend', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { subscriptionId, additionalMonths } = extendSubscriptionSchema.parse(req.body);

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, user: { select: { email: true, name: true } } }
    });

    if (!subscription) {
      return res.status(404).json({
        error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'Abonnement non trouvé' }
      });
    }

    // Calculer la nouvelle date de fin
    const currentEndAt = subscription.endAt;
    const newEndAt = new Date(currentEndAt.getTime() + additionalMonths * 30 * 24 * 60 * 60 * 1000);

    // Mettre à jour l'abonnement
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        endAt: newEndAt,
        status: 'ACTIVE' // Réactiver si expiré
      },
      include: {
        plan: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`[admin] Subscription extended: ${subscriptionId} by ${additionalMonths} months`);

    return res.json({
      success: true,
      message: `Abonnement prolongé de ${additionalMonths} mois`,
      subscription: {
        id: updatedSubscription.id,
        user: updatedSubscription.user,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        startAt: updatedSubscription.startAt,
        endAt: updatedSubscription.endAt,
        oldEndAt: currentEndAt,
        additionalMonths
      }
    });

  } catch (error: any) {
    console.error('[admin/subscription/extend] Error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: error.errors }
      });
    }

    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la prolongation de l\'abonnement' }
    });
  }
});

// ============================================
// ACTIONS ADMIN - VALIDER PAIEMENT
// ============================================

/**
 * POST /api/admin/payment/validate
 * Valide ou rejette un paiement et crée l'abonnement si validé (SUPERADMIN only)
 */
adminSubscriptionRouter.post('/payment/validate', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { paymentId, status, adminNotes } = validatePaymentSchema.parse(req.body);
    const adminId = req.userId;

    // Récupérer le paiement
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });

    if (!payment) {
      return res.status(404).json({
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Paiement non trouvé' }
      });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        error: { code: 'PAYMENT_ALREADY_PROCESSED', message: 'Ce paiement a déjà été traité' }
      });
    }

    // Mettre à jour le paiement
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        adminNotes,
        validatedBy: adminId,
        validatedAt: new Date()
      }
    });

    let subscription = null;

    // Si le paiement est validé, créer l'abonnement
    if (status === 'COMPLETED') {
      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + 12 * 30 * 24 * 60 * 60 * 1000); // 12 mois

      subscription = await prisma.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          status: 'ACTIVE',
          startAt,
          endAt
        },
        include: {
          plan: true
        }
      });

      // Lier le paiement à l'abonnement
      await prisma.payment.update({
        where: { id: paymentId },
        data: { subscriptionId: subscription.id }
      });

      console.log(`[admin] Payment validated and subscription created: ${subscription.id} for user ${payment.user.email}`);

      // Envoyer une notification à l'admin pour le nouveau paiement
      emailService.sendAdminNotificationPayment(
        payment.user.name,
        payment.user.email,
        payment.amountCents / 100,
        subscription.plan.name,
        payment.providerRef || undefined
      ).catch(err => {
        console.error('Failed to send admin payment notification:', err);
        // Don't fail the payment validation if email fails
      });
    } else {
      console.log(`[admin] Payment rejected: ${paymentId}`);
    }

    return res.json({
      success: true,
      message: status === 'COMPLETED' ? 'Paiement validé et abonnement activé' : 'Paiement rejeté',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        validatedAt: updatedPayment.validatedAt
      },
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan.name,
        endAt: subscription.endAt
      } : null
    });

  } catch (error: any) {
    console.error('[admin/payment/validate] Error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: error.errors }
      });
    }

    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la validation du paiement' }
    });
  }
});

// ============================================
// ACTIONS ADMIN - DÉSACTIVER ABONNEMENT
// ============================================

/**
 * POST /api/admin/subscription/deactivate
 * Désactive un abonnement (SUPERADMIN only)
 */
adminSubscriptionRouter.post('/subscription/deactivate', requireAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        error: { code: 'MISSING_SUBSCRIPTION_ID', message: 'ID d\'abonnement requis' }
      });
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELED',
        cancelAt: new Date()
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        plan: true
      }
    });

    console.log(`[admin] Subscription deactivated: ${subscriptionId}`);

    return res.json({
      success: true,
      message: 'Abonnement désactivé avec succès',
      subscription: {
        id: subscription.id,
        user: subscription.user,
        plan: subscription.plan,
        status: subscription.status,
        cancelAt: subscription.cancelAt
      }
    });

  } catch (error) {
    console.error('[admin/subscription/deactivate] Error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Erreur lors de la désactivation de l\'abonnement' }
    });
  }
});
