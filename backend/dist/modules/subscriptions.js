"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
// Type assertion helper
const getAuthenticatedReq = (req) => req;
const prisma = new client_1.PrismaClient();
exports.subscriptionsRouter = (0, express_1.Router)();
// Schemas
const subscriptionPlanCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    interval: zod_1.z.enum(['monthly', 'yearly']),
    priceCents: zod_1.z.number().int().min(0),
    currency: zod_1.z.string().length(3).default('MAD')
});
const subscriptionCreateSchema = zod_1.z.object({
    planId: zod_1.z.string().cuid()
});
// GET /plans - Get available subscription plans
exports.subscriptionsRouter.get('/plans', async (req, res) => {
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
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /providers - Get available payment providers
exports.subscriptionsRouter.get('/providers', async (req, res) => {
    try {
        // In a real implementation, these would be configured in the database
        const providers = [
            {
                id: 'bankily',
                name: 'Bankily',
                logo: '/assets/payment/bankily.png',
                enabled: true
            },
            {
                id: 'masrivi',
                name: 'Masrivi',
                logo: '/assets/payment/masrivi.png',
                enabled: true
            },
            {
                id: 'sedad',
                name: 'Sedad',
                logo: '/assets/payment/sedad.png',
                enabled: true
            }
        ];
        res.json({ providers });
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /checkout - Initiate checkout process
exports.subscriptionsRouter.post('/checkout', auth_1.requireAuth, async (req, res) => {
    try {
        const { planId, provider, couponCode } = req.body;
        // Validate plan exists
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId }
        });
        if (!plan) {
            return res.status(404).json({ error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' } });
        }
        // Validate coupon if provided
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: couponCode.toUpperCase() }
            });
            if (!coupon || coupon.validTo < new Date() || (coupon.maxRedemptions !== null && coupon.maxRedemptions <= coupon.usedCount)) {
                return res.status(400).json({ error: { code: 'INVALID_COUPON', message: 'Invalid or expired coupon' } });
            }
        }
        // Generate checkout response based on provider
        const checkoutResponse = await generateCheckoutResponse(plan, provider, couponCode);
        res.json(checkoutResponse);
    }
    catch (err) {
        console.error('Checkout error:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /webhook - Handle payment webhooks
exports.subscriptionsRouter.post('/webhook', async (req, res) => {
    try {
        const { provider, data } = req.body;
        // Process webhook based on provider
        await processWebhook(provider, data);
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('Webhook error:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /payments/status/:providerRef - Get payment status
exports.subscriptionsRouter.get('/payments/status/:providerRef', async (req, res) => {
    try {
        const { providerRef } = req.params;
        const payment = await prisma.payment.findUnique({
            where: { providerRef }
        });
        if (!payment) {
            return res.status(404).json({ error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' } });
        }
        res.json({
            status: payment.status,
            provider: payment.provider,
            providerRef: payment.providerRef,
            amount: payment.amountCents / 100,
            currency: payment.currency,
            completedAt: payment.createdAt
        });
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /coupons/validate - Validate coupon code
exports.subscriptionsRouter.post('/coupons/validate', auth_1.requireAuth, async (req, res) => {
    try {
        const { couponCode, planId } = req.body;
        if (!couponCode) {
            return res.json({ valid: false, message: 'Coupon code required' });
        }
        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode.toUpperCase() }
        });
        if (!coupon) {
            return res.json({ valid: false, message: 'Invalid coupon code' });
        }
        if (coupon.validTo < new Date()) {
            return res.json({ valid: false, message: 'Coupon expired' });
        }
        if (coupon.maxRedemptions && coupon.usedCount >= coupon.maxRedemptions) {
            return res.json({ valid: false, message: 'Coupon usage limit reached' });
        }
        res.json({
            valid: true,
            discount: coupon.discountPercent,
            message: 'Coupon applied successfully'
        });
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// Helper functions for payment processing
async function generateCheckoutResponse(plan, provider, couponCode) {
    // In a real implementation, this would integrate with actual payment providers
    // For now, return mock response
    const baseAmount = plan.priceCents;
    const discount = couponCode ? await calculateDiscount(couponCode, baseAmount) : 0;
    const finalAmount = baseAmount - discount;
    switch (provider) {
        case 'bankily':
            return {
                approvalUrl: `https://bankily.com/checkout?amount=${finalAmount}&plan=${plan.id}`,
                qrCode: `bankily_qr_${Date.now()}`,
                instructions: 'Scannez le QR code avec l\'app Bankily ou utilisez le lien de paiement',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
            };
        case 'masrivi':
            return {
                approvalUrl: `https://masrivi.com/pay?amount=${finalAmount}&plan=${plan.id}`,
                intentId: `masrivi_${Date.now()}`,
                instructions: 'Utilisez l\'app Masrivi pour confirmer le paiement',
                expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
            };
        case 'sedad':
            return {
                approvalUrl: `https://sedad.com/payment?amount=${finalAmount}&plan=${plan.id}`,
                qrCode: `sedad_qr_${Date.now()}`,
                instructions: 'Scannez le QR code avec l\'app Sedad',
                expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20 minutes
            };
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}
async function calculateDiscount(couponCode, amount) {
    const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() }
    });
    if (!coupon)
        return 0;
    return Math.floor(amount * (coupon.discountPercent / 100));
}
async function processWebhook(provider, data) {
    // Process webhook data and update payment status
    // This would integrate with actual payment provider webhooks
    console.log(`Processing ${provider} webhook:`, data);
    // Update payment status in database
    if (data.status === 'completed') {
        await updatePaymentStatus(data.providerRef, 'completed');
        await activateSubscription(data.providerRef);
    }
}
async function updatePaymentStatus(providerRef, status) {
    await prisma.payment.updateMany({
        where: { providerRef },
        data: { status }
    });
}
async function activateSubscription(providerRef) {
    const payment = await prisma.payment.findUnique({
        where: { providerRef },
        include: { subscription: true }
    });
    if (payment && payment.subscription) {
        await prisma.subscription.update({
            where: { id: payment.subscription.id },
            data: { status: 'active' }
        });
    }
}
// POST /plans - Create subscription plan (admin only)
exports.subscriptionsRouter.post('/plans', auth_1.requireAuth, async (req, res) => {
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /my-subscription - Get user's current subscription
exports.subscriptionsRouter.get('/my-subscription', auth_1.requireAuth, async (req, res) => {
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
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /subscribe - Create new subscription
exports.subscriptionsRouter.post('/subscribe', auth_1.requireAuth, async (req, res) => {
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
        // Calculate end date
        const startAt = new Date();
        const endAt = new Date();
        if (plan.interval === 'monthly') {
            endAt.setMonth(endAt.getMonth() + 1);
        }
        else {
            endAt.setFullYear(endAt.getFullYear() + 1);
        }
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /cancel - Cancel subscription
exports.subscriptionsRouter.post('/cancel', auth_1.requireAuth, async (req, res) => {
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
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /history - Get subscription history
exports.subscriptionsRouter.get('/history', auth_1.requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /webhook - Handle payment webhooks (stub)
exports.subscriptionsRouter.post('/webhook', async (req, res) => {
    try {
        // This would integrate with payment providers like Stripe, PayPal, etc.
        // For now, just acknowledge the webhook
        res.status(200).json({ received: true });
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /check-access/:lessonId - Check if user has access to lesson
exports.subscriptionsRouter.get('/check-access/:lessonId', auth_1.requireAuth, async (req, res) => {
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
    }
    catch (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=subscriptions.js.map