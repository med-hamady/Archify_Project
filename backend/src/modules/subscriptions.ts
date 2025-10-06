import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';

// Type assertion helper
const getAuthenticatedReq = (req: any) => req as any;

const prisma = new PrismaClient();
export const subscriptionsRouter = Router();

// Schemas
const subscriptionPlanCreateSchema = z.object({
  name: z.string().min(1),
  interval: z.enum(['yearly']), // Only yearly subscriptions
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('MRU')
});

const subscriptionCreateSchema = z.object({
  planId: z.string().cuid()
});

// GET /plans - Get available subscription plans
subscriptionsRouter.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceCents: 'asc' }
    });

    res.json({
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        interval: plan.interval,
        priceCents: plan.priceCents,
        price: (plan.priceCents / 100).toFixed(2),
        currency: plan.currency
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /validate-coupon - Validate coupon code
subscriptionsRouter.post('/validate-coupon', async (req, res) => {
  try {
    const { code, planId } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: { code: 'MISSING_CODE', message: 'Coupon code is required' } });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (!coupon) {
      return res.json({ valid: false, message: 'Invalid coupon code' });
    }

    if (coupon.validTo < new Date()) {
      return res.json({ valid: false, message: 'Coupon has expired' });
    }

    if (coupon.maxRedemptions !== null && coupon.maxRedemptions <= coupon.usedCount) {
      return res.json({ valid: false, message: 'Coupon usage limit exceeded' });
    }

    res.json({
      valid: true,
      discount: coupon.discountPercent,
      message: 'Coupon applied successfully'
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// Helper functions for payment processing
async function createPaymentIntent(provider: string, amount: number, currency: string) {
  // Mock implementation - in real app, integrate with payment providers
  return {
    intentId: `intent_${Date.now()}`,
    qrCode: `data:image/png;base64,mock_qr_code`,
    approvalUrl: `https://payment.${provider}.com/approve/${Date.now()}`
  };
}

// POST /checkout - Initiate payment checkout
subscriptionsRouter.post('/checkout', requireAuth, async (req: any, res) => {
  try {
    const { planId, provider, couponCode } = req.body;
    
    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(400).json({ error: { code: 'INVALID_PLAN', message: 'Plan not found' } });
    }

    // Check if user already has active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      return res.status(400).json({ 
        error: { code: 'ALREADY_SUBSCRIBED', message: 'User already has an active subscription' } 
      });
    }

    // Apply coupon discount if provided
    let finalPrice = plan.priceCents;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      });
      
      if (coupon && coupon.validTo > new Date() && (coupon.maxRedemptions === null || coupon.maxRedemptions > coupon.usedCount)) {
        finalPrice = Math.round(plan.priceCents * (1 - coupon.discountPercent / 100));
      }
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(provider, finalPrice, plan.currency);
    
    res.json({
      intentId: paymentIntent.intentId,
      qrCode: paymentIntent.qrCode,
      approvalUrl: paymentIntent.approvalUrl,
      amount: finalPrice,
      currency: plan.currency
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /plans - Create subscription plan (admin only)
subscriptionsRouter.post('/plans', requireAuth, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    
    const body = subscriptionPlanCreateSchema.parse(req.body);
    
    const plan = await prisma.subscriptionPlan.create({
      data: body
    });
    
    res.status(201).json({
      id: plan.id,
      name: plan.name,
      interval: plan.interval,
      priceCents: plan.priceCents,
      price: (plan.priceCents / 100).toFixed(2),
      currency: plan.currency
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /my-subscription - Get user's current subscription
subscriptionsRouter.get('/my-subscription', requireAuth, async (req: any, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active'
      },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { startAt: 'desc' }
    });
    
    if (!subscription) {
      return res.json({
        hasActiveSubscription: false,
        subscription: null
      });
    }
    
    res.json({
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startAt: subscription.startAt,
        endAt: subscription.endAt,
        cancelAt: subscription.cancelAt,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          interval: subscription.plan.interval,
          priceCents: subscription.plan.priceCents,
          price: (subscription.plan.priceCents / 100).toFixed(2),
          currency: subscription.plan.currency
        },
        lastPayment: subscription.payments[0] ? {
          id: subscription.payments[0].id,
          amountCents: subscription.payments[0].amountCents,
          amount: (subscription.payments[0].amountCents / 100).toFixed(2),
          currency: subscription.payments[0].currency,
          status: subscription.payments[0].status,
          createdAt: subscription.payments[0].createdAt
        } : null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /subscribe - Create new subscription
subscriptionsRouter.post('/subscribe', requireAuth, async (req: any, res) => {
  try {
    const body = subscriptionCreateSchema.parse(req.body);
    
    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: body.planId }
    });
    
    if (!plan) {
      return res.status(400).json({ error: { code: 'INVALID_PLAN', message: 'Plan not found' } });
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active'
      }
    });
    
    if (existingSubscription) {
      return res.status(400).json({ 
        error: { 
          code: 'ALREADY_SUBSCRIBED', 
          message: 'User already has an active subscription' 
        } 
      });
    }
    
    // Calculate end date (1 year from now)
    const startAt = new Date();
    const endAt = new Date();
    endAt.setFullYear(endAt.getFullYear() + 1);
    
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.userId,
        planId: body.planId,
        startAt,
        endAt
      },
      include: {
        plan: true
      }
    });
    
    res.status(201).json({
      id: subscription.id,
      status: subscription.status,
      startAt: subscription.startAt,
      endAt: subscription.endAt,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        interval: subscription.plan.interval,
        priceCents: subscription.plan.priceCents,
        price: (subscription.plan.priceCents / 100).toFixed(2),
        currency: subscription.plan.currency
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /cancel - Cancel subscription
subscriptionsRouter.post('/cancel', requireAuth, async (req: any, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active'
      }
    });
    
    if (!subscription) {
      return res.status(400).json({ 
        error: { 
          code: 'NO_ACTIVE_SUBSCRIPTION', 
          message: 'No active subscription found' 
        } 
      });
    }
    
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        cancelAt: new Date()
      }
    });
    
    res.json({ message: 'Subscription canceled successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /history - Get subscription history
subscriptionsRouter.get('/history', requireAuth, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId: req.userId },
        include: {
          plan: true,
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { startAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.subscription.count({
        where: { userId: req.userId }
      })
    ]);
    
    res.json({
      subscriptions: subscriptions.map(subscription => ({
        id: subscription.id,
        status: subscription.status,
        startAt: subscription.startAt,
        endAt: subscription.endAt,
        cancelAt: subscription.cancelAt,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          interval: subscription.plan.interval,
          priceCents: subscription.plan.priceCents,
          price: (subscription.plan.priceCents / 100).toFixed(2),
          currency: subscription.plan.currency
        },
        payments: subscription.payments.map(payment => ({
          id: payment.id,
          amountCents: payment.amountCents,
          amount: (payment.amountCents / 100).toFixed(2),
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.createdAt
        }))
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /webhook - Handle payment webhooks (stub)
subscriptionsRouter.post('/webhook', async (req, res) => {
  try {
    // This would integrate with payment providers like Stripe, PayPal, etc.
    // For now, just acknowledge the webhook
    res.status(200).json({ received: true });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /check-access/:lessonId - Check if user has access to lesson
subscriptionsRouter.get('/check-access/:lessonId', requireAuth, async (req: any, res) => {
  try {
    const { lessonId } = req.params;
    
    // Get lesson details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: { isPremium: true }
        }
      }
    });
    
    if (!lesson) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
    }
    
    // If lesson is not premium, user has access
    if (!lesson.isPremium && !lesson.course.isPremium) {
      return res.json({ hasAccess: true, reason: 'free_content' });
    }
    
    // Check if user has active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active',
        endAt: { gt: new Date() }
      }
    });
    
    if (subscription) {
      return res.json({ hasAccess: true, reason: 'active_subscription' });
    }
    
    res.json({ hasAccess: false, reason: 'subscription_required' });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
