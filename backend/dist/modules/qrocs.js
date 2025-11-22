"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Validation schemas
const createQrocSchema = zod_1.z.object({
    subjectId: zod_1.z.string(),
    question: zod_1.z.string().min(3, 'La question doit contenir au moins 3 caractères'),
    answer: zod_1.z.string().min(1, 'La réponse est requise'),
    category: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
const updateQrocSchema = zod_1.z.object({
    subjectId: zod_1.z.string().optional(),
    question: zod_1.z.string().min(3).optional(),
    answer: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
// GET /api/qrocs/subject/:subjectId - Get all QROCs for a subject
router.get('/subject/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const qrocs = await prisma.qroc.findMany({
            where: { subjectId },
            orderBy: { orderIndex: 'asc' }
        });
        res.json({
            success: true,
            qrocs
        });
    }
    catch (error) {
        console.error('Error fetching QROCs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des QROCs'
        });
    }
});
// GET /api/qrocs/subject/:subjectId/count - Get QROC count for a subject
router.get('/subject/:subjectId/count', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const count = await prisma.qroc.count({
            where: { subjectId }
        });
        res.json({
            success: true,
            count
        });
    }
    catch (error) {
        console.error('Error counting QROCs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du comptage des QROCs'
        });
    }
});
// GET /api/qrocs/:id - Get a specific QROC
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const qroc = await prisma.qroc.findUnique({
            where: { id },
            include: {
                subject: {
                    select: {
                        id: true,
                        title: true,
                        semester: true
                    }
                }
            }
        });
        if (!qroc) {
            return res.status(404).json({
                success: false,
                error: 'QROC non trouvé'
            });
        }
        res.json({
            success: true,
            qroc
        });
    }
    catch (error) {
        console.error('Error fetching QROC:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du QROC'
        });
    }
});
// POST /api/qrocs - Create a new QROC (Admin only)
router.post('/', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const validatedData = createQrocSchema.parse(req.body);
        const qroc = await prisma.qroc.create({
            data: {
                subjectId: validatedData.subjectId,
                question: validatedData.question,
                answer: validatedData.answer,
                category: validatedData.category,
                orderIndex: validatedData.orderIndex ?? 0
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        title: true,
                        semester: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'QROC ajouté avec succès',
            qroc
        });
    }
    catch (error) {
        console.error('Error creating QROC:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: error.issues
            });
        }
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du QROC'
        });
    }
});
// PUT /api/qrocs/:id - Update a QROC (Admin only)
router.put('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateQrocSchema.parse(req.body);
        // Check if QROC exists
        const existingQroc = await prisma.qroc.findUnique({
            where: { id }
        });
        if (!existingQroc) {
            return res.status(404).json({
                success: false,
                error: 'QROC non trouvé'
            });
        }
        const updatedQroc = await prisma.qroc.update({
            where: { id },
            data: validatedData,
            include: {
                subject: {
                    select: {
                        id: true,
                        title: true,
                        semester: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: 'QROC mis à jour avec succès',
            qroc: updatedQroc
        });
    }
    catch (error) {
        console.error('Error updating QROC:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: error.issues
            });
        }
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du QROC'
        });
    }
});
// DELETE /api/qrocs/:id - Delete a QROC (Admin only)
router.delete('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if QROC exists
        const existingQroc = await prisma.qroc.findUnique({
            where: { id }
        });
        if (!existingQroc) {
            return res.status(404).json({
                success: false,
                error: 'QROC non trouvé'
            });
        }
        await prisma.qroc.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'QROC supprimé avec succès'
        });
    }
    catch (error) {
        console.error('Error deleting QROC:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du QROC'
        });
    }
});
exports.default = router;
//# sourceMappingURL=qrocs.js.map