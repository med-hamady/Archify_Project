"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualPaymentsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
exports.manualPaymentsRouter = (0, express_1.Router)();
// Configure multer for screenshot uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads/payment-screenshots');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});
// Schema pour créer un paiement manuel
const createManualPaymentSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1, 'Plan ID is required'),
    provider: zod_1.z.enum(['BANKILY', 'MASRIVI', 'SEDAD']),
    providerRef: zod_1.z.string().min(1, 'Transaction number is required'),
    phoneNumber: zod_1.z.string().min(8, 'Phone number is required'),
    amountCents: zod_1.z.number().int().positive()
});
// POST /manual-payments - Créer un paiement manuel (soumission par le client)
exports.manualPaymentsRouter.post('/', auth_1.requireAuth, upload.single('screenshot'), async (req, res) => {
    try {
        const body = createManualPaymentSchema.parse({
            planId: req.body.planId,
            provider: req.body.provider,
            providerRef: req.body.providerRef,
            phoneNumber: req.body.phoneNumber,
            amountCents: parseInt(req.body.amountCents)
        });
        // Vérifier que le plan existe
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: body.planId }
        });
        if (!plan) {
            return res.status(404).json({
                error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' }
            });
        }
        // Vérifier que le fichier screenshot a été uploadé
        if (!req.file) {
            return res.status(400).json({
                error: { code: 'SCREENSHOT_REQUIRED', message: 'Payment screenshot is required' }
            });
        }
        const screenshotUrl = `/uploads/payment-screenshots/${req.file.filename}`;
        // Créer le paiement en statut PENDING
        const payment = await prisma.payment.create({
            data: {
                userId: req.userId,
                planId: body.planId,
                provider: body.provider,
                providerRef: body.providerRef,
                phoneNumber: body.phoneNumber,
                amountCents: body.amountCents,
                currency: plan.currency,
                status: 'PENDING',
                screenshotUrl
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        console.log('✅ Manual payment created:', payment.id);
        return res.status(201).json({
            id: payment.id,
            status: payment.status,
            provider: payment.provider,
            providerRef: payment.providerRef,
            amountCents: payment.amountCents,
            currency: payment.currency,
            createdAt: payment.createdAt,
            message: 'Payment submitted successfully. Please wait for admin validation.'
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: err.issues[0].message }
            });
        }
        console.error('Error creating manual payment:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal error' }
        });
    }
});
// GET /manual-payments/my-payments - Obtenir les paiements de l'utilisateur connecté
exports.manualPaymentsRouter.get('/my-payments', auth_1.requireAuth, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });
        // Récupérer les infos des plans pour les paiements sans subscription
        const paymentsWithPlanInfo = await Promise.all(payments.map(async (payment) => {
            let planInfo = null;
            if (payment.subscription) {
                planInfo = payment.subscription.plan;
            }
            else {
                // Récupérer le plan via planId
                planInfo = await prisma.subscriptionPlan.findUnique({
                    where: { id: payment.planId }
                });
            }
            return {
                id: payment.id,
                status: payment.status,
                provider: payment.provider,
                providerRef: payment.providerRef,
                phoneNumber: payment.phoneNumber,
                amountCents: payment.amountCents,
                currency: payment.currency,
                screenshotUrl: payment.screenshotUrl,
                adminNotes: payment.adminNotes,
                createdAt: payment.createdAt,
                validatedAt: payment.validatedAt,
                plan: planInfo ? {
                    id: planInfo.id,
                    name: planInfo.name,
                    type: planInfo.type
                } : null
            };
        }));
        return res.json({ payments: paymentsWithPlanInfo });
    }
    catch (err) {
        console.error('Error fetching user payments:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal error' }
        });
    }
});
// GET /manual-payments - Liste tous les paiements (ADMIN ONLY)
exports.manualPaymentsRouter.get('/', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Admin access required' }
        });
    }
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status) {
            where.status = status;
        }
        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.payment.count({ where })
        ]);
        // Ajouter les informations du plan
        const paymentsWithPlanInfo = await Promise.all(payments.map(async (payment) => {
            const plan = await prisma.subscriptionPlan.findUnique({
                where: { id: payment.planId }
            });
            return {
                id: payment.id,
                status: payment.status,
                provider: payment.provider,
                providerRef: payment.providerRef,
                phoneNumber: payment.phoneNumber,
                amountCents: payment.amountCents,
                currency: payment.currency,
                screenshotUrl: payment.screenshotUrl,
                adminNotes: payment.adminNotes,
                validatedBy: payment.validatedBy,
                validatedAt: payment.validatedAt,
                createdAt: payment.createdAt,
                user: payment.user,
                plan: plan ? {
                    id: plan.id,
                    name: plan.name,
                    type: plan.type
                } : null
            };
        }));
        return res.json({
            payments: paymentsWithPlanInfo,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (err) {
        console.error('Error fetching payments:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal error' }
        });
    }
});
// PUT /manual-payments/:id/validate - Valider un paiement (ADMIN ONLY)
exports.manualPaymentsRouter.put('/:id/validate', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Admin access required' }
        });
    }
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!payment) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Payment not found' }
            });
        }
        if (payment.status !== 'PENDING') {
            return res.status(400).json({
                error: { code: 'INVALID_STATUS', message: 'Payment is not pending' }
            });
        }
        // Récupérer le plan
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: payment.planId }
        });
        if (!plan) {
            return res.status(404).json({
                error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' }
            });
        }
        // Créer une transaction pour valider le paiement et créer l'abonnement
        const result = await prisma.$transaction(async (tx) => {
            // Calculer les dates de l'abonnement
            const startAt = new Date();
            const endAt = new Date();
            endAt.setFullYear(endAt.getFullYear() + 1); // 1 an
            // Créer l'abonnement
            const subscription = await tx.subscription.create({
                data: {
                    userId: payment.userId,
                    planId: payment.planId,
                    status: 'ACTIVE',
                    startAt,
                    endAt
                }
            });
            // Mettre à jour le paiement
            const updatedPayment = await tx.payment.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    subscriptionId: subscription.id,
                    adminNotes,
                    validatedBy: req.userId,
                    validatedAt: new Date()
                }
            });
            return { subscription, payment: updatedPayment };
        });
        console.log('✅ Payment validated:', id, 'Subscription created:', result.subscription.id);
        return res.json({
            message: 'Payment validated successfully',
            payment: {
                id: result.payment.id,
                status: result.payment.status,
                validatedAt: result.payment.validatedAt
            },
            subscription: {
                id: result.subscription.id,
                startAt: result.subscription.startAt,
                endAt: result.subscription.endAt
            }
        });
    }
    catch (err) {
        console.error('Error validating payment:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal error' }
        });
    }
});
// PUT /manual-payments/:id/reject - Rejeter un paiement (ADMIN ONLY)
exports.manualPaymentsRouter.put('/:id/reject', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Admin access required' }
        });
    }
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        const payment = await prisma.payment.findUnique({
            where: { id }
        });
        if (!payment) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Payment not found' }
            });
        }
        if (payment.status !== 'PENDING') {
            return res.status(400).json({
                error: { code: 'INVALID_STATUS', message: 'Payment is not pending' }
            });
        }
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: 'FAILED',
                adminNotes,
                validatedBy: req.userId,
                validatedAt: new Date()
            }
        });
        console.log('❌ Payment rejected:', id);
        return res.json({
            message: 'Payment rejected',
            payment: {
                id: updatedPayment.id,
                status: updatedPayment.status,
                adminNotes: updatedPayment.adminNotes,
                validatedAt: updatedPayment.validatedAt
            }
        });
    }
    catch (err) {
        console.error('Error rejecting payment:', err);
        return res.status(500).json({
            error: { code: 'SERVER_ERROR', message: 'Internal error' }
        });
    }
});
exports.default = exports.manualPaymentsRouter;
//# sourceMappingURL=manual-payments.js.map